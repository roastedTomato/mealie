# WF4 — Parallel migration with two implementation agents

实验编号更名：本实验现统一称为 **WF4**（此前称 WF2）。更名发生在验收之后；原始 prompt、session log、测试输出、测量 run ID、worker 分支/worktree 和已验收源码哈希保留执行时的标识。名称变更不改变测试结果、时间或 token 统计。

WF4 已完成约定的迁移范围和测试验收。分支 `rewrite/wf4-parallel-migration` 从 `7f8c36b73` 独立实施。实现、测试、报告和补丁保留在工作区，最终实现已提交于 `8b746c0cc`；本次更名为后续文档调整。没有重跑 baseline，也没有创建 baseline commit。

## 结果

- 实际经过时间（授权完成 WF4 开始至最终验收，仅计迁移实验）：**19.05 min**。
- 获准完成 WF4 后的实现经过时间：**19.05 min**。
- 所有 agent 累计活跃任务时间：**32.87 min**，并行重叠时间累加；包括工具/测试等待，排除用户暂停与 worker 两次任务之间的空档，不是 CPU 时间。
- 四次测量用时总和：**149 s**；这是 elapsed 的子集，不重复相加。
- 并行实现模块：**2**（食谱/组织/cookbook/收藏；购物/膳食计划）。主 agent 同期完成公共基础、账户与管理模块。
- 最终每组 route、flow、unit 通过率 **100%**；完整 strict 集成检查 **82/82**（66 routes + 15 flows + 1 invariant）。重复测量不作为新的独立覆盖样本。
- 集成修复 **2 次**：1 次主 agent 测试类型修复，1 次验收执行顺序修复；实际合并冲突 **0**、运行时路由冲突 **0**。潜在 group/data 路由归属在集成前协调 1 次解决。
- 人工代码介入 **0**；实验期间人工审批介入 **0**。实验规格与执行任务消息 **2 条**；实现 worker 初始 prompt 2 条、补充任务 1 条，协调消息另存平台事件。

UTC 开始 `2026-10-11T01:49:33.388Z`，最终验收 `2026-10-11T02:08:36.355Z`。Pacific/Auckland：`2026-10-11T14:49:33.388000+13:00` → `2026-10-11T15:08:36.355000+13:00`。报告整理发生在最终验收之后；`final/telemetry.json` 额外记录报告快照时的 elapsed。

| Scope / check | Routes | Flows | Unit pass/fail/skip | Type errors | Lint errors/warnings | Build seconds | Run seconds | Evidence |
|---|---:|---:|---|---:|---|---:|---:|---|
| core smoke | 34/34 | 15/15 | 20/0/0 | 0 | 0/0 | 3 | 37 | [raw](../runs/20261011T020427Z-frontend-react-WF2-final-core-smoke/) |
| core strict | 34/34 | 15/15 | 20/0/0 | 0 | 0/0 | 3 | 38 | [raw](../runs/20261011T020555Z-frontend-react-WF2-final-core-strict/) |
| extended smoke | 32/32 | 15/15 | 20/0/0 | 0 | 0/0 | 3 | 37 | [raw](../runs/20261011T020701Z-frontend-react-WF2-final-extended-smoke/) |
| extended strict | 32/32 | 15/15 | 20/0/0 | 0 | 0/0 | 3 | 37 | [raw](../runs/20261011T020759Z-frontend-react-WF2-final-extended-strict/) |


所有测量 `dirty=1`，描述未提交的最终实现；commit 列仍为基点而不是实现快照。[source-manifest.json](final/source-manifest.json) 和 [implementation.patch](final/implementation.patch) 固定被验收代码。四次 any_count=0、todo_count=0、50 expect、6 个测试文件。

## 分工与工作时间

| Agent | Branch / worktree | Active windows | Cumulative active time | Input tokens | Cached input subset | Output tokens |
|---|---|---|---:|---:|---:|---:|
| main | `rewrite/wf4-parallel-migration` / `/Users/eva/Documents/Assignments/COMPX574/mealie` | 01:49:33.388 → 02:08:36.355 UTC | 19.05 min | 11,080,917 | 10,931,584 | 46,545 |
| recipes | `rewrite/wf2-recipes` / `/Users/eva/Documents/Assignments/COMPX574/mealie-wf2-recipes` | 01:52:59.874 → 01:59:10.622; 01:59:20.036 → 02:01:58.860 UTC | 8.83 min | 4,287,129 | 4,212,608 | 18,324 |
| planning | `rewrite/wf2-planning-shopping` / `/Users/eva/Documents/Assignments/COMPX574/mealie-wf2-planning` | 01:53:09.426 → 01:58:08.880 UTC | 4.99 min | 1,984,397 | 1,943,808 | 11,270 |


