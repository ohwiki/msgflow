-- CatReader 222 源种子（幂等：xml_url 冲突忽略）
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml', 'Anthropic News', 'AI 实验室', '- 追踪 Anthropic 公司动态与 Claude 产品最新进展的官方资讯频道。
- **产品更新**：新模型发布与功能特性介绍；**行业应用**：Claude 在政府、金融、医疗等受监管领域的落地案例；**AI 安全与政策**：模型安全防护进展及监管动态。
- 适合关注 AI 行业动态、大模型产品发展及 Anthropic 生态的读者订阅。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_engineering.xml', 'Anthropic Engineering', 'AI 实验室', '- 1 句总体定位
- 2 到 3 个主要关注方向
- 1 句适合什么读者

Anthropic 工程团队分享内部技术实践的博客。主要关注代理系统的规模化架构与安全隔离、AI 能力评估的方法论与挑战，以及 Claude Code 产品的工程细节与开发体验优化。适合 AI 系统工程师、ML 平台工程师及关注前沿 AI 产品开发的技术人员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_research.xml', 'Anthropic Research', 'AI 实验室', 'Anthropic官方研究博客，发布AI安全、能力评估与负责任AI发展的最新研究。

主要关注方向：
- **AI安全与红队研究**：探索大语言模型在网络安全、漏洞利用等方面的风险与防御
- **AI经济学研究**：追踪Claude使用模式与AI对劳动市场的影响
- **AI可解释性与科学应用**：研究模型行为解释及在生物学、化学等领域的应用

适合关注AI安全风险负责任AI发展的研究人员、工程师和政策制定者阅读。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_red.xml', 'Anthropic Frontier Red Team', 'AI 实验室', '## Anthropic Frontier Red Team 栏目介绍

**定位**：Anthropic 红队团队分享 AI 在网络安全领域的前沿研究与实践。

**主要关注方向**：

- AI/LLM 漏洞发现能力评估，包括 0-day 挖掘和 N-day 利用
- Claude 模型网络安全能力的技术测试与分析
- AI 在网络攻防中的实际应用，如智能合约漏洞利用和关键基础设施防御

**适合读者**：安全研究员、漏洞研究者、AI 安全从业者，以及对 AI 网络安全能力边界感兴趣的技术人员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_claude.xml', 'Claude Blog', 'AI 实验室', 'Claude 官方技术博客，发布产品更新、功能教程和最佳实践。主要关注三大方向：1) Claude Code、Fable、Loops 等产品新功能介绍；2) 企业级部署方案，覆盖 AWS、Azure、Google Cloud、Microsoft Foundry 等主流云平台；3) 安全治理与权限管理，包括消费控制、身份认证和 MCP 授权管理。适合正在使用或计划部署 Claude 的开发者、DevOps 工程师和企业 IT 管理人员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://openai.com/blog/rss.xml', 'OpenAI Research', 'AI 实验室', '**栏目定位：**
OpenAI官方博客，收录公司最新研究成果、产品动态与技术洞见。

**主要关注方向：**
- AI模型与产品更新（GPT系列、ChatGPT采用数据、新基准测试）
- AI基础设施与硬件（推理芯片、合作项目、企业部署）
- AI应用与影响研究（劳动力变革、科学研究案例、安全标准）

**适合读者：**
关注AI前沿进展、研究应用与行业动态的技术从业者、研究者及AI爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_xainews.xml', 'xAI News', 'AI 实验室', '- xAI News 是由 xAI 团队官方维护的资讯频道，发布 Grok 助手的产品更新、使用教程和公司动态。

- **Grok 功能与使用**：覆盖 Grok 在网页、iOS、Android 及终端的集成，包括 SuperGrok 订阅权益、插件生态和第三方接入指南。  
- **API 与开发者工具**：语音合成、语音识别、图像生成、代码代理等 API 的发布与更新。  
- **公司与合作**：xAI 战略动态，如收购进展、与 SpaceX 和 Anthropic 的算力合作。

- 适合关注 Grok 使用体验、AI 工具开发和 xAI 生态进展的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://deepmind.google/blog/rss.xml', 'Google DeepMind Blog', 'AI 实验室', 'Google DeepMind Blog 是 Google 旗下 AI 研究团队 DeepMind 的官方博客，发布研究成果、产品更新及行业合作动态。

主要关注方向：
- AI 前沿研究与模型发布（Gemma、Gemini 系列新模型及功能）
- AI 安全与负责任 AI（安全研究、多代理系统）
- AI 应用与社会影响（教育、机器人、环境、语言翻译等）

适合 AI 研究人员、开发者，以及关注人工智能发展趋势的科技爱好者订阅。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_google_ai.xml', 'Google Developers Blog - AI', 'AI 实验室', '**栏目介绍**

Google AI 开发者官方博客，聚焦前沿 AI 开发技术与实践。关注方向包括：TPU 训练基础设施与分布式训练优化、AI 代理开发框架（ADK、Genkit、A2A 协议等）以及 Cloud AI 开发者工具与工作流。适合使用 Google Cloud AI 技术栈的开发者与 AI 应用构建者订阅。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://cloudblog.withgoogle.com/products/data-analytics/rss', 'Google DataAnalytics Blog', 'AI 实验室', 'Google Cloud 官方数据分析博客，聚焦 BigQuery、Looker 等数据分析产品的最新功能与最佳实践，探讨 AI 代理（Agentic AI）在数据分析场景中的落地应用，并分享企业级数据处理性能优化与行业解决方案。

- BigQuery 新功能与产品更新
- AI 代理驱动的数据分析工作流
- 企业级数据架构与性能优化实践

适合数据工程师、数据分析师、BI 从业人员，以及希望了解 Google Cloud 数据分析生态的技术人员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://cloudblog.withgoogle.com/rss', 'Google Cloud Blog', 'AI 实验室', '**栏目定位**

Google Cloud 官方技术博客，发布产品更新、安全行动、合作伙伴集成及行业研究报告。

**主要关注方向**

1. **云安全与威胁情报**：打击恶意网络行动、威胁检测、DPIA 合规
2. **AI 原生数据库与推理优化**：AlloyDB、LLM 推理扩展、向量搜索
3. **数据分析与智能代理**：BigQuery 对话式分析、MCP 服务器生态、Gartner 报告

**适合读者**

企业 IT 决策者、DevOps 工程师、安全专家及云原生开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_cursor.xml', 'Cursor Blog', 'AI 实验室', '## Cursor Blog 栏目介绍

Cursor 是由 AI 驱动的新一代代码编辑器，Cursor Blog 记录其产品更新与行业实践。

**主要关注方向：**

- **产品功能**：Cursor iOS 应用、Design Mode 视觉提示、Auto-review 代理审查、Bugbot 等新能力介绍
- **企业应用**：Coinbase、Wayfair、Notion 等企业落地案例，展示 AI 如何提升开发效率与降低成本
- **技术深度**：AI 编程中的 Reward Hacking、模型智能评估等工程难题的探讨

**适合读者：**

对 AI 编程工具感兴趣的技术管理者与开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_windsurf_blog.xml', 'Windsurf Blog', 'AI 实验室', '- Windsurf 是由 Codeium 推出的 AI 代码助手，官方博客发布产品更新、新功能介绍及 AI 模型集成动态。

- **产品功能更新**：代码审查、Agent 命令中心、模型路由等新特性发布
- **AI 模型集成**：GPT、Claude、Gemini、GLM 等前沿大模型的接入与定价
- **开发者工具**：Arena 竞技场、排行榜、定价计划等生态功能

- 适合使用或关注 Windsurf 的开发者，以及对 AI 编程工具更新感兴趣的技术人员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_windsurf_changelog.xml', 'Windsurf Changelog', 'AI 实验室', '## 栏目介绍

追踪 Windsurf IDE 更新动态的官方日志，专注呈现版本迭代与功能演进。

**主要关注方向：**

- **Devin AI 集成进展**：包括 Devin Review、Devin Local、Devin for Terminal 等 AI agent 功能的发布与优化
- **IDE 稳定性与性能**：集中修复认证问题、终端处理、OAuth 集成等核心功能的 bug 与改进
- **模型与订阅体验**：自适应模型路由器更新、订阅功能调整等

**适合读者：** 使用 Windsurf 进行 AI 辅助编程的开发者，关注 AI IDE 功能迭代的技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_ollama.xml', 'Ollama Blog', 'AI 实验室', 'Ollama 官方博客，聚焦本地运行大模型的技术更新与最佳实践。

**主要关注方向：**

1. **性能优化** — Apple Silicon (MLX) 与 GGUF 的最新性能提升
2. **开发者工具** — Claude Code、OpenClaw 等本地编码 Agent 的集成与玩法
3. **模型与功能** — 新模型发布及图像生成等实验性特性

**适合读者：** 关注本地 AI 部署、追求隐私优先或希望在自己的设备上运行和调优大模型的开发者与爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://supabase.com/rss.xml', 'Supabase Blog', 'AI 实验室', 'Supabase 官方博客，发布平台产品更新、开源项目进展及公司重要新闻。

主要关注方向：

- **产品与功能**：数据库分支、无服务器认证、实时订阅与数据管道等核心能力更新
- **开源生态**：Multigres 横向扩展方案、Postgres 相关开源项目及行业排名
- **AI 与安全**：AI 编程集成、供应链安全实践及 ISO 27001 合规认证

适合使用 Supabase 构建应用或关注开源数据库生态的开发者阅读。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_the_batch.xml', 'The Batch by DeepLearning.AI', 'AI 实验室', '**栏目介绍**

The Batch 由吴恩达（Andrew Ng）主编的周更 AI 资讯 newsletter，每期梳理当周最重要的 AI 动态，并附上深度洞察与思考。

**主要关注方向：**

- **前沿模型与评测**：跟踪 GPT-5.5、Gemini、GLM、Kimi 等最新模型的性能表现与行业影响
- **AI Agents 与应用落地**：关注 AI 代理在编程、医疗、机器人等领域的实际应用
- **行业趋势与政策**：涵盖企业战略调整、监管动向、人才培养及 AI 对社会的影响

**适合读者**：适合 AI 从业者、研究者和希望快速把握 AI 行业脉搏的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_blogsurgeai.xml', 'Surge AI Blog', 'AI 实验室', '**Surge AI Blog** 聚焦 AI 模型与代理的真实能力评估，分享前沿基准测试研究与专业人类评估方法。

主要关注：① **AI 基准评测**——从数学、写作到企业文档，解读模型在真实任务中的表现边界；② **AI 代理能力**——在复杂环境中测试规划、工具使用和适应性；③ **人类评估价值**——探讨为何专业评分员在 AI 发展中不可替代。

适合关注 AI 模型实际能力、重视严谨评估方法的开发者与研究人员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_thinkingmachines.xml', 'Thinking Machines Lab', 'AI 实验室', 'Thinking Machines Lab 是由 OpenAI 联合创始人 John Schulman 创立的 AI 研究实验室，专注于大模型训练、优化与人机协作的前沿技术。

**主要关注方向：**
- 大模型训练优化：包括模型蒸馏、LoRA 低秩适应等高效微调技术
- LLM 推理系统：研究推理过程中的非确定性问题和工程实践
- 人机协作范式：探索可扩展的人-AI 交互模型与工作流设计

**适合读者：** 对大语言模型训练优化、推理系统设计及 AI 前沿研究感兴趣的研究人员和工程师。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_paulgraham.xml', 'Paul Graham', 'AI 实验室', 'Paul Graham 是 YC 创始人、程序员兼思想者，文章以独特视角剖析创业、技术与社会现象。

**主要关注方向：**

1. **创业与财富创造**：分享如何获得巨额财富、创办 Google、保持创始人状态等实操智慧
2. **社会文化洞察**：分析品牌时代特征、唤醒文化的起源等社会现象背后的逻辑
3. **写作与思维方法**：探讨什么是好文章、如何思考等元认知话题

**适合读者**：创业者、技术从业者，以及喜欢深度思考社会与个人成长的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://hamel.dev/index.xml', 'Hamel Husain', 'AI 实验室', 'Hamel Husain 是一位 AI 实践者与教育者，专注于 AI 产品的评估、开发与优化。他的写作强调实战经验，而非理论空谈。

**主要关注方向**：LLM 应用评估（Evals）的工具选型、方法论与最佳实践；RAG、编码代理等 AI 技术的实战避坑指南；AI 工程师的技能成长与职业洞察。

**适合读者**：正在构建或优化 AI 产品的工程师与产品经理，以及希望系统提升 AI 应用开发能力的学习者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/karpathy', 'Andrej Karpathy', 'AI Voices', '**Andrej Karpathy 的订阅源**主要分享这位知名 AI 研究者对大语言模型、深度学习前沿进展的观察与思考，兼及航天、生物医药等跨领域科技动态。内容既有对 Anthropic、Claude 等 AI 产品的深度点评，也常转发他感兴趣的研究论文或行业新闻，并穿插个人职业近况与实用建议。

**主要关注方向：**
- 大语言模型与 AI 产品进展
- 深度学习研究动态
- 前沿科技（航天、新药研发等）

**适合读者：** 对 AI 技术、深度学习感兴趣的研究者、工程师及科技爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/sama', 'Sam Altman', 'AI Voices', '**栏目定位：**
追踪OpenAI CEO Sam Altman的近况与观点，了解AI行业一手动态。

**主要关注方向：**
- OpenAI产品更新（GPT系列模型、Sol等新模型发布）
- AI技术进展（推理能力、性能提升、安全研究）
- AI行业生态（合作伙伴、团队动态、偶尔的日常生活）

**适合读者：**
关注AI行业动态、对OpenAI产品和技术感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/bcherny', 'CC 创始人', 'AI Voices', '**栏目介绍**

这是 Claude Code 创始人的个人订阅源，主要分享 Claude Code 背后的故事、产品更新以及 AI 编程工具的最新进展。

主要关注方向：
- Claude Code 新功能发布与使用技巧
- AI 辅助编程的工作实践与经验
- 软件开发行业的趋势与思考

适合正在使用或关注 Claude Code 的开发者、对 AI 编程工具感兴趣的技术人员，以及希望了解 AI 如何改变软件开发方式的人群。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/AndrewYNg', 'Andrew Ng', 'AI Voices', '## 栏目介绍

吴恩达（Andrew Ng）的人工智能教育与行业观察订阅源。主要关注AI大模型与transformer的技术实践、课程学习资源，以及AI行业趋势与政策动态。适合想入门或进阶AI/ML技术、关注行业动态的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/lexfridman', 'Lex Fridman', 'AI Voices', 'Lex Fridman 是著名的人工智能研究者、播客主持人，其节目以深度对话闻名。

**主要关注方向：**

- **AI 与技术前沿**：作为 MIT 研究者，节目常探讨人工智能、机器学习、深度学习的技术发展与未来影响
- **科学探索**：对话涉及宇宙学、物理学、天体物理等前沿科学议题
- **科技人物与领袖**：采访 Elon Musk、Jensen Huang 等科技界重要人物

**适合读者：**

对人工智能、科技趋势、科学探索感兴趣的听众，尤其是喜欢收听长深度对话的科技爱好者和专业人士。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/joshm', 'Josh Miller', 'AI Voices', 'Josh Miller 是 Browser Company 联合创始人兼 CEO，主导开发新一代浏览器 Dia（Arc 的继承者）。本订阅源聚焦 Dia 浏览器产品更新、AI 功能探索、团队招聘与技术动态，同时分享对软件体验和行业趋势的观点。适合关注浏览器产品设计、AI 驱动软件体验，以及 Browser Company 生态的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/OpenAI', 'OpenAI', 'AI Voices', '**栏目定位：** 追踪 OpenAI 最新模型发布、技术突破与安全进展的官方信息源。

