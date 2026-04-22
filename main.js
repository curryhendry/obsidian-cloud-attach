/**
 * CloudAttach Plugin v0.0.016
 * 云附件管理 - 连接 OpenList/WebDAV
 */

'use strict';

const { Plugin, Notice, Menu, Modal, PluginSettingTab, MarkdownView, ItemView } = require('obsidian');

const VIEW_TYPE_CLOUDATTACH = 'cloud-attach-view';

// 国际化系统
// ============================================================

const I18n = {
  currentLang: 'zh',
  translations: {
    zh: {},
    en: {}
  },
  setLang(lang) {
    // 规范化 locale：zh-cn / zh-tw → zh, en-us / en-gb → en
    if (!lang) lang = 'zh';
    const normalized = lang.toLowerCase().split('-')[0];
    this.currentLang = normalized in this.translations ? normalized : 'zh';
  },
  t(key) {
    return this.translations[this.currentLang][key] || this.translations['zh'][key] || key;
  }
};

// 注册所有翻译
Object.assign(I18n.translations.zh, {
  // Notice 消息
  'notice.sign_expired_403': '⚠️ Sign 已过期，请刷新',
  'notice.sign_invalid': '❌ Sign 无效',
  'notice.sign_ok': '✅ Sign 有效，无需刷新',
  'notice.check_start': '🔍 开始检查 {count} 个 URL...',
  'notice.check_complete': '✅ 检查完成：{parts}',
  'notice.check_complete_partial': '📋 检查完成：{parts}',
  'notice.no_urls_in_note': '📭 笔记中未发现任何 URL',
  'notice.no_attachment': '⚠️ 当前光标附近未找到附件',
  'notice.no_url_near_cursor': '❌ 光标附近未找到 URL',
  'notice.open_note_first': '❌ 请先打开一个笔记',
  'notice.no_file_selected': '⚠️ 请先选择文件',
  'notice.file_not_found': '⚠️ 文件不存在（可能在服务器上被删除或移动）',
  'notice.cannot_extract_path': '❌ 无法提取路径或无 Token',
  'notice.cannot_refresh': '❌ 无法提取路径或无 Token，无法刷新',
  'notice.select_account_first': '❌ 请先选择一个账户',
  'notice.select_dir_first': '⚠️ 请先在 CloudAttach 标签页中选择上传目录（不能是根目录）',
  'notice.upload_start': '📤 开始上传 {count} 个附件...',
  'notice.upload_success': '✅ 上传成功 {count} 个',
  'notice.upload_partial': '⚠️ 部分成功：{success} 成功，{failed} 失败',
  'notice.upload_all_failed': '❌ 上传全部失败',
  'notice.upload_failed': '❌ 上传失败: {error}',
  'notice.file_deleted': '✅ 已删除本地文件: {path}',
  'notice.file_delete_failed': '❌ 删除本地文件失败: {error}',
  'notice.local_file_not_found': '❌ 本地文件不存在: {path}',
  'notice.copied_count': '📋 已复制 {count} 个 URL',
  'notice.copied_count_links': '📋 已复制 {count} 个链接',
  'notice.copy_link_failed': '❌ 获取链接失败',
  'notice.inserted': '✅ 已插入: {name}',
  'notice.inserted_count': '✅ 已插入 {count} 个文件',
  'notice.open_note_first_insert': '❌ 请先打开一个笔记',
  'notice.check_url': '🔍 检查 URL: {url}...',
  'notice.no_openlist_url': '⚠️ 非 OpenList URL，跳过',
  'notice.not_my_url_skip': '⚠️ 未匹配到账户，跳过',
  'notice.s3_upload_success': '✅ 上传成功: {path}',
  'notice.s3_upload_failed': '❌ S3 上传失败: {error}',
  'notice.s3_test_403': '✅ 连接成功(403无权限，但签名正确)',
  'notice.s3_test_401': '❌ 签名错误(401)，请检查AccessKey/SecretKey/Region',
  'notice.s3_test_404': '❌ 存储桶未找到(404)',
  'notice.s3_test_ok': '✅ 连接成功!',
  'notice.s3_test_failed': '❌ 失败 status={status}',
  'notice.s3_test_error': '❌ 连接异常: {error}',
  'notice.plugin_reloaded': '✅ CloudAttach 已重新加载',
  'notice.delete_success': '✅ 已删除 {count} 项',
  'notice.delete_partial': '⚠️ 删除成功 {success} 项，失败 {failed} 项',
  'notice.delete_failed': '❌ 删除失败：{error}',
  'notice.rename_conflict': '❌ 重命名失败：目标文件名已存在',
  'notice.rename_failed': '❌ 重命名失败：{error}',
  'notice.rename_success': '✅ 重命名成功',
  'notice.reload_failed': '❌ 重载失败: {error}',
  'notice.connect_success': '✅ 连接成功',
  'notice.connect_failed': '❌ 连接失败',

  // 设置页面
  'settings.title': 'CloudAttach 设置',
  'settings.account_name': '账户名称',
  'settings.add_account': '添加账户',
  'settings.save': '保存',
  'settings.test': '测试',
  'settings.edit': '编辑',
  'settings.delete': '删除',
  'settings.cancel': '取消',
  'settings.server_address': '服务器地址',
  'settings.endpoint': '端点',
  'settings.bucket': '存储桶',
  'settings.region': '地域',
  'settings.prefix': '存储路径（选填）',
  'settings.prefix_placeholder': 'obsidian/，默认根目录',
  'settings.username': '用户名',
  'settings.password': '密码',
  'settings.token': 'Token（选填）',
  'settings.token_hint': '在 OpenList 后台获取，不填则不签名',
  'settings.access_key': '访问密钥 ID',
  'settings.secret_key': '访问密钥',
  'settings.public_url': '自定义主机',
  'settings.public_url_hint': 'auto（Cloudflare R2 可留空）',
  'settings.cdn_url': 'CDN 加速地址（选填）',
  'settings.cdn_url_hint': 'https://cdn.example.com（选填，用于拼公共访问URL）',
  'settings.storage_type': '存储类型',
  'settings.openlist': '对象存储',
  'settings.openlist_desc': '连接 OpenList 管理云附件',
  'settings.s3': '对象存储 (S3)',
  'settings.s3_desc': '支持 S3 协议的对象存储',
  'settings.account_name_placeholder': '例如：我的COS桶',
  'settings.folder_required': '⚠️ 请选择上传到的文件夹，不能是根目录',

  // 视图界面
  'view.select_account': '选择账户',
  'view.no_account': '请先在设置中添加账户',
  'view.loading': '⏳ 加载中...',
  'view.no_account_selected': '❌ 未选择账户',
  'view.connect_failed': '❌ 连接失败: {error}',
  'view.error': '❌ 错误: {error}',
  'view.empty_dir': '📂 空目录',
  'view.root': '📁 根目录',
  'view.open_dir': '打开目录',
  'view.insert': '插入',
  'view.copy_url': '复制URL',
  'view.delete_btn': '🗑 删除所选',
  'view.confirm_delete': '确认删除 ({count})',
  'view.delete_confirm_title': '确认删除',
  'view.delete_confirm_body': '确定要删除以下 {count} 项吗？此操作不可恢复。',
  'view.delete_item': '📄 {name}',
  'view.delete_folder': '📁 {name}',
  'view.delete_and_more': '等 {count} 项',
  'view.rename_title': '重命名',
  'view.rename_label': '新文件名',
  'view.rename_placeholder': '请输入新文件名',
  'view.confirm_rename': '确认重命名',
  'view.refresh': '🔄',
  'view.file_count': '{count}/{total} 项已选',
  'view.select_all': '全选',
  'view.select_invert': '反选',
  'view.upload_confirm_title': '📤 确认上传附件',
  'view.upload_confirm_msg': '将上传 {count} 个附件到 {target}，本地文件将被删除。',
  'view.confirm_upload': '确认上传',
  'view.cancel': '取消',
  'view.upload_btn': '上传 {count} 个文件',
  'view.unsupported_type': '不支持的文件类型',
  'view.browse_files': '浏览文件',
  'view.sign_check': 'Sign 检查',
  'view.sign_check_note': '检查并刷新当前笔记的 Sign',
  'view.sign_check_url': '检查当前 URL 的 Sign',
  'view.sign_fail_list': 'CloudAttach Sign 检查失败列表:',
  'view.account': '账户',
  'view.path': '路径',
  'view.account_user': '用户',
  'view.account_storage_path': '存储路径',
  'view.account_address': '地址',
  'view.account_bucket': '存储桶',
  'view.account_endpoint': '端点',
  'view.account_prefix': '存储路径',
  'view.network_error': '网络错误',

  // 命令菜单
  'cmd.upload_current': '上传当前附件',
  'cmd.upload_all': '上传笔记中全部附件',
  'cmd.check_sign': '检查并刷新当前 URL 的 Sign',
  'cmd.check_sign_note': '检查并刷新当前笔记的 Sign',

  // 右键菜单
  'menu.insert_note': '插入到笔记',
  'menu.insert_note_multi': '插入到笔记 ({count})',
  'menu.copy_link': '复制链接',
  'menu.rename': '重命名',
  'menu.select': '选中',
  'menu.deselect': '取消选中',
  'menu.refresh_current_url_sign': '刷新当前 URL Sign',
  'menu.refresh_all_note_sign': '刷新笔记所有 Sign',
  'menu.upload_current_attach': '上传当前附件',
  'menu.upload_all_attach': '上传笔记全部附件',

  // 工具栏
  'toolbar.refresh_account': '刷新账户',
  'cmd.open_browser': '☁️ 云附件',
  'cmd.open_cloud_attach': '打开云附件浏览器',
  'cmd.reload_plugin': '重新加载 CloudAttach 插件',
  'cmd.check_and_refresh_note_sign': '检查并刷新当前笔记的 Sign',
  'cmd.check_and_refresh_url_sign': '检查并刷新当前 URL 的 Sign',
  'cmd.upload_current_attachment': '上传当前附件',
  'cmd.upload_all_in_note': '上传笔记中全部附件',
  'settings.s3_type_label': '对象存储 (S3)',
  'settings.please_fill_endpoint': '请填写端点',
  'settings.please_fill_bucket': '请填写存储桶',
  'settings.please_fill_server': '请填写服务器地址',
  'settings.please_fill_name': '请填写账户名称',
  'settings.no_account_selected': '请先选择一个账户',
  'settings.no_folder_selected': '请先选择上传目录',
  'settings.s3_account_label': 'S3 账户 {n}',
  'settings.account_label': '账户 {n}',
  'notice.sign_refreshed': '✅ Sign 已刷新',
  'notice.refresh_failed': '❌ 刷新失败: {error}',
  'notice.url_invalid': '❌ URL 失效：{reason}',
  'notice.no_attachment_found': '📭 笔记中没有本地附件',
  'notice.upload_complete': '📤 上传完成：{parts}',
  'notice.url_parts_valid': '{count} 个有效',
  'notice.urls_refreshed': '✅ {count} 个已刷新',
  'notice.urls_failed': '❌ {count} 个失败',
  'notice.urls_skipped': '{count} 个跳过',
  'notice.upload_success_count': '✅ 上传成功 {count} 个',
  'notice.upload_failed_count': '❌ 失败 {count} 个',
  'notice.upload_skipped_count': '⏭️ 跳过 {count} 个',
  'error.local_file_not_found': '本地文件不存在',
  'error.unsupported_type': '不支持的文件类型',
  'error.upload_failed': '上传失败: HTTP {status}',
  'error.s3_upload_failed': 'S3 上传失败: HTTP {status}',
  'error.file_not_found': '文件不存在（可能在服务器上被删除或移动）',
  'error.network_error': '网络错误',
  'error.no_view_or_folder': '请先打开 CloudAttach 标签页并选择上传目录',
  'error.no_account': '请先选择一个账户',
  'view.loading': '⏳ 加载中...',
  'view.no_account_hint': '请先在设置中添加账户',
  'view.select_account_hint': '选择账户后开始浏览',
  'view.no_account_selected': '❌ 未选择账户',
  'view.empty_dir': '📂 空目录',
  'settings.server_address_placeholder': 'http://192.168.62.200:5244',
  'settings.webdav_path_placeholder': '/dav',
  'settings.endpoint_placeholder': 'https://xxx.r2.cloudflarestorage.com',
  'settings.bucket_placeholder': 'my-vault-attach',
  'settings.region_placeholder': 'auto（Cloudflare R2 可留空）',
  'settings.cdn_url_placeholder': 'https://cdn.example.com（选填，用于拼公共访问URL）',
  'view.upload_to': '上传到：<code style="background:var(--background-secondary);padding:2px 6px;border-radius:3px;">{path}</code>',
  'error.rebuild_failed': '重建失败: {error}',
  'error.sign_rebuild_failed': '补 sign 失败: {error}',
  'settings.check_account_settings': '请检查账户设置',
});

