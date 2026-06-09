## v0.3.155 - 2026-06-09

### 修复
- 从 Git 移除 `libs/pdfjs/`（PDF.js 由用户本地下载，不提交到仓库）
- 添加 `.gitignore` 规则排除 `libs/pdfjs/`
- 新增 GitHub Actions Release workflow，包含 Artifact Attestations（构建产物来源证明）

## v0.3.152 - 2026-06-09

### 修复（Obsidian 社区插件审核）
- 修复 Error：去掉 `_loadPdfJs()` 中的动态 `<script>` 创建，改用 `adapter.read() + Function()` 加载本地 PDF.js（功能不变）
- 修复 Warning：去掉所有 `require('fs')` 和 `require('path')`，改用 Obsidian Vault API
- `onOpen()` 改为 `async`（支持 `await adapter` 调用）
- `downloadPdfjs()` 改用 `adapter.writeBinary()` 正确写入二进制文件
- Worker 改为 blob URL（避免路径问题）

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
