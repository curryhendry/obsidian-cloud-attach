## v0.3.132.dev - 2026-06-08

### 调试
- **Notice 弹窗调试**：`_observePdfEmbeds` 启动时弹窗、`_scanAllPdfImgs` 扫描结果弹窗（找到/未找到 PDF img）
- **MutationObserver 日志**：拦截到 pdf img 时打印 src/class/alt
- 目的：排查 `![xxx.pdf|480](url)` 语法宽度不生效且无日志的根因

## v0.3.128.dev - 2026-06-08

### 修复
- **PDF URL query string 支持**：`_isPdfUrl` 用 `\.pdf(\?|#|$)` 检测已支持 query string（之前正确）
- **增强日志**：`_scanAllPdfImgs` 加日志输出找到的总 img 数、pdf img 数及每个 pdf img 的 src/class/alt，方便排查宽度解析问题
- **MutationObserver 日志**：加上 src 打印，排查是否有 img 元素被正确拦截

## v0.3.126.dev - 2026-06-08

### 修复
- **resize 自适应高度**：保留 v0.3.122.dev 的 opacity:0 高度计算逻辑（初始渲染正确），新增 `ResizeObserver` 监听容器宽度变化，拖动窗口时动态重算高度保持宽高比
- **分屏渲染支持**：新增 `layout-change` 事件监听 + 多次延迟扫描（0ms/500ms/1500ms），确保左右分屏时两个面板都能触发 PDF 渲染
- **去重机制**：新增 `_renderedPdfUrls` Set 防止多次扫描重复渲染同一 PDF img

## v0.3.124.dev - 2026-06-08

### 修复
- **resize 自适应高度**：去掉容器固定 px 高度（原 opacity:0 读取后硬编码），改为由 canvas `width:100% + height:auto` 自然撑开，拖动窗口后自动保持宽高比
- **分屏渲染支持**：新增 `layout-change` 事件监听 + 多次延迟扫描（0ms/500ms/1500ms），确保左右分屏时两个面板都能触发 PDF 渲染
- **去重机制**：新增 `_renderedPdfUrls` Set 防止多次扫描重复渲染同一 PDF img

## v0.3.122.dev - 2026-06-08

### 变更
- 修复 PDF 预览只有 1 像素的问题：actualScale 计算改用 imgEl.offsetWidth 替代 container.offsetWidth（空容器 offsetWidth 返回 1 导致 scale 极小）

## v0.3.087.dev - 2026-06-08

### 修复
- **使用下载版本（/Users/garry/Downloads/cloud-attach/）**：完全使用用户提供的版本，不做任何修改

## v0.3.087 - 2026-06-07

### 修复
- **全屏按钮交互对齐 v0.3.042**：点击弹出 Notice 提示「全屏预览功能，敬请期待」，移除未实现的 requestFullscreen 调用

## v0.3.086.dev - 2026-06-05

### 修复
- **还原 042 单 canvas 翻页架构**：修复 060-085 迭代中的 `actualScale` 计算问题（container 未插入 DOM 时 `offsetWidth` 为 0 导致 scale=0），恢复后可正常渲染 PDF
- **工具栏还原 042 样式**：修复 `data-role` 名称（prevBtn→prev/nextBtn→next），还原 bottom-right 定位 + hover 显示 + 全屏按钮
- **按钮状态更新修复**：prev/next 按钮 `opacity` 随翻页正确变化

### 变更
- **支持 PDF 宽度语法**：`getInsertMarkdown(file, width)` 支持 `![name|WIDTH](url)` 语法

## v0.3.042 - 2026-06-04

### 修复
- 宽度自适应：容器 `width: 100%` + `max-width: 100%`，canvas `width: 100%; height: auto`
- 工具栏：`position: absolute` 右上角，hover 显示，半透明背景

### 变更
- 连续滚动模式基础实现（多 canvas + scrollArea）

## v0.2.085 - 2026-05-29

### 修复
- `render()` DOM 创建顺序修复（先创建子元素再 append 到 parent）
- `deploy.sh` octal bug 修复：版本号递增使用 `10#` 前缀强制十进制

## v0.2.084 - 2026-05-29

### 修复
- `getSignedUrl` 路径归一化
- `testConnection` token 检测
- 错误通知弹窗
- 批量复制 `for...of` 修复

## v0.2.083 - 2026-05-28

### 修复
- i18n 全面改造
- Synology WebDAV 兼容性（`href` URL/路径处理、`currentpath=/` 自动使用 webdavpath）
- 根目录刷新按钮

## v0.2.082 - 2026-05-13

### 变更
- GitHub Actions 自动构建/签名/Release 配置完成
- Obsidian 社区插件审核通过
- 多语言 readme 重构（`readme.md` = 中文，`readme_EN.md` = 英文）

## v0.2.081 - 2026-05-12

### 修复
- OpenList API 的 Authorization header 不需要 "Bearer " 前缀

## v0.2.080 - 2026-05-10

### 修复
- URL 编码修复
- 开发模式文件监听

## v0.2.079 - 2026-05-08

### 变更
- i18n 初步改造

## v0.2.078 - 2026-05-06

### 修复
- Wiki-link 语法支持
- S3 兼容性修复

## v0.2.001 - 2026-04-15

### 变更
- 初始版本发布
