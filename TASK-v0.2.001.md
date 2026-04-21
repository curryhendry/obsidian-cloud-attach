# CloudAttach v0.2.001 开发规范

## 目标
云端文件列表增加删除和重命名功能。

## 改动范围

### 1. 文件列表 — 文件夹加 checkbox
- 当前只有文件有 checkbox，文件夹没有
- 改动：`renderFiles()` 中文件夹行也加 checkbox
- 选中逻辑：`this.selectedFiles` 已支持路径字符串，文件夹路径直接加入即可
- 批量工具栏的"全选"当前只选文件，需改为也包含文件夹

### 2. 批量工具栏 — 加删除按钮
- 位置：`renderBatchBar()` 中的 `batchBarEl`
- 条件：选中任意项（文件和文件夹）时显示
- 交互：点击 → 确认弹窗（列出将要删除的项名称）→ 调用 `delete` API → 成功后刷新列表
- 按钮文案：`🗑 删除所选(xx)`，双语

### 3. 右键菜单 — 加重命名
- 位置：`registerFileContextMenu()` 或 `registerClickHandlers()`
- 仅单项右键（非批量）
- 交互：点击 → 输入框弹窗（预填原文件名）→ 校验非空/不含 `/` → 调用 `rename` API → 成功后刷新
- 冲突处理：API 返回错误时 Notice 提示，不静默覆盖
- 菜单顺序：`插入笔记` `复制链接` `重命名` `选中`（重命名在复制链接和选中之间）

### 4. 后端 API

#### OpenListClient
```js
// 删除（支持文件和文件夹）
async delete(paths: string[]): Promise<{ success: string[], failed: Array<{path, error}>>
//   调用 POST /api/fs/remove { dir: dirname(path), names: [basenames] }

// 重命名
async rename(path: string, newName: string): Promise<void>
//   调用 POST /api/fs/rename { src: path, dst: dirname(path) + '/' + newName }
```

#### S3Client
```js
// 删除
async delete(paths: string[]): Promise<{ success: string[], failed: Array<{path, error}>>
//   调用 DeleteObject（文件夹需逐个对象删除，S3 无原生目录删除概念，遍历递归删除）

// 重命名（S3 无原生 rename，用 CopyObject + DeleteObject）
async rename(path: string, newName: string): Promise<void>
```

### 5. 确认弹窗 UI
- 标题：确认删除
- 内容：列出要删除的文件/文件夹名称（最多显示 10 个，超出显示"等 xx 项"）
- 按钮：`取消` `确认删除`（红色警告样式）
- 双语

### 6. i18n 新增 key
```js
// 删除相关
'toolbar.delete': '🗑 删除所选'
'view.delete_confirm_title': '确认删除'
'view.delete_confirm_msg': '确定要删除以下 {count} 项吗？此操作不可恢复。'
'view.delete_item': '📄 {name}'
'view.delete_folder': '📁 {name}'
'view.delete_items_and_more': '等 {count} 项'
'notice.delete_success': '✅ 已删除 {count} 项'
'notice.delete_partial': '⚠️ 删除成功 {success} 项，失败 {failed} 项'
'notice.delete_failed': '❌ 删除失败：{error}'
'notice.rename_conflict': '❌ 重命名失败：目标文件名已存在'
'notice.rename_failed': '❌ 重命名失败：{error}'
'view.rename_title': '重命名'
'view.rename_input_label': '新文件名'
'view.rename_input_placeholder': '请输入新文件名'
```

### 7. 交互规范
- 右键菜单只对单项有效，多选时右键某项只对该项操作（不批量 rename）
- 删除是批量操作，选中 N 项删 N 项
- 不操作笔记引用，删/改名后笔记里引用可能失效，不处理
- 文件夹删除：OpenList 后端直接支持，S3 需递归删除所有对象