Object.assign(I18n.translations.en, {
  'notice.sign_expired_403': '⚠️ Sign expired, please refresh',
  'notice.sign_invalid': '❌ Sign invalid',
  'notice.sign_ok': '✅ Sign valid, no refresh needed',
  'notice.check_start': '🔍 Checking {count} URLs...',
  'notice.check_complete': '✅ Check complete: {parts}',
  'notice.check_complete_partial': '📋 Check complete: {parts}',
  'notice.no_urls_in_note': '📭 No URLs found in note',
  'notice.no_attachment': '⚠️ No attachment found near cursor',
  'notice.no_url_near_cursor': '❌ No URL found near cursor',
  'notice.open_note_first': '❌ Please open a note first',
  'notice.no_file_selected': '⚠️ Please select a file first',
  'notice.file_not_found': '⚠️ File not found (may have been deleted or moved on server)',
  'notice.cannot_extract_path': '❌ Cannot extract path or no Token',
  'notice.cannot_refresh': '❌ Cannot extract path or no Token, cannot refresh',
  'notice.select_account_first': '❌ Please select an account first',
  'notice.select_dir_first': '⚠️ Please select an upload folder in CloudAttach tab (cannot be root)',
  'notice.upload_start': '📤 Uploading {count} attachments...',
  'notice.upload_success': '✅ Uploaded {count} files',
  'notice.upload_partial': '⚠️ Partial success: {success} ok, {failed} failed',
  'notice.upload_all_failed': '❌ All uploads failed',
  'notice.upload_failed': '❌ Upload failed: {error}',
  'notice.file_deleted': '✅ Deleted local file: {path}',
  'notice.file_delete_failed': '❌ Failed to delete local file: {error}',
  'notice.local_file_not_found': '❌ Local file not found: {path}',
  'notice.copied_count': '📋 Copied {count} URLs',
  'notice.copied_count_links': '📋 Copied {count} links',
  'notice.copy_link_failed': '❌ Failed to get link',
  'notice.inserted': '✅ Inserted: {name}',
  'notice.inserted_count': '✅ Inserted {count} files',
  'notice.open_note_first_insert': '❌ Please open a note first',
  'notice.check_url': '🔍 Checking URL: {url}...',
  'notice.no_openlist_url': '⚠️ Not an OpenList URL, skip',
  'notice.not_my_url_skip': '⚠️ No matching account, skip',
  'notice.s3_upload_success': '✅ Upload success: {path}',
  'notice.s3_upload_failed': '❌ S3 upload failed: {error}',
  'notice.s3_test_403': '✅ Connection OK (403 = no permission but signature valid)',
  'notice.s3_test_401': '❌ Signature error (401), check AccessKey/SecretKey/Region',
  'notice.s3_test_404': '❌ Bucket not found (404)',
  'notice.s3_test_ok': '✅ Connection successful!',
  'notice.s3_test_failed': '❌ Failed status={status}',
  'notice.s3_test_error': '❌ Connection error: {error}',
  'notice.plugin_reloaded': '✅ CloudAttach reloaded',
  'notice.delete_success': '✅ Deleted {count} item(s)',
  'notice.delete_partial': '⚠️ Deleted {success}, failed {failed}',
  'notice.delete_failed': '❌ Delete failed: {error}',
  'notice.rename_conflict': '❌ Rename failed: filename already exists',
  'notice.rename_failed': '❌ Rename failed: {error}',
  'notice.rename_success': '✅ Renamed successfully',
  'notice.reload_failed': '❌ Reload failed: {error}',
  'notice.reload_failed': '❌ Reload failed: {error}',
  'notice.connect_success': '✅ Connection successful',
  'notice.connect_failed': '❌ Connection failed',

  'settings.title': 'CloudAttach Settings',
  'settings.account_name': 'Account Name',
  'settings.add_account': 'Add Account',
  'settings.save': 'Save',
  'settings.test': 'Test',
  'settings.edit': 'Edit',
  'settings.delete': 'Delete',
  'settings.cancel': 'Cancel',
  'settings.server_address': 'Server Address',
  'settings.endpoint': 'Endpoint',
  'settings.bucket': 'Bucket',
  'settings.region': 'Region',
  'settings.prefix': 'Storage Path (optional)',
  'settings.prefix_placeholder': 'obsidian/, root by default',
  'settings.username': 'Username',
  'settings.password': 'Password',
  'settings.token': 'Token (optional)',
  'settings.token_hint': 'Get from OpenList admin panel, leave blank for no signing',
  'settings.access_key': 'Access Key ID',
  'settings.secret_key': 'Secret Key',
  'settings.public_url': 'Custom Host',
  'settings.public_url_hint': 'auto (Cloudflare R2 can leave blank)',
  'settings.cdn_url': 'CDN URL (optional)',
  'settings.cdn_url_hint': 'https://cdn.example.com (optional, for public access URL)',
  'settings.storage_type': 'Storage Type',
  'settings.openlist': 'Object Storage',
  'settings.openlist_desc': 'Connect OpenList to manage cloud attachments',
  'settings.s3': 'Object Storage (S3)',
  'settings.s3_desc': 'S3-compatible object storage',
  'settings.account_name_placeholder': 'e.g.: My COS Bucket',
  'settings.folder_required': '⚠️ Please select a folder to upload to, cannot be root',

  'view.select_account': 'Select Account',
  'view.no_account': 'Please add an account in Settings first',
  'view.loading': '⏳ Loading...',
  'view.no_account_selected': '❌ No account selected',
  'view.connect_failed': '❌ Connection failed: {error}',
  'view.error': '❌ Error: {error}',
  'view.empty_dir': '📂 Empty directory',
  'view.root': '📁 Root',
  'view.open_dir': 'Open',
  'view.insert': 'Insert',
  'view.copy_url': 'Copy URL',
  'view.delete_btn': '🗑 Delete',
  'view.confirm_delete': 'Delete ({count})',
  'view.delete_confirm_title': 'Confirm Delete',
  'view.delete_confirm_body': 'Delete {count} item(s)? This cannot be undone.',
  'view.delete_item': '📄 {name}',
  'view.delete_folder': '📁 {name}',
  'view.delete_and_more': 'and {count} more',
  'view.rename_title': 'Rename',
  'view.rename_label': 'New name',
  'view.rename_placeholder': 'Enter new filename',
  'view.confirm_rename': 'Rename',
  'view.refresh': '🔄',
  'view.file_count': '{count}/{total} selected',
  'view.select_all': 'Select All',
  'view.select_invert': 'Invert',
  'view.upload_confirm_title': '📤 Confirm Upload',
  'view.upload_confirm_msg': 'Will upload {count} attachments to {target}, local files will be deleted.',
  'view.confirm_upload': 'Confirm Upload',
  'view.cancel': 'Cancel',
  'view.upload_btn': 'Upload {count} files',
  'view.unsupported_type': 'Unsupported file type',
  'view.browse_files': 'Browse Files',
  'view.sign_check': 'Sign Check',
  'view.sign_check_note': 'Check and refresh Sign in current note',
  'view.sign_check_url': 'Check current URL Sign',
  'view.sign_fail_list': 'CloudAttach Sign check failure list:',
  'view.account': 'Account',
  'view.path': 'Path',
  'view.account_user': 'User',
  'view.account_storage_path': 'Storage Path',
  'view.account_address': 'Address',
  'view.account_bucket': 'Bucket',
  'view.account_endpoint': 'Endpoint',
  'view.account_prefix': 'Storage Path',
  'view.network_error': 'Network Error',

  'cmd.upload_current': 'Upload Current Attachment',
  'cmd.upload_all': 'Upload All Attachments in Note',
  'cmd.check_sign': 'Check and refresh current URL Sign',
  'cmd.check_sign_note': 'Check and refresh current note Sign',
  'cmd.open_browser': '☁️ Cloud Attach',
  'cmd.open_cloud_attach': 'Open Cloud Attach Browser',
  'cmd.reload_plugin': 'Reload CloudAttach Plugin',
  'cmd.check_and_refresh_note_sign': 'Check and refresh current note Sign',
  'cmd.check_and_refresh_url_sign': 'Check and refresh current URL Sign',
  'cmd.upload_current_attachment': 'Upload Current Attachment',
  'cmd.upload_all_in_note': 'Upload All Attachments in Note',

  'menu.insert_note': 'Insert into Note',
  'menu.insert_note_multi': 'Insert into Note ({count})',
  'menu.copy_link': 'Copy Link',
  'menu.rename': 'Rename',
  'menu.select': 'Select',
  'menu.deselect': 'Deselect',
  'menu.refresh_current_url_sign': 'Refresh Current URL Sign',
  'menu.refresh_all_note_sign': 'Refresh All Sign in Note',
  'menu.upload_current_attach': 'Upload Current Attachment',
  'menu.upload_all_attach': 'Upload All Attachments in Note',

  'toolbar.refresh_account': 'Refresh Account',
  'settings.s3_type_label': 'Object Storage (S3)',
  'settings.please_fill_endpoint': 'Please fill in the endpoint',
  'settings.please_fill_bucket': 'Please fill in the bucket',
  'settings.please_fill_server': 'Please fill in the server address',
  'settings.please_fill_name': 'Please fill in the account name',
  'settings.no_account_selected': 'Please select an account first',
  'settings.no_folder_selected': 'Please select an upload folder first',
  'settings.s3_account_label': 'S3 Account {n}',
  'settings.account_label': 'Account {n}',
  'notice.sign_refreshed': '✅ Sign refreshed',
  'notice.refresh_failed': '❌ Refresh failed: {error}',
  'notice.url_invalid': '❌ URL invalid: {reason}',
  'notice.no_attachment_found': '📭 No attachments found in note',
  'notice.upload_complete': '📤 Upload complete: {parts}',
  'notice.url_parts_valid': '{count} valid',
  'notice.urls_refreshed': '✅ {count} refreshed',
  'notice.urls_failed': '❌ {count} failed',
  'notice.urls_skipped': '{count} skipped',
  'notice.upload_success_count': '✅ Uploaded {count} files',
  'notice.upload_failed_count': '❌ Failed {count}',
  'notice.upload_skipped_count': '⏭️ Skipped {count}',
  'error.local_file_not_found': 'Local file not found',
  'error.unsupported_type': 'Unsupported file type',
  'error.upload_failed': 'Upload failed: HTTP {status}',
  'error.s3_upload_failed': 'S3 upload failed: HTTP {status}',
  'error.file_not_found': 'File not found (may have been deleted or moved on server)',
  'error.network_error': 'Network error',
  'error.no_view_or_folder': 'Please open CloudAttach tab and select an upload folder',
  'error.no_account': 'Please select an account first',
  'view.loading': '⏳ Loading...',
  'view.no_account_hint': 'Please add an account in Settings first',
  'view.select_account_hint': 'Select an account to start browsing',
  'view.no_account_selected': '❌ No account selected',
  'view.empty_dir': '📂 Empty directory',
  'settings.server_address_placeholder': 'http://192.168.62.200:5244',
  'settings.webdav_path_placeholder': '/dav',
  'settings.endpoint_placeholder': 'https://xxx.r2.cloudflarestorage.com',
  'settings.bucket_placeholder': 'my-vault-attach',
  'settings.region_placeholder': 'auto (can leave blank for Cloudflare R2)',
  'settings.cdn_url_placeholder': 'https://cdn.example.com (optional)',
});

// 辅助函数：格式化翻译字符串（替换 {placeholder}）
function t(key, params = {}) {
  let str = I18n.t(key);
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return str;
}