**主要关注方向：**
1. **模型迭代** — GPT-5 系列新版本（Sol/Terra/Luna）及能力提升
2. **安全与责任** — 模型安全防护体系与负责任 AI 进展
3. **开发者生态** — DevDay 活动及 AI 芯片、工具更新

**适合读者：** AI 研究者、开发者及关注前沿人工智能技术进展的用户。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/GoogleAI', 'Google AI', 'AI Voices', '- 1 句总体定位
Google AI 官方频道，聚焦 Gemini 系列模型及 Google AI 产品的最新动态与技术进展。

- 2 到 3 个主要关注方向
1. Gemini 模型更新：包括翻译、推理、Agent 能力等新版本发布与功能升级
2. 生成式 AI 创作工具：图像生成、动画、语音合成等创意工作流应用
3. AI 前沿技术与产品发布：从模型架构分享到 I/O 大会上的 Demo 展示

- 1 句适合什么读者
关注 Google AI 产品生态、对 Gemini 系列及生成式 AI 工具有兴趣的开发者、研究者和科技爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/googleaidevs', 'Google AI Developers', 'AI Voices', '**栏目定位：** Google AI 官方开发者频道，聚焦 Gemini 模型更新、AI 开发工具与平台最新动态。

**主要关注方向：**

- Gemini 系列模型发布与能力升级
- 开发者工具与 API 更新（如 Gemini Interactions API、Computer Use 工具）
- 技术资源与社区活动（hackathon、工作坊等）

**适合读者：** 使用 Google AI 产品进行应用开发的工程师，以及关注大模型技术进展的 AI 从业者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/deepseek_ai', 'DeepSeek', 'AI Voices', '**栏目定位：** DeepSeek 官方动态频道，专注发布 AI 大模型产品更新与技术进展。

**主要关注方向：**
- 新模型发布与 API 定价动态
- 模型架构技术创新（如稀疏注意力、长上下文优化）
- 开源模型与开发者工具发布

**适合读者：** 在项目中使用 DeepSeek 模型的开发者，以及关注大模型技术进展的 AI 从业者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/Alibaba_Qwen', 'Qwen', 'AI Voices', '- **一句总体定位**：阿里巴巴通义千问（Qwen）官方频道，聚焦AI大模型与智能体技术前沿进展。

- **主要关注方向**：
  - **Agent智能体**：Qwen-AgentWorld世界模型、Browser Agent、多模态交互智能体等前沿探索
  - **具身智能**：Qwen-Robot Suite系列（导航、操作、机器人世界模型），探索从语言到物理行动的跨越
  - **模型性能升级**：Qwen3.5/Qwen3.7系列的速度与能力突破

- **适合读者**：AI研究人员、开发者及对大模型、智能体技术感兴趣的科技爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/openclaw', 'OpenClaw', 'AI Voices', '- 1 句总体定位
OpenClaw 是一款专注于 AI Agent 的客户端工具，支持多平台使用。

- 2 到 3 个主要关注方向
产品更新与改进、移动端体验（iOS/Android 原生应用）、社区互动与播客内容。

- 1 句适合什么读者
适合关注 AI Agent 工具、移动端体验以及对 OpenClaw 产品动态感兴趣的开发者与用户。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/paulg', 'Paul Graham', 'AI Voices', 'Paul Graham 的 RSS 源汇集了他对创业投资、宏观经济的前沿思考，以及对科技与社会议题的即时评论。内容涵盖初创公司估值、融资策略等创业智慧，同时通过转发行捕捉他关注的政治与社会动态。适合创业者、投资人以及对科技思想感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/bindureddy', 'Bindu Reddy', 'AI Voices', '**栏目定位**

Bindu Reddy 是 AI 领域资深从业者与观察者，专注于分享前沿 AI 模型的实战评测、工具使用心得及行业趋势洞察。

**主要关注方向**

- **AI 编码工具评测**：深度体验 Fable、GPT、Opus 等模型在复杂编码任务中的表现差异
- **AI 行业动态**：追踪大模型迭代进展、开源 AI 发展及监管政策影响
- **AI 应用实践**：分享个人 AI 消费支出、工作流优化及多 Agent 协作经验

**适合读者**

适合对 AI 工具选型、模型评测感兴趣的开发者及 AI 行业观察者，尤其是关注前沿大模型实战表现和行业趋势的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/garrytan', 'Garry Tan', 'AI Voices', '**栏目定位**

追踪 Y Combinator CEO Garry Tan 的思考与分享，聚焦硅谷创业生态、AI 前沿进展与技术投资视角。

**主要关注方向**

- 人工智能与 GPU 算力竞争（AMD/NVIDIA）
- YC 创业生态与 founder 经验
- 硅谷科技政策争议（NIMBY、税收、科技监管等）

**适合读者**

关注科技创业、投资趋势及硅谷公共讨论的从业者与观察者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/hasantoxr', 'Hasan Toor', 'AI Voices', '**Hasan Toor** 专注于分享 AI 工具实操技巧与前沿产品动态，涵盖 AI Agent 工作流、视频创作自动化、团队协作提效等应用场景。

**主要关注方向：**

- AI Agent 与智能助手的高效使用技巧（如 Claude、ChatGPT）
- AI 视频创作工具与工作流分享（如 Zumi、az8）
- 个人效率与团队协作的 AI 化改造

**适合读者：** 对 AI 应用感兴趣、追求工作效率提升的个人创作者、独立开发者或小型团队。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/blackanger', 'Mike Tang', 'AI Voices', '**栏目定位：**

Mike Tang 的技术博客，主要分享 AI 编程工具（如 Claude Code、Fable、Codex）的实战使用心得与成本优化策略。

**主要关注方向：**

1. AI Coding Agent 工具评测与对比
2. 订阅方案与 API 成本控制
3. 开发环境（终端/编辑器）折腾

**适合读者：**

对 AI 辅助编程感兴趣、关注工具成本与效率的开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/Fenng', 'Fenng', 'AI Voices', '科技从业者的日常观察与评论，关注AI应用、技术写作、行业动态，偶有社会新闻点评。适合科技行业从业者、产品经理及对技术圈生态感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/AnthropicAI', 'Anthropic', 'AI Voices', 'Anthropic 官方频道，关注 Claude 系列模型的最新进展与 AI 行业动态。

主要关注方向：
- Claude 新品发布与功能更新
- AI 出口管制政策动向
- AI 对就业与经济影响的调查研究

适合关注 AI 前沿技术、追踪 Claude 生态，或对 AI 产业政策与经济研究感兴趣的用户。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/claudeai', 'Claude', 'AI Voices', '## Claude 订阅源介绍

**总体定位：** Anthropic 官方频道，发布 Claude AI 产品更新、技术进展和开发者生态动态。

**主要关注方向：**
- Claude 新模型发布与功能更新（如 Sonnet 5、Fable 5）
- Claude Code 开发者工具使用技巧与反馈渠道
- 开发者活动、合作伙伴项目及行业合作动态

**适合读者：** 关注 AI 助手发展、Claude 产品更新及开发者生态的工程师、产品经理和 AI 爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/cloudwu', '云风', 'AI Voices', '云风是游戏行业技术老兵的个人博客，记录程序员爸爸的日常。这里有关于两个孩子（云豆和可可）的成长点滴、攀岩抱石心得、独立项目soluna的开发进展，以及对生活琐事的随感。适合想了解技术人真实生活状态、或对攀岩/桌游/独立开发感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/sagacity', '卖桃者', 'AI Voices', '- **1句总体定位**：关注AI科技前沿与个人日常的独立观察者。

- **2到3个主要关注方向**：
  1. AI大模型与科技产品动态（OpenAI GPT、Claude、Gemini、DeepSeek等）
  2. 科技行业热点与个人生活分享（看球、拍照、数码设备）
  3. 对AI行业趋势的随感与吐槽

- **1句适合什么读者**：适合对AI行业动态感兴趣、喜欢看轻量化科技随笔的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/trq212', 'Thariq', 'AI Voices', 'Thariq 是一位 AI 工程师，专注于 AI 辅助编程工具的实践与探索。这个订阅源主要分享他在 Fable、Claude 等 AI 开发平台上的使用心得、技巧与思考，涵盖代码理解、prompt 工程及工具使用策略。

主要关注方向：

- AI 编程工具实践：Fable、Claude 等平台的深度使用经验
- AI agent 与代码协作：探讨如何与 AI 高效协作、理解 AI 生成的代码
- 前端与 HTML 技术：HTML artifacts 分析及相关开发技巧

适合关注 AI 辅助开发、想了解最新 AI 编程工具动态的工程师和产品开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://47.84.141.209:3847/feed/OpenAIDevs', 'OpenAIDevs Blog', 'AI Voices', '关注 OpenAI 开发者生态的官方博客，主要分享 Codex（AI 编程助手）的最新功能、使用技巧和社区动态。

**主要关注方向：**
- Codex 产品更新与新功能发布
- 开发者社区活动报道与线下聚会
- AI 编程最佳实践与开发经验

**适合读者：** 使用 Codex 或关注 OpenAI 开发者工具生态的工程师与开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://oneusefulthing.substack.com/feed', 'One Useful Thing (Ethan Mollick)', 'AI 深度解读', '## 栏目介绍

**One Useful Thing** 由宾夕法尼亚大学副教授、Ethan Mollick 创办，聚焦人工智能领域的最新动态与深度思考。

**主要关注方向：**

1. **AI 模型实测与进展追踪**：对 GPT、Claude、Gemini 等前沿模型的深度测评，分析 AI 能力的快速演进
2. **AI 实践应用指南**：在 AI 代理时代如何选择工具、提升效率，以及 AI 在创业、管理中的实际运用
3. **人机共存的思考与反思**：探讨 AI 对创造力、工作模式和社会的影响，兼顾乐观展望与冷静审视

**适合读者：** 希望紧跟 AI 发展、获取实用建议，同时思考人机关系的学习者和实践者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.interconnects.ai/feed', 'Interconnects (Nathan Lambert)', 'AI 深度解读', '**栏目定位**
Interconnects 是前 Ai2 研究员 Nathan Lambert 关于 AI 领域的前沿博客，聚焦开源模型生态、AI 治理与安全政策的深度分析。

**主要关注方向**
- 开源与闭源模型的发展动态、评测与生态竞争
- AI 治理、监管政策及开源模型的法律与伦理讨论
- 大模型训练与后训练（RLHF）技术及行业趋势

**适合读者**
适合关注 AI 开放生态、技术政策与行业格局的技术从业者、研究者及科技媒体人。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://importai.substack.com/feed', 'Import AI (Jack Clark)', 'AI 深度解读', '**栏目介绍：**

Import AI 是由前OpenAI政策总监、Anthropic联合创始人Jack Clark创办的周更AI研究通讯。每期精选近期arXiv热门论文与行业动态，以深入浅出的方式解读技术进展。

**主要关注方向：**

1. AI技术研究进展（如GPU优化、RL算法、模型架构）
2. AI安全与对齐问题（如对齐进展、安全评估）
3. AI政策与行业趋势（如监管动态、算力竞争）

**适合读者：** 想快速跟踪AI前沿动态、研究趋势和安全议题的研究者、工程师及政策制定者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://latent.space/feed', 'Latent Space', 'AI 深度解读', '**Latent Space** 专注 AI 工程领域的深度报道，聚焦 AI Engineer World''s Fair 大会现场一手资讯。

**主要关注方向：**
- AI Agents 与自主系统的设计理念与工程实践
- Loops、Autoresearch、Skill Engineering 等前沿技术概念
- Cursor、Vercel、Warp 等头部 AI 公司的产品与工程实践

**适合读者：** 对 AI 在软件开发领域落地实践感兴趣的开发者和工程负责人。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://jennyouyang.substack.com/feed', 'Build to Launch (Jenny Ouyang)', 'AI 深度解读', '**Build to Launch** 专注于 AI 编程工具 Claude Code 的深度使用，涵盖进阶技巧、多代理工作流、以及 MCP（Model Context Protocol）生态工具的实战评测，同时分享如何将 AI 整合进知识管理、设计、内容创作等真实工作场景。

- Claude Code 进阶技巧与工作流优化
- MCP 生态工具的选型与实践
- AI 辅助知识工作与设计创作

适合希望突破「玩具项目」，将 Claude Code 和 AI 工具真正融入日常工作的创作者和开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://newsletter.pragmaticengineer.com/feed', 'The Pragmatic Engineer', '技术与工程', '**栏目定位**

The Pragmatic Engineer 由 Gergely Orosz 运营，专注于 Big Tech 与初创公司的工程实践，深度剖析行业动态与技术趋势。

**主要关注方向**

- **Big Tech 工程内幕**：解读 Meta、OpenAI、Anthropic 等科技公司的组织变革与技术决策
- **软件工程职业发展**：涵盖技术面试指南、就业市场分析、行业薪资趋势
- **AI 工程落地**：探讨 AI 模型发展趋势、代理工具应用及工程团队如何应对 AI 变革

**适合读者**

适合中高级软件工程师、技术管理者，以及希望了解 Big Tech 内部运作与行业趋势的从业者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://blog.bytebytego.com/feed', 'ByteByteGo', '技术与工程', 'ByteByteGo 是一个面向软件工程师的技术博客，涵盖系统架构设计、AI/ML 工程实践及前沿技术深度解析。

**主要关注方向：**

1. **系统架构与分布式系统**：多区域部署、服务架构设计、高可用系统构建
2. **AI 工程与 LLM 应用**：RAG、Agentic AI、LLM vs SLM、AI 代码治理
3. **工程实践**：AI 辅助开发、代码质量、开发者工具

**适合读者：** 软件工程师、系统架构师，以及希望了解 AI 在工程领域落地实践的技术人员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://simonwillison.net/atom/everything/', 'simonwillison.net', '技术与工程', '**栏目介绍**

Simon Willison 的个人博客，聚焦 AI/LLM 技术实践与开源工具开发。涵盖 AI 模型评测、Claude Fable 等 AI 编程助手实验、sqlite-utils 等自研开源项目进展，以及编程技巧与行业观察。

适合关注 AI 辅助开发、Python 开源生态和编程工具实践的开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.jeffgeerling.com/blog.xml', 'jeffgeerling.com', '技术与工程', '## 栏目介绍

这是技术博主 Jeff Geerling 的个人博客，关注硬件 DIY、Homelab 搭建与开源工具。涵盖树莓派集群、IP KVM、Framework 笔记本等硬件评测，以及 FFmpeg、磁盘测试等技术实践。偶尔聊聊 3D 打印、Apple 产品和科技新闻。

适合喜欢折腾 Homelab、关注开源硬件、对 DIY 和技术细节有兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.seangoedecke.com/rss.xml', 'seangoedecke.com', '技术与工程', '## 栏目介绍

这是一个技术写作者的个人博客，作者Sean Goedecke长期关注AI/LLM技术的发展与现实，以数据驱动的分析风格著称。他善于反驳流行误解（如"AI推理不赚钱""GPU三年报废"等说法），同时关注软件工程实践、团队协作与技术文化。

**主要关注方向：**
- AI技术的商业现实与局限性分析
- 欧盟AI法案等监管政策的影响
- 软件工程实践与职业成长

适合对AI技术保持理性关注、希望听到反直觉分析的软件工程师和产品从业者订阅。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://daringfireball.net/feeds/main', 'daringfireball.net', '技术与工程', 'Daring Fireball 是由 John Gruber 主持的知名科技博客，专注于 Apple 生态系统和 Mac/iOS 平台。栏目关注 Apple 官方动态与产品策略、Mac 应用生态与开发技术趋势，以及 Macworld、ATP 播客等周边资讯。适合关注 Apple 产品、追求 macOS/iOS 原生体验，或对科技评论写作感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://ericmigi.com/rss.xml', 'ericmigi.com', '技术与工程', '## 栏目介绍

