[中文](README.md) | English

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
- Built entirely with 🦞 (AI-assisted)

---

## Features

- 🌐 **WebDAV Protocol** — Compatible with OpenList, theoretically supports all WebDAV services (Alist, Synology, QNAP, etc.)
- 🌐 **S3 Object Storage** — Compatible with Cloudflare R2, theoretically supports AWS and most S3-compatible services
- 📂 **Sidebar Browser** — Browse cloud directories directly in the Obsidian sidebar
- 📝 **One-Click Insert** — Click to insert Markdown links; supports single and batch insertion
- ⬆️ **Upload Attachments** — Upload local attachments to the server and update references, saving local space
- 🔗 **Signed URLs** — Auto-generate URLs with sign tokens
- 🖼️ **Media Preview** — Image preview, video/audio playback, document iframe preview
- 📄 **PDF.js Preview** — Choose PDF.js as the preview tool in Advanced Settings; the plugin auto-downloads and applies it. PDFs inserted via `![]()` syntax render inline like images.
- 🎯 **Auto Upload** — Automatically upload attachments to your default server when inserting into notes
- ⚙️ **Advanced Settings** — Configure preview methods for PDF and other formats (Office preview etc. planned for future releases)
- 👤 **Multi-Account** — Manage multiple WebDAV/S3 accounts simultaneously

*Note: Object storage may not support iframe preview due to provider restrictions. A workaround is to mount object storage via OpenList and use its iframe preview.*

---

## Installation

**Option 1: Download ZIP**

1. Click *Code* → *Download ZIP* in this repository
2. Extract and place in `<vault>/.obsidian/plugins/cloud-attach/`

**Option 2: Download by Release**

Visit [Releases](https://github.com/curryhendry/obsidian-cloud-attach/releases) to download a specific version.

**Option 3: Community Plugin Store** (recommended)

Open the plugin browser in Obsidian, search for "CloudAttach" and install.
Link: [CloudAttach](https://community.obsidian.md/plugins/cloud-attach)

---

## Configuration

Add accounts in plugin settings:

| Field | Description |
|-------|-------------|
| Server URL | OpenList URL |
| Username / Password | WebDAV credentials |
| WebDAV Path | Usually `/dav` |
| Token | Get from OpenList Settings → Other |

S3 object storage configuration:
<img alt="S3 Configuration" src="https://github.com/user-attachments/assets/6866656b-9e84-4b07-851d-3c892f06f6c0" />

---

## Usage

1. Click the sidebar icon to open the cloud file panel
2. Browse directories, click a file name to insert a link
3. Right-click for more actions (preview, copy, rename, delete)

<img alt="Sidebar" src="https://github.com/user-attachments/assets/cdfdc813-a6a0-4ba1-ae7c-effb224a6981" />
<br>

**Insert files into notes:**
<img alt="Insert" src="https://github.com/user-attachments/assets/3378be76-0317-4b55-85a5-eaa1c0eb7d2d" />
<br>

**Upload attachments to server:**
<img alt="Upload" src="https://github.com/user-attachments/assets/15261330-aeca-42bf-aa2d-67dbac244abf" />
<br>

**Inline PDF preview:**
<img alt="PDF Preview" src="https://github.com/user-attachments/assets/102e265a-c77c-4823-bdbd-1c9cba6fc9b0" />
<br>

**Auto Upload**
<img alt="Auto Upload" src="https://github.com/user-attachments/assets/ad1d2149-efdb-413b-8245-e200eaef77ea" />
<br>

**Quick Insert**<br>
<img alt="Quick Insert" src="https://github.com/user-attachments/assets/db32f99c-48c1-4262-8252-26586e618bed" />

---

### PDF.js Preview

CloudAttach supports inline PDF preview using PDF.js. To enable:

1. Open CloudAttach settings → **Advanced Settings**
2. Select **PDF.js** as the PDF preview method
3. Click **Save** — the plugin will automatically download and apply PDF.js
4. Insert a PDF file via the CloudAttach sidebar
5. The PDF will be inserted using `![]()` syntax and render inline in your note

To revert to iframe preview, simply change the setting back in Advanced Settings.

---

## Roadmap

- [x] Object storage support (primarily Cloudflare R2)

~~- [ ] Search server files within notes and insert (on hold — no good approach yet)~~
- [x] Manual trigger to detect and refresh expired sign tokens
- [x] Semi-automatic note attachment upload
- [x] Command palette support (Cmd/Ctrl+P)
- [x] Publish to Obsidian Community Plugins
- [x] File rename and delete support
- [ ] PDF fullscreen view and more interactions

~~- [ ] Other file format support (e.g., Office preview, TBD)~~
- [x] Automatic attachment upload (default path)

---

## Changelog

[Releases](https://github.com/curryhendry/obsidian-cloud-attach/releases)

---

## Acknowledgements

- [Obsidian](https://obsidian.md)
- [OpenList](https://github.com/OpenListTeam/OpenList)

---

Issues and Pull Requests are welcome!
