# Original human request (verbatim)

当前项目是 COMPX574 Agentic Development Report，主题是将 Mealie 前端从 Vue 迁移到：

Vite + React 19 + TypeScript strict + React Router（SPA）+ MUI + react-i18next

当前分支：

rewrite/frontend-react-migration

这是 Workflow 2：

Parallel migration with multiple agents or sub-agents

请按以下原则执行：

1. 直接从当前分支开始迁移。基线只是另一种迁移策略的 prompt，不需要重复执行 baseline 测试，也不需要为 baseline 创建 commit。
2. 先检查项目结构，识别可以并行迁移的模块、模块之间的依赖关系，以及必须由主 agent 统一管理的共享文件。
3. 先由主 agent 确定公共技术基础和接口约定，包括：
   - Vite 和 React 入口
   - TypeScript strict 配置
   - React Router（SPA）路由结构
   - MUI theme 和共享组件
   - react-i18next 初始化和翻译约定
   - API 类型和公共数据层
4. 在公共基础稳定后，将相互独立的模块分配给多个 agent 或 sub-agent 并行迁移。
5. 每个 agent 只负责明确分配的模块，避免同时修改相同的共享文件。需要修改公共文件时，先记录请求，由主 agent 统一处理。
6. 每个 agent 在自己的独立 worktree 或分支中完成：
   - Vue → React 迁移
   - 相关路由、API、MUI 和 i18n 接入
   - 模块测试
   - 必要的局部回归测试
7. 每个 agent 的模块测试失败时，由该 agent 在自己的任务范围内修复并重新测试，直到达到 acceptance 条件。
8. 主 agent 按模块完成情况逐步集成。每次集成后运行受影响模块的测试和必要的回归测试。
9. 记录并处理集成阶段产生的问题，包括：
   - 合并冲突
   - 路由冲突
   - 类型不一致
   - 共享组件接口不一致
   - API 或翻译 key 不一致
   - 集成后的测试失败
10. 不要求每个 agent 在实验过程中创建最终提交；但每个 agent 应保留清晰的工作结果和变更记录。全部集成完成后，再统一决定是否创建最终 commit。
11. 每个 agent 和主 agent 都要保留：

- 分配给 agent 的 prompt
- session log
- 开始时间和结束时间
- token 使用量
- worktree 或分支信息
- 修改的文件
- 执行的测试命令
- 测试输出和 acceptance 结果
- 集成、冲突和返工记录

12. 同时记录两类时间：

- 实际经过时间：从 workflow 开始到最终验收的用户等待时间
- 累计工作时间：所有 agent 工作时间的总和

13. 全部模块完成并集成后，运行最终测量：

measure.sh core extended smoke strict

14. 将最终测量结果填入 METRICS_TEMPLATE.md。
15. 最终报告需要能够比较并行 workflow 的：

- 总完成时间
- 所有 agent 的累计时间
- token 使用量
- 并行完成的模块数
- 测试通过率
- 集成修复次数
- 合并冲突次数
- 人工介入次数
- 最终 core、extended、smoke、strict 测试结果

建议先使用：

- 1 个主 agent，负责公共基础、任务分配、集成和最终测试
- 2 个实现 agent，分别处理两个相对独立的前端模块

开始时先不要立即并行修改代码。先检查当前分支和项目结构，列出：

- 可并行迁移的模块
- 模块依赖关系
- 主 agent 负责的共享文件
- 每个 agent 的任务边界
- 每个模块的验收测试
- worktree 或分支安排
- 日志文件结构

确认任务划分后，再启动并行迁移。

# Subsequent human instructions (verbatim, in order)

1. 保存推送WF1，创建新的分支进行WF2
2. 确认
3. 完成WF2

# Provenance

WF1 preserved and pushed at 47a176ed1. WF2 branch starts at 7f8c36b73, the approved pre-migration HEAD. Previous WF1 source was not used as implementation input. Its dependency lock and cached packages were reused for reproducible tools; its evidence is restored read-only for comparison. No baseline test or baseline commit was performed. Preparatory inspection/approval messages preceded the instrumented completion session; precise elapsed timestamps for that earlier phase are unavailable.
