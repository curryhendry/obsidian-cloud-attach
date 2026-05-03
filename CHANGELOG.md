## [v0.2.067] - 2026-05-03

### Fixed
- **findAndReplaceUrl 正则修复**: 修复路径匹配时去除首尾斜杠的正则表达式错误（`/^\/+\/+$/g` → `/^\/+/` + `/\/$/`）
- 更名人：Garry

## [v0.2.066] - 2026-05-03

### Fixed
- **sign URL /d/ 路径匹配**: 批量刷新 sign URL 时 extractRealPath 去掉 /d/ 前缀，但 findAndReplaceUrl 保留前缀，导致匹配失败
- 更名人：Garry

## [v0.2.065] - 2026-05-03

### Fixed
- **批量 sign 刷新累积修改**: 修复批量刷新 sign URL 时每次都用原始文本重新读取的 bug，导致URL重复或丢失
- **光标位置保护**: setValue 后清除选择区（setSelection），防止全选状态
- 更名人：Garry

### Fixed
- **S3 delete 绕过 CORS**: delete 方法改用 signQuery 生成 presigned URL + requestViaObsidian 发送 DELETE 请求，与 upload 同一模式，绕过七牛云 S3 CORS 限制
- 更名人：Garry

## [v0.2.062] - 2026-05-02

### Fixed
- **S3 getFileUrl 协议继承顺序**: customHost 无协议时从 endpoint 取协议；endpoint 也有从 endpoint 取；都没有才默认 http；更名人：Garry

## [v0.2.061] - 2026-05-02

### Fixed
- **S3 getFileUrl publicUrl 裸域名加协议前缀**: 用户配置的自定义域名可能是裸域名（如 qiniu.002814.xyz），之前版本会直接拼接导致 URL 缺少协议；新增协议检测，无 http 前缀时自动加上 https://

## [v0.2.058] - 2026-05-01

### Fixed
- **S3 signQuery 签名回归**: v0.2.056 在 allSignedHeaders 中加入了 `x-amz-date` 和 `x-amz-content-sha256`，导致签名范围扩大，R2 等兼容存储返回 403；回退为只签名 host + extraHeaders

## [v0.2.057] - 2026-05-01

### Fixed
- **OpenList getSignedUrl 恢复 safeDecodeUrl 解码**: raw_url 全编码（含 `%2F` 和 `%E6%82%A8` 等），直接返回会导致 URL 不可用；恢复使用实例方法 `this.safeDecodeUrl()` 解码后再 safePath 规则重新编码，保留中文原文、编码必要特殊字符
- **图片 alt 文本加空格**: `![8](url)` 的 alt 文本 "8" 会被 Obsidian 误解为宽度参数；改为 `![8 ](url)` 加空格避免误解析


## [v0.2.056] - 2026-05-01

### Fixed
- **S3 getFileUrl 协议尊重用户配置**: 改用 `this.endpoint`（含用户配置的 http/https）替代硬编码 `https://` fallback
- **批量插入文件之间加空行**: `mds.map(md => md + '\n').join('\n')`，每条 markdown 后多加一个换行，文件之间形成段落空行分隔

## [v0.2.053] - 2026-05-01

### Fixed
- **协议不再强制写死 https**: getSignedUrl、getFileUrl、getRawUrl 三处均改为保留用户配置的原始协议（http/https），不再强制改为 https
- **OpenList URL 保留中文原文**: getSignedUrl/getFileUrl/getRawUrl 三处均去掉 encodeURIComponent，中文路径不再被编码为 `%E6%9D%82...`

## [v0.2.052] - 2026-05-01

### Fixed
- **OpenList URL 编码策略重构**: getSignedUrl 不再直接使用 API raw_url（返回全编码，含中文 `%E7%85%A7`），改为让 fallback 的 `encodePath` 生效——`split('/').map(encodeURIComponent).join('/')` 保留中文原文，`/` 不编码为空格
- **签名刷新路径匹配扩大**: findAndReplaceUrl 正则从 `/p/` 限定改为匹配任意 https URL，按 decoded path 匹配 realPath，S3/WebDAV URL 全部生效

## [v0.2.049] - 2026-05-01

### Fixed
- **光标位置保护**: doUpload、sign 刷新等所有 setValue 操作前后保存/恢复光标位置，解决上传后光标跳顶/全选问题
- **OpenList URL 编码**: getSignedUrl 移除 safeDecodeUrl，OpenList 返回的 URL 中文已编码无需解码（与 safePath 规则一致）
- **S3 URL 编码确认**: S3 getSignedUrl/getFileUrl 保持 encodeURIComponent 编码，S3 签名依赖路径编码不能解码

