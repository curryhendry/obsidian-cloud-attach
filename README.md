# obsidian-cloud-attach

> Obsidian 插件，通过 WebDAV 连接 OpenList / Alist / 群晖 NAS，在笔记中直接插入云端文件。

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/curryhendry/obsidian-cloud-attach?style=flat-square)](https://github.com/curryhendry/obsidian-cloud-attach/releases/latest)

## Features

- 🔗 WebDAV 协议，兼容 OpenList / Alist / 群晖等
- 📂 侧边栏浏览云端目录
- 📝 单击插入 Markdown 链接
- 🖼️ 音视频直接播放，文档 iframe 预览
- 👤 多账号切换

## Install

**BRAT（推荐）**

1. 安装 [BRAT](https://obsidian.md/plugins?id=obsidian-brat)
2. BRAT → Add a beta plugin → 填入：
   ```
   https://github.com/curryhendry/obsidian-cloud-attach
   ```
3. 启用 CloudAttach

**手动**

下载 `main.js` 和 `manifest.json` 放入：
```
<vault>/.obsidian/plugins/cloud-attach/
```

## Config

插件设置中添加账号：

| 字段 | 说明 |
|------|------|
| 服务器地址 | OpenList / Alist 的 URL |
| 用户名 / 密码 | WebDAV 认证信息 |
| WebDAV 路径 | 通常填 `/dav` |
| Token | 从 OpenList Web 界面获取 |

## Usage

1. 点击侧边栏图标打开面板
2. 浏览目录，单击文件名插入链接
3. 右键有更多操作（预览、复制、删除）

## Changelog

### [v0.0.028](https://github.com/curryhendry/obsidian-cloud-attach/releases/tag/v0.0.028) — 初始版本

- WebDAV 云存储连接
- 文件浏览与插入
- 图片 / 音视频 / 文档预览
- 多账号管理

## License

MIT