这是 Pebble 创始人 Eric Migicovsky 的个人博客，记录 Pebble 智能手表的复兴之路。

**主要关注方向：**
- **Pebble 硬件复兴**：Pebble Time 2、Pebble Round 2、Index 01 等新产品的研发与生产进展
- **开发者生态**：Pebble SDK 更新、CloudPebble 平台、开发者竞赛等
- **开源软件**：Pebble 手表软件的完整开源进展

**适合读者：** Pebble 智能手表用户、可穿戴设备爱好者、智能手表应用开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://antirez.com/rss', 'antirez.com', '技术与工程', '- 1 句总体定位: 资深开源开发者 antirez（Redis 作者）的技术博客，探讨 AI 时代的软件开发与数据库内核。

- 2 到 3 个主要关注方向: 
  - LLM/AI 在编程中的应用、局限与反思
  - Redis 数据库内核开发与数据结构设计
  - 软件工程实践、技术哲学与开源生态思考

- 1 句适合什么读者: 适合对数据库内核、AI 辅助编程及开源技术深度话题感兴趣的开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://idiallo.com/feed.rss', 'idiallo.com', '技术与工程', '**栏目介绍**

这是独立博主 Idrissa Alliou（idiallo.com）的个人博客，主要分享他对科技行业、互联网平台与日常生活的观察与思考。内容兼具技术深度与人文温度，既有对 LLMs/AI 监管、编程开发的经验之谈，也不乏对商业现象、社会议题的轻松吐槽与独立见解。适合对科技趋势保持好奇、喜欢独立视角的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://maurycyz.com/index.xml', 'maurycyz.com', '技术与工程', '**栏目定位**：个人技术博客，主要分享天文深空摄影与玻璃吹制 DIY 两大爱好。

**主要方向**：
- **深空天体摄影**：使用望远镜拍摄 Arp 星系目录中的特殊星系（相互作用星系、奇特形态星系），附详细观测参数与图像处理记录
- **玻璃吹制与真空管制作**：从零开始制作热离子二极管、钨丝灯等真空电子器件，包括玻璃-金属密封工艺
- **实用技术笔记**：偶尔记录电池优化、网页开发等日常技术经验

**适合读者**：天文摄影爱好者、DIY 电子玩家，或对动手实验类内容感兴趣的技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://mitchellh.com/feed.xml', 'mitchellh.com', '技术与工程', '## 栏目介绍

Mitchell Hashimoto 的个人技术博客，记录他在开源软件领域的探索与实践。博主是 Vagrant 和 Terraform 等知名工具的原作者，目前致力于推动 Zig 编程语言生态发展及 Ghostty 终端模拟器项目。

**主要关注方向：**

- Zig 语言开发：包括编译器优化、开发生态建设及软件基金捐款记录
- Ghostty 终端项目：从架构设计到性能调优的完整开发历程
- 软件工程实践：AI 采用心得、开源项目运营及开发者工具思考

**适合读者：** 对 Zig 语言、终端模拟器开发或开源项目构建感兴趣的开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://xeiaso.net/blog.rss', 'xeiaso.net', '技术与工程', '**栏目介绍：**

这是一个技术博客，聚焦软件安全与基础设施。博主以戏谑的"No way to prevent this"系列追踪各类 CVE 漏洞与供应链攻击事件，同时深入探讨编译器、WebAssembly、对象存储、Go 语言等技术实践，并分享对 AI 定价模型、网络协议等话题的见解。行文风格轻松幽默，常以角色对话形式展开。

**适合读者：** 对安全漏洞、系统运维、云原生技术感兴趣的开发者和 SRE 工程师。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://devblogs.microsoft.com/oldnewthing/feed', 'devblogs.microsoft.com/oldnewthing', '技术与工程', '## 栏目介绍

**The Old New Thing** 是微软工程师 Raymond Chen 的技术博客，分享 Windows 内部机制、系统编程和调试经验。内容涵盖 Windows API 深层原理、DLL 加载机制、兼容性历史问题，以及真实案例分析。适合 Windows 平台开发者、系统程序员和想深入理解 Windows 运行机制的技术人员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.righto.com/feeds/posts/default', 'righto.com', '技术与工程', '## 栏目介绍

这是一个专注于经典计算机硬件逆向工程的技术博客。通过对上世纪七八十年代的处理器芯片（如Intel 8087、8086、386）、航空航天电子设备（航天飞机计算机、B-52轰炸机导航系统）以及早期计算设备进行深入拆解与分析，揭示其内部电路、微架构和工作原理。适合对计算机硬件历史、芯片逆向工程和经典处理器内部机制感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://lucumr.pocoo.org/feed.atom', 'lucumr.pocoo.org', '技术与工程', '- 1 句总体定位
- 2 到 3 个主要关注方向
- 1 句适合什么读者

要求简洁、自然，不超过 180 字。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://skyfall.dev/rss.xml', 'skyfall.dev', '技术与工程', '一位独立开发者的技术博客，对AI热潮和科技行业保持冷静观察和犀利批评。关注AI项目的实际价值、Web开发技术（Ruby on Rails、Astro、Tailwind）以及软件开发中的实际问题。文字简洁直接，常以讽刺口吻剖析科技行业的荒诞。适合想听真话、不喜欢营销废话的开发者阅读。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://rachelbythebay.com/w/atom.xml', 'rachelbythebay.com', '技术与工程', '- 一句总体定位：技术博主的个人站点，聚焦运维实践、网络技术与硬件折腾的所见所闻。

- 主要关注方向：
  1. **运维经验与故障复盘**：停机故事、整型溢出等踩坑案例
  2. **网络与系统细节**：内部域名泄露、虚拟化系统探索
  3. **硬件评测与替代方案**：NAS 替换建议、老设备利用技巧

- 适合什么读者：对服务器运维、网络配置和 DIY 硬件感兴趣的技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://overreacted.io/rss.xml', 'overreacted.io', '技术与工程', '- 1 句总体定位
- 2 到 3 个主要关注方向
- 1 句适合什么读者

要求简洁、自然，不超过 180 字。

---

**overreacted.io** 是 Dan Abramov 的个人博客，内容涵盖软件工程的多个领域。

**主要关注方向：**

1. **去中心化社交网络**：探讨 AT Protocol、ActivityPub 等开放协议，以及「协议即 API」的理念
2. **编程语言与类型系统**：对 Lean 等形式化验证语言、类型理论的实践与思考
3. **工程实践**：代码质量工具、调试方法论等日常开发经验

**适合读者：** 对前端开发、去中心化社交协议、形式化验证或编程语言理论感兴趣的技术人。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.johndcook.com/blog/feed/', 'johndcook.com', '技术与工程', 'John D. Cook 的个人博客，以简短的篇幅探索各类有趣的数学问题。文章从一个小问题出发，自然延伸至相关领域——从数论中的调和数与循环节、几何定理的可视化，到概率统计中的贝叶斯推理、组合数学里的棋盘路径计数，还有编程工具（如 bc 计算器、Bash 技巧）的实用探讨。

适合对数学有好奇心、喜欢在碎片时间领略各种有趣小知识的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://gilesthomas.com/feed/rss.xml', 'gilesthomas.com', '技术与工程', '**栏目定位**：技术博主 Giles Thomas 的个人博客，分享他从零构建 LLM、JAX/Flax 框架实践及家庭 10Gb 网络搭建的完整过程。

**主要关注方向**：

1. 从零实现大语言模型（基于 Sebastian Raschka《Build a Large Language Model (from Scratch)》一书的实践笔记）
2. JAX/Flax 深度学习框架的探索，包括调试技巧、与 PyTorch 代码迁移
3. 家庭 10Gb/s 以太网部署，包括设备选型、散热优化等实操经验

**适合读者**：对 LLM 内部原理、JAX 框架或家庭万兆网络搭建有兴趣的开发者和技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://matklad.github.io/feed.xml', 'matklad.github.io', '技术与工程', '## 栏目介绍

这是一个专注于**系统级编程与软件工程实践**的技术博客，由资深开发者撰写。

**主要关注方向：**

- **编程语言与工具**：Zig 语言实践、NixOS 配置、Rust 相关技术
- **软件工程方法**：代码阅读技巧、测试策略、代码格式化与排版
- **工程思维**：架构设计学习路径、编译器设计权衡、协作流程优化

**适合读者：** 有一定经验的开发者，尤其适合对 Rust、Zig、NixOS 等底层技术感兴趣，或希望提升代码阅读与工程素养的工程师。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://evanhahn.com/feed.xml', 'evanhahn.com', '技术与工程', '## 栏目介绍

**Evan Hahn** 是一个独立开发者的个人博客，分享实用的命令行工具、小项目和技术观察。内容涵盖浏览器扩展、图像处理工具、命令行脚本等技术创作，以及对软件错误分类、GitHub可用性等工程话题的思考。适合喜欢探索轻量级工具、对开发实践有好奇心的技术人员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://terriblesoftware.org/feed/', 'terriblesoftware.org', '技术与工程', '# 栏目介绍

一个工程经理的技术随笔与反思。

**主要关注方向：**

- **AI 与工程实践**：探讨 AI 编码工具的局限性、团队引入 AI 后的协作挑战
- **技术管理**：从一线管理者的视角，谈论授权、沟通、职业成长与团队机会
- **工作方式与效率**：关于专注力、信息摄入节奏，以及"让事情保持简单"为何难以被奖励

**适合读者：** 想在代码与管理之间寻找平衡点的技术人，或对 AI 实际落地有独立思考的工程师。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://rakhim.exotext.com/rss.xml', 'rakhim.exotext.com', '技术与工程', '**栏目介绍**

这是一个关注科技与人文交叉地带的个人博客。文章多从实际使用体验出发，探讨 UI/UX 设计趋势与问题、AI 对编程和文化的影响、软件开发的最佳实践，以及技术与日常生活的碰撞。文风平实、视角独特，适合对科技产品保持批判性思考的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://xania.org/feed', 'xania.org', '技术与工程', '技术博客，关注编译器优化与底层性能调优。

**主要关注方向：**
- 编译器优化技术（内联、尾调用优化、switch优化）
- SIMD 向量化与内存访问优化
- 浮点运算与底层性能技巧

**适合读者：** 有一定编程基础，想深入理解编译器行为、追求极致性能的开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://nesbitt.io/feed.xml', 'nesbitt.io', '技术与工程', '关注开源生态系统的现状与问题，涵盖包管理动态、开源治理与供应链安全。

主要方向：
- 包管理器与软件供应链的最新进展
- 开源维护者面临的资金、法律与政策挑战
- 开源项目安全漏洞与风险

适合关注开源生态健康状况、关心软件供应链安全的开发者与从业者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://susam.net/feed.xml', 'susam.net', '技术与工程', '- **总体定位**: Susam 的个人技术博客，涵盖编程、项目开发、技术随笔与生活感悟。

- **主要关注方向**:
  1. **软件开发与开源项目**：维护 QuickQWERTY 打字练习工具、Wander Console 等个人项目，探讨 Git、Web 开发等技术实践。
  2. **计算机历史与教育**：回顾童年学电脑的经历，讨论数学教学法，分享 RSA 公司趣事。
  3. **技术观点与随想**：对现代 Web 设计的反思、对 URL 设计原则的看法，以及每月日志形式的零散笔记。

- **适合读者**: 喜欢阅读个人技术博客、对开源小工具感兴趣、或想了解开发者真实思考过程的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://entropicthoughts.com/feed.xml', 'entropicthoughts.com', '技术与工程', '**栏目介绍：**

一个技术作者的独立博客，关注函数式编程与计算机科学基础（尤其通过 Haskell 重访 SICP），以及统计学在实际问题中的应用——从 F1 赛车到股市回报，用代码和数据探索有趣的问题。适合对编程语言、统计分析和跨学科思考感兴趣的技术读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://buttondown.com/hillelwayne/rss', 'buttondown.com/hillelwayne', '技术与工程', '- **总体定位**：技术写作者 Hillel Wayne 的个人 Newsletter，围绕编程语言、设计逻辑与工程实践展开深度探讨。

- **主要关注方向**：1) 编程语言设计与形式化方法的实践应用；2) 软件测试策略、属性验证与形式化证明；3) 编程中的概念澄清与常见误区分析。

- **适合读者**：对编程语言理论、软件设计思维感兴趣的中高级开发者，尤其是想深入理解"代码背后的逻辑"的工程师。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://borretti.me/feed.xml', 'borretti.me', '技术与工程', '**栏目介绍**

这是一个技术写作者的个人博客，融合科技思辨与实践记录。

主要关注：**AI对社会与个体的影响**（就业危机、人机关系）、**编程工具与方法**（Makefile、NixOS配置）以及**阅读、学习与注意力**等个人效率话题。

文章风格思辨而务实，既有宏观的文明反思，也有具体的技术踩坑记录。适合对AI时代个人处境感兴趣、或想获取实用技术技巧的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://jayd.ml/feed.xml', 'jayd.ml', '技术与工程', '**栏目介绍：**

个人技术博客，作者是独立开发者。内容涵盖Linux系统配置与Arch使用经验、游戏开发（Godot引擎项目）、自托管媒体库搭建（Jellyfin相关脚本），偶尔分享对科技产品的吐槽与批评。

**适合读者：** 喜欢折腾系统、对自托管和家庭媒体方案感兴趣的中级Linux用户。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://minimaxir.com/index.xml', 'minimaxir.com', '技术与工程', '## 栏目介绍

这是一个关注 AI/LLM 领域最新动态的技术博客，作者以工程师视角对新兴模型和工具进行实测与深度分析。

**主要关注方向：**
- **LLM 评测与比较**：对最新大语言模型进行实际测试，包括能力边界、安全性等
- **AI 工具实测**：涵盖 AI 图像生成、AI 编程代理等工具的深度使用体验
- **行业趋势观察**：追踪 AI 领域新模型发布与行业动态

**适合读者：** 对 AI 技术感兴趣的开发者和科技爱好者，想了解新模型和新工具实际表现的人。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://geohot.github.io/blog/feed.xml', 'geohot.github.io', '技术与工程', '## 栏目介绍

**总体定位**：传奇黑客乔治·霍茨（geohot）对AI时代与社会现象的独立批判与深度反思。

**主要关注方向**：
- **AI批判性分析**：质疑AI末日论、反对盲目崇拜大模型、批评AI编程代理的局限性
- **经济社会观察**：从独特视角解读通胀、房价与价值创造的关系
- **文化与精神反思**：对中心化社会的抵制，对技术文化的哲学追问

**适合读者**：对AI持批判态度、厌倦技术公司营销叙事、喜欢独立思考的技术从业者与文化观察者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://blog.jim-nielsen.com/feed.xml', 'blog.jim-nielsen.com', '技术与工程', '**栏目介绍**

Jim Nielsen 的个人博客，记录一位资深前端开发者对设计、编程与生活的观察与思考。内容涵盖网页设计与前端开发实践、软件工程的深层问题、书籍阅读笔记，以及对创作过程与个人成长的反思。适合前端开发者、设计师，以及喜欢将技术与人文结合阅读的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://dfarq.homeip.net/feed/', 'dfarq.homeip.net', '技术与工程', '一个专注于计算机与科技发展史的博客，回顾80-90年代软件巨头收购案、经典硬件产品兴衰、传奇工程师故事等主题。

- **经典计算机历史**：复古电脑杂志、英国本土品牌、Atari/Amiga等传奇产品发展脉络
- **科技公司兴衰**：IBM、AMD、VA Linux等企业的关键时刻与商业决策
- **互联网与软件先驱**：Altavista、Spyglass浏览器、Windows系统发布等早期数字时代记忆

