# msgflow 代码质量修复设计文档

> 目标：修复评审发现的必须修问题（Python 6 个 + TS 5 个），不改变业务逻辑。

## 优先级排序

1. **安全问题**（TS: 密码 hash、timing attack）
2. **类型安全**（Python: Protocol 定义；TS: 消除 any）
3. **代码质量**（Python: tempfile、传参修复、功能补全）

---

## Phase 1: TS 安全修复

### 1.1 auth-service.ts — 密码哈希加 salt（PBKDF2）

**文件**: `worker-v2/src/services/auth-service.ts`

**问题**: 纯 SHA-256 无 salt，容易被彩虹表攻击。

**修复**: 改用 PBKDF2 + 随机 salt。保持向后兼容（检测旧格式自动迁移）。

在 `AuthService` class 内部：删除现有 `hashPassword` 方法，新增以下方法：

```typescript
/** Hash password with PBKDF2 + random salt. Format: salt:hash (hex) */
async hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await this.deriveKey(password, salt);
  const saltHex = this.toHex(salt);
  const hashHex = this.toHex(new Uint8Array(key));
  return `${saltHex}:${hashHex}`;
}

/** Verify password against stored hash. Supports legacy SHA-256 (auto-migrate). */
async verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.includes(":")) {
    // Legacy SHA-256 format — compare and return (caller should re-hash and save)
    const legacyHash = await this.legacySha256(password);
    return legacyHash === storedHash;
  }
  const [saltHex, expectedHash] = storedHash.split(":");
  const salt = this.fromHex(saltHex);
  const key = await this.deriveKey(password, salt);
  const actualHash = this.toHex(new Uint8Array(key));
  return actualHash === expectedHash;
}

private async deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
}

private async legacySha256(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return this.toHex(new Uint8Array(buf));
}

private toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

private fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}
```

修改 `login` 方法：
```typescript
async login(password: string): Promise<string | null> {
  const config = await this.configRepo.getAuthConfig();
  const valid = await this.verifyPassword(password, config.password_hash);
  if (!valid) return null;

  // Auto-migrate legacy hash to PBKDF2
  if (!config.password_hash.includes(":")) {
    const newHash = await this.hashPassword(password);
    await this.configRepo.setAuthConfig({ ...config, password_hash: newHash });
  }

  const token = crypto.randomUUID();
  const expires = Date.now() + DEFAULTS.SESSION_TTL_MS;
  await this.configRepo.setSession(token, { email: "admin", expires });
  return token;
}
```

### 1.2 api-callback.ts — timing-safe secret 比较

**文件**: `worker-v2/src/handlers/api-callback.ts`

**问题**: `body.secret !== expectedSecret` 有时序攻击风险。

**修复**: Cloudflare Workers 没有 `crypto.subtle.timingSafeEqual`（那是 Node.js API），需要手动实现常量时间比较。

在文件顶部新增工具函数：
```typescript
/** Constant-time string comparison to prevent timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.byteLength !== bufB.byteLength) return false;
  let result = 0;
  for (let i = 0; i < bufA.byteLength; i++) result |= bufA[i] ^ bufB[i];
  return result === 0;
}
```

替换 secret 验证逻辑：
```typescript
// 替换这行：
if (expectedSecret && body.secret !== expectedSecret) {
  throw new ValidationError("Invalid callback secret");
}

// 改为：
if (expectedSecret && !timingSafeEqual(expectedSecret, body.secret ?? "")) {
  throw new ValidationError("Invalid callback secret");
}
```

### 1.3 api-note.ts — 硬编码移至 KV

**文件**: `worker-v2/src/handlers/api-note.ts`

**问题**: `AI_API_BASE` 和 `AI_MODEL` 硬编码。

**修复**:

1. 删除文件顶部这两行常量：
```typescript
const AI_API_BASE = "https://fast.sbbbbbbbbb.xyz/v1";
const AI_MODEL = "gpt-5.4";
```

2. 修改 `translateMarkdown` 函数签名，新增 `apiBase` 和 `model` 参数：
```typescript
async function translateMarkdown(content: string, lang: string, apiKey: string, apiBase: string, model: string): Promise<string> {
```

函数内部将原来引用 `AI_API_BASE` 的地方改为 `apiBase`，`AI_MODEL` 改为 `model`。

