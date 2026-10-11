当前项目是 COMPX574 Agentic Development Report，主题是将 Mealie 前端从 Vue 迁移到：

Vite + React 19 + TypeScript strict + React Router（SPA）+ MUI + react-i18next

当前分支：

rewrite/wf3-incremental-migration

这是 Workflow 3：

Incremental conversion with test acceptance

请按以下原则执行：

1. 直接从当前分支开始迁移。基线只是另一种迁移策略的 prompt，不需要重复执行 baseline 测试，也不需要为 baseline 创建 commit。
2. 先检查项目结构，识别前端模块、模块边界、依赖关系和合理的迁移顺序。
3. 按模块逐个进行 Vue → React 迁移。
4. 每完成一个模块，运行该模块相关测试和必要的回归测试。
5. 如果测试失败，在当前模块步骤内修复并重新测试，直到达到预先定义的 acceptance 条件。
6. 每个模块完成后记录结果，但暂时不要求每个模块单独创建 commit；全部完成后再统一决定是否创建最终 commit。
7. 每个模块和每个 workflow step 都要保留：
   - 使用的 prompt
   - session log
   - 开始时间和结束时间
   - token 使用量
   - 修改的文件
   - 执行的测试命令
   - 测试输出和 acceptance 结果
8. 不要把所有测试推迟到最后；测试必须作为每个增量模块的验收条件。
9. 全部模块完成后，运行最终测量：

   measure.sh core extended smoke strict
10. 将最终测量结果填入 METRICS_TEMPLATE.md。
11. 最终报告需要能够说明每个模块的迁移过程、测试结果、修复次数、时间、token、修改内容和最终测量结果。

每个增量步骤采用以下结构：

模块识别 → 模块迁移 → 模块测试 → 失败修复 → 重新测试 → 记录 acceptance 结果 → 进入下一个模块

开始时先不要直接大范围修改代码。先检查当前分支和项目结构，列出建议的模块划分、迁移顺序、每个模块的验收测试，以及需要创建或更新的日志文件，然后再开始第一个模块。

Documentation note: the branch label above was normalized after the WF3 branch rename; the remaining prompt wording is preserved.
