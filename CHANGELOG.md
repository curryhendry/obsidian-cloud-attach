## v0.4.012.dev - 2026-06-25

- 新增：自动上传功能（高级设置），开启后粘贴/拖入附件自动用默认账号上传

## v0.4.011 - 2026-06-25

- 修复：Alist /p/ sign URL 对大文件返回 HTML 下载页导致 PDF 解析失败，改为统一通过 requestUrl 下载二进制传给 PDF.js
- 修复：大 PDF（页高不均）滚动页码偏移，改用 canvas offsetTop 定位当前页代替比例估算
- 修复：[[path]]（无 ! 前缀）上传后 doUpload 替换语法无效，增加 [[path]] 格式分支处理
- 修复：S3 删除/重命名 `_objectKey` 方法 this 上下文丢失，改为内联局部函数
- 新增：左侧文件列表右键菜单「☁️ 上传到云端」（仅附件类型文件显示）
- 补充 i18n：默认账号功能英文翻译 + `settings.edit_account`/`settings.saved`/`error.cannot_extract_path` 中英文 key

## v0.3.331 - 2026-06-23

- 修复 WebDAV 文件夹重命名 500：去尾 / 再算父目录
- S3 文件重命名：改用 presigned URL + requestViaObsidian 绕过 CORS
- S3 文件夹重命名：S3 无原生目录操作，改为列出子对象逐个 CopyObject + Delete
- 删除死代码 _s3DirectRequest / _sha256Hex / _hmacSha256 / _hmacSha256Hex

## v0.3.330 - 2026-06-23

- 去掉 toolbar 版本号显示（仅用于开发调试区分版本）
- 手机端 toolbar 改为点击出现/隐藏（非始终悬浮）

## v0.3.328.dev - 2026-06-23

- 回退宽度读取逻辑：去掉 requestAnimationFrame + clientWidth 兜底，回到 292 基线（避免电脑端读到未布局 img 的 95px）
- 去重标记恢复渲染成功后添加（跟 292 一致）

## v0.3.327.dev - 2026-06-23

- Fetch 失败时用 Obsidian requestUrl 下载 PDF 二进制传给 PDF.js，绕过 CORS

## v0.3.325.dev - 2026-06-23

- 修复变量名引用错误：img → imgEl（导致 ReferenceError）

## v0.3.324.dev - 2026-06-23

- 去重标记移到渲染成功后，失败可重试，修复红框永久停留问题

## v0.3.323.dev - 2026-06-23

- 编辑/阅读模式使用独立去重 Set，修复模式切换互相影响
- PostProcessor 改为只标记 blob img，由 _scanAllPdfImgs 统一处理，修复索引错位

## v0.3.322.dev - 2026-06-23

- 回退到 IntersectionObserver + 仅加串行队列限制并发，修复 v0.3.321 阅读模式全变成图片问题

## v0.3.321.dev - 2026-06-23

- 懒加载改为 scroll + 300ms 防抖 + 串行队列（一次一页），修复 iOS 滑动翻页并发渲染 crash

## v0.3.320.dev - 2026-06-23

- 按钮跳转设 scrollProgrammatic flag，屏蔽 scroll 事件干扰页码
- scrollToPage 直接用 pageH × (pageNum - 1) 计算位置，跳转前手动更新 currentPage

## v0.3.319.dev - 2026-06-23

- 按钮翻页改回 offsetHeight 简单计算（第一页高度 × 页码）
- 去掉异步懒加载触发，避免渲染中 scroll 事件干扰页码

## v0.3.318.dev - 2026-06-23

- 按钮翻页/跳转：先触发懒加载渲染目标页，再用 offsetTop 跳转
- 修复按钮跳转不准问题（scrollHeight 比例 → offsetTop）

## v0.3.317.dev - 2026-06-23

- 翻页计算改用 scrollHeight 比例（兼容 iOS offsetHeight 不准问题）
- scrollToPage 跳转改用 scrollHeight 比例计算

## v0.3.316.dev - 2026-06-23

- 翻页按钮修复：IntersectionObserver → scroll 事件计算页码
- 触摸设备工具栏始终可见（不依赖 mouseenter/mouseleave）

## v0.3.315.dev - 2026-06-23

- 手机端无视用户设定宽度，一律自适应页面宽度
- 电脑端保留宽度设定逻辑不变

## v0.3.314.dev - 2026-06-23

- 去掉 requestAnimationFrame（iOS 上不触发导致渲染卡死）

## v0.3.313.dev - 2026-06-23

- 宽度读取加 requestAnimationFrame 延迟，确保 Obsidian 已设置 width 属性
- 宽度兜底：未读到时用 imgEl.clientWidth
- 设定宽度超过父容器时自动限制在可用宽度内
- replaceWith 提前到宽度计算前，确保能获取父容器宽度

## v0.3.312.dev - 2026-06-23

- getDocument 前加 fetch HEAD 探活获取状态码/文件大小
- 错误信息增加 name + stage + fetch 详情，写入 pdf-error-log.md 日志笔记
- onunload 时 flush 日志到 .obsidian/plugins/cloud-attach/pdf-error-log.md

## v0.3.311.dev - 2026-06-23

- getDocument 加 disableAutoFetch: true，阻止 PDF.js 预加载所有页面，修复 iOS 上大 PDF 加载失败（Load failed）

## v0.3.310.dev - 2026-06-23

- 去掉 catch 块 Notice 弹窗（iOS 上可能触发渲染副作用导致所有 PDF Load failed），保留 console.error + failStage + 红框错误信息

## v0.3.309.dev - 2026-06-23

- PDF 渲染失败时用 Notice 弹窗显示错误信息（手机端可读），catch 块增加 failStage 标记区分 loadPdfJs/getDocument/getPage 阶段

## v0.3.308.dev - 2026-06-23

- 版本号从独立 toolbar 标签移到翻页指示器后面，手机端可见（`1 / 5  v0.3.308`）

## v0.3.302.dev - 2026-06-22

- 修复宽度解析：改为从 markdown label 字段解析 `名称|宽度` 格式，而非从 URL（URL 不含 `|`）
- 版本角标更新为 v295

## v0.3.295.dev - 2026-06-21

- 改为存储 `{ label, url }` 而非仅 URL，但宽度解析仍错误（未部署测试）

## v0.3.290.dev - 2026-06-21

## v0.3.286.dev - 2026-06-20

## v0.3.281.dev - 2026-06-20

### 修复

- PDF 渲染兜底：_scanAllPdfImgs 增加从笔记 markdown 源码反查 PDF URL，解决 PostProcessor 未标记的 img 无法识别问题
- WebDAV 重命名 500 错误：MOVE 请求 Destination 头部改为相对路径（兼容 OpenList）

## v0.3.277.dev - 2026-06-19

### 修复

- catch 块增加弹窗和数据属性方便定位渲染失败根因
- 修复 `require('obsidian').Notice` 在 iOS 上报错导致全量渲染失败：改用顶层 import 的 Notice，并包 try-catch 防止二次异常

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
