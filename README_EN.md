English | [中文](README.md)

# obsidian-cloud-attach

> Obsidian plugin that connects to OpenList/WebDAV services and object storage (S3), letting you insert cloud files directly into your notes. Free up local space.

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/curryhendry/obsidian-cloud-attach?style=flat-square)](https://github.com/curryhendry/obsidian-cloud-attach/releases/latest)
[![GitHub stars](https://img.shields.io/github/stars/curryhendry/obsidian-cloud-attach?style=flat-square)](https://github.com/curryhendry/obsidian-cloud-attach)
[![MIT License](https://img.shields.io/github/license/curryhendry/obsidian-cloud-attach?style=flat-square)](LICENSE)

---

## Background

- A firm believer in the 'Zero-Attachment' workflow in Obsidian.
- Heavy OpenList user
- Former e-commerce practitioner, zero coding background
- Built entirely with 🦞 (AI-assisted), token consumption: ~95M and counting

---

## Features

- 🌐 **WebDAV Protocol** — Compatible with OpenList, theoretically supports all WebDAV services (Alist, Synology, QNAP, etc.)
- 🌐 **S3 Object Storage** — Compatible with Cloudflare R2, theoretically supports AWS and most S3-compatible services
- 📂 **Sidebar Browser** — Browse cloud directories directly in the Obsidian sidebar
- 📝 **One-Click Insert** — Click to insert Markdown links; supports single and batch insertion
- ⬆️ **Upload Attachments** — Upload local attachments to the server and update references, saving local space
- 🔗 **Signed URLs** — Auto-generate URLs with sign tokens
- 🖼️ **Media Preview** — Image preview, video/audio playback, document iframe preview
- 👤 **Multi-Account** — Manage multiple WebDAV/S3 accounts simultaneously

*Note: Object storage may not support iframe preview due to provider restrictions. A workaround is to mount object storage via OpenList and use its iframe preview.*

---

## Installation

**Option 1: Download ZIP**

1. Click *Code* → *Download ZIP* in this repository
2. Extract and place in `<vault>/.obsidian/plugins/cloud-attach/`

**Option 2: Download by Release** (recommended)

Visit [Releases](https://github.com/curryhendry/obsidian-cloud-attach/releases) to download a specific version.

---

## Configuration

Add accounts in plugin settings:

| Field | Description |
|-------|-------------|
| Server URL | OpenList URL |
| Username / Password | WebDAV credentials |
| WebDAV Path | Usually `/dav` |
| Token | Get from OpenList Settings → Other |

Object storage:
<img width="1075" height="761" alt="68747470733a2f2f696d672e637572727968656e6472792e636f6d2f2545342542392542312545342542382538332545352538352541422545372542332539462f6f6273696469616e2d636c6f75642d6174746163682f2545362542372542422545352538412541302545362539432538442545352538412541312…" src="https://github.com/user-attachments/assets/6866656b-9e84-4b07-851d-3c892f06f6c0" />

---

## Usage

1. Click the sidebar icon to open the cloud file panel
2. Browse directories, click a file name to insert a link
3. Right-click for more actions (preview, copy, delete)

<img width="1075" height="761" alt="68747470733a2f2f696d672e637572727968656e6472792e636f6d2f2545342542392542312545342542382538332545352538352541422545372542332539462f6f6273696469616e2d636c6f75642d6174746163682f2545362542372542422545352538412541302545362539432538442545352538412541312…" src="https://github.com/user-attachments/assets/eb981cf0-38d9-4d72-aa27-6a94254b65c6" />
<br>

**Insert files into notes:**
<img width="1280" height="800" alt="Insert-720p" src="https://github.com/user-attachments/assets/3378be76-0317-4b55-85a5-eaa1c0eb7d2d" />
<br>

**Upload attachments to server:**
<img width="1280" height="800" alt="Upload-720p" src="https://github.com/user-attachments/assets/15261330-aeca-42bf-aa2d-67dbac244abf" />

---

## Roadmap

- [x] Object storage support (primarily Cloudflare R2)
- [ ] Search server files within notes and insert (on hold — no good approach yet)
- [x] Manual trigger to detect and refresh expired sign tokens
- [x] Semi-automatic note attachment upload
- [x] Command palette support (Cmd/Ctrl+P)
- [ ] Publish to Obsidian Community Plugins
- [x] File rename and delete support

---

## Changelog

[Releases](https://github.com/curryhendry/obsidian-cloud-attach/releases)

---

## Acknowledgements

- [Obsidian](https://obsidian.md)
- [OpenList](https://github.com/OpenListTeam/OpenList)

---

Issues and Pull Requests are welcome!
