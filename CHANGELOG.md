## [0.3.059.dev] - 2026-06-03

### 修复
- **容器高度方案**: 移除 CSS 变量（`--pdf-viewer-height`）方案，改用直接 `inline style` 设 `height`（JS 动态计算 = 第一页像素高度）
- 根因：`height: var(--pdf-viewer-height, 800px) !important` CSS 规则中的 `var()` 在 Obsidian 环境里没有正确回退到 JS 设的值，导致 fallback 到 800px
- 改法：CSS 规则只设 `max-height: 80vh` 兜底，`height` 完全由 JS inline style 控制

## [0.3.058.dev] - 2026-06-03

### 变更
- **PDF 连续滚动方案重构**: 参考 Obsidian 原生 `.pdf-embed` CSS 方案，使用 `display:flex; flex-direction:column` + 固定 `height` + `overflow:hidden` 作为外层容器，内部滚动容器使用 `flex:1; min-height:0; overflow:auto`
- 默认高度改为 800px + max-height:80vh（与 Obsidian 原生 PDF 内嵌一致）

## [0.3.051.dev] - 2026-06-03

### 修复
- **固定高度容器 + 内部连续滚动**: 恢复固定高度容器（默认 600px，支持用户指定高度），内部创建滚动区域放置所有页面 canvas
- **翻页改为滚动**: 上一页/下一页/页码跳转改为滚动到对应 canvas 位置，不再重新渲染
- **IntersectionObserver 监听滚动区域**: 改为监听内部 scrollArea 的滚动，实时更新当前页码

- 更新人：Garry

## [0.3.039] - 2026-06-03

### 修复
- **Canvas2D 警告消除**: getContext('2d') 添加 willReadFrequently: true，消除浏览器控制台警告

### 新增
- **全屏按钮**: PDF 工具栏新增 ⛶ 全屏按钮（当前显示“敬请期待”提示）
- **高级设置布局重做**: 卡片式容器 + 层级缩进（▸ 指示器）+ PDF radio 与卸载按钮同行 + 说明文字
- **PDF 说明文字**: “选定后使用 `![]()` 语法插入预览”
- **Excel/Word 预览占位**: 带层级缩进的灰色占位项（敬请期待）

- 更新人：Garry

### 修复
- **PDF 尺寸属性不生效**: 读取原始 img 的 width/height/maxWidth/style 属性，应用替换后的 PDF 容器
- **支持多种 Obsidian 尺寸语法**: `![|500](url)`、`![](url){width=500}`、`<img width="500">`、parent span 样式、`cm-image-width-*` class

- 更新人：Garry

### 修复
- **翻页无感切换**: 复用 canvas 只更新渲染内容，不再清空容器重建 DOM
- **工具栏只创建一次**: `_initPdfToolbar` 初始化 + `_updatePdfToolbar` 更新文字/可见性，不再每次翻页重建
- **消除翻页闪烁**: 去掉 `innerHTML = ''`，去掉滚动位置保存/恢复（不再需要）

- 更新人：Garry

### 修复
- **翻页跳转页面顶部**: `_renderPdfPage` 添加滚动位置保存/恢复（`requestAnimationFrame` 延迟恢复）
- **页码点击无法输入**: `InputModal` 用法错误，改用自定义 `PageJumpModal`（基于 `Modal` + `Setting`）

- 更新人：Garry

## [0.3.034] - 2026-06-03

### 修复
- **编辑模式 PDF 预览不生效**: MutationObserver 增加编辑区覆盖，初始扫描延迟执行 + active-leaf-change 事件重新扫描
- **页码跳转无法输入**: `prompt()` 替换为 Obsidian 原生 InputModal（支持 number 类型 + min/max 校验）
- **Git 推送冲突修复**: rebase 合并远程 README.md 更新

- 更新人：Garry

## [0.3.033] - 2026-06-03

### 新增
- **PDF.js 分页预览**: 默认只渲染第1页，右下角悬浮翻页按钮（上一页/页码/下一页）
- **页码跳转**: 点击页码可输入跳转至指定页
- **自适应宽度**: PDF canvas 宽度自适应容器，后续将支持 `![width](url)` 语法

- 更新人：Garry

## [v0.3.20260602] - 2026-06-02

### 修复
- **云附件浏览器空白**: 补全 `registerView()` 调用，`onOpen()` 从未触发导致视图永远不渲染

- 更新人：Garry

## [v0.2.085] - 2026-05-31

### 修复
- **单账户面板空白**: `render()` 中 `fileListEl`/`breadcrumbEl`/`batchBarEl` DOM 容器创建移到 `loadDir()` 调用之前，修复单账户场景下面板永远不渲染文件列表的 bug（某些主题下完全看不到服务器文件选择）

- 更新人：Garry

## [v0.2.084] - 2026-05-31

