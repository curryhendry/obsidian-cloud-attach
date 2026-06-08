## v0.3.144.dev - 2026-06-09

### 更新
- 修复 Obsidian 社区插件审核错误：移除 `_loadPdfJs()` 中的动态 `<script>` 标签创建，改用 `fetch()` + `eval()` 加载本地 PDF.js
- 替换 `require('fs')` 为 Obsidian Vault API（`this.app.vault.adapter.exists/mkdir/write`），消除 `Direct Filesystem Access` 警告
- 更新 PDF.js 下载文件名为 `.mjs` 格式（ESM 模块），与 pdfjs-dist@3.11.174 保持一致

### 已知问题
- i18n 存在重复 key 警告（`view.no_account_selected`、`view.empty_dir`，中英文各重复一次）
- 部分场景下 PDF 预览可能失效，待验证

---

## v0.3.126 - 2026-06-08

### 更新
- 新增插件"高级设置"，可配置PDF等格式的不同预览方式（目前仅支持PDF）
- 新增PDF.js插件的选择，选择并保存后会自动下载并应用。也可以随时删除这个插件回到iframe语法插入
- 新增支持`![]()`语法预览服务器上的PDF文件，当您选择PDF.js并应用后，再次插入服务器上的pdf文件会使用`![]()`语法插入

### 已知问题
- 手动指定尺寸还不支持，后续考虑
- 部分场景下可能预览会丢失，需要重新加载笔记
- 部分在线pdf预览不成功，怀疑是CORS问题，待修复

### 后续计划
- PDF文件的全屏浏览，以及更多的交互
- 其他文件格式的支持（待定）