适合热爱科技怀旧、对计算机发展史感兴趣、或想了解80-90年代数字产业故事的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://jyn.dev/atom.xml', 'jyn.dev', '技术与工程', '**总体定位**
jyn.dev 是 Reilly Wood 的个人技术博客，作者从事编译器工作，业余研究构建系统与开发者工具。

**主要关注方向**
1. **构建系统原理与改进**：系列文章深入探讨 build executor、action graph、依赖模型等核心问题
2. **代码质量与工具开发**：涵盖代码覆盖率、lint 分析、pre-commit hooks 等实践话题
3. **底层系统与编译器**：加密磁盘远程解锁、brownouts 机制等技术探索

**适合读者**
对构建系统、编译器技术或开发工具链有兴趣的中高级工程师。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.geoffreylitt.com/feed.xml', 'geoffreylitt.com', '技术与工程', '**总体定位**
Geoffrey Litt 的个人博客，关注 AI 时代下的软件开发方式与产品设计思考。

**主要关注方向**
- AI 如何改变编程实践，探索更高效的人机协作模式
- AI 产品的界面与交互设计，反思 chat 等现有范式的局限
- 软件可塑性，探讨用户如何重新获得对工具的主导权

**适合读者**
适合软件开发者、产品设计师，以及对 AI 与软件交叉领域有思考的技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.downtowndougbrown.com/feed/', 'downtowndougbrown.com', '技术与工程', '这是一个专注于**复古计算硬件修复与系统调试**的技术博客。博主 Doug Brown 热衷于探索和修复年代久远的苹果电脑（如 Macintosh Performa 系列、Power Mac G3 等），从 ROM 诊断到硬盘数据恢复，用细致的技术手段让老硬件重获新生。博客同时涉及嵌入式设备调试、硬件协议分析（如 USB、EDID）等硬件黑客话题，适合对复古电脑、硬件维修和底层技术感兴趣的技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://brutecat.com/rss.xml', 'brutecat.com', '技术与工程', '一位专注于Google生态系统安全研究的独立研究员，分享漏洞赏金项目实战。涵盖Google Cloud、YouTube等产品的安全漏洞挖掘，Web与API安全研究，以及高额赏金案例解析。适合对漏洞赏金感兴趣的安全研究者阅读。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://eli.thegreenplace.net/feeds/all.atom.xml', 'eli.thegreenplace.net', '技术与工程', 'eli.thegreenplace.net 是技术博主 Eli Bendersky 的个人博客，分享他在编程实践、编译器开发与数学理论方面的深度探索。

博客主要关注三个方向：一是 WebAssembly 开发，涵盖 WASM 调试、watgo 工具及编译器后端实现；二是数学理论与编程的结合，如傅里叶级数、拉格朗日插值等在工程中的应用；三是 Python 生态中的插件系统、LLM 辅助编程等实践话题。适合对底层技术、编译器原理和数学在编程中的应用感兴趣的开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.abortretry.fail/feed', 'abortretry.fail', '技术与工程', '**栏目介绍**

本栏目专注于科技公司与计算技术发展史，从日立的工业崛起到世嘉的游乐器王朝，从施乐帕洛阿尔托研究中心的创新到 QNX 操作系统的诞生，涵盖微处理器、电脑硬件、操作系统及消费电子领域的企业兴衰。适合对科技史、企业发展史感兴趣，怀念经典硬件与软件的技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://fabiensanglard.net/rss.xml', 'fabiensanglard.net', '技术与工程', '## 栏目介绍

Fabien Sanglard 的个人技术博客，主要深度剖析经典游戏的技术实现与背后的工程故事，涵盖 90 年代游戏引擎逆向、硬件发展史（如 Rendition 显卡）、渲染技术演进等。偶尔分享键盘、桌游等个人爱好，以及技术书籍推荐。适合对老游戏技术原理、图形学历史和游戏开发感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://oldvcr.blogspot.com/feeds/posts/default', 'oldvcr.blogspot.com', '技术与工程', '**栏目介绍**

这是一个专注于复古计算（Vintage Computing）的博客，内容涵盖经典电脑硬件修复与使用、历史人物与公司故事、老游戏及相关音乐，以及早期消费电子设备。适合对早期个人电脑发展史、怀旧电子设备修复或经典游戏文化感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://bogdanthegeek.github.io/blog/index.xml', 'bogdanthegeek.github.io', '技术与工程', '**栏目介绍**

这是一个嵌入式工程师的技术博客，记录从废旧电子烟微控制器到陶艺烧制控制器的各种折腾。内容涵盖ARM/RISC-V调试、嵌入式系统编程、自制PCB等硬件黑客项目，也分享制陶、空闲时间的折纸与机械加工等手工爱好。

**主要关注方向**

1. 嵌入式系统与硬件黑客：利用廉价或废旧硬件进行开发、调试和编程
2. 从零制作：PCB设计、堆分配器实现、微控制器项目开发
3. 手工艺与技术的结合：陶艺烧制、折纸等传统手艺的数字化探索

**适合读者**

适合对硬件黑客、嵌入式开发、DIY项目和创客文化感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://berthub.eu/articles/index.xml', 'berthub.eu', '技术与工程', '**栏目简介**

这是一个关注欧洲数字化进程与科技政策的个人博客，作者为技术政策顾问。内容涵盖欧洲数字自主权、政府技术采购、数据安全与隐私保护，以及对大科技公司影响力的深度分析。适合关注欧盟科技政策、数字主权建设、政府信息安全的技术政策爱好者与从业者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://it-notes.dragas.net/feed/', 'it-notes.dragas.net', '技术与工程', '- **总体定位**：聚焦BSD系统与自托管实践的技术博客，分享作者在FreeBSD、Fediverse网络和基础设施运维中的实战经验。
- **主要关注方向**：FreeBSD/Linux系统深度使用、反向代理与缓存优化（HAProxy）、Mastodon/Fediverse自托管运维。
- **适合读者**：热衷自托管、熟悉Unix-like系统且喜欢动手实践的运维爱好者和开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://beej.us/blog/rss.xml', 'beej.us', '技术与工程', '**栏目介绍**

这是一个技术创作者的个人博客，记录编程探索与独立思考。内容涵盖Rust、Python、Web开发等实用教程，也有对AI时代创作、DRM技术伦理的反思。作者Beej以网络编程教程闻名，博客延续这种动手实践的精神，既有技术深度，也不乏对技术文化的独到见解。

适合喜欢动手实践、对编程有好奇心，同时关注技术与人文思考的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://danielwirtz.com/rss.xml', 'danielwirtz.com', '技术与工程', '## 栏目介绍

这是一个个人技术博客，分享作者在数字工具与生产力系统方面的实践经验。

**主要关注方向：**
- 个人知识管理（PKM）工具使用教程，包括 Roam Research、Logseq、Airtable 等平台
- 任务管理与工作流搭建方法
- 实用工具搭建（如 LinkedIn 数据追踪、网站搭建等）

**适合读者：** 对个人知识管理、笔记系统感兴趣，希望借鉴他人生产力工具搭建经验的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://matduggan.com/rss/', 'matduggan.com', '技术与工程', '一位独立开发者关于技术实践与互联网文化的个人博客。关注可观测性技术（ClickHouse）与开发工具，也探讨RSS、小众网络、Fediverse等互联网文化议题。写作带有个人视角，常从具体工具出发延伸至更大讨论。适合对技术行业有独立思考、关注互联网文化变迁的开发者或科技读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://refactoringenglish.com/index.xml', 'refactoringenglish.com', '技术与工程', '**栏目定位：** 专注于提升软件工程师的技术写作能力，帮助开发者写出更清晰、更有效的专业文档。

**主要方向：**
1. 软件设计文档（Design Doc）的撰写方法与最佳实践
2. 开发者电子邮件、技术博客等职场沟通技巧
3. 优质技术书籍与文章的推荐与点评

**适合读者：** 希望提升写作技能、改善团队协作文档质量的中高级软件开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://worksonmymachine.substack.com/feed', 'worksonmymachine.substack.com', '技术与工程', '**栏目定位**

“Works on My Machine”是一位技术写作者的思想随笔集，以细腻的隐喻和跨学科视角探讨软件开发、AI交互与商业逻辑之间的深层联系。

**主要关注方向**

1. AI时代的软件开发：如何与机器对话、Prompt工程、无限代码生成后的开发范式转变
2. 技术与商业的哲学思考：从freemium模式到开源生态，探讨技术产品的价值创造逻辑
3. 抽象思维工具：用小说、摄影、魔术等隐喻重新理解复杂系统

**适合读者**

适合对软件开发有实践经验、同时喜欢从哲学和艺术角度反思技术本质的工程师或产品思考者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://philiplaine.com/index.xml', 'philiplaine.com', '技术与工程', '## 栏目介绍

**philiplaine.com** 是 Kubernetes 工程师 Philippe Laine 的技术博客，记录他在云原生、容器技术和基础设施方面的实践心得。

**主要关注方向：**

- **Kubernetes 与容器技术**：集群运维、控制器开发、Docker 多架构镜像构建
- **云计算与网络**：AWS 服务应用、VPN 配置、Unifi 网络设备集成
- **Homelab 与个人项目**：基于树莓派的容器化实验、开源工具开发

**适合读者：** 对 Kubernetes、容器技术和云基础设施感兴趣的后端工程师或 DevOps 从业者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://bernsteinbear.com/feed.xml', 'bernsteinbear.com', '技术与工程', '- **总体定位**：Ruby JIT 编译器开发者的技术博客，记录 ZJIT 项目开发中的实践与思考。
- **主要关注方向**：
  1. ZJIT（Ruby 字节码到机器码的 JIT 编译器）开发实战
  2. 编译器核心技术与优化（SSA、值编号、内联启发式等）
  3. 编译器调试工具与测试方法（Perfetto、GDB JIT、模糊测试）
- **适合读者**：对 Ruby 内部实现或 JIT 编译技术感兴趣的开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://danieldelaney.net/feed', 'danieldelaney.net', '技术与工程', '关于设计、开发工具与个人效率的深度思考。

关注方向：
- UI/UX设计理念与设计系统
- 开发工具的交互设计
- 个人效率工具的实践

适合对设计思考和开发工具有兴趣的开发者与设计师阅读。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://herman.bearblog.dev/feed/', 'herman.bearblog.dev', '技术与工程', '## 栏目介绍

**总体定位**
Bear 博客平台维护者的个人随笔，记录技术运维思考与生活观察。

**主要关注方向**

1. **博客文化与互联网现象** — 探讨帖子留存、发现机制、AI 对内容创作的影响，以及互联网生态变化
2. **Bear 平台幕后** — 分享维护博客平台时遭遇的技术挑战，如爬虫泛滥、服务器故障与应对经验
3. **耐力运动与生活方式** — 记录长距离徒步、跑步训练，以及作息调整等个人成长心得

**适合读者**
对独立博客生态感兴趣的网络观察者，以及 Bear 平台用户和博主。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://tomrenner.com/index.xml', 'tomrenner.com', '技术与工程', '- 一句话定位：一个资深工程师对软件开发实践、开放网络与技术社会的独立思考。

- 主要关注：
  1. **工程实践**：代码质量、依赖管理、团队协作方法的反思
  2. **开放网络**：IndieWeb 标准的实践与个人站点的互联互通
  3. **技术人文**：AI 发展历史、数字时代的信任、知识管理等议题的哲学性讨论

- 适合读者：从事软件开发、关注网络去中心化或对技术实践有独立反思习惯的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://blog.pixelmelt.dev/rss/', 'blog.pixelmelt.dev', '技术与工程', 'PixelMelt 的技术博客，专注于 JavaScript 代码保护与逆向工程领域。博主通过实战案例深入探讨代码混淆技术、JavaScript 虚拟机分析以及 Web 安全边界，如 Kindle DRM 破解和 DevTools 检测对抗等话题。适合对逆向工程、代码安全感兴趣的开发者阅读。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://martinalderson.com/feed.xml', 'martinalderson.com', '技术与工程', '**栏目介绍**

martinalderson.com 是一个关注 AI 行业发展动态与技术商业结合的个人博客。博主 Martin Alderson 长期追踪前沿模型进展、深入分析 AI 经济学与基础设施趋势，并对开源生态保持敏锐观察。写作风格偏向技术洞察与商业思考的融合，常从实际案例出发探讨 AI 技术的落地影响与产业格局演变。

**主要关注方向**

- 前沿模型与产品动态（如 GLM、Gemini、Claude、DeepSeek 等）
- AI 经济学与基础设施（成本压缩、数据中心、算力竞争）
- AI 效率优化与开源生态（量化压缩、MoE、开放权重模型）

**适合读者**

适合对 AI 行业有持续关注、期望获得兼具技术深度与商业视角分析的从业者或爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://danielchasehooper.com/feed.xml', 'danielchasehooper.com', '技术与工程', '专注于软件开发的技术博客，作者围绕C语言、iOS开发和图形编程等话题分享实践经验与原理探索。

**主要关注方向：**
- C语言底层开发：泛型数据结凊、性能优化、编译器相关
- iOS/Swift开发：SwiftUI、类型检查器等内部机制
- 图形与可视化：着色器编程、构建可视化工具、3D建模

**适合读者：**
对系统编程和底层技术有兴趣、喜欢探究技术原理的中高级开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.chiark.greenend.org.uk/~sgtatham/quasiblog/feed.xml', 'chiark.greenend.org.uk/~sgtatham', '技术与工程', 'Simon Tatham 的个人技术博客，涵盖编译器理论、密码学、图算法等计算机科学议题，常以具体问题切入探讨深层原理。关注方向包括：程序语言与解析器设计、密码学与安全技术、开源工具开发经验。适合有一定编程基础、喜欢深入探讨技术细节的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://grantslatton.com/rss.xml', 'grantslatton.com', '技术与工程', '**栏目介绍**

这是一名软件工程师的个人博客，专注于算法与AI领域的实践与思考。栏目主要涵盖三个方面：一是用计算方法解决棋盘游戏（如Quoridor求解器、象棋变体）；二是大语言模型与AI工具的深度使用体验；三是软件设计与系统架构的哲学思考。适合对算法实现、AI工程实践和软件设计感兴趣的开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://aresluna.org/main.rss', 'aresluna.org', '技术与工程', '关于键盘历史与用户体验的深度技术博客。作者热衷挖掘输入设备的技术细节与演变——从波兰语键盘的趣闻、Enter键的命名故事，到Dvorak与QWERTY的恩怨纠葛；也关注交互设计实践，探讨手指友好界面与键盘定制方案。偶尔追溯旧字体、老电视时代的科技记忆。适合对键盘技术、交互设计史及科技怀旧感兴趣的技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://michael.stapelberg.ch/feed.xml', 'michael.stapelberg.ch', '技术与工程', '**栏目介绍**

订阅源作者是知名窗口管理器 i3 的开发者 Michael Stapelberg，专注于 Linux 系统实践与开发工具优化。内容主要涵盖三大方向：NixOS 配置与使用经验、硬件评测与平台选择（如 CPU 切换、MacBook 使用感受）、以及开发安全实践（如密钥管理、rsync 内存安全实现）。此外还有自托管数据备份方案和 Wayland 桌面环境探索。

**适合读者**：希望深入了解 NixOS、关注系统安全与可靠性、或正在搭建自托管基础设施的 Linux 开发者与技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://blog.miguelgrinberg.com/feed', 'miguelgrinberg.com', '技术与工程', '## 订阅源介绍