3. 在 handler 函数（`apiNotePublish`）中，调用 `translateMarkdown` 之前从 KV 读取配置：
```typescript
const apiKey = await env.KV.get("note:api_key") || "";
const apiBase = await env.KV.get("note:ai_api_base") || "https://api.openai.com/v1";
const model = await env.KV.get("note:ai_model") || "gpt-4o-mini";

const translated = await translateMarkdown(body.content, lang, apiKey, apiBase, model);
```

### 1.4 webhook-feishu.ts — 定义 payload 类型

**文件**: `worker-v2/src/handlers/webhook-feishu.ts`

**问题**: `body` 类型为 `Record<string, unknown>`。

**修复**: 定义接口：

```typescript
interface FeishuWebhookPayload {
  type?: string;
  challenge?: string;
  header?: {
    token?: string;
    event_id?: string;
    event_type?: string;
  };
  event?: {
    message?: {
      chat_id?: string;
      content?: string;
      message_type?: string;
    };
    sender?: {
      sender_id?: { open_id?: string };
    };
  };
}

// 替换：
const body = await request.json() as Record<string, unknown>;
// 改为：
const body = await request.json<FeishuWebhookPayload>();
```

然后移除所有 `as` 类型断言，直接用可选链访问。

### 1.5 index.ts — 消除 any + waitUntil

**文件**: `worker-v2/src/index.ts`

**修复 1**: 定义飞书 API 响应类型：
```typescript
interface FeishuTokenResponse {
  app_access_token?: string;
  code?: number;
  msg?: string;
}

interface FeishuRefreshResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown>;
}
```

替换 `json<any>()` 为 `json<FeishuTokenResponse>()` 和 `json<FeishuRefreshResponse>()`。

**修复 2**: `catch (e: any)` → `catch (e: unknown)`，用 `e instanceof Error ? e.message : "unknown"` 取 message。

**修复 3**: 用 `ctx.waitUntil()` 包裹 scheduled 逻辑。将 token 刷新逻辑提取为独立函数：

```typescript
// 在文件底部新增独立函数：
async function refreshFeishuToken(env: Env): Promise<void> {
  // 将现有 scheduled() 中 try { ... } 的内容移到这里
}

// scheduled handler 改为：
async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
  ctx.waitUntil(refreshFeishuToken(env));
}
```

---

## Phase 2: Python 类型安全

### 2.1 lib/registry.py — 泛型 Registry + Protocol 定义

**文件**: `python/src/lib/registry.py`

完全替换为泛型版本：

```python
"""Typed registry for fetchers/writers/pipelines."""
from __future__ import annotations

from typing import TypeVar, Generic, Callable

T = TypeVar("T")


class Registry(Generic[T]):
    """A typed registry that stores instances by name."""

    def __init__(self, kind: str) -> None:
        self._kind = kind
        self._items: dict[str, T] = {}
        self._ordered: list[T] = []

    def register(self, cls: type) -> type:
        """Decorator to register a class."""
        instance = cls()
        name = getattr(instance, "name", cls.__name__)
        self._items[name] = instance
        self._ordered.append(instance)
        return cls

    def get(self, name: str) -> T | None:
        return self._items.get(name)

    def find(self, predicate: Callable[[T], bool]) -> T | None:
        for item in self._ordered:
            if predicate(item):
                return item
        return None
```

**新建** `python/src/lib/protocols.py`：

```python
"""Protocol definitions for fetchers, pipelines, publishers."""
from __future__ import annotations

from typing import Protocol

from pycore import Result


class Fetcher(Protocol):
    name: str

    def can_handle(self, url: str) -> bool: ...
    def fetch(self, url: str) -> str | None: ...


class Pipeline(Protocol):
    name: str

    def execute(self, target: str, **kwargs: object) -> Result: ...


class Publisher(Protocol):
    name: str

    def publish(self, title: str, content: str, metadata: dict | None = None) -> bool: ...
```

更新 `fetchers/__init__.py`、`pipelines/__init__.py`、`writers/__init__.py` 的 Registry 类型标注：
```python
from lib.registry import Registry
from lib.protocols import Fetcher

fetchers: Registry[Fetcher] = Registry("fetcher")
```

### 2.2 pipelines — 无需额外改动

Pipeline 类已经符合 `Pipeline` Protocol（有 `name` 和 `execute`），Registry 泛型化后自动获得类型检查。

---

## Phase 3: Python 代码质量

### 3.1 writers/__init__.py — 修复传参类型

**文件**: `python/src/writers/__init__.py`

