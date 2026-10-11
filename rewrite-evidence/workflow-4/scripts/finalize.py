from pathlib import Path
from datetime import datetime,timezone
from zoneinfo import ZoneInfo
import csv,json,hashlib,subprocess,gzip
root=Path(__file__).resolve().parents[3];e=root/'rewrite-evidence/workflow-4'
def dt(s):return datetime.fromisoformat(s.replace('Z','+00:00'))
def mins(s):return f'{s/60:.2f} min'
rows=[r for r in csv.DictReader((root/'rewrite-evidence/metrics.csv').open()) if r['label'].startswith('WF2-final-')]
assert len(rows)==4 and {(r['route_scope'],r['route_check']) for r in rows}=={('core','smoke'),('core','strict'),('extended','smoke'),('extended','strict')}
for r in rows:
 for key in ('tsc_errors','lint_errors','lint_warnings','unit_failed','unit_skipped'):assert int(r[key])==0,(r['label'],key)
 assert r['build_ok']=='1' and not r['notes']
 assert r['routes_passed']==r['routes_total']==('34' if r['route_scope']=='core' else '32')
 assert r['flows_passed']==r['flows_total']=='15' and r['unit_passed']=='20'
 assert (root/'rewrite-evidence/runs'/r['run_id']/'e2e-results.json.gz').is_file()
subprocess.run(['git','diff','--exit-code','7f8c36b73','--','frontend','frontend-e2e','mealie','tests'],cwd=root,check=True,stdout=subprocess.DEVNULL)
commands=[json.loads(line) for line in (e/'agents/main/session.jsonl').read_text().splitlines()]
accepted=next(x['end'] for x in commands if x['name']=='measure-extended-strict' and x['exit']==0)
tele=json.loads((e/'final/telemetry.json').read_text())
active_at_acceptance={}
for owner,a in tele['agents'].items():
 total=0
 for w in a['active_windows']:
  start,end=dt(w['start']),min(dt(w['end']),dt(accepted))
  total+=max(0,(end-start).total_seconds())
 active_at_acceptance[owner]=total