Miguel Grinberg 是知名 Python 技术作家，其博客专注于 Python 生态系统下的数据库编程与 Web 开发。近期以《SQLAlchemy 2 In Practice》系列为主线，深入讲解 Python ORM 的使用技巧，同时分享密码管理、隐私保护等实用话题，并偶尔探讨 AI 编程的思考。适合有 Python 基础的开发者，特别是对数据库操作和 Web 框架感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://keygen.sh/blog/feed.xml', 'keygen.sh', '技术与工程', 'Keygen 官方博客，聚焦软件商业化实践与独立开发者的创业思考。内容涵盖软件许可与分发、可持续商业模式的探索，以及开源生态与公平许可的讨论，同时记录公司合规进展与企业文化。每篇文章多以隐喻切入，反思科技行业中的 burnout、成功与捷径等议题。

**适合读者**：独立开发者、SaaS 创业者，以及关注软件商业化与开源生态的实践者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://computer.rip/rss.xml', 'computer.rip', '技术与工程', '**栏目介绍**

这是一个专注于技术与现代社会交织的历史叙事类订阅源，涵盖通信基础设施、计算技术发展、电子支付演进等领域。作者擅长从日常技术切入，以美国为背景深入挖掘背后的产业变迁、社会机制与权力结构，叙事细腻，视角独特。

**主要关注方向**

- 通信技术历史：从语音调制解调器、红外连接到AT&T百年兴衰
- 金融与计算技术：电子支付、投注系统、Lotus Notes的产业故事
- 监控与基础设施：城市监控、潜艇通信、水电开发中的权力博弈

**适合读者**

适合对技术史、科技文化及技术与社会关系感兴趣、喜欢深度叙事性阅读的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://krebsonsecurity.com/feed/', 'krebsonsecurity.com', '技术与工程', '- **一句总体定位**：KrebsOnSecurity 是由资深安全记者 Brian Krebs 创办的独立网络安全博客，以深度调查和快速报道网络犯罪、重大数据泄露及执法行动闻名。

- **主要关注方向**：网络犯罪集团追踪与勒索软件生态分析、执法机构对黑客平台的查封与打击行动、重大数据泄露事件与关键基础设施安全。

- **适合读者**：适合信息安全从业者、IT 管理员、对网络威胁情报和网络安全事件感兴趣的技术爱好者阅读。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://lcamtuf.substack.com/feed', 'lcamtuf.substack.com', '技术与工程', '- 1 句总体定位：技术深度博客，涉及电子电路设计、C 语言底层编程及 AI 技术的批判性分析。

- 2 到 3 个主要关注方向：电子电路与硬件 DIY（如电容倍增器、伏特计时钟）；C/C++ 底层编程与系统原理；AI 生成内容的识别与反思。

- 1 句适合什么读者：适合对硬件黑客、底层编程感兴趣，且愿意深入思考技术本质的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://micahflee.com/feed/', 'micahflee.com', '技术与工程', '## 栏目介绍

Micah Lee 是安全研究员和调查记者，曾为 The Intercept 等媒体撰稿。订阅源主要关注三个方面：**数字隐私与监控**——从 Signal 安全实践到隐私权倡导者的深度访谈；**黑客文化与安全会议**——DEFCON 演讲、漏洞披露案例分析；**科技与政治交叉地带**——ICE 执法、Signalgate 事件等技术争议的社会影响。内容兼具技术深度与公共议题评论，适合关注网络安全、隐私权以及科技如何影响社会议题的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.troyhunt.com/rss/', 'troyhunt.com', '技术与工程', '**栏目定位：**
国际知名安全专家 Troy Hunt 的个人博客，主要分享数据安全、隐私保护及 Have I Been Pwned 服务动态。

**主要关注方向：**
- 数据泄露事件分析与行业洞察
- Have I Been Pwned 服务更新与政府合作进展
- 网络安全趋势、赎金策略等技术话题

**适合读者：**
关注数据泄露风险、重视在线隐私保护，或对网络安全行业动态感兴趣的技术爱好者与从业者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://mjg59.dreamwidth.org/data/rss', 'mjg59.dreamwidth.org', '技术与工程', 'Matthew Garrett 的个人技术博客。这位曾任职于 CoreOS 的工程师关注**系统安全**（Secure Boot、加密通讯）、**开源生态与法律纠纷**（如针对 Techrights 的诉讼），以及**技术深度实践**（复古硬件改造、网络配置）。文章风格偏硬核，常结合真实案例分析安全机制的实际运作。适合对 Linux 安全、固件签名和企业身份认证感兴趣的开发者和技术人员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://magazine.sebastianraschka.com/feed', 'Ahead of AI', '技术与工程', 'Sebastian Raschka 的技术博客，专注于大语言模型（LLM）的深度技术解析。主要关注方向包括：**LLM 架构原理**（如图注意力机制、KV 共享等核心技术的可视化讲解）、**前沿论文导读**（定期整理推荐必读研究论文）、以及**AI 开发实践**（如本地编码智能体、工作流搭建等）。内容深入浅出，配有大量原创图表，适合对 LLM 技术原理和工程实现感兴趣的研究者与开发者订阅。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://calv.info/atom.xml', 'Calvin French-Owen', '技术与工程', 'Calvin French-Owen 的个人技术博客，记录他对 AI 编程工具、产品设计与前沿科技的深度思考。Calvin 曾联合创立 Twilio Functions，亲历 AI 编程从辅助到主导的转变，文章多为第一手实践经验。

**主要关注方向：**
- AI 编程工具实战：从 Claude Code 到 Opus、Codex，探讨不同 AI 在上下文管理、代码质量上的差异与适用场景
- 产品与 AI 落地：为什么许多 AI demo 做不成好产品，AI 时代产品思维如何转变
- 深度技术探索：地热能、热泵等硬科技领域的一手探访与思考

**适合读者：** 对 AI 辅助开发有实践兴趣的软件工程师，以及关注 AI 产品落地的技术从业者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml', 'GitHub Trending', '技术与工程', '追踪 GitHub 每日热门项目的资讯源，聚焦 AI 编程工具与代理、多代理协作系统、自托管解决方案等前沿开源项目。适合关注 AI 开发趋势、寻找实用工具和学习优秀项目的开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://blog.samaltman.com/posts.atom', 'Sam Altman', '技术与工程', '**栏目定位：**
Sam Altman 的个人博客，分享 OpenAI 发展近况、AI 未来思考与个人生活感悟。

**主要关注方向：**
- OpenAI 产品与技术进展（Sora、GPT-4o 等）
- AGI 与人工智能的未来走向
- 创业、成长与科技趋势的个人洞察

**适合读者：**
关注 AI 前沿发展、OpenAI 动态，以及科技领袖思考的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feed.xyzfm.space/6m6qmdfmaf6d', '游荡集', '播客', '**栏目介绍**

游荡集是一位作家在写作梁启超传记过程中的随感与漫谈。栏目关注中国近现代史、书籍与阅读、旅行与地理，以及知识人的生活方式。主持人行走各地，从昆明到东钱湖，从都灵到班加罗尔，在行走与阅读中寻找思想的流动。

适合对中国近代史、文学文化感兴趣，喜欢在书籍、旅行与写作中寻找生命感的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feed.xyzfm.space/64xxbj6nmcpe', '古典不dan调', '播客', '**栏目定位：**
一个兼具知识深度与实用性的古典音乐播客，通过“作曲家观察”和“通勤歌单”两个系列，带你用全新视角走进古典音乐的世界。

**主要关注方向：**
- **作曲家深度解读**：从独特角度重新认识肖邦、巴赫、门德尔松、德沃夏克等名家
- **精选歌单分享**：筛选旋律优美、易于入门的作品，适合通勤和日常聆听

**适合读者：**
想了解古典音乐、但不想被“严肃学术”吓退的听众。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feed.xyzfm.space/ww7cqnybekty', '不合时宜', '播客', '- **总体定位**：不合时宜是一档深度对话类播客，以跨文化视角追踪全球与中国的重要议题，邀请各领域专业人士展开理性而深入的讨论。

- **主要关注方向**：国际政治与社会（俄乌冲突、中东局势、德国访华等）；文化与思想（足球哲学、女性议题、心理学等）；社会政策与城市发展（贫困问题、住房政策、精神卫生等）。

- **适合读者**：对国际局势、社会议题和文化现象有好奇心的听众，偏好深度而非快餐式内容。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feeds.fireside.fm/latetalk/rss', '晚点聊', '播客', '一档聚焦AI与科技前沿的深度播客栏目，关注大模型行业动态、具身智能与机器人发展趋势，以及科技创业与投资生态。适合关注AI领域最新进展、行业趋势和创业故事的技术从业者、投资者和科技爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feed.xyzfm.space/ypn9dydpbxpc', '无人知晓', '播客', '一档与各领域有意思的人深度对话的播客。主播孟岩（“有知有行”创始人）相信“在工业革命拿走体力、AI拿走脑力之后，留给人的是心力”，节目因此围绕AI时代的自我认知、生活的意义与选择、创作与金钱等话题，与投资人、作家、喜剧演员、企业家等嘉宾展开数小时的真诚对话。没有标准答案，只有持续探索。

**适合：** 愿意在嘈杂信息中安静思考、关注内心成长的深度内容爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feed.xyzfm.space/9mkbwqtmr8ma', 'MacTalk·夜航西飞', '播客', '一档聚焦科技行业与时代思考的播客节目。主播池建强（墨问西东创始人）通过对话形式，与互联网老兵、创业者、技术大咖等深度对谈，探讨行业趋势、职业选择、AI前沿，同时分享对文学、旅行与生活意义的个人观察。适合关注科技互联网、对职业发展有思考的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://anchor.fm/s/111863208/podcast/rss', '纽约漫谈录', '播客', '**栏目定位：**
一档以纽约为背景的深度人物访谈播客，围绕文化艺术、城市生活与跨文化经历展开对谈。

**主要关注方向：**
- 海外华人文化艺术界人士的人生故事与创作思考
- 纽约城市空间与中美文化观察
- 媒体、内容创作行业的发展趋势与从业者故事

**适合读者：**
喜欢听有意思的人聊人生经历，对海外华人故事、文化艺术或城市话题感兴趣的听众。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://lightsonforever.substack.com/feed', '不熄灯Lights On', '播客', '**不熄灯Lights On** 是一档三位好友的多时区聊天播客，涵盖经济金融（格林斯潘评价、原油期货、资产配置）、科技互联网（AI发展、平台经济）与当下热点社会事件的深度讨论，还会穿插旅行见闻与音乐节生活。观点犀利，三人不时"喝多了找骂"。

适合关注全球动态、喜欢轻松聊天风格中带思考深度内容的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.ximalaya.com/album/43584169.xml', '没折腰FM', '播客', '一档华语电影评论播客，以犀利的视角审视华语与全球电影市场。

**主要关注方向：**
1. 华语电影市场分析——从春节档、五一档到年度大盘，用数据拆解票房真相
2. 新片与电影节观察——不仅评价影片本身，更关注制作背景、行业生态与争议话题
3. 电影产业与文化讨论——从女性电影、动画趋势到海外华语片，延伸至更广阔的电影议题

**适合读者：** 对华语电影有持续关注、想听到非套路化影评与深度行业观察的影迷。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feed.xyzfm.space/hwen8wf69c6g', '岩中花述', '播客', '**栏目简介**

岩中花述是由陈鲁豫主持的女性深度访谈节目，每期对话来自不同领域的嘉宾，倾听她们在时代变迁与个人命运中的选择、挣扎与绽放。节目关注普通人的生命故事——无论是卖菜的作家、寨子里长大的悬疑作者，还是用二十年记录战地的记者，她们的人生路径各异，却都在各自的处境中生长出力量。适合喜欢人物故事、关注女性成长与生命韧性的听众。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.ximalaya.com/album/51007459.xml', '银杏树下', '播客', '一档以书为媒介的温暖读书播客。三五主播围坐闲聊，分享阅读中的惊喜与共鸣——从茅奖小说到经典影视改编，从旧京风物到世界文学地图，既有对单本作品的细读品味，也有将阅读融入生活的态度探讨。适合爱书、愿意在书页间寻找乐趣的朋友。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://rsshub.rssforever.com/xiaoyuzhou/podcast/67c7eeb07ac3e30992e75a2f', '蒋方舟·一寸', '播客', '一档以文学为锚点，透视时代与人的播客。节目通过解读经典文学作品（尤其侧重女性作家的写作）、对谈学者，探讨权力关系、代际情感、社会心理等当代议题——在具体的文本细读中，照见我们自身的处境。

- **女性写作与女性处境**：从萧红、波伏娃到伊朗女作家，审视女性如何在文学中书写自身命运。
- **经典文学的当代解读**：以《飘》《简·爱》等作品为棱镜，折射阶层、身份与生存意志。
- **社会心理与文化批评**：从经济下行到注意力危机，探讨当代人的精神困境与出路。

适合喜欢文学、关注女性议题，并愿意在阅读与思辨中获得成长的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.ximalaya.com/album/70410212.xml', '萧泊内', '播客', '**栏目定位：**

文学与历史的深度解读类播客，围绕书籍解读展开。

**主要关注方向：**

- **经典文学作品解读**：从马尔克斯、库切、茨威格等世界文学名家，到韩江、王朔、江户川乱步等不同地域、类型的作家作品
- **中国历史与文化**：涉及三国、东汉、魏晋等历史题材的书籍
- **人文社科跨界**：偶尔延伸至地缘政治、能源史等宏观议题

**适合读者：**

喜欢文学阅读、关注书籍背后故事，希望拓展人文视野的听众。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feed.xyzfm.space/dk4yh3pkpjp3', '张小珺Jùn｜商业访谈录', '播客', '深度对话AI时代的科技创业者和投资人，追踪大模型、Agent、人形机器人等前沿技术变革，同时呈现消费电子、太空探索等领域的商业探索与产业洞察。适合关注AI商业化落地的科技从业者和决策者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://rsshub.rssforever.com/xiaoyuzhou/podcast/5e4515bd418a84a046e2b11a', '文化有限', '播客', '**栏目定位：**
一档以文学阅读为核心的人文播客，每期精选一本书或文化作品，邀请听众一起深入阅读、分享感受。

**主要关注方向：**
- 中外文学经典与当代小说的解读与赏析
- 心理学、个人成长与社会议题的探讨
- 电影、音乐、文化特辑等泛文艺内容

**适合读者：**
热爱阅读、喜欢在通勤或闲暇时用耳朵“看书”，追求有深度、有温度文化内容的文艺爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.ximalaya.com/album/41782767.xml', '相机夜话', '播客', '一档专注于摄影器材与影像文化的播客节目。主持人围绕数码相机评测、胶片相机收藏、器材选购等话题展开讨论，同时关注摄影行业的趋势变化与摄影实践的个人表达。无论是复古相机的把玩乐趣，还是最新数码产品的技术解析，节目都展现出对“摄影”这件事本身的真诚热情。

**主要关注方向：** 数码相机与胶片相机的器材评测与行业动态；摄影器材选购建议与使用体验；摄影文化、影像技术趋势与创作理念的探讨。

**适合读者：** 对相机和摄影有持续兴趣的发烧友与爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://lexfridmanrss.onrender.com/feed.xml', 'Lex Fridman Podcast Brief', '播客', 'Lex Fridman Podcast精选摘要，汇集AI科技、商业领袖、历史文明等领域的深度对话。节目邀请顶尖学者、企业家与技术专家，探讨人工智能、历史兴衰、科技前沿与人类思想。

**主要关注方向：**
- 人工智能、芯片技术与科技革命
- 人类历史与文明演进
- 商业创新与思想领袖对话

