/**
 * CloudAttach Plugin v0.3.001
 * 云附件管理 - 连接 OpenList/WebDAV
 */

'use strict';

const { Plugin, Notice, Menu, Modal, PluginSettingTab, MarkdownView, ItemView, EditorSuggest } = require('obsidian');
// heic2any 动态加载，遇 HEIC 图时才 require('./heic2any.bundle.js')

const VIEW_TYPE_CLOUDATTACH = 'cloud-attach-view';
const VIEW_TYPE_PDF_FULLSCREEN = 'cloud-attach-pdf-fullscreen';

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
  'notice.sign_rebuild_failed': '⚠️ 签名失败：{error}',
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
  'notice.delete_webdav_forbidden': '⚠️ 此服务器不支持通过 WebDAV 删除（可删除文件，文件夹需到网页端操作）',
  'notice.delete_s3_forbidden': '⚠️ 删除失败（账号无删除权限或存储桶策略禁止）',
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
  'settings.saved': '✅ 设置已保存',
  'settings.test': '测试',
  'settings.edit': '编辑',
  'settings.edit_account': '编辑账户',
  'settings.delete': '删除',
  'settings.move_up': '上移',
  'settings.move_down': '下移',
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
  'settings.advanced': '高级',
  'settings.set_as_default': '★ 设为默认',
  'settings.unset_default': '☆ 取消默认',
  'settings.is_default': '默认',
  'settings.default_account': '默认账号',
  'view.upload_to_current_path': '上传到当前 CloudAttach 路径',
  'view.upload_to_default_account': '上传到默认账号',
  'view.no_default_account_hint': '请先在设置中设定默认账号',
  'settings.advanced_title': '高级设置',
  'settings.preview_category': '文件预览',
  'settings.pdf_preview': 'PDF 预览方式',
  'settings.pdf_preview_iframe': 'iframe（默认）',
  'settings.pdf_preview_pdfjs': 'PDF.js',
  'settings.pdfjs_auto_install': '（保存后自动安装 约1.6MB）',
  'settings.pdfjs_installed': '（已安装）',
  'settings.pdfjs_installing': '正在安装 PDF.js...',
  'settings.pdfjs_downloaded': 'PDF.js（已安装）',
  'settings.pdfjs_uninstall': '卸载',
  'settings.heic_preview': 'HEIC 预览方式',
  'settings.heic_supported': '（已支持）',
  'settings.s3': '对象存储 (S3)',
  'settings.s3_desc': '支持 S3 协议的对象存储',
  'settings.account_name_placeholder': '例如：我的COS桶',
  'settings.folder_required': '⚠️ 请选择上传到的文件夹，不能是根目录',
  'settings.auto_upload': '自动上传',
  'settings.auto_upload_desc': '开启后自动上传附件到默认服务',
  'settings.auto_upload_confirm_title': '确认启用自动上传',
  'settings.auto_upload_confirm_msg': '开启后自动上传附件到默认服务：',
  'settings.auto_upload_need_default': '请先在设置中指定默认账号',
  'settings.auto_upload_confirm_again': '请再次确认！',

  // 视图界面
  'view.select_account': '选择账户',
  'view.no_account': '请先在设置中添加账户',
  'view.connect_failed': '❌ 连接失败: {error}',
  'view.error': '❌ 错误: {error}',
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
  'view.new_folder_btn': '📁+',
  'view.new_folder_title': '📁 新建文件夹',
  'view.new_folder_placeholder': '请输入文件夹名称',
  'view.new_folder_confirm': '创建',
  'view.new_folder_creating': '⏳ 正在创建文件夹...',
  'view.new_folder_success': '✅ 文件夹已创建: {name}',
  'view.new_folder_failed': '❌ 创建失败: {error}',
  'view.new_folder_name_empty': '⚠️ 文件夹名称不能为空',
  'view.fullscreen_loading': '⏳ 加载 PDF...',
  'view.fullscreen_load_fail': '❌ 加载 PDF 失败',
  'view.fullscreen_fit_width': '适应宽度',
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
  'menu.upload_to_cloud': '上传到云端',
  'notice.file_not_linked': '未找到引用此文件的笔记',
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
  'error.no_default_account_set': '未设置默认账号，请在设置中选择一个默认账号',
  'error.no_account': '请先选择一个账户',
  'view.loading': '⏳ 加载中...',
  'view.no_account_hint': '请先在设置中添加账户',
  'view.select_account_hint': '选择账户后开始浏览',
  'view.no_account_selected': '❌ 未选择账户',
  'view.empty_dir': '📂 空目录',
  'view.plugin_title': '云附件',
  'view.breadcrumb_sep': ' › ',
  'settings.webdav_path_label': 'WebDAV 路径',
  'settings.openlist_webdav_label': 'OpenList / WebDAV',
  'settings.webdav_label': 'WebDAV',
  'settings.webdav_path_placeholder': '',
  'settings.server_address_placeholder': 'http://192.168.62.200:5244',
  'settings.endpoint_placeholder': 'https://xxx.r2.cloudflarestorage.com',
  'settings.bucket_placeholder': 'my-vault-attach',
  'settings.region_placeholder': 'auto（Cloudflare R2 可留空）',
  'settings.cdn_url_placeholder': 'https://cdn.example.com（选填，用于拼公共访问URL）',
  'view.upload_to': '上传到：<code style="background:var(--background-secondary);padding:2px 6px;border-radius:3px;">{path}</code>',
  'error.rebuild_failed': '重建失败: {error}',
  'error.sign_rebuild_failed': '补 sign 失败: {error}',
  'error.cannot_extract_path': '无法提取路径或缺少 Token',
  'settings.check_account_settings': '请检查账户设置',
});

