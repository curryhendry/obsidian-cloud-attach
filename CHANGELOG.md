## v0.3.268.dev - 2026-06-19

### 修复

- iOS blob URL 检测：注册 `registerMarkdownPostProcessor` 从 markdown 源码识别 PDF URL，写入 `dataset.cloudattachPdfUrl`；`_isPdfUrl` 优先读 dataset；扫描和 MutationObserver 均优先用 dataset 查找 PDF；同时修复了编辑模式宽度无效问题

## v0.3.264 - 2026-06-19

### 修复

- 移除 PDF 工具栏 hover 显示的版本标签

## v0.3.261.dev - 2026-06-19

### 修复

- PDF 翻页功能：点击 prev/next 按钮时，如果目标页是占位符（懒加载未渲染），先调用 `_renderLazyPage` 渲染再滚动，同时更新 `currentPage` 和工具栏显示
- 滚动页码追踪：`_bindPdfScroll` 把 `IntersectionObserver` 保存到 `this._pdfScrollObservers` Map；`_renderLazyPage` 渲染完新 canvas 后自动加到滚动观察器，滑动时正确更新页码

## v0.3.259.dev - 2026-06-19

### 修复

- 手机端多 PDF crash：懒加载方案——只渲染第1页，剩余页创建占位符，IntersectionObserver 监听滚入视口时才渲染，rootMargin=200px 提前加载；切换笔记时销毁所有 observer 释放资源
- 内存占用大幅降低：同时最多只有可视页 canvas 在内存中

## v0.3.244.dev - 2026-06-17

### 修复

- 手机端多 PDF crash：引入全局渲染链 `_pdfRenderChain`，所有 PDF 串行排队，任意时刻最多只有 1 个 PDF 在真正渲染，防止 iOS 内存爆炸；`_pdfQueuedUrls` Set 追踪排队 URL 防止同一 URL 重复入链
- 工具栏版本标签更新为 `v244`

## v0.3.242.dev - 2026-06-17

### 修复

- PDF 并发渲染失控：引入 `_pdfRenderPromises` Map（per-URL Promise），首次渲染登记，后续并发调用返回已有 Promise，实现队列串行化；`doRender` async wrapper 包裹原函数体保持结构不变
- 阅读模式 PDF 不渲染：所有扫描延迟点增加 3000ms 延迟（初始扫描 + active-leaf-change 4 次 + layout-change 2 次 + popout 4 次），确保 DOM 完全加载
- 工具栏版本标签：`v242` 标签内置于 toolbar，便于肉眼确认部署版本

### 修复

- PDF 并发渲染失控：引入 `_pdfRenderPromises` Map（per-URL Promise），首次渲染登记，后续并发调用返回已有 Promise，实现队列串行化；`doRender` async wrapper 包裹原函数体保持结构不变
- 阅读模式 PDF 不渲染：所有扫描延迟点增加 3000ms 延迟（初始扫描 + active-leaf-change 4 次 + layout-change 2 次 + popout 4 次），确保 DOM 完全加载
- 工具栏版本标签：`v242` 标签内置于 toolbar，便于肉眼确认部署版本
- 手机端多 PDF crash：加并发锁（`_pdfRendering`）+ 队列（`_pdfQueue`），同一时间只渲染一个 PDF
- 阅读模式延迟扫描：四处扫描点增加 3000ms 延迟兜底

## v0.3.240.dev - 2026-06-16

### 修复

- 修复阅读模式 PDF 不渲染：增加 3000ms 延迟扫描兜底，`_observePdfEmbeds` 初始扫描、`rescanPdfImgs`、`layout-change` 均追加延迟扫描

## v0.3.238.dev - 2026-06-16

### 修复

- 修复 PDF 容器 opacity:0 导致的永久不可见问题：第二次 `_scanAllPdfImgs` 找到已有容器后，若 opacity !== '1' 则补设为可见

## v0.3.231.dev - 2026-06-16

### 修复

- 版本标签文字修正

## v0.3.230.dev - 2026-06-16

### 修复

- 版本标签文字修正

## v0.3.229.dev - 2026-06-16

### 修复

- 版本标签文字修正

## v0.3.228.dev - 2026-06-16

### 修复

- 版本标签文字修正

## v0.3.227.dev - 2026-06-16

### 修复

- **手机端多 PDF 崩溃修复（核心）**：PDF.js 并发加载撑爆内存导致 iOS Obsidian crash。加并发锁（同一时间只渲染一个 PDF）；懒加载（只渲染第 1 页，其余页面灰色占位符）；IntersectionObserver 监听可见性；切换笔记时 `_cleanupPdfResources` 释放 PDF doc、observer、canvas