**适合读者：** 喜欢深度思考、对科技、历史与思想领域保持好奇心的听众。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feeds.acast.com/public/shows/67587e77c705e441797aff96', 'TED Talks Daily', '播客', '- **1 句总体定位**
每日更新的 TED 演讲精选播客，聚焦科技前沿、社会议题与人类发展的前沿对话。

- **2 到 3 个主要关注方向**
  - **AI 与技术未来**：探讨人工智能的发展方向、潜在风险与实际应用价值
  - **社会与公共议题**：包括民主治理、社会幸福感测量、心理健康与创造力培养
  - **健康与人体**：关注可穿戴设备、GLP-1 药物、成瘾研究等医学前沿话题

- **1 句适合什么读者**
适合对科技趋势、社会思考和生命成长感兴趣的终身学习者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://rsshub.rssforever.com/youtube/user/@ycombinator', 'Y Combinator', '视频', 'YC官方YouTube频道，分享创业一手经验与行业洞察。

**主要关注方向：**
- **AI落地实践**：从法律、金融到编程，探讨AI如何重塑各行业
- **创业实战心法**：如何获客、选方向、找到第一批客户
- **印度创业生态**：聚焦印度市场的技术人才与独角兽故事

**适合想了解YC视角下创业趋势、AI应用方向及全球科技创业生态的读者。**', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ', 'Marques Brownlee', '视频', '## 栏目介绍

Marques Brownlee（MKBHD）是全球最具影响力的科技 YouTuber 之一，节目以高品质的科技产品评测著称。

**主要关注方向：**
- **消费电子评测**：智能手机、笔记本电脑、显示屏、相机等新品深度体验
- **汽车与性能科技**：超跑评测、F1 赛事解析，体验速度与科技的结合
- **科技趋势与前沿**：CES、WWDC 等展会速评，探讨 AI、无人机等新兴领域

适合关注科技新品、追求深度评测内容的读者，既能了解最新数码产品动态，也能跟随主持人探索汽车、摄影等跨界科技话题。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UCXUPKJO5MZQN11PqgIvyuvQ', 'Andrej Karpathy', '视频', '- **总体定位**：深度学习与 AI 大模型领域的技术硬核教学频道，由人工智能领域知名研究者 Andrej Karpathy 创办，专注于从理论到代码的全面讲解。

- **主要关注方向**：
  1. **大语言模型（LLM）原理与实践**：深入解析 ChatGPT、GPT-2/4 等模型的架构、训练方法及实际应用
  2. **从零构建神经网络**：手把手教你用代码实现 GPT Tokenizer、WaveNet、MLP 等经典模型
  3. **深度学习核心概念**：反向传播、激活函数、梯度计算、BatchNorm 等基础知识的直观讲解

- **适合读者**：具备一定编程基础，希望深入理解 AI 大模型背后原理、动手实践神经网络实现的开发者与研究者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://rsshub.rssforever.com/youtube/user/%40anthropic-ai', 'Anthropic - YouTube', '视频', '- 1 句总体定位
Anthropic 官方 YouTube 频道，发布 Claude 模型更新、AI 研究解读及行业合作动态。

- 2 到 3 个主要关注方向
  - Claude 系列模型的新功能与能力升级
  - AI 内部运作机制的研究分享（如思维翻译、情感行为）
  - AI 在实际场景中的应用案例与行业合作（如教育、企业服务）

- 1 句适合什么读者
关注 AI 前沿发展、想了解 Claude 能力边界及应用实践的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://rsshub.rssforever.com/youtube/user/googlechrome', 'googlechrome - YouTube', '视频', '**栏目介绍**

这是Google Chrome官方YouTube频道，专注分享Chrome浏览器最新功能与使用技巧。近期重点推广Gemini AI助手在Chrome中的各种应用场景，如智能标签管理、跨标签搜索等；同时推出"What''s In My Tabs"系列名人访谈，通过明星嘉宾展示Chrome标签页的有趣用法。适合希望了解Chrome新功能、提升浏览效率的用户，以及对浏览器与AI结合感兴趣的朋友。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://rsshub-eta-topaz-88.vercel.app/readhub/daily', 'Readhub - 每日早报', '科技新闻', '## Readhub 每日早报

**总体定位**：聚焦 AI 与科技行业动态的资讯早报，精选每日最具影响力的事件。

**主要关注方向**：

- AI 大模型与技术前沿：模型发布更新、头部企业布局、Claude/Anthropic/OpenAI 等厂商动态
- 科技巨头投资与竞争：融资并购、人事变动、行业竞争格局
- 科技监管与反垄断：欧盟数字法规、反垄断判决、跨境监管争议

**适合读者**：AI 从业者、科技投资者及希望每日快速了解科技行业走向的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://rsshub-eta-topaz-88.vercel.app/latepost/4', '晚点 - 长报道', '科技新闻', '**栏目定位：**

《晚点》长报道聚焦科技产业深度叙事，关注新能源智能汽车、AI与机器人、半导体等前沿领域的商业变革与技术进展。每篇报道追求一手信息与独家视角，既呈现产业全貌，也挖掘个体故事。

**适合读者：** 对科技行业动态保持好奇，希望获得深度而非碎片化信息的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feeds.arstechnica.com/arstechnica/index/', 'Ars Technica', '科技新闻', '**Ars Technica** 是美国老牌科技媒体，以深度报道技术政策、太空探索、人工智能及产业动态见长，文章兼具专业性与可读性，兼顾行业分析与趣味科普。

**主要关注方向：**
- 科技政策与监管动向（如FCC、核电、AI治理）
- 太空探索与航天任务
- 科技产业新闻与产品动态

**适合读者：** 对科技行业有好奇心、追求深度报道而非快餐资讯的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://techcrunch.com/feed/', 'TechCrunch', '科技新闻', '**栏目介绍**

TechCrunch 是全球知名的科技媒体，追踪科技产业前沿动态，聚焦创业公司与创新趋势。

**主要关注方向：**

1. **AI 与新兴技术**：报道人工智能在网络安全、产品功能、商业模式等领域的应用与影响
2. **科技巨头动态**：关注 Apple、Google、Microsoft、Netflix 等大公司的战略调整、产品更新与市场动向
3. **创业与投资**：覆盖 IPO、融资并购、创始人访谈等创业生态资讯

**适合读者：** 关注科技行业趋势、创业动态与产品资讯的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.wired.com/feed/rss', 'WIRED', '科技新闻', '**栏目介绍：**

WIRED 是科技文化领域的深度媒体，关注科技如何渗透生活、改变社会。订阅内容主要涵盖三大方向：一是科技产品评测与选购指南，覆盖键盘、路由器、智能电视、智能家居设备等消费电子产品；二是前沿科学探索，包括天体物理、生物力学、宇宙学等领域的新研究；三是科技与社会的交叉议题，涉及数字存档、网络治理、预测市场等新兴议题。适合关注科技动态、产品选购建议，或对科技与社会议题感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://every.to/feeds/62e3ebdb41fd0051438d.xml', 'Every (sagacity@icloud.com)', '科技新闻', '- 1 句总体定位

Every 是一个聚焦 AI 前沿进展与实践的深度订阅源，涵盖工具评测、行业洞察与从业者访谈。

- 2 到 3 个主要关注方向

AI 编程工具与开发者生态的最新动态；AI 能力边界与可靠性的深度分析；AI 时代职业发展与人机协作的探讨。

- 1 句适合什么读者

适合对 AI 技术感兴趣的产品经理、开发者、创业者及希望跟进 AI 趋势的从业者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://a16z.substack.com/feed', 'a16z', '商业与创业', '**栏目定位：**
a16z（Andreessen Horowitz）官方 Newsletter，分享美国科技领域的投资洞察、行业观点与被投公司动态。

**主要关注方向：**
- AI 与前沿技术投资：从大模型到基础设施，解读 AI 时代的投资逻辑
- 美国科技竞争力：聚焦航天、网络安全等关键领域的地缘博弈与创新
- 数据洞察：通过 Charts 栏目，以图表拆解行业趋势与周期规律

**适合读者：**
关注科技创投、AI 行业动态与美国科技生态的创业者、投资人与行业观察者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.notboring.co/feed', 'Not Boring (Packy McCormick)', '商业与创业', '一封由 Packy McCormick 创办的乐观主义商业通讯，核心关注美国商业复兴、科技基础设施（AI 数据中心）、加密与代币经济等前沿趋势。每周还有固定栏目「Weekly Dose of Optimism」汇总一周积极信号，文风轻松、个人化。适合对商业创新、长期趋势感兴趣、喜欢深度分析而非短讯的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://generalist.substack.com/feed', 'The Generalist', '商业与创业', '- 1 句总体定位

The Generalist 是一份聚焦科技前沿、创业生态与地缘政治交叉地带的每周深度通讯。

- 2 到 3 个主要关注方向

AI 产业趋势与商业应用、中美科技竞争格局、创业者与投资人深度对话。

- 1 句适合什么读者

适合科技从业者、创业者和对新兴技术与社会变革保持关注的深度阅读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://stratechery.com/feed/', 'Stratechery', '商业与创业', 'Stratechery 聚焦科技行业战略与商业分析，由 Ben Thompson 创办，以深度解读科技公司决策、商业模式变革及行业趋势著称。

**主要关注方向：**

- AI 与科技公司战略：AI 如何重塑产品、竞争格局与企业决策
- 科技巨头动态：Apple、Microsoft、Anthropic 等公司的战略布局与市场应对
- 商业模式与行业趋势：流媒体、电商、硬件定价等领域的商业逻辑分析

**适合读者：** 对科技行业商业动态感兴趣的产品经理、投资人及行业观察者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.dwarkeshpatel.com/feed', 'dwarkesh.com', '商业与创业', 'Dwarkesh Patel 的播客与博客，聚焦 AI 发展前沿。内容涵盖 AI 训练机制与局限性、AGI 经济学影响、芯片与数学等深度技术话题，同时偶尔延伸至历史哲学思考。适合对 AI 技术原理、AGI 前景及跨学科讨论感兴趣的中高级读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://steveblank.com/feed/', 'steveblank.com', '商业与创业', 'Steve Blank 是硅谷资深创业导师、斯坦福大学教授，也是“精益创业”方法论的先驱之一。他的博客融合了课堂实践与前沿观察，涵盖创业方法论的迭代更新、国防科技与地缘政治变化，以及 AI 对商业与教育的影响。文字犀利务实，既有深度复盘，也有对趋势的前瞻思考。

**主要关注方向：**
- 精益创业与产品市场契合的实战方法
- 国防创新、无人机战争与国家安全议题
- AI 在教育与商业领域的应用与反思

**适合读者：** 创业者、投资人、国防科技从业者以及对创新方法论和地缘战略感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UCT5qXmLacW_a4DE-3EgeOiQ', 'The Browser Company', '商业与创业', '- 定位：The Browser Company 官方频道，分享 AI 浏览器 Dia 的使用技巧、产品更新与公司动态。

- 关注方向：Dia 浏览器产品演示（如决策辅助、任务管理、面试准备等场景）；浏览器功能更新与产品愿景；公司重大新闻（被 Atlassian 收购等）。

- 适合读者：对 AI 浏览器感兴趣的科技爱好者、关注 The Browser Company 产品或公司动态的用户。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://longform.asmartbear.com/index.xml', 'A Smart Bear', '商业与创业', 'A Smart Bear 是由创业者兼产品专家 Jason Cohen 运营的博客，聚焦创业实战与产品决策。

**主要关注方向：**
- **决策智慧**：批判性审视 RICE、OKR 等流行框架，探讨如何在不确定性中做选择
- **团队与成长**：招聘比己更强的人、建立能超越现有水平的团队，以及业务扩展
- **产品与市场**：目标市场定义、客户验证、避免过度优化

**适合读者：** 创业者、产品负责人，以及希望在实战中建立独立判断力的商业决策者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UCHoBKQDRkJcOY2BO47q5Ruw', 'MicroConf', '商业与创业', '- 1 句总体定位
- 2 到 3 个主要关注方向
- 1 句适合什么读者

MicroConf 是面向独立创业者的 SaaS 实战频道，由知名创业加速器 TinySeed 运营。

主要关注 SaaS 产品从零起步的实战方法、AI 在产品中的应用策略，以及独立开发者 / bootstrapped 创业的增长与营销思路。

适合正在或计划创办 SaaS 产品的独立创业者、微型 SaaS 创始人，以及关注自筹资金创业模式的开发者收听。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UCjIMtrzxYc0lblGhmOgC_CA', 'Every', '商业与创业', '**栏目介绍**

Every 是一个专注 AI 工具实测与应用的科技频道，涵盖 Fable 5、Codex、Claude Opus 等最新 AI 模型的深度体验，以及 AI 对开发者和职场人的实际影响。内容偏实践导向，适合想了解如何把 AI 用进工作流的科技爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UC6t1O76G0jYXOAoYCm153dA', 'Lenny''s Podcast', '商业与创业', '- **总体定位**: Lenny''s Podcast 是 Product-Led 增长领域最具影响力的播客之一，由 Lenny Rachitsky 主持，深度对话顶尖产品经理、创始人及 AI 领域的创新者，探讨产品、职业与 AI 时代的交叉议题。

- **主要关注方向**:
  1. **AI 与产品工作变革** — 探讨 AI 如何重塑产品开发流程，包括 AI 编程工具 Codex 的演进、工程师工作方式的变化，以及 AI 时代需要什么样的产品人才。
  2. **产品思维与判断力** — 聚焦「产品品味」(Taste) 在 AI 时代的重要性，探讨产品经理角色的未来、PRD 的价值，以及如何培养「知道该做什么」的直觉能力。
  3. **产品人职业发展** — 邀请 Anthropic、OpenAI 等头部 AI 公司的一线从业者，分享招聘趋势、职业焦虑的应对策略及成长路径。

- **适合读者**: 适合产品经理、产品设计师、创业者及任何关注 AI 如何影响科技行业工作方式的人。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UCoSvlWS5XcwaSzIcbuJ-Ysg', 'Notion', '商业与创业', '- **定位**: Notion 官方 YouTube 频道，聚焦产品深度使用与企业实践。

- **关注方向**:
  1. Notion AI 与 Claude 集成教程——从代码生成到任务自动化
  2. 企业协作与规模化案例——展示不同团队如何用 Notion 提升效率
  3. 创业思维与产品故事——Founder Fridays 系列分享创始人经验

- **适合读者**: 希望深度挖掘 Notion 潜力、用 AI 工具优化工作流的个人与团队。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://astralcodexten.substack.com/feed', 'Astral Codex Ten (Scott Alexander)', '文化与社会', '**栏目定位**：理性主义作家Scott Alexander的订阅博客，涵盖人工智能、预测市场、社会政治、科学文化等领域的深度分析，并设有定期开放讨论区供读者自由交流。

**主要关注方向**：
- AI技术发展与社会影响
- 预测市场与未来预测
- 政治、社会与科技的交叉议题

**适合读者**：对理性思维、预测分析、科技趋势感兴趣，且喜欢开放讨论的中英文读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://pluralistic.net/feed/', 'pluralistic.net', '文化与社会', 'Cory Doctorow 的个人博客，每日更新。他以尖锐的文风评析科技行业乱象，批判平台"趋坏"（enshittification）、大企业权力膨胀、AI伦理与数字版权等议题，也偶有书评与生活随感。

**主要关注方向：**
- 科技平台权力批判与数字权利
- AI技术伦理、审查与控制
- 社会政治观察（权力结构、媒体与 surveillance）

**适合读者：** 关注科技与社会关系、对大平台持批判态度的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://shkspr.mobi/blog/feed/', 'shkspr.mobi', '文化与社会', '**栏目介绍**