Object.assign(I18n.translations.en, {
  'notice.sign_expired_403': '⚠️ Sign expired, please refresh',
  'notice.sign_invalid': '❌ Sign invalid',
  'notice.sign_rebuild_failed': '⚠️ Sign rebuild failed: {error}',
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
  'notice.delete_webdav_forbidden': '⚠️ This server forbids WebDAV deletion (files ok, folders require web UI)',
  'notice.delete_s3_forbidden': '⚠️ Delete failed (no delete permission or bucket policy denied)',
  'notice.rename_conflict': '❌ Rename failed: filename already exists',
  'notice.rename_failed': '❌ Rename failed: {error}',
  'notice.rename_success': '✅ Renamed successfully',
  'notice.reload_failed': '❌ Reload failed: {error}',
  'notice.connect_success': '✅ Connection successful',
  'notice.connect_failed': '❌ Connection failed',

  // Error messages
  'error.rebuild_failed': 'Rebuild failed: {error}',
  'error.sign_rebuild_failed': 'Sign rebuild failed: {error}',
  'error.cannot_extract_path': 'Cannot extract path or no Token',

  // Settings
  'settings.check_account_settings': 'Please check account settings',

  // View
  'view.upload_to': 'Upload to: <code style="background:var(--background-secondary);padding:2px 6px;border-radius:3px;">{path}</code>',

  'settings.title': 'CloudAttach Settings',
  'settings.account_name': 'Account Name',
  'settings.add_account': 'Add Account',
  'settings.save': 'Save',
  'settings.saved': '✅ Settings saved',
  'settings.test': 'Test',
  'settings.edit': 'Edit',
  'settings.edit_account': 'Edit Account',
  'settings.delete': 'Delete',
  'settings.move_up': 'Move Up',
  'settings.move_down': 'Move Down',
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
  'settings.advanced': 'Advanced',
  'settings.advanced_title': 'Advanced Settings',
  'settings.preview_category': 'File Preview',
  'settings.pdf_preview': 'PDF Preview Method',
  'settings.pdf_preview_iframe': 'iframe (default)',
  'settings.pdf_preview_pdfjs': 'PDF.js',
  'settings.pdfjs_auto_install': '(auto-install on save ~1.6MB)',
  'settings.pdfjs_installed': '(installed)',
  'settings.pdfjs_installing': 'Installing PDF.js...',
  'settings.pdfjs_downloaded': 'PDF.js (installed)',
  'settings.pdfjs_uninstall': 'Uninstall',
  'settings.heic_preview': 'HEIC Preview Method',
  'settings.heic_supported': '(supported)',
  'settings.s3': 'Object Storage (S3)',
  'settings.s3_desc': 'S3-compatible object storage',
  'settings.account_name_placeholder': 'e.g.: My COS Bucket',
  'settings.folder_required': '⚠️ Please select a folder to upload to, cannot be root',
  'settings.set_as_default': '★ Set as Default',
  'settings.unset_default': '☆ Unset Default',
  'settings.is_default': 'Default',
  'settings.default_account': 'Default Account',
  'settings.auto_upload': 'Auto Upload',
  'settings.auto_upload_desc': 'Auto upload attachments to default service',
  'settings.auto_upload_confirm_title': 'Enable Auto Upload',
  'settings.auto_upload_confirm_msg': 'Auto upload attachments to default service when enabled:',
  'settings.auto_upload_need_default': 'Please set a default account in Settings first',
  'settings.auto_upload_confirm_again': 'Please confirm again!',

  'view.select_account': 'Select Account',
  'view.no_account': 'Please add an account in Settings first',
  'view.upload_to_current_path': 'Upload to current CloudAttach path',
  'view.upload_to_default_account': 'Upload to default account',
  'view.no_default_account_hint': 'Please set a default account in Settings first',
  'view.connect_failed': '❌ Connection failed: {error}',
  'view.error': '❌ Error: {error}',
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
  'view.new_folder_btn': '📁+',
  'view.new_folder_title': '📁 New Folder',
  'view.new_folder_placeholder': 'Enter folder name',
  'view.new_folder_confirm': 'Create',
  'view.new_folder_creating': '⏳ Creating folder...',
  'view.new_folder_success': '✅ Folder created: {name}',
  'view.new_folder_failed': '❌ Failed: {error}',
  'view.new_folder_name_empty': '⚠️ Folder name cannot be empty',
  'view.fullscreen_loading': '⏳ Loading PDF...',
  'view.fullscreen_load_fail': '❌ Failed to load PDF',
  'view.fullscreen_fit_width': 'Fit Width',
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
  'menu.upload_to_cloud': 'Upload to Cloud',
  'notice.file_not_linked': 'No note found referencing this file',
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
  'error.no_default_account_set': 'No default account set. Please set one in settings.',
  'error.no_account': 'Please select an account first',
  'view.loading': '⏳ Loading...',
  'view.no_account_hint': 'Please add an account in Settings first',
  'view.select_account_hint': 'Select an account to start browsing',
  'view.no_account_selected': '❌ No account selected',
  'view.empty_dir': '📂 Empty directory',
  'view.plugin_title': 'CloudAttach',
  'view.breadcrumb_sep': ' › ',
  'settings.webdav_path_label': 'WebDAV Path',
  'settings.openlist_webdav_label': 'OpenList / WebDAV',
  'settings.webdav_label': 'WebDAV',
  'settings.webdav_path_placeholder': '',
  'settings.server_address_placeholder': 'http://192.168.62.200:5244',
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
    this.webdavPath = (account.webdavPath || '').replace(/\/$/, '');
    this.token = account.token || '';
    this.username = account.username;
    this.password = account.password;
    this.publicUrl = account.publicUrl?.replace(/\/$/, '') || '';
    this.app = app;
  }

  /**
   * 对 URL 路径部分做安全解码：把 %XX 编码的中文还原为原文，但保留空格等必须编码的字符。
   * 用于服务器返回的全编码 URL → 插入笔记时保留中文原文。
   * @param {string} url - 完整 URL（可能含 query string）
   * @returns {string} 解码后的 URL
   */
  safeDecodeUrl(url) {
    try {
      const qIdx = url.indexOf('?');
      const path = qIdx >= 0 ? url.substring(0, qIdx) : url;
      const query = qIdx >= 0 ? url.substring(qIdx) : '';
      // 先完整解码（处理多层编码），再用 safePath 规则重新编码
      let decoded = path;
      for (let i = 0; i < 5; i++) {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      }
      // 重新编码：中文保留原文，空格及特殊字符才编码
      const safePath = decoded.replace(/[\s#?&<>"'\\|{}]/g, c => encodeURIComponent(c));
      return safePath + query;
    } catch (e) {
      return url; // 解码失败则原样返回
    }
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
          console.log('[CloudAttach] login success, token:', this.token.substring(0, 20) + '...');
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
        // Obsidian requestUrl 对非 2xx 响应会抛异常，尝试从异常中解析 status 和 text
        // 常见错误格式: "Request failed, status 401" 或 { status: 401, ... }
        let status = 0;
        let text = '';
        const errStr = e.message || String(e);
        const statusMatch = errStr.match(/status\s+(\d+)/i);
        if (statusMatch) {
          status = parseInt(statusMatch[1], 10);
        } else if (typeof e.status === 'number') {
          status = e.status;
        } else if (e.response && typeof e.response.status === 'number') {
          status = e.response.status;
        }
        // 尝试从异常对象中提取响应文本
        if (e.text) {
          text = e.text;
        } else if (e.response?.text) {
          text = e.response.text;
        } else if (e.json && typeof e.json === 'function') {
          try { text = JSON.stringify(e.json()); } catch {}
        }
        // WebDAV 207 Multi-Status 是有效响应，返回成功
        if (status === 207) {
          return { ok: true, status, text };
        }
        return { ok: false, status, reason: status > 0 ? 'http_error' : 'network_error', error: errStr, text };
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
   * 通过 Obsidian requestUrl 获取二进制数据（用于 PDF 等文件）
   * @returns {Promise<Uint8Array|null>}
   */
  async requestBinary(url) {
    let requestUrl = null;
    try { requestUrl = require('obsidian').requestUrl; } catch(e) {
      requestUrl = globalThis.requestUrl || this.app?.requestUrl;
    }
    if (requestUrl) {
      try {
        const result = await requestUrl({ url, method: 'GET', throw: false });
        if (result.status >= 200 && result.status < 300) {
          // 优先用 arrayBuffer，其次 blob
          if (result.arrayBuffer) {
            return new Uint8Array(result.arrayBuffer);
          } else if (result.blob) {
            const buf = await result.blob.arrayBuffer();
            return new Uint8Array(buf);
          } else if (result.text) {
            // 回退：将 text 当作二进制（会有编码问题，但尽量尝试）
            const bytes = new TextEncoder().encode(result.text);
            return bytes;
          }
        }
        console.error('[CloudAttach] requestBinary failed, status:', result.status);
        return null;
      } catch(e) {
        console.error('[CloudAttach] requestBinary error:', e.message);
        return null;
      }
    }
    // 完全不可用时，用 fetch 回退
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const buf = await resp.arrayBuffer();
      return new Uint8Array(buf);
    } catch(e) {
      console.error('[CloudAttach] requestBinary fetch error:', e.message);
      return null;
    }
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
      'Authorization': this.token,
    };
    
    let response = await this.requestViaObsidian(url, { ...options, headers });
    
    // 检查 HTTP 401 或响应体中的 code 401（token 失效）
    let tokenInvalidated = response.status === 401;
    if (response.status === 200 && response.text) {
      try {
        const json = JSON.parse(response.text);
        if (json.code === 401) {
          console.log('[CloudAttach] token invalidated (body.code=401):', json.message);
          tokenInvalidated = true;
        }
      } catch (e) {
        // 解析失败，忽略
      }
    }
    
    // token 过期，尝试重新登录
    if (tokenInvalidated && this.username && this.password) {
      console.log('[CloudAttach] token expired, re-login');
      this.token = '';
      if (await this.login()) {
        const newAuth = this.token;
        console.log('[CloudAttach] re-login done, new Authorization:', newAuth.substring(0, 30) + '...');
        response = await this.requestViaObsidian(url, {
          ...options,
          headers: { ...options.headers, 'Authorization': newAuth },
        });
      }
    }
    
    return response;
  }

  async getSignedUrl(remotePath, preferredPrefix = 'p') {
    // 优先使用 OpenList API 获取带签名的 URL
    // remotePath 是列表解析后的相对路径（已去除 webdavPath）
    // 需要还原为 OpenList API 所需的虚拟路径：
    //   webdavPath=/dav → 虚拟路径前缀为空，remotePath 本身就是虚拟路径
    //   webdavPath=/dav/Local/test → 虚拟路径前缀=/Local/test，需拼回 remotePath
    let virtualPath = remotePath;
    if (this.webdavPath && this.webdavPath !== '/dav') {
      const davPrefix = '/dav';
      if (this.webdavPath.startsWith(davPrefix)) {
        const pathSuffix = this.webdavPath.slice(davPrefix.length); // e.g. /Local/test
        virtualPath = pathSuffix + (remotePath.startsWith('/') ? remotePath : '/' + remotePath);
      }
    }
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
      // 直接使用 remotePath（不再次解码），保持与服务器路径一致
      console.log('[CloudAttach] getSignedUrl calling API:', apiUrl, 'path:', remotePath, 'prefix:', preferredPrefix);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          path: virtualPath
        })
      });

      const data = await response.json();
      console.log('[CloudAttach] getSignedUrl response:', data);
      
      if (data.code === 200) {
        // raw_url 全编码，用 safeDecodeUrl 解码保留中文，特殊字符编码
        let newUrl = this.safeDecodeUrl(data.data.raw_url);
        // 保持原 URL 的前缀（/d/ 或 /p/）
        newUrl = newUrl.replace(/\/(d|p)\//, `/${preferredPrefix}/`);
        return newUrl;
      }
      
      // API 返回错误（token 无效/过期），抛错而非静默回退
      const errMsg = data.message || `API error ${data.code}`;
      throw new Error(`[CloudAttach] Sign 请求失败: ${errMsg}`);
      
    } catch (e) {
      console.log('[CloudAttach] API call failed:', e.message);
      throw e; // 网络错误也向上抛
    }
  }

  // 获取文件的 WebDAV URL（用于插入到笔记）
  getFileUrl(remotePath) {
    // 公开域名：完整替换 域名+路径+remotePath
    if (this.publicUrl) {
      let base = this.publicUrl;
      const proto = base.match(/^https?:/) ? '' : (this.serverUrl.match(/^https?:/)?.[0] || 'http:');
      if (!base.startsWith('http')) base = `${proto}//${base}`;
      base = base.replace(/\/+$/, '');
      // 剥除 webdavPath（与 listDirectoryWebDAV 一致）
      let path = remotePath;
      const decodedWebdavPath = decodeURIComponent(this.webdavPath || '');
      console.log('[CloudAttach] getFileUrl decode - webdavPath:', JSON.stringify(this.webdavPath), 'decoded:', JSON.stringify(decodedWebdavPath), 'remotePath:', JSON.stringify(remotePath));
      if (path.startsWith(decodedWebdavPath)) {
        path = path.slice(decodedWebdavPath.length) || '/';
        console.log('[CloudAttach] getFileUrl stripped, result:', JSON.stringify(path));
      } else {
        console.log('[CloudAttach] getFileUrl path NOT start with decodedWebdavPath');
      }
      const encodedPath = path.replace(/[\s#?&<>"'\\|{}]/g, c => encodeURIComponent(c));
      return `${base}${encodedPath}`;
    }
    const webdavPath = this.webdavPath || '';
    // 保留原协议，不要写死 https
    const proto = this.serverUrl.replace(/^((https?|http):\/\/)(.*)/, '$1');
    const host = this.serverUrl.replace(/^((https?|http):\/\/)(.*)/, '$3');
    // 统一编码规则：保留中文，编码空格和特殊字符（与 OpenList/S3 一致）
    const fullPath = webdavPath + remotePath;
    const encodedPath = fullPath.replace(/[\s#?&<>"'\\|{}]/g, c => encodeURIComponent(c));
    return `${proto}${host}${encodedPath}`;
  }

  // 获取原始 URL（无签名、无 /dav /d 前缀，用于 iframe 预览）
  getRawUrl(remotePath) {
    // 还原虚拟路径（与 getSignedUrl 相同逻辑）
    let virtualPath = remotePath;
    if (this.webdavPath && this.webdavPath !== '/dav' && this.webdavPath.startsWith('/dav')) {
      const pathSuffix = this.webdavPath.slice('/dav'.length);
      virtualPath = pathSuffix + (remotePath.startsWith('/') ? remotePath : '/' + remotePath);
    }
    // 公开域名：完整替换 域名+路径+remotePath
    if (this.publicUrl) {
      let base = this.publicUrl;
      const proto = base.match(/^https?:/) ? '' : (this.serverUrl.match(/^https?:/)?.[0] || 'http:');
      if (!base.startsWith('http')) base = `${proto}//${base}`;
      base = base.replace(/\/+$/, '');
      return `${base}${virtualPath}`;
    }
    // 保留原协议、保留中文原文
    const proto = this.serverUrl.replace(/^((https?|http):\/\/)(.*)/, '$1');
    const host = this.serverUrl.replace(/^((https?|http):\/\/)(.*)/, '$3');
    return `${proto}${host}${virtualPath}`;
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
      // 注意：不能用 new URL(url).pathname，因为它会自动解码 %20→空格
      // 必须从 URL 字符串手动提取路径部分，保留编码
      const match = url.match(/^https?:\/\/[^\/]+\/\w+\/(.+?)(?:\?|$)/);
      if (!match) return null;
      
      let pathSegment = match[1];
      // 去掉 sign 参数（如果有）
      pathSegment = pathSegment.split('?')[0].split('&')[0];
      
      return '/' + pathSegment;
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
    // 精确匹配：去掉 sign 参数后完整 URL 对比（保留文件名）
    // 不再按文件夹路径前缀匹配——会导致同一文件夹所有文件被替换成同一个 URL
    const urlRegex = /https?:\/\/[^\s()"']+/g;
    const matches = text.match(urlRegex);
    if (!matches) return text;

    // 去掉 newUrl 的 sign 参数，取完整路径作为匹配 key
    const newUrlClean = newUrl.split('?')[0];
    const newUrlPath = newUrlClean.replace(/^https?:\/\/[^\/]+/, '');
    const newUrlDecoded = decodeURIComponent(newUrlPath);
    const newUrlNormalized = newUrlDecoded.replace(/^\/(p|d)\//, '/').replace(/^\/+|\/+$/g, '');

    let newText = text;

    for (const foundUrl of matches) {
      try {
        const foundUrlClean = foundUrl.split('?')[0];
        const foundUrlPath = foundUrlClean.replace(/^https?:\/\/[^\/]+/, '');
        const foundUrlDecoded = decodeURIComponent(foundUrlPath);
        const foundUrlNormalized = foundUrlDecoded.replace(/^\/(p|d)\//, '/').replace(/^\/+|\/+$/g, '');

        // 精确匹配完整 URL 路径（含文件名），而非路径前缀
        if (foundUrlNormalized === newUrlNormalized) {
          console.log('[CloudAttach] findAndReplaceUrl: exact match ' + foundUrlNormalized + ', replacing: ' + foundUrl.substring(0, 80) + '...');
          // 从 newUrl 提取 sign 参数，拼到原始 URL 路径上（保留文件名）
          const newSignMatch = newUrl.match(/\?sign=([^\s"']+)/);
          const newSign = newSignMatch ? '?sign=' + newSignMatch[1] : '';
          newText = newText.replace(foundUrl, foundUrlClean + newSign);
        }
      } catch (e) {
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
    // 只解码一次，不要循环解码（%20→空格、%E2%80%93→异形破折号会导致路径与服务器不匹配）
    try {
      return decodeURIComponent(url);
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
          'Authorization': this.token || ''
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
  /** 对 URL 路径分段编码，保留 / 分隔符 */
  encodePath(path) {
    return path.split('/').map(seg => encodeURIComponent(seg)).join('/');
  }

  async delete(paths) {
    const results = { success: [], failed: [] };
    for (const fullPath of paths) {
      try {
        // WebDAV 账户使用 WebDAV DELETE 方法
        if (this.username && this.password) {
          const url = `${this.serverUrl}${this.encodePath(this.webdavPath + fullPath)}`;
          console.log("[CloudAttach] delete WebDAV DELETE:", url);
          const response = await this.requestViaObsidian(url, {
            method: 'DELETE',
            headers: {
              'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`)
            }
          });
          console.log("[CloudAttach] delete WebDAV response status:", response.status);
          if (response.ok || response.status === 204) {
            results.success.push(fullPath);
          } else {
            results.failed.push({ path: fullPath, error: response.text || `HTTP ${response.status}`, status: response.status });
          }
          continue;
        }
        // OpenList 账户使用 API
        const dir = fullPath.substring(0, fullPath.lastIndexOf("/")).replace(/\/\/$/, "") || '/';
        const name = fullPath.substring(fullPath.lastIndexOf('/') + 1);
        console.log("[CloudAttach] delete API:", dir, "names:", [name]);
        const body = JSON.stringify({ dir, names: [name] });
        console.log("[CloudAttach] delete request body:", body);
        const response = await this.authFetch('/api/fs/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
        });
        console.log("[CloudAttach] delete response status:", response.status, "text:", response.text);
        // OpenList API 返回 200 但 body.code 可能不是 200
        if (response.status === 200 && response.text) {
          try {
            const json = JSON.parse(response.text);
            console.log("[CloudAttach] delete response json:", json);
            if (json.code === 200) {
              results.success.push(fullPath);
            } else {
              results.failed.push({ path: fullPath, error: json.message || 'Delete failed' });
            }
          } catch (parseErr) {
            console.error("[CloudAttach] delete parse error:", parseErr);
            results.failed.push({ path: fullPath, error: 'Parse response failed' });
          }
        } else if (response.ok) {
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
   * @param {string} path - 原路径（如 /Local/share/.../file.txt）
   * @param {string} newName - 新文件名
   * @returns {Promise<void>}
   */
  async rename(path, newName) {
    // 去尾 /（文件夹路径以 / 结尾，需去掉才能正确获取父目录）
    const cleanPath = path.replace(/\/$/, '');
    // WebDAV 账户使用 MOVE 方法
    if (this.username && this.password) {
      const srcUrl = `${this.serverUrl}${this.encodePath(this.webdavPath + path)}`;
      const dstDir = cleanPath.substring(0, cleanPath.lastIndexOf('/'));
      const dstPath = `${dstDir}/${newName}`;
      const dstUrl = `${this.serverUrl}${this.encodePath(this.webdavPath + dstPath)}`;
      console.log("[CloudAttach] rename WebDAV MOVE: src:", srcUrl, "dst:", dstUrl);
      
      const response = await this.requestViaObsidian(srcUrl, {
        method: 'MOVE',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`),
          'Destination': dstUrl
        }
      });
      console.log("[CloudAttach] rename WebDAV response status:", response.status);
      
      // WebDAV MOVE 成功返回 201 Created 或 204 No Content
      if (response.status !== 201 && response.status !== 204 && !response.ok) {
        throw new Error(response.text || 'Rename failed');
      }
      return;
    }
    
    // OpenList 账户使用 API
    const response = await this.authFetch('/api/fs/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src_dir: cleanPath.substring(0, cleanPath.lastIndexOf('/')),
                             src_name: cleanPath.substring(cleanPath.lastIndexOf('/') + 1),
                             dst_dir: cleanPath.substring(0, cleanPath.lastIndexOf('/')),
                             dst_name: newName })
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

      // 构造上传 URL（WebDAV PUT 需要全编码路径）
      const encodedPath = this.encodePath ? this.encodePath(remotePath) : encodeURIComponent(remotePath);
      const uploadUrl = `${this.serverUrl}${this.webdavPath}${encodedPath}`;

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
        // 有 token 的走签名 URL（OpenList），无 token 的走 Basic Auth URL（纯 WebDAV）
        const url = this.token
          ? await this.getSignedUrl(remotePath)
          : this.getFileUrl(remotePath);
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

    // 如果 text 为空（requestUrl 异常未捕获响应体），使用原生 fetch 重试
    let text = response.text;
    if (!text) {
      console.log('[CloudAttach] WebDAV 207 response text is empty, retrying with fetch');
      const fetchResp = await fetch(webdavUrl, {
        method: 'PROPFIND',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`),
          'Content-Type': 'application/xml',
          'Depth': '1'
        },
        body: propfindBody
      });
      text = await fetchResp.text();
      console.log('[CloudAttach] fetch retry status:', fetchResp.status, 'text length:', text?.length || 0);
    }
    const files = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');

    // 尝试多种方式匹配 XML 元素（跨平台兼容性）
    let responses = doc.getElementsByTagNameNS('DAV:', 'response');
    if (responses.length === 0) {
      // 尝试字面标签匹配（D:response 或 d:response，大小写均可）
      const upper = doc.getElementsByTagName('D:response');
      const lower = doc.getElementsByTagName('d:response');
      responses = upper.length > 0 ? upper : lower;
    }
    console.log('[CloudAttach] WebDAV raw response text (first 800):', text.substring(0, 800));
    console.log('[CloudAttach] d:response count:', responses.length);

    // 解析错误检测
    const parseError = doc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      console.error('[CloudAttach] WebDAV XML parse error:', parseError[0].textContent?.substring(0, 200));
    }

    if (responses.length === 0) {
      // 兜底：直接查找所有元素看结构
      const allElements = doc.getElementsByTagName('*');
      const tagNames = [];
      for (let i = 0; i < Math.min(allElements.length, 20); i++) tagNames.push(allElements[i].tagName);
      console.log('[CloudAttach] XML elements found (sample):', tagNames.join(', '));
    }
    function getTag(el, prefix, localName) {
      // 优先用命名空间匹配，兜底用字面匹配（兼容不同大小写前缀）
      const ns = el.getElementsByTagNameNS('DAV:', localName);
      if (ns.length > 0) return ns[0];
      const upper = el.getElementsByTagName(prefix + ':' + localName);
      if (upper.length > 0) return upper[0];
      const lower = el.getElementsByTagName(prefix.toLowerCase() + ':' + localName);
      return lower[0] || null;
    }

    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const hrefEl = getTag(resp, 'D', 'href') || getTag(resp, 'd', 'href');
      const href = hrefEl?.textContent || '';
      const displayNameEl = getTag(resp, 'D', 'displayname') || getTag(resp, 'd', 'displayname');
      const displayName = displayNameEl?.textContent || '';
      const contentLengthEl = getTag(resp, 'D', 'getcontentlength') || getTag(resp, 'd', 'getcontentlength');
      const contentLength = parseInt(contentLengthEl?.textContent || '0');
      // collection 标签存在即为目录
      const collUpper = resp.getElementsByTagName('D:collection');
      const collLower = resp.getElementsByTagName('d:collection');
      const isDirectory = collUpper.length > 0 || collLower.length > 0;
      let decodedHref = decodeURIComponent(href);
      
      // Synology WebDAV 返回完整 URL（https://domain:5006/path/file.txt），需要提取路径部分
      if (decodedHref.startsWith('http')) {
        try {
          const url = new URL(decodedHref);
          decodedHref = url.pathname;
          console.log('[CloudAttach] WebDAV: href 是完整 URL，提取路径:', url.pathname);
        } catch (e) {
          console.warn('[CloudAttach] WebDAV: 解析 href URL 失败:', decodedHref);
        }
      }
      
      // displayName 为空时，从路径取文件名/文件夹名（处理末尾斜杠）
      let name = displayName;
      if (!name) {
        const parts = decodedHref.split('/').filter(p => p);
        name = parts.length > 0 ? parts[parts.length - 1] : decodedHref;
      }
      
      let relativePath = decodedHref;
      const decodedWebdavPath = decodeURIComponent(this.webdavPath || '');
      if (relativePath.startsWith(decodedWebdavPath)) {
        relativePath = relativePath.slice(decodedWebdavPath.length) || '/';
      }
      
      if (relativePath === remotePath || relativePath === remotePath + '/') continue;
      
      files.push({ name, path: relativePath, isDirectory, size: contentLength });
      if (files.length <= 3) console.log('[CloudAttach] listDir path:', JSON.stringify(relativePath));
    }

    // XML 有条目但全部被过滤（排除目录自身引用后），可能是路径匹配问题
    if (responses.length > 1 && files.length === 0) {
      console.warn('[CloudAttach] WebDAV: XML解析到', responses.length, '条目但全部被过滤，remotePath=', remotePath, 'webdavPath=', this.webdavPath);
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
        'Authorization': this.token || ''
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

  /**
   * 在指定远程目录下创建子文件夹
   * 优先调用 OpenList 原生 /api/fs/mkdir API，失败时降级为 WebDAV MKCOL
   * @param {string} parentDir - 父目录（以 / 开头，以 / 结尾）
   * @param {string} folderName - 新文件夹名（不含 /）
   * @returns {Promise<{ok: boolean, remotePath?: string, error?: string}>}
   */
  async createDirectory(parentDir, folderName) {
    const normalizedParent = parentDir.endsWith('/') ? parentDir : parentDir + '/';
    const remotePath = normalizedParent + folderName;
    // 优先使用原生 API
    try {
      const apiUrl = `${this.serverUrl}/api/fs/mkdir`;
      const response = await this.authFetch('/api/fs/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: remotePath })
      });
      if (response.status === 200 || response.status === 201) {
        try {
          const json = JSON.parse(response.text);
          if (json.code === 200 || json.code === 201) {
            return { ok: true, remotePath };
          }
          // code 不为 200 也尝试 WebDAV 降级
        } catch (e) {
          // 响应不是 JSON，认为成功
          return { ok: true, remotePath };
        }
      }
    } catch (e) {
      // API 失败，降级为 WebDAV
      console.log('[CloudAttach] createDirectory API failed, fallback to WebDAV:', e.message);
    }
    // 降级：WebDAV MKCOL
    try {
      const encodedPath = this.encodePath ? this.encodePath(remotePath) : encodeURIComponent(remotePath);
      const url = `${this.serverUrl}${this.webdavPath}${encodedPath}`;
      const response = await this.requestViaObsidian(url, {
        method: 'MKCOL',
        headers: { 'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`) }
      });
      if (response.ok || response.status === 201) {
        return { ok: true, remotePath };
      }
      return { ok: false, error: `HTTP ${response.status} ${response.text || ''}`.trim() };
    } catch (e) {
      return { ok: false, error: e.message };
    }
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
        return { ok: false, status, error: errStr, text: '' };
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
    const encodePath = (p) => p.split('/').map(s => encodeURIComponent(s)).join('/');
    // 去除前缀的尾斜杠，拼到 publicUrl
    const basePrefix = this.prefix ? this.prefix.replace(/\/$/, '') : '';
    const cleanPath = remotePath.replace(/^\/+/, '');
    const fullPath = basePrefix ? `${basePrefix}/${cleanPath}` : cleanPath;
    // 确保 protocol
    // 协议继承：customHost 无协议则从 endpoint 取；endpoint 也无协议则默认 http
    let base = this.publicUrl || this.endpoint;
    const protoFromEndpoint = (this.endpoint || '').match(/^https?:/)?.[0] || 'http:';
    if (!base.startsWith('http')) {
      base = `${protoFromEndpoint}//${base}`;
    }
    return `${base}/${encodePath(fullPath)}`;
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
      // S3 路径必须保持编码，中文不能解码（签名依赖路径编码）
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
      if (status === 403 || status === 401 || status === 404 || response.ok) {
        return response.ok || status === 403;
      }
      return false;
    } catch (e) {
      console.error('[CloudAttach] S3 testConnection error:', e);
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
    const signedHeaderNames = ['host'].sort().join(';');
    signedHeaders['host'] = headers['Host'];
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
    const canonicalHeaders = sortedHeaders.map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`).join('\n') + '\n';

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
    const canonicalHeaders = sortedHeaderEntries.map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`).join('\n') + '\n';

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
    const objKey = (filePath) => { const clean = filePath.replace(/^\/+/, ''); return this.prefix ? this.prefix.replace(/\/$/, '') + '/' + clean : clean; };
    for (const fullPath of paths) {
      try {
        const objectKey = objKey(fullPath);
        // 判断是文件还是文件夹（文件夹以 / 结尾或通过 listDirectory 判断）
        const isDir = fullPath.endsWith('/');
        if (isDir) {
          // S3 无原生目录，列出所有子对象后逐个删除
          const dirContents = await this.listDirectory(fullPath);
          for (const item of dirContents) {
            const itemKey = objKey(item.path);
            const itemSignedQuery = await this.signQuery(new URLSearchParams({'X-Amz-Expires':'3600'}), itemKey, 'DELETE', {});
            const itemEncodedKey = encodeURIComponent(itemKey);
            const itemDeleteUrl = `${this.endpoint}/${this.bucket}/${itemEncodedKey}?${itemSignedQuery}`;
            const r = await this.requestViaObsidian(itemDeleteUrl, { method: 'DELETE' });
            if (!r.ok) results.failed.push({ path: item.path, error: `HTTP ${r.status}`, status: r.status });
            else results.success.push(item.path);
          }
        } else {
          const signedQuery = await this.signQuery(new URLSearchParams({'X-Amz-Expires':'3600'}), objectKey, 'DELETE', {});
          const encodedKey = encodeURIComponent(objectKey);
          const deleteUrl = `${this.endpoint}/${this.bucket}/${encodedKey}?${signedQuery}`;
          const r = await this.requestViaObsidian(deleteUrl, { method: 'DELETE' });
          if (r.ok) results.success.push(fullPath);
          else results.failed.push({ path: fullPath, error: `HTTP ${r.status}`, status: r.status });
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
    const isDir = path.endsWith('/');
    const objKey = (filePath) => { const clean = filePath.replace(/^\/+/, ''); return this.prefix ? this.prefix.replace(/\/$/, '') + '/' + clean : clean; };

    // 文件夹：S3 无原生目录，需列出所有子对象逐个复制+删除
    if (isDir) {
      const cleanPath = path.replace(/\/$/, '');
      const dstDir = cleanPath.substring(0, cleanPath.lastIndexOf('/'));
      const dstBase = dstDir + '/' + newName;

      const dirContents = await this.listDirectory(path);
      for (const item of dirContents) {
        const srcKey = objKey(item.path);
        const relativeName = item.path.slice(path.length);
        const dstKey = objKey(dstBase + '/' + relativeName.replace(/^\//, ''));

        // CopyObject presigned URL
        const copySource = encodeURIComponent('/' + this.bucket + '/' + srcKey).replace(/%2F/g, '/');
        const copyParams = new URLSearchParams({ 'X-Amz-Expires': '3600' });
        const copyQuery = await this.signQuery(copyParams, dstKey, 'PUT', { 'x-amz-copy-source': copySource });
        const copyResp = await this.requestViaObsidian(
          `${this.endpoint}/${this.bucket}/${encodeURIComponent(dstKey)}?${copyQuery}`,
          { method: 'PUT', headers: { 'x-amz-copy-source': copySource } }
        );
        if (!copyResp.ok) {
          throw new Error(`CopyObject failed for ${item.name}: HTTP ${copyResp.status}`);
        }
        // Delete 原对象
        const delQuery = await this.signQuery(new URLSearchParams({'X-Amz-Expires':'3600'}), srcKey, 'DELETE', {});
        const delResp = await this.requestViaObsidian(
          `${this.endpoint}/${this.bucket}/${encodeURIComponent(srcKey)}?${delQuery}`,
          { method: 'DELETE' }
        );
        if (!delResp.ok) {
          throw new Error(`Delete original failed for ${item.name}: HTTP ${delResp.status}`);
        }
      }
      return;
    }

    // 文件：CopyObject + Delete
    const srcKey = objKey(path);
    const dstPath = path.substring(0, path.lastIndexOf('/') + 1) + newName;
    const dstKey = objKey(dstPath);

    const copySource = encodeURIComponent('/' + this.bucket + '/' + srcKey).replace(/%2F/g, '/');
    const copyParams = new URLSearchParams({ 'X-Amz-Expires': '3600' });
    const copyQuery = await this.signQuery(copyParams, dstKey, 'PUT', { 'x-amz-copy-source': copySource });
    const copyResp = await this.requestViaObsidian(
      `${this.endpoint}/${this.bucket}/${encodeURIComponent(dstKey)}?${copyQuery}`,
      { method: 'PUT', headers: { 'x-amz-copy-source': copySource } }
    );
    if (!copyResp.ok) {
      const err = copyResp.text || `HTTP ${copyResp.status}`;
      throw new Error(err);
    }
    // Delete 原对象
    const delQuery = await this.signQuery(new URLSearchParams({'X-Amz-Expires':'3600'}), srcKey, 'DELETE', {});
    const delResp = await this.requestViaObsidian(
      `${this.endpoint}/${this.bucket}/${encodeURIComponent(srcKey)}?${delQuery}`,
      { method: 'DELETE' }
    );
    if (!delResp.ok) {
      throw new Error(`Delete original failed: HTTP ${delResp.status}`);
    }
  }

  /**
   * 在指定远程目录下创建子文件夹
   * S3 实际不是有真正的目录，这里上传一个 0 字节的 .keep 占位对象来让目录在 listDirectory 中可见
   * @param {string} parentDir - 父目录（以 / 开头，以 / 结尾）
   * @param {string} folderName - 新文件夹名（不含 /）
   * @returns {Promise<{ok: boolean, remotePath?: string, usedPlaceholder?: boolean, error?: string}>}
   */
  async createDirectory(parentDir, folderName) {
    const normalizedParent = parentDir.endsWith('/') ? parentDir : parentDir + '/';
    const remotePath = normalizedParent + folderName;
    const basePrefix = this.prefix ? this.prefix.replace(/\/$/, '') : '';
    const dirClean = normalizedParent.replace(/^\/+/, '');
    // 上传 0 字节的 .keep 到新目录
    const objectKey = basePrefix
      ? `${basePrefix}/${dirClean}${folderName}/.keep`
      : `${dirClean}${folderName}/.keep`;
    try {
      const params = new URLSearchParams({ 'X-Amz-Expires': '3600' });
      const signedQuery = await this.signQuery(params, objectKey, 'PUT', { 'content-type': 'application/octet-stream' });
      const uploadUrl = `${this.endpoint}/${this.bucket}/${encodeURIComponent(objectKey)}?${signedQuery}`;
      const response = await this.requestViaObsidian(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: new ArrayBuffer(0)
      });
      if (response.ok) {
        return { ok: true, remotePath, usedPlaceholder: true };
      }
      return { ok: false, error: `HTTP ${response.status} ${response.text || ''}`.trim() };
    } catch (e) {
      return { ok: false, error: e.message };
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
      const titleRow = document.createElement('div');
      titleRow.style.display = 'flex';
      titleRow.style.alignItems = 'center';
      titleRow.style.justifyContent = 'space-between';
      const titleEl = document.createElement('h3');
      titleEl.className = 'cloud-attach-title';
      titleEl.textContent = '☁️ ' + t('view.plugin_title');
      titleEl.style.margin = '0';
      titleRow.appendChild(titleEl);
      header.appendChild(titleRow);
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
    // 统一：显示配置的前缀/路径的最后一段，没有则"根目录"
    const webdavPath = this.client?.webdavPath;
    const s3Prefix = this.client?.prefix;
    let rootLabel;
    if (webdavPath) {
      rootLabel = '📁 ' + webdavPath.replace(/^\/+/, '').split('/').pop() || webdavPath;
    } else if (s3Prefix) {
      rootLabel = '📁 ' + s3Prefix.replace(/^\/+|\/+$/g, '').split('/').pop() || s3Prefix;
    } else {
      rootLabel = t('view.root');
    }
    const root = document.createElement('button');
    root.className = 'cloud-attach-breadcrumb-btn';
    root.textContent = rootLabel;
    root.onclick = () => { this.navigateTo('/'); };
    this.breadcrumbEl.appendChild(root);
    if (this.currentPath === '/') {
      // 根目录也需要刷新按钮
      const actions = document.createElement('div');
      actions.className = 'cloud-attach-breadcrumb-actions';
      const newFolderBtn = document.createElement('button');
      newFolderBtn.className = 'cloud-attach-refresh';
      newFolderBtn.textContent = t('view.new_folder_btn');
      newFolderBtn.title = t('view.new_folder_title');
      newFolderBtn.onclick = () => this.showNewFolderDialog();
      actions.appendChild(newFolderBtn);
      const refresh = document.createElement('button');
      refresh.className = 'cloud-attach-refresh';
      refresh.textContent = t('view.refresh');
      refresh.onclick = () => this.loadDir();
      actions.appendChild(refresh);
      this.breadcrumbEl.appendChild(actions);
      this.renderBatchBar();
      return;
    }
    const parts = this.currentPath.split('/').filter(p => p);
    for (let i = 0; i < parts.length; i++) {
      const sep = document.createElement('span');
      sep.className = 'cloud-attach-breadcrumb-sep';
      sep.textContent = t('view.breadcrumb_sep');
      this.breadcrumbEl.appendChild(sep);
      // 每个路径段都变成可点击的按钮
      const targetPath = '/' + parts.slice(0, i + 1).join('/');
      const btn = document.createElement('button');
      btn.className = 'cloud-attach-breadcrumb-btn';
      btn.textContent = parts[i];
      btn.onclick = () => { this.navigateTo(targetPath); };
      this.breadcrumbEl.appendChild(btn);
    }
    const actions = document.createElement('div');
    actions.className = 'cloud-attach-breadcrumb-actions';
    const newFolderBtn = document.createElement('button');
    newFolderBtn.className = 'cloud-attach-refresh';
    newFolderBtn.textContent = t('view.new_folder_btn');
    newFolderBtn.title = t('view.new_folder_title');
    newFolderBtn.onclick = () => this.showNewFolderDialog();
    actions.appendChild(newFolderBtn);
    const refresh = document.createElement('button');
    refresh.className = 'cloud-attach-refresh';
    refresh.textContent = t('view.refresh');
    refresh.onclick = () => this.loadDir();
    actions.appendChild(refresh);
    this.breadcrumbEl.appendChild(actions);
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

  /**
   * 弹出新建文件夹对话框
   * 输入名称 → 调用 client.createDirectory() → 刷新当前目录
   */
  showNewFolderDialog() {
    if (!this.client) {
      new Notice(t('view.no_account'), 3000);
      return;
    }
    const modal = new (require('obsidian').Modal)(this.app);
    modal.titleEl.textContent = t('view.new_folder_title');
    const content = modal.contentEl;
    content.style.padding = '16px';
    const label = document.createElement('div');
    label.style.fontSize = '13px';
    label.style.marginBottom = '8px';
    label.textContent = t('view.new_folder_placeholder') + ':';
    content.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = t('view.new_folder_placeholder');
    input.style.width = '100%';
    input.style.padding = '6px 8px';
    input.style.fontSize = '13px';
    input.style.marginBottom = '16px';
    input.style.boxSizing = 'border-box';
    content.appendChild(input);
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.justifyContent = 'flex-end';
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = t('view.new_folder_confirm');
    confirmBtn.className = 'mod-cta';
    confirmBtn.onclick = async () => {
      const name = input.value.trim();
      if (!name) {
        new Notice(t('view.new_folder_name_empty'), 3000);
        return;
      }
      if (name.includes('/')) {
        new Notice('⚠️ ' + t('view.new_folder_failed', {error: '名称不能含 /'}), 4000);
        return;
      }
      confirmBtn.disabled = true;
      new Notice(t('view.new_folder_creating'), 2000);
      try {
        const result = await this.client.createDirectory(this.currentPath, name);
        if (result.ok) {
          new Notice(t('view.new_folder_success', {name}), 3000);
          modal.close();
          await this.loadDir();
        } else {
          new Notice(t('view.new_folder_failed', {error: result.error || 'unknown'}), 5000);
          confirmBtn.disabled = false;
        }
      } catch (e) {
        new Notice(t('view.new_folder_failed', {error: e.message}), 5000);
        confirmBtn.disabled = false;
      }
    };
    btnRow.appendChild(confirmBtn);
    content.appendChild(btnRow);
    modal.open();
    setTimeout(() => input.focus(), 50);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmBtn.click();
      else if (e.key === 'Escape') modal.close();
    });
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
      const urls = await Promise.all(selected.map(async f => {
        try {
          if (this.client.token) {
            return this.client.getSignedUrl ? await this.client.getSignedUrl(f.path) : await this.client.getFileUrl(f.path);
          }
          return await this.client.getFileUrl(f.path);
        } catch (e) {
          console.error('[CloudAttach] getFileUrl failed:', f.path, e.message);
          return null;
        }
      }));
      const validUrls = urls.filter(Boolean);
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
    const confirmBtn = document.createElement('button');
    confirmBtn.style.background = 'var(--text-error)';
    confirmBtn.style.color = 'var(--background-primary)';
    confirmBtn.style.padding = '8px 16px';
    confirmBtn.textContent = t('view.confirm_delete', { count: selected.length });
    confirmBtn.onclick = async () => {
      modal.close();
      await this.doDelete(selected);
    };
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
    const is403 = (failed) => failed.status === 403;
    const isS3 = this.client.constructor.name === 'S3Client';
    if (result.failed.length === 0) {
      new Notice(t('notice.delete_success', { count: result.success.length }));
    } else if (result.success.length === 0) {
      const first = result.failed[0];
      if (is403(first)) {
        new Notice(t(isS3 ? 'notice.delete_s3_forbidden' : 'notice.delete_webdav_forbidden'), 5000);
      } else {
        new Notice(t('notice.delete_failed', { error: first.error }), 5000);
      }
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
    const confirmBtn2 = document.createElement('button');
    confirmBtn2.style.background = 'var(--interactive-accent)';
    confirmBtn2.style.color = 'var(--text-on-accent)';
    confirmBtn2.style.padding = '8px 16px';
    confirmBtn2.textContent = t('view.confirm_rename', { count: 1 });
    confirmBtn2.onclick = async () => {
      const newName = input.value.trim();
      if (!newName) { new Notice(t('notice.rename_failed', {error: 'Name cannot be empty'}), 3000); return; }
      if (newName.includes('/')) { new Notice(t('notice.rename_failed', {error: 'Name cannot contain /'}), 3000); return; }
      modal.close();
      await this.doRename(file, newName);
    };
    btnRow.appendChild(confirmBtn2);
    content.appendChild(btnRow);
    modal.open();
    input.focus();
    input.select();
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
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        // PDF 也通过 insertFile 插入 ![]()，后续渲染时会用 MutationObserver + PDF.js canvas 替换
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
  // width: 可选数字宽度（px），支持图片和 PDF（pdfjs 模式）
  async getInsertMarkdown(file, width) {
    console.log('[CloudAttach] getInsertMarkdown file.path:', JSON.stringify(file.path));
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif'];
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'];
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    // 文档类型（iframe 预览）使用原始 URL（无 /d/、无 sign）
    const isPdfJsInsert = ext === 'pdf' && this.plugin.settings.pdfPreview === 'pdfjs';
    const useRawUrl = docExts.includes(ext) && !isPdfJsInsert;
    let url;
    if (useRawUrl) {
      // iframe 预览：用 getRawUrl（OpenList）或 getFileUrl（S3），不带签名
      url = this.client.getRawUrl
        ? this.client.getRawUrl(file.path)
        : this.client.getFileUrl(file.path);
    } else {
      // 有 token 的走签名 URL（OpenList/S3），无 token 的走 Basic Auth URL（纯 WebDAV）
      const client = this.client;
      try {
        url = client.token
          ? await (client.getSignedUrl
              ? client.getSignedUrl(file.path)
              : client.getFileUrl(file.path))
          : client.getFileUrl(file.path);
      } catch (signErr) {
        new Notice(t('notice.sign_rebuild_failed', {error: signErr.message}));
        throw signErr;
      }
    }
    if (imageExts.includes(ext)) {
      const w = width ? `|${width}` : '';
      return `![${nameWithoutExt}${w}](${url})`;
    } else if (videoExts.includes(ext)) {
      return `<video controls width="600" height="400">\n <source src="${url}" type="video/mp4">\n</video>`;
    } else if (audioExts.includes(ext)) {
      return `<audio controls>\n <source src="${url}" type="audio/mpeg">\n</audio>`;
    } else if (docExts.includes(ext)) {
      // PDF 文件：若启用 PDF.js 预览则用 ![]() 语法（MutationObserver 会拦截替换为 canvas）
      if (ext === 'pdf' && this.plugin.settings.pdfPreview === 'pdfjs') {
        const w = width ? `|${width}` : '';
        return `![${nameWithoutExt}${w}](${url})`;
      }
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
    const view = this.findMostRecentMarkdownView();
    if (!view?.editor) {
      new Notice(t('notice.open_note_first'));
      return;
    }
    const md = await this.getInsertMarkdown(file);
    const cursor = view.editor.getCursor();
    view.editor.replaceRange(md + '\n', cursor);
    new Notice(t('notice.inserted', {name: file.name}));
  }
  // 批量插入（异步）
  async insertSelectedFiles() {
    if (!this.client || this.selectedFiles.size === 0) return;
    const view = this.findMostRecentMarkdownView();
    if (!view?.editor) {
      new Notice(t('notice.open_note_first'));
      return;
    }
    const selected = this.files.filter(f => this.selectedFiles.has(f.path));
    const mds = await Promise.all(selected.map(file => this.getInsertMarkdown(file)));
    const cursor = view.editor.getCursor();
    view.editor.replaceRange(mds.map(md => md + '\n').join('\n') + '\n', cursor);
    new Notice(t('notice.inserted_count', {count: selected.length}));
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

// === PDF 全屏预览视图 ===
function cleanFileNameFromUrl(url) {
  if (!url) return 'PDF';
  // 去掉 query (?sign=...&token=...) 和 hash
  const noQuery = url.split('?')[0].split('#')[0];
  const last = noQuery.split('/').pop() || 'PDF';
  try { return decodeURIComponent(last); } catch { return last; }
}

class PdfFullscreenView extends ItemView {
  constructor(leaf, plugin, pdfUrl, pdfName) {
    super(leaf);
    this.plugin = plugin;
    this.pdfUrl = pdfUrl;
    this.pdfName = pdfName || cleanFileNameFromUrl(pdfUrl);
  }

  getViewType() { return VIEW_TYPE_PDF_FULLSCREEN; }
  getDisplayText() { return this.pdfName || 'PDF'; }
  getIcon() { return 'file-text'; }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();

    // 从 state 或 plugin pending 取 URL
    const state = this.leaf.getViewState()?.state || {};
    if (!this.pdfUrl && state.pdfUrl) {
      this.pdfUrl = state.pdfUrl;
      this.pdfName = state.pdfName || cleanFileNameFromUrl(this.pdfUrl);
    }
    if (!this.pdfUrl && this.plugin._pendingPdfUrl) {
      this.pdfUrl = this.plugin._pendingPdfUrl;
      this.pdfName = this.plugin._pendingPdfName || cleanFileNameFromUrl(this.pdfUrl);
    }

    container.style.padding = '0';
    container.style.overflow = 'hidden';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    // 顶部工具栏
    const toolbar = container.createEl('div');
    toolbar.style.display = 'flex';
    toolbar.style.alignItems = 'center';
    toolbar.style.justifyContent = 'space-between';
    toolbar.style.padding = '6px 12px';
    toolbar.style.borderBottom = '1px solid var(--background-modifier-border)';
    toolbar.style.flexShrink = '0';

    // 左侧：文件名 + 版本角标
    const left = toolbar.createEl('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '8px';
    left.style.fontSize = '13px';
    left.style.color = 'var(--text-normal)';
    left.createEl('span', { text: cleanFileNameFromUrl(this.pdfUrl) });
    const verBadge = left.createEl('span', { text: '099' });
    verBadge.style.fontSize = '10px';
    verBadge.style.color = 'var(--text-muted)';
    verBadge.style.background = 'var(--background-modifier-hover)';
    verBadge.style.padding = '1px 4px';
    verBadge.style.borderRadius = '3px';

    // 右侧：功能按钮
    const right = toolbar.createEl('div');
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.style.gap = '10px';

    // 上一页（图标按钮）
    const prevBtn = right.createEl('button');
    prevBtn.className = 'clickable-icon';
    prevBtn.setAttribute('aria-label', '上一页');
    prevBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    prevBtn.onclick = () => this._scrollToPage((this._currentPage || 1) - 1);

    // 页码输入框（可编辑）
    const pageWrap = right.createEl('span');
    pageWrap.style.display = 'flex';
    pageWrap.style.alignItems = 'center';
    pageWrap.style.gap = '2px';
    this.pageInput = pageWrap.createEl('input', { type: 'number', value: '1' });
    this.pageInput.style.width = '40px';
    this.pageInput.style.fontSize = '13px';
    this.pageInput.style.textAlign = 'center';
    this.pageInput.style.border = '1px solid var(--background-modifier-border)';
    this.pageInput.style.borderRadius = '4px';
    this.pageInput.style.background = 'var(--background-primary)';
    this.pageInput.style.color = 'var(--text-normal)';
    this.pageInput.onchange = () => {
      const val = parseInt(this.pageInput.value, 10);
      if (val && val >= 1 && val <= (this._pdf?.numPages || 1)) {
        this._scrollToPage(val);
      }
    };
    this.pageInput.onkeydown = (e) => {
      if (e.key === 'Enter') this.pageInput.blur();
    };
    this.pageTotal = pageWrap.createEl('span', { text: ' / 1' });
    this.pageTotal.style.fontSize = '13px';
    this.pageTotal.style.color = 'var(--text-muted)';

    // 下一页（图标按钮）
    const nextBtn = right.createEl('button');
    nextBtn.className = 'clickable-icon';
    nextBtn.setAttribute('aria-label', '下一页');
    nextBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    nextBtn.onclick = () => this._scrollToPage((this._currentPage || 1) + 1);

    // 关闭按钮（图标按钮）
    const closeBtn = right.createEl('button');
    closeBtn.className = 'clickable-icon';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.onclick = () => this.leaf.detach();

    // 内容区
    this.scrollEl = container.createEl('div');
    this.scrollEl.style.flex = '1';
    this.scrollEl.style.overflowY = 'auto';
    this.scrollEl.style.overflowX = 'hidden';
    this.scrollEl.style.background = 'var(--background-secondary)';
    this.scrollEl.style.padding = '8px 0';

    this._loadPdf();
  }

  async _loadPdf() {
    try {
      this.scrollEl.empty();
      this.scrollEl.createEl('div', { text: t('view.fullscreen_loading'), cls: 'cloud-attach-loading' });

      const pdfjsLib = await this.plugin._loadPdfJs();
      const pdfData = await this.plugin._downloadPdfBinary(this.pdfUrl);
      const loadingTask = pdfData
        ? pdfjsLib.getDocument({ data: pdfData, ownerDocument: this.containerEl.ownerDocument })
        : pdfjsLib.getDocument({ url: this.pdfUrl, ownerDocument: this.containerEl.ownerDocument });
      this._pdf = await loadingTask.promise;
      const totalPages = this._pdf.numPages;
      this.pageTotal.textContent = ' / ' + totalPages;
      this.pageInput.value = '1';
      this._currentPage = 1;

      this.scrollEl.empty();
      this._renderAllPages();
    } catch (e) {
      console.error('[CloudAttach] PdfFullscreenView load error:', e);
      this.scrollEl.empty();
      this.scrollEl.createEl('div', {
        text: t('view.fullscreen_load_fail') + ': ' + (e.message || ''),
        cls: 'cloud-attach-error'
      });
    }
  }

  async _renderAllPages() {
    if (!this._pdf) return;
    const totalPages = this._pdf.numPages;
    // 固定使用 2x 高清渲染（避免模糊），CSS 强制 canvas width: 100% 自适应容器
    const renderScale = 2;

    for (let i = 1; i <= totalPages; i++) {
      const page = await this._pdf.getPage(i);
      const viewport = page.getViewport({ scale: renderScale });
      const canvas = document.createElement('canvas');
      canvas.className = 'cloud-attach-pdf-fullscreen-page';
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.margin = '0 auto 8px';
      canvas.style.boxShadow = '0 1px 4px rgba(0,0,0,0.15)';
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.dataset.pageNum = String(i);
      this.scrollEl.appendChild(canvas);

      await page.render({
        canvasContext: canvas.getContext('2d'),
        viewport
      }).promise;

      if (i === 1) this._bindScroll();
    }
  }

  // 保留以备后续手动计算缩放时使用
  _fitWidthScale() {
    const w = this.containerEl.clientWidth;
    if (w <= 0) return 1;
    return w / 612;
  }

  _reRender() {
    if (!this._pdf) return;
    const curScroll = this.scrollEl.scrollTop;
    this.scrollEl.empty();
    this._renderAllPages().then(() => {
      this.scrollEl.scrollTop = curScroll;
    });
  }

  _bindScroll() {
    // 用 scroll 事件计算当前页（IntersectionObserver 在 Obsidian 中不稳定）
    this.scrollEl.onscroll = () => {
      if (!this._pdf) return;
      const canvases = this.scrollEl.querySelectorAll('canvas[data-page-num]');
      const scrollTop = this.scrollEl.scrollTop;
      const containerHeight = this.scrollEl.clientHeight;
      
      for (const c of canvases) {
        const rect = c.getBoundingClientRect();
        const containerRect = this.scrollEl.getBoundingClientRect();
        const top = rect.top - containerRect.top;
        const bottom = top + rect.height;
        
        // 页面顶部在视口上半部分即认为是当前页
        if (top >= 0 && top < containerHeight * 0.6) {
          const pageNum = parseInt(c.dataset.pageNum, 10);
          if (this.pageInput.value !== String(pageNum)) {
            this.pageInput.value = String(pageNum);
            this._currentPage = pageNum;
          }
          break;
        }
      }
    };
  }

  _scrollToPage(pageNum) {
    if (!this._pdf || pageNum < 1 || pageNum > this._pdf.numPages) return;
    const canvas = this.scrollEl.querySelector(`canvas[data-page-num="${pageNum}"]`);
    if (canvas) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.pageInput.value = String(pageNum);
      this._currentPage = pageNum;
    }
  }
}

class AddAccountModal extends Modal {
  constructor(app, plugin, onSave, account = null) {
    super(app);
    this.plugin = plugin;
    this.onSave = onSave;
    this.account = account;
  }
  async onOpen() {
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
    typeOpenList.appendChild(document.createTextNode(t('settings.openlist_webdav_label')));
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
    webdavInput.value = this.account?.webdavPath || '';
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
    const olPublicUrlDiv = this.createFieldDiv(t('settings.public_url'), t('settings.cdn_url_placeholder'));
    const olPublicUrlInput = document.createElement('input');
    olPublicUrlInput.type = 'text';
    olPublicUrlInput.placeholder = 'https://public.example.com';
    olPublicUrlInput.value = this.account?.publicUrl || '';
    olPublicUrlInput.className = 'cloud-attach-input';
    olPublicUrlDiv.appendChild(olPublicUrlInput);
    fields.olPublicUrl = olPublicUrlInput;
    openlistFields.appendChild(olPublicUrlDiv);
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
    // cancel removed - use X button to close
    const saveBtn = document.createElement('button');
    saveBtn.textContent = t('settings.save');
    saveBtn.className = 'cloud-attach-btn mod-cta';
    saveBtn.onclick = async () => {
      const accountType = radioOpenList.checked ? 'openlist' : 's3';
      let accountData;
      if (accountType === 's3') {
        // S3 模式校验
        let endpoint = fields.endpoint.value.trim().replace(/\/$/, '');
        if (endpoint && !/^https?:\/\//i.test(endpoint)) endpoint = 'http://' + endpoint;
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
        let url = fields.url.value.trim().replace(/\/$/, '');
        if (url && !/^https?:\/\//i.test(url)) url = 'http://' + url;
        if (!url) { new Notice(t('settings.please_fill_server'), 3000); return; }
        // 自动分离：URL 带路径 → 域名归 url，路径追加到 webdavPath
        let autoWebdavPath = '';
        try {
          const urlObj = new URL(url);
          if (urlObj.pathname && urlObj.pathname !== '/') {
            autoWebdavPath = decodeURIComponent(urlObj.pathname.replace(/\/$/, ''));
            url = url.split(urlObj.pathname)[0].replace(/\/$/, '');
          }
        } catch {}
        const finalWebdavPath = autoWebdavPath || fields.webdavPath.value.trim() || '';
        accountData = {
          type: 'openlist',
          name: fields.name.value.trim() || t('settings.account_label', {n: this.plugin.accounts.length + 1}),
          url,
          webdavPath: finalWebdavPath,
          username: fields.username.value.trim(),
          password: fields.password.value,
          token: fields.token.value,
          publicUrl: fields.olPublicUrl.value.trim() || '',
          isActive: true
        };
      }
      if (this.account) await this.plugin.updateAccount(this.account.id, accountData);
      else await this.plugin.addAccount(accountData);
      this.close();
      setTimeout(() => this.onSave?.(), 50);
    };
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
    // 标题行 + 高级按钮
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'center';
    titleRow.style.justifyContent = 'space-between';
    titleRow.style.marginBottom = '8px';
    const title = document.createElement('h2');
    title.textContent = t('settings.title');
    title.style.margin = '0';
    titleRow.appendChild(title);
    const advBtn = document.createElement('button');
    advBtn.textContent = '⚙️ ' + t('settings.advanced');
    advBtn.className = 'cloud-attach-btn';
    advBtn.style.fontSize = '12px';
    advBtn.style.padding = '4px 10px';
    advBtn.onclick = () => new AdvancedSettingModal(this.app, this.plugin).open();
    titleRow.appendChild(advBtn);
    this.containerEl.appendChild(titleRow);
    // 移除「连接OpenList管理云附件」描述文字（无用）
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
    headerRow.style.justifyContent = 'flex-start';
    headerRow.style.marginBottom = '8px';
    const h3 = document.createElement('h3');
    h3.textContent = account.name;
    h3.style.margin = '0';
    h3.style.fontSize = '14px';
    // ✨ 默认账号按钮（标题前）
    const starBtn = document.createElement('button');
    starBtn.className = 'cloud-attach-btn';
    starBtn.style.fontSize = '14px';
    starBtn.style.padding = '0 4px';
    starBtn.style.marginRight = '6px';
    starBtn.style.cursor = 'pointer';
    starBtn.style.background = 'none';
    starBtn.style.border = 'none';
    starBtn.title = this.plugin.defaultAccountId === account.id ? t('settings.unset_default') : t('settings.set_as_default');
    starBtn.textContent = this.plugin.defaultAccountId === account.id ? '✨' : '☆';
    starBtn.style.color = this.plugin.defaultAccountId === account.id ? '#f1c40f' : 'var(--text-muted)';
    starBtn.onmouseenter = () => { starBtn.style.opacity = '0.7'; };
    starBtn.onmouseleave = () => { starBtn.style.opacity = '1'; };
    starBtn.onclick = async () => {
      if (this.plugin.defaultAccountId === account.id) {
        await this.plugin.setDefaultAccount(null);
      } else {
        await this.plugin.setDefaultAccount(account.id);
      }
      this.containerEl.innerHTML = '';
      this.render();
      this.refreshViewSelect();
    };
    headerRow.appendChild(starBtn);
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
      typeBadge.textContent = t('settings.webdav_label');
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
    const upBtn = document.createElement('button');
    upBtn.textContent = '↑';
    upBtn.className = 'cloud-attach-btn';
    upBtn.title = t('settings.move_up');
    upBtn.onclick = async () => {
      await this.plugin.moveAccount(account.id, 'up');
      this.containerEl.innerHTML = '';
      this.render();
      this.refreshViewSelect();
    };
    const downBtn = document.createElement('button');
    downBtn.textContent = '↓';
    downBtn.className = 'cloud-attach-btn';
    downBtn.title = t('settings.move_down');
    downBtn.onclick = async () => {
      await this.plugin.moveAccount(account.id, 'down');
      this.containerEl.innerHTML = '';
      this.render();
      this.refreshViewSelect();
    };
    btnRow.appendChild(editBtn);
    btnRow.appendChild(testBtn);
    btnRow.appendChild(delBtn);
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    btnRow.appendChild(spacer);
    btnRow.appendChild(upBtn);
    btnRow.appendChild(downBtn);
    card.appendChild(btnRow);
    this.containerEl.appendChild(card);
  }
}

// === Advanced Setting Modal ===
class AdvancedSettingModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.innerHTML = '';
    contentEl.style.padding = '24px';
    contentEl.style.maxWidth = '520px';
    
    // 标题
    const title = contentEl.createEl('h2', { text: t('settings.advanced_title') });
    title.style.marginTop = '0';
    title.style.marginBottom = '20px';
    
        // === 自动上传（卡片容器）===
    const autoUploadCard = contentEl.createDiv();
    autoUploadCard.className = 'cloudattach-settings-card';
    autoUploadCard.style.background = 'var(--background-secondary)';
    autoUploadCard.style.borderRadius = '8px';
    autoUploadCard.style.padding = '20px';
    autoUploadCard.style.marginBottom = '16px';

    const Setting = require('obsidian').Setting;
    new Setting(autoUploadCard)
      .setName(t('settings.auto_upload'))
      .setDesc(t('settings.auto_upload_desc'))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.enableAutoUpload);
        toggle.onChange(async (value) => {
          if (value) {
            if (!this.plugin.defaultAccountId) {
              new Notice('⚠️ ' + t('settings.auto_upload_need_default'), 4000);
              toggle.setValue(false);
              return;
            }
            const defAccount = this.plugin.accounts.find(a => a.id === this.plugin.defaultAccountId);
            if (!defAccount) {
              new Notice('⚠️ ' + t('settings.auto_upload_need_default'), 4000);
              toggle.setValue(false);
              return;
            }
            // 弹确认框（Obsidian Modal 系统样式）
            const confirmModal = new (require('obsidian').Modal)(this.app);
            confirmModal.titleEl.textContent = t('settings.auto_upload_confirm_title');
            const cContent = confirmModal.contentEl;
            // 标记用户是否确认，避免 X 关闭时 toggle 回弹
            let confirmed = false;
            confirmModal.onClose = () => { if (!confirmed) toggle.setValue(false); };
            cContent.style.padding = '16px';
            cContent.createEl('p', { text: t('settings.auto_upload_confirm_msg') }).style.marginBottom = '12px';
            // 路径框
            const pathBox = cContent.createDiv();
            pathBox.style.marginBottom = '12px';
            pathBox.style.padding = '10px 12px';
            pathBox.style.background = 'var(--background-secondary)';
            pathBox.style.borderRadius = '4px';
            pathBox.style.fontSize = '13px';
            pathBox.textContent = '📂 ' + defAccount.name + '/' + (defAccount.prefix || '/');
            cContent.createEl('p', { text: t('settings.auto_upload_confirm_again') }).style.marginBottom = '12px';
            // 系统按钮
            confirmModal.modalEl.querySelector('.modal-button-container')?.remove();
            const btnContainer = document.createElement('div');
            btnContainer.className = 'modal-button-container';
            const okBtn = document.createElement('button');
            okBtn.className = 'mod-cta';
            okBtn.textContent = t('settings.auto_upload_confirm_title') || '确认启用';
            okBtn.onclick = async () => {
              confirmed = true;
              this.plugin.settings.enableAutoUpload = true;
              await this.plugin.saveSettings();
              confirmModal.close();
            };
            btnContainer.appendChild(okBtn);
            confirmModal.modalEl.appendChild(btnContainer);
            confirmModal.open();
          } else {
            this.plugin.settings.enableAutoUpload = false;
            await this.plugin.saveSettings();
          }
        });
      });

    // === 文件预览（卡片容器）===
    const card = contentEl.createDiv();
    card.className = 'cloudattach-settings-card';
    card.style.background = 'var(--background-secondary)';
    card.style.borderRadius = '8px';
    card.style.padding = '20px';
    card.style.marginBottom = '16px';
    
    // 分类标题
    const catTitle = card.createEl('h3', { text: t('settings.preview_category') });
    catTitle.style.marginTop = '0';
    catTitle.style.marginBottom = '16px';
    catTitle.style.fontSize = '14px';
    catTitle.style.fontWeight = '600';
    catTitle.style.color = 'var(--text-normal)';
    catTitle.style.textTransform = 'uppercase';
    catTitle.style.letterSpacing = '0.5px';
    catTitle.style.opacity = '0.7';
    
    // --- PDF 预览（带缩进层级）---
    const pdfGroup = card.createDiv();
    pdfGroup.style.marginBottom = '16px';
    
    // PDF 标签行
    const pdfLabelRow = pdfGroup.createDiv();
    pdfLabelRow.style.display = 'flex';
    pdfLabelRow.style.alignItems = 'center';
    pdfLabelRow.style.gap = '6px';
    pdfLabelRow.style.marginBottom = '10px';
    
    // 层级缩进指示器
    const pdfIndent = pdfLabelRow.createSpan();
    pdfIndent.textContent = '▸';
    pdfIndent.style.color = 'var(--text-accent)';
    pdfIndent.style.fontWeight = '700';
    pdfIndent.style.fontSize = '11px';
    
    const pdfLabel = pdfLabelRow.createEl('span', { text: t('settings.pdf_preview') });
    pdfLabel.style.fontWeight = '600';
    pdfLabel.style.fontSize = '13px';
    
    // PDF 选项（每个选项一行）
    const pdfOptRow = pdfGroup.createDiv();
    pdfOptRow.style.marginLeft = '18px';
    pdfOptRow.style.display = 'flex';
    pdfOptRow.style.flexDirection = 'column';
    pdfOptRow.style.gap = '8px';
    
    const mkRadio = (label, value, group) => {
      const opt = group.createDiv();
      opt.style.display = 'flex';
      opt.style.alignItems = 'center';
      opt.style.gap = '4px';
      const radio = opt.createEl('input', { type: 'radio', attr: { name: 'pdf_preview' } });
      radio.checked = this.plugin.settings.pdfPreview === value;
      radio.onchange = async () => {
        if (radio.checked) {
          this.plugin.settings.pdfPreview = value;
          await this.plugin.saveSettings();
          this.onOpen();
        }
      };
      opt.createEl('label', { text: label });
      return radio;
    };
    
    mkRadio(t('settings.pdf_preview_iframe'), 'iframe', pdfOptRow);
    
    // PDF.js radio + 卸载按钮（同一行，作为第二个选项）
    const pdfjsOpt = pdfOptRow.createDiv();
    pdfjsOpt.style.display = 'flex';
    pdfjsOpt.style.alignItems = 'center';
    pdfjsOpt.style.gap = '4px';
    const pdfjsRadio = pdfjsOpt.createEl('input', { type: 'radio', attr: { name: 'pdf_preview' } });
    pdfjsRadio.checked = this.plugin.settings.pdfPreview === 'pdfjs';
    pdfjsRadio.onchange = async () => {
      if (pdfjsRadio.checked) {
        this.plugin.settings.pdfPreview = 'pdfjs';
        await this.plugin.saveSettings();
        this.onOpen();
      }
    };
    const pdfjsPath = (this.app.vault.configDir || '.obsidian') + '/plugins/cloud-attach/libs/pdfjs/';
    const hasPdfjs = await this.app.vault.adapter.exists(pdfjsPath + 'pdf.min.js');
    pdfjsOpt.createEl('label', { text: hasPdfjs ? ('PDF.js' + (t('settings.pdfjs_installed') || '')) : ('PDF.js' + (t('settings.pdfjs_auto_install') || '')) });
    if (hasPdfjs) {
      const delBtn = pdfjsOpt.createEl('button', { text: t('settings.pdfjs_uninstall') || '卸载' });
      delBtn.style.marginLeft = '4px';
      delBtn.onclick = async () => {
        try { await this.app.vault.adapter.rmdir(pdfjsPath, true); } catch(e) {}
        this.onOpen();
      };
    }
    
    // PDF 说明文字
    const pdfNote = pdfGroup.createDiv();
    pdfNote.style.marginLeft = '18px';
    pdfNote.style.marginTop = '6px';
    pdfNote.style.fontSize = '12px';
    pdfNote.style.color = 'var(--text-muted)';
    pdfNote.textContent = '选定 PDF.js 后使用 `![]()` 语法插入预览';

    // --- HEIC 预览（带缩进层级）---
    const heicGroup = card.createDiv();
    heicGroup.style.marginBottom = '16px';
    const heicLabelRow = heicGroup.createDiv();
    heicLabelRow.style.display = 'flex';
    heicLabelRow.style.alignItems = 'center';
    heicLabelRow.style.gap = '6px';
    heicLabelRow.style.marginBottom = '6px';
    const heicIndent = heicLabelRow.createSpan();
    heicIndent.textContent = '▸';
    heicIndent.style.color = 'var(--text-accent)';
    heicIndent.style.fontWeight = '700';
    heicIndent.style.fontSize = '11px';
    const heicLabel = heicLabelRow.createEl('span', {
      text: t('settings.heic_preview') + ' ' + t('settings.heic_supported')
    });
    heicLabel.style.fontWeight = '600';
    heicLabel.style.fontSize = '13px';

    // 底部按钮行
    const btnRow = contentEl.createDiv();
    btnRow.style.marginTop = '20px';
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'flex-end';
    btnRow.style.gap = '8px';
    
    const saveBtn = btnRow.createEl('button', { text: t('settings.save') || '保存' });
    saveBtn.className = 'mod-cta';
    saveBtn.onclick = async () => {
      const pdfjsPath2 = (this.app.vault.configDir || '.obsidian') + '/plugins/cloud-attach/libs/pdfjs/';
      if (this.plugin.settings.pdfPreview === 'pdfjs' && !await this.app.vault.adapter.exists(pdfjsPath2 + 'pdf.min.js')) {
        new Notice(t('settings.pdfjs_installing'));
        try {
          await this.downloadPdfjs(pdfjsPath2);
          new Notice('✅ PDF.js ' + (t('settings.pdfjs_installed') || '安装成功'));
        } catch(e) {
          new Notice('❌ PDF.js 安装失败: ' + e.message);
          return;
        }
      }
      await this.plugin.saveSettings();
      new Notice(t('settings.saved') || '设置已保存');
      this.close();
    };
    
  }
  
  async downloadPdfjs(destDir) {
    const destDirNorm = destDir.replace(/\/$/, '');
    try {
      await this.app.vault.adapter.mkdir(destDirNorm, { recursive: true });
    } catch(e) {
      // 目录可能已存在，忽略错误
    }
    const files = [
      { name: 'pdf.min.js', url: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js' },
      { name: 'pdf.worker.min.js', url: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js' },
    ];
    for (const f of files) {
      const res = await fetch(f.url);
      if (!res.ok) throw new Error('download failed: ' + f.name + ' HTTP ' + res.status);
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 1000) throw new Error('file too small: ' + f.name + ' (' + buf.byteLength + ' bytes, possibly HTML error page)');
      await this.app.vault.adapter.writeBinary(destDirNorm + '/' + f.name, new Uint8Array(buf));
    }
    try { delete globalThis.pdfjsLib; } catch(e) {}
  }
}


// === EditorSuggest: cloud- 快速插入 ===
class CloudAttachSuggest extends EditorSuggest {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.limit = 100;
  }

  onTrigger(cursor, editor, file) {
    if (!file) return null;
    const line = editor.getLine(cursor.line);
    const sub = line.substring(0, cursor.ch);
    const idx = sub.lastIndexOf('cloud-');
    if (idx === -1) return null;
    // cloud- 前面不能是字母/数字/-（避免匹配 abccloud- 这种）
    if (idx > 0 && /[\w-]/.test(sub[idx - 1])) return null;
    const query = sub.substring(idx + 6);
    return { start: { line: cursor.line, ch: idx }, end: { line: cursor.line, ch: cursor.ch }, query };
  }

  async getSuggestions(context) {
    const ctx = this.plugin.getDefaultUploadContext();
    if (!ctx || !ctx.ok) return [];
    const query = context.query || '';
    let dirPath = '/';
    let filter = '';
    if (query) {
      const lastSlash = query.lastIndexOf('/');
      if (lastSlash >= 0) {
        const pathParts = query.substring(0, lastSlash).split('/').filter(p => p);
        dirPath = '/' + pathParts.join('/');
        if (dirPath !== '/') dirPath += '/';
        filter = query.substring(lastSlash + 1);
      } else {
        filter = query;
      }
    }
    try {
      const files = await ctx.client.listDirectory(dirPath);
      if (!filter) return files;
      const q = filter.toLowerCase();
      return files.filter(f => {
        if (f.name.toLowerCase().includes(q)) return true;
        if (f.isDirectory) return f.name.toLowerCase().startsWith(q);
        return false;
      });
    } catch (e) {
      console.error('[CloudAttach] EditorSuggest list error:', e);
      return [];
    }
  }

  renderSuggestion(suggestion, el) {
    const icon = suggestion.isDirectory ? '📁 ' : '📄 ';
    el.createSpan({ text: icon });
    // 文件名中匹配部分高亮
    const nameEl = el.createSpan({ text: suggestion.name });
    nameEl.style.color = 'var(--text-normal)';
    if (!suggestion.isDirectory && suggestion.size) {
      const sizeStr = suggestion.size < 1024 * 1024
        ? ` ${(suggestion.size / 1024).toFixed(0)}KB`
        : ` ${(suggestion.size / 1024 / 1024).toFixed(1)}MB`;
      const sizeEl = el.createSpan({ text: sizeStr });
      sizeEl.style.color = 'var(--text-faint)';
      sizeEl.style.fontSize = '12px';
    }
  }

  async selectSuggestion(suggestion, evt) {
    const context = this.context;
    if (!context) return;
    const { editor, start, end, query } = context;

    if (suggestion.isDirectory) {
      // 解析当前路径，构建完整子目录路径
      const q = query || '';
      let basePath = '';
      if (q.includes('/')) {
        const lastSlash = q.lastIndexOf('/');
        basePath = q.substring(0, lastSlash + 1);
      }
      const nextPath = `cloud-${basePath}${suggestion.name}/`;
      editor.replaceRange(nextPath, start, end);
      return;
    }

    const ctx = this.plugin.getDefaultUploadContext();
    if (!ctx || !ctx.ok) return;
    try {
      // 与 doUpload 一致：文档类型用 getRawUrl（OpenList）或 getFileUrl（S3），其他用签名 URL
      const ext = (suggestion.name.split('.').pop() || '').toLowerCase();
      const nameWithoutExt = suggestion.name.replace(/\.[^.]+$/, '');
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'heif'];
      const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'];
      const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
      const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
      const isPdfJsInsert = ext === 'pdf' && this.plugin.settings.pdfPreview === 'pdfjs';
      let url;
      if (docExts.includes(ext) && !isPdfJsInsert) {
        url = ctx.client.getRawUrl
          ? ctx.client.getRawUrl(suggestion.path)
          : ctx.client.getFileUrl(suggestion.path);
      } else {
        const signedUrl = await (ctx.client.getSignedUrl ? ctx.client.getSignedUrl(suggestion.path) : null);
        url = signedUrl || ctx.client.getFileUrl(suggestion.path);
      }
      let syntax;
      if (imageExts.includes(ext)) {
        syntax = `![${nameWithoutExt}](${url})`;
      } else if (videoExts.includes(ext)) {
        const videoType = ext === 'webm' ? 'video/webm' : ext === 'mov' ? 'video/quicktime' : 'video/mp4';
        syntax = `<video controls width="600" height="400">\n <source src="${url}" type="${videoType}">\n</video>`;
      } else if (audioExts.includes(ext)) {
        const audioType = ext === 'ogg' ? 'audio/ogg' : ext === 'wav' ? 'audio/wav' : 'audio/mpeg';
        syntax = `<audio controls>\n <source src="${url}" type="${audioType}">\n</audio>`;
      } else if (docExts.includes(ext) && !isPdfJsInsert) {
        syntax = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
      } else if (isPdfJsInsert) {
        syntax = `![${nameWithoutExt}](${url})`;
      } else {
        syntax = `[${nameWithoutExt}](${url})`;
      }
      editor.replaceRange(syntax, start, end);
    } catch (e) {
      console.error('[CloudAttach] EditorSuggest select error:', e);
      new Notice('❌ ' + e.message, 4000);
    }
  }
}

// === PDF.js View ===

module.exports = class CloudAttachPlugin extends Plugin {
  constructor() {
    super(...arguments);
    this.accounts = [];
  }
  async onload() {
    // 全局拦截 PDF 容器内右键（不影响普通图片）
    // Obsidian/Electron 右键菜单不走 DOM contextmenu 事件，必须拦截 mousedown button=2
    document.addEventListener("mousedown", (e) => {
      if (e.button === 2 && e.target.closest(".cloudattach-pdf-container")) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
    document.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".cloudattach-pdf-container")) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // 初始化语言（Obsidian 界面语言是应用级设置，不在 vault config 里）
    // 优先使用 moment.locale()，这是 Obsidian 内置的国际化方案
    const momentLocale = (window.moment || moment).locale();
    const lang = this.app.vault.config?.language || momentLocale || 'zh';
    I18n.setLang(lang);
    console.log('CloudAttach loading, language:', I18n.currentLang, 'momentLocale:', momentLocale);
    await this.loadSettings();
    // 全局引用，供 MutationObserver callback 使用（避免 this 上下文问题）
    globalThis._cloudAttachPlugin = this;
    this.addStyles();
    this.addRibbonIcon('folder-open', t('cmd.open_browser'), () => this.activateView());
    this.addSettingTab(new CloudAttachSettingTab(this));
    // EditorSuggest: cloud- 快速插入云端文件
    this.registerEditorSuggest(new CloudAttachSuggest(this.app, this));
    this.addCommand({ id: 'open-browser', name: t('cmd.open_cloud_attach'), callback: () => this.activateView() });
    this.addCommand({
      id: 'reload-plugin',
      name: t('cmd.reload_plugin'),
      callback: async () => {
        new Notice('请手动禁用再启用插件以重载', 2000);
      }
    });
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
    // 左侧文件列表右键菜单（仅文件浏览器，排除编辑器内触发）
    // 已移除：source 值在不同 Obsidian 版本不一致，且需文件与笔记关联才可用
    // TODO: 如需重新启用，需先确认 source 枚举值并放宽 _findNotesWithFile 兜底逻辑
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file, source) => {
        if (!file || !source.startsWith('file-explorer')) return;
        // 文件夹不上传（保持克制）
        if (file.children !== undefined) return;
        const ext = file.extension?.toLowerCase() || '';
        if (ext === 'md') return;

        menu.addSeparator();
        menu.addItem(item => {
          item.setTitle('☁️ ' + t('menu.upload_to_cloud'));
          item.onClick(async () => {
            try {
              const linkedNotes = this._findNotesWithFile(file.path);
              let targetNote = linkedNotes[0];
              if (linkedNotes.length > 1) {
                const activeFile = this.app.workspace.getActiveFile();
                const found = linkedNotes.find(n => n.path === activeFile?.path);
                if (found) targetNote = found;
              }
              // 提取 syntax（有笔记从笔记提取，无笔记兜底）
              let syntax = null;
              if (targetNote && targetNote.extension === 'md') {
                const noteContent = await this.app.vault.read(targetNote);
                const patterns = [
                  new RegExp(`!\\[([^\\]]*)\\]\\(.*?${this._escapeRegex(file.name)}\\)`),
                  new RegExp(`!\\[\\[(${this._escapeRegex(file.name)})(?:\\|[^\\]]*)?\\]\\]`),
                  new RegExp(`\\[\\[(${this._escapeRegex(file.name)})(?:\\|[^\\]]*)?\\]\\]`)
                ];
                for (const p of patterns) {
                  const m = noteContent.match(p);
                  if (m) { syntax = m[0]; break; }
                }
              }
              if (!syntax) syntax = `![${file.name}](${file.path})`;

              const viewOpen = !!this.app.workspace.getLeavesOfType(VIEW_TYPE_CLOUDATTACH).length;
              // 场景 d：无视图 + 无默认账号 → 直接 notice 报错，不弹窗
              if (!viewOpen && !this.defaultAccountId) {
                new Notice(`⚠️ ${t('error.no_default_account_set')}`, 4000);
                return;
              }
              let ctx = null;
              if (viewOpen) ctx = this.getUploadContext();
              const confirmed = await this.showUploadConfirmModal([{ localPath: file.path, syntax }], ctx?.remotePath || '', viewOpen);
              if (!confirmed) return;
              const uploadCtx = (confirmed.useDefault || !viewOpen) ? this.getDefaultUploadContext() : ctx;
              if (!uploadCtx || !uploadCtx.ok) {
                new Notice(`⚠️ ${uploadCtx?.error || t('error.no_account')}`, 4000);
                return;
              }
              // 有引用笔记就传 targetFile，上传后自动替换
              await this.doUpload([{ localPath: file.path, syntax }], uploadCtx, targetNote ? { targetFile: targetNote } : {});
            } catch (e) {
              console.error('[CloudAttach] file-menu upload error:', e);
              new Notice(`❌ ${e.message}`, 4000);
            }
          });
        });
      })
    );
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
    // PDF.js 内联预览（v0.3.026）
    this._observePdfEmbeds();
    // PostProcessor：阅读模式下标记 iOS blob URL img 为 PDF，由 _scanAllPdfImgs 统一处理
    this.registerMarkdownPostProcessor(async (el, ctx) => {
      const imgs = el.querySelectorAll('img');
      if (imgs.length === 0) return;
      const blobImgs = Array.from(imgs).filter(
        img => !img.closest('.cloudattach-pdf-container') &&
               (img.getAttribute('src') || '').startsWith('blob:')
      );
      if (blobImgs.length === 0) return;
      if (!ctx.sourcePath) return;
      const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
      if (!file || !file.extension) return;
      try {
        const content = await this.app.vault.cachedRead(file);
        // 提取所有含 .pdf 的 URL 和宽度
        const pdfPatterns = [];
        const re = /!?\[([^\]]*)\]\(([^)]*)\)/gi;
        let m;
        while ((m = re.exec(content)) !== null) {
          const url = m[2];
          if (url.toLowerCase().includes('.pdf')) {
            const label = m[1];
            let width = '';
            const barIdx = label.lastIndexOf('|');
            if (barIdx !== -1) {
              const afterBar = label.substring(barIdx + 1).trim();
              if (/^\d+$/.test(afterBar)) width = afterBar;
            }
            pdfPatterns.push({ url, width });
          }
          // HEIC/HEIF 也做标记（iOS blob URL 场景）
          if (this._isHeicUrl(url)) {
            pdfPatterns.push({ url, width: '', heic: true });
          }
        }
        // 按 DOM 顺序给 blob img 打标记，不直接渲染
        blobImgs.forEach((img, idx) => {
          if (idx < pdfPatterns.length) {
            const pat = pdfPatterns[idx];
            if (pat.heic) {
              img.dataset.cloudattachHeicUrl = pat.url;
            } else {
              img.dataset.cloudattachPdfUrl = pat.url;
              if (pat.width) img.dataset.cloudattachWidth = pat.width;
            }
            img.dataset.cloudattachProcessed = 'pending';
          }
        });
      } catch(e) {
        console.log('[CloudAttach] PostProcessor error:', e);
      }
    });
    // 注册视图类型（必须，否则 setViewState 静默失败）
    // 防重复注册：禁用→重启用时 Obsidian 可能未注销旧 view type
    try {
      this.registerView(VIEW_TYPE_CLOUDATTACH, (leaf) => new CloudAttachView(leaf, this));
    } catch (e) {
      if (e.message?.includes('existing view type')) {
        console.log('[CloudAttach] view type already registered, skipping');
      } else {
        throw e;
      }
    }
    // 注册 PDF 全屏预览视图
    try {
      this.registerView(VIEW_TYPE_PDF_FULLSCREEN, (leaf) => new PdfFullscreenView(leaf, this, '', ''));
    } catch (e) {
      if (e.message?.includes('existing view type')) {
        console.log('[CloudAttach] pdf fullscreen view type already registered, skipping');
      } else {
        throw e;
      }
    }
    // Auto-upload: 监听粘贴/拖入创建的新文件
    if (!this._autoUploadChain) this._autoUploadChain = Promise.resolve();
    this.registerEvent(this.app.vault.on('create', (file) => {
      if (!this.settings.enableAutoUpload) return;
      if (!this.defaultAccountId) return;
      const TFile = require('obsidian').TFile;
      if (!(file instanceof TFile)) return;
      // 排除 .md 笔记文件，其他附件一律上传
      if (file.extension.toLowerCase() === 'md') return;
      // Promise 链串行化：避免并发 doUpload 读写编辑器相互覆盖
      this._autoUploadChain = this._autoUploadChain.then(() => new Promise(resolve => {
        const tryUpload = async (retriesLeft) => {
          const view = this.activeMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
          if (!view?.editor || !view.file) { resolve(); return; }
          const text = view.editor.getValue();
          const fileName = file.path.split('/').pop();
          const escapedName = this._escapeRegex(fileName);
          const wikiPattern = new RegExp('!\\[\\[(?:.*/)?' + escapedName + '(?:\\|[^\\]]*)?\\]\\]');
          const mdPattern = new RegExp('!\\[[^\\]]*\\]\\((?:.*/)?' + escapedName + '\\)');
          const wikiMatch = text.match(wikiPattern);
          const mdMatch = text.match(mdPattern);
          if (!wikiMatch && !mdMatch) {
            if (retriesLeft > 0) {
              setTimeout(() => tryUpload(retriesLeft - 1), 1000);
            } else {
              resolve();
            }
            return;
          }
          const ctx = this.getDefaultUploadContext();
          if (!ctx || !ctx.ok) { resolve(); return; }
          await this.doUpload([{ localPath: file.path, syntax: (wikiMatch || mdMatch)[0] }], ctx);
          resolve();
        };
        setTimeout(() => tryUpload(2), 500);
      }));
    }));
    console.log('CloudAttach loaded');
  }
  addStyles() {
    const css = `
      .cloud-attach-header { padding: 8px 8px 6px; }
      .cloud-attach-title { font-size: 14px; margin: 8px 0; }
      .cloud-attach-select-area { padding: 0 8px 8px; }
      .cloud-attach-select { width: 100%; padding: 6px 8px; font-size: 13px; border-radius: 4px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); }
      .cloud-attach-breadcrumb { padding: 6px 8px; font-size: 12px; border-bottom: 1px solid var(--background-modifier-border); display: flex; align-items: center; gap: 2px; flex-wrap: wrap; justify-content: space-between; }
      .cloud-attach-breadcrumb-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; }
      .cloud-attach-breadcrumb-btn { background: transparent; border: none; color: var(--text-accent); cursor: pointer; padding: 3px 6px; border-radius: 3px; font-size: 12px; }
      .cloud-attach-breadcrumb-btn:hover { background: var(--background-modifier-hover); }
      .cloud-attach-breadcrumb-sep { color: var(--text-muted); }
      .cloud-attach-breadcrumb-current { color: var(--text-muted); padding: 3px 6px; font-size: 12px; }
      .cloud-attach-refresh { background: transparent; border: 1px solid var(--background-modifier-border); color: var(--text-muted); cursor: pointer; padding: 3px 8px; border-radius: 3px; font-size: 11px; }
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
    
    /* PDF 预览容器 - 双层结构，仿 Obsidian 原生 .pdf-embed */
    .cloudattach-pdf-container { box-sizing: border-box !important; display: inline-block !important; width: 100%; max-width: 100% !important; border: 1px solid var(--background-modifier-border) !important; border-radius: 8px !important; background: var(--background-secondary) !important; vertical-align: top !important; position: relative !important; overflow: hidden !important; }
    .cloudattach-pdf-page { display: block !important; box-sizing: border-box !important; width: 100% !important; height: auto !important; max-width: 100% !important; min-width: 0 !important; }
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
  onunload() { 
    console.log('CloudAttach unloading...'); 
    if (this._pdfObserver) this._pdfObserver.disconnect();
    this._flushPdfErrorLog();
  }

  _flushPdfErrorLog() {
    if (!this._pdfErrorLog) return;
    try {
      const filePath = (this.app.vault.configDir || '.obsidian') + '/plugins/cloud-attach/pdf-error-log.md';
      const existingPromise = this.app.vault.adapter.read(filePath).catch(() => '');
      existingPromise.then(existing => {
        const content = (existing ? existing + '\n' : '# CloudAttach PDF Error Log\n') + this._pdfErrorLog;
        this.app.vault.adapter.write(filePath, content).catch(e => console.error('[CloudAttach] flush log failed:', e));
      });
    } catch(e) {
      console.error('[CloudAttach] _flushPdfErrorLog failed:', e);
    }
    this._pdfErrorLog = '';
  }

  /**
   * 通过 Obsidian requestUrl 下载 PDF 二进制（绕过 CORS）
   */
  async _downloadPdfBinary(url) {
    let reqUrlFn = null;
    try { reqUrlFn = require('obsidian').requestUrl; } catch(e) {}
    if (reqUrlFn) {
      try {
        const resp = await reqUrlFn({ url, method: 'GET' });
        return resp.arrayBuffer;
      } catch(e) {
        console.error('[CloudAttach] _downloadPdfBinary requestUrl error:', e);
      }
    }
    const resp = await fetch(url);
    return resp.arrayBuffer();
  }

  /**
   * 打开 PDF 全屏预览（新窗口 Popout Leaf）
   */
  async openPdfFullscreen(url, name) {
    const { workspace } = this.app;
    if (!name) name = cleanFileNameFromUrl(url);
    // 检查是否已存在
    const existing = workspace.getLeavesOfType(VIEW_TYPE_PDF_FULLSCREEN);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      const view = existing[0].view;
      if (view instanceof PdfFullscreenView) {
        view.pdfUrl = url;
        view.pdfName = name;
        view._loadPdf();
      }
      return;
    }
    // store 到实例上，onOpen 会读取
    this._pendingPdfUrl = url;
    this._pendingPdfName = name;
    // 优先 popout 窗口（真·全屏），fallback 到 split
    let leaf;
    try {
      leaf = workspace.openPopoutLeaf();
    } catch (e) {
      console.log('[CloudAttach] openPopoutLeaf failed, fallback to split:', e);
      leaf = workspace.getLeaf('split', 'vertical');
    }
    await leaf.setViewState({ type: VIEW_TYPE_PDF_FULLSCREEN, active: true, state: { pdfUrl: url, pdfName: name } });
    workspace.revealLeaf(leaf);
    delete this._pendingPdfUrl;
    delete this._pendingPdfName;
  }

  // ============================================================
  // PDF.js 内联预览（v0.3.026）
  // ============================================================
  async _loadPdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    // 读本地 PDF.js（vault 相对路径）
    const pdfJsPath = (this.app.vault.configDir || '.obsidian') + '/plugins/cloud-attach/libs/pdfjs/pdf.min.js';
    const workerPath = (this.app.vault.configDir || '.obsidian') + '/plugins/cloud-attach/libs/pdfjs/pdf.worker.min.js';
    try {
      const pdfJsText = await this.app.vault.adapter.read(pdfJsPath);
      const fn = new Function('window', pdfJsText + '\nreturn window.pdfjsLib;');
      window.pdfjsLib = fn(window);
      // 加载 worker 为 base64 data URI（避免 blob URL 在 popout 中 origin 不兼容）
      const workerText = await this.app.vault.adapter.read(workerPath);
      const uint8 = new TextEncoder().encode(workerText);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const workerBase64 = btoa(binary);
      // 设置 workerSrc 在 pdfjsLib 对象自身上（局部变量）
      const lib = window.pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = 'data:application/javascript;base64,' + workerBase64;
      return window.pdfjsLib;
    } catch(e) {
      console.error('[CloudAttach] _loadPdfJs failed:', e);
      throw e;
    }
  }

  _isPdfUrl(url) {
    return /\.pdf(\?|#|$)/i.test(url);
  }

  _isHeicUrl(url) {
    return /\.(heic|heif)(\?|#|$)/i.test(url);
  }

  async _loadHeic2any() {
    if (window._cloudAttachHeic2any) return window._cloudAttachHeic2any;
    const path = (this.app.vault.configDir || '.obsidian') + '/plugins/cloud-attach/heic2any.bundle.js';
    const code = await this.app.vault.adapter.read(path);
    // heic2any.bundle.js 末尾已注入 window._cloudAttachHeic2any = heic2any
    // 传 exports/module/window 兼容 Windows（global exports）+ Mac
    const m = { exports: {} };
    const fn = new Function('exports', 'module', 'window', code);
    fn(m.exports, m, window);
    return window._cloudAttachHeic2any || m.exports;
  }

  async _renderHeicAsImage(imgEl, url) {
    url = encodeURI(decodeURI(url));
    if (imgEl.closest('.cloudattach-heic-container')) return;
    const modeKey = imgEl.closest('.markdown-reading-view') ? 'reading' : 'editing';
    if (!this._renderedHeic) this._renderedHeic = {};
    if (!this._renderedHeic[modeKey]) this._renderedHeic[modeKey] = new Set();
    const renderedSet = this._renderedHeic[modeKey];
    if (renderedSet.has(url)) return;
    renderedSet.add(url);
    // 先尝试原生解码（Chromium 119+ 支持 HEIC），失败再 fallback heic2any
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 8000);
        imgEl.onload = () => { clearTimeout(timer); resolve(); };
        imgEl.onerror = () => { clearTimeout(timer); reject(new Error('native fail')); };
        imgEl.src = url;
        imgEl.style.maxWidth = '100%';
        imgEl.style.height = 'auto';
      });
      return;
    } catch (_nativeErr) {
      // fallback to heic2any
    }
    try {
      let reqUrlFn = null;
      try { reqUrlFn = require('obsidian').requestUrl; } catch (e) {}
      const resp = reqUrlFn
        ? await reqUrlFn({ url, method: 'GET' })
        : await fetch(url);
      const buf = resp.arrayBuffer || (await resp.arrayBuffer());
      const blob = new Blob([buf]);
      const heic2any = await this._loadHeic2any();
      const result = await heic2any({ blob, toType: 'image/png' });
      const pngBlob = Array.isArray(result) ? result[0] : result;
      imgEl.src = URL.createObjectURL(pngBlob);
      imgEl.style.maxWidth = '100%';
      imgEl.style.height = 'auto';
    } catch (e) {
      if (e.message && e.message.includes('401')) return;
      console.log('[CloudAttach] HEIC render failed:', e.message || e);
    }
  }

  async _renderPdfAsCanvas(imgEl, url) {
    // 去重：编辑/阅读模式使用独立的 Set，避免模式切换互相影响
    const modeKey = imgEl.closest('.markdown-reading-view') ? 'reading' : 'editing';
    if (!this._renderedPdfUrlsByMode) this._renderedPdfUrlsByMode = {};
    if (!this._renderedPdfUrlsByMode[modeKey]) this._renderedPdfUrlsByMode[modeKey] = new Set();
    const renderedSet = this._renderedPdfUrlsByMode[modeKey];
    // 用 URL 作为去重 key（避免不同 imgEl 实例导致重复）
    if (renderedSet.has(url)) return;
    // 全局渲染队列：所有 PDF 串行渲染，防止多 PDF 并发导致手机端内存崩溃
    // 初始化链
    if (!this._pdfRenderChain) this._pdfRenderChain = Promise.resolve();
    // 同一 URL 已在队列中则返回已有 Promise（避免重复入链）
    if (this._pdfQueuedUrls && this._pdfQueuedUrls.has(url)) {
      return this._pdfRenderPromises ? this._pdfRenderPromises.get(url) : undefined;
    }
    if (!this._pdfQueuedUrls) this._pdfQueuedUrls = new Set();
    if (!this._pdfRenderPromises) this._pdfRenderPromises = new Map();
    this._pdfQueuedUrls.add(url);
    const doRender = async () => {
    let failStage = 'unknown';
    try {
      let pdfjsLib;
      try {
        pdfjsLib = await this._loadPdfJs();
      } catch (loadErr) {
        failStage = 'loadPdfJs';
        throw loadErr;
      }
      // ownerDocument 确保 PDF.js 生成的 @font-face CSS 注入到正确的 document
      // （popout 窗口的 canvas 在其独立的 document 中，需要 font-face 也在同一 document）
      // disableAutoFetch: 阻止预加载所有页面，iOS 内存受限时避免加载失败
      // 统一通过 requestUrl 下载二进制传给 PDF.js 的 { data } 模式
      // （Alist /p/ sign URL 对大文件返回 HTML 下载页而非原始二进制，{ url } 模式会解析失败）
      let fetchInfo = "";
      let pdfData = null;
      try {
        const resp = await fetch(url, { method: "HEAD" });
        fetchInfo = "status=" + resp.status + " size=" + (resp.headers.get("content-length") || "?");
      } catch (fErr) {
        fetchInfo = "fetch_err:" + (fErr.message || fErr);
      }
      // 总是通过 Obsidian requestUrl 下载原始二进制
      let reqUrlFn = null;
      try { reqUrlFn = require('obsidian').requestUrl; } catch(e) {}
      if (reqUrlFn) {
        try {
          const resp = await reqUrlFn({ url, method: 'GET' });
          pdfData = resp.arrayBuffer;
          if (fetchInfo.indexOf('viaObsidian') === -1) fetchInfo += " viaObsidian";
        } catch(e) {
          if (!fetchInfo) fetchInfo = "download_err:" + (e.message || e);
        }
      }
      const loadingTask = pdfData
        ? pdfjsLib.getDocument({ data: pdfData, ownerDocument: imgEl.ownerDocument })
        : pdfjsLib.getDocument({ url, ownerDocument: imgEl.ownerDocument, disableAutoFetch: true });
      let pdf;
      try {
        pdf = await loadingTask.promise;
        console.log("[CloudAttach] PDF doc loaded, pages:", pdf.numPages);
      } catch (docErr) {
        failStage = 'getDocument';
        docErr._fetchInfo = fetchInfo;
        throw docErr;
      }
      let imgWidth = imgEl.dataset.cloudattachWidth || imgEl.getAttribute("width") || imgEl.style.width || "";
      console.log('[CloudAttach] _renderPdfAsCanvas width — dataset:', imgEl.dataset.cloudattachWidth, 'attr:', imgEl.getAttribute('width'), 'style:', imgEl.style.width, 'final:', imgWidth);
      let imgHeight = imgEl.getAttribute("height") || imgEl.style.height || "";
      let imgStyleMaxWidth = imgEl.style.maxWidth;
      const parentSpan = imgEl.parentElement;
      if (parentSpan && parentSpan.tagName === "SPAN") {
        if (!imgEl.dataset.cloudattachWidth && !imgWidth && parentSpan.style.width)
          imgWidth = parentSpan.style.width;
        if (!imgHeight && parentSpan.style.height)
          imgHeight = parentSpan.style.height;
        if (!imgStyleMaxWidth && parentSpan.style.maxWidth)
          imgStyleMaxWidth = parentSpan.style.maxWidth;
      }
      const imgClasses = imgEl.className || "";
      const widthClassMatch = imgClasses.match(/cm-image-width-(\d+)/);
      if (widthClassMatch && !imgWidth && !imgEl.dataset.cloudattachWidth) {
        imgWidth = widthClassMatch[1] + "px";
      }
      // 兼容 ![640](url) 语法：alt 为纯数字时当作宽度
      const altWidthMatch = imgEl.alt?.match(/^(\d+)$/);
      if (altWidthMatch && !imgWidth && !imgEl.dataset.cloudattachWidth) {
        imgWidth = altWidthMatch[1] + "px";
      }
      const container = document.createElement("span");
      container.className = "cloudattach-pdf-container";
      container.dataset.currentPage = "1";
      container.dataset.totalPages = pdf.numPages.toString();
      container.dataset.pdfUrl = url;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (imgWidth && !isTouchDevice) {
        const w = imgWidth.includes("%") || imgWidth.includes("px") || imgWidth.includes("vw") ? imgWidth : imgWidth + "px";
        container.style.setProperty("width", w, "important");
      }
      if (imgStyleMaxWidth && !isTouchDevice)
        container.style.maxWidth = imgStyleMaxWidth;
      let userHeightStr = "";
      if (imgHeight && imgHeight !== "auto") {
        userHeightStr = imgHeight.includes("%") || imgHeight.includes("px") || imgHeight.includes("vh") ? imgHeight : imgHeight + "px";
        container.dataset.userHeight = userHeightStr;
      }
      const FIXED_SCALE = 1.5;
      const TOOLBAR_HEIGHT = 28;
      container.style.setProperty("display", "block", "important");
      container.style.setProperty("overflow", "hidden", "important");
      // opacity:0 推迟到 container.clientWidth 读取之后
      // 否则 opacity:0 下 clientWidth 返回父容器约束宽度而非实际显示宽度
      const scrollArea = document.createElement("div");
      scrollArea.className = "cloudattach-pdf-scrollarea";
      let touchDevice = false; // 已在上面定义
      scrollArea.style.overflowY = isTouchDevice ? "scroll" : "auto";
      scrollArea.style.overflowX = "hidden";
      scrollArea.style.position = "relative";
      container.appendChild(scrollArea);
      imgEl.replaceWith(container);
      // 此时 layout 完整，clientWidth 读到的才是真实显示宽度
      const containerW = container.clientWidth || 800;
      container.style.setProperty("opacity", "0", "important");
      const firstPage = await pdf.getPage(1);
      const firstViewport = firstPage.getViewport({ scale: FIXED_SCALE });
      const canvasW = firstViewport.width;
      const canvasH = firstViewport.height;
      const firstCanvas = document.createElement("canvas");
      firstCanvas.className = "cloudattach-pdf-page";
      firstCanvas.dataset.pageNum = "1";
      // 阻止选中/拖拽
      firstCanvas.style.userSelect = 'none';
      firstCanvas.draggable = false;
      scrollArea.appendChild(firstCanvas);
      await this._renderPdfPage(firstCanvas, pdf, 1, FIXED_SCALE, containerW);
      const displayH = canvasH * (containerW / canvasW);
      console.log("[CloudAttach] canvas WxH:", canvasW, "x", canvasH, "containerW:", containerW, "displayH:", displayH);
      let finalContainerHeight;
      if (userHeightStr) {
        finalContainerHeight = userHeightStr;
      } else {
        finalContainerHeight = Math.round(displayH) + "px";
      }
      container.style.setProperty("height", finalContainerHeight, "important");
      scrollArea.style.setProperty("height", "100%", "important");
      scrollArea.style.setProperty("padding-bottom", TOOLBAR_HEIGHT + "px", "important");
      container.style.setProperty("opacity", "1", "important");

      // resize 监听：窗口大小变化时动态重算容器高度，保持宽高比
      const resizeObserver = new ResizeObserver(() => {
        const newW = container.clientWidth || 800;
        const newH = Math.round(canvasH * (newW / canvasW));
        if (!userHeightStr) {
          container.style.setProperty("height", newH + "px", "important");
        }
      });
      resizeObserver.observe(container);
      this._initPdfToolbar(container, pdf);
      // 懒加载：只渲染第1页，其余页创建占位符，滚入视口时才渲染
      const pagePlaceholders = [];
      for (let i = 2; i <= pdf.numPages; i++) {
        const placeholder = document.createElement("div");
        placeholder.className = "cloudattach-pdf-placeholder";
        placeholder.dataset.pageNum = String(i);
        placeholder.dataset.pdfUrl = url;
        placeholder.style.minHeight = "100px"; // 占位符最小高度
        placeholder.style.background = "#f0f0f0";
        placeholder.style.margin = "10px 0";
        scrollArea.appendChild(placeholder);
        pagePlaceholders.push(placeholder);
      }
      // IntersectionObserver + 串行队列（一次一页，避免 iOS 并发渲染内存爆炸）
      if (pagePlaceholders.length > 0) {
        const lazyQueue = [];
        let lazyBusy = false;
        const processQueue = async () => {
          if (lazyBusy || lazyQueue.length === 0) return;
          lazyBusy = true;
          const ph = lazyQueue.shift();
          const pageNum = parseInt(ph.dataset.pageNum);
          try {
            await this._renderLazyPage(ph, pdf, pageNum, FIXED_SCALE, containerW);
          } catch (e) {
            console.error("[CloudAttach] lazy page render failed:", e);
          }
          lazyBusy = false;
          processQueue();
        };
        const lazyObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const ph = entry.target;
              if (ph.dataset.rendered) return;
              ph.dataset.rendered = "true";
              lazyQueue.push(ph);
              processQueue();
              lazyObserver.unobserve(ph);
            }
          });
        }, { rootMargin: "200px" });
        pagePlaceholders.forEach(ph => lazyObserver.observe(ph));
        if (!this._pdfLazyObservers) this._pdfLazyObservers = new Set();
        this._pdfLazyObservers.add(lazyObserver);
      }
      // 渲染成功后清除 pending 标记，记录去重
      imgEl.dataset.cloudattachProcessed = 'done';
      renderedSet.add(url);
      console.log("[CloudAttach] ALL DONE, pages:", pdf.numPages);
      this._bindPdfScroll(container, pdf);
      console.log("[CloudAttach] PDF container built, pages:", pdf.numPages);
    } catch (e) {
      const fetchInfo = e._fetchInfo || "";
      const errorDetails = [
        "stage=" + failStage,
        "name=" + (e.name || "?"),
        "msg=" + (e.message || "?"),
        fetchInfo ? "fetch=" + fetchInfo : ""
      ].filter(Boolean).join(" ");
      console.error("[CloudAttach] PDF render failed:", e, "| " + errorDetails + "| url:", url);
      const errorMsg = e && e.message ? String(e.message) : "PDF render failed (" + failStage + ")";
      // 写入日志笔记
      this._pdfErrorLog = (this._pdfErrorLog || "") +
        "\n- " + new Date().toISOString() + " | " + errorDetails + " | " + url;
      try {
        if (imgEl && imgEl.isConnected) {
          imgEl.style.border = "2px dashed red";
          imgEl.title = errorMsg;
          const overlay = document.createElement("span");
          overlay.textContent = errorMsg;
          overlay.style.display = "block";
          overlay.style.color = "red";
          overlay.style.fontSize = "10px";
          overlay.style.wordBreak = "break-all";
          overlay.style.maxWidth = "100%";
          overlay.style.overflow = "hidden";
          overlay.style.textOverflow = "ellipsis";
          imgEl.parentNode.insertBefore(overlay, imgEl.nextSibling);
        }
      } catch (overlayErr) {
        console.error("[CloudAttach] error overlay failed:", overlayErr);
      }
    }
    };
    // 追加到全局渲染链：所有 PDF 串行排队
    const renderPromise = this._pdfRenderChain.then(() => doRender());
    renderPromise.finally(() => {
      this._pdfRenderPromises.delete(url);
      this._pdfQueuedUrls.delete(url);
    });
    this._pdfRenderPromises.set(url, renderPromise);
    this._pdfRenderChain = renderPromise;  // 更新链尾
    return renderPromise;
  }

  // 渲染指定页码的 PDF 页面到指定 canvas
  // containerW: 容器实际显示宽度，用于计算 canvas CSS 高度以维护宽高比
  async _renderPdfPage(canvas, pdf, pageNum, scale, containerW) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = '100%';
    // <canvas> 的 height:auto 不维护宽高比，用数学计算正确 CSS 高度
    if (containerW) {
      canvas.style.height = Math.round(viewport.height * (containerW / viewport.width)) + 'px';
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    await page.render({ canvasContext: ctx, viewport }).promise;
  }

  // 懒加载：渲染单页并替换占位符
  async _renderLazyPage(placeholder, pdf, pageNum, scale, containerW) {
    const canvas = document.createElement("canvas");
    canvas.className = "cloudattach-pdf-page";
    canvas.dataset.pageNum = String(pageNum);
    canvas.style.userSelect = 'none';
    canvas.draggable = false;
    await this._renderPdfPage(canvas, pdf, pageNum, scale, containerW);
    placeholder.replaceWith(canvas);
    console.log("[CloudAttach] lazy page", pageNum, "rendered");
  }

  // 监听滚动更新当前页码（连续滚动模式，scroll 事件 + scrollTop/scrollHeight）
  _bindPdfScroll(container, pdf) {
    const scrollArea = container.querySelector(".cloudattach-pdf-scrollarea");
    if (!scrollArea) return;
    const onScroll = () => {
      if (container.dataset.scrollProgrammatic) return;
      // 基于实际 canvas offsetTop 定位当前页（页高不均为比例估算漂移）
      const canvases = scrollArea.querySelectorAll("canvas.cloudattach-pdf-page");
      if (!canvases.length) return;
      const scrollMid = scrollArea.scrollTop + scrollArea.clientHeight / 3;
      let pageNum = 1;
      for (let i = 0; i < canvases.length; i++) {
        if (canvases[i].offsetTop <= scrollMid) {
          pageNum = parseInt(canvases[i].dataset.pageNum) || (i + 1);
        } else break;
      }
      if (container.dataset.currentPage !== String(pageNum)) {
        container.dataset.currentPage = String(pageNum);
        this._updatePdfToolbar(container, pdf);
      }
    };
    scrollArea.addEventListener("scroll", onScroll, { passive: true });
  }

  // 初始化 PDF 翻页工具栏（参考 v0.3.042 样式：底部右侧，hover 显示）
  _initPdfToolbar(container, pdf) {
    const totalPages = parseInt(container.dataset.totalPages);
    const toolbar = document.createElement("div");
    toolbar.className = "cloudattach-pdf-toolbar";
    toolbar.style.background = "rgba(0, 0, 0, 0.6)";
    toolbar.style.color = "white";
    toolbar.style.padding = "4px 8px";
    toolbar.style.borderRadius = "4px";
    toolbar.style.display = "flex";
    toolbar.style.gap = "6px";
    toolbar.style.alignItems = "center";
    toolbar.style.fontSize = "12px";
    toolbar.style.height = "28px";
    toolbar.style.lineHeight = "20px";
    toolbar.style.zIndex = "10";
    toolbar.style.userSelect = "none";
    toolbar.style.position = "absolute";
    toolbar.style.bottom = "8px";
    toolbar.style.right = "8px";
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    toolbar.style.opacity = "0";
    toolbar.style.transition = "opacity 0.2s";
    container.style.position = "relative";
    if (isTouch) {
      container.addEventListener("click", (e) => {
        toolbar.style.opacity = toolbar.style.opacity === "1" ? "0" : "1";
      });
    } else {
      container.addEventListener("mouseenter", () => {
        toolbar.style.opacity = "1";
      });
      container.addEventListener("mouseleave", () => {
        toolbar.style.opacity = "0";
      });
    }
    const prevBtn = document.createElement("span");
    prevBtn.textContent = "\u25C0";
    prevBtn.style.cursor = "pointer";
    prevBtn.dataset.role = "prev";
    toolbar.appendChild(prevBtn);
    const pageIndicator = document.createElement("span");
    pageIndicator.dataset.role = "pageIndicator";
    pageIndicator.style.cursor = "pointer";
    pageIndicator.title = "\u70B9\u51FB\u8DF3\u8F6C\u5230\u6307\u5B9A\u9875\u7801";
    toolbar.appendChild(pageIndicator);
    const nextBtn = document.createElement("span");
    nextBtn.textContent = "\u25B6";
    nextBtn.style.cursor = "pointer";
    nextBtn.dataset.role = "next";
    toolbar.appendChild(nextBtn);
    const sep = document.createElement("span");
    sep.textContent = "|";
    sep.style.opacity = "0.5";
    sep.style.margin = "0 2px";
    toolbar.appendChild(sep);
    const fullscreenBtn = document.createElement("span");
    fullscreenBtn.textContent = "\u26F6";
    fullscreenBtn.style.cursor = "pointer";
    fullscreenBtn.title = "\u5168\u5C4F\u9884\u89C8\uFF08\u656C\u8BF7\u671F\u5F85\uFF09";
    fullscreenBtn.dataset.role = "fullscreen";
    toolbar.appendChild(fullscreenBtn);
    fullscreenBtn.onclick = (e) => {
      e.stopPropagation();
      const url = container.dataset.pdfUrl;
      this.openPdfFullscreen(url, cleanFileNameFromUrl(url));
    };
    const scrollArea = container.querySelector(".cloudattach-pdf-scrollarea");
    const scrollToPage = (pageNum) => {
      const firstPage = scrollArea.querySelector(".cloudattach-pdf-page");
      if (!firstPage) return;
      const pageH = firstPage.offsetHeight;
      container.dataset.scrollProgrammatic = "1";
      container.dataset.currentPage = String(pageNum);
      this._updatePdfToolbar(container, pdf);
      scrollArea.scrollTop = (pageNum - 1) * pageH;
      requestAnimationFrame(() => {
        delete container.dataset.scrollProgrammatic;
      });
    };
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      const current = parseInt(container.dataset.currentPage) || 1;
      if (current > 1)
        scrollToPage(current - 1);
    };
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      const current = parseInt(container.dataset.currentPage) || 1;
      if (current < totalPages)
        scrollToPage(current + 1);
    };
    pageIndicator.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const current = parseInt(container.dataset.currentPage);
      const { Modal: Modal2, Setting } = require("obsidian");
      class PageJumpModal extends Modal2 {
        constructor(app, cur, total, onSubmit) {
          super(app);
          this.cur = cur;
          this.total = total;
          this.onSubmit = onSubmit;
        }
        onOpen() {
          const { contentEl } = this;
          contentEl.createEl("h4", { text: "\u8DF3\u8F6C\u5230\u9875\u7801" });
          let val = this.cur.toString();
          new Setting(contentEl).setName(`\u9875\u7801 (1-${this.total})`).addText((text) => {
            text.setValue(val);
            text.inputEl.type = "number";
            text.inputEl.min = "1";
            text.inputEl.max = this.total.toString();
            text.onChange((v) => {
              val = v;
            });
          });
          new Setting(contentEl).addButton((btn) => btn.setButtonText("\u8DF3\u8F6C").setCta().onClick(() => {
            const p = parseInt(val);
            if (!isNaN(p) && p >= 1 && p <= this.total) {
              this.onSubmit(p);
              this.close();
            }
          }));
        }
        onClose() {
          this.contentEl.empty();
        }
      }
      new PageJumpModal(this.app, current, totalPages, (p) => {
        scrollToPage(p);
      }).open();
    };
    container.appendChild(toolbar);
    this._updatePdfToolbar(container, pdf);
  }

  // 获取 PDF 缩放比例（从 canvas width 推导）


  // 更新工具栏状态
  _updatePdfToolbar(container, pdf) {
    const toolbar = container.querySelector(".cloudattach-pdf-toolbar");
    if (!toolbar)
      return;
    const currentPage = parseInt(container.dataset.currentPage);
    const totalPages = parseInt(container.dataset.totalPages);
    const pageIndicator = toolbar.querySelector('[data-role="pageIndicator"]');
    if (pageIndicator) {
      pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    }
    const prevBtn = toolbar.querySelector('[data-role="prev"]');
    const nextBtn = toolbar.querySelector('[data-role="next"]');
    if (prevBtn)
      prevBtn.style.visibility = currentPage > 1 ? "visible" : "hidden";
    if (nextBtn)
      nextBtn.style.visibility = currentPage < totalPages ? "visible" : "hidden";
  }

  _observePdfEmbeds() {
    if (this._pdfObserver) return;
    // 去重：编辑/阅读模式使用独立的 Set
    if (!this._renderedPdfUrlsByMode) this._renderedPdfUrlsByMode = { editing: new Set(), reading: new Set() };
    this._pdfObserver = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(n => {
          if (n.nodeType !== 1) return;
          // 匹配直接 img 节点或子树中的 img
          const imgs = n.tagName === 'IMG' ? [n] : Array.from(n.querySelectorAll('img'));
          imgs.forEach(img => {
            // 避免重复处理已替换的容器
            if (img.closest('.cloudattach-pdf-container')) return;
            const src = img.getAttribute('src') || '';
            if (this._isPdfUrl(src)) {
              this._renderPdfAsCanvas(img, src);
            }
          });
        });
      });
    });
    // 监听主窗口 document.body
    this._pdfObserver.observe(document.body, { childList: true, subtree: true });
    // 注册已有 popout 窗口的 observer
    this._popoutObservers = new Map();
    this._registerPopoutObservers();

    // 初始扫描：延迟执行确保编辑模式 DOM 已渲染
    setTimeout(() => this._scanAllPdfImgs(), 500);
    setTimeout(() => this._scanAllPdfImgs(), 3000);
    // 切换笔记时清空去重记录并重新扫描
    const rescanPdfImgs = () => {
      // 清空已渲染记录，确保切换笔记后重新渲染（编辑/阅读模式独立）
      this._renderedPdfUrlsByMode = { editing: new Set(), reading: new Set() };
      // 销毁懒加载 observer 释放资源
      if (this._pdfLazyObservers) {
        this._pdfLazyObservers.forEach(obs => obs.disconnect());
        this._pdfLazyObservers.clear();
      }
      // 主窗口：立即扫一次
      this._scanAllPdfImgs();
      // 延迟再扫（等 DOM 渲染完成）
      setTimeout(() => this._scanAllPdfImgs(), 500);
      // 再延迟扫（应对慢渲染）
      setTimeout(() => this._scanAllPdfImgs(), 1500);
      setTimeout(() => this._scanAllPdfImgs(), 3000);
      // 所有 popout 窗口
      this._popoutObservers.forEach((obs, doc) => {
        this._scanAllPdfImgs(doc);
        setTimeout(() => this._scanAllPdfImgs(doc), 500);
        setTimeout(() => this._scanAllPdfImgs(doc), 1500);
        setTimeout(() => this._scanAllPdfImgs(doc), 3000);
      });
    };
    this.registerEvent(this.app.workspace.on('active-leaf-change', rescanPdfImgs));
    this.registerEvent(this.app.workspace.on('layout-change', () => {
      // 重新扫描主窗口（编辑/阅读模式独立）
      this._renderedPdfUrlsByMode = { editing: new Set(), reading: new Set() };
      this._scanAllPdfImgs();
      setTimeout(() => this._scanAllPdfImgs(), 500);
      setTimeout(() => this._scanAllPdfImgs(), 3000);
      // 检查是否有新的 popout 窗口需要注册
      this._registerPopoutObservers();
    }));
  }

  _registerPopoutObservers() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const doc = leaf.containerEl.ownerDocument;
      if (doc === document) return;
      if (this._popoutObservers.has(doc)) return;
      const popoutObserver = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;
            const imgs = n.tagName === 'IMG' ? [n] : Array.from(n.querySelectorAll('img'));
            imgs.forEach(img => {
              if (img.closest('.cloudattach-pdf-container')) return;
              const src = img.getAttribute('src') || '';
              if (this._isPdfUrl(src)) {
                this._renderPdfAsCanvas(img, src);
              }
            });
          });
        });
      });
      popoutObserver.observe(doc.body, { childList: true, subtree: true });
      this._popoutObservers.set(doc, popoutObserver);
      this._scanAllPdfImgs(doc);
    });
  }

  _scanAllPdfImgs(doc) {
    const d = doc || document;
    // 优先处理 PostProcessor 标记的 pending img（阅读模式 iOS blob URL）
    const pendingImgs = d.querySelectorAll('img[data-cloudattach-processed="pending"]');
    pendingImgs.forEach(img => {
      if (img.closest('.cloudattach-pdf-container')) return;
      const pdfUrl = img.dataset.cloudattachPdfUrl;
      const heicUrl = img.dataset.cloudattachHeicUrl;
      if (pdfUrl) {
        img.dataset.cloudattachProcessed = 'done';
        this._renderPdfAsCanvas(img, pdfUrl);
      } else if (heicUrl) {
        img.dataset.cloudattachProcessed = 'done';
        this._renderHeicAsImage(img, heicUrl);
      }
    });
    // 再处理普通 PDF/HEIC URL
    const allImgs = d.querySelectorAll('img');
    allImgs.forEach(img => {
      if (img.closest('.cloudattach-pdf-container')) return;
      const src = img.getAttribute('src') || '';
      if (this._isPdfUrl(src)) {
        this._renderPdfAsCanvas(img, src);
        return;
      }
      if (this._isHeicUrl(src)) {
        this._renderHeicAsImage(img, src);
        return;
      }
      const alt = img.getAttribute('alt') || '';
      if (alt && /^https?:\/\//i.test(alt) && /\.pdf\s*$/i.test(alt.trim())) {
        this._renderPdfAsCanvas(img, alt);
      }
      if (this._isHeicUrl(alt) && /^https?:\/\//i.test(alt)) {
        this._renderHeicAsImage(img, alt);
      }
    });
  }

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
        if (account.type === 's3') continue; // S3 用公共 URL 无 sign，无需刷新
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
    // 累积修改的文本，避免每次都从原始文本重新读取
    let accumulatedText = text;
    let cursorPos = null;
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
            // 保持原 URL 的前缀（/d/ 或 /p/）
            const originalPrefix = url.match(/\/(d|p)\//)?.[1] || 'p';
            const newUrl = await client.getSignedUrl(realPath, originalPrefix[0]);
            if (newUrl && newUrl !== url) {
              const newVerify = await client.verifySignUrl(newUrl);
              if (newVerify.ok) {
              // 使用累积的文本进行替换，而非每次从原始文本重新读取
              const newText = client.findAndReplaceUrl(accumulatedText, realPath, newUrl);
              if (newText !== accumulatedText) {
                // 首次修改时保存光标位置
                if (!cursorPos) cursorPos = view.editor.getCursor();
                accumulatedText = newText;
                results.refreshed++;
                results.refreshedPaths.push(realPath);
              } else {
                results.valid++;
              }
              } else {
                // 新 URL 验证失败，保留原 URL
                console.log('[CloudAttach] 新 URL 验证失败，保留原 URL:', newVerify.reason);
                results.failed++;
                results.failedUrls.push({ url, reason: t('error.sign_rebuild_failed', {error: newVerify.reason}) });
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
              // 保持原 URL 的前缀（/d/ 或 /p/）
              const originalPrefix = url.match(/\/(d|p)\//)?.[1] || 'p';
              const newUrl = await client.getSignedUrl(realPath, originalPrefix[0]);
              if (newUrl && newUrl !== url) {
                const newVerify = await client.verifySignUrl(newUrl);
                if (newVerify.ok) {
                // 使用累积的文本进行替换
                const newText = client.findAndReplaceUrl(accumulatedText, realPath, newUrl);
                if (newText !== accumulatedText) {
                  if (!cursorPos) cursorPos = view.editor.getCursor();
                  accumulatedText = newText;
                  results.refreshed++;
                  results.refreshedPaths.push(realPath);
                }
              }
                } else {
                  console.log('[CloudAttach] 新 URL 验证失败，保留原 URL:', newVerify.reason);
                  results.failed++;
                  results.failedUrls.push({ url, reason: t('error.sign_rebuild_failed', {error: newVerify.reason}) });
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
    // 一次性写入累积的修改
    if (accumulatedText !== text && cursorPos) {
      view.editor.setValue(accumulatedText);
      // 恢复光标位置，并清除选择区
      view.editor.setCursor(cursorPos);
      view.editor.setSelection(cursorPos);
    }
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
        // 保持原 URL 的前缀（/d/ 或 /p/）
        const originalPrefix = url.match(/\/(d|p)\//)?.[1] || 'p';
        const newUrl = await client.getSignedUrl(realPath, originalPrefix[0]);
        if (newUrl) {
          const newVerify = await client.verifySignUrl(newUrl);
          if (newVerify.ok) {
          const fullText = view.editor.getValue();
          const newText = fullText.replace(url, newUrl);
          view.editor.setValue(newText);
          view.editor.setCursor(0, 0);
          view.editor.setSelection(0, 0);
          new Notice(t('notice.sign_refreshed'), 3000);
        }
          } else {
            console.log('[CloudAttach] 新 URL 验证失败:', newVerify.reason);
            new Notice(t('notice.refresh_failed', {error: newVerify.reason}), 4000);
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
    this.settings = { accounts: [], pdfPreview: 'iframe', enableAutoUpload: false, ...data };
    this.accounts = this.settings.accounts || [];
    this.settings.pdfPreview = this.settings.pdfPreview || 'iframe';
    this.settings.enableAutoUpload = this.settings.enableAutoUpload || false;
    this.defaultAccountId = this.settings.defaultAccountId || null;
  }
  async saveSettings() {
    this.settings.accounts = this.accounts;
    this.settings.defaultAccountId = this.defaultAccountId;
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
    if (this.defaultAccountId === id) this.defaultAccountId = null;
    await this.saveSettings();
  }
  async setDefaultAccount(id) {
    if (id && !this.accounts.find(a => a.id === id)) return;
    this.defaultAccountId = id || null;
    await this.saveSettings();
  }
  async updateAccount(id, updates) {
    const idx = this.accounts.findIndex(a => a.id === id);
    if (idx >= 0) {
      this.accounts[idx] = { ...this.accounts[idx], ...updates };
      await this.saveSettings();
    }
  }
  async moveAccount(id, direction) {
    const idx = this.accounts.findIndex(a => a.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= this.accounts.length) return;
    [this.accounts[idx], this.accounts[targetIdx]] = [this.accounts[targetIdx], this.accounts[idx]];
    await this.saveSettings();
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
    // WebDAV 上传时 remotePath 需要拼接 webdavPath
    const isWebDAV = view.client.webdavPath;
    const remotePath = isWebDAV
      ? (view.client.webdavPath + view.currentPath)
      : view.currentPath;
    return {
      ok: true,
      client: this.createClient(view.accountId),
      remotePath: view.currentPath,
      account: this.getAccount(view.accountId)
    };
  }
  /**
   * 获取默认账号的上传上下文
   * @returns {{ok: boolean, client: object, remotePath: string, account: object}|null}
   */
  getDefaultUploadContext() {
    if (!this.defaultAccountId) {
      return { ok: false, error: t('view.no_default_account_hint') };
    }
    const account = this.getAccount(this.defaultAccountId);
    if (!account) {
      return { ok: false, error: t('error.no_account') };
    }
    const client = this.createClient(this.defaultAccountId);
    if (!client) {
      return { ok: false, error: t('error.no_account') };
    }
    // remotePath 是相对于 webdavPath/prefix 的路径，不是含 webdavPath 的绝对路径
    // 视图未打开时无法知道当前浏览位置，默认根目录
    const remotePath = '/';
    return {
      ok: true,
      client,
      remotePath,
      account
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
          } else {
            // 尝试匹配普通 wiki-link 格式 [[path]]（无 ! 前缀）
            const plainWikiMatch = line.match(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
            if (plainWikiMatch) {
              localPath = plainWikiMatch[1];
              markdownSyntax = plainWikiMatch[0];
            }
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
    const viewOpen = !!this.app.workspace.getLeavesOfType(VIEW_TYPE_CLOUDATTACH).length;
    let ctx = null;
    if (viewOpen) {
      ctx = this.getUploadContext();
      if (!ctx.ok) {
        new Notice(`⚠️ ${ctx.error}`, 4000);
        return;
      }
    }
    // 确认上传
    const confirmed = await this.showUploadConfirmModal([{ localPath: absolutePath, syntax: markdownSyntax }], ctx?.remotePath || '', viewOpen);
    if (!confirmed) return;
    // 执行上传
    const uploadCtx = (confirmed.useDefault || !viewOpen) ? this.getDefaultUploadContext() : ctx;
    if (!uploadCtx || !uploadCtx.ok) {
      new Notice(`⚠️ ${uploadCtx?.error || t('error.no_account')}`, 4000);
      return;
    }
    await this.doUpload([{ localPath: absolutePath, syntax: markdownSyntax }], uploadCtx);
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
    let text = view.editor.getValue();
    // 剔除代码块内容（inline code 和 fenced code），避免误匹配
    const codeFreeText = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
    const notePath = view.file?.path || '';
    const noteDir = notePath.substring(0, notePath.lastIndexOf('/') + 1);
    // 匹配所有本地附件（![] 格式，排除 http/https）
    const attachmentRegex = /!\[([^\]]*)\]\((?!http)([^)#\s?]+)/g;
    const attachments = [];
    let match;
    while ((match = attachmentRegex.exec(codeFreeText)) !== null) {
      const localPath = match[2];
      // 使用 metadataCache 正确解析（支持相对路径、绝对路径、../ 导航）
      const cacheResolved = this.app.metadataCache.getFirstLinkpathDest(localPath, notePath);
      let absolutePath;
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
      // 检查是否已存在，且过滤空路径
      if (!absolutePath || !absolutePath.trim()) continue;
      if (!attachments.find(a => a.localPath === absolutePath)) {
        attachments.push({
          localPath: absolutePath,
          syntax: match[0]
        });
      }
    }
    // 匹配 wiki-link 格式 ![[path]]
    const wikiRegex = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
    while ((match = wikiRegex.exec(codeFreeText)) !== null) {
      const localPath = match[1];
      // 使用 metadataCache 正确解析（支持相对路径、绝对路径、../ 导航）
      const cacheResolved = this.app.metadataCache.getFirstLinkpathDest(localPath, notePath);
      let absolutePath;
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
      // 检查是否已存在，且过滤空路径
      if (!absolutePath || !absolutePath.trim()) continue;
      if (!attachments.find(a => a.localPath === absolutePath)) {
        attachments.push({
          localPath: absolutePath,
          syntax: match[0]
        });
      }
    }
    // 匹配普通 wiki-link 格式 [[path]]（无 ! 前缀）
    const plainWikiRegex = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
    while ((match = plainWikiRegex.exec(codeFreeText)) !== null) {
      const localPath = match[1];
      const cacheResolved = this.app.metadataCache.getFirstLinkpathDest(localPath, notePath);
      let absolutePath;
      if (cacheResolved && cacheResolved.path) {
        absolutePath = cacheResolved.path;
      } else {
        if (localPath.startsWith('/')) {
          absolutePath = localPath.substring(1);
        } else {
          absolutePath = noteDir + localPath;
        }
      }
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
    const viewOpen = !!this.app.workspace.getLeavesOfType(VIEW_TYPE_CLOUDATTACH).length;
    let ctx = null;
    if (viewOpen) {
      ctx = this.getUploadContext();
      if (!ctx.ok) {
        new Notice(`⚠️ ${ctx.error}`, 4000);
        return;
      }
    }
// 确认上传
    const confirmed = await this.showUploadConfirmModal(attachments, ctx?.remotePath || '', viewOpen);
    if (!confirmed) return;
    // 执行上传
    const uploadCtx = (confirmed.useDefault || !viewOpen) ? this.getDefaultUploadContext() : ctx;
    if (!uploadCtx || !uploadCtx.ok) {
      new Notice(`⚠️ ${uploadCtx?.error || t('error.no_account')}`, 4000);
      return;
    }
    await this.doUpload(attachments, uploadCtx);
  }
  /**
   * 查找引用了指定文件的笔记列表（通过 metadataCache embeds/links）
   */
  _findNotesWithFile(filePath) {
    const results = [];
    const fileName = filePath.split('/').pop();
    const mdFiles = this.app.vault.getMarkdownFiles();
    for (const mf of mdFiles) {
      const cache = this.app.metadataCache.getFileCache(mf);
      if (!cache?.embeds && !cache?.links) continue;
      const allRefs = [...(cache.embeds || []), ...(cache.links || [])];
      if (allRefs.some(ref => (ref.link || '').toLowerCase() === fileName.toLowerCase() || (ref.link || '').toLowerCase() === filePath.toLowerCase())) {
        results.push(mf);
      }
    }
    if (results.length === 0) {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile?.extension === 'md') results.push(activeFile);
    }
    return results;
  }
  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 显示上传确认对话框
   * @param {Array} attachments - 要上传的附件列表
   * @param {string} remotePath - 远程目录
   * @returns {Promise<boolean>} 用户是否确认
   */
  showUploadConfirmModal(attachments, remotePath, viewOpen = true) {
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

      let useDefault = false;

      if (viewOpen) {
        // === 场景1：右侧视图已打开 → 单选（当前路径 / 默认账号）===
        const targetGroup = document.createElement('div');
        targetGroup.style.marginBottom = '16px';
        targetGroup.style.padding = '12px';
        targetGroup.style.background = 'var(--background-secondary)';
        targetGroup.style.borderRadius = '6px';
        const mkRadio = (label, subLabel, checked, onCheck) => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.gap = '6px';
          row.style.padding = '4px 0';
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'upload_target';
          radio.checked = checked;
          radio.onchange = () => { if (radio.checked) onCheck(); };
          row.appendChild(radio);
          const labelEl = document.createElement('span');
          labelEl.style.fontSize = '13px';
          labelEl.style.fontWeight = '600';
          labelEl.textContent = label;
          row.appendChild(labelEl);
          if (subLabel) {
            const sub = document.createElement('span');
            sub.style.fontSize = '11px';
            sub.style.color = 'var(--text-muted)';
            sub.textContent = subLabel;
            row.appendChild(sub);
          }
          return row;
        };
        // 选项1：当前 CloudAttach 视图路径
        targetGroup.appendChild(mkRadio(
          t('view.upload_to_current_path'),
          this.escapeHtml(remotePath),
          true,   // 视图打开时默认选中当前路径（用户已主动浏览到此路径）
          () => { useDefault = false; }
        ));
        // 选项2：默认账号（如果已设置）
        if (this.defaultAccountId) {
          const defAccount = this.accounts.find(a => a.id === this.defaultAccountId);
          if (defAccount) {
            targetGroup.appendChild(mkRadio(
              t('view.upload_to_default_account'),
              defAccount.name,
              false,
              () => { useDefault = true; }
            ));
          }
        }
        content.appendChild(targetGroup);
      } else {
        // === 场景2：右侧视图未打开 → 显示默认账号目标（只读）===
        const defAccount = this.defaultAccountId
          ? this.accounts.find(a => a.id === this.defaultAccountId)
          : null;
        if (!defAccount) {
          const warnEl = document.createElement('div');
          warnEl.style.marginBottom = '16px';
          warnEl.style.padding = '12px';
          warnEl.style.background = 'var(--background-secondary)';
          warnEl.style.borderRadius = '6px';
          warnEl.style.color = 'var(--text-warning)';
          warnEl.style.fontSize = '13px';
          warnEl.textContent = '⚠️ ' + t('error.no_default_account_set');
          content.appendChild(warnEl);
        } else {
          const infoEl = document.createElement('div');
          infoEl.style.marginBottom = '16px';
          infoEl.style.padding = '12px';
          infoEl.style.background = 'var(--background-secondary)';
          infoEl.style.borderRadius = '6px';
          const infoLabel = document.createElement('div');
          infoLabel.style.fontSize = '12px';
          infoLabel.style.color = 'var(--text-muted)';
          infoLabel.style.marginBottom = '4px';
          infoLabel.textContent = t('view.upload_to_default_account') + ':';
          infoEl.appendChild(infoLabel);
          const infoValue = document.createElement('div');
          infoValue.style.fontSize = '13px';
          infoValue.style.fontWeight = '600';
          infoValue.innerHTML = `<span style="color:var(--text-accent);font-size:11px">✨</span> ${this.escapeHtml(defAccount.name)}`;
          infoEl.appendChild(infoValue);
          content.appendChild(infoEl);
          useDefault = true;
        }
      }

      // 按钮行
      const btnRow = document.createElement('div');
      btnRow.style.display = 'flex';
      btnRow.style.gap = '8px';
      btnRow.style.justifyContent = 'flex-end';
      const uploadBtn = document.createElement('button');
      uploadBtn.textContent = t('view.upload_btn', {count: attachments.length});
      uploadBtn.className = 'mod-cta';
      uploadBtn.style.background = 'var(--interactive-accent)';
      uploadBtn.style.color = 'var(--text-on-accent)';
      uploadBtn.style.padding = '8px 16px';
      uploadBtn.onclick = () => { modal.close(); resolve({ confirmed: true, useDefault }); };
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
  async doUpload(attachments, ctx, opts = {}) {
    const { client, remotePath } = ctx;
    const targetFile = opts.targetFile || null;
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
    // 更新笔记内容（当前打开笔记用 editor，指定目标文件用 vault.modify）
    const canEdit = (view?.editor) || targetFile;
    if (replacements.length > 0 && canEdit) {
      const isActiveNote = !!(view?.editor && (!targetFile || view.file?.path === targetFile.path));
      let text = isActiveNote ? view.editor.getValue() : await this.app.vault.read(targetFile);
      // 文件类型分类（与插入逻辑一致）
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'heif'];
      const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'];
      const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
      const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
      for (const rep of replacements) {
        const ext = rep.localPath.split('.').pop().toLowerCase();
        const fileName = rep.localPath.split('/').pop();
        const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
        // PDF 检查 pdfPreview 设置
        const isPdfJsInsert = ext === 'pdf' && this.settings.pdfPreview === 'pdfjs';
        // 根据文件类型选择 URL
        let url;
        if (docExts.includes(ext) && !isPdfJsInsert) {
          // 文档类型（iframe 预览）：用 getRawUrl（OpenList）或 getFileUrl（S3），不带签名
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
          } else if (docExts.includes(ext) && !isPdfJsInsert) {
            newSyntax = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
          } else if (isPdfJsInsert) {
            newSyntax = `![${alias}](${url})`;
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
          } else if (docExts.includes(ext) && !isPdfJsInsert) {
            newSyntax = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
          } else if (isPdfJsInsert) {
            // PDF + pdfjs 模式用图片语法
            newSyntax = `![${alt}](${url})`;
          } else {
            newSyntax = `[${alt}](${url})`;
          }
        } else if (rep.oldSyntax.startsWith('[[')) {
          // 普通 wiki-link 格式: [[path]] 或 [[path|alias]]
          const aliasMatch = rep.oldSyntax.match(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/);
          const alias = aliasMatch?.[2] || nameWithoutExt;
          if (imageExts.includes(ext)) {
            newSyntax = `![${alias}](${url})`;
          } else if (videoExts.includes(ext)) {
            newSyntax = `<video controls width="600" height="400">\n <source src="${url}" type="video/mp4">\n</video>`;
          } else if (audioExts.includes(ext)) {
            newSyntax = `<audio controls>\n <source src="${url}" type="audio/mpeg">\n</audio>`;
          } else if (docExts.includes(ext) && !isPdfJsInsert) {
            newSyntax = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
          } else if (isPdfJsInsert) {
            newSyntax = `![${alias}](${url})`;
          } else {
            newSyntax = `[${alias}](${url})`;
          }
        } else {
          // 其他格式，保持原样替换 URL
          newSyntax = rep.oldSyntax.replace(/file:\S+/, url);
        }
        // 全部替换（支持同一文件被多次引用）
        text = text.split(rep.oldSyntax).join(newSyntax);
        // 删除本地文件
        try {
          await this.app.vault.delete(this.app.vault.getAbstractFileByPath(rep.localPath));
          console.log('[CloudAttach] 已删除本地文件:', rep.localPath);
        } catch (e) {
          console.log('[CloudAttach] 删除本地文件失败:', e.message);
        }
      }
      if (isActiveNote) {
        const finalCursor = view.editor.getCursor();
        view.editor.setValue(text);
        view.editor.setCursor(finalCursor);
        view.editor.setSelection(finalCursor, finalCursor);
        view.editor.setSelection(finalCursor);
      } else {
        await this.app.vault.modify(targetFile, text);
      }
    }
    // 显示结果
    const parts = [];
    if (results.success > 0) parts.push(t('notice.upload_success_count', {count: results.success}));
    if (results.failed > 0) parts.push(t('notice.upload_failed_count', {count: results.failed}));
    if (results.skipped > 0) parts.push(t('notice.upload_skipped_count', {count: results.skipped}));
    new Notice(t('notice.upload_complete', {parts: parts.join(', ')}), 5000);
  }
};
