[English](README_EN.md) | 中文

# obsidian-cloud-attach

> Obsidian 插件，通过 WebDAV 连接 OpenList 等服务 以及 对象存储服务，在笔记中直接插入云端文件。释放本地空间。

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/curryhendry/obsidian-cloud-attach?style=flat-square)](https://github.com/curryhendry/obsidian-cloud-attach/releases/latest)
[![GitHub stars](https://img.shields.io/github/stars/curryhendry/obsidian-cloud-attach?style=flat-square)](https://github.com/curryhendry/obsidian-cloud-attach)
[![MIT License](https://img.shields.io/github/license/curryhendry/obsidian-cloud-attach?style=flat-square)](LICENSE)

---

## 项目背景

- 坚定的 Obsidian 库内 0 附件使用者
- 重度 OpenList 依赖者
- 前电商从业者，0 代码基础
- 全程 🦞 龙虾操作，目前消耗 token：📈8000W 左右

---

## 功能特点

- 🌐 **WebDAV 协议** — 兼容 OpenList，理论上支持 Alist / 群晖 / 威联通 QNAP 等所有 WebDAV 服务
- 🌐 **S3对象存储 协议** - 兼容CloudFlare，理论上支持ASW等大部分对象存储服务
- 📂 **侧边栏浏览** — 直接在 Obsidian 侧边栏浏览云端目录
- 📝 **一键插入** — 单击插入 Markdown 链接，支持单选/多选同时插入
- ⬆️ **上传附件** - 直接上传附件到服务器并修改饮用方式 节约本地空间
- 🔗 **签名链接** — 自动生成带 sign 签名的 URL
- 🖼️ **多媒体预览** — 图片预览、视频/音频播放、文档 iframe 预览
- 👤 **多账号切换** — 同时管理多个 WebDAV 服务

*注：对象存储可能无法使用iframe在线预览，这个取决于各服务商限制，暂时没有更好的兼容办法。建议先用openlist挂载对象存储，再使用OpenList的iframe预览，曲线救国。

---

## 安装

**方式一：下载 ZIP**

1. 点击本仓库 *Code* → *Download ZIP*
2. 解压后放入 `<vault>/.obsidian/plugins/cloud-attach/` 目录


**方式二：按版本下载**（首选）

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

对象存储：
<img width="1075" height="761" alt="68747470733a2f2f696d672e637572727968656e6472792e636f6d2f2545342542392542312545342542382538332545352538352541422545372542332539462f6f6273696469616e2d636c6f75642d6174746163682f2545362542372542422545352538412541302545362539432538442545352538412541312…" src="https://github.com/user-attachments/assets/6866656b-9e84-4b07-851d-3c892f06f6c0" />

---

## 使用

1. 点击侧边栏图标打开云端文件面板
2. 浏览目录，单击文件名插入链接
3. 右键有更多操作（预览、复制、删除）

<img width="1075" height="761" alt="68747470733a2f2f696d672e637572727968656e6472792e636f6d2f2545342542392542312545342542382538332545352538352541422545372542332539462f6f6273696469616e2d636c6f75642d6174746163682f2545362542372542422545352538412541302545362539432538442545352538412541312…" src="https://github.com/user-attachments/assets/eb981cf0-38d9-4d72-aa27-6a94254b65c6" />
<br>

**插入资源到笔记：**
<img width="1280" height="800" alt="插入资源-720p" src="https://github.com/user-attachments/assets/3378be76-0317-4b55-85a5-eaa1c0eb7d2d" />
<br>


**上传附件到服务器：**
<img width="1280" height="800" alt="上传附件-720p" src="https://github.com/user-attachments/assets/15261330-aeca-42bf-aa2d-67dbac244abf" />

---

## 后续规划

- [x] 对象存储支持（Cloudflare R2 为主）
- [ ] 笔记内搜索服务器文件并插入（暂时没有好的思路，搁置中）
- [x] 手动触发检测并更新失效 sign
- [x] 笔记附件半自动上传
- [x] command+P命令菜单
- [ ] 上架Obsidian商店

---

## 更新日志

[Releases](https://github.com/curryhendry/obsidian-cloud-attach/releases)


---

## 致谢

- [Obsidian](https://obsidian.md)
- [OpenList](https://github.com/OpenListTeam/OpenList)

---

欢迎提交 Issue 和 Pull Request！