shkspr.mobi 是英国独立博主 Terence Eden 的个人博客，话题随性而广泛。博客关注**技术实践与网络安全**（PHP 开发、Auth0 配置、商务旅行数据安全），同时长期发布**书评**与**数码产品评测**，偶尔怀旧 BBC 往事。Terence 写作风格犀利直率，观点鲜明不随流，适合喜欢独立思考、技术背景较强的读者。

（约 148 字）', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://dynomight.net/feed.xml', 'dynomight.net', '文化与社会', '## 栏目介绍

这是一个“科学记者式”的独立写作空间，作者喜欢用数据思维重新审视生活中的常见说法——从止痛药选择、维生素D争议，到结肠癌数据、人类寿命的遗传性。标题常带反讽与括号里的补充语，论证过程偏重概率与比例感。

**关注方向：**
- 健康与医学：质疑维生素D、止痛药选择、癌症趋势
- 统计与认知：重新定义“遗传率”、hazard ratios 的局限性
- 技术与社会：LLM 实验、PPT 文化的多因果分析

适合喜欢“第二层思考”、不满足于媒体结论的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://garymarcus.substack.com/feed', 'garymarcus.substack.com', '文化与社会', '- 1 句总体定位
Gary Marcus 是知名的 AI 批评者，该栏目以独立视角审视 AI 行业的商业泡沫、技术局限与政策争议。

- 2 到 3 个主要关注方向
1. AI 行业商业困境：分析 OpenAI、Anthropic 等公司的竞争失利、IPO 危机与价格战
2. AI 政策与政治：评论华盛顿 AI 政策混乱、出口管制及政治干预对行业的影响
3. AI 泡沫批判：追踪 Generative AI "失去魔力" 的市场信号与行业警示

- 1 句适合什么读者
适合关注 AI 行业深层问题、希望听到不同于主流叙事的独立分析、对 AI 投资和政策感兴趣的中高级读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://timsh.org/rss/', 'timsh.org', '文化与社会', '- 一句总体定位
一个独立安全研究者的博客，关注网络诈骗、钓鱼攻击与隐私泄露的深度调查，同时分享技术实践心得。

- 两到三个主要关注方向
1. 网络安全调查：追踪加密货币 drainer、钓鱼网站、GitHub 诈骗等黑灰产手法
2. 隐私与数据安全：揭露位置数据泄露、应用追踪等隐私风险
3. 技术实践：AI 编程工具使用、自托管部署、以太坊技术科普

- 适合什么读者
适合对网络安全、隐私保护感兴趣的读者，以及想了解独立研究者如何挖掘网络黑灰产的开发者和技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.theatlantic.com/feed/author/derek-thompson/', 'derekthompson.org', '文化与社会', '- 1 句总体定位
美国《大西洋月刊》作者 Derek Thompson 的专栏，聚焦美国政治经济走向与科技变革的深度评论。

- 2 到 3 个主要关注方向
1. 特朗普政府的政策分析与批评（关税、贸易战、经济民粹主义）
2. 人工智能对就业市场和年轻人的冲击
3. 社会文化变迁与历史视角下的当代美国困境

- 1 句适合什么读者
适合关注美国政治经济走向、喜欢深度分析和历史比较视角的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://joanwestenberg.com/rss', 'joanwestenberg.com', '文化与社会', '- 1 句总体定位
独立作家 Joan Westenberg 的个人专栏，以跨学科视角探讨科技、文化、心理学与当代生活。

- 2 到 3 个主要关注方向
1. AI 与科技浪潮下的个体处境与决策困境
2. 认知心理学、历史故事与商业案例中的洞察
3. 语言批判、自我成长与创作方法的反思

- 1 句适合什么读者
适合喜欢深度长文、追求跨领域思考的独立思考者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.construction-physics.com/feed', 'construction-physics.com', '文化与社会', '- 定位：关注建筑、工程与基础设施领域，从历史、经济、技术等多角度深度探讨行业问题。
- 主要方向：基础设施建设的成本与效率问题；建筑行业生产力研究；建筑历史与文化。
- 适合读者：对建筑、工程、城市规划等领域感兴趣，希望了解行业深层问题的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feed.tedium.co/', 'tedium.co', '文化与社会', '**总体定位**
Tedium 是一位深度关注科技产业与互联网文化的独立评论博客，主编 Ernie TG 偏好从边缘视角切入，探讨那些被主流媒体忽略或正在消逝的数字化遗产与争议议题。

**主要关注方向**
- **互联网考古与数字怀旧**：从 Web 论坛、90年代个人主页到早期软件生态，挖掘早期互联网的技术遗产与文化记忆
- **科技产业动态与批判**：追踪硬件趋势、AI工具、媒体平台定价策略等行业变化，带有明显的独立立场与怀疑精神
- **边缘技术与消费电子**：关注被主流市场淘汰或"不完美"但有趣的硬件方案，如 eGPU、树莓派等DIY/小众产品

**适合读者**
如果你厌倦了千篇一律的科技媒体叙事，喜欢从技术史与文化视角理解数字时代的变迁，Tedium 能提供独特而深度的独立观察。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.wheresyoured.at/rss/', 'wheresyoured.at', '文化与社会', '**栏目定位：** 独立科技评论，专注于AI行业深度分析与泡沫风险警示。

**主要关注方向：**
- AI行业商业模式的可持续性（亏损、ROI问题）
- 硅谷科技泡沫与投资风险
- 大型科技公司（OpenAI、Anthropic、SoftBank）财务与战略分析

**适合读者：** 关注AI行业动态、对科技投资持批判视角、喜欢深度调查报道的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.filfre.net/feed/', 'filfre.net', '文化与社会', '## 栏目介绍

**filfre.net** 是一个专注于游戏历史与古典文学的深度写作博客，作者 Jim Carney 以“The Analog Antiquarian”与“The Digital Antiquarian”两个栏目交叉进行，兼具数字时代的游戏考古与传统时代的文学探幽。

**主要关注方向：**

- **经典 PC 游戏史**：深入挖掘《模拟城市》《异域镇魂曲》《Gabriel Knight》等经典作品背后的开发故事与文化脉络
- **古典文学解读**：以莎士比亚历史剧（《亨利六世》等）为线索，探讨文学经典的结构与魅力
- **游戏与文化的交汇**：追踪游戏如何吸收真实历史事件（如法国雷恩堡之谜）进行创作

**适合读者：** 对经典游戏发展史、古典文学研究有兴趣，偏好长篇深度分析而非简短资讯的玩家与文学爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://hugotunius.se/feed.xml', 'hugotunius.se', '文化与社会', '**栏目介绍**

hugotunius.se 是一个瑞典开发者的个人技术博客，涵盖软件开发实践、Rust 编程、隐私议题以及科技行业评论。文章风格理性务实，擅长将复杂话题（如 NFT、异步编程、iOS 隐私）拆解得清晰易懂，偶尔也会写写剑术杂耍这类轻松话题。

**主要关注方向**

- 软件工程：Rust 生态、GitHub 协作、代码发布实践
- 隐私与平台：应用隐私政策、侧载争议、社交媒体数据管理
- 科技评论：编程语言趋势、AI 工具使用、技术行业观察

**适合读者**

适合对软件开发感兴趣的工程师和技术爱好者，尤其关注隐私问题和 Rust 生态的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://gwern.substack.com/feed', 'gwern.net', '文化与社会', '## 订阅源介绍

**定位：** Gwern.net 个人网站的月度Newsletter汇总，收录网站内容更新、链接推荐与近期动态。

**关注方向：**

- **深度技术研究**：涵盖机器学习、编程、人工智能等领域的实践与实验
- **跨学科长文**：遗传学、心理学、经济学等方向的调研与分析
- **网站更新追踪**：作者本人的项目进展与网络资源导航

**适合读者：** 喜欢系统性深度阅读、对技术实验和跨领域研究感兴趣、习惯跟进长篇一手资料的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://simone.org/feed/', 'simone.org', '文化与社会', '一个关于现代生活困境的私人博客，关注科技与人文、内省与成长的交叉地带。

**主要关注方向：**
- 科技批判：AI摄影的本质、设备哲学与隐私反思
- 创造力与工作：反 portfolio 建议、注意力战争、效率悖论
- 内省与社会观察：愤怒与原谅、消费主义反思、想法与真实体验

**适合读者：** 对技术时代人文反思有需求，不满足于简单答案、喜欢在矛盾中思考的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://hey.paris/index.xml', 'hey.paris', '文化与社会', '这是一个来自澳大利亚塔斯马尼亚的个人博客与项目记录，作者兼具独立游戏开发者、作家和媒体撰稿人身份。

主要关注方向：

- 独立游戏开发与叙事引擎 Yarn Spinner 的技术实践与创作心得
- 塔斯马尼亚本地的环境议题（如森林保护、AI 数据中心争议）与文化政策
- 主持 ABC 电台 Hobart 分台的月度太空新闻节目

适合对澳大利亚游戏开发、社区媒体或塔斯马尼亚公共议题感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.experimental-history.com/feed', 'experimental-history.com', '文化与社会', '- 一句总体定位：一个融合历史趣闻、社会观察与文化评论的个人博客，以独特的视角挖掘那些"被遗忘却值得被记住"的故事。
- 主要关注方向：
  1. 历史冷知识与被遗忘的文化故事（如90年代音乐界奇闻、苏联宪法趣谈）
  2. 科学方法与学术界的反思（如 replication crisis、可复现性问题）
  3. AI时代的人类处境与社会文化现象评论
- 一句适合读者：对知识保持好奇、喜欢有深度但不失趣味的独立思考文字的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://anildash.com/feed.xml', 'anildash.com', '文化与社会', '## 订阅源简介

Anil Dash 的个人博客，聚焦科技产业动态与数字文化批判。技术老将，以独立视角审视AI发展路径、平台权力与开放网络未来。写作兼具行业洞察与人文关怀。

**主要关注方向：**
- AI平台竞争与去中心化可能
- 开放Web、隐私权利与数字治理
- 科技文化评论、创意艺术

**适合读者：** 关注科技行业深度评论、重视独立声音的从业者与思考者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://waitbutwhy.com/feed', 'Wait But Why', '文化与社会', '**栏目介绍**

Tim Urban 的个人博客，以深度长文和幽默坦诚的笔触著称。文章话题跨度极广：既有对科技产品的亲身体验与思考，也有关于人生阶段（育儿、旅行、成长）的真诚分享，还会就社会热点进行深度分析。行文风格轻松有趣，擅长把复杂话题讲得引人入胜。适合喜欢深度阅读、追求有趣灵魂、偶尔想听听有人把话说得透彻又好看的中文英文双语读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://fs.blog/feed/', 'Farnam Street', '文化与社会', '## 栏目介绍

Farnam Street 是一个分享「经过验证的智慧」的播客与博客平台，帮助读者做出更好的决策、过更好的生活。

**主要关注方向：**
- **商业洞察与创业经验**：采访成功企业家、投资人、行业领袖的第一手分享
- **思维工具与决策方法**：心理模型、认知框架、系统性思考等实用方法论
- **个人成长与表现提升**：心理韧性、学习策略、绩效优化与生活哲学

**适合读者：**
渴望通过向各领域顶尖人物学习，持续拓宽认知边界、提升决策质量的终身学习者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.smashingmagazine.com/feed/', 'Smashing Magazine', '设计、摄影与视觉', '**Smashing Magazine** 是面向网页开发者与设计师的专业技术刊物，聚焦 UI/UX 设计、前端开发实践与可访问性方案。近期关注 AI 工具对设计流程的重塑、设计系统构建、以及通过真实用户研究提升产品质量。适合追求前沿技术、注重设计质量的前端工程师、产品设计师和用户体验从业者订阅。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://alistapart.com/main/feed/', 'A List Apart', '设计、摄影与视觉', '**栏目介绍**

A List Apart 是美国知名网页设计专业博客，每期深度探讨设计实践与理念。订阅源主要关注三大方向：**网页设计与用户体验**——从界面细节到整体体验；**无障碍与包容性设计**——探讨如何让网络对所有人更友好；**设计方法论与领导力**——覆盖设计系统、团队协作、创意工作方法等进阶话题。适合网页设计师、UX从业者及对设计有深度兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UC6Z_Gbfo7xwSMs6Ahkv-m3Q', 'Art21', '设计、摄影与视觉', '## Art21 频道介绍

Art21 是当代艺术领域的深度观察者，通过纪录片形式记录全球艺术家的创作思考与生活哲学。

**主要关注方向：**
- 当代艺术创作理念与艺术家心路历程
- 艺术与社会议题的对话（如身份认同、中产阶级处境）
- 跨媒介艺术探索（装置、摄影、表演等）

**适合读者：**
对当代艺术、创意文化感兴趣，想了解艺术家如何以作品回应时代与个人经验的朋友。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://rsshub.rssforever.com/natgeo/dailyphoto', 'Nat Geo Photo of the Day', '设计、摄影与视觉', '**栏目介绍**

每日精选国家地理摄影师创作的优秀作品，涵盖全球人文风情、自然生态与科学发现。这里既有亚洲乡村的民俗传统、欧洲节日的虔诚瞬间，也有海洋生物的微观世界和自然景观的宏大视角。通过影像记录地球上的多样生命与文化，适合喜欢人文地理、自然科普和摄影艺术的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UCc7UU0Pd6sZKzYkC-NRvdlw', '东胶影厂', '设计、摄影与视觉', '东胶影厂是一个专注胶片摄影的频道，兼顾技术与艺术讨论。栏目主要关注传统暗房工艺与胶片冲洗技法，追踪胶片摄影在当代艺术中的位置与价值，并分享摄影书、展览及实拍旅行等内容。适合对胶片摄影感兴趣、想了解暗房技术或当代摄影艺术的中文观众。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UCNhMSkTefqXoQjwIdAwi5Gw', '过片Thumb Action', '设计、摄影与视觉', '- **1句总体定位**：专注于胶片摄影的中文频道，涵盖相机收藏、胶片评测与大画幅创作。

- **2到3个主要关注方向**：
  - 胶片相机收藏与使用体验（涵盖大画幅、旁轴、双反、宽幅等多种机型）
  - 胶卷实测与成像风格探索
  - 经典光学设备的开箱、评测与工厂探秘

- **1句适合什么读者**：适合热爱胶片摄影、追求慢拍体验的玩家，以及对大画幅相机、经典镜头有兴趣的摄影爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UC0Vjgs42ZJ9E9HiILq2D9Yw', 'Bobby Tonelli', '设计、摄影与视觉', '**栏目定位：** 高端相机与便携摄影设备的专业实拍频道，涵盖中画幅相机使用技巧、配件推荐及摄影装备评测。

**主要关注方向：**
- Hasselblad、Leica 等中画幅/全画幅相机的实拍体验与功能解析
- DJI Pocket 系列等便携设备的设置与配件推荐
- 摄影工作流相关的存储设备、软件工具及实用配件

**适合读者：** 追求画质与拍摄体验的中高级摄影爱好者，以及关注高端器材与便携解决方案的专业用户。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UCewPGlHNXWRlC5zcD_I8YdA', 'Chris in Photography', '设计、摄影与视觉', '探索胶片摄影世界的个人频道，Chris通过实战拍摄和器材评测分享他的摄影生活。

主要关注方向：

- 胶片摄影实战：涵盖黑白与彩色胶片的实拍体验
- 相机镜头评测：包括国产与海外品牌的LTM接口镜头、中大画幅器材
- 暗房与胶片数字化：传统暗房冲洗与数码化翻拍技术

适合对胶片摄影有兴趣、喜欢器材评测和实战拍摄分享的摄影爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UCJQcBYfgescGRJUzU6IMCMw', 'Kyle McDougall', '设计、摄影与视觉', '## 栏目介绍

