# msgflow pycore 复用优化分析

## 当前复用情况

| pycore 组件 | 是否使用 | 说明 |
|---|---|---|
| `logger` | ✅ 已用 | 所有模块 |
| `env` / `require_env` | ✅ 已用 | feishu fetcher |
| `http.get` / `http.post` | ✅ 已用 | jina、feishu |
| `Result` / `output_result` | ✅ 已用 | pipelines + CLI |
| `Registry` | ❌ 本地重复 | `lib/registry.py` 和 pycore 的一样 |
| `retry` | ❌ 未用 | |
| `notify` | ❌ 未用 | |
| `constants` | ❌ 未用 | |
| `errors` | ❌ 未用 | |
| `concurrent` | ❌ 未用 | |

## 逐项分析：是否有必要用

### 1. Registry — ✅ 应该用

**现状**：`lib/registry.py` 是 pycore `Registry` 的简化复制品。
**建议**：删掉本地版本，直接 `from pycore import Registry`。
**理由**：消除重复代码，pycore 版本有更完整的 API（`__contains__`、`__len__`）。
**工作量**：改 3 个 import 路径。

### 2. retry — ⚠️ 可选

**现状**：HTTP 请求失败直接返回 None，没有重试。
**分析**：
- Jina fetcher：偶尔 403/超时，重试可能有用
- 飞书 API：一般不会临时失败，重试意义不大
- 图片下载：可能因网络波动失败，重试有价值

**建议**：暂不加。pycore.http 本身已有 `retries` 参数，需要时传 `retries=2` 即可，不需要 `@retry` 装饰器。
**结论**：**不急，按需使用 http 的 retries 参数就够了。**

### 3. notify — ✅ 应该用

**现状**：任务执行完没有通知，结果只写到 `/tmp/result.txt`，靠 Worker callback 回传。
**分析**：
- GitHub Actions 里：Worker callback 已经会通知用户（Telegram/飞书），Python 端不需要重复通知
- 本地跑时：结果直接打印到 stdout，也不需要通知

**建议**：暂不加。通知由 Worker callback 层负责，Python 端只负责执行和输出结果。
**结论**：**不需要。职责分离——Python 产出结果，Worker 负责通知。**

### 4. constants — ⚠️ 可选

**现状**：没有集中定义常量，超时值等散落在各处。
**分析**：
- `DEFAULT_TIMEOUT = 30` — 各 fetcher 都硬编码了 30
- `MAX_WORKERS_DEFAULT = 5` — 未来并行下载可能用到

**建议**：暂不引入。当前代码量小，硬编码的 30 秒超时清晰可读，抽成常量反而增加间接性。
**结论**：**不急。等代码量增长、同一个值出现 3 次以上再抽。**

### 5. errors — ⚠️ 可选

**现状**：用 `Result.fail("错误信息")` 返回错误，没有抛异常。
**分析**：
- Pipeline 模式下，`Result.fail()` 比异常更合适——调用方不需要 try/catch
- 异常适合"不可恢复的错误"（配置缺失、认证失败），这些场景已经用 `require_env` 处理了
- 如果引入异常，每个 pipeline 都要加 try/catch 包装，增加样板代码

**建议**：保持现状。`Result.fail()` 是 pipeline 模式的最佳实践。
**结论**：**不需要改。Result 模式比异常更适合 pipeline 编排。**

### 6. concurrent — ✅ 值得用

**现状**：飞书图片下载是串行的（26 张图片逐个下载，耗时 ~30 秒）。
**分析**：
- 图片下载是 IO 密集型，并行可以显著提速（5 并发 → ~6 秒）
- `run_batch` 正好适合这个场景

**建议**：飞书图片下载改用 `run_batch`。
**工作量**：改 feishu.py 的 `_blocks_to_markdown` 中图片处理逻辑。
**结论**：**应该做，体验提升明显。**

---

## 优化计划

| 优先级 | 项 | 理由 |
|--------|---|------|
| P0 | 删 `lib/registry.py`，用 `pycore.Registry` | 消除重复 |
| P1 | 图片下载并行化（`run_batch`） | 性能提升 5x |
| P2 | HTTP 请求加 `retries=2` | 提高稳定性 |
| — | notify | 不需要（Worker 层负责） |
| — | errors | 不需要（Result 模式更合适） |
| — | constants | 不急（代码量小） |