## [v0.2.044] - 2026-04-26

### Fixed
- **WebDAV 上传 URL 编码**: 修复上传请求 URL 未编码的问题，现在与 DELETE/MOVE 操作保持一致，使用 encodePath 全编码路径

## [v0.2.043] - 2026-04-26

### Fixed
- **WebDAV 目录解析兼容性**: 改用 getElementsByTagNameNS（命名空间匹配）优先，兜底多种前缀；修复子元素查询范围（doc→resp）；增加 XML 解析错误检测和路径过滤警告

## [v0.2.042] - 2026-04-26

### Fixed
- **热更新验证**: 测试热更新是否正常工作

## [v0.2.041] - 2026-04-26

### Fixed
- **热更新修复**: 改用 app.vault.adapter.stat() 替代 getAbstractFileByPath，解决 .obsidian 目录不在 vault 索引中的问题

## [v0.2.040] - 2026-04-26

### Fixed
- **热更新诊断**: 添加 getAbstractFileByPath 结果日志，定位热更新失效原因

# Changelog

All notable changes to CloudAttach will be documented in this file.

## [v0.2.039] - 2026-04-26

### Fixed
- **批量上传引用格式化统一**: 替换时不再添加额外换行，保留原笔记的换行格式

## [v0.2.038] - 2026-04-26

### Fixed
- **批量上传引用间距调整**: 每个引用之间保留一个空行（之前多了换行）

## [v0.2.037] - 2026-04-26

### Fixed
- **批量上传引用间距优化**: 替换笔记中的附件引用时，每个引用之间添加空行，提升可读性

## [v0.2.036] - 2026-04-26

### Fixed
- **uploadAllAttachments 路径解析修复**: 使用 `metadataCache.getFirstLinkpathDest` 正确解析附件路径，与单文件上传逻辑保持一致
  - 之前直接拼接 `noteDir + localPath`，无法处理 vault 根相对路径（如 `玩具收藏/模玩/IMG_xxx.jpg`）
  - 修复后支持相对路径、绝对路径、`../` 导航等多种路径格式

## [v0.2.035] - 2026-04-24

### Fixed
- **OpenList URL 签名回归修复**: 区分 OpenList 和 WebDAV 账户的判断从 `this.username` 改为 `this.token`（3 处：上传、复制链接、插入笔记）
  - OpenList 账户同时有 username 和 token，之前误判为 WebDAV 导致插入的 URL 缺少 sign 签名
- README / README_EN token 消耗数据更新（~80M → ~85M）

## [v0.2.034] - 2026-04-24

### Fixed
- **WebDAV XML 命名空间大小写兼容**: 6 处 `getElementsByTagName` 同时兼容 `D:` 和 `d:` 前缀
  - v0.2.030 改为小写 `d:` 导致 OpenList（大写 `D:` 前缀）目录显示为空

## [v0.2.033] - 2026-04-24

### Fixed
- **URL 插入/复制链接**: WebDAV 账户（有 username）使用 `getFileUrl`，OpenList/S3 使用 `getSignedUrl`
- **WebDAV rename API 分支**: 有 username/password 时走 WebDAV MOVE，否则走 OpenList `/api/fs/rename`

## [v0.2.032] - 2026-04-24

### Fixed
- **OpenList rename API**: 请求 body 添加 `dst_name` 字段
- **上传后 URL 选择**: WebDAV 账户用 `getFileUrl`，OpenList/S3 用 `getSignedUrl`
- **S3Client requestViaObsidian**: 错误返回对象补充 `text` 字段
- 移除 `doc.parseError?.errorCode`（IE 遗留属性，现代浏览器恒为 undefined）

## [v0.2.031] - 2026-04-23

### Fixed
- **WebDAV 中文路径编码**: 新增 `encodePath()` 方法，对路径每段 `encodeURIComponent`（保留 `/` 分隔符）
  - 修复 WebDAV DELETE 和 MOVE 请求因中文路径未编码导致的 400/403 错误

## [v0.2.030] - 2026-04-23

### Fixed
- **WebDAV listDirectory 支持**: 修复 `requestViaObsidian` 对 207 Multi-Status 响应的处理（之前抛异常导致返回空目录）
- **WebDAV delete/rename 分支**: 有 username/password 时走原生 WebDAV 协议（DELETE / MOVE），不走 OpenList API
- **WebDAV XML 解析**: 改为小写 `d:` 命名空间前缀（适配坚果云等服务器）
- **requestViaObsidian 增强**: catch 块提取响应文本，207 状态码视为成功