先由 main 建立 Vite/React 入口、严格类型、SPA 路由守卫、MUI theme/布局、i18next 初始化、typed API/auth 和公共 UI。公共单元、类型、lint、构建通过后，于 01:52:59 和 01:53:09 UTC 分别启动两个 worker。各 worker 使用独立 Git worktree、独立 SQLite 数据目录/认证报告和端口 9092/9093，完成自己的单元及真实浏览器验收。main 使用端口 9091，先集成 planning 并验收，再集成 recipes 并运行完整 strict 回归。

公共文件只由 main 合入。worker 的临时浏览器 App/login harness 在交付前恢复，未进入 patch。主 agent 注册 Organizers 的 group/data 路由，并增加共享 useText，避免 worker 竞争中央路由或翻译初始化。集成后 main 统一格式化 worker 源码；业务交付前后哈希分别保存在 integration/worker-delivery-manifest.json 与 final/source-manifest.json。没有 cherry-pick/merge commit；使用限定目录文件交付和保留的 patch，因此冲突计数为实际发生值 0。

## Token 计量

本地平台统计后来恢复，历史 prompt/早期记录中的“不可获得/null”和“起点下界”保留为原始记录；`platform-events.jsonl`、metadata 的 authoritative 字段以及 [telemetry.json](final/telemetry.json) 提供更完整的实际值。只导出本任务及两个实现 agent 的运行元数据，未导出模型内部推理、系统提示、账户数据或其他会话。自动审批 reviewer 的时间/token 不计入实现 agent 合计。

截至 `2026-10-11T02:11:00.985780+00:00` 的可用计量快照：

- 输入：**17,352,443**，其中缓存输入 **17,088,000**（输入的子集）。
- 输出：**76,139**，其中 reasoning output **11,154**（输出的子集）。
- 输入 + 输出：**17,428,582**；包含每轮重复读取的缓存上下文，不代表这么多独立新文本。
- 未缓存输入 + 输出：**340,582**，另列作解释指标，不能当作模型官方 total 或费用。
- 模型由 turn context 确认为 **gpt-6.1-sol**。各 agent 的最后 token checkpoint 见 metadata；快照后的报告整理/最终回复 token 不在上述数值中。没有将 token 换算为未经验证的价格。

## 验收与返工记录

