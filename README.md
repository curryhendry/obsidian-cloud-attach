# obsidian-cloud-attach

> Obsidian 插件，通过 WebDAV 连接 OpenList 等 WebDAV 服务，在笔记中直接插入云端文件。

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/curryhendry/obsidian-cloud-attach?style=flat-square)](https://github.com/curryhendry/obsidian-cloud-attach/releases/latest)
[![GitHub stars](https://img.shields.io/github/stars/curryhendry/obsidian-cloud-attach?style=flat-square)](https://github.com/curryhendry/obsidian-cloud-attach)
[![MIT License](https://img.shields.io/github/license/curryhendry/obsidian-cloud-attach?style=flat-square)](LICENSE)

---

## 项目背景

- 坚定的 Obsidian 笔记库内 0 附件使用者
- 重度 OpenList 依赖
- 前电商从业者，0 代码基础
- 全程 🦞 龙虾操作，目前消耗 token：2500W 左右

---

## 功能特点

- 🌐 **WebDAV 协议** — 兼容 OpenList，理论上支持 Alist / 群晖 / 威联通 QNAP 等所有 WebDAV 服务
- 📂 **侧边栏浏览** — 直接在 Obsidian 侧边栏浏览云端目录
- 📝 **一键插入** — 单击插入 Markdown 链接，支持单选/多选同时插入
- 🔗 **签名链接** — 自动生成带 sign 签名的 URL
- 🖼️ **多媒体预览** — 图片预览、视频/音频播放、文档 iframe 预览
- 👤 **多账号切换** — 同时管理多个 WebDAV 服务

---

## 安装

**方式一：下载 ZIP**

1. 点击本仓库 *Code* → *Download ZIP*
2. 解压后放入 `<vault>/.obsidian/plugins/cloud-attach/` 目录

**方式二：按版本下载**

前往 [Releases](https://github.com/curryhendry/obsidian-cloud-attach/releases) 下载对应版本。

---

## 配置

插件设置中添加账号：

| 字段 | 说明 |
|------|------|
| 服务器地址 | OpenList 的 URL |
| 用户名 / 密码 | WebDAV 认证信息 |
| WebDAV 路径 | 通常填 `/dav` |
| Token | 从 OpenList「设置 → 其他」界面获取 |

---

## 使用

1. 点击侧边栏图标打开云端文件面板
2. 浏览目录，单击文件名插入链接
3. 右键有更多操作（预览、复制、删除）

![添加服务](https://img.curryhendry.com/obsidian-cloud-attach/添加服务.png)

![截图](https://img.curryhendry.com/obsidian-cloud-attach/截图.png)

---

## 后续规划

- [ ] 对象存储支持（Cloudflare R2 为主）
- [ ] 笔记内搜索服务器文件并插入
- [ ] 附件移动后自动检测并更新失效 sign
- [ ] 笔记附件半自动上传

---

## 更新日志

### [v0.0.028](https://github.com/curryhendry/obsidian-cloud-attach/releases/tag/v0.0.028) — 初始版本

- [x] WebDAV 服务添加与管理
- [x] 多服务切换
- [x] 单/多个附件插入
- [x] 多媒体格式识别与预览

---

## 致谢

- [Obsidian](https://obsidian.md)
- [OpenList](https://github.com/OpenListTeam/OpenList)

---

欢迎提交 Issue 和 Pull Request！