### 修复
- **getSignedUrl 路径归一化**: 方法内部统一去掉 webdavPath 前缀和 /dav 前缀，所有调用方无需自行处理路径
- **testConnection token 检测**: 检测 HTTP 200 但 body 中 code=401 的情况，正确提示 Token 无效
- **insertFile/insertSelectedFiles 错误处理**: 添加 try/catch，错误通过 Notice 展示给用户，不再静默失败
- **copyUrlBtn 批量复制**: 改用 for...of 替代 Promise.all，单个文件失败不影响其他
- **requestViaObsidian JSON 兼容**: result.text 为空时 fallback 读取 result.json，兼容 Obsidian requestUrl 响应结构

- 更新人：Garry

## [v0.2.083] - 2026-05-29

### 修复
- **Synology WebDAV 兼容性**: listDirectoryWebDAV 兼容完整 URL 的 href 格式，用 new URL() 提取 pathname
- **"请选择文件夹"错误**: 有 webdavPath 的账户在根目录时自动使用 webdavPath 路径上传
- **URL 多余 @ 字符**: getFileUrl 不再拼接 Basic Auth 凭证到 URL 中
- **URL 空格/特殊字符编码**: getFileUrl 统一编码规则，保留中文，编码空格和特殊字符
- **面包屑显示优化**: 有 webdavPath 时显示对应目录名，无配置时显示默认根目录
- **根目录刷新按钮**: 根目录页面新增刷新按钮

### 变更
- i18n: 5 处硬编码 UI 字符串改用 t() 函数
- WebDAV 默认路径不再强制 /dav，留空即可
- CHANGELOG 和 README 切回中文为主

- 更新人：Garry

## [v0.2.082] - 2026-05-13

### 新增
- GitHub Actions 自动构建、签名、创建 Release
- 添加 package.json、esbuild 配置，规范化构建流程

### 变更
- README 重构：英文版为主，中文版分离为 README_CN.md

- 更新人：Garry

## [v0.2.081] - 2026-05-13

### 修复
- 批量刷新 sign URL 前先验证新 URL 有效性，验证失败保留原 URL

- 更新人：Garry

## [v0.2.080] - 2026-05-08

### 修复
- 批量刷新 sign URL 时光标位置保护
- 更新人：Garry

## [v0.2.079] - 2026-05-05

### 修复
- 批量刷新 sign URL 前先验证新 URL 有效性（PLACE 1/2/3 三处）

- 更新人：Garry

## [v0.2.070] - 2026-05-03

### 修复
- 批量复制URL按钮失效: .map() 回调内 await 写在非 async 函数中导致 SyntaxError
- sign 刷新后光标全选: setValue 缺少 setSelection 清除选择区
- 更新人：Garry

## [v0.2.068] - 2026-05-03

### 修复
- sign URL 批量刷新时对笔记文本的二次修改（setValue 多余调用）

- 更新人：Garry

## [v0.2.067] - 2026-05-03

### 修复
- findAndReplaceUrl 正则修复：去除首尾斜杠的正则表达式错误

- 更新人：Garry

## [v0.2.066] - 2026-05-03

### 修复
- sign URL /d/ 路径匹配：extractRealPath 去掉 /d/ 前缀但 findAndReplaceUrl 保留前缀

- 更新人：Garry

## [v0.2.065] - 2026-05-03

### 修复
- 批量 sign 刷新累积修改：每次都用原始文本重新读取导致URL重复或丢失
- 光标位置保护：setValue 后清除选择区

- 更新人：Garry

## [v0.2.064] - 2026-05-02

### 修复
- 补全 EN 翻译：4 个 key 缺失

- 更新人：Garry

## [v0.2.062] - 2026-05-02

### 修复
- S3 delete 绕过 CORS：改用 signQuery 生成 presigned URL + requestViaObsidian

- 更新人：Garry

## [v0.2.061] - 2026-05-02

### 修复
- S3 getFileUrl publicUrl 裸域名加协议前缀

- 更新人：Garry

## [v0.2.060] - 2026-05-01

### 修复
- S3 getFileUrl 优先使用 publicUrl 自定义域名
- S3 getFileUrl 协议继承顺序修正
- 图片 markdown alt 格式修正

- 更新人：Garry

## [v0.2.059] - 2026-05-01

### 修复
- S3 getFileUrl 协议不再强制写死 https

- 更新人：Garry

## [v0.2.058] - 2026-05-01

### 修复
- S3 signQuery 签名回归：回退为只签名 host + extraHeaders

- 更新人：Garry

## [v0.2.057] - 2026-05-01

### 修复
- OpenList getSignedUrl 恢复 safeDecodeUrl 解码

- 更新人：Garry

## [v0.2.056] - 2026-05-01

### 修复
- S3 getFileUrl 协议尊重用户配置
- 批量插入文件之间加空行

- 更新人：Garry

## [v0.2.053] - 2026-05-01

### 修复
- 协议不再强制写死 https（三处）
- OpenList URL 保留中文原文

- 更新人：Garry

## [v0.2.052] - 2026-05-01

### 修复
- OpenList URL 编码策略重构
- 签名刷新路径匹配扩大

- 更新人：Garry

## [v0.2.049] - 2026-05-01

### 修复
- 光标位置保护
- OpenList URL 编码

- 更新人：Garry

## [v0.2.044] - 2026-04-26