## v0.3.225.dev - 2026-06-16

### 修复

- 双 `requestAnimationFrame` 确保 DOM layout 完成后再读取容器宽度，避免 containerW 返回 0 或错误值

## v0.3.223.dev - 2026-06-16

### 修复

- **PDF 重复渲染根因修复**：将 `imgEl.replaceWith(container)` 移到 `await getDocument()` 之前同步执行，确保容器在并发查询时已存在于 DOM；改用 DOM 查询替代内存 Set 去重

## v0.3.222.dev - 2026-06-16

### 修复

- 修复 `_scanAllPdfImgs` 中 `_renderedPdfUrls.add(url)` 位置错误（放在 async 操作之后导致并发失控）；改用 DOM dedup 检查替代内存 Set

## v0.3.221.dev - 2026-06-16

### 修复

- 修复去重逻辑：`urlKey` 去重替代 `url`，避免同一 URL 不同 imgEl 标识导致重复入队；宽度读取改用 `getBoundingClientRect` 替代 `clientWidth`

## v0.3.220.dev - 2026-06-16

### 修复

- 手机端 PDF 预览滚动修复：触摸设备使用 `overflow-y: scroll` 替代 `auto`，解决 iOS Safari 不响应触摸滑动的问题

## v0.3.218.dev - 2026-06-15

### 修复

- 回退宽度实时更新功能：删除 `_findPdfContainerByUrl`、`_updatePdfContainerWidth` 等未经验证的宽度复用逻辑，恢复到 v0.3.200 稳定代码

## v0.3.216.dev - 2026-06-15

### 新增

- PDF 预览宽度实时响应：监听 img 的 alt/width/style/class 属性变化，用户修改 `![500]` → `![800]` 时自动更新容器宽高，无需重新打开笔记

## v0.3.214.dev - 2026-06-15

### 修复
- 回退到 v0.3.200.dev 作为基线（保留宽度自适应修复）
- 去掉错误引入的实时宽度更新逻辑

## v0.3.212.dev - 2026-06-15

### 修复
- 去掉 `_findPdfContainerByUrl` 复用逻辑（首次渲染时误匹配残留容器导致 PDF 不渲染）
- 去掉 `_updatePdfContainerWidth` 函数
- 保留 v0.3.197 的翻页和滚动交互代码

## v0.3.210.dev - 2026-06-15

### 修复
- 恢复 v0.3.197 的翻页和滚动交互代码（`_initPdfToolbar`、`_bindPdfScroll`、`_updatePdfToolbar`）
- 保留实时宽度更新功能（`_findPdfContainerByUrl` + `_updatePdfContainerWidth`）
- 修复翻页按钮和滚动失效的问题

## v0.3.208.dev - 2026-06-14

### 修复
- 修复 `_findPdfContainerByUrl` 中 Map 迭代解构错误（`[doc]` 应为 `[doc, obs]`），导致 popout 窗口容器查询失败、翻页无效
- 去掉 `_renderingPdfUrls` 幂等标志，避免实时更新时被跳过
- `_updatePdfContainerWidth` 高度重算改为 `setTimeout(0)` 等 layout flush 后执行
- 精简 MutationObserver callback 中的扫描逻辑（只保留一个 setTimeout）

## v0.3.206.dev - 2026-06-14

### 修复
- PDF 实时宽度更新：修复 `_findPdfContainerByUrl` 中 forEach 回调 return 不中断外层函数的 bug
- 防止无限渲染循环：`_renderPdfAsCanvas` 加幂等标志，同一 URL 渲染中则跳过
- 去掉 `active-leaf-change` 和 `layout-change` 中的多余 setTimeout 扫描（多次扫描堆积导致无限日志）
- 精简 `_scanAllPdfImgs` 日志输出

## v0.3.204.dev - 2026-06-14

### 修复
- PDF 预览实时宽度更新：Obsidian 编辑器修改 `![480]` → `![800]` 时，自动复用已有容器并更新宽高（无需重新打开笔记）
- 根因：Live Preview 模式下修改 markdown 会销毁旧 img 并创建新 img，属性监听无效；改为检测同 URL 的已有容器并复用

## v0.3.202.dev - 2026-06-14

### 新增
- PDF 预览宽度实时响应：监听 img 的 alt/width/style/class 属性变化，修改 `![640]` → `![800]` 时自动更新容器宽度，无需重新打开笔记

## v0.3.200.dev - 2026-06-14

### 修复
- 修复 PDF 预览不能设定宽度的问题：CSS 的 `width: 100% !important` 覆盖 inline width，改为无 `!important`；JS 设置宽度改用 `setProperty("width", ..., "important")` 确保优先级

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