**问题**: `publish()` 把 `**kwargs` 作为 dict 传给 `pub.publish(title, content, kwargs)`，但 `MowenPublisher.publish` 期望 `metadata: dict | None`。

**修复**: 显式传 metadata：

```python
def publish(name: str, title: str, content: str, **kwargs: object) -> bool:
    """Publish to a named publisher. Returns success."""
    pub = publishers.get(name)
    if not pub:
        return False
    metadata = dict(kwargs) if kwargs else None
    return pub.publish(title, content, metadata)
```

### 3.2 writers/mowen.py — 替换 tempfile.mktemp

**文件**: `python/src/writers/mowen.py`

**问题**: `tempfile.mktemp()` 已废弃且有 TOCTOU 安全风险。

**修复**: 用 `NamedTemporaryFile`：

```python
import tempfile

# 替换：
tmp = Path(tempfile.mktemp(suffix=".md"))
tmp.write_text(content, encoding="utf-8")

# 改为：
with tempfile.NamedTemporaryFile(mode="w", suffix=".md", encoding="utf-8", delete=False) as f:
    f.write(content)
    tmp = Path(f.name)
```

`finally` 中的 `tmp.unlink(missing_ok=True)` 保持不变。

### 3.3 writers/feishu.py — 标注功能不完整（本次不修）

**文件**: `python/src/writers/feishu.py`

**问题**: `publish()` 只创建了文档（设置 title），没有写入 content。

**本次不修**：飞书 docx block API 的调用方式需要查阅官方文档验证（创建 block 的路径是 `POST /docx/v1/documents/{document_id}/blocks/{block_id}/children`，根 block_id = document_id，且 block 格式有严格约束）。未经验证的 API 调用会导致运行时失败。

**处理**：在文件中添加 TODO 注释标注：
```python
# TODO: 当前只创建文档标题，未写入正文内容。
# 需要调用 POST /docx/v1/documents/{doc_id}/blocks/{doc_id}/children 写入 block。
# 参考：https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block-children/create
```

---

## Phase 4: 验证

### TS 验证

```bash
cd /home/administrator/workspace/open-source/msgflow/worker-v2
npx tsc --noEmit
npx vitest run
```

### Python 验证

```bash
cd /home/administrator/workspace/open-source/msgflow/python
uv run pytest tests/ -v
```

---

## 执行顺序

```
Step 1: Phase 1.1 — auth-service.ts PBKDF2
Step 2: Phase 1.2 — api-callback.ts timing-safe
Step 3: Phase 1.3 — api-note.ts 移除硬编码
Step 4: Phase 1.4 — webhook-feishu.ts 类型定义
Step 5: Phase 1.5 — index.ts 消除 any + waitUntil
Step 6: TS 验证（tsc + vitest）
Step 7: Phase 2.1 — lib/registry.py 泛型化 + protocols.py
Step 8: Phase 3.1 — writers/__init__.py 传参修复
Step 9: Phase 3.2 — writers/mowen.py tempfile 修复
Step 10: Phase 3.3 — writers/feishu.py 添加 TODO 注释
Step 11: Python 验证（pytest）
```

---

## 重要约束

1. **不改变业务逻辑** — 只修类型安全、安全漏洞、代码规范
2. **向后兼容** — 密码 hash 迁移支持旧格式自动升级
3. **fetchers/feishu.py 的 God Object 拆分不在本次范围** — 那是架构重构，需要单独设计
4. **不动 fetchers/feishu.py 的异常处理** — 裸 except 问题需要理解每个 catch 点的业务意图，本次只修明确的类型和安全问题

---

## 文件变更清单

### 修改

- `worker-v2/src/services/auth-service.ts`（PBKDF2 + verifyPassword）
- `worker-v2/src/handlers/api-callback.ts`（timingSafeEqual 手动实现）
- `worker-v2/src/handlers/api-note.ts`（KV 配置替代硬编码）
- `worker-v2/src/handlers/webhook-feishu.ts`（payload 类型定义）
- `worker-v2/src/index.ts`（消除 any + waitUntil + 独立函数）
- `python/src/lib/registry.py`（泛型化）
- `python/src/writers/__init__.py`（传参修复）
- `python/src/writers/mowen.py`（tempfile 修复）
- `python/src/writers/feishu.py`（添加 TODO 注释）
- `python/src/fetchers/__init__.py`（Registry 类型标注）
- `python/src/pipelines/__init__.py`（Registry 类型标注）

### 新建

- `python/src/lib/protocols.py`（Protocol 定义）
