# 插件市场提交（dsh-web-preview-panel）

市场注册表位于社区仓库 zhu1090093659/dsh-web-ui 的
packages/dsh-community-plugins/community.json（由维护者 curated）。

## 待办（需 GitHub 账号操作，无法自动完成）

1. Fork https://github.com/zhu1090093659/dsh-web-ui
2. 在 packages/dsh-community-plugins/community.json 末尾应用补丁
   docs/marketplace-add-dsh-web-preview-panel.patch（或手动加入
   dsh-web-preview-panel 条目）
3. 提交并创建 PR，标题建议：feat(market): add dsh-web-preview-panel entry
4. 合并后由维护者重新构建/发布市场包，新卡片才会出现

条目字段（id/名称/作者/仓库/npm/category）见补丁；npm 字段已填，
npm 发布后市场卡片带 npm 标记，可直接一键安装。