### 修复
- WebDAV 上传 URL 编码

- 更新人：Garry

## [v0.2.043] - 2026-04-26

### 修复
- WebDAV 目录解析兼容性：命名空间匹配优化

- 更新人：Garry

## [v0.2.042] - 2026-04-26

### 修复
- 热更新验证测试

- 更新人：Garry

## [v0.2.041] - 2026-04-26

### 修复
- 热更新修复：改用 app.vault.adapter.stat()

- 更新人：Garry

## [v0.2.040] - 2026-04-26

### 修复
- 热更新诊断：添加日志定位失效原因

- 更新人：Garry

## [v0.2.039] - 2026-04-26

### 修复
- 批量上传引用格式化统一

- 更新人：Garry

## [v0.2.038] - 2026-04-26

### 修复
- 批量上传引用间距调整

- 更新人：Garry

## [v0.2.037] - 2026-04-26

### 修复
- 批量上传引用间距优化

- 更新人：Garry

## [v0.2.036] - 2026-04-26

### 修复
- uploadAllAttachments 路径解析修复

- 更新人：Garry

## [v0.2.035] - 2026-04-24

### 修复
- OpenList/WebDAV 账户判断从 username 改为 token

- 更新人：Garry

## [v0.2.034] - 2026-04-24

### 修复
- WebDAV XML 命名空间大小写兼容（D: 和 d:）

- 更新人：Garry

## [v0.2.033] - 2026-04-24

### 修复
- URL 插入/复制链接区分 WebDAV 和 OpenList
- WebDAV rename 走 MOVE 方法

- 更新人：Garry

## [v0.2.032] - 2026-04-24

### 修复
- OpenList rename API 请求 body 补充 dst_name
- 上传后 URL 选择区分账户类型

- 更新人：Garry

## [v0.2.031] - 2026-04-23

### 修复
- WebDAV 中文路径编码：新增 encodePath() 方法

- 更新人：Garry

## [v0.2.030] - 2026-04-23

### 修复
- WebDAV listDirectory 支持
- WebDAV delete/rename 分支
- WebDAV XML 解析改为小写 d: 前缀

- 更新人：Garry

## [v0.2.029] - 2026-04-23

### 修复
- S3 403：AWS SigV4 canonicalHeaders 缺少尾部 \n

- 更新人：Garry

## [v0.2.028] - 2026-04-22

### 修复
- S3Client.rename 签名修复

- 更新人：Garry

## [v0.2.027] - 2026-04-22

### 修复
- OpenList token 401：Authorization header 不需要 Bearer 前缀（4处）

- 更新人：Garry

## [v0.2.026] - 2026-04-22

### 变更
- 添加详细日志用于调试 token 认证

- 更新人：Garry

## [v0.2.025] - 2026-04-22

### 新增
- 401 响应自动重新登录机制

- 更新人：Garry

## [v0.2.024] - 2026-04-22

### 修复
- 认证相关修复

- 更新人：Garry

## [v0.2.023] - 2026-04-22

### 修复
- 路径处理修复

- 更新人：Garry

## [v0.2.022] - 2026-04-22

### 修复
- 小幅修复

- 更新人：Garry

## [v0.2.021] - 2026-04-22

### 变更
- 大规模重构优化

- 更新人：Garry

## [v0.2.005] - 2026-04-21

### 修复
- 部署脚本修复

- 更新人：Garry

## [v0.2.001] - 2026-04-21

### 新增
- 批量删除：文件夹 checkbox 选择
- 重命名：右键菜单重命名功能
- 仅操作云端不碰笔记
- i18n 支持（zh/en）

- 更新人：Garry

## [v0.1.096] - 2026-04-21

### 修复
- Python deploy.sh 字符串转义导致 S3 签名代码语法错误

- 更新人：Garry

## [v0.1.095] - 2026-04-20

### 新增
- 开发模式文件监听，main.js 变化自动 disablePlugin → enablePlugin

- 更新人：Garry

## [v0.1.093-094] - 2026-04-19

### 修复
- URL 编码修复：中文保留原文，特殊字符必须编码
- 新增 safeEncodePath 和 safeDecodeUrl 方法

- 更新人：Garry

## [v0.1.074-088] - 2026-04-18

### 新增
- i18n 国际化：内置 I18n 对象 + t() 函数
- ~90+ 处硬编码中文替换为 i18n key

### 修复
- getFirstLinkpathDest 第二参数修正
- doUpload 作用域错误

- 更新人：Garry

## [v0.1.063-074] - 2026-04-17

### 新增
- S3Client.uploadFile（presigned PUT URL）
- 社区插件准备（LICENSE/README/manifest.json）

### 修复
- wiki-link 替换逻辑
- 空格文件名路径解析 bug
- S3 CORS 配置

- 更新人：Garry

## [v0.1.058-062] - 2026-04-16

### 修复
- 正则重复行清理
- wiki-link ![[path]] 支持
- leaves[0].view 类型修正
- getFirstLinkpathDest 模糊路径解析
- vault.delete API 命名

- 更新人：Garry
