# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.029] - 2026-04-15

### Added
- `deploy.sh` 部署脚本，支持自动版本号、manifest.json 更新、git tag 和 push

## [v0.1.021] - 2026-04-14

### Fixed
- `getActiveLeaf` → `getMostRecentLeaf`（适配新版 Obsidian API）

## [v0.1.020] - 2026-04-14

### Fixed
- 修复 `hmacSha256`，正确处理 `Uint8Array` 类型的 key
- 修复 `canonicalUri`，objectKey 为空时不加尾部斜杠
- 修复签名参数排序，改为字节序替代 `localeCompare`

## [v0.1.019] - 2026-04-14

### Fixed
- 用 `presigned URL` 替代 `Authorization` 头，绕过 CORS 限制
- 修复 presigned URL 拼接，objectKey 为空时正确处理
- 移除 `app.requestUrl`，统一使用原生 `fetch`

## [v0.1.018] - 2026-04-13

### Added
- 对象存储支持（Cloudflare R2 为主）
- 修复一定的 CORS 问题

## [v0.0.028] - 2026-04-13

### Added
- WebDAV 服务添加与管理
- 多服务切换
- 单/多个附件插入
- 多媒体格式识别与预览
