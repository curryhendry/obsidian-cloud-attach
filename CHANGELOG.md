# Changelog

All notable changes to CloudAttach will be documented in this file.

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
