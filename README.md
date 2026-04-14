# Obsidian Cloud Attach

一款 Obsidian 笔记软件插件，通过 WebDAV 协议连接 OpenList / Alist 等云存储，在笔记中直接插入云端文件链接。

## 功能特性

- 🔗 **WebDAV 连接**：支持 OpenList、Alist、群晖 WebDAV 等
- 📂 **文件浏览**：在侧边栏浏览云端目录结构
- 📝 **一键插入**：点击文件自动生成 Markdown 链接
- 🖼️ **多媒体预览**：图片直接嵌入、音视频可播放
- 📄 **文档预览**：PDF、DOCX、PPTX 等支持 iframe 内嵌预览
- 🔐 **多账号切换**：支持同时管理多个云存储账号

## 支持的文件类型

| 类型 | 插入格式 |
|------|----------|
| 图片 (jpg, png, gif, webp...) | `![](url)` 直接嵌入 |
| 音视频 (mp4, mp3...) | HTML5 `<video>` / `<audio>` |
| 文档 (pdf, docx, xlsx...) | `<iframe>` 内嵌预览 |
| 其他 | `[文件名](url)` 普通链接 |

## 安装

### 方式一：BRAT（推荐）

1. 安装 [BRAT](https://obsidian.md/plugins?id=obsidian-brat) 插件
2. 在 BRAT 中添加仓库地址：
   ```
   https://github.com/curryhendry/obsidian-cloud-attach
   ```
3. 启用插件

### 方式二：手动安装

1. 下载最新版本的 `main.js` 和 `manifest.json`
2. 放入 Obsidian 插件目录：
   ```
   <vault>/.obsidian/plugins/cloud-attach/
   ```
3. 启用插件

## 配置

1. 打开 Obsidian **设置 → 社区插件 → CloudAttach**
2. 添加账号，填写以下信息：
   - **服务器地址**：OpenList/Alist 的 URL
   - **用户名 / 密码**：WebDAV 认证信息
   - **WebDAV 路径**：通常为 `/dav`
   - **OpenList Token**：从 OpenList Web 界面获取

## 使用方法

1. 点击左侧边栏图标打开 CloudAttach 面板
2. 浏览云端目录，找到要插入的文件
3. **单击文件名**：插入 Markdown 链接
4. **右键菜单**：预览、复制链接、删除等操作

## 更新日志

### v0.0.028
- iframe 预览使用无签名直链，提升兼容性
- 中文路径保留原文，提升可读性

### v0.0.016 - 初始版本

## License

MIT