elapsed=(dt(accepted)-dt(tele['workflow_start_utc'])).total_seconds()
implementation=(dt(accepted)-dt(tele['implementation_start_utc'])).total_seconds()
summary={'workflow':'WF4','status':'accepted-with-documented-scope','branch':'rewrite/wf4-parallel-migration','base':'7f8c36b73','final_commit':'8b746c0cc','baseline_rerun':False,'workflow_start_utc':tele['workflow_start_utc'],'implementation_start_utc':tele['implementation_start_utc'],'acceptance_end_utc':accepted,'wall_seconds':elapsed,'implementation_wall_seconds':implementation,'cumulative_active_seconds':sum(active_at_acceptance.values()),'active_seconds_by_agent':active_at_acceptance,'parallel_modules':2,'worker_initial_prompts':2,'worker_followup_prompts':1,'human_prompts':2,'human_code_interventions':0,'human_approval_interventions':0,'integration_source_fix_cycles':1,'integration_validation_fix_cycles':1,'integration_fix_cycles':2,'merge_conflicts':0,'runtime_route_conflicts':0,'preintegration_route_boundary_requests':1,'tokens':tele['aggregate_tokens'],'uncached_input_plus_output':tele['aggregate_uncached_input_plus_output'],'token_snapshot_utc':tele['snapshot_utc'],'token_note':tele['note'],'measure_seconds':sum(int(r['duration_seconds']) for r in rows),'rows':rows,'yardstick_modified':False,'generated_types_modified':False}
(e/'final/measurements.json').write_text(json.dumps(summary,indent=2)+'\n')
# Full source hash and patch identify the dirty=1 measured checkout without requiring a commit.
files=[p for p in (root/'frontend-react').rglob('*') if p.is_file() and not any(x in ('node_modules','dist','.vite') for x in p.relative_to(root/'frontend-react').parts)]
files += [root/p for p in ['Taskfile.yml','docker/Dockerfile','.github/workflows/test-frontend.yml','.github/workflows/build-package.yml','.github/workflows/release.yml']]
manifest={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}
(e/'final/source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
patch=subprocess.run(['git','diff','--binary','--','Taskfile.yml','docker/Dockerfile','.github/workflows'],cwd=root,capture_output=True,check=True).stdout
for p in sorted(files):
 if p.is_relative_to(root/'frontend-react'):
  result=subprocess.run(['git','diff','--no-index','--binary','--','/dev/null',str(p.relative_to(root))],cwd=root,capture_output=True);assert result.returncode in (0,1);patch+=result.stdout
(e/'final/implementation.patch').write_bytes(patch)
mainfiles=[str(p.relative_to(root)) for p in sorted(files) if 'features/recipes/' not in str(p) and 'features/planning/' not in str(p)]
(e/'agents/main/changed-files.txt').write_text('\n'.join(mainfiles)+'\n\nMain also formatted integrated worker files; their semantic delivery is preserved in worker patches and worker-delivery-manifest.json. Final hashes are in final/source-manifest.json.\n')
meta=json.loads((e/'agents/main/metadata.json').read_text());meta.update({'status':'accepted-with-documented-scope','authoritative_start_utc':tele['workflow_start_utc'],'implementation_start_utc':tele['implementation_start_utc'],'end_utc':accepted,'active_seconds':active_at_acceptance['main'],'token_usage':tele['agents']['main']['tokens'],'token_checkpoint':tele['agents']['main']['token_checkpoint'],'model':tele['agents']['main']['model'],'token_note':'Recovered per-agent local platform counters; earlier command tokens:null have no per-command attribution. Snapshot excludes later report/final response tokens.'});(e/'agents/main/metadata.json').write_text(json.dumps(meta,indent=2)+'\n')
(e/'agents/main/acceptance.json').write_text(json.dumps({'build':True,'strict_types':True,'lint_errors':0,'lint_warnings':0,'units':{'passed':20,'failed':0,'skipped':0},'full_strict_integration':{'passed':82,'total':82},'final_four_measurements':'pass','source_commit':None,'docker_runtime_test':'unavailable: daemon not running','hosted_ci':'not run'},indent=2)+'\n')
mt='| Scope / check | Routes | Flows | Unit pass/fail/skip | Type errors | Lint errors/warnings | Build seconds | Run seconds | Evidence |\n|---|---:|---:|---|---:|---|---:|---:|---|\n'
for r in rows:mt+=f"| {r['route_scope']} {r['route_check']} | {r['routes_passed']}/{r['routes_total']} | {r['flows_passed']}/{r['flows_total']} | {r['unit_passed']}/{r['unit_failed']}/{r['unit_skipped']} | {r['tsc_errors']} | {r['lint_errors']}/{r['lint_warnings']} | {r['build_seconds']} | {r['duration_seconds']} | [raw](../runs/{r['run_id']}/) |\n"
at='| Agent | Branch / worktree | Active windows | Cumulative active time | Input tokens | Cached input subset | Output tokens |\n|---|---|---|---:|---:|---:|---:|\n'
for owner,a in tele['agents'].items():
 branch={'main':'rewrite/wf4-parallel-migration','recipes':'rewrite/wf2-recipes','planning':'rewrite/wf2-planning-shopping'}[owner]
 intervals='; '.join(w['start'][11:23]+' → '+(accepted if owner=='main' and w.get('open_at_snapshot') else w['end'])[11:23] for w in a['active_windows'])
 tokens=a['tokens'];at+=f"| {owner} | `{branch}` / `{root if owner=='main' else root.parent/('mealie-wf2-'+owner)}` | {intervals} UTC | {mins(active_at_acceptance[owner])} | {tokens['input_tokens']:,} | {tokens['cached_input_tokens']:,} | {tokens['output_tokens']:,} |\n"
localstart=dt(tele['workflow_start_utc']).astimezone(ZoneInfo('Pacific/Auckland')).isoformat();localend=dt(accepted).astimezone(ZoneInfo('Pacific/Auckland')).isoformat()
report=f'''# WF4 — Parallel migration with two implementation agents

实验编号更名：本实验现统一称为 **WF4**（此前称 WF2）。更名发生在验收之后；原始 prompt、session log、测试输出、测量 run ID、worker 分支/worktree 和已验收源码哈希保留执行时的标识。名称变更不改变测试结果、时间或 token 统计。

WF4 已完成约定的迁移范围和测试验收。分支 `rewrite/wf4-parallel-migration` 从 `7f8c36b73` 独立实施。实现、测试、报告和补丁保留在工作区，最终实现已提交于 `8b746c0cc`；本次更名为后续文档调整。没有重跑 baseline，也没有创建 baseline commit。

## 结果

- 实际经过时间（授权完成 WF4 开始至最终验收，仅计迁移实验）：**{mins(elapsed)}**。
- 获准完成 WF4 后的实现经过时间：**{mins(implementation)}**。
- 所有 agent 累计活跃任务时间：**{mins(sum(active_at_acceptance.values()))}**，并行重叠时间累加；包括工具/测试等待，排除用户暂停与 worker 两次任务之间的空档，不是 CPU 时间。
- 四次测量用时总和：**{summary['measure_seconds']} s**；这是 elapsed 的子集，不重复相加。
- 并行实现模块：**2**（食谱/组织/cookbook/收藏；购物/膳食计划）。主 agent 同期完成公共基础、账户与管理模块。
- 最终每组 route、flow、unit 通过率 **100%**；完整 strict 集成检查 **82/82**（66 routes + 15 flows + 1 invariant）。重复测量不作为新的独立覆盖样本。
- 集成修复 **2 次**：1 次主 agent 测试类型修复，1 次验收执行顺序修复；实际合并冲突 **0**、运行时路由冲突 **0**。潜在 group/data 路由归属在集成前协调 1 次解决。
- 人工代码介入 **0**；实验期间人工审批介入 **0**。实验规格与执行任务消息 **2 条**；实现 worker 初始 prompt 2 条、补充任务 1 条，协调消息另存平台事件。

UTC 开始 `{tele['workflow_start_utc']}`，最终验收 `{accepted}`。Pacific/Auckland：`{localstart}` → `{localend}`。报告整理发生在最终验收之后；`final/telemetry.json` 额外记录报告快照时的 elapsed。

{mt}

所有测量 `dirty=1`，描述未提交的最终实现；commit 列仍为基点而不是实现快照。[source-manifest.json](final/source-manifest.json) 和 [implementation.patch](final/implementation.patch) 固定被验收代码。四次 any_count=0、todo_count=0、50 expect、6 个测试文件。

## 分工与工作时间

{at}

先由 main 建立 Vite/React 入口、严格类型、SPA 路由守卫、MUI theme/布局、i18next 初始化、typed API/auth 和公共 UI。公共单元、类型、lint、构建通过后，于 01:52:59 和 01:53:09 UTC 分别启动两个 worker。各 worker 使用独立 Git worktree、独立 SQLite 数据目录/认证报告和端口 9092/9093，完成自己的单元及真实浏览器验收。main 使用端口 9091，先集成 planning 并验收，再集成 recipes 并运行完整 strict 回归。

公共文件只由 main 合入。worker 的临时浏览器 App/login harness 在交付前恢复，未进入 patch。主 agent 注册 Organizers 的 group/data 路由，并增加共享 useText，避免 worker 竞争中央路由或翻译初始化。集成后 main 统一格式化 worker 源码；业务交付前后哈希分别保存在 integration/worker-delivery-manifest.json 与 final/source-manifest.json。没有 cherry-pick/merge commit；使用限定目录文件交付和保留的 patch，因此冲突计数为实际发生值 0。

## Token 计量

本地平台统计后来恢复，历史 prompt/早期记录中的“不可获得/null”和“起点下界”保留为原始记录；`platform-events.jsonl`、metadata 的 authoritative 字段以及 [telemetry.json](final/telemetry.json) 提供更完整的实际值。只导出本任务及两个实现 agent 的运行元数据，未导出模型内部推理、系统提示、账户数据或其他会话。自动审批 reviewer 的时间/token 不计入实现 agent 合计。

截至 `{tele['snapshot_utc']}` 的可用计量快照：

- 输入：**{summary['tokens']['input_tokens']:,}**，其中缓存输入 **{summary['tokens']['cached_input_tokens']:,}**（输入的子集）。
- 输出：**{summary['tokens']['output_tokens']:,}**，其中 reasoning output **{summary['tokens']['reasoning_output_tokens']:,}**（输出的子集）。
- 输入 + 输出：**{summary['tokens']['total_tokens']:,}**；包含每轮重复读取的缓存上下文，不代表这么多独立新文本。
- 未缓存输入 + 输出：**{summary['uncached_input_plus_output']:,}**，另列作解释指标，不能当作模型官方 total 或费用。
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
'''
(e/'REPORT.md').write_text(report)
metric=root/'rewrite-evidence/METRICS_TEMPLATE.md';base=metric.read_text().split('\n## WF4 —')[0].replace('No final commit or push has been created.', 'No final commit was created during the measured WF1 experiment.')
compare=f'''\n## WF4 — Parallel migration with multiple agents

实验编号更名：本实验现统一称为 **WF4**（此前称 WF2）。更名发生在验收之后；原始 prompt、session log、测试输出、测量 run ID、worker 分支/worktree 和已验收源码哈希保留执行时的标识。名称变更不改变测试结果、时间或 token 统计。

| Field | Measured result |
|---|---|
| Branch / base | `rewrite/wf4-parallel-migration` / `7f8c36b73`; measured source pinned by hash + patch; implementation commit `8b746c0cc` |
| Tool / model | Codex / gpt-6.1-sol (local turn metadata) |
| Workflow wall time to final acceptance | {mins(elapsed)}; from WF4 completion authorization; migration experiment only |
| Implementation wall time after completion authorization | {mins(implementation)} |
| All-agent cumulative active task time | {mins(sum(active_at_acceptance.values()))}; includes overlapping worker/tool/test time, excludes idle gaps |
| Final measurement time | {summary['measure_seconds']} s (included above) |
| Parallel completed modules | 2; main + 2 workers in independent worktrees |
| Human prompts / worker prompts | 2 specification/execution messages; 2 initial worker + 1 follow-up; coordination events separately logged |
| Human code interventions / approval interventions | 0 / 0 |
| Integration fix cycles | 2: source/test type fix 1; validation sequencing fix 1 |
| Merge / runtime route conflicts | 0 / 0; one potential route ownership overlap resolved before integration |
| Input / cached input subset / output tokens | {summary['tokens']['input_tokens']:,} / {summary['tokens']['cached_input_tokens']:,} / {summary['tokens']['output_tokens']:,} |
| Total tokens (input + output, includes repeated cached context) | {summary['tokens']['total_tokens']:,} |
| Uncached input + output (separate explanatory measure) | {summary['uncached_input_plus_output']:,} |
| Token measurement cutoff | {tele['snapshot_utc']}; later report/final reply tokens excluded; per-agent checkpoints in telemetry |
| Full strict integration | 82/82 (66 routes + 15 flows + invariant) |
| Every final run | build pass; units 20/0/0; type errors 0; lint 0/0; any/todo 0/0 |
| Test pass rate | 100% per final route/flow/unit suite; not code coverage |
| Acceptance | selected migration yardstick accepted; feature parity partial; Docker/hosted CI not exercised |
| Evidence | [WF4 report](workflow-4/REPORT.md), [machine results](workflow-4/final/measurements.json), [telemetry](workflow-4/final/telemetry.json) |

{mt.replace('(../runs/','(runs/')}

### Comparison with WF1

| Measure | WF1 incremental | WF4 parallel |
|---|---|---|
| User wall time to acceptance | NA in comparable form | {mins(elapsed)} |
| Implementation wall time | NA in comparable form | {mins(implementation)} |
| Recorded work time | 32.00 min module windows, single agent | {mins(sum(active_at_acceptance.values()))} active turns summed over three agents; different instrumentation |
| Final measurement time | 162 s | {summary['measure_seconds']} s |
| Token usage | NA | {summary['tokens']['total_tokens']:,} incl cached input; {summary['uncached_input_plus_output']:,} uncached input + output |
| Parallel worker modules | 0 | 2 |
| Core smoke / strict | 34/34 / 34/34 | 34/34 / 34/34 |
| Extended smoke / strict | 32/32 / 32/32 | 32/32 / 32/32 |
| Flows per measurement | 15/15 | 15/15 |
| Units per measurement | 48/0/0 | 20/0/0 |
| Type errors | 0 | 0 |
| Integration fixes | not separately instrumented; 7 source repair cycles in WF1 report | 2 cycles as defined above |
| Merge conflicts | sequential workflow, no parallel merge | 0 actual |
| Human code interventions | 0 observed | 0 |

WF1 and WF4 have different unit counts and timing/token instrumentation. Passing both yardsticks does not prove equal coverage, full feature parity, or workflow superiority. WF4 reuses only dependency lock/cache and comparison evidence. No baseline rerun or baseline commit.
'''
metric.write_text(base+compare)
print(json.dumps({'status':summary['status'],'wall_minutes':elapsed/60,'implementation_minutes':implementation/60,'cumulative_minutes':sum(active_at_acceptance.values())/60,'measurement_seconds':summary['measure_seconds'],'total_tokens_snapshot':summary['tokens']['total_tokens'],'uncached_input_plus_output':summary['uncached_input_plus_output'],'all_four_pass':True,'report':str(e/'REPORT.md')},indent=2))