Kyle McDougall 是一位专注于胶片摄影的创作者，频道内容涵盖胶片拍摄、相机收藏与修复、暗房冲印等完整创作流程。视频风格以实拍记录为主，展现传统摄影工艺的魅力与乐趣。

**主要关注方向：**

- 胶片摄影创作（涵盖大画幅4×5、中画幅120、全景等多种规格）
- 老相机修复与收藏（高价位胶片器材、经典机型体验）
- 暗房冲印技术（彩色暗房、黑白冲洗与印相）

**适合读者：** 对胶片摄影有浓厚兴趣、希望了解传统暗房工艺或收藏经典相机设备的摄影爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UC3DkFux8Iv-aYnTRWzwaiBA', 'Peter McKinnon', '设计、摄影与视觉', '## 订阅源简介

**总体定位**

Peter McKinnon 的官方频道，主要分享摄影器材评测、拍摄技巧与个人成长体验。

**主要关注方向**

- 摄影器材：相机、镜头新品评测与推荐
- 摄影技巧：拍摄方法与创意灵感分享
- 生活方式：记录习惯养成、创作动力激励

**适合读者**

热爱摄影、关注器材动态，并希望提升拍摄技能与创作动力的观众。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.youtube.com/feeds/videos.xml?channel_id=UC7T8roVtC_3afWKTOGtLlBA', 'The Art of Photography', '设计、摄影与视觉', '- 定位：深入探索摄影艺术与生活方式的独立影像频道，兼具器材评测与创作理念分享。
- 关注方向：相机器材体验与评测、肖像与纪实摄影创作手法、摄影文化与跨界艺术（工作坊、摄影书、诗歌等）。
- 适合读者：热爱摄影、注重拍摄体验与影像表达进阶的爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feeds.feedburner.com/GretchenRubin', 'Gretchen Rubin', '个人成长与生活', '**Gretchen Rubin** 是畅销书《幸福习惯》作者，专注于研究如何通过建立好习惯让生活更幸福、更充实。

主要关注方向：
- **幸福与习惯养成**：探讨如何设计日常生活、培养简单有效的习惯提升幸福感
- **育儿与家庭关系**：分享成为更快乐、更冷静父母的实用方法
- **整理与有序生活**：提供处理杂物、保持生活井井有条的技巧

适合希望改善生活习惯、提升日常幸福感，对自我成长和实用生活哲学感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://sive.rs/en.atom', 'Derek Sivers', '个人成长与生活', '## 订阅源介绍

**总体定位**
Derek Sivers 是著名独立音乐企业家、畅销书《Linchpin》合著者，他的个人博客分享对创业、独立生活与人生智慧的深度思考。

**主要关注方向**

- **独立创业与创作者经济**：以亲身经历探讨如何作为独立工作者建立事业
- **生活哲学与自我认知**：包括如何说“不”、读书的意义、创作心态等实用人生建议
- **旅行见闻与跨文化观察**：在东南亚、印度等地与人交流的感悟

**适合读者**
对独立创业、个人成长、深度阅读和跨文化旅行感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://austinkleon.com/feed/', 'Austin Kleon', '个人成长与生活', '## 栏目介绍

Austin Kleon 是畅销书《Steal Like an Artist》作者，定期在博客分享创作心得、zines 和播客 mixtape。最近正值其新书《Don''t Call It Art》出版期，栏目围绕“像孩子一样创作”的主题展开，同时记录他的日常灵感——从德州奥斯汀的音乐广播到后院的猫头鹰雏鸟。

**主要关注方向：**

- 创作方法与灵感来源
- 新书推广与创作访谈
- 日常生活中的艺术实践（zines、音乐、手写信）

**适合读者：** 对写作、创意和艺术感兴趣的读者，尤其喜欢从日常小事中汲取灵感的人。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://calnewport.com/feed/', 'Cal Newport', '个人成长与生活', '**栏目介绍**

关注数字时代的深度工作与理性思考。由乔治城大学计算机科学副教授 Cal Newport 主持，栏目对 AI 与工作、效率与科技等议题保持批判性审视，警惕技术炒作与流行谬论，帮助读者在喧嚣中保持清醒判断。

**主要关注方向：**
- AI 对工作场所的实际影响与常见误解
- 深度工作、专注力与数字生活管理
- 技术变革中的批判性思维与社会反思

**适合读者：** 知识工作者、科技行业从业者及关注 AI 影响、重视深度思考的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://jamesclear.com/feed', 'James Clear', '个人成长与生活', '- **1句总体定位**: James Clear 是《纽约时报》畅销书《原子习惯》作者，专注于分享基于证据的习惯养成与个人提升策略。

- **2到3个主要关注方向**:
  1. **习惯养成科学**——如何通过微小改变建立好习惯、戒除坏习惯，包含习惯追踪、计分卡等实用工具
  2. **效率与生产力**——探讨专注、拒绝不重要之事、80/20法则等提升效能的思维框架
  3. **年度反思与成长**——以年度回顾形式分享自我检视、设定方向的成长方法论

- **1句适合什么读者**: 适合希望从日常细节入手、持续精进的读者，无论是职场人士、自我提升爱好者，还是对行为科学感兴趣的人。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://macshuo.com/?feed=rss2', 'MacTalk', '中文阅读', '**MacTalk**

关注 AI 时代的产品开发与技术创新，涵盖 AI 模型动态、产品构建手记（如 CatReader、墨问系列）、中美 AI 产业观察以及 Vibe Coding 等前沿开发方式。适合技术从业者、AI 爱好者与独立开发者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('http://www.qncd.com/?feed=rss2', '尺宅杂记', '中文阅读', '**尺宅杂记**是一个人文社科类的读书笔记专栏，作者以文会友、以书会友，记录阅读各类书籍的思考与感悟。

**主要关注方向：**
- **古典阅读**：品读纪昀、欧阳修、周敦颐等古人经典篇章
- **人文社科**：涵盖人类学、社会学、考古、建筑、数学科普等领域的书籍
- **教育漫谈**：与Mondo的对谈系列，探讨学习与成长之道

**适合读者：** 热爱阅读、喜欢在书卷中寻找生活智慧与思想共鸣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://tumutanzi.com/feed', '土木坛子', '中文阅读', '一个在海外工作生活的工程师分享投资理财学习笔记、AI科技观察与人生感悟的个人博客。

主要关注方向：境外投资（美股ETF、美债、港美券商开户）、人工智能应用与思考、个人成长与感悟。

适合想了解海外投资实操、关注AI发展，同时喜欢阅读独立思考者随笔的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://coolshell.cn/feed', '酷壳 – CoolShell', '中文阅读', '**酷壳 – CoolShell** 是知名技术博主陈皓的个人站点，聚焦系统架构、软件工程与新兴技术深度解读，兼具技术人文思考。文章涵盖微服务与架构权衡、AI工具评析、去中心化协议洞察等前沿话题，也会探讨职场与团队协作。风格犀利务实，常以实际案例拆解技术本质。适合中高级开发者、架构师及对技术深度有追求的从业者订阅。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://dbanotes.net/feed', 'DBA Notes | 闲思录', '中文阅读', '**栏目定位：**

一位资深技术人（DBA出身）的个人观察与随笔集，涵盖互联网趋势预测、数据库行业观点、新加坡生活见闻，以及对科技热点的独立思考。

**主要关注方向：**

1. **互联网趋势预测**：每年初发布对互联网行业走向的预测与展望，带有反思与自嘲风格
2. **技术行业观察**：从从业者视角评析国产数据库、技术平台等产品与现象
3. **新加坡日常**：记录当地文化差异、法律生活、中文词汇等海外见闻

**适合读者：**

对互联网科技趋势有好奇心的读者，以及喜欢独立思考、有一定技术背景的互联网从业者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feeds.feedburner.com/ruanyifeng', '阮一峰的网络日志', '中文阅读', '**栏目介绍：**

阮一峰的网络日志是一个技术分享博客，作者是知名技术博主。每周五发布《科技爱好者周刊》，内容涵盖人工智能、软件开发、创业投资、行业观察等科技热点。文章风格轻松易懂，选取当周值得关注的科技话题，配以精美封面图，既有深度分析也有趣味科普，适合对科技感兴趣的程序员、产品经理及普通科技爱好者阅读。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://blog.codingnow.com/atom.xml', '云风的 BLOG', '中文阅读', '云风是知名游戏程序员的个人技术博客，专注于游戏设计思考与编程技术实践，同时记录读书、运动等生活点滴。

**主要关注方向：**
- 游戏设计分析：深度拆解《缺氧》《异星工厂》《群星》等经典游戏的机制与设计理念
- 编程技术实践：涉及排序算法、Lua 虚拟机、动态链接等底层技术话题
- 游戏化生活：读书心得、健身记录、桌游体验

**适合读者：** 游戏开发者、程序员，以及对游戏设计和个人效率提升有兴趣的技术爱好者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://baoyu.io/feed.xml', '宝玉的分享', '中文阅读', '宝玉的分享聚焦 AI 编程工具与软件开发的前沿实践，涵盖 Codex、Claude 等主流 AI Agent 的深度使用指南，以及 AI 时代工程团队管理、技术职业发展等话题。关注大模型如何重塑代码开发、验证流程与团队协作，适合希望借助 AI 提升研发效能的开发者与技术管理者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://feeds.feedburner.com/kenengbarss', '可能吧', '中文阅读', '可能吧是互联网老兵阿禅的个人观察专栏，记录他对科技产品、行业趋势的独立思考，以及一位中年互联网人面对职场选择与生活状态的真实感悟。内容涵盖AI工具使用体验、短视频平台分析、技术趋势解读，偶尔也会聊聊创业经历和中年焦虑。

如果你对互联网行业有好奇心，想听听从业者不带滤镜的观察和分享，这个订阅源值得一读。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://blog.ursb.me/feed.xml', 'Airing 的博客', '中文阅读', '- 1 句总体定位：记录软件开发与 AI 实践的个人博客，融合技术深度与生活思考。

- 2 到 3 个主要关注方向：
  - AI 时代下的编程工作：探讨 AI 如何重塑软件开发流程，以及人机协作的实践
  - 技术实践与工程经验：涵盖游戏引擎、性能优化等实际项目中的技术探索
  - 生活记录与认知思考：通过月刊形式分享阅读心得、哲学思辨与个人成长

- 1 句适合什么读者：对 AI 辅助编程、技术实践有兴趣，同时关注个人成长与生活思考的软件开发者或独立创作者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://onevcat.com/feed.xml', 'OneV''s Den', '中文阅读', '## OneV''s Den 栏目介绍

**总体定位:** 资深 iOS/Swift 开发者 onevcat 的个人技术博客，分享 AI 时代下的开发实践与思考。

**主要关注方向:**
- AI Agent 开发工作流与工具实践（Claude Code、版本控制、自动化）
- Swift/iOS 开发技术深度探索
- 开发效率工具与终端技术

**适合读者:** iOS 开发者、对 AI 辅助编程实践感兴趣程序员。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.douban.com/feed/people/fenng/interests', 'Fenng 的收藏', '中文阅读', '**栏目介绍**

这是科技圈知名人士 Fenng 的豆瓣私人阅读收藏。订阅源以书籍和影视为主，兼具人文历史与文学创作，阅读口味偏向严肃深刻，涵盖中外历史、社会思考与艺术评论。

**主要关注方向**

1. **历史与社会观察**：收藏《安史之乱》《中国一九五七》《杰克逊时代的美国》等历史著作，关注欧洲种族思想演变等议题
2. **文学与创作**：追踪文学创作方法论、散文集如《生活蒙太奇》等作品
3. **经典影视**：标记国产老电影与华语Cult片

**适合读者**

适合喜欢跨领域深度阅读、对人文历史和经典影视有兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.douban.com/feed/people/ousia/interests', '爛貓 的收藏', '中文阅读', '## 订阅源介绍

这是一份偏重哲学思辨的读书收藏，涵盖西方哲学（怀疑论、现象学、心智哲学）与中西古典研究（经学、中国哲学、历史文献）。同时关注认知科学、赛博格等跨学科议题，探索技术与人类心智的交汇。

**适合读者：** 对哲学思考、认知科学及中西古典文化感兴趣，且喜欢探索思想跨界融合的深度阅读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.douban.com/feed/people/ice_cold_sun/interests', 'Noir 的收藏', '中文阅读', '一位关注日本流行文化的豆瓣用户收藏，内容以日剧、日本电影、日本动画为主，同时涉猎日本耽美漫画。偶尔会记录心理学科普读物。适合想了解日本影视动画圈动态及BL文化推荐的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.douban.com/feed/people/C-H-A-K-A/interests', 'chaka 的收藏', '中文阅读', '「chaka 的豆瓣收藏」是一个聚焦小众音乐与独立阅读的私人清单。音乐方面以独立、实验或小众厂牌为主，风格横跨华语独立与海外小众艺人；阅读则兼及古典文献与奇幻文学，整体气质偏文艺、偏好非主流审美。这个订阅源适合喜欢探索小众文化、对独立音乐和冷门读物感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.douban.com/feed/people/aidiren/interests', '爱地人 的收藏', '中文阅读', '**栏目介绍：**

这是一个关注文学阅读与影视音乐的私人收藏。订阅者对书籍尤其是文学、历史类作品有持续兴趣，评价认真且态度分明；对影视作品涉猎广泛但不吝批评；偶尔分享音乐聆听记录。适合喜欢文学阅读、关注华语影视，并能接受直率评语的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.douban.com/feed/people/ggguai/interests', 'mibo lost 的收藏', '中文阅读', '一个文艺爱好者的个人收藏，记录漫画、电影与音乐阅读痕迹。

主要关注方向：

- **漫画与图像小说**：收录日本漫画如《香蕉鱼》，关注出版形式与阅读体验
- **艺术电影与纪录片**：偏好小众电影节影片，涵盖吉普赛历史、印度电影等多元文化主题
- **音乐**：关注台湾独立音乐，常带有个人情感备注

适合喜欢文艺片的影迷、日漫爱好者，以及对个性化观影/阅读记录感兴趣的人。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.douban.com/feed/people/anchoretic/interests', '王韧勉 的收藏', '中文阅读', '**栏目介绍**

这是一个偏重人文社科的私人阅读收藏，涵盖历史（清史、古罗马、民俗）、电影批评与艺术评论，以及文化研究与哲学思想三大方向。阅读口味偏重知识性与批判视角，关注社会现象背后的文化肌理。适合对人文社科、影评及跨领域思考感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.douban.com/feed/people/63328717/interests', 'Karma_ 的收藏', '中文阅读', '- **1 句总体定位**：记录观影、阅读与生活碎片的个人收藏，偏爱轻松娱乐与实用知识。

- **2 到 3 个主要关注方向**：① 电影与剧集评论，涵盖商业大片与文艺片；② 育儿怀孕相关书籍，如《海蒂怀孕大百科》等实用指南；③ 社会纪实与人文阅读，关注中国村镇等现实题材。

- **1 句适合什么读者**：适合想寻找轻松影评推荐或孕期阅读书单的人。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
INSERT INTO rss_feeds (xml_url, title, category, intro, created_at) VALUES ('https://www.douban.com/feed/people/17289918/interests', 'Demosthenes 的收藏', '中文阅读', '## 栏目介绍

**Demosthenes** 的豆瓣收藏以德语学习和文学影视为主。

**主要关注方向：**
- **德语学习**：通过分级读物和侦探故事积累词汇，对这类材料既依赖又嫌弃
- **科幻与经典文学**：从《平面国》到《攻壳机动队》，涉猎广泛
- **影视作品**：韩剧、电影、动画都有涉及

**适合读者：** 对德语学习资源推荐和文学科幻感兴趣的读者。', 1783642979970) ON CONFLICT(xml_url) DO NOTHING;
