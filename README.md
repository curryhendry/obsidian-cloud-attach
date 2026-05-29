中文 | [English](README_EN.md)

# obsidian-cloud-attach

> Obsidian 插件，通过 WebDAV 连接 OpenList 等服务以及对象存储（S3），在笔记中直接插入云端文件。释放本地空间。

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/curryhendry/obsidian-cloud-attach?style=flat-square)](https://github.com/curryhendry/obsidian-cloud-attach/releases/latest)
[![GitHub stars](https://img.shields.io/github/stars/curryhendry/obsidian-cloud-attach?style=flat-square)](https://github.com/curryhendry/obsidian-cloud-attach)
[![MIT License](https://img.shields.io/github/license/curryhendry/obsidian-cloud-attach?style=flat-square)](LICENSE)

---

## 项目背景

- 坚定的 Obsidian 库内 0 附件使用者
- 重度 OpenList 依赖者
- 前电商从业者，0 代码基础
- 全程 🦞 龙虾操作，目前消耗 token：📈13000W 左右

---

## 功能特点

- 🌐 **WebDAV 协议** — 兼容 OpenList，理论上支持 Alist / 群晖 / 威联通 QNAP 等所有 WebDAV 服务
- 🌐 **S3 对象存储** — 兼容 Cloudflare R2，理论上支持 AWS 等大部分 S3 兼容服务
- 📂 **侧边栏浏览** — 直接在 Obsidian 侧边栏浏览云端目录
- 📝 **一键插入** — 单击插入 Markdown 链接，支持单选/多选同时插入
- ⬆️ **上传附件** — 上传本地附件到服务器并更新引用，节省本地空间
- 🔗 **签名链接** — 自动生成带 sign 签名的 URL
- 🖼️ **多媒体预览** — 图片预览、视频/音频播放、文档 iframe 预览
- 👤 **多账号切换** — 同时管理多个 WebDAV/S3 账号

*注：对象存储可能无法使用 iframe 在线预览，取决于各服务商限制。建议先用 OpenList 挂载对象存储，再使用 OpenList 的 iframe 预览。*

---

## 安装

**方式一：下载 ZIP**

1. 点击本仓库 *Code* → *Download ZIP*
2. 解压后放入 `<vault>/.obsidian/plugins/cloud-attach/` 目录

**方式二：按版本下载**（推荐）

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

对象存储配置：
<img alt="对象存储配置" src="https://github.com/user-attachments/assets/6866656b-9e84-4b07-851d-3c892f06f6c0" />

---

## 使用

1. 点击侧边栏图标打开云端文件面板
2. 浏览目录，单击文件名插入链接
3. 右键有更多操作（插入、复制链接、重命名、删除）

<img alt="侧边栏浏览" src="https://github.com/user-attachments/assets/cdfdc813-a6a0-4ba1-ae7c-effb224a6981" />
<br>

**插入资源到笔记：**
<img alt="插入资源" src="https://github.com/user-attachments/assets/3378be76-0317-4b55-85a5-eaa1c0eb7d2d" />
<br>

**上传附件到服务器：**
<img alt="上传附件" src="https://github.com/user-attachments/assets/15261330-aeca-42bf-aa2d-67dbac244abf" />

---

## 后续规划

- [x] 对象存储支持（Cloudflare R2 为主）
- [ ] 笔记内搜索服务器文件并插入（暂时没有好的思路，搁置中）
- [x] 手动触发检测并更新失效 sign
- [x] 笔记附件半自动上传
- [x] Cmd/Ctrl+P 命令菜单
- [x] 上架 Obsidian 商店
- [x] 支持文件重命名、删除

---

## 更新日志

[Releases](https://github.com/curryhendry/obsidian-cloud-attach/releases)

---

## 致谢

- [Obsidian](https://obsidian.md)
- [OpenList](https://github.com/OpenListTeam/OpenList)

---

欢迎提交 Issue 和 Pull Request！