class OpenListClient {
  constructor(account, app) {
    this.serverUrl = account.url.replace(/\/$/, '');
    this.baseUrl = this.serverUrl;
    this.webdavPath = (account.webdavPath || '/dav').replace(/\/$/, '');
    this.token = account.token || '';
    this.username = account.username;
    this.password = account.password;
    this.app = app;
  }
  /**
   * 登录获取 token（用于 API 操作）
   * @returns {Promise<boolean>}
   */
  async login() {
    if (this.token) return true;
    if (!this.username || !this.password) return false;
    
    try {
      const url = `${this.serverUrl}/api/auth/login`;
      const response = await this.requestViaObsidian(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username, password: this.password })
      });
      
      if (response.ok) {
        const data = JSON.parse(response.text);
        if (data.code === 200 && data.data?.token) {
          this.token = data.data.token;
          console.log('[CloudAttach] login success, token obtained');
          return true;
        }
      }
      console.log('[CloudAttach] login failed:', response.text);
      return false;
    } catch (e) {
      console.log('[CloudAttach] login error:', e.message);
      return false;
    }
  }


  /**
   * 通过 Obsidian requestUrl 发请求（绕过 CORS，适用于 WebDAV）
   * 优先使用 app.requestUrl，不可用时回退到原生 fetch
   * @param {string} url - 目标 URL
   * @param {Object} options - { method, headers, body }
   * @returns {Promise<{status: number, text: string, ok: boolean}>}
   */
  async requestViaObsidian(url, options = {}) {
    // Obsidian requestUrl 是全局 require('obsidian').requestUrl
    let requestUrl = null;
    try {
      // Obsidian 环境中 require 是全局的
      requestUrl = require('obsidian').requestUrl;
    } catch (e) {
      // 如果 require 失败，尝试其他方式
      requestUrl = globalThis.requestUrl || this.app?.requestUrl;
    }
    
    console.log('[CloudAttach] requestViaObsidian url:', url.substring(0, 80), 'hasRequestUrl:', !!requestUrl);
    
    if (requestUrl) {
      try {
        const result = await requestUrl({
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body || undefined,
        });
        console.log('[CloudAttach] requestUrl result:', result.status);
        return {
          status: result.status,
          text: result.text,
          ok: result.status >= 200 && result.status < 300,
        };
      } catch (e) {
        console.error('[CloudAttach] requestUrl error:', e.message || e);
        // Obsidian requestUrl 对非 2xx 响应会抛异常，尝试从异常中解析 status
        // 常见错误格式: "Request failed, status 401" 或 { status: 401, ... }
        let status = 0;
        const errStr = e.message || String(e);
        const statusMatch = errStr.match(/status\s+(\d+)/i);
        if (statusMatch) {
          status = parseInt(statusMatch[1], 10);
        } else if (typeof e.status === 'number') {
          status = e.status;
        } else if (e.response && typeof e.response.status === 'number') {
          status = e.response.status;
        }
        return { ok: false, status, reason: status > 0 ? 'http_error' : 'network_error', error: errStr };
      }
    }
    console.log('[CloudAttach] falling back to fetch');
    const fetchResp = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || undefined,
    });
    return {
      status: fetchResp.status,
      text: await fetchResp.text(),
      ok: fetchResp.ok,
    };
  }

  /**
   * 带认证的 API 请求（token 优先，401 fallback 到 login）
   */
  async authFetch(path, options = {}) {
    // 确保有 token
    if (!this.token && !(await this.login())) {
      return { status: 401, text: '{"code":401,"message":"Authentication required"}', ok: false };
    }
    
    const url = `${this.baseUrl}${path}`;
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.token}`,
    };
    
    let response = await this.requestViaObsidian(url, { ...options, headers });
    
    // 401 → token 过期，尝试重新登录
    if (response.status === 401 && this.username && this.password) {
      console.log('[CloudAttach] token expired, re-login');
      this.token = '';
      if (await this.login()) {
        response = await this.requestViaObsidian(url, {
          ...options,
          headers: { ...options.headers, 'Authorization': `Bearer ${this.token}` },
        });
      }
    }
    
    return response;
  }

  async getSignedUrl(remotePath) {
    // 优先使用 OpenList API 获取带签名的 URL
    const apiUrl = `${this.serverUrl}/api/fs/get`;
    
    // 构造请求头 - 注意：没有 Bearer 前缀
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // 添加 Token 认证（无 Bearer）
    if (this.token) {
      headers['Authorization'] = this.token;
    }
    
    try {
      console.log('[CloudAttach] getSignedUrl calling API:', apiUrl, 'path:', remotePath);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          path: remotePath
        })
      });

      const data = await response.json();
      console.log('[CloudAttach] getSignedUrl response:', data);
      
      if (data.code === 200) {
        // 优先使用 raw_url
        if (data.data?.raw_url) return data.data.raw_url;
        if (data.raw_url) return data.raw_url;
      }
      
      // API 返回错误
      console.log('[CloudAttach] API returned error:', data.message);
      
    } catch (e) {
      console.log('[CloudAttach] API call failed:', e.message);
    }
    
    // 回退：优先用 OpenList /p/ 路径（支持分享链接），次选 /d/ 目录路径
    // 不再回退到 WebDAV 路径（那是给 WebDAV 客户端用的）
    // 编码规则：保留中文原文，仅编码必须转义的字符（空格、%、#、?、& 等）
    const safePath = remotePath.replace(/[%\s#?&<>"'\\|{}]/g, c => encodeURIComponent(c));
    return `${this.serverUrl}/p${safePath}`;
  }

  // 获取文件的 WebDAV URL（用于插入到笔记）
  getFileUrl(remotePath) {
    const webdavPath = this.webdavPath || '/dav';
    // 编码规则：保留中文原文，仅编码必须转义的字符
    const safePath = remotePath.replace(/[%\s#?&<>"'\\|{}]/g, c => encodeURIComponent(c));
    // 如果有认证信息，在 URL 中带上 Basic Auth
    if (this.username && this.password) {
      const encodedCreds = btoa(`${this.username}:${this.password}`);
      const serverWithoutProtocol = this.serverUrl.replace(/^https?:\/\//, '');
      return `https://${encodedCreds}@${serverWithoutProtocol}${webdavPath}${safePath}`;
    }
    return `${this.serverUrl}${webdavPath}${safePath}`;
  }

  // 获取原始 URL（无签名、无 /dav /d 前缀，用于 iframe 预览）
  getRawUrl(remotePath) {
    // 保留中文等 Unicode 原文，仅编码必须转义的字符（空格、%、#、?、& 等）
    const safePath = remotePath.replace(/[%\s#?&<>"'\\|{}]/g, c => encodeURIComponent(c));
    return `${this.serverUrl}${safePath}`;
  }

  /**
   * 从 OpenList URL 中提取真实文件路径
   * URL 格式：https://host:port/p/Local/share/photo.jpg?sign=xxx:0
   *           或 https://host:port/d/Local/share/photo.jpg?sign=xxx:0
   * 去掉开头的 /p/ 或 /d/ 前缀，返回真实路径 /Local/share/photo.jpg
   * @param {string} url - 完整的 OpenList URL
   * @returns {string|null} 真实文件路径，或 null（不是 OpenList URL）
   */
  extractRealPath(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname; // e.g. "/p/Local/share/photo.jpg"

      // 检查是否是 OpenList 公开链接格式
      let realPath = null;
      if (path.startsWith('/p/')) {
        realPath = '/' + path.slice(3); // 去掉 "/p" 前缀，保留后面的路径
      } else if (path.startsWith('/d/')) {
        realPath = '/' + path.slice(3); // 去掉 "/d" 前缀，保留后面的路径
      } else {
        return null; // 不是 OpenList URL
      }
      
      // 解码 URL 编码的路径（处理多重编码的情况）
      try {
        let decoded = realPath;
        // 循环解码直到没有 % 或者解码失败（最多10次防止死循环）
        for (let i = 0; i < 10; i++) {
          if (!decoded.includes('%')) break;
          try {
            const newDecoded = decodeURIComponent(decoded);
            if (newDecoded === decoded) break; // 没有变化，停止解码
            decoded = newDecoded;
          } catch {
            break; // 解码失败，停止
          }
        }
        return decoded;
      } catch {
        // 解码失败，返回原始路径
        return realPath;
      }
    } catch {
      return null;
    }
  }
  /**
   * 移除 URL 中的 sign 参数
   * @param {string} url
   * @returns {string} 不带 sign 的 URL
   */
  stripSign(url) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.delete("sign");
      return urlObj.toString();
    } catch {
      // 回退：字符串处理
      return url.replace(/[?&]sign=[^&]*/g, "").replace(/&$/, "").replace(/\?$/, "");
    }
  }

  /**
   * 在文本中查找并替换 URL（简化版：遍历文本中的 URL，解码后比对路径）
   */
  findAndReplaceUrl(text, realPath, newUrl) {
    // 匹配 https://xxx:port/p/... 格式的 URL（含可选 sign）
    // 使用简单正则，避免复杂转义
    const urlRegex = /https?:\/\/[^?\s()"']+\/p\/[^?\s()"']+((\?|&)sign=[^?\s()"']*)?/g;
    let newText = text;
    const matches = text.match(urlRegex);
    if (!matches) return text;
    
    for (const foundUrl of matches) {
      // 从找到的 URL 中提取路径并解码
      try {
        // 提取 /p/ 后面的路径部分（去掉 sign）
        const pathMatch = foundUrl.match(/\/p\/([^?]+)/);
        if (!pathMatch) continue;
        const encodedPath = pathMatch[1];
        // 解码路径
        const decodedPath = decodeURIComponent(encodedPath);
        // 比对：解码后是否与 realPath 相同（忽略前后斜杠）
        const normalizedReal = realPath.replace(/^\/+|\/+$/g, '');
        const normalizedDecoded = decodedPath.replace(/^\/+|\/+$/g, '');
        if (normalizedDecoded === normalizedReal) {
          // 匹配成功，替换这个 URL（不 break，继续替换所有匹配的）
          console.log('[CloudAttach] findAndReplaceUrl: matched path=' + normalizedDecoded + ', replacing: ' + foundUrl.substring(0, 80) + '... -> ' + newUrl.substring(0, 80) + '...');
          newText = newText.replace(foundUrl, newUrl);
        }
      } catch (e) {
        // 解码失败，跳过
        continue;
        }
    }
    return newText;
  }

  /**
   * 解码 URL 中的中文字符（处理 encodeURI / encodeURIComponent / safeEncodePath 各种形式）
   * safeEncodePath 只编码特殊字符保留中文，所以解码只需处理 %XX
   * @param {string} url
   * @returns {string} 解码后的 URL
   */
  static safeDecodeUrl(url) {
    if (!url || typeof url !== 'string') return url || '';
    try {
      let decoded = url;
      // 循环解码直到没有 % 或解码失败（最多10次，防止多重编码）
      for (let i = 0; i < 10; i++) {
        if (!decoded.includes('%')) break;
        try {
          const next = decodeURIComponent(decoded);
          if (next === decoded) break;
          decoded = next;
        } catch {
          break;
        }
      }
      return decoded;
    } catch {
      return url;
    }
  }

  /**
   * 验证 OpenList sign URL 是否有效（通过 HEAD 请求）
   * @param {string} url - 完整的 sign URL
   * @returns {Promise<{ok: boolean, status: number, reason: string}>}
   */
  async verifySignUrl(url) {
    try {
      const response = await this.requestViaObsidian(url, {
        method: 'HEAD',
        headers: {}
      });

      if (response.ok) {
        return { ok: true, status: response.status, reason: 'valid' };
      }
      // OpenList 对无效/过期 sign 返回 401（认证失败），也当作 sign_expired 处理
      if (response.status === 403 || response.status === 401) {
        return { ok: false, status: response.status, reason: 'sign_expired' };
      }
      if (response.status === 404) {
        return { ok: false, status: 404, reason: 'file_not_found' };
      }
      return { ok: false, status: response.status, reason: 'http_error' };
    } catch (e) {
      return { ok: false, status: 0, reason: 'network_error', error: e.message };
    }
  }

  async testConnection() {
    try {
      if (this.webdavPath) {
        const webdavUrl = `${this.serverUrl}${this.webdavPath}/`;
        const response = await this.requestViaObsidian(webdavUrl, {
          method: 'PROPFIND',
          headers: {
            'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`),
            'Depth': '0'
          }
        });
        if (response.ok || response.status === 207) return true;
      }
      
      const apiUrl = `${this.serverUrl}/api/fs/list`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        },
        body: JSON.stringify({
          path: '/',
          password: this.password || '',
          username: this.username || '',
          page: 1,
          per_page: 1
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 删除文件或文件夹（批量）
   * @param {string[]} paths - 要删除的路径列表
   * @returns {Promise<{success: string[], failed: Array<{path, error}>}>}
   */
  async delete(paths) {
    const results = { success: [], failed: [] };
    for (const fullPath of paths) {
      const dir = fullPath.substring(0, fullPath.lastIndexOf("/")).replace(/\/\/$/, "") || '/';
      const name = fullPath.substring(fullPath.lastIndexOf('/') + 1);
      try {
        console.log("[CloudAttach] delete API:", dir, "names:", [name]);
        const response = await this.authFetch('/api/fs/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dir, names: [name] })
        });
        if (response.ok) {
          results.success.push(fullPath);
        } else {
          const err = response.text;
          results.failed.push({ path: fullPath, error: err });
        }
      } catch (e) {
        results.failed.push({ path: fullPath, error: e.message });
      }
    }
    return results;
  }

  /**
   * @param {string} path - 原路径
   * @param {string} newName - 新文件名
   * @returns {Promise<void>}
   */
  async rename(path, newName) {
    const dst = path.substring(0, path.lastIndexOf('/')) + '/' + newName;
    console.log("[CloudAttach] rename API: src:", path, "dst:", dst);
    const response = await this.authFetch('/api/fs/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src: path, dst })
    });
    if (!response.ok) {
      throw new Error(response.text || 'Rename failed');
    }
  }

  async listDirectory(remotePath = '/') {
    if (this.webdavPath) return this.listDirectoryWebDAV(remotePath);
    return this.listDirectoryAPI(remotePath);
  }

  /**
   * 上传文件到远程目录
   * @param {string} localPath - 本地文件路径（vault 内）
   * @param {string} remoteDir - 远程目录路径（以 / 开头）
   * @returns {Promise<{ok: boolean, remotePath: string, url: string, error?: string}>}
   */
  async uploadFile(localPath, remoteDir) {
    try {
      // 获取 vault 中的文件
      const file = this.app.vault.getAbstractFileByPath(localPath);
      if (!file) {
        return { ok: false, error: t('error.local_file_not_found') };
      }

      const fileName = file.name;
      // 确保远程目录以 / 结尾
      const normalizedDir = remoteDir.endsWith('/') ? remoteDir : remoteDir + '/';
      const remotePath = normalizedDir + fileName;

      // 读取文件内容
      let content;
      if (file instanceof require('obsidian').TFile) {
        content = await this.app.vault.readBinary(file);
      } else {
        return { ok: false, error: t('error.unsupported_type') };
      }

      // 构造上传 URL
      const uploadUrl = `${this.serverUrl}${this.webdavPath}${remotePath}`;

      console.log('[CloudAttach] 上传文件:', localPath, '->', uploadUrl);

      // 使用 WebDAV PUT 上传
      const response = await this.requestViaObsidian(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`),
          'Content-Type': this.getMimeType(fileName),
        },
        body: content
      });

      if (response.ok || response.status === 201 || response.status === 204) {
        // 上传成功，获取带签名的 URL
        let url;
        try {
          url = await this.getSignedUrl(remotePath);
        } catch {
          // 如果获取签名失败，返回 WebDAV URL
          url = uploadUrl;
        }
        return { ok: true, remotePath, url };
      } else {
        return { ok: false, error: t('error.upload_failed', {status: response.status}) };
      }
    } catch (e) {
      console.error('[CloudAttach] uploadFile error:', e);
      return { ok: false, error: e.message };
    }
  }

  getMimeType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes = {
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
      'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
      'pdf': 'application/pdf', 'mp4': 'video/mp4', 'mov': 'video/quicktime',
      'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'zip': 'application/zip',
      'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'md': 'text/markdown', 'txt': 'text/plain', 'html': 'text/html',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async listDirectoryWebDAV(remotePath) {
    const webdavUrl = `${this.serverUrl}${this.webdavPath}${remotePath}`;
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:"><D:prop><D:displayname/><D:getcontentlength/><D:getlastmodified/><D:resourcetype/></D:prop></D:propfind>`;
    
    const response = await this.requestViaObsidian(webdavUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`),
        'Content-Type': 'application/xml',
        'Depth': '1'
      },
      body: propfindBody
    });

    if (!response.ok && response.status !== 207) throw new Error(`WebDAV error: ${response.status}`);

    const text = response.text;
    const files = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const responses = doc.getElementsByTagName('D:response');
    
    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const href = resp.getElementsByTagName('D:href')[0]?.textContent || '';
      const displayName = resp.getElementsByTagName('D:displayname')[0]?.textContent || '';
      const contentLength = parseInt(resp.getElementsByTagName('D:getcontentlength')[0]?.textContent || '0');
      const isDirectory = resp.getElementsByTagName('D:collection')[0] !== undefined;
      const decodedHref = decodeURIComponent(href);
      const name = displayName || decodedHref.split('/').pop();
      
      let relativePath = decodedHref;
      if (relativePath.startsWith(this.webdavPath)) {
        relativePath = relativePath.slice(this.webdavPath.length) || '/';
      }
      
      if (relativePath === remotePath || relativePath === remotePath + '/') continue;
      
      files.push({ name, path: relativePath, isDirectory, size: contentLength });
    }

    return files.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async listDirectoryAPI(remotePath = '/') {
    const apiUrl = `${this.serverUrl}/api/fs/list`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.token ? `Bearer ${this.token}` : ''
      },
      body: JSON.stringify({
        path: remotePath,
        password: this.password || '',
        username: this.username || '',
        page: 1,
        per_page: 0
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    console.log('[CloudAttach] listDirectory response:', data);
    const files = [];

    if (data.data?.files) {
      for (const file of data.data.files) {
        files.push({
          name: file.name,
          path: file.path,
          isDirectory: file.is_dir,
          size: file.size || 0
        });
      }
    }

    return files.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
}

/**
 * S3 兼容对象存储客户端
 * 支持所有使用 S3 协议的对象存储服务：
 * - 腾讯云 COS
 * - 阿里云 OSS
 * - AWS S3
 * - 兼容 S3 的自建存储（MinIO、Ceph RGW 等）
 */
class S3Client {
  constructor(account, app) {
    this.app = app;
    this.endpoint = account.endpoint?.replace(/\/$/, '') || '';
    this.bucket = account.bucket || '';
    this.region = account.region || '';
    this.accessKey = account.accessKey || '';
    this.secretKey = account.secretKey || '';
    this.publicUrl = account.publicUrl?.replace(/\/$/, '') || '';
    this.prefix = account.prefix ? account.prefix.replace(/^\/+|\/+$/g, '') + '/' : '';
  }

  /**
   * 通过 Obsidian requestUrl 发请求，绕过 CORS
   */
  async requestViaObsidian(url, options = {}) {
    let requestUrl = null;
    try {
      requestUrl = require('obsidian').requestUrl;
    } catch {
      requestUrl = globalThis.requestUrl || this.app?.requestUrl;
    }

    if (requestUrl) {
      try {
        const result = await requestUrl({
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body || undefined,
        });
        return {
          status: result.status,
          text: result.text,
          ok: result.status >= 200 && result.status < 300,
        };
      } catch (e) {
        const errStr = e.message || String(e);
        const statusMatch = errStr.match(/status\s+(\d+)/i);
        const status = statusMatch ? parseInt(statusMatch[1], 10) : (e.status || 0);
        return { ok: false, status, error: errStr };
      }
    }
    // fallback to fetch
    const resp = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || undefined,
    });
    return { status: resp.status, ok: resp.ok, text: await resp.text().catch(() => '') };
  }

  /**
   * 列出目录内容
   * @param {string} remotePath - 远程路径，如 "/" 或 "/folder/"
   * @returns {Promise<Array>} 文件列表
   */
  async listDirectory(remotePath = '/') {
    try {
      // 规范化路径：去除两端斜杠，转为 prefix 格式
      const cleanPath = remotePath === '/' ? '' : remotePath.replace(/^\/|\/$/g, '');
      // S3 prefix：拼接 base prefix + 当前路径（不以 / 开头）
      const basePrefix = this.prefix ? this.prefix.replace(/\/$/, '') : '';
      const s3Prefix = cleanPath 
        ? (basePrefix ? basePrefix + '/' + cleanPath + '/' : cleanPath + '/')
        : (basePrefix ? basePrefix + '/' : '');

      console.log('[CloudAttach] listDirectory remotePath:', remotePath, 'cleanPath:', cleanPath, 's3Prefix:', s3Prefix);

      const params = new URLSearchParams({
        'list-type': '2',
        'prefix': s3Prefix,
        'delimiter': '/',
        'encoding-type': 'url'
      });

      const response = await this.s3Request(`/?${params.toString()}`, 'GET');

      if (!response.ok) {
        throw new Error(`S3 error: ${response.status}`);
      }

      const text = typeof response.text === 'function' ? await response.text() : (response.text || '');
      console.log('[CloudAttach] listDirectory response:', text.substring(0, 500));
      return this.parseListResult(text, s3Prefix);
    } catch (e) {
      console.error('[CloudAttach] S3 listDirectory error:', e);
      throw e;
    }
  }

  /**
   * 构造文件公共访问 URL（无签名，适用于公共读桶）
   * @param {string} remotePath - 远程路径，如 "/images/photo.jpg"
   * @returns {string} 公共 URL
   */
  getFileUrl(remotePath) {
    // 去除前缀的尾斜杠，拼到 publicUrl
    const basePrefix = this.prefix ? this.prefix.replace(/\/$/, '') : '';
    const cleanPath = remotePath.replace(/^\/+/, '');
    const fullPath = basePrefix ? `${basePrefix}/${cleanPath}` : cleanPath;
    // 编码规则：保留中文原文，仅编码必须转义的字符
    const safePath = fullPath.replace(/[%\s#?&<>"'\\|{}]/g, c => encodeURIComponent(c));
    // publicUrl 可能是裸域名（无协议），自动补 https://
    const base = this.publicUrl.startsWith('http') ? this.publicUrl : `https://${this.publicUrl}`;
    return `${base}/${safePath}`;
  }

  /**
   * 获取文件预签名 URL（适用于私有桶，按需签名）
   * @param {string} remotePath - 远程路径
   * @param {number} expires - 过期时间（秒），默认 3600
   * @returns {Promise<string>} 预签名 URL
   */
  async getSignedUrl(remotePath, expires = 3600) {
    try {
      const cleanPath = remotePath.replace(/^\/+/, '');
      const params = new URLSearchParams({ 'X-Amz-Expires': expires.toString() });
      const signedQuery = await this.signQuery(params, cleanPath);
      const objectKey = encodeURIComponent(cleanPath);
      return `${this.endpoint}/${this.bucket}/${objectKey}?${signedQuery}`;
    } catch (e) {
      console.error('[CloudAttach] S3 getSignedUrl error:', e);
      throw e;
    }
  }

  /**
   * 上传文件到 S3
   * @param {string} localPath - vault 内文件路径
   * @param {string} remoteDir - 远程目录路径（以 / 开头）
   * @returns {Promise<{ok: boolean, remotePath: string, url: string, error?: string}>}
   */
  async uploadFile(localPath, remoteDir) {
    try {
      const file = this.app.vault.getAbstractFileByPath(localPath);
      if (!file) return { ok: false, error: t('error.local_file_not_found') };

      const fileName = file.name;
      const TFile = require('obsidian').TFile;
      if (!(file instanceof TFile)) return { ok: false, error: t('error.unsupported_type') };

      const content = await this.app.vault.readBinary(file);
      const normalizedDir = remoteDir.endsWith('/') ? remoteDir : remoteDir + '/';
      // 拼接 S3 object key: prefix + remoteDir + fileName
      const basePrefix = this.prefix ? this.prefix.replace(/\/$/, '') : '';
      const dirClean = normalizedDir.replace(/^\/+/, '');
      const objectKey = basePrefix ? `${basePrefix}/${dirClean}${fileName}` : `${dirClean}${fileName}`;
      const remotePath = `${normalizedDir}${fileName}`;

      // 用 presigned URL PUT 上传（通过 requestViaObsidian 绕过 CORS）
      const mimeType = this.getMimeType(fileName);
      const params = new URLSearchParams({ 'X-Amz-Expires': '3600' });
      const signedQuery = await this.signQuery(params, objectKey, 'PUT', { 'content-type': mimeType });
      const encodedKey = encodeURIComponent(objectKey);
      const uploadUrl = `${this.endpoint}/${this.bucket}/${encodedKey}?${signedQuery}`;

      const response = await this.requestViaObsidian(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': this.getMimeType(fileName) },
        body: content
      });

      if (response.ok || response.status === 200) {
        const url = this.getFileUrl(remotePath);
        return { ok: true, remotePath, url };
      } else {
        return { ok: false, error: t('error.s3_upload_failed', {status: response.status}) };
      }
    } catch (e) {
      console.error('[CloudAttach] S3 uploadFile error:', e);
      return { ok: false, error: e.message };
    }
  }

  getMimeType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes = {
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
      'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
      'pdf': 'application/pdf', 'mp4': 'video/mp4', 'mov': 'video/quicktime',
      'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'zip': 'application/zip',
      'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint', 'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain', 'md': 'text/markdown', 'html': 'text/html',
      'json': 'application/json', 'csv': 'text/csv'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * 测试连接
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const diagUrl = `${this.endpoint}/${this.bucket}/?list-type=2&max-keys=1`;
      const usingAppUrl = !!(this.app && this.app.requestUrl);
      console.log('[CloudAttach] S3 testConnection URL:', diagUrl);
      console.log('[CloudAttach] S3 config - endpoint:', this.endpoint, 'bucket:', this.bucket, 'region:', this.region, 'accessKey:', this.accessKey ? '(set)' : '(empty)', '| using app.requestUrl:', usingAppUrl);
      const response = await this.s3Request(`/?list-type=2&max-keys=1`, 'GET');
      const status = response.status;
      const text = typeof response.text === 'function' ? await response.text().catch(() => '') : (response.text || '');
      console.log('[CloudAttach] S3 testConnection status:', status, 'body:', text.slice(0, 200));
      // 403 = 签名正确但无权限，401 = 签名错误，其他 2xx = 成功
      if (status === 403) {
        new Notice(t('notice.s3_test_403') + ` body: ${text.slice(0, 100)}`, 5000);
        return true;
      }
      if (status === 401) {
        new Notice(t('notice.s3_test_401'), 5000);
        return false;
      }
      if (status === 404) {
        new Notice(t('notice.s3_test_404'), 5000);
        return false;
      }
      if (response.ok) {
        new Notice(`t('notice.s3_test_ok') body: ${text.slice(0, 80)}`, 5000);
        return true;
      }
      new Notice(t('notice.s3_test_failed', {status}) + ` body: ${text.slice(0, 80)}`, 5000);
      return false;
    } catch (e) {
      console.error('[CloudAttach] S3 testConnection error:', e);
      new Notice(t('notice.s3_test_error', {error: e.message}), 5000);
      return false;
    }
  }

  // ============ 内部方法 ============

  /**
   * 发送 S3 请求（自动附加 AWS Signature V4 签名）
   * @param {string} path - 请求路径（相对桶）
   * @param {string} method - HTTP 方法
   * @param {Object} options - fetch 选项
   * @returns {Promise<Response>}
   */
  async s3Request(path, method = 'GET', options = {}) {
    // 用 presigned URL 方式，绕过 CORS
    const url = `${this.endpoint}/${this.bucket}${path}`;
    const urlObj = new URL(url);
    // pathname = /obsidian-attachments/ 或 /obsidian-attachments/path/to/file
    // 去掉 bucket 前缀，得到 objectKey
    const prefix = `/${this.bucket}/`;
    const objectKey = urlObj.pathname.startsWith(prefix) 
      ? urlObj.pathname.slice(prefix.length) 
      : urlObj.pathname.slice(1); // fallback
    
    // 构建查询参数
    const params = new URLSearchParams(urlObj.search);
    const signedQuery = await this.signQuery(params, objectKey);
    
    // 拼接 URL：endpoint/bucket/objectKey?signedQuery
    const baseUrl = objectKey 
      ? `${this.endpoint}/${this.bucket}/${objectKey}`
      : `${this.endpoint}/${this.bucket}`;
    const signedUrl = `${baseUrl}?${signedQuery}`;
    
    return this.requestViaObsidian(signedUrl, { method: 'GET', ...options });
  }

  /**
   * AWS Signature V4 签名
   */
  async signRequest(method, url, headers, dateStr) {
    const dateOnly = dateStr.slice(0, 8);
    const signedHeaders = {};
    const credential = `${this.accessKey}/${dateOnly}/${this.region}/s3/aws4_request`;
    const signedHeaderNames = ['host', 'x-amz-content-sha256', 'x-amz-date'].sort().join(';');
    signedHeaders['host'] = headers['Host'];
    signedHeaders['x-amz-content-sha256'] = 'UNSIGNED-PAYLOAD';
    signedHeaders['x-amz-date'] = headers['X-Amz-Date'];
    const signature = await this.computeSignature(method, url, signedHeaders, dateStr);
    signedHeaders['Authorization'] = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`;
    return signedHeaders;
  }

  async computeSignature(method, url, signedHeaders, dateStr) {
    const dateOnly = dateStr.slice(0, 8);

    const urlObj = new URL(url);
    // URL 已包含 bucket（格式: https://endpoint/bucket/path），直接用 pathname
    const canonicalUri = encodeURIComponent(urlObj.pathname.replace(/\\/g, '/')).replace(/%2F/g, '/');
    const canonicalQueryString = urlObj.search.slice(1).split('&').filter(Boolean).sort().map(p => {
      const [k, v] = p.split('=');
      return `${encodeURIComponent(k)}=${encodeURIComponent(v || '')}`;
    }).join('&');

    const sortedHeaders = Object.entries(signedHeaders)
      .sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()));
    const signedHeadersLine = sortedHeaders.map(([k]) => k).join(';');
    const canonicalHeaders = sortedHeaders.map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`).join('\n');

    const canonicalRequest = [
      method.toUpperCase(),
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeadersLine,
      'UNSIGNED-PAYLOAD'
    ].join('\n');

    const canonicalHash = await this.sha256(canonicalRequest);
    const stringToSign = [`AWS4-HMAC-SHA256`, dateStr, `${dateOnly}/${this.region}/s3/aws4_request`, canonicalHash].join('\n');

    const kDate = await this.hmacSha256(`AWS4${this.secretKey}`, dateOnly);
    const kRegion = await this.hmacSha256(kDate, this.region);
    const kService = await this.hmacSha256(kRegion, 's3');
    const kSigning = await this.hmacSha256(kService, 'aws4_request');
    const signature = await this.hmacSha256Hex(kSigning, stringToSign);

    return signature;
  }

  async signQuery(additionalParams, objectKey, method = 'GET', extraHeaders = {}) {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateOnly = dateStr.slice(0, 8);

    // 构建签名 headers：host + 额外 headers
    const hostHeader = { 'host': new URL(this.endpoint).host };
    const allSignedHeaders = { ...hostHeader, ...extraHeaders };
    const signedHeaderNames = Object.keys(allSignedHeaders).sort().join(';');

    const params = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.accessKey}/${dateOnly}/${this.region}/s3/aws4_request`,
      'X-Amz-Date': dateStr,
      'X-Amz-Expires': '3600',
      'X-Amz-SignedHeaders': signedHeaderNames,
      ...Object.fromEntries(additionalParams.entries())
    };

    const sortedParams = Object.entries(params).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    const canonicalQueryString = sortedParams.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const canonicalUri = objectKey 
      ? encodeURIComponent(`/${this.bucket}/${objectKey}`).replace(/%2F/g, '/')
      : encodeURIComponent(`/${this.bucket}`).replace(/%2F/g, '/');

    const sortedHeaderEntries = Object.entries(allSignedHeaders).sort((a, b) => a[0].localeCompare(b[0]));
    const canonicalHeaders = sortedHeaderEntries.map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`).join('\n');

    const canonicalRequest = [method.toUpperCase(), canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaderNames, 'UNSIGNED-PAYLOAD'].join('\n');
    const canonicalHash = await this.sha256(canonicalRequest);
    const stringToSign = [`AWS4-HMAC-SHA256`, dateStr, `${dateOnly}/${this.region}/s3/aws4_request`, canonicalHash].join('\n');

    const kDate = await this.hmacSha256(`AWS4${this.secretKey}`, dateOnly);
    const kRegion = await this.hmacSha256(kDate, this.region);
    const kService = await this.hmacSha256(kRegion, 's3');
    const kSigning = await this.hmacSha256(kService, 'aws4_request');
    const signature = await this.hmacSha256Hex(kSigning, stringToSign);

    return canonicalQueryString + `&X-Amz-Signature=${signature}`;
  }

  async sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async hmacSha256(key, data) {
    const encoder = new TextEncoder();
    const keyBytes = key instanceof Uint8Array ? key : encoder.encode(key);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
    return new Uint8Array(signature);
  }

  async hmacSha256Hex(key, data) {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 解析 ListObjectsV2 XML 响应
   * @param {string} xmlText - XML 文本
   * @param {string} currentPrefix - 当前前缀
   * @returns {Array} 文件列表
   */
  parseListResult(xmlText, currentPrefix) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const files = [];

    // CommonPrefixes = 子目录
    const commonPrefixes = doc.getElementsByTagName('CommonPrefixes');
    for (let i = 0; i < commonPrefixes.length; i++) {
      const prefix = commonPrefixes[i].getElementsByTagName('Prefix')[0]?.textContent || '';
      // S3 返回的 prefix 是 URL 编码的，需要解码
      const decodedPrefix = decodeURIComponent(prefix);
      const decodedCurrentPrefix = decodeURIComponent(currentPrefix);
      const name = decodedPrefix.slice(decodedCurrentPrefix.length).replace(/\/$/, '');
      // path 应该是完整路径，包含父目录
      const fullPath = decodedPrefix.replace(/\/$/, '');
      files.push({ name, path: '/' + fullPath + '/', isDirectory: true, size: 0 });
    }

    // Contents = 文件
    const contents = doc.getElementsByTagName('Contents');
    for (let i = 0; i < contents.length; i++) {
      const keyEl = contents[i].getElementsByTagName('Key')[0];
      const sizeEl = contents[i].getElementsByTagName('LastModified')[0];
      const key = keyEl?.textContent || '';
      const lastModified = sizeEl?.textContent || '';

      if (!key || key === currentPrefix) continue;
      if (key.endsWith('/')) continue; // 目录占位符跳过

      // S3 返回的 key 是 URL 编码的，需要解码
      const decodedKey = decodeURIComponent(key);
      const decodedCurrentPrefix = decodeURIComponent(currentPrefix);
      const relativePath = decodedKey.slice(decodedCurrentPrefix.length);
      const name = relativePath.split('/').pop();

      const size = parseInt(contents[i].getElementsByTagName('Size')[0]?.textContent || '0');

      // path 应该是完整路径
      files.push({ name, path: '/' + decodedKey, isDirectory: false, size, lastModified });
    }

    return files.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * 通用 S3 请求（直接 Authorization header，非 presigned URL）
   * @param {string} objectKey - S3 object key（不含 /bucket/ 前缀）
   * @param {string} method - HTTP 方法
   * @param {Object} extraHeaders - 额外请求头
   * @returns {Promise<{ok: boolean, status: number, error?: string}>}
   */
  async _s3DirectRequest(objectKey, method, extraHeaders = {}) {
    const host = this.endpoint.replace(/^https?:\/\//, '');
    const date = new Date();
    const dateStr = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateOnly = dateStr.slice(0, 8);

    const allSignedHeaders = {
      'host': host,
      'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'x-amz-date': dateStr,
      ...extraHeaders
    };
    const signedHeaderNames = Object.keys(allSignedHeaders).sort().join(';');

    const canonicalUri = objectKey
      ? encodeURIComponent('/' + this.bucket + '/' + objectKey).replace(/%2F/g, '/')
      : encodeURIComponent('/' + this.bucket).replace(/%2F/g, '/');
    const canonicalQueryString = '';
    const sortedHeaders = Object.entries(allSignedHeaders).sort((a, b) => a[0].localeCompare(b[0]));
    const canonicalHeaders = sortedHeaders.map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`).join('\n');
    const canonicalRequest = [method.toUpperCase(), canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaderNames, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'].join('\n');
    const canonicalHash = await this._sha256Hex(canonicalRequest);
    const stringToSign = [`AWS4-HMAC-SHA256`, dateStr, `${dateOnly}/${this.region}/s3/aws4_request`, canonicalHash].join('\n');

    const kDate = await this._hmacSha256(`AWS4${this.secretKey}`, dateOnly);
    const kRegion = await this._hmacSha256(kDate, this.region);
    const kService = await this._hmacSha256(kRegion, 's3');
    const kSigning = await this._hmacSha256(kService, 'aws4_request');
    const signature = await this._hmacSha256Hex(kSigning, stringToSign);

    const authHeader = [
      `AWS4-HMAC-SHA256`,
      `Credential=${this.accessKey}/${dateOnly}/${this.region}/s3/aws4_request`,
      `SignedHeaders=${signedHeaderNames}`,
      `Signature=${signature}`
    ].join(', ');

    const url = `${this.endpoint}/${this.bucket}/${encodeURIComponent(objectKey).replace(/%2F/g, '/')}`;
    try {
      const resp = await fetch(url, {
        method,
        headers: { ...allSignedHeaders, 'Authorization': authHeader }
      });
      return { ok: resp.ok, status: resp.status };
    } catch (e) {
      return { ok: false, status: 0, error: e.message };
    }
  }

  async _sha256Hex(data) {
    const msgUint8 = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async _hmacSha256(key, data) {
    const keyData = new TextEncoder().encode(key);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
    return new Uint8Array(sig);
  }

  async _hmacSha256Hex(key, data) {
    const sig = await this._hmacSha256(key, data);
    return Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  _objectKey(filePath) {
    const clean = filePath.replace(/^\/+/, '');
    return this.prefix ? this.prefix.replace(/\/$/, '') + '/' + clean : clean;
  }

  /**
   * 删除文件或文件夹（批量）
   * @param {string[]} paths - 要删除的路径列表
   * @returns {Promise<{success: string[], failed: Array<{path, error}>}>}
   */
  async delete(paths) {
    const results = { success: [], failed: [] };
    for (const fullPath of paths) {
      try {
        const objectKey = this._objectKey(fullPath);
        // 判断是文件还是文件夹（文件夹以 / 结尾或通过 listDirectory 判断）
        const isDir = fullPath.endsWith('/');
        if (isDir) {
          // S3 无原生目录，列出所有子对象后逐个删除
          const dirContents = await this.listDirectory(fullPath);
          for (const item of dirContents) {
            const itemKey = this._objectKey(item.path);
            const r = await this._s3DirectRequest(itemKey, 'DELETE');
            if (!r.ok) results.failed.push({ path: item.path, error: `HTTP ${r.status}` });
            else results.success.push(item.path);
          }
        } else {
          const r = await this._s3DirectRequest(objectKey, 'DELETE');
          if (r.ok) results.success.push(fullPath);
          else results.failed.push({ path: fullPath, error: `HTTP ${r.status}` });
        }
      } catch (e) {
        results.failed.push({ path: fullPath, error: e.message });
      }
    }
    return results;
  }

  /**
   * 重命名文件或文件夹（S3 无原生 rename，用 Copy + Delete）
   * @param {string} path - 原路径
   * @param {string} newName - 新文件名
   * @returns {Promise<void>}
   */
  async rename(path, newName) {
    const srcKey = this._objectKey(path);
    const dstPath = path.substring(0, path.lastIndexOf('/') + 1) + newName;
    const dstKey = this._objectKey(dstPath);

    // CopyObject 需要 Authorization header
    const host = this.endpoint.replace(/^https?:\/\//, '');
    const date = new Date();
    const dateStr = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateOnly = dateStr.slice(0, 8);

    const copySource = encodeURIComponent('/' + this.bucket + '/' + srcKey).replace(/%2F/g, '/');
    const extraHeaders = {
      'host': host,
      'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'x-amz-date': dateStr,
      'x-amz-copy-source': copySource
    };
    const signedHeaderNames = Object.keys(extraHeaders).sort().join(';');

    const canonicalUri = encodeURIComponent('/' + this.bucket + '/' + dstKey).replace(/%2F/g, '/');
    const canonicalQueryString = '';
    const sortedHeaders = Object.entries(extraHeaders).sort((a, b) => a[0].localeCompare(b[0]));
    const canonicalHeaders = sortedHeaders.map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`).join('\n');
    const canonicalRequest = ['PUT', canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaderNames, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'].join('\n');
    const canonicalHash = await this._sha256Hex(canonicalRequest);
    const stringToSign = [`AWS4-HMAC-SHA256`, dateStr, `${dateOnly}/${this.region}/s3/aws4_request`, canonicalHash].join('\n');
    const kDate = await this._hmacSha256(`AWS4${this.secretKey}`, dateOnly);
    const kRegion = await this._hmacSha256(kDate, this.region);
    const kService = await this._hmacSha256(kRegion, 's3');
    const kSigning = await this._hmacSha256(kService, 'aws4_request');
    const signature = await this._hmacSha256Hex(kSigning, stringToSign);
    const authHeader = `AWS4-HMAC-SHA256, Credential=${this.accessKey}/${dateOnly}/${this.region}/s3/aws4_request, SignedHeaders=${signedHeaderNames}, Signature=${signature}`;
    const copyUrl = `${this.endpoint}/${this.bucket}/${encodeURIComponent(dstKey).replace(/%2F/g, '/')}`;
    const resp = await fetch(copyUrl, {
      method: 'PUT',
      headers: { ...extraHeaders, 'Authorization': authHeader }
    });
    if (!resp.ok) {
      const err = await resp.text().catch(() => `HTTP ${resp.status}`);
      throw new Error(err);
    }
    // 复制成功后删除原对象
    const delResult = await this._s3DirectRequest(srcKey, 'DELETE');
    if (!delResult.ok) {
      throw new Error(`Rename succeeded but delete original failed: HTTP ${delResult.status}`);
    }
  }
}
class CloudAttachView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.accountId = null;
    this.currentPath = '/';
    this.files = [];
    this.selectedFiles = new Set();
    this.client = null;
  }
  getViewType() { return VIEW_TYPE_CLOUDATTACH; }
  getDisplayText() { return t('cmd.open_cloud_attach'); }
  getIcon() { return 'folder-open'; }
  async onOpen() {
    console.log('[CloudAttach] onOpen called');
    this.contentEl.innerHTML = '<div style="padding:20px">' + t('view.loading') + '</div>';
    this.render();
  }
  async onClose() {}
  async render() {
    try {
      this.contentEl.innerHTML = '';
      const header = document.createElement('div');
      header.className = 'cloud-attach-header';
      header.innerHTML = '<h3 class="cloud-attach-title">☁️ CloudAttach</h3>';
      this.contentEl.appendChild(header);
      if (this.plugin.accounts.length === 0) {
        this.contentEl.innerHTML += '<p class="cloud-attach-hint">' + t('view.no_account_hint') + '</p>';
        return;
      }
      if (this.plugin.accounts.length === 1 && !this.accountId) {
        this.accountId = this.plugin.accounts[0].id;
        this.client = this.plugin.createClient(this.accountId);
        console.log('[CloudAttach] loading dir for single account');
        await this.loadDir();
        return;
      }
      const selectArea = document.createElement('div');
      selectArea.className = 'cloud-attach-select-area';
      const select = document.createElement('select');
      select.className = 'cloud-attach-select';
      select.innerHTML = '<option value="">' + t('view.select_account_hint') + '</option>';
      this.plugin.accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = acc.name;
        if (acc.id === this.accountId) opt.selected = true;
        select.appendChild(opt);
      });
      select.onchange = async (e) => {
        this.accountId = e.target.value;
        this.selectedFiles.clear();
        if (this.accountId) {
          this.currentPath = '/';
          this.client = this.plugin.createClient(this.accountId);
          await this.loadDir();
        }
      };
      selectArea.appendChild(select);
      this.contentEl.appendChild(selectArea);
      this.breadcrumbEl = document.createElement('div');
      this.breadcrumbEl.className = 'cloud-attach-breadcrumb';
      this.batchBarEl = document.createElement('div');
      this.batchBarEl.className = 'cloud-attach-batch-bar';
      this.batchBarEl.style.display = 'none';
      this.fileListEl = document.createElement('div');
      this.fileListEl.className = 'cloud-attach-file-list';
      this.contentEl.appendChild(this.breadcrumbEl);
      this.contentEl.appendChild(this.batchBarEl);
      this.contentEl.appendChild(this.fileListEl);
      if (this.accountId && this.client) {
        await this.loadDir();
      } else {
        this.breadcrumbEl.innerHTML = '<span style="color:var(--text-muted);padding:10px;">' + t('view.select_account_hint') + '</span>';
      }
      console.log('[CloudAttach] render completed');
    } catch (e) {
      console.error('[CloudAttach] render error:', e);
      this.contentEl.innerHTML = `<p class="cloud-attach-error">${t('view.error', {error: e.message})}</p>`;
    }
  }
  renderBreadcrumb() {
    if (!this.breadcrumbEl) return;
    this.breadcrumbEl.innerHTML = '';
    const root = document.createElement('button');
    root.className = 'cloud-attach-breadcrumb-btn';
    root.textContent = t('view.root');
    root.onclick = () => { this.navigateTo('/'); };
    this.breadcrumbEl.appendChild(root);
    if (this.currentPath === '/') {
      this.renderBatchBar();
      return;
    }
    const parts = this.currentPath.split('/').filter(p => p);
    for (let i = 0; i < parts.length; i++) {
      const sep = document.createElement('span');
      sep.className = 'cloud-attach-breadcrumb-sep';
      sep.textContent = ' › ';
      this.breadcrumbEl.appendChild(sep);
      // 每个路径段都变成可点击的按钮
      const targetPath = '/' + parts.slice(0, i + 1).join('/');
      const btn = document.createElement('button');
      btn.className = 'cloud-attach-breadcrumb-btn';
      btn.textContent = parts[i];
      btn.onclick = () => { this.navigateTo(targetPath); };
      this.breadcrumbEl.appendChild(btn);
    }
    const refresh = document.createElement('button');
    refresh.className = 'cloud-attach-refresh';
    refresh.textContent = '🔄';
    refresh.onclick = () => this.loadDir();
    this.breadcrumbEl.appendChild(refresh);
    this.renderBatchBar();
  }
  // 统一的导航方法
  navigateTo(path) {
    console.log('[CloudAttach] navigateTo:', path, 'from:', this.currentPath);
    if (this.currentPath !== path) {
      this.currentPath = path;
      this.selectedFiles.clear();
      this.loadDir();
    }
  }
  renderBatchBar() {
    if (!this.batchBarEl) return;
    this.batchBarEl.innerHTML = '';
    const count = this.selectedFiles.size;
    const totalCount = this.files.length;
    if (count === 0) {
      this.batchBarEl.style.display = 'none';
      return;
    }
    this.batchBarEl.style.display = 'flex';
    const span = document.createElement('span');
    span.className = 'cloud-attach-batch-count';
    span.textContent = t('view.file_count', {count, total: totalCount});
    this.batchBarEl.appendChild(span);
    // 全选按钮
    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'cloud-attach-batch-btn mod-secondary';
    selectAllBtn.textContent = t('view.select_all');
    selectAllBtn.onclick = () => {
      this.files.forEach(f => this.selectedFiles.add(f.path));
      this.renderFiles();
      this.renderBatchBar();
    };
    this.batchBarEl.appendChild(selectAllBtn);
    // 取消全选按钮
    const deselectBtn = document.createElement('button');
    deselectBtn.className = 'cloud-attach-batch-btn mod-secondary';
    deselectBtn.textContent = t('view.cancel');
    deselectBtn.onclick = () => { this.selectedFiles.clear(); this.renderFiles(); this.renderBatchBar(); };
    this.batchBarEl.appendChild(deselectBtn);
    const insertBtn = document.createElement('button');
    insertBtn.className = 'cloud-attach-batch-btn';
    insertBtn.textContent = t('view.insert');
    insertBtn.onclick = () => this.insertSelectedFiles();
    this.batchBarEl.appendChild(insertBtn);
    // 复制 URL 按钮（复制所有选中文件的 URL）
    const copyUrlBtn = document.createElement('button');
    copyUrlBtn.className = 'cloud-attach-batch-btn mod-secondary';
    copyUrlBtn.textContent = t('view.copy_url');
    copyUrlBtn.onclick = async () => {
      if (!this.client || this.selectedFiles.size === 0) {
        new Notice(t('notice.no_file_selected'));
        return;
      }
      const selected = this.files.filter(f => this.selectedFiles.has(f.path));
      const urls = await Promise.all(selected.map(f =>
        this.client.getSignedUrl ? this.client.getSignedUrl(f.path) : this.client.getFileUrl(f.path)
      ));
      await navigator.clipboard.writeText(urls.join('\n'));
      new Notice(t('notice.copied_count', {count: urls.length}));
    };
    this.batchBarEl.appendChild(copyUrlBtn);
    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'cloud-attach-batch-btn';
    deleteBtn.style.color = 'var(--text-error)';
    deleteBtn.textContent = t('view.delete_btn') + (count > 0 ? ` (${count})` : '');
    deleteBtn.onclick = () => this.showDeleteConfirmModal();
    this.batchBarEl.appendChild(deleteBtn);
  }
  /**
   * 显示删除确认弹窗
   */
  showDeleteConfirmModal() {
    const selected = this.files.filter(f => this.selectedFiles.has(f.path));
    if (selected.length === 0) return;
    const modal = new (require('obsidian').Modal)(this.app);
    modal.titleEl.textContent = t('view.delete_confirm_title');
    const content = modal.contentEl;
    content.style.padding = '16px';
    const body = document.createElement('p');
    body.style.marginBottom = '12px';
    body.textContent = t('view.delete_confirm_body', { count: selected.length });
    content.appendChild(body);
    const list = document.createElement('div');
    list.style.maxHeight = '200px';
    list.style.overflow = 'auto';
    list.style.border = '1px solid var(--background-modifier-border)';
    list.style.borderRadius = '4px';
    list.style.padding = '8px';
    list.style.marginBottom = '16px';
    const maxShow = 10;
    selected.slice(0, maxShow).forEach(f => {
      const item = document.createElement('div');
      item.style.padding = '3px 0';
      item.style.fontSize = '13px';
      item.textContent = f.isDirectory
        ? t('view.delete_folder', { name: f.name })
        : t('view.delete_item', { name: f.name });
      list.appendChild(item);
    });
    if (selected.length > maxShow) {
      const more = document.createElement('div');
      more.style.padding = '3px 0';
      more.style.fontSize = '13px';
      more.style.color = 'var(--text-muted)';
      more.textContent = t('view.delete_and_more', { count: selected.length - maxShow });
      list.appendChild(more);
    }
    content.appendChild(list);
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.justifyContent = 'flex-end';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'mod-secondary';
    cancelBtn.textContent = t('view.cancel');
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.onclick = () => modal.close();
    const confirmBtn = document.createElement('button');
    confirmBtn.style.background = 'var(--text-error)';
    confirmBtn.style.color = 'var(--background-primary)';
    confirmBtn.style.padding = '8px 16px';
    confirmBtn.textContent = t('view.confirm_delete', { count: selected.length });
    confirmBtn.onclick = async () => {
      modal.close();
      await this.doDelete(selected);
    };
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    content.appendChild(btnRow);
    modal.open();
  }
  /**
   * 执行删除
   * @param {Array} files - 要删除的文件对象列表
   */
  async doDelete(files) {
    if (!this.client) return;
    const paths = files.map(f => f.path);
    const result = await this.client.delete(paths);
    if (result.failed.length === 0) {
      new Notice(t('notice.delete_success', { count: result.success.length }));
    } else if (result.success.length === 0) {
      new Notice(t('notice.delete_failed', { error: result.failed[0].error }), 5000);
    } else {
      new Notice(t('notice.delete_partial', { success: result.success.length, failed: result.failed.length }), 5000);
    }
    this.selectedFiles.clear();
    this.loadDir();
  }
  /**
   * 显示重命名弹窗
   * @param {Object} file - 文件对象
   */
  showRenameModal(file) {
    const modal = new (require('obsidian').Modal)(this.app);
    modal.titleEl.textContent = t('view.rename_title');
    const content = modal.contentEl;
    content.style.padding = '16px';
    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.marginBottom = '8px';
    label.style.fontSize = '13px';
    label.textContent = t('view.rename_label');
    content.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.value = file.name;
    input.style.width = '100%';
    input.style.padding = '6px 8px';
    input.style.boxSizing = 'border-box';
    input.style.marginBottom = '16px';
    input.placeholder = t('view.rename_placeholder');
    input.onkeydown = (e) => { if (e.key === 'Enter') confirmBtn.click(); };
    content.appendChild(input);
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.justifyContent = 'flex-end';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'mod-secondary';
    cancelBtn.textContent = t('view.cancel');
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.onclick = () => modal.close();
    const confirmBtn = document.createElement('button');
    confirmBtn.style.background = 'var(--interactive-accent)';
    confirmBtn.style.color = 'var(--text-on-accent)';
    confirmBtn.style.padding = '8px 16px';
    confirmBtn.textContent = t('view.confirm_rename', { count: 1 });
    confirmBtn.onclick = async () => {
      const newName = input.value.trim();
      if (!newName) { new Notice(t('notice.rename_failed', {error: 'Name cannot be empty'}), 3000); return; }
      if (newName.includes('/')) { new Notice(t('notice.rename_failed', {error: 'Name cannot contain /'}), 3000); return; }
      modal.close();
      await this.doRename(file, newName);
    };
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    content.appendChild(btnRow);
    modal.open();
    input.focus();
    input.select();
  }
  /**
   * 执行重命名
   * @param {Object} file - 原文件对象
   * @param {string} newName - 新文件名
   */
  async doRename(file, newName) {
    if (!this.client) return;
    try {
      await this.client.rename(file.path, newName);
      new Notice(t('notice.rename_success'));
      this.selectedFiles.clear();
      this.loadDir();
    } catch (e) {
      const msg = e.message || String(e);
      if (msg.includes('exist') || msg.includes('409') || msg.includes('already')) {
        new Notice(t('notice.rename_conflict'), 4000);
      } else {
        new Notice(t('notice.rename_failed', {error: msg}), 5000);
      }
    }
  }
  // 刷新账户下拉框
  refreshAccountSelect() {
    const select = this.contentEl.querySelector('select.cloud-attach-select');
    if (!select) return;
    select.innerHTML = '<option value="">' + t('view.select_account_hint') + '</option>';
    this.plugin.accounts.forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.textContent = acc.name;
      if (acc.id === this.accountId) opt.selected = true;
      select.appendChild(opt);
    });
  }
  async loadDir() {
    if (!this.accountId) return;
    this.renderBreadcrumb();
    if (!this.fileListEl) return;
    this.fileListEl.innerHTML = '<p class="cloud-attach-loading">' + t('view.loading') + '</p>';
    if (!this.client) {
      this.client = this.plugin.createClient(this.accountId);
    }
    if (!this.client) {
      this.fileListEl.innerHTML = '<p class="cloud-attach-error">' + t('view.no_account_selected') + '</p>';
      return;
    }
    try {
      this.files = await this.client.listDirectory(this.currentPath);
      this.selectedFiles.clear();
      this.renderFiles();
    } catch (e) {
      console.error('[CloudAttach] loadDir error:', e);
      this.fileListEl.innerHTML = `<p class="cloud-attach-error">${t('view.connect_failed', {error: e.message})}</p><p class="cloud-attach-hint">${t('settings.check_account_settings')}</p>`;
    }
  }
  renderFiles() {
    if (!this.fileListEl) return;
    this.fileListEl.innerHTML = '';
    console.log('[CloudAttach] rendering files, count:', this.files.length);
    if (this.files.length === 0) {
      this.fileListEl.innerHTML = '<p class="cloud-attach-empty">' + t('view.empty_dir') + '</p>';
      return;
    }
    this.files.forEach(file => {
      const item = document.createElement('div');
      item.className = 'cloud-attach-file';
      // 文件和文件夹都有 checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'cloud-attach-checkbox';
      checkbox.checked = this.selectedFiles.has(file.path);
      checkbox.onclick = (e) => {
        e.stopPropagation();
        if (checkbox.checked) this.selectedFiles.add(file.path);
        else this.selectedFiles.delete(file.path);
        this.renderBatchBar();
      };
      item.appendChild(checkbox);
      const icon = document.createElement('span');
      icon.className = 'cloud-attach-icon';
      icon.textContent = file.isDirectory ? '📁' : this.getFileIcon(file.name);
      item.appendChild(icon);
      const name = document.createElement('span');
      name.className = 'cloud-attach-name';
      name.textContent = file.name;
      if (file.isDirectory) {
        name.onclick = () => { this.currentPath = file.path; this.selectedFiles.clear(); this.loadDir(); };
      } else {
        name.onclick = () => this.insertFile(file);
      }
      name.style.cursor = 'pointer';
      item.appendChild(name);
      item.oncontextmenu = (e) => {
        e.preventDefault();
        this.showMenu(file, e);
      };
      this.fileListEl.appendChild(item);
    });
  }
  getFileIcon(name) {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const icons = {
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️', 'svg': '🖼️', 'bmp': '🖼️',
      'mp4': '🎬', 'mov': '🎬', 'avi': '🎬', 'mkv': '🎬', 'webm': '🎬', 'flv': '🎬',
      'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'aac': '🎵', 'ogg': '🎵', 'm4a': '🎵',
      'pdf': '📄', 'doc': '📄', 'docx': '📄', 'txt': '📄', 'md': '📝',
      'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦'
    };
    return icons[ext] || '📄';
  }
  // 获取要插入的 Markdown 格式（异步）
  async getInsertMarkdown(file) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'];
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    // 文档类型（iframe 预览）使用原始 URL（无 /d/、无 sign）
    const useRawUrl = docExts.includes(ext);
    let url;
    if (useRawUrl) {
      // iframe 预览：用 getRawUrl（OpenList）或 getFileUrl（S3），不带签名
      url = this.client.getRawUrl
        ? this.client.getRawUrl(file.path)
        : this.client.getFileUrl(file.path);
    } else {
      // 图片/链接：优先使用 getSignedUrl
      url = await (this.client.getSignedUrl
        ? this.client.getSignedUrl(file.path)
        : this.client.getFileUrl(file.path));
    }
    if (imageExts.includes(ext)) {
      return `![${nameWithoutExt}](${url})`;
    } else if (videoExts.includes(ext)) {
      return `<video controls width="600" height="400">\n <source src="${url}" type="video/mp4">\n</video>`;
    } else if (audioExts.includes(ext)) {
      return `<audio controls>\n <source src="${url}" type="audio/mpeg">\n</audio>`;
    } else if (docExts.includes(ext)) {
      return `<iframe src="${url}" width="100%" height="800px"></iframe>`;
    } else {
      return `[${file.name}](${url})`;
    }
  }
  // 查找最近使用的 MarkdownView（排除自身侧边栏）
  findMostRecentMarkdownView() {
    const { workspace } = this.plugin.app;
    // 优先使用 activeMarkdownView（实时跟踪，用户最后操作的 Markdown view）
    if (this.plugin.activeMarkdownView?.editor) {
      return this.plugin.activeMarkdownView;
    }
    // 备用：获取当前聚焦的 MarkdownView
    let view = workspace.getActiveViewOfType(MarkdownView);
    if (view?.editor) return view;
    // 备用：获取最近使用的 leaf
    const recentLeaf = workspace.getMostRecentLeaf();
    if (recentLeaf?.view instanceof MarkdownView && recentLeaf.view.editor) {
      return recentLeaf.view;
    }
    // 备用：遍历所有 markdown leaf
    const leaves = workspace.getLeavesOfType('markdown');
    for (const leaf of leaves) {
      if (leaf.view instanceof MarkdownView && leaf.view.editor) {
        return leaf.view;
      }
    }
    return null;
  }
  // 插入单个文件到笔记（异步）
  async insertFile(file) {
    const md = await this.getInsertMarkdown(file);
    const view = this.findMostRecentMarkdownView();
    if (view?.editor) {
      const cursor = view.editor.getCursor();
      view.editor.replaceRange(md + '\n', cursor);
      new Notice(t('notice.inserted', {name: file.name}));
    } else {
      new Notice(t('notice.open_note_first'));
    }
  }
  // 批量插入（异步）
  async insertSelectedFiles() {
    if (!this.client || this.selectedFiles.size === 0) return;
    const selected = this.files.filter(f => this.selectedFiles.has(f.path));
    const mds = await Promise.all(selected.map(file => this.getInsertMarkdown(file)));
    const view = this.findMostRecentMarkdownView();
    if (view?.editor) {
      const cursor = view.editor.getCursor();
      view.editor.replaceRange(mds.join('\n') + '\n', cursor);
      new Notice(t('notice.inserted_count', {count: selected.length}));
    } else {
      new Notice(t('notice.open_note_first'));
    }
    this.selectedFiles.clear();
    this.renderFiles();
    this.renderBatchBar();
  }
  showMenu(file, event) {
    const menu = new Menu(this.plugin.app);
    if (!file.isDirectory) {
      // 插入到笔记（多选时插入所有选中，否则只插当前）
      menu.addItem(item => {
        const isMulti = this.selectedFiles.size > 1;
        item.setTitle(isMulti ? t('menu.insert_note_multi', {count: this.selectedFiles.size}) : t('menu.insert_note')).setIcon('link');
        item.onClick(() => {
          if (isMulti) this.insertSelectedFiles();
          else this.insertFile(file);
        });
      });
      // 复制链接（多选时复制所有选中文件，否则复制当前文件）
      menu.addItem(item => {
        item.setTitle(t('menu.copy_link'));
        item.onClick(async () => {
          if (!this.client) return;
          try {
            const files = this.selectedFiles.size > 1
              ? this.files.filter(f => this.selectedFiles.has(f.path))
              : [file];
            const urls = await Promise.all(files.map(f =>
              this.client.getSignedUrl ? this.client.getSignedUrl(f.path) : this.client.getFileUrl(f.path)
            ));
            await navigator.clipboard.writeText(urls.join('\n'));
            new Notice(t('notice.copied_count_links', {count: urls.length}));
          } catch { new Notice(t('notice.copy_link_failed')); }
        });
      });
      // 重命名
      menu.addItem(item => {
        item.setTitle(t('menu.rename')).onClick(() => this.showRenameModal(file));
      });
      // 选择/取消选择
      menu.addItem(item => {
        item.setTitle(this.selectedFiles.has(file.path) ? t('menu.deselect') : t('menu.select')).onClick(() => {
          if (this.selectedFiles.has(file.path)) this.selectedFiles.delete(file.path);
          else this.selectedFiles.add(file.path);
          this.renderFiles();
          this.renderBatchBar();
        });
      });
    }
    if (file.isDirectory) {
      menu.addItem(item => {
        item.setTitle(t('view.open_dir')).onClick(() => { this.currentPath = file.path; this.selectedFiles.clear(); this.loadDir(); });
      });
      menu.addItem(item => {
        item.setTitle(t('menu.rename')).onClick(() => this.showRenameModal(file));
      });
    }
    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }
}
class AddAccountModal extends Modal {
  constructor(app, plugin, onSave, account = null) {
    super(app);
    this.plugin = plugin;
    this.onSave = onSave;
    this.account = account;
  }
  onOpen() {
    this.contentEl.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = this.account ? t('settings.edit_account') : t('settings.add_account');
    this.contentEl.appendChild(title);
    const fields = {};
    // ---- 账户类型选择 ----
    const typeDiv = document.createElement('div');
    typeDiv.style.margin = '16px 0';
    const typeLabel = document.createElement('label');
    typeLabel.style.display = 'block';
    typeLabel.style.marginBottom = '8px';
    typeLabel.style.fontSize = '12px';
    typeLabel.style.color = 'var(--text-muted)';
    typeLabel.textContent = t('settings.storage_type');
    typeDiv.appendChild(typeLabel);
    const typeRow = document.createElement('div');
    typeRow.style.display = 'flex';
    typeRow.style.gap = '16px';
    const typeOpenList = document.createElement('label');
    typeOpenList.style.display = 'flex';
    typeOpenList.style.alignItems = 'center';
    typeOpenList.style.gap = '6px';
    typeOpenList.style.cursor = 'pointer';
    typeOpenList.style.fontSize = '13px';
    const radioOpenList = document.createElement('input');
    radioOpenList.type = 'radio';
    radioOpenList.name = 'accountType';
    radioOpenList.value = 'openlist';
    typeOpenList.appendChild(radioOpenList);
    typeOpenList.appendChild(document.createTextNode('OpenList / WebDAV'));
    const typeS3 = document.createElement('label');
    typeS3.style.display = 'flex';
    typeS3.style.alignItems = 'center';
    typeS3.style.gap = '6px';
    typeS3.style.cursor = 'pointer';
    typeS3.style.fontSize = '13px';
    const radioS3 = document.createElement('input');
    radioS3.type = 'radio';
    radioS3.name = 'accountType';
    radioS3.value = 's3';
    typeS3.appendChild(radioS3);
    typeS3.appendChild(document.createTextNode(t('settings.s3_type_label')));
    typeRow.appendChild(typeOpenList);
    typeRow.appendChild(typeS3);
    typeDiv.appendChild(typeRow);
    this.contentEl.appendChild(typeDiv);
    // ---- 账户名称（通用）----
    const nameDiv = this.createFieldDiv(t('settings.account_name'), t('settings.account_name_placeholder'));
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = t('settings.account_name_placeholder');
    nameInput.value = this.account?.name || '';
    nameInput.className = 'cloud-attach-input';
    nameDiv.appendChild(nameInput);
    fields.name = nameInput;
    this.contentEl.appendChild(nameDiv);
    // ---- OpenList / WebDAV 字段集 ----
    const openlistFields = document.createElement('div');
    openlistFields.id = 'ol-fields';
    const urlDiv = this.createFieldDiv(t('settings.server_address'), t('settings.server_address_placeholder'));
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.placeholder = 'http://192.168.62.200:5244';
    urlInput.value = this.account?.url || '';
    urlInput.className = 'cloud-attach-input';
    urlDiv.appendChild(urlInput);
    fields.url = urlInput;
    openlistFields.appendChild(urlDiv);
    const webdavDiv = this.createFieldDiv(t('settings.webdav_path_label'), t('settings.webdav_path_placeholder'));
    const webdavInput = document.createElement('input');
    webdavInput.type = 'text';
    webdavInput.placeholder = '/dav';
    webdavInput.value = this.account?.webdavPath || '/dav';
    webdavInput.className = 'cloud-attach-input';
    webdavDiv.appendChild(webdavInput);
    fields.webdavPath = webdavInput;
    openlistFields.appendChild(webdavDiv);
    const userDiv = this.createFieldDiv(t('settings.username'), '');
    const userInput = document.createElement('input');
    userInput.type = 'text';
    userInput.value = this.account?.username || '';
    userInput.className = 'cloud-attach-input';
    userDiv.appendChild(userInput);
    fields.username = userInput;
    openlistFields.appendChild(userDiv);
    const passDiv = this.createFieldDiv(t('settings.password'), '');
    const passWrapper = document.createElement('div');
    passWrapper.style.display = 'flex';
    passWrapper.style.gap = '4px';
    const passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.value = this.account?.password || '';
    passInput.className = 'cloud-attach-input';
    passInput.style.flex = '1';
    passWrapper.appendChild(passInput);
    const passToggle = document.createElement('button');
    passToggle.textContent = '👁️';
    passToggle.type = 'button';
    passToggle.style.padding = '6px 8px';
    passToggle.style.cursor = 'pointer';
    passToggle.onclick = () => {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
      passToggle.textContent = passInput.type === 'password' ? '👁️' : '🔒';
    };
    passWrapper.appendChild(passToggle);
    passDiv.appendChild(passWrapper);
    fields.password = passInput;
    openlistFields.appendChild(passDiv);
    const tokenDiv = this.createFieldDiv(t('settings.token'), t('settings.token_hint'));
    const tokenWrapper = document.createElement('div');
    tokenWrapper.style.display = 'flex';
    tokenWrapper.style.gap = '4px';
    const tokenInput = document.createElement('input');
    tokenInput.type = 'password';
    tokenInput.value = this.account?.token || '';
    tokenInput.className = 'cloud-attach-input';
    tokenInput.style.flex = '1';
    tokenWrapper.appendChild(tokenInput);
    const tokenToggle = document.createElement('button');
    tokenToggle.textContent = '👁️';
    tokenToggle.type = 'button';
    tokenToggle.style.padding = '6px 8px';
    tokenToggle.style.cursor = 'pointer';
    tokenToggle.onclick = () => {
      tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
      tokenToggle.textContent = tokenInput.type === 'password' ? '👁️' : '🔒';
    };
    tokenWrapper.appendChild(tokenToggle);
    tokenDiv.appendChild(tokenWrapper);
    fields.token = tokenInput;
    openlistFields.appendChild(tokenDiv);
    this.contentEl.appendChild(openlistFields);
    // ---- S3 字段集 ----
    const s3Fields = document.createElement('div');
    s3Fields.id = 's3-fields';
    s3Fields.style.display = 'none';
    const endpointDiv = this.createFieldDiv(t('settings.endpoint'), t('settings.endpoint_placeholder'));
    const endpointInput = document.createElement('input');
    endpointInput.type = 'text';
    endpointInput.placeholder = 'https://xxx.r2.cloudflarestorage.com';
    endpointInput.value = this.account?.endpoint || '';
    endpointInput.className = 'cloud-attach-input';
    endpointDiv.appendChild(endpointInput);
    fields.endpoint = endpointInput;
    s3Fields.appendChild(endpointDiv);
    const bucketDiv = this.createFieldDiv(t('settings.bucket'), t('settings.bucket_placeholder'));
    const bucketInput = document.createElement('input');
    bucketInput.type = 'text';
    bucketInput.placeholder = 'my-vault-attach';
    bucketInput.value = this.account?.bucket || '';
    bucketInput.className = 'cloud-attach-input';
    bucketDiv.appendChild(bucketInput);
    fields.bucket = bucketInput;
    s3Fields.appendChild(bucketDiv);
    const regionDiv = this.createFieldDiv(t('settings.region'), t('settings.region_placeholder'));
    const regionInput = document.createElement('input');
    regionInput.type = 'text';
    regionInput.placeholder = 'auto';
    regionInput.value = this.account?.region || '';
    regionInput.className = 'cloud-attach-input';
    regionDiv.appendChild(regionInput);
    fields.region = regionInput;
    s3Fields.appendChild(regionDiv);
    const akDiv = this.createFieldDiv(t('settings.access_key'), '');
    const akInput = document.createElement('input');
    akInput.type = 'text';
    akInput.value = this.account?.accessKey || '';
    akInput.className = 'cloud-attach-input';
    akDiv.appendChild(akInput);
    fields.accessKey = akInput;
    s3Fields.appendChild(akDiv);
    const skDiv = this.createFieldDiv(t('settings.secret_key'), '');
    const skWrapper = document.createElement('div');
    skWrapper.style.display = 'flex';
    skWrapper.style.gap = '4px';
    const skInput = document.createElement('input');
    skInput.type = 'password';
    skInput.value = this.account?.secretKey || '';
    skInput.className = 'cloud-attach-input';
    skInput.style.flex = '1';
    skWrapper.appendChild(skInput);
    const skToggle = document.createElement('button');
    skToggle.textContent = '👁️';
    skToggle.type = 'button';
    skToggle.style.padding = '6px 8px';
    skToggle.style.cursor = 'pointer';
    skToggle.onclick = () => {
      skInput.type = skInput.type === 'password' ? 'text' : 'password';
      skToggle.textContent = skInput.type === 'password' ? '👁️' : '🔒';
    };
    skWrapper.appendChild(skToggle);
    skDiv.appendChild(skWrapper);
    fields.secretKey = skInput;
    s3Fields.appendChild(skDiv);
    const publicUrlDiv = this.createFieldDiv(t('settings.public_url'), t('settings.cdn_url_placeholder'));
    const publicUrlInput = document.createElement('input');
    publicUrlInput.type = 'text';
    publicUrlInput.placeholder = 'https://cdn.example.com';
    publicUrlInput.value = this.account?.publicUrl || '';
    publicUrlInput.className = 'cloud-attach-input';
    publicUrlDiv.appendChild(publicUrlInput);
    fields.publicUrl = publicUrlInput;
    s3Fields.appendChild(publicUrlDiv);
    const prefixDiv = this.createFieldDiv(t('settings.prefix'), t('settings.prefix_placeholder'));
    const prefixInput = document.createElement('input');
    prefixInput.type = 'text';
    prefixInput.placeholder = 'obsidian/';
    prefixInput.value = this.account?.prefix || '';
    prefixInput.className = 'cloud-attach-input';
    prefixDiv.appendChild(prefixInput);
    fields.prefix = prefixInput;
    s3Fields.appendChild(prefixDiv);
    this.contentEl.appendChild(s3Fields);
    // ---- 切换逻辑 ----
    const switchType = (type) => {
      openlistFields.style.display = type === 'openlist' ? 'block' : 'none';
      s3Fields.style.display = type === 's3' ? 'block' : 'none';
    };
    radioOpenList.onchange = () => switchType('openlist');
    radioS3.onchange = () => switchType('s3');
    // 根据已有账户类型初始化
    const currentType = this.account?.type === 's3' ? 's3' : 'openlist';
    if (currentType === 's3') radioS3.checked = true;
    else radioOpenList.checked = true;
    switchType(currentType);
    // ---- 按钮行 ----
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.justifyContent = 'flex-end';
    btnRow.style.marginTop = '16px';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = t('view.cancel');
    cancelBtn.className = 'cloud-attach-btn';
    cancelBtn.onclick = () => this.close();
    const saveBtn = document.createElement('button');
    saveBtn.textContent = t('settings.save');
    saveBtn.className = 'cloud-attach-btn mod-cta';
    saveBtn.onclick = async () => {
      const accountType = radioOpenList.checked ? 'openlist' : 's3';
      let accountData;
      if (accountType === 's3') {
        // S3 模式校验
        const endpoint = fields.endpoint.value.trim().replace(/\/$/, '');
        const bucket = fields.bucket.value.trim();
        if (!endpoint) { new Notice(t('settings.please_fill_endpoint'), 3000); return; }
        if (!bucket) { new Notice(t('settings.please_fill_bucket'), 3000); return; }
        accountData = {
          type: 's3',
          name: fields.name.value.trim() || t('settings.s3_account_label', {n: this.plugin.accounts.length + 1}),
          endpoint,
          bucket,
          region: fields.region.value.trim(),
          accessKey: fields.accessKey.value.trim(),
          secretKey: fields.secretKey.value,
          publicUrl: fields.publicUrl.value.trim(),
          prefix: fields.prefix.value.trim(),
          isActive: true
        };
      } else {
        // OpenList 模式校验
        const url = fields.url.value.trim().replace(/\/$/, '');
        if (!url) { new Notice(t('settings.please_fill_server'), 3000); return; }
        accountData = {
          type: 'openlist',
          name: fields.name.value.trim() || t('settings.account_label', {n: this.plugin.accounts.length + 1}),
          url,
          webdavPath: fields.webdavPath.value.trim() || '/dav',
          username: fields.username.value.trim(),
          password: fields.password.value,
          token: fields.token.value,
          isActive: true
        };
      }
      if (this.account) await this.plugin.updateAccount(this.account.id, accountData);
      else await this.plugin.addAccount(accountData);
      this.close();
      setTimeout(() => this.onSave?.(), 50);
    };
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    this.contentEl.appendChild(btnRow);
  }
  createFieldDiv(label, placeholder) {
    const div = document.createElement('div');
    div.style.margin = '12px 0';
    const lbl = document.createElement('label');
    lbl.textContent = label;
    lbl.style.display = 'block';
    lbl.style.marginBottom = '4px';
    lbl.style.fontSize = '12px';
    lbl.style.color = 'var(--text-muted)';
    div.appendChild(lbl);
    return div;
  }
}
class CloudAttachSettingTab extends PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }
  // 刷新侧边栏视图的下拉框
  refreshViewSelect() {
    const view = this.app.workspace.getLeavesOfType('cloud-attach-view')[0]?.view;
    if (view && view.refreshAccountSelect) {
      view.refreshAccountSelect();
    }
  }
  display() { this.render(); }
  render() {
    this.containerEl.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = t('settings.title');
    this.containerEl.appendChild(title);
    const desc = document.createElement('p');
    desc.textContent = t('settings.openlist_desc');
    desc.className = 'setting-item-description';
    this.containerEl.appendChild(desc);
    // 刷新按钮 - 移到下面
    if (this.plugin.accounts.length > 0) {
      this.plugin.accounts.forEach(account => this.renderAccount(account));
    }
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.marginTop = '16px';
    const addBtn = document.createElement('button');
    addBtn.textContent = '+ ' + t('settings.add_account');
    addBtn.className = 'cloud-attach-add-btn';
    addBtn.onclick = () => new AddAccountModal(this.plugin.app, this.plugin, () => {
      this.containerEl.innerHTML = '';
      this.render();
      this.refreshViewSelect();
    }).open();
    btnRow.appendChild(addBtn);
    this.containerEl.appendChild(btnRow);
  }
  renderAccount(account) {
    const card = document.createElement('div');
    card.className = 'cloud-attach-card';
    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.alignItems = 'center';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.marginBottom = '8px';
    const h3 = document.createElement('h3');
    h3.textContent = account.name;
    h3.style.margin = '0';
    h3.style.fontSize = '14px';
    headerRow.appendChild(h3);
    const typeBadge = document.createElement('span');
    typeBadge.style.fontSize = '10px';
    typeBadge.style.padding = '2px 6px';
    typeBadge.style.borderRadius = '10px';
    typeBadge.style.fontWeight = '600';
    if (account.type === 's3') {
      typeBadge.textContent = t('settings.openlist');
      typeBadge.style.background = '#e8f5e9';
      typeBadge.style.color = '#2e7d32';
    } else {
      typeBadge.textContent = 'WebDAV';
      typeBadge.style.background = '#e3f2fd';
      typeBadge.style.color = '#1565c0';
    }
    headerRow.appendChild(typeBadge);
    card.appendChild(headerRow);
    if (account.type === 's3') {
      const p1 = document.createElement('p');
      p1.textContent = `${t('view.account_endpoint')}: ${account.endpoint}`;
      p1.className = 'setting-item-description';
      p1.style.wordBreak = 'break-all';
      card.appendChild(p1);
      const p2 = document.createElement('p');
      p2.textContent = `${t('view.account_bucket')}: ${account.bucket}`;
      p2.className = 'setting-item-description';
      card.appendChild(p2);
      if (account.prefix) {
        const p3 = document.createElement('p');
        p3.textContent = `${t('view.account_prefix')}: ${account.prefix}`;
        p3.className = 'setting-item-description';
        card.appendChild(p3);
      }
    } else {
      const p1 = document.createElement('p');
      p1.textContent = `${t('view.account_address')}: ${account.url}`;
      p1.className = 'setting-item-description';
      card.appendChild(p1);
      if (account.username) {
        const p2 = document.createElement('p');
        p2.textContent = `${t('view.account_user')}: ${account.username}`;
        p2.className = 'setting-item-description';
        card.appendChild(p2);
      }
    }
    const btnRow = document.createElement('div');
    btnRow.className = 'cloud-attach-card-btns';
    const editBtn = document.createElement('button');
    editBtn.textContent = t('settings.edit');
    editBtn.className = 'cloud-attach-btn';
    editBtn.onclick = () => new AddAccountModal(this.plugin.app, this.plugin, () => {
      this.containerEl.innerHTML = '';
      this.render();
      this.refreshViewSelect();
    }, account).open();
    const testBtn = document.createElement('button');
    testBtn.textContent = t('settings.test');
    testBtn.className = 'cloud-attach-btn';
    testBtn.onclick = async () => {
      const client = this.plugin.createClient(account.id);
      if (client) {
        const ok = await client.testConnection();
        new Notice(ok ? t('notice.connect_success') : t('notice.connect_failed'), 3000);
      }
    };
    const delBtn = document.createElement('button');
    delBtn.textContent = t('settings.delete');
    delBtn.className = 'cloud-attach-btn';
    delBtn.onclick = async () => {
      await this.plugin.removeAccount(account.id);
      // 强制重新渲染
      this.containerEl.innerHTML = '';
      this.render();
      this.refreshViewSelect();
    };
    btnRow.appendChild(editBtn);
    btnRow.appendChild(testBtn);
    btnRow.appendChild(delBtn);
    card.appendChild(btnRow);
    this.containerEl.appendChild(card);
  }
}
module.exports = class CloudAttachPlugin extends Plugin {
  constructor() {
    super(...arguments);
    this.accounts = [];
  }
  async onload() {
    // 初始化语言（Obsidian 界面语言是应用级设置，不在 vault config 里）
    // 优先使用 moment.locale()，这是 Obsidian 内置的国际化方案
    const momentLocale = (window.moment || moment).locale();
    const lang = this.app.vault.config?.language || momentLocale || 'zh';
    I18n.setLang(lang);
    console.log('CloudAttach loading, language:', I18n.currentLang, 'momentLocale:', momentLocale);
    await this.loadSettings();
    this.addStyles();
    this.registerView(VIEW_TYPE_CLOUDATTACH, (leaf) => new CloudAttachView(leaf, this));
    this.addRibbonIcon('folder-open', t('cmd.open_browser'), () => this.activateView());
    this.addSettingTab(new CloudAttachSettingTab(this));
    this.addCommand({ id: 'open-browser', name: t('cmd.open_cloud_attach'), callback: () => this.activateView() });
    this.addCommand({
      id: 'reload-plugin',
      name: t('cmd.reload_plugin'),
      callback: async () => {
        try {
          await plugin.app.plugins.disablePlugin('cloud-attach');
          await plugin.app.plugins.enablePlugin('cloud-attach');
          new Notice(t('notice.plugin_reloaded'), 2000);
        } catch (e) {
          new Notice(t('notice.reload_failed', { error: e.message }), 4000);
        }
      }
    });
    // ---- 开发模式：监听 main.js 变化自动重载 ----
    if (this.app.isMobile === false) {
      try {
        const { watch } = require('fs');
        const pluginDir = this.manifestDir || this.app.vault.pluginManifests?.cloud-attach?.dir;
        if (pluginDir) {
          const mainJsPath = require('path').join(pluginDir, 'main.js');
          let reloadTimer = null;
          const watcher = watch(mainJsPath, (eventType) => {
            if (eventType === 'change') {
              // 防抖：500ms 内多次变更只触发一次
              if (reloadTimer) clearTimeout(reloadTimer);
              reloadTimer = setTimeout(async () => {
                console.log('[CloudAttach] main.js changed, auto-reloading...');
                new Notice('🔄 CloudAttach auto-reloading...', 2000);
                try {
                  await this.app.plugins.disablePlugin('cloud-attach');
                  await this.app.plugins.enablePlugin('cloud-attach');
                } catch (e) {
                  console.error('[CloudAttach] auto-reload failed:', e);
                }
              }, 500);
            }
          });
          this.register(() => watcher.close());
        }
      } catch (e) {
        // fs/watch 不可用时静默忽略
      }
    }
    // ---- Sign 检查与刷新命令 ----
    this.addCommand({
      id: 'check-sign-current-note',
      name: t('cmd.check_and_refresh_note_sign'),
      callback: () => this.checkAndRefreshCurrentNote()
    });
    this.addCommand({
      id: 'check-sign-current-url',
      name: t('cmd.check_and_refresh_url_sign'),
      callback: () => this.checkAndRefreshCurrentUrl()
    });
    // ---- 上传附件命令 ----
    this.addCommand({
      id: 'upload-current-attachment',
      name: t('cmd.upload_current_attachment'),
      callback: () => this.uploadCurrentAttachment()
    });
    this.addCommand({
      id: 'upload-all-attachments',
      name: t('cmd.upload_all_in_note'),
      callback: () => this.uploadAllAttachments()
    });
    // 编辑器右键菜单
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        menu.addItem(item => {
          item.setTitle('CloudAttach');
          item.setSubmenu(); // 不传参数，创建空 submenu
          const submenu = item.submenu;
          if (!submenu) return;
          submenu.addItem(si => {
            si.setTitle(t('menu.refresh_current_url_sign')).onClick(() => {
              this.checkAndRefreshCurrentUrl();
            });
          });
          submenu.addItem(si => {
            si.setTitle(t('menu.refresh_all_note_sign')).onClick(() => {
              this.checkAndRefreshCurrentNote();
            });
          });
          // 上传分隔线
          submenu.addSeparator();
          submenu.addItem(si => {
            si.setTitle(t('menu.upload_current_attach')).onClick(() => {
              this.uploadCurrentAttachment();
            });
          });
          submenu.addItem(si => {
            si.setTitle(t('menu.upload_all_attach')).onClick(() => {
              this.uploadAllAttachments();
            });
          });
        });
      })
    );
    // 监听活跃 leaf 变化，实时记录当前活跃的 markdown view
    this.activeMarkdownView = null;
    this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
      if (leaf?.view instanceof MarkdownView && leaf.view.editor) {
        this.activeMarkdownView = leaf.view;
      }
    }));
    // 初始化时也记录当前活跃的
    const activeLeaf = this.app.workspace.getMostRecentLeaf();
    if (activeLeaf?.view instanceof MarkdownView && activeLeaf.view.editor) {
      this.activeMarkdownView = activeLeaf.view;
    }
    // 热更新：监听 main.js 文件变化，自动重新加载插件
    const plugin = this;
    this.registerInterval(
      window.setInterval(() => {
        try {
          const modTime = plugin.app.vault.getAbstractFileByPath('.obsidian/plugins/cloud-attach/main.js')?.stat?.mtime;
          if (modTime && (!plugin._lastMainMtime || modTime > plugin._lastMainMtime)) {
            plugin._lastMainMtime = modTime;
            if (plugin._mainMtimeChecked) {
              plugin.app.plugins.disablePlugin('cloud-attach').then(() => {
                plugin.app.plugins.enablePlugin('cloud-attach');
              });
            }
            plugin._mainMtimeChecked = true;
          }
        } catch {}
      }, 3000)
    );
    console.log('CloudAttach loaded');
  }
  addStyles() {
    const css = `
      .cloud-attach-header { padding: 0 8px; }
      .cloud-attach-title { font-size: 14px; margin: 8px 0; }
      .cloud-attach-select-area { padding: 0 8px 8px; }
      .cloud-attach-select { width: 100%; padding: 6px 8px; font-size: 13px; border-radius: 4px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); }
      .cloud-attach-breadcrumb { padding: 6px 8px; font-size: 12px; border-bottom: 1px solid var(--background-modifier-border); display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
      .cloud-attach-breadcrumb-btn { background: transparent; border: none; color: var(--text-accent); cursor: pointer; padding: 3px 6px; border-radius: 3px; font-size: 12px; }
      .cloud-attach-breadcrumb-btn:hover { background: var(--background-modifier-hover); }
      .cloud-attach-breadcrumb-sep { color: var(--text-muted); }
      .cloud-attach-breadcrumb-current { color: var(--text-muted); padding: 3px 6px; font-size: 12px; }
      .cloud-attach-refresh { margin-left: auto; background: transparent; border: 1px solid var(--background-modifier-border); color: var(--text-muted); cursor: pointer; padding: 3px 8px; border-radius: 3px; font-size: 11px; }
      .cloud-attach-refresh:hover { background: var(--background-modifier-hover); }
      .cloud-attach-batch-bar { padding: 6px 8px; background: var(--background-secondary); border-bottom: 1px solid var(--background-modifier-border); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .cloud-attach-batch-count { font-size: 12px; color: var(--text-muted); }
      .cloud-attach-batch-btn { padding: 4px 10px; font-size: 12px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--interactive-accent); color: var(--text-on-accent); cursor: pointer; }
      .cloud-attach-batch-btn:hover { opacity: 0.9; }
      .cloud-attach-batch-btn.mod-secondary { background: transparent; color: var(--text-muted); }
      .cloud-attach-file-list { padding: 4px 0; }
      .cloud-attach-file { display: flex; align-items: center; padding: 5px 8px; gap: 8px; }
      .cloud-attach-file:hover { background: var(--background-modifier-hover); }
      .cloud-attach-checkbox { width: 14px; height: 14px; cursor: pointer; flex-shrink: 0; }
      .cloud-attach-checkbox-placeholder { width: 14px; flex-shrink: 0; }
      .cloud-attach-icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
      .cloud-attach-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
      .cloud-attach-loading, .cloud-attach-empty, .cloud-attach-error, .cloud-attach-hint { padding: 20px 8px; text-align: center; font-size: 13px; color: var(--text-muted); }
      .cloud-attach-error { color: var(--text-error); }
      .cloud-attach-input { width: 100%; padding: 8px; font-size: 13px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary); box-sizing: border-box; }
      .cloud-attach-btn { padding: 8px 14px; font-size: 13px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary); cursor: pointer; }
      .cloud-attach-btn:hover { background: var(--background-modifier-hover); }
      .cloud-attach-btn.mod-cta { background: var(--interactive-accent); color: var(--text-on-accent); border-color: var(--interactive-accent); }
      .cloud-attach-card { padding: 12px; margin: 8px 0; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-secondary); }
      .cloud-attach-card-btns { display: flex; gap: 8px; margin-top: 12px; }
      .cloud-attach-add-btn { width: 100%; padding: 10px; font-size: 14px; border: 1px dashed var(--background-modifier-border); border-radius: 4px; background: transparent; color: var(--text-accent); cursor: pointer; margin-top: 8px; }
      .cloud-attach-add-btn:hover { background: var(--background-modifier-hover); }
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    this.register(() => styleEl.remove());
  }
  async activateView() {
    const { workspace } = this.app;
    console.log('[CloudAttach] activateView called');
    // 检查视图是否已打开，如果已打开则聚焦
    const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_CLOUDATTACH);
    console.log('[CloudAttach] existing leaves:', existingLeaves.length);
    if (existingLeaves.length > 0) {
      console.log('[CloudAttach] revealing existing leaf');
      workspace.revealLeaf(existingLeaves[0]);
      return;
    }
    // 没有打开的视图，创建新的
    console.log('[CloudAttach] creating new leaf');
    let leaf = workspace.getRightLeaf(false);
    if (!leaf) {
      console.log('[CloudAttach] no right leaf, using default');
      leaf = workspace.getLeaf('split', 'vertical');
    }
    await leaf.setViewState({ type: VIEW_TYPE_CLOUDATTACH, active: true });
    workspace.revealLeaf(leaf);
    console.log('[CloudAttach] new leaf created');
  }
  onunload() { console.log('CloudAttach unloading...'); }
  // ============================================================
  // Sign 检查与刷新
  // ============================================================
  /**
   * 从文本内容中提取所有 URL（Markdown 图片、链接、iframe src）
   * @param {string} text - 笔记文本
   * @returns {string[]} URL 列表
   */
  extractUrls(text) {
    const urls = [];
    // Markdown 图片: ![alt](url)
    const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
    // Markdown 链接: [text](url)
    const linkRe = /(?<![!])\[([^\]]*)\]\(([^)]+)\)/g;
    // iframe src: <iframe src="url">
    const iframeRe = /<iframe[^>]+src=["']([^"']+)["']/gi;
    // 直接裸 URL（宽松匹配，支持 query string 中的 = 和 &）
    const bareRe = /(?:^|\s)(https?:\/\/[^\s<>"\)\]&?=]+)/gm;
    let m;
    while ((m = imgRe.exec(text)) !== null) urls.push(m[2]);
    while ((m = linkRe.exec(text)) !== null) urls.push(m[2]);
    while ((m = iframeRe.exec(text)) !== null) urls.push(m[1]);
    while ((m = bareRe.exec(text)) !== null) {
      const url = m[1].replace(/[),\]]+$/, ''); // 去掉末尾的标点
      if (url) urls.push(url);
    }
    // 去重
    return [...new Set(urls)];
  }
  /**
   * 根据 URL 找到匹配的服务器账户
   * @param {string} url - 待检查的 URL
   * @returns {{account: Object, client: OpenListClient}|null}
   */
  matchAccount(url) {
    try {
      const urlObj = new URL(url);
      const host = urlObj.host; // 包含端口，如 "curryhendry.mycloudnas.com:5555"
      for (const account of this.accounts) {
        if (account.type === 's3') continue; // S3 暂不处理
        const accountUrl = account.url?.replace(/\/$/, '') || '';
        const accountHost = new URL(accountUrl).host;
        if (host === accountHost) {
          return { account, client: this.createClient(account.id) };
        }
      }
    } catch {}
    return null;
  }
  /**
   * 检查并刷新当前笔记中所有 sign URL
   */
  async checkAndRefreshCurrentNote() {
    const view = this.activeMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.editor) {
      new Notice(t('notice.open_note_first'), 3000);
      return;
    }
    const text = view.editor.getValue();
    const urls = this.extractUrls(text);
    if (urls.length === 0) {
      new Notice(t('notice.no_urls_in_note'), 3000);
      return;
    }
    new Notice(t('notice.check_start', {count: urls.length}), 3000);
    const results = { valid: 0, refreshed: 0, refreshedPaths: [], failed: 0, failedUrls: [], skipped: 0 };
    for (const url of urls) {
      console.log('[CloudAttach] 检查 URL:', url);
      const match = this.matchAccount(url);
      if (!match) {
        // No matching account, skip
        results.skipped++;
        continue;
      }
      const { account, client } = match;
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      // 判断是否为 OpenList URL（有 /p/ 或 /d/ 前缀）
      const isOpenListUrl = path.startsWith('/p/') || path.startsWith('/d/');
      if (!isOpenListUrl) {
        // 非 OpenList URL，跳过（iframe 等）
        results.skipped++;
        continue;
      }
      if (url.includes('sign=')) {
        // 有 sign 参数：验证有效性
        console.log('[CloudAttach] 验证 sign URL...');
        const verify = await client.verifySignUrl(url);
        console.log('[CloudAttach] 验证结果:', verify);
        if (verify.ok) {
          results.valid++;
        } else if (verify.reason === 'sign_expired') {
          // sign 过期，尝试重建
          const realPath = client.extractRealPath(url);
          console.log('[CloudAttach] 提取真实路径:', realPath, 'token:', account.token ? '有' : '无');
          if (!realPath || !account.token) {
            results.failed++;
            results.failedUrls.push({ url, reason: t('error.cannot_extract_path') });
            continue;
          }
          try {
            const newUrl = await client.getSignedUrl(realPath);
            if (newUrl && newUrl !== url) {
              // 使用 findAndReplaceUrl 按路径匹配替换整个 URL
              const newText = client.findAndReplaceUrl(view.editor.getValue(), realPath, newUrl);
              if (newText !== view.editor.getValue()) {
                view.editor.setValue(newText);
                results.refreshed++;
                results.refreshedPaths.push(realPath);
              } else {
                results.valid++;
              }
            } else {
              results.valid++;
            }
          } catch (e) {
            results.failed++;
            results.failedUrls.push({ url, reason: t('error.rebuild_failed', {error: e.message}) });
          }
        } else {
          results.failed++;
          results.failedUrls.push({ url, reason: verify.reason });
        }
      } else {
        // 无 sign 参数：检查文件是否存在
        const verify = await client.verifySignUrl(url);
        if (verify.ok) {
          // 文件存在，跳过
          results.skipped++;
        } else if (verify.reason === 'sign_expired' && account.token) {
          // 需要 sign 但没有，补 sign
          const realPath = client.extractRealPath(url);
          if (realPath) {
            try {
              const newUrl = await client.getSignedUrl(realPath);
              if (newUrl && newUrl !== url) {
                // 使用 findAndReplaceUrl 按路径匹配替换整个 URL
                const newText = client.findAndReplaceUrl(view.editor.getValue(), realPath, newUrl);
                if (newText !== view.editor.getValue()) {
                  view.editor.setValue(newText);
                  results.refreshed++;
                  results.refreshedPaths.push(realPath);
                }
              }
            } catch (e) {
              results.failed++;
              results.failedUrls.push({ url, reason: t('error.sign_rebuild_failed', {error: e.message}) });
            }
          }  // if (realPath)
        } else {
          results.failed++;
          results.failedUrls.push({ url, reason: verify.reason });
        }
      }
    }
    // 汇总提示
    const parts = [];
    if (results.valid > 0) parts.push(t('notice.url_parts_valid', {count: results.valid}));
    if (results.refreshed > 0) parts.push(t('notice.urls_refreshed', {count: results.refreshed}));
    if (results.failed > 0) parts.push(t('notice.urls_failed', {count: results.failed}));
    if (results.skipped > 0) parts.push(t('notice.urls_skipped', {count: results.skipped}));
    if (results.refreshed > 0) {
      new Notice(t('notice.check_complete', {parts: parts.join(', ')}), 6000);
    } else {
      new Notice(t('notice.check_complete_partial', {parts: parts.join(', ')}), 4000);
    }
    if (results.failedUrls.length > 0) {
      // Sign check complete
    }
  }
  /**
   * 检查并刷新当前光标所在行/选中的 URL
   */
  async checkAndRefreshCurrentUrl() {
    const view = this.activeMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
    console.log('[CloudAttach] checkAndRefreshCurrentUrl view:', !!view, 'editor:', !!view?.editor);
    if (!view?.editor) {
      new Notice(t('notice.open_note_first'), 3000);
      return;
    }
    const cursor = view.editor.getCursor();
    const fullText = view.editor.getValue();
    const selection = view.editor.getSelection();
    // 策略1: 如果有选中文本，从选中文本中提取 URL
    // 策略2: 从光标位置前后扩展，找到最近的 URL
    let url = null;
    let urlType = '';
    if (selection) {
      // 从选中文本中提取
      const imgMatch = selection.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      const linkMatch = selection.match(/(?<![!])\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) { url = imgMatch[2]; urlType = 'image'; }
      else if (linkMatch) { url = linkMatch[2]; urlType = 'link'; }
      else {
        const bareMatch = selection.match(/https?:\/\/[^\s<>"\)\]&]+/);
        if (bareMatch) { url = bareMatch[0]; urlType = 'bare'; }
      }
    }
    if (!url) {
      // 从全文中找光标附近的 URL
      // 将光标位置转换为字符偏移
      let offset = 0;
      for (let i = 0; i < cursor.line; i++) {
        offset += view.editor.getLine(i).length + 1; // +1 for newline
      }
      offset += cursor.ch;
      // 在全文中查找所有 URL（Markdown 图片语法和裸 URL）
      const urlPattern = /(!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]*)\]\(([^)]+)\)|https?:\/\/[^\s<>"\)\]]+)/g;
      let match;
      let nearestUrl = null;
      let nearestDist = Infinity;
      while ((match = urlPattern.exec(fullText)) !== null) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;
        // 计算光标到这个 URL 的距离
        const dist = Math.min(Math.abs(offset - matchStart), Math.abs(offset - matchEnd));
        if (dist < nearestDist) {
          nearestDist = dist;
          // 提取 URL
          if (match[3]) {
            // 图片语法 ![alt](url)
            nearestUrl = match[3];
            urlType = 'image';
          } else if (match[5]) {
            // 链接语法 [text](url)
            nearestUrl = match[5];
            urlType = 'link';
          } else {
            // 裸 URL
            nearestUrl = match[0];
            urlType = 'bare';
          }
        }
      }
      // 如果光标附近 500 字符内有 URL，使用它
      if (nearestDist < 500) {
        url = nearestUrl;
      }
    }
    if (!url) {
      new Notice(t('notice.no_url_near_cursor'), 3000);
      // No URL found near cursor
      return;
    }
    console.log('[CloudAttach] 找到 URL:', url.substring(0, 80), 'type:', urlType);
    new Notice(t('notice.check_url', {url: url.substring(0, 50)}), 3000);
    const match = this.matchAccount(url);
    if (!match) {
      new Notice(t('notice.not_my_url_skip'), 4000);
      return;
    }
    const { account, client } = match;
    const path = new URL(url).pathname;
    if (!path.startsWith('/p/') && !path.startsWith('/d/')) {
      new Notice(t('notice.no_openlist_url'), 3000);
      return;
    }
    // 验证 URL
    const verify = await client.verifySignUrl(url);
    if (verify.ok) {
      new Notice(t('notice.sign_ok'), 3000);
      return;
    }
    if (verify.reason === 'sign_expired') {
      const realPath = client.extractRealPath(url);
      if (!realPath || !account.token) {
        new Notice(t('notice.cannot_refresh'), 4000);
        return;
      }
      try {
        const newUrl = await client.getSignedUrl(realPath);
        if (newUrl) {
          const fullText = view.editor.getValue();
          const newText = fullText.replace(url, newUrl);
          view.editor.setValue(newText);
          new Notice(t('notice.sign_refreshed'), 3000);
        }
      } catch (e) {
        new Notice(t('notice.refresh_failed', {error: e.message}), 4000);
      }
    } else {
      const reasonMap = {
        file_not_found: t('error.file_not_found'),
        network_error: t('error.network_error'),
        http_error: `HTTP ${verify.status}`
      };
      new Notice(t('notice.url_invalid', {reason: reasonMap[verify.reason] || verify.reason}), 5000);
    }
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = { accounts: [], ...data };
    this.accounts = this.settings.accounts || [];
  }
  async saveSettings() {
    this.settings.accounts = this.accounts;
    await this.saveData(this.settings);
  }
  getAccount(id) { return this.accounts.find(a => a.id === id) || null; }
  async addAccount(account) {
    account.id = `ca_${Date.now()}`;
    this.accounts.push(account);
    await this.saveSettings();
  }
  async removeAccount(id) {
    this.accounts = this.accounts.filter(a => a.id !== id);
    await this.saveSettings();
  }
  async updateAccount(id, updates) {
    const idx = this.accounts.findIndex(a => a.id === id);
    if (idx >= 0) {
      this.accounts[idx] = { ...this.accounts[idx], ...updates };
      await this.saveSettings();
    }
  }
  createClient(accountId) {
    const account = this.getAccount(accountId);
    if (!account) return null;
    if (account.type === 's3') return new S3Client(account, this.app);
    // 默认走 openlist / WebDAV
    return new OpenListClient(account, this.app);
  }
  /**
   * 检查是否可以上传（需要至少一个账户且当前打开了视图并选中了目录）
   * @returns {{ok: boolean, client: object, remotePath: string, account: object}|null}
   */
  getUploadContext() {
    // 获取当前打开的 CloudAttachView
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CLOUDATTACH);
    if (!leaves || leaves.length === 0) {
      return { ok: false, error: t('error.no_view_or_folder') };
    }
    const view = leaves[0].view;
    if (!view.client) {
      return { ok: false, error: t('error.no_account') };
    }
    if (!view.accountId) {
      return { ok: false, error: t('error.no_account') };
    }
    if (!view.currentPath || view.currentPath === '/') {
      return { ok: false, error: t('settings.folder_required') };
    }
    return {
      ok: true,
      client: view.client,
      remotePath: view.currentPath,
      account: this.getAccount(view.accountId)
    };
  }
  /**
   * 上传当前光标/选中的附件
   */
  async uploadCurrentAttachment() {
    const view = this.activeMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.editor) {
      new Notice(t('notice.open_note_first'), 3000);
      return;
    }
    // 获取光标位置的附件路径
    const cursor = view.editor.getCursor();
    const fullText = view.editor.getValue();
    // 提取光标附近的图片或附件
    let localPath = null;
    let markdownSyntax = '';
    // 策略1: 从选中文本中提取
    const selection = view.editor.getSelection();
    if (selection) {
      const imgMatch = selection.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        localPath = imgMatch[2];
        markdownSyntax = selection;
      }
    }
    // 策略2: 从光标所在行提取第一个附件
    if (!localPath) {
      const line = view.editor.getLine(cursor.line);
      // 匹配 ![alt](path) 格式
      const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        localPath = imgMatch[2];
        markdownSyntax = imgMatch[0];
      } else {
        // 尝试匹配任何本地附件（![] 格式，排除 http/https）
        const attachMatch = line.match(/!\[([^\]]*)\]\((?!http)([^)#\s?]+)/);
        if (attachMatch) {
          localPath = attachMatch[2];
          markdownSyntax = attachMatch[0];
        } else {
          // 尝试匹配 wiki-link 格式 ![[path]]
          const wikiMatch = line.match(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
          if (wikiMatch) {
            localPath = wikiMatch[1];
            markdownSyntax = wikiMatch[0];
          }
        }
      }
    }
    // 检查是否为本地文件（不是 URL）
    if (!localPath || localPath.startsWith('http://') || localPath.startsWith('https://')) {
      new Notice(t('notice.no_attachment'), 3000);
      return;
    }
    // 解析附件路径
    // wiki-link 可能包含相对路径（如 ../xxx/yyy.pdf）或绝对路径（如 家庭/xxx.pdf）
    // 用 metadataCache.getFirstLinkpathDest 做正确解析，fallback 到手动拼接
    let absolutePath;
    const notePath = view.file?.path || '';
    const noteDir = notePath.substring(0, notePath.lastIndexOf('/') + 1);
    // 先用 metadataCache 解析（支持相对路径、绝对路径、../ 导航）
    const cacheResolved = this.app.metadataCache.getFirstLinkpathDest(localPath, notePath);
    if (cacheResolved && cacheResolved.path) {
      absolutePath = cacheResolved.path;
    } else {
      // fallback：手动拼接（相对路径基于 noteDir，绝对路径直接用）
      if (localPath.startsWith('/')) {
        absolutePath = localPath.substring(1); // 去掉开头的 /
      } else {
        absolutePath = noteDir + localPath;
      }
    }
    // Upload current attachment
    // 检查上传条件
    const ctx = this.getUploadContext();
    if (!ctx.ok) {
      new Notice(`⚠️ ${ctx.error}`, 4000);
      return;
    }
    // 确认上传
    const confirmed = await this.showUploadConfirmModal([{ localPath: absolutePath, syntax: markdownSyntax }], ctx.remotePath);
    if (!confirmed) return;
    // 执行上传
    await this.doUpload([{ localPath: absolutePath, syntax: markdownSyntax }], ctx);
  }
  /**
   * 上传当前笔记中的所有附件
   */
  async uploadAllAttachments() {
    const view = this.activeMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.editor) {
      new Notice(t('notice.open_note_first'), 3000);
      return;
    }
    // 提取笔记中所有本地附件
    const text = view.editor.getValue();
    const notePath = view.file?.path || '';
    const noteDir = notePath.substring(0, notePath.lastIndexOf('/') + 1);
    // 匹配所有本地附件（![] 格式，排除 http/https）
    const attachmentRegex = /!\[([^\]]*)\]\((?!http)([^)#\s?]+)/g;
    const attachments = [];
    let match;
    while ((match = attachmentRegex.exec(text)) !== null) {
      const localPath = match[2];
      // 转换为绝对路径
      let absolutePath = localPath;
      if (!absolutePath.startsWith('/')) {
        absolutePath = noteDir + localPath;
      }
      // 检查是否已存在
      if (!attachments.find(a => a.localPath === absolutePath)) {
        attachments.push({
          localPath: absolutePath,
          syntax: match[0]
        });
      }
    }
    // 匹配 wiki-link 格式 ![[path]]
    const wikiRegex = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
    while ((match = wikiRegex.exec(text)) !== null) {
      const localPath = match[1];
      // 转换为绝对路径
      let absolutePath = localPath;
      if (!absolutePath.startsWith('/')) {
        absolutePath = noteDir + localPath;
      }
      // 检查是否已存在
      if (!attachments.find(a => a.localPath === absolutePath)) {
        attachments.push({
          localPath: absolutePath,
          syntax: match[0]
        });
      }
    }
    if (attachments.length === 0) {
      new Notice(t('notice.no_attachment_found'), 3000);
      return;
    }
    // 检查上传条件
    const ctx = this.getUploadContext();
    if (!ctx.ok) {
      new Notice(`⚠️ ${ctx.error}`, 4000);
      return;
    }
    // 确认上传
    const confirmed = await this.showUploadConfirmModal(attachments, ctx.remotePath);
    if (!confirmed) return;
    // 执行上传
    await this.doUpload(attachments, ctx);
  }
  /**
   * 显示上传确认对话框
   * @param {Array} attachments - 要上传的附件列表
   * @param {string} remotePath - 远程目录
   * @returns {Promise<boolean>} 用户是否确认
   */
  showUploadConfirmModal(attachments, remotePath) {
    return new Promise((resolve) => {
      const modal = new (require('obsidian').Modal)(this.app);
      modal.titleEl.textContent = t('view.upload_confirm_title');
      const content = modal.contentEl;
      content.style.padding = '16px';
      // 文件列表
      const listEl = document.createElement('div');
      listEl.style.maxHeight = '200px';
      listEl.style.overflow = 'auto';
      listEl.style.marginBottom = '16px';
      listEl.style.border = '1px solid var(--background-modifier-border)';
      listEl.style.borderRadius = '4px';
      listEl.style.padding = '8px';
      attachments.forEach(att => {
        const fileName = att.localPath.split('/').pop();
        const item = document.createElement('div');
        item.style.padding = '4px 0';
        item.style.fontSize = '13px';
        item.textContent = `📎 ${fileName}`;
        listEl.appendChild(item);
      });
      content.appendChild(listEl);
      // 目标目录提示
      const targetEl = document.createElement('div');
      targetEl.style.marginBottom = '16px';
      targetEl.style.fontSize = '13px';
      targetEl.style.color = 'var(--text-muted)';
      targetEl.innerHTML = t('view.upload_to', {path: this.escapeHtml(remotePath)});
      content.appendChild(targetEl);
      // 按钮行
      const btnRow = document.createElement('div');
      btnRow.style.display = 'flex';
      btnRow.style.gap = '8px';
      btnRow.style.justifyContent = 'flex-end';
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = t('view.cancel');
      cancelBtn.className = 'mod-cta';
      cancelBtn.style.padding = '8px 16px';
      cancelBtn.onclick = () => { modal.close(); resolve(false); };
      const uploadBtn = document.createElement('button');
      uploadBtn.textContent = t('view.upload_btn', {count: attachments.length});
      uploadBtn.className = 'mod-cta';
      uploadBtn.style.background = 'var(--interactive-accent)';
      uploadBtn.style.color = 'var(--text-on-accent)';
      uploadBtn.style.padding = '8px 16px';
      uploadBtn.onclick = () => { modal.close(); resolve(true); };
      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(uploadBtn);
      content.appendChild(btnRow);
      modal.open();
    });
  }
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  /**
   * 执行上传
   * @param {Array} attachments - 要上传的附件列表
   * @param {Object} ctx - 上下文 {client, remotePath, account}
   */
  async doUpload(attachments, ctx) {
    const { client, remotePath } = ctx;
    const view = this.activeMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
    new Notice(t('notice.upload_start', {count: attachments.length}), 3000);
    const results = { success: 0, failed: 0, skipped: 0 };
    const replacements = [];
    for (const att of attachments) {
      console.log('[CloudAttach] 上传:', att.localPath);
      // 检查本地文件是否存在（先用精确路径，再尝试模糊匹配）
      let file = this.app.vault.getAbstractFileByPath(att.localPath);
      // 注意：localPath 已在 uploadCurrentAttachment / uploadAllAttachments 中解析为绝对路径
      // 如果仍找不到文件（可能文件被删除或路径错误），直接跳过
      if (!file) {
        console.log('[CloudAttach] 本地文件不存在:', att.localPath);
        results.skipped++;
        continue;
      }
      // 上传文件
      const result = await client.uploadFile(att.localPath, remotePath);
      if (result.ok) {
        results.success++;
        replacements.push({
          oldSyntax: att.syntax,
          newUrl: result.url,
          localPath: att.localPath,
          remotePath: result.remotePath
        });
      } else {
        results.failed++;
        // Upload failed
      }
    }
    // 更新笔记内容
    if (replacements.length > 0 && view?.editor) {
      let text = view.editor.getValue();
      // 文件类型分类（与插入逻辑一致）
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
      const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'];
      const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
      const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
      for (const rep of replacements) {
        const ext = rep.localPath.split('.').pop().toLowerCase();
        const fileName = rep.localPath.split('/').pop();
        const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
        // 根据文件类型选择 URL（文档类型用不带签名的原始 URL）
        let url;
        if (docExts.includes(ext)) {
          // 文档类型（iframe 预览）：用 getRawUrl（OpenList）或 getFileUrl（S3），不带签名
          url = client.getRawUrl
            ? client.getRawUrl(rep.remotePath)
            : client.getFileUrl(rep.remotePath);
        } else {
          // 图片/链接：使用上传返回的签名 URL
          url = rep.newUrl;
        }
        let newSyntax;
        if (rep.oldSyntax.startsWith('![[')) {
          // wiki-link 格式: ![[path]] 或 ![[path|alias]]
          const aliasMatch = rep.oldSyntax.match(/!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/);
          const alias = aliasMatch?.[2] || nameWithoutExt;
          if (imageExts.includes(ext)) {
            newSyntax = `![${alias}](${url})`;
          } else if (videoExts.includes(ext)) {
            newSyntax = `<video controls width="600" height="400">\n <source src="${url}" type="video/mp4">\n</video>`;
          } else if (audioExts.includes(ext)) {
            newSyntax = `<audio controls>\n <source src="${url}" type="audio/mpeg">\n</audio>`;
          } else if (docExts.includes(ext)) {
            newSyntax = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
          } else {
            newSyntax = `[${alias}](${url})`;
          }
        } else if (rep.oldSyntax.startsWith('![')) {
          // 标准 markdown 图片格式: ![alt](path)
          const altMatch = rep.oldSyntax.match(/!\[([^\]]*)\]\(/);
          const alt = altMatch?.[1] || nameWithoutExt;
          if (imageExts.includes(ext)) {
            newSyntax = `![${alt}](${url})`;
          } else if (videoExts.includes(ext)) {
            newSyntax = `<video controls width="600" height="400">\n <source src="${url}" type="video/mp4">\n</video>`;
          } else if (audioExts.includes(ext)) {
            newSyntax = `<audio controls>\n <source src="${url}" type="audio/mpeg">\n</audio>`;
          } else if (docExts.includes(ext)) {
            newSyntax = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
          } else {
            newSyntax = `[${alt}](${url})`;
          }
        } else {
          // 其他格式，保持原样替换 URL
          newSyntax = rep.oldSyntax.replace(/file:\S+/, url);
        }
        text = text.replace(rep.oldSyntax, newSyntax);
        // 删除本地文件
        try {
          await this.app.vault.delete(this.app.vault.getAbstractFileByPath(rep.localPath));
          console.log('[CloudAttach] 已删除本地文件:', rep.localPath);
        } catch (e) {
          console.log('[CloudAttach] 删除本地文件失败:', e.message);
        }
      }
      view.editor.setValue(text);
    }
    // 显示结果
    const parts = [];
    if (results.success > 0) parts.push(t('notice.upload_success_count', {count: results.success}));
    if (results.failed > 0) parts.push(t('notice.upload_failed_count', {count: results.failed}));
    if (results.skipped > 0) parts.push(t('notice.upload_skipped_count', {count: results.skipped}));
    new Notice(t('notice.upload_complete', {parts: parts.join(', ')}), 5000);
  }
};
