## v0.3.198.dev - 2026-06-14

### 修复
- 统一面包屑根目录显示逻辑：WebDAV 显示 `webdavPath` 最后一段，S3 (对象存储) 显示 `prefix` 最后一段，都没有则显示"根目录"

## v0.3.197 - 2026-06-14

### 修复
- 修复 PDF 右键菜单仍能复制图片的问题（补加 user-select/pointer-events/draggable 防护）
- 修复 token 错误时静默插入无签名 URL 的问题（getSignedUrl 失败时弹 Notice 报错）
- 修复 S3 账户在根目录时提示「不能根目录」的问题（移除错误的根目录拦截）
- 清除 i18n 重复 key 警告（zh/en 各 5 个重复 key）

## v0.3.187 - 2026-06-12

### 新功能
- 无新增功能

### 修复
- **Popout 窗口 PDF 中文方框**（核心修复）：`getDocument()` 传入 `ownerDocument: imgEl.ownerDocument`，确保 PDF.js 的 `@font-face` CSS 注入到正确 document（popout 窗口 canvas 与其 document 匹配，避免 `ctx.fillText()` 找不到字体导致中文显示为方框）
- **签名 URL 路径修复**：`getSignedUrl()` 从 `webdavPath` 提取虚拟路径前缀（如 `/dav/Local/test` → `/Local/test`），拼回 `remotePath`，解决多 WebDAV 账户签名 URL 请求路径不完整的问题
- **PDF 渲染独立于插入设置**：删除 `onload()` 外层 `pdfPreview` 门控，PDF.js 渲染不再受插入模式控制；`active-leaf-change` 时清空 `_renderedPdfUrls`，切换笔记后重新渲染
- **PDF.js 下载路径修复**：`writeBinary` 路径拼接缺少 `/`，导致写成 `pdfjspdf.min.js` 而非 `pdfjs/pdf.min.js`
- **Base64 编码栈溢出修复**：worker 文件约 1MB，`String.fromCharCode(...new TextEncoder().encode(...))` 的展开运算符导致 Maximum call stack size exceeded，改为循环分批转换

### 技术改进
- **Obsidian 社区插件审核合规**：去掉 `_loadPdfJs()` 中的动态 `<script>` 创建，改用 `adapter.read() + Function()` 加载本地 PDF.js；去掉所有 `require('fs')` / `require('path')`，改用 Obsidian Vault API；`onOpen()` 改为 `async`
- **仓库合规**：`libs/pdfjs/` 从 Git 移除（PDF.js 由用户本地下载，不进仓库）；新增 GitHub Actions Release workflow（Artifact Attestations）

### 已知问题
- 手动指定尺寸还不支持，后续考虑
- 部分场景下可能预览会丢失，需要重新加载笔记
- 部分在线 PDF 预览不成功，怀疑是 CORS 问题，待修复

### 后续计划
- PDF 文件的全屏浏览，以及更多的交互
- 其他文件格式的支持（待定）

## v0.3.172.dev - 2026-06-10

### 修复
- `getSignedUrl()`: 回退 webdavPath 拼接错误，改为从 webdavPath 提取虚拟路径前缀（`/dav/Local/test` → 前缀 `/Local/test`），拼回 remotePath 传给 OpenList API
  - 修复 test 账户（webdavPath 含虚拟路径）签名 URL 请求路径不完整的问题
  - NAS51E78F/69482F（webdavPath=`/dav`）行为不变
- `getRawUrl()`: 同步添加虚拟路径还原逻辑，修复 test 账户 iframe 预览 URL 缺少虚拟路径前缀

## v0.3.167.dev - 2026-06-09

### 修复（完整版）
- `onload()` 外层门控：删除 `if (this.settings.pdfPreview === 'pdfjs')`，让 `_observePdfEmbeds()` 无条件执行
  - v0.3.165.dev 漏了这层，选 iframe 时 MutationObserver 从未注册，PDF 始终不渲染
- `_observePdfEmbeds()` 内 3 处 `pdfPreview` 门控全部删除，PDF.js 渲染独立于插入模式
- `active-leaf-change` 时清空 `_renderedPdfUrls`，切换笔记后重新渲染

## v0.3.163 - 2026-06-09

### 修复
- 修复 PDF.js 下载后文件不存在的 bug：`writeBinary` 路径拼接缺少 `/`，导致写成 `pdfjspdf.min.js` 而非 `pdfjs/pdf.min.js`

## v0.3.160.dev - 2026-06-09

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