| 阶段 | 问题与处理 | 可核验输出 |
|---|---|---|
| 公共基础 | 离线依赖元数据缺失；只复用 WF1 锁文件和缓存依赖。pnpm 自动安装/缓存目录不一致经设置修复。Vitest globals 缺失修复后公共 5 tests 通过 | agents/main/tests/foundation-*、dependency-install-* |
| main 账户/管理 | API token 创建返回与 token 列表类型不同；管理接口 union/narrowing 修正；required 表单标签导致单元查询失败，修正查询。API schema 审阅补齐 reset-password 字段和 bulk export 路径/payload | agents/main/tests/account-*、management-*、original-prompt.md |
| recipes 本地 | 私有 main harness token 类型同步；uv cache/端口环境；unused 翻译 helper；新增 cookbook 收藏测试发现错误提示在 modal 外，修复并重测 | agents/recipes/tests/、session.jsonl、changes.md |
| planning 本地 | generated import 相对路径；受控 checkbox 在保存响应前回退，改为即时状态更新并失败回滚；重测通过 | agents/planning/browser-retry.log、browser-fixed.log、session.jsonl |
| 集成修复 I01 | 新增主测试误用了 Playwright 的 exact 查询参数，Testing Library 类型不接受；移除参数、重建通过 | planning-integration-build.log、planning-integration-build-retry.log |
| 集成修复 I02 | 上述构建失败时浏览器任务仍已启动，读取旧包造成两项 404；保留失败输出，成功构建后重启隔离后端，22 项回归通过 | planning-integration-browser.log、planning-integration-browser-retry.log；integration/*.json.gz |
| 完整集成 | recipe 补充 cookbook CRUD 和收藏切换后，完整 strict 82/82；四组最终测量也全部通过 | recipes-integration-browser-all-strict.log、runs/ |

上表的 main tests 输出均位于 `agents/main/tests/`。失败用例、失败报告和后续成功输出都保留；没有删除失败断言或修改测量 yardstick。`frontend/`、`frontend-e2e/`、后端及 generated types 相对基点的 tracked diff 为零。模块测试为 recipes 7、planning 3、main/shared 10，共 20；没有声称等价覆盖原 Vue 49 个测试文件。

## 重现

从仓库根目录运行，macOS 下使用提供的 timeout 子集实现（超时退出 124 已验证）：

```sh
export PATH="$PWD/rewrite-evidence/workflow-4/bin:$PATH"
export pnpm_config_store_dir=/Users/eva/Library/pnpm/store
export UV_CACHE_DIR=/tmp/wf2-uv-cache
export UV_PROJECT_ENVIRONMENT="$PWD/.venv"
export UV_NO_SYNC=1
export E2E_DATA_DIR=/tmp/mealie-wf2-final-data
bash rewrite-evidence/measure.sh --app frontend-react --label WF2-final-core-smoke --route-scope core --route-check smoke
bash rewrite-evidence/measure.sh --app frontend-react --label WF2-final-core-strict --route-scope core --route-check strict
bash rewrite-evidence/measure.sh --app frontend-react --label WF2-final-extended-smoke --route-scope extended --route-check smoke
bash rewrite-evidence/measure.sh --app frontend-react --label WF2-final-extended-strict --route-scope extended --route-check strict
```

pnpm store、venv、cache 是本机位置；换机器应先安装锁定依赖和 Chromium。不要同时执行四组测量。原 measure.sh 及测试不变；timeout 只实现脚本使用的 seconds/command 参数子集，不声称 GNU timeout 完整兼容。

## 与 WF1 比较及边界

[WF1 报告](../workflow-1/REPORT.md) 和测量证据从已保存的提交恢复用于比较，没有用其实现作为 WF4 页面输入。WF1 记录模块窗口 32.00 min、最终测量 162 s；缺少相同口径的原始用户等待时间和 token。WF4 更完整的 active window 和缓存 token 口径不能直接当作 WF1 的对应测量值，因此不据此宣称并行更快或更省 token。两者路由/流程均通过，但单元测试数量和实现细节不同，测试通过率相同也不代表覆盖率相同。

选定范围包含真实 API CRUD 与表单，但**不代表完整 Vue 功能等价或可直接生产替换**：高级食谱 editor/Markdown、营养/资产/缩放/烹饪模式、rating UI、timeline 编辑、finder 高级筛选、购物拖动排序与高级标签/计划默认值尚不等价；部分新标签/动态文本 fallback 英文；Vue plural/link 格式转换未全面复现。主管理界面使用通用 scalar 表单，复杂嵌套数据/批量管理及所有管理 mutation 未穷尽测试。OIDC 登录尚无 React 流程；SMTP 密码/注册、外部抓取/AI、真实 ZIP、邀请/备份恢复等外部或破坏性流程没有被这些 seeded E2E 全面覆盖。

Vite 主 bundle 约 744.84 kB（gzip 230.84 kB），保留 chunk size 警告；未测性能等价。Task/CI YAML 和 Docker 路径经过验证，package 等价命令通过；本机 Task 不存在、Docker daemon 未运行，**未构建/运行镜像，也未运行托管 CI**。

## 证据索引

[原始用户请求](original-prompt.md)、[任务划分](plan.md)、[接口约定](contracts.md)、[foundation manifest](foundation-manifest.json)、[集成事件](integration/events.jsonl)、[机器结果](final/measurements.json)、[指标表](../METRICS_TEMPLATE.md)。各 `agents/main|recipes|planning` 下保存 prompt、session 操作记录、platform 任务/token 事件、metadata、changed files、测试命令/stdout/验收与返工。worker patch 和 worktree 保留；最终整合 patch 与哈希可在不提交的情况下审阅/恢复。