## [Unreleased]

### Fixed
- i18n: 5 处硬编码 UI 字符串改用 `t()` 函数（标题栏、面包屑分隔符、刷新按钮、类型标签、WebDAV 徽章）
- WebDAV: 默认路径不再强制 `/dav`，留空即可（6 处修改）

## [v0.2.029] - 2026-04-23

### Fixed
- **S3 403 问题修复**: AWS SigV4 签名 `canonicalHeaders` 缺少尾部 `\n`（4 处）
  - `computeSignature` (L1405)
  - `signQuery` (L1454)
  - `_s3DirectRequest` (L1575)
  - `rename` (L1690)
- S3 (Cloudflare R2) listDirectory 恢复正常

## [v0.2.028] - 2026-04-22

### Fixed
- S3Client.rename 签名修复（canonicalHeaders 尾部 `\n`）

## [v0.2.027] - 2026-04-22

### Fixed
- **OpenList token 401 问题修复**: Authorization header 不需要 "Bearer " 前缀（4 处）
  - authFetch (L568)
  - re-login 重试 (L592)
  - listDirectoryAPI (L845)
  - getSignedUrl (L1076)
- OpenList API 认证恢复正常

## [v0.2.026] - 2026-04-22

### Changed
- 添加详细日志用于调试 token 认证问题

## [v0.2.025] - 2026-04-22

### Added
- 401 响应自动重新登录机制

## [v0.2.024] - 2026-04-22

### Fixed
- 认证相关修复

## [v0.2.023] - 2026-04-22

### Fixed
- 路径处理修复

## [v0.2.022] - 2026-04-22

### Fixed
- 小幅修复

## [v0.2.021] - 2026-04-22

### Changed
- 大规模重构优化

## [v0.2.005] - 2026-04-21

### Fixed
- 部署脚本修复

## [v0.2.001] - 2026-04-21

### Added
- **批量删除**: 文件夹 checkbox 选择，批量删除所选文件
- **重命名**: 右键菜单重命名功能
- 仅操作云端不碰笔记
- 冲突报错不覆盖
- i18n 支持（zh/en）

## [v0.1.096] - 2026-04-21

### Fixed
- Python deploy.sh 脚本字符串转义导致 S3 签名代码语法错误

## [v0.1.095] - 2026-04-20

### Added
- 开发模式文件监听，main.js 变化自动 disablePlugin → enablePlugin

## [v0.1.093-094] - 2026-04-19

### Fixed
- **URL 编码修复**: 中文保留原文，特殊字符（% 空格 # ? & < > " ' \ | { }）必须编码
- 新增 `safeEncodePath` 和 `safeDecodeUrl` 方法
- sign URL 刷新时编码不一致导致替换失败的问题

## [v0.1.074-088] - 2026-04-18

### Added
- **i18n 国际化**: 内置 I18n 对象 + t() 函数，自动检测 `app.vault.config.language`
- ~90+ 处硬编码中文替换为 i18n key

### Fixed
- `getFirstLinkpathDest` 第二参数从 `'/'` 改为 `notePath`
- `doUpload` 作用域错误（notePath 引用越界）

## [v0.1.063-074] - 2026-04-17

### Added
- S3Client.uploadFile（presigned PUT URL）
- 社区插件准备（LICENSE/README/manifest.json）

### Fixed
- wiki-link 替换逻辑
- 空格文件名路径解析 bug
- S3 CORS 配置

## [v0.1.058-062] - 2026-04-16

### Fixed
- 正则重复行清理
- wiki-link `![[path]]` 支持
- `leaves[0].view` 类型修正
- `getFirstLinkpathDest` 模糊路径解析
- `vault.delete` API 命名

---

> 注意：更早版本的详细变更记录未保留，以上信息基于 git history 和 memory 反推。

## v0.2.060 (2026-05-01)

### 修复
- S3 getFileUrl publicUrl 裸域名加 https:// 前缀 (L1371)
- S3 getFileUrl (L1370)：优先使用 publicUrl 自定义域名，回退用 endpoint
- 图片 markdown alt 格式 (L2308)：去除尾随空格
- 更名人：Garry

## v0.2.059 (2026-05-01)


## v0.2.064 (2026-05-02)

### 修复
- 补全 EN 翻译：4 个 key 缺失（error.rebuild_failed, error.sign_rebuild_failed, settings.check_account_settings, view.upload_to）
- 更名人：Garry
