/* CloudAttach v0.3.001 */
"use strict";

// src/main.js
var { Plugin, Notice, Menu, Modal, PluginSettingTab, MarkdownView, ItemView, EditorSuggest } = require("obsidian");
var VIEW_TYPE_CLOUDATTACH = "cloud-attach-view";
var I18n = {
  currentLang: "zh",
  translations: {
    zh: {},
    en: {}
  },
  setLang(lang) {
    if (!lang)
      lang = "zh";
    const normalized = lang.toLowerCase().split("-")[0];
    this.currentLang = normalized in this.translations ? normalized : "zh";
  },
  t(key) {
    return this.translations[this.currentLang][key] || this.translations["zh"][key] || key;
  }
};
Object.assign(I18n.translations.zh, {
  // Notice 消息
  "notice.sign_expired_403": "\u26A0\uFE0F Sign \u5DF2\u8FC7\u671F\uFF0C\u8BF7\u5237\u65B0",
  "notice.sign_invalid": "\u274C Sign \u65E0\u6548",
  "notice.sign_rebuild_failed": "\u26A0\uFE0F \u7B7E\u540D\u5931\u8D25\uFF1A{error}",
  "notice.sign_ok": "\u2705 Sign \u6709\u6548\uFF0C\u65E0\u9700\u5237\u65B0",
  "notice.check_start": "\u{1F50D} \u5F00\u59CB\u68C0\u67E5 {count} \u4E2A URL...",
  "notice.check_complete": "\u2705 \u68C0\u67E5\u5B8C\u6210\uFF1A{parts}",
  "notice.check_complete_partial": "\u{1F4CB} \u68C0\u67E5\u5B8C\u6210\uFF1A{parts}",
  "notice.no_urls_in_note": "\u{1F4ED} \u7B14\u8BB0\u4E2D\u672A\u53D1\u73B0\u4EFB\u4F55 URL",
  "notice.no_attachment": "\u26A0\uFE0F \u5F53\u524D\u5149\u6807\u9644\u8FD1\u672A\u627E\u5230\u9644\u4EF6",
  "notice.no_url_near_cursor": "\u274C \u5149\u6807\u9644\u8FD1\u672A\u627E\u5230 URL",
  "notice.open_note_first": "\u274C \u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0",
  "notice.no_file_selected": "\u26A0\uFE0F \u8BF7\u5148\u9009\u62E9\u6587\u4EF6",
  "notice.file_not_found": "\u26A0\uFE0F \u6587\u4EF6\u4E0D\u5B58\u5728\uFF08\u53EF\u80FD\u5728\u670D\u52A1\u5668\u4E0A\u88AB\u5220\u9664\u6216\u79FB\u52A8\uFF09",
  "notice.cannot_extract_path": "\u274C \u65E0\u6CD5\u63D0\u53D6\u8DEF\u5F84\u6216\u65E0 Token",
  "notice.cannot_refresh": "\u274C \u65E0\u6CD5\u63D0\u53D6\u8DEF\u5F84\u6216\u65E0 Token\uFF0C\u65E0\u6CD5\u5237\u65B0",
  "notice.select_account_first": "\u274C \u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u8D26\u6237",
  "notice.select_dir_first": "\u26A0\uFE0F \u8BF7\u5148\u5728 CloudAttach \u6807\u7B7E\u9875\u4E2D\u9009\u62E9\u4E0A\u4F20\u76EE\u5F55\uFF08\u4E0D\u80FD\u662F\u6839\u76EE\u5F55\uFF09",
  "notice.upload_start": "\u{1F4E4} \u5F00\u59CB\u4E0A\u4F20 {count} \u4E2A\u9644\u4EF6...",
  "notice.upload_success": "\u2705 \u4E0A\u4F20\u6210\u529F {count} \u4E2A",
  "notice.upload_partial": "\u26A0\uFE0F \u90E8\u5206\u6210\u529F\uFF1A{success} \u6210\u529F\uFF0C{failed} \u5931\u8D25",
  "notice.upload_all_failed": "\u274C \u4E0A\u4F20\u5168\u90E8\u5931\u8D25",
  "notice.upload_failed": "\u274C \u4E0A\u4F20\u5931\u8D25: {error}",
  "notice.file_deleted": "\u2705 \u5DF2\u5220\u9664\u672C\u5730\u6587\u4EF6: {path}",
  "notice.file_delete_failed": "\u274C \u5220\u9664\u672C\u5730\u6587\u4EF6\u5931\u8D25: {error}",
  "notice.local_file_not_found": "\u274C \u672C\u5730\u6587\u4EF6\u4E0D\u5B58\u5728: {path}",
  "notice.copied_count": "\u{1F4CB} \u5DF2\u590D\u5236 {count} \u4E2A URL",
  "notice.copied_count_links": "\u{1F4CB} \u5DF2\u590D\u5236 {count} \u4E2A\u94FE\u63A5",
  "notice.copy_link_failed": "\u274C \u83B7\u53D6\u94FE\u63A5\u5931\u8D25",
  "notice.inserted": "\u2705 \u5DF2\u63D2\u5165: {name}",
  "notice.inserted_count": "\u2705 \u5DF2\u63D2\u5165 {count} \u4E2A\u6587\u4EF6",
  "notice.open_note_first_insert": "\u274C \u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0",
  "notice.check_url": "\u{1F50D} \u68C0\u67E5 URL: {url}...",
  "notice.no_openlist_url": "\u26A0\uFE0F \u975E OpenList URL\uFF0C\u8DF3\u8FC7",
  "notice.not_my_url_skip": "\u26A0\uFE0F \u672A\u5339\u914D\u5230\u8D26\u6237\uFF0C\u8DF3\u8FC7",
  "notice.s3_upload_success": "\u2705 \u4E0A\u4F20\u6210\u529F: {path}",
  "notice.s3_upload_failed": "\u274C S3 \u4E0A\u4F20\u5931\u8D25: {error}",
  "notice.s3_test_403": "\u2705 \u8FDE\u63A5\u6210\u529F(403\u65E0\u6743\u9650\uFF0C\u4F46\u7B7E\u540D\u6B63\u786E)",
  "notice.s3_test_401": "\u274C \u7B7E\u540D\u9519\u8BEF(401)\uFF0C\u8BF7\u68C0\u67E5AccessKey/SecretKey/Region",
  "notice.s3_test_404": "\u274C \u5B58\u50A8\u6876\u672A\u627E\u5230(404)",
  "notice.s3_test_ok": "\u2705 \u8FDE\u63A5\u6210\u529F!",
  "notice.s3_test_failed": "\u274C \u5931\u8D25 status={status}",
  "notice.s3_test_error": "\u274C \u8FDE\u63A5\u5F02\u5E38: {error}",
  "notice.plugin_reloaded": "\u2705 CloudAttach \u5DF2\u91CD\u65B0\u52A0\u8F7D",
  "notice.delete_success": "\u2705 \u5DF2\u5220\u9664 {count} \u9879",
  "notice.delete_partial": "\u26A0\uFE0F \u5220\u9664\u6210\u529F {success} \u9879\uFF0C\u5931\u8D25 {failed} \u9879",
  "notice.delete_failed": "\u274C \u5220\u9664\u5931\u8D25\uFF1A{error}",
  "notice.rename_conflict": "\u274C \u91CD\u547D\u540D\u5931\u8D25\uFF1A\u76EE\u6807\u6587\u4EF6\u540D\u5DF2\u5B58\u5728",
  "notice.rename_failed": "\u274C \u91CD\u547D\u540D\u5931\u8D25\uFF1A{error}",
  "notice.rename_success": "\u2705 \u91CD\u547D\u540D\u6210\u529F",
  "notice.reload_failed": "\u274C \u91CD\u8F7D\u5931\u8D25: {error}",
  "notice.connect_success": "\u2705 \u8FDE\u63A5\u6210\u529F",
  "notice.connect_failed": "\u274C \u8FDE\u63A5\u5931\u8D25",
  // 设置页面
  "settings.title": "CloudAttach \u8BBE\u7F6E",
  "settings.account_name": "\u8D26\u6237\u540D\u79F0",
  "settings.add_account": "\u6DFB\u52A0\u8D26\u6237",
  "settings.save": "\u4FDD\u5B58",
  "settings.saved": "\u2705 \u8BBE\u7F6E\u5DF2\u4FDD\u5B58",
  "settings.test": "\u6D4B\u8BD5",
  "settings.edit": "\u7F16\u8F91",
  "settings.edit_account": "\u7F16\u8F91\u8D26\u6237",
  "settings.delete": "\u5220\u9664",
  "settings.move_up": "\u4E0A\u79FB",
  "settings.move_down": "\u4E0B\u79FB",
  "settings.server_address": "\u670D\u52A1\u5668\u5730\u5740",
  "settings.endpoint": "\u7AEF\u70B9",
  "settings.bucket": "\u5B58\u50A8\u6876",
  "settings.region": "\u5730\u57DF",
  "settings.prefix": "\u5B58\u50A8\u8DEF\u5F84\uFF08\u9009\u586B\uFF09",
  "settings.prefix_placeholder": "obsidian/\uFF0C\u9ED8\u8BA4\u6839\u76EE\u5F55",
  "settings.username": "\u7528\u6237\u540D",
  "settings.password": "\u5BC6\u7801",
  "settings.token": "Token\uFF08\u9009\u586B\uFF09",
  "settings.token_hint": "\u5728 OpenList \u540E\u53F0\u83B7\u53D6\uFF0C\u4E0D\u586B\u5219\u4E0D\u7B7E\u540D",
  "settings.access_key": "\u8BBF\u95EE\u5BC6\u94A5 ID",
  "settings.secret_key": "\u8BBF\u95EE\u5BC6\u94A5",
  "settings.public_url": "\u81EA\u5B9A\u4E49\u4E3B\u673A",
  "settings.public_url_hint": "auto\uFF08Cloudflare R2 \u53EF\u7559\u7A7A\uFF09",
  "settings.cdn_url": "CDN \u52A0\u901F\u5730\u5740\uFF08\u9009\u586B\uFF09",
  "settings.cdn_url_hint": "https://cdn.example.com\uFF08\u9009\u586B\uFF0C\u7528\u4E8E\u62FC\u516C\u5171\u8BBF\u95EEURL\uFF09",
  "settings.storage_type": "\u5B58\u50A8\u7C7B\u578B",
  "settings.openlist": "\u5BF9\u8C61\u5B58\u50A8",
  "settings.openlist_desc": "\u8FDE\u63A5 OpenList \u7BA1\u7406\u4E91\u9644\u4EF6",
  "settings.advanced": "\u9AD8\u7EA7",
  "settings.set_as_default": "\u2605 \u8BBE\u4E3A\u9ED8\u8BA4",
  "settings.unset_default": "\u2606 \u53D6\u6D88\u9ED8\u8BA4",
  "settings.is_default": "\u9ED8\u8BA4",
  "settings.default_account": "\u9ED8\u8BA4\u8D26\u53F7",
  "view.upload_to_current_path": "\u4E0A\u4F20\u5230\u5F53\u524D CloudAttach \u8DEF\u5F84",
  "view.upload_to_default_account": "\u4E0A\u4F20\u5230\u9ED8\u8BA4\u8D26\u53F7",
  "view.no_default_account_hint": "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u8BBE\u5B9A\u9ED8\u8BA4\u8D26\u53F7",
  "settings.advanced_title": "\u9AD8\u7EA7\u8BBE\u7F6E",
  "settings.preview_category": "\u6587\u4EF6\u9884\u89C8",
  "settings.pdf_preview": "PDF \u9884\u89C8\u65B9\u5F0F",
  "settings.pdf_preview_iframe": "iframe\uFF08\u9ED8\u8BA4\uFF09",
  "settings.pdf_preview_pdfjs": "PDF.js",
  "settings.pdfjs_auto_install": "\uFF08\u4FDD\u5B58\u540E\u81EA\u52A8\u5B89\u88C5 \u7EA61.6MB\uFF09",
  "settings.pdfjs_installed": "\uFF08\u5DF2\u5B89\u88C5\uFF09",
  "settings.pdfjs_installing": "\u6B63\u5728\u5B89\u88C5 PDF.js...",
  "settings.pdfjs_downloaded": "PDF.js\uFF08\u5DF2\u5B89\u88C5\uFF09",
  "settings.pdfjs_uninstall": "\u5378\u8F7D",
  "settings.excel_preview": "Excel \u9884\u89C8\u65B9\u5F0F",
  "settings.excel_preview_iframe": "iframe\uFF08\u9ED8\u8BA4\uFF09",
  "settings.excel_preview_sheetjs": "SheetJS",
  "settings.word_preview": "Word \u9884\u89C8\u65B9\u5F0F",
  "settings.word_preview_iframe": "iframe\uFF08\u9ED8\u8BA4\uFF09",
  "settings.word_preview_mammoth": "mammoth.js",
  "settings.preview_coming_soon": "\u656C\u8BF7\u671F\u5F85...",
  "settings.s3": "\u5BF9\u8C61\u5B58\u50A8 (S3)",
  "settings.s3_desc": "\u652F\u6301 S3 \u534F\u8BAE\u7684\u5BF9\u8C61\u5B58\u50A8",
  "settings.account_name_placeholder": "\u4F8B\u5982\uFF1A\u6211\u7684COS\u6876",
  "settings.folder_required": "\u26A0\uFE0F \u8BF7\u9009\u62E9\u4E0A\u4F20\u5230\u7684\u6587\u4EF6\u5939\uFF0C\u4E0D\u80FD\u662F\u6839\u76EE\u5F55",
  "settings.auto_upload": "\u81EA\u52A8\u4E0A\u4F20",
  "settings.auto_upload_desc": "\u5F00\u542F\u540E\u81EA\u52A8\u4E0A\u4F20\u9644\u4EF6\u5230\u9ED8\u8BA4\u670D\u52A1",
  "settings.auto_upload_confirm_title": "\u786E\u8BA4\u542F\u7528\u81EA\u52A8\u4E0A\u4F20",
  "settings.auto_upload_confirm_msg": "\u5F00\u542F\u540E\u81EA\u52A8\u4E0A\u4F20\u9644\u4EF6\u5230\u9ED8\u8BA4\u670D\u52A1\uFF1A",
  "settings.auto_upload_need_default": "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u6307\u5B9A\u9ED8\u8BA4\u8D26\u53F7",
  "settings.auto_upload_confirm_again": "\u8BF7\u518D\u6B21\u786E\u8BA4\uFF01",
  // 视图界面
  "view.select_account": "\u9009\u62E9\u8D26\u6237",
  "view.no_account": "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u6DFB\u52A0\u8D26\u6237",
  "view.connect_failed": "\u274C \u8FDE\u63A5\u5931\u8D25: {error}",
  "view.error": "\u274C \u9519\u8BEF: {error}",
  "view.root": "\u{1F4C1} \u6839\u76EE\u5F55",
  "view.open_dir": "\u6253\u5F00\u76EE\u5F55",
  "view.insert": "\u63D2\u5165",
  "view.copy_url": "\u590D\u5236URL",
  "view.delete_btn": "\u{1F5D1} \u5220\u9664\u6240\u9009",
  "view.confirm_delete": "\u786E\u8BA4\u5220\u9664 ({count})",
  "view.delete_confirm_title": "\u786E\u8BA4\u5220\u9664",
  "view.delete_confirm_body": "\u786E\u5B9A\u8981\u5220\u9664\u4EE5\u4E0B {count} \u9879\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002",
  "view.delete_item": "\u{1F4C4} {name}",
  "view.delete_folder": "\u{1F4C1} {name}",
  "view.delete_and_more": "\u7B49 {count} \u9879",
  "view.rename_title": "\u91CD\u547D\u540D",
  "view.rename_label": "\u65B0\u6587\u4EF6\u540D",
  "view.rename_placeholder": "\u8BF7\u8F93\u5165\u65B0\u6587\u4EF6\u540D",
  "view.confirm_rename": "\u786E\u8BA4\u91CD\u547D\u540D",
  "view.refresh": "\u{1F504}",
  "view.file_count": "{count}/{total} \u9879\u5DF2\u9009",
  "view.select_all": "\u5168\u9009",
  "view.select_invert": "\u53CD\u9009",
  "view.upload_confirm_title": "\u{1F4E4} \u786E\u8BA4\u4E0A\u4F20\u9644\u4EF6",
  "view.upload_confirm_msg": "\u5C06\u4E0A\u4F20 {count} \u4E2A\u9644\u4EF6\u5230 {target}\uFF0C\u672C\u5730\u6587\u4EF6\u5C06\u88AB\u5220\u9664\u3002",
  "view.confirm_upload": "\u786E\u8BA4\u4E0A\u4F20",
  "view.cancel": "\u53D6\u6D88",
  "view.upload_btn": "\u4E0A\u4F20 {count} \u4E2A\u6587\u4EF6",
  "view.unsupported_type": "\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u7C7B\u578B",
  "view.browse_files": "\u6D4F\u89C8\u6587\u4EF6",
  "view.sign_check": "Sign \u68C0\u67E5",
  "view.sign_check_note": "\u68C0\u67E5\u5E76\u5237\u65B0\u5F53\u524D\u7B14\u8BB0\u7684 Sign",
  "view.sign_check_url": "\u68C0\u67E5\u5F53\u524D URL \u7684 Sign",
  "view.sign_fail_list": "CloudAttach Sign \u68C0\u67E5\u5931\u8D25\u5217\u8868:",
  "view.account": "\u8D26\u6237",
  "view.path": "\u8DEF\u5F84",
  "view.account_user": "\u7528\u6237",
  "view.account_storage_path": "\u5B58\u50A8\u8DEF\u5F84",
  "view.account_address": "\u5730\u5740",
  "view.account_bucket": "\u5B58\u50A8\u6876",
  "view.account_endpoint": "\u7AEF\u70B9",
  "view.account_prefix": "\u5B58\u50A8\u8DEF\u5F84",
  "view.network_error": "\u7F51\u7EDC\u9519\u8BEF",
  // 命令菜单
  "cmd.upload_current": "\u4E0A\u4F20\u5F53\u524D\u9644\u4EF6",
  "cmd.upload_all": "\u4E0A\u4F20\u7B14\u8BB0\u4E2D\u5168\u90E8\u9644\u4EF6",
  "cmd.check_sign": "\u68C0\u67E5\u5E76\u5237\u65B0\u5F53\u524D URL \u7684 Sign",
  "cmd.check_sign_note": "\u68C0\u67E5\u5E76\u5237\u65B0\u5F53\u524D\u7B14\u8BB0\u7684 Sign",
  // 右键菜单
  "menu.insert_note": "\u63D2\u5165\u5230\u7B14\u8BB0",
  "menu.insert_note_multi": "\u63D2\u5165\u5230\u7B14\u8BB0 ({count})",
  "menu.copy_link": "\u590D\u5236\u94FE\u63A5",
  "menu.rename": "\u91CD\u547D\u540D",
  "menu.select": "\u9009\u4E2D",
  "menu.deselect": "\u53D6\u6D88\u9009\u4E2D",
  "menu.refresh_current_url_sign": "\u5237\u65B0\u5F53\u524D URL Sign",
  "menu.refresh_all_note_sign": "\u5237\u65B0\u7B14\u8BB0\u6240\u6709 Sign",
  "menu.upload_current_attach": "\u4E0A\u4F20\u5F53\u524D\u9644\u4EF6",
  "menu.upload_to_cloud": "\u4E0A\u4F20\u5230\u4E91\u7AEF",
  "notice.file_not_linked": "\u672A\u627E\u5230\u5F15\u7528\u6B64\u6587\u4EF6\u7684\u7B14\u8BB0",
  "menu.upload_all_attach": "\u4E0A\u4F20\u7B14\u8BB0\u5168\u90E8\u9644\u4EF6",
  // 工具栏
  "toolbar.refresh_account": "\u5237\u65B0\u8D26\u6237",
  "cmd.open_browser": "\u2601\uFE0F \u4E91\u9644\u4EF6",
  "cmd.open_cloud_attach": "\u6253\u5F00\u4E91\u9644\u4EF6\u6D4F\u89C8\u5668",
  "cmd.reload_plugin": "\u91CD\u65B0\u52A0\u8F7D CloudAttach \u63D2\u4EF6",
  "cmd.check_and_refresh_note_sign": "\u68C0\u67E5\u5E76\u5237\u65B0\u5F53\u524D\u7B14\u8BB0\u7684 Sign",
  "cmd.check_and_refresh_url_sign": "\u68C0\u67E5\u5E76\u5237\u65B0\u5F53\u524D URL \u7684 Sign",
  "cmd.upload_current_attachment": "\u4E0A\u4F20\u5F53\u524D\u9644\u4EF6",
  "cmd.upload_all_in_note": "\u4E0A\u4F20\u7B14\u8BB0\u4E2D\u5168\u90E8\u9644\u4EF6",
  "settings.s3_type_label": "\u5BF9\u8C61\u5B58\u50A8 (S3)",
  "settings.please_fill_endpoint": "\u8BF7\u586B\u5199\u7AEF\u70B9",
  "settings.please_fill_bucket": "\u8BF7\u586B\u5199\u5B58\u50A8\u6876",
  "settings.please_fill_server": "\u8BF7\u586B\u5199\u670D\u52A1\u5668\u5730\u5740",
  "settings.please_fill_name": "\u8BF7\u586B\u5199\u8D26\u6237\u540D\u79F0",
  "settings.no_account_selected": "\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u8D26\u6237",
  "settings.no_folder_selected": "\u8BF7\u5148\u9009\u62E9\u4E0A\u4F20\u76EE\u5F55",
  "settings.s3_account_label": "S3 \u8D26\u6237 {n}",
  "settings.account_label": "\u8D26\u6237 {n}",
  "notice.sign_refreshed": "\u2705 Sign \u5DF2\u5237\u65B0",
  "notice.refresh_failed": "\u274C \u5237\u65B0\u5931\u8D25: {error}",
  "notice.url_invalid": "\u274C URL \u5931\u6548\uFF1A{reason}",
  "notice.no_attachment_found": "\u{1F4ED} \u7B14\u8BB0\u4E2D\u6CA1\u6709\u672C\u5730\u9644\u4EF6",
  "notice.upload_complete": "\u{1F4E4} \u4E0A\u4F20\u5B8C\u6210\uFF1A{parts}",
  "notice.url_parts_valid": "{count} \u4E2A\u6709\u6548",
  "notice.urls_refreshed": "\u2705 {count} \u4E2A\u5DF2\u5237\u65B0",
  "notice.urls_failed": "\u274C {count} \u4E2A\u5931\u8D25",
  "notice.urls_skipped": "{count} \u4E2A\u8DF3\u8FC7",
  "notice.upload_success_count": "\u2705 \u4E0A\u4F20\u6210\u529F {count} \u4E2A",
  "notice.upload_failed_count": "\u274C \u5931\u8D25 {count} \u4E2A",
  "notice.upload_skipped_count": "\u23ED\uFE0F \u8DF3\u8FC7 {count} \u4E2A",
  "error.local_file_not_found": "\u672C\u5730\u6587\u4EF6\u4E0D\u5B58\u5728",
  "error.unsupported_type": "\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u7C7B\u578B",
  "error.upload_failed": "\u4E0A\u4F20\u5931\u8D25: HTTP {status}",
  "error.s3_upload_failed": "S3 \u4E0A\u4F20\u5931\u8D25: HTTP {status}",
  "error.file_not_found": "\u6587\u4EF6\u4E0D\u5B58\u5728\uFF08\u53EF\u80FD\u5728\u670D\u52A1\u5668\u4E0A\u88AB\u5220\u9664\u6216\u79FB\u52A8\uFF09",
  "error.network_error": "\u7F51\u7EDC\u9519\u8BEF",
  "error.no_view_or_folder": "\u8BF7\u5148\u6253\u5F00 CloudAttach \u6807\u7B7E\u9875\u5E76\u9009\u62E9\u4E0A\u4F20\u76EE\u5F55",
  "error.no_default_account_set": "\u672A\u8BBE\u7F6E\u9ED8\u8BA4\u8D26\u53F7\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u9009\u62E9\u4E00\u4E2A\u9ED8\u8BA4\u8D26\u53F7",
  "error.no_account": "\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u8D26\u6237",
  "view.loading": "\u23F3 \u52A0\u8F7D\u4E2D...",
  "view.no_account_hint": "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u6DFB\u52A0\u8D26\u6237",
  "view.select_account_hint": "\u9009\u62E9\u8D26\u6237\u540E\u5F00\u59CB\u6D4F\u89C8",
  "view.no_account_selected": "\u274C \u672A\u9009\u62E9\u8D26\u6237",
  "view.empty_dir": "\u{1F4C2} \u7A7A\u76EE\u5F55",
  "view.plugin_title": "\u4E91\u9644\u4EF6",
  "view.breadcrumb_sep": " \u203A ",
  "settings.webdav_path_label": "WebDAV \u8DEF\u5F84",
  "settings.openlist_webdav_label": "OpenList / WebDAV",
  "settings.webdav_label": "WebDAV",
  "settings.webdav_path_placeholder": "",
  "settings.server_address_placeholder": "http://192.168.62.200:5244",
  "settings.endpoint_placeholder": "https://xxx.r2.cloudflarestorage.com",
  "settings.bucket_placeholder": "my-vault-attach",
  "settings.region_placeholder": "auto\uFF08Cloudflare R2 \u53EF\u7559\u7A7A\uFF09",
  "settings.cdn_url_placeholder": "https://cdn.example.com\uFF08\u9009\u586B\uFF0C\u7528\u4E8E\u62FC\u516C\u5171\u8BBF\u95EEURL\uFF09",
  "view.upload_to": '\u4E0A\u4F20\u5230\uFF1A<code style="background:var(--background-secondary);padding:2px 6px;border-radius:3px;">{path}</code>',
  "error.rebuild_failed": "\u91CD\u5EFA\u5931\u8D25: {error}",
  "error.sign_rebuild_failed": "\u8865 sign \u5931\u8D25: {error}",
  "error.cannot_extract_path": "\u65E0\u6CD5\u63D0\u53D6\u8DEF\u5F84\u6216\u7F3A\u5C11 Token",
  "settings.check_account_settings": "\u8BF7\u68C0\u67E5\u8D26\u6237\u8BBE\u7F6E"
});
Object.assign(I18n.translations.en, {
  "notice.sign_expired_403": "\u26A0\uFE0F Sign expired, please refresh",
  "notice.sign_invalid": "\u274C Sign invalid",
  "notice.sign_rebuild_failed": "\u26A0\uFE0F Sign rebuild failed: {error}",
  "notice.sign_ok": "\u2705 Sign valid, no refresh needed",
  "notice.check_start": "\u{1F50D} Checking {count} URLs...",
  "notice.check_complete": "\u2705 Check complete: {parts}",
  "notice.check_complete_partial": "\u{1F4CB} Check complete: {parts}",
  "notice.no_urls_in_note": "\u{1F4ED} No URLs found in note",
  "notice.no_attachment": "\u26A0\uFE0F No attachment found near cursor",
  "notice.no_url_near_cursor": "\u274C No URL found near cursor",
  "notice.open_note_first": "\u274C Please open a note first",
  "notice.no_file_selected": "\u26A0\uFE0F Please select a file first",
  "notice.file_not_found": "\u26A0\uFE0F File not found (may have been deleted or moved on server)",
  "notice.cannot_extract_path": "\u274C Cannot extract path or no Token",
  "notice.cannot_refresh": "\u274C Cannot extract path or no Token, cannot refresh",
  "notice.select_account_first": "\u274C Please select an account first",
  "notice.select_dir_first": "\u26A0\uFE0F Please select an upload folder in CloudAttach tab (cannot be root)",
  "notice.upload_start": "\u{1F4E4} Uploading {count} attachments...",
  "notice.upload_success": "\u2705 Uploaded {count} files",
  "notice.upload_partial": "\u26A0\uFE0F Partial success: {success} ok, {failed} failed",
  "notice.upload_all_failed": "\u274C All uploads failed",
  "notice.upload_failed": "\u274C Upload failed: {error}",
  "notice.file_deleted": "\u2705 Deleted local file: {path}",
  "notice.file_delete_failed": "\u274C Failed to delete local file: {error}",
  "notice.local_file_not_found": "\u274C Local file not found: {path}",
  "notice.copied_count": "\u{1F4CB} Copied {count} URLs",
  "notice.copied_count_links": "\u{1F4CB} Copied {count} links",
  "notice.copy_link_failed": "\u274C Failed to get link",
  "notice.inserted": "\u2705 Inserted: {name}",
  "notice.inserted_count": "\u2705 Inserted {count} files",
  "notice.open_note_first_insert": "\u274C Please open a note first",
  "notice.check_url": "\u{1F50D} Checking URL: {url}...",
  "notice.no_openlist_url": "\u26A0\uFE0F Not an OpenList URL, skip",
  "notice.not_my_url_skip": "\u26A0\uFE0F No matching account, skip",
  "notice.s3_upload_success": "\u2705 Upload success: {path}",
  "notice.s3_upload_failed": "\u274C S3 upload failed: {error}",
  "notice.s3_test_403": "\u2705 Connection OK (403 = no permission but signature valid)",
  "notice.s3_test_401": "\u274C Signature error (401), check AccessKey/SecretKey/Region",
  "notice.s3_test_404": "\u274C Bucket not found (404)",
  "notice.s3_test_ok": "\u2705 Connection successful!",
  "notice.s3_test_failed": "\u274C Failed status={status}",
  "notice.s3_test_error": "\u274C Connection error: {error}",
  "notice.plugin_reloaded": "\u2705 CloudAttach reloaded",
  "notice.delete_success": "\u2705 Deleted {count} item(s)",
  "notice.delete_partial": "\u26A0\uFE0F Deleted {success}, failed {failed}",
  "notice.delete_failed": "\u274C Delete failed: {error}",
  "notice.rename_conflict": "\u274C Rename failed: filename already exists",
  "notice.rename_failed": "\u274C Rename failed: {error}",
  "notice.rename_success": "\u2705 Renamed successfully",
  "notice.reload_failed": "\u274C Reload failed: {error}",
  "notice.connect_success": "\u2705 Connection successful",
  "notice.connect_failed": "\u274C Connection failed",
  // Error messages
  "error.rebuild_failed": "Rebuild failed: {error}",
  "error.sign_rebuild_failed": "Sign rebuild failed: {error}",
  "error.cannot_extract_path": "Cannot extract path or no Token",
  // Settings
  "settings.check_account_settings": "Please check account settings",
  // View
  "view.upload_to": 'Upload to: <code style="background:var(--background-secondary);padding:2px 6px;border-radius:3px;">{path}</code>',
  "settings.title": "CloudAttach Settings",
  "settings.account_name": "Account Name",
  "settings.add_account": "Add Account",
  "settings.save": "Save",
  "settings.saved": "\u2705 Settings saved",
  "settings.test": "Test",
  "settings.edit": "Edit",
  "settings.edit_account": "Edit Account",
  "settings.delete": "Delete",
  "settings.move_up": "Move Up",
  "settings.move_down": "Move Down",
  "settings.server_address": "Server Address",
  "settings.endpoint": "Endpoint",
  "settings.bucket": "Bucket",
  "settings.region": "Region",
  "settings.prefix": "Storage Path (optional)",
  "settings.prefix_placeholder": "obsidian/, root by default",
  "settings.username": "Username",
  "settings.password": "Password",
  "settings.token": "Token (optional)",
  "settings.token_hint": "Get from OpenList admin panel, leave blank for no signing",
  "settings.access_key": "Access Key ID",
  "settings.secret_key": "Secret Key",
  "settings.public_url": "Custom Host",
  "settings.public_url_hint": "auto (Cloudflare R2 can leave blank)",
  "settings.cdn_url": "CDN URL (optional)",
  "settings.cdn_url_hint": "https://cdn.example.com (optional, for public access URL)",
  "settings.storage_type": "Storage Type",
  "settings.openlist": "Object Storage",
  "settings.openlist_desc": "Connect OpenList to manage cloud attachments",
  "settings.advanced": "Advanced",
  "settings.advanced_title": "Advanced Settings",
  "settings.preview_category": "File Preview",
  "settings.pdf_preview": "PDF Preview Method",
  "settings.pdf_preview_iframe": "iframe (default)",
  "settings.pdf_preview_pdfjs": "PDF.js",
  "settings.pdfjs_auto_install": "(auto-install on save ~1.6MB)",
  "settings.pdfjs_installed": "(installed)",
  "settings.pdfjs_installing": "Installing PDF.js...",
  "settings.pdfjs_downloaded": "PDF.js (installed)",
  "settings.pdfjs_uninstall": "Uninstall",
  "settings.excel_preview": "Excel Preview Method",
  "settings.excel_preview_iframe": "iframe (default)",
  "settings.excel_preview_sheetjs": "SheetJS",
  "settings.word_preview": "Word Preview Method",
  "settings.word_preview_iframe": "iframe (default)",
  "settings.word_preview_mammoth": "mammoth.js",
  "settings.preview_coming_soon": "Coming soon...",
  "settings.s3": "Object Storage (S3)",
  "settings.s3_desc": "S3-compatible object storage",
  "settings.account_name_placeholder": "e.g.: My COS Bucket",
  "settings.folder_required": "\u26A0\uFE0F Please select a folder to upload to, cannot be root",
  "settings.set_as_default": "\u2605 Set as Default",
  "settings.unset_default": "\u2606 Unset Default",
  "settings.is_default": "Default",
  "settings.default_account": "Default Account",
  "settings.auto_upload": "Auto Upload",
  "settings.auto_upload_desc": "Auto upload attachments to default service",
  "settings.auto_upload_confirm_title": "Enable Auto Upload",
  "settings.auto_upload_confirm_msg": "Auto upload attachments to default service when enabled:",
  "settings.auto_upload_need_default": "Please set a default account in Settings first",
  "settings.auto_upload_confirm_again": "Please confirm again!",
  "view.select_account": "Select Account",
  "view.no_account": "Please add an account in Settings first",
  "view.upload_to_current_path": "Upload to current CloudAttach path",
  "view.upload_to_default_account": "Upload to default account",
  "view.no_default_account_hint": "Please set a default account in Settings first",
  "view.connect_failed": "\u274C Connection failed: {error}",
  "view.error": "\u274C Error: {error}",
  "view.root": "\u{1F4C1} Root",
  "view.open_dir": "Open",
  "view.insert": "Insert",
  "view.copy_url": "Copy URL",
  "view.delete_btn": "\u{1F5D1} Delete",
  "view.confirm_delete": "Delete ({count})",
  "view.delete_confirm_title": "Confirm Delete",
  "view.delete_confirm_body": "Delete {count} item(s)? This cannot be undone.",
  "view.delete_item": "\u{1F4C4} {name}",
  "view.delete_folder": "\u{1F4C1} {name}",
  "view.delete_and_more": "and {count} more",
  "view.rename_title": "Rename",
  "view.rename_label": "New name",
  "view.rename_placeholder": "Enter new filename",
  "view.confirm_rename": "Rename",
  "view.refresh": "\u{1F504}",
  "view.file_count": "{count}/{total} selected",
  "view.select_all": "Select All",
  "view.select_invert": "Invert",
  "view.upload_confirm_title": "\u{1F4E4} Confirm Upload",
  "view.upload_confirm_msg": "Will upload {count} attachments to {target}, local files will be deleted.",
  "view.confirm_upload": "Confirm Upload",
  "view.cancel": "Cancel",
  "view.upload_btn": "Upload {count} files",
  "view.unsupported_type": "Unsupported file type",
  "view.browse_files": "Browse Files",
  "view.sign_check": "Sign Check",
  "view.sign_check_note": "Check and refresh Sign in current note",
  "view.sign_check_url": "Check current URL Sign",
  "view.sign_fail_list": "CloudAttach Sign check failure list:",
  "view.account": "Account",
  "view.path": "Path",
  "view.account_user": "User",
  "view.account_storage_path": "Storage Path",
  "view.account_address": "Address",
  "view.account_bucket": "Bucket",
  "view.account_endpoint": "Endpoint",
  "view.account_prefix": "Storage Path",
  "view.network_error": "Network Error",
  "cmd.upload_current": "Upload Current Attachment",
  "cmd.upload_all": "Upload All Attachments in Note",
  "cmd.check_sign": "Check and refresh current URL Sign",
  "cmd.check_sign_note": "Check and refresh current note Sign",
  "cmd.open_browser": "\u2601\uFE0F Cloud Attach",
  "cmd.open_cloud_attach": "Open Cloud Attach Browser",
  "cmd.reload_plugin": "Reload CloudAttach Plugin",
  "cmd.check_and_refresh_note_sign": "Check and refresh current note Sign",
  "cmd.check_and_refresh_url_sign": "Check and refresh current URL Sign",
  "cmd.upload_current_attachment": "Upload Current Attachment",
  "cmd.upload_all_in_note": "Upload All Attachments in Note",
  "menu.insert_note": "Insert into Note",
  "menu.insert_note_multi": "Insert into Note ({count})",
  "menu.copy_link": "Copy Link",
  "menu.rename": "Rename",
  "menu.select": "Select",
  "menu.deselect": "Deselect",
  "menu.refresh_current_url_sign": "Refresh Current URL Sign",
  "menu.refresh_all_note_sign": "Refresh All Sign in Note",
  "menu.upload_current_attach": "Upload Current Attachment",
  "menu.upload_to_cloud": "Upload to Cloud",
  "notice.file_not_linked": "No note found referencing this file",
  "menu.upload_all_attach": "Upload All Attachments in Note",
  "toolbar.refresh_account": "Refresh Account",
  "settings.s3_type_label": "Object Storage (S3)",
  "settings.please_fill_endpoint": "Please fill in the endpoint",
  "settings.please_fill_bucket": "Please fill in the bucket",
  "settings.please_fill_server": "Please fill in the server address",
  "settings.please_fill_name": "Please fill in the account name",
  "settings.no_account_selected": "Please select an account first",
  "settings.no_folder_selected": "Please select an upload folder first",
  "settings.s3_account_label": "S3 Account {n}",
  "settings.account_label": "Account {n}",
  "notice.sign_refreshed": "\u2705 Sign refreshed",
  "notice.refresh_failed": "\u274C Refresh failed: {error}",
  "notice.url_invalid": "\u274C URL invalid: {reason}",
  "notice.no_attachment_found": "\u{1F4ED} No attachments found in note",
  "notice.upload_complete": "\u{1F4E4} Upload complete: {parts}",
  "notice.url_parts_valid": "{count} valid",
  "notice.urls_refreshed": "\u2705 {count} refreshed",
  "notice.urls_failed": "\u274C {count} failed",
  "notice.urls_skipped": "{count} skipped",
  "notice.upload_success_count": "\u2705 Uploaded {count} files",
  "notice.upload_failed_count": "\u274C Failed {count}",
  "notice.upload_skipped_count": "\u23ED\uFE0F Skipped {count}",
  "error.local_file_not_found": "Local file not found",
  "error.unsupported_type": "Unsupported file type",
  "error.upload_failed": "Upload failed: HTTP {status}",
  "error.s3_upload_failed": "S3 upload failed: HTTP {status}",
  "error.file_not_found": "File not found (may have been deleted or moved on server)",
  "error.network_error": "Network error",
  "error.no_view_or_folder": "Please open CloudAttach tab and select an upload folder",
  "error.no_default_account_set": "No default account set. Please set one in settings.",
  "error.no_account": "Please select an account first",
  "view.loading": "\u23F3 Loading...",
  "view.no_account_hint": "Please add an account in Settings first",
  "view.select_account_hint": "Select an account to start browsing",
  "view.no_account_selected": "\u274C No account selected",
  "view.empty_dir": "\u{1F4C2} Empty directory",
  "view.plugin_title": "CloudAttach",
  "view.breadcrumb_sep": " \u203A ",
  "settings.webdav_path_label": "WebDAV Path",
  "settings.openlist_webdav_label": "OpenList / WebDAV",
  "settings.webdav_label": "WebDAV",
  "settings.webdav_path_placeholder": "",
  "settings.server_address_placeholder": "http://192.168.62.200:5244",
  "settings.endpoint_placeholder": "https://xxx.r2.cloudflarestorage.com",
  "settings.bucket_placeholder": "my-vault-attach",
  "settings.region_placeholder": "auto (can leave blank for Cloudflare R2)",
  "settings.cdn_url_placeholder": "https://cdn.example.com (optional)"
});
function t(key, params = {}) {
  let str = I18n.t(key);
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return str;
}
var OpenListClient = class {
  constructor(account, app) {
    this.serverUrl = account.url.replace(/\/$/, "");
    this.baseUrl = this.serverUrl;
    this.webdavPath = (account.webdavPath || "").replace(/\/$/, "");
    this.token = account.token || "";
    this.username = account.username;
    this.password = account.password;
    this.publicUrl = account.publicUrl?.replace(/\/$/, "") || "";
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
      const qIdx = url.indexOf("?");
      const path = qIdx >= 0 ? url.substring(0, qIdx) : url;
      const query = qIdx >= 0 ? url.substring(qIdx) : "";
      let decoded = path;
      for (let i = 0; i < 5; i++) {
        const next = decodeURIComponent(decoded);
        if (next === decoded)
          break;
        decoded = next;
      }
      const safePath = decoded.replace(/[\s#?&<>"'\\|{}]/g, (c) => encodeURIComponent(c));
      return safePath + query;
    } catch (e) {
      return url;
    }
  }
  /**
   * 登录获取 token（用于 API 操作）
   * @returns {Promise<boolean>}
   */
  async login() {
    if (this.token)
      return true;
    if (!this.username || !this.password)
      return false;
    try {
      const url = `${this.serverUrl}/api/auth/login`;
      const response = await this.requestViaObsidian(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: this.username, password: this.password })
      });
      if (response.ok) {
        const data = JSON.parse(response.text);
        if (data.code === 200 && data.data?.token) {
          this.token = data.data.token;
          console.log("[CloudAttach] login success, token:", this.token.substring(0, 20) + "...");
          return true;
        }
      }
      console.log("[CloudAttach] login failed:", response.text);
      return false;
    } catch (e) {
      console.log("[CloudAttach] login error:", e.message);
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
    let requestUrl = null;
    try {
      requestUrl = require("obsidian").requestUrl;
    } catch (e) {
      requestUrl = globalThis.requestUrl || this.app?.requestUrl;
    }
    console.log("[CloudAttach] requestViaObsidian url:", url.substring(0, 80), "hasRequestUrl:", !!requestUrl);
    if (requestUrl) {
      try {
        const result = await requestUrl({
          url,
          method: options.method || "GET",
          headers: options.headers || {},
          body: options.body || void 0
        });
        console.log("[CloudAttach] requestUrl result:", result.status);
        return {
          status: result.status,
          text: result.text,
          ok: result.status >= 200 && result.status < 300
        };
      } catch (e) {
        console.error("[CloudAttach] requestUrl error:", e.message || e);
        let status = 0;
        let text = "";
        const errStr = e.message || String(e);
        const statusMatch = errStr.match(/status\s+(\d+)/i);
        if (statusMatch) {
          status = parseInt(statusMatch[1], 10);
        } else if (typeof e.status === "number") {
          status = e.status;
        } else if (e.response && typeof e.response.status === "number") {
          status = e.response.status;
        }
        if (e.text) {
          text = e.text;
        } else if (e.response?.text) {
          text = e.response.text;
        } else if (e.json && typeof e.json === "function") {
          try {
            text = JSON.stringify(e.json());
          } catch {
          }
        }
        if (status === 207) {
          return { ok: true, status, text };
        }
        return { ok: false, status, reason: status > 0 ? "http_error" : "network_error", error: errStr, text };
      }
    }
    console.log("[CloudAttach] falling back to fetch");
    const fetchResp = await fetch(url, {
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body || void 0
    });
    return {
      status: fetchResp.status,
      text: await fetchResp.text(),
      ok: fetchResp.ok
    };
  }
  /**
   * 通过 Obsidian requestUrl 获取二进制数据（用于 PDF 等文件）
   * @returns {Promise<Uint8Array|null>}
   */
  async requestBinary(url) {
    let requestUrl = null;
    try {
      requestUrl = require("obsidian").requestUrl;
    } catch (e) {
      requestUrl = globalThis.requestUrl || this.app?.requestUrl;
    }
    if (requestUrl) {
      try {
        const result = await requestUrl({ url, method: "GET", throw: false });
        if (result.status >= 200 && result.status < 300) {
          if (result.arrayBuffer) {
            return new Uint8Array(result.arrayBuffer);
          } else if (result.blob) {
            const buf = await result.blob.arrayBuffer();
            return new Uint8Array(buf);
          } else if (result.text) {
            const bytes = new TextEncoder().encode(result.text);
            return bytes;
          }
        }
        console.error("[CloudAttach] requestBinary failed, status:", result.status);
        return null;
      } catch (e) {
        console.error("[CloudAttach] requestBinary error:", e.message);
        return null;
      }
    }
    try {
      const resp = await fetch(url);
      if (!resp.ok)
        return null;
      const buf = await resp.arrayBuffer();
      return new Uint8Array(buf);
    } catch (e) {
      console.error("[CloudAttach] requestBinary fetch error:", e.message);
      return null;
    }
  }
  /**
   * 带认证的 API 请求（token 优先，401 fallback 到 login）
   */
  async authFetch(path, options = {}) {
    if (!this.token && !await this.login()) {
      return { status: 401, text: '{"code":401,"message":"Authentication required"}', ok: false };
    }
    const url = `${this.baseUrl}${path}`;
    const headers = {
      ...options.headers,
      "Authorization": this.token
    };
    let response = await this.requestViaObsidian(url, { ...options, headers });
    let tokenInvalidated = response.status === 401;
    if (response.status === 200 && response.text) {
      try {
        const json = JSON.parse(response.text);
        if (json.code === 401) {
          console.log("[CloudAttach] token invalidated (body.code=401):", json.message);
          tokenInvalidated = true;
        }
      } catch (e) {
      }
    }
    if (tokenInvalidated && this.username && this.password) {
      console.log("[CloudAttach] token expired, re-login");
      this.token = "";
      if (await this.login()) {
        const newAuth = this.token;
        console.log("[CloudAttach] re-login done, new Authorization:", newAuth.substring(0, 30) + "...");
        response = await this.requestViaObsidian(url, {
          ...options,
          headers: { ...options.headers, "Authorization": newAuth }
        });
      }
    }
    return response;
  }
  async getSignedUrl(remotePath, preferredPrefix = "p") {
    let virtualPath = remotePath;
    if (this.webdavPath && this.webdavPath !== "/dav") {
      const davPrefix = "/dav";
      if (this.webdavPath.startsWith(davPrefix)) {
        const pathSuffix = this.webdavPath.slice(davPrefix.length);
        virtualPath = pathSuffix + (remotePath.startsWith("/") ? remotePath : "/" + remotePath);
      }
    }
    const apiUrl = `${this.serverUrl}/api/fs/get`;
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.token) {
      headers["Authorization"] = this.token;
    }
    try {
      console.log("[CloudAttach] getSignedUrl calling API:", apiUrl, "path:", remotePath, "prefix:", preferredPrefix);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          path: virtualPath
        })
      });
      const data = await response.json();
      console.log("[CloudAttach] getSignedUrl response:", data);
      if (data.code === 200) {
        let newUrl = this.safeDecodeUrl(data.data.raw_url);
        newUrl = newUrl.replace(/\/(d|p)\//, `/${preferredPrefix}/`);
        return newUrl;
      }
      const errMsg = data.message || `API error ${data.code}`;
      throw new Error(`[CloudAttach] Sign \u8BF7\u6C42\u5931\u8D25: ${errMsg}`);
    } catch (e) {
      console.log("[CloudAttach] API call failed:", e.message);
      throw e;
    }
  }
  // 获取文件的 WebDAV URL（用于插入到笔记）
  getFileUrl(remotePath) {
    if (this.publicUrl) {
      let base = this.publicUrl;
      const proto2 = base.match(/^https?:/) ? "" : this.serverUrl.match(/^https?:/)?.[0] || "http:";
      if (!base.startsWith("http"))
        base = `${proto2}//${base}`;
      base = base.replace(/\/+$/, "");
      let path = remotePath;
      const decodedWebdavPath = decodeURIComponent(this.webdavPath || "");
      console.log("[CloudAttach] getFileUrl decode - webdavPath:", JSON.stringify(this.webdavPath), "decoded:", JSON.stringify(decodedWebdavPath), "remotePath:", JSON.stringify(remotePath));
      if (path.startsWith(decodedWebdavPath)) {
        path = path.slice(decodedWebdavPath.length) || "/";
        console.log("[CloudAttach] getFileUrl stripped, result:", JSON.stringify(path));
      } else {
        console.log("[CloudAttach] getFileUrl path NOT start with decodedWebdavPath");
      }
      const encodedPath2 = path.replace(/[\s#?&<>"'\\|{}]/g, (c) => encodeURIComponent(c));
      return `${base}${encodedPath2}`;
    }
    const webdavPath = this.webdavPath || "";
    const proto = this.serverUrl.replace(/^((https?|http):\/\/)(.*)/, "$1");
    const host = this.serverUrl.replace(/^((https?|http):\/\/)(.*)/, "$3");
    const fullPath = webdavPath + remotePath;
    const encodedPath = fullPath.replace(/[\s#?&<>"'\\|{}]/g, (c) => encodeURIComponent(c));
    return `${proto}${host}${encodedPath}`;
  }
  // 获取原始 URL（无签名、无 /dav /d 前缀，用于 iframe 预览）
  getRawUrl(remotePath) {
    let virtualPath = remotePath;
    if (this.webdavPath && this.webdavPath !== "/dav" && this.webdavPath.startsWith("/dav")) {
      const pathSuffix = this.webdavPath.slice("/dav".length);
      virtualPath = pathSuffix + (remotePath.startsWith("/") ? remotePath : "/" + remotePath);
    }
    if (this.publicUrl) {
      let base = this.publicUrl;
      const proto2 = base.match(/^https?:/) ? "" : this.serverUrl.match(/^https?:/)?.[0] || "http:";
      if (!base.startsWith("http"))
        base = `${proto2}//${base}`;
      base = base.replace(/\/+$/, "");
      return `${base}${virtualPath}`;
    }
    const proto = this.serverUrl.replace(/^((https?|http):\/\/)(.*)/, "$1");
    const host = this.serverUrl.replace(/^((https?|http):\/\/)(.*)/, "$3");
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
      const match = url.match(/^https?:\/\/[^\/]+\/\w+\/(.+?)(?:\?|$)/);
      if (!match)
        return null;
      let pathSegment = match[1];
      pathSegment = pathSegment.split("?")[0].split("&")[0];
      return "/" + pathSegment;
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
      return url.replace(/[?&]sign=[^&]*/g, "").replace(/&$/, "").replace(/\?$/, "");
    }
  }
  /**
   * 在文本中查找并替换 URL（简化版：遍历文本中的 URL，解码后比对路径）
   */
  findAndReplaceUrl(text, realPath, newUrl) {
    const urlRegex = /https?:\/\/[^\s()"']+/g;
    const matches = text.match(urlRegex);
    if (!matches)
      return text;
    const newUrlClean = newUrl.split("?")[0];
    const newUrlPath = newUrlClean.replace(/^https?:\/\/[^\/]+/, "");
    const newUrlDecoded = decodeURIComponent(newUrlPath);
    const newUrlNormalized = newUrlDecoded.replace(/^\/(p|d)\//, "/").replace(/^\/+|\/+$/g, "");
    let newText = text;
    for (const foundUrl of matches) {
      try {
        const foundUrlClean = foundUrl.split("?")[0];
        const foundUrlPath = foundUrlClean.replace(/^https?:\/\/[^\/]+/, "");
        const foundUrlDecoded = decodeURIComponent(foundUrlPath);
        const foundUrlNormalized = foundUrlDecoded.replace(/^\/(p|d)\//, "/").replace(/^\/+|\/+$/g, "");
        if (foundUrlNormalized === newUrlNormalized) {
          console.log("[CloudAttach] findAndReplaceUrl: exact match " + foundUrlNormalized + ", replacing: " + foundUrl.substring(0, 80) + "...");
          const newSignMatch = newUrl.match(/\?sign=([^\s"']+)/);
          const newSign = newSignMatch ? "?sign=" + newSignMatch[1] : "";
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
    if (!url || typeof url !== "string")
      return url || "";
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
        method: "HEAD",
        headers: {}
      });
      if (response.ok) {
        return { ok: true, status: response.status, reason: "valid" };
      }
      if (response.status === 403 || response.status === 401) {
        return { ok: false, status: response.status, reason: "sign_expired" };
      }
      if (response.status === 404) {
        return { ok: false, status: 404, reason: "file_not_found" };
      }
      return { ok: false, status: response.status, reason: "http_error" };
    } catch (e) {
      return { ok: false, status: 0, reason: "network_error", error: e.message };
    }
  }
  async testConnection() {
    try {
      if (this.webdavPath) {
        const webdavUrl = `${this.serverUrl}${this.webdavPath}/`;
        const response2 = await this.requestViaObsidian(webdavUrl, {
          method: "PROPFIND",
          headers: {
            "Authorization": "Basic " + btoa(`${this.username}:${this.password}`),
            "Depth": "0"
          }
        });
        if (response2.ok || response2.status === 207)
          return true;
      }
      const apiUrl = `${this.serverUrl}/api/fs/list`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": this.token || ""
        },
        body: JSON.stringify({
          path: "/",
          password: this.password || "",
          username: this.username || "",
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
    return path.split("/").map((seg) => encodeURIComponent(seg)).join("/");
  }
  async delete(paths) {
    const results = { success: [], failed: [] };
    for (const fullPath of paths) {
      try {
        if (this.username && this.password) {
          const url = `${this.serverUrl}${this.encodePath(this.webdavPath + fullPath)}`;
          console.log("[CloudAttach] delete WebDAV DELETE:", url);
          const response2 = await this.requestViaObsidian(url, {
            method: "DELETE",
            headers: {
              "Authorization": "Basic " + btoa(`${this.username}:${this.password}`)
            }
          });
          console.log("[CloudAttach] delete WebDAV response status:", response2.status);
          if (response2.ok || response2.status === 204) {
            results.success.push(fullPath);
          } else {
            results.failed.push({ path: fullPath, error: response2.text || `HTTP ${response2.status}` });
          }
          continue;
        }
        const dir = fullPath.substring(0, fullPath.lastIndexOf("/")).replace(/\/\/$/, "") || "/";
        const name = fullPath.substring(fullPath.lastIndexOf("/") + 1);
        console.log("[CloudAttach] delete API:", dir, "names:", [name]);
        const body = JSON.stringify({ dir, names: [name] });
        console.log("[CloudAttach] delete request body:", body);
        const response = await this.authFetch("/api/fs/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body
        });
        console.log("[CloudAttach] delete response status:", response.status, "text:", response.text);
        if (response.status === 200 && response.text) {
          try {
            const json = JSON.parse(response.text);
            console.log("[CloudAttach] delete response json:", json);
            if (json.code === 200) {
              results.success.push(fullPath);
            } else {
              results.failed.push({ path: fullPath, error: json.message || "Delete failed" });
            }
          } catch (parseErr) {
            console.error("[CloudAttach] delete parse error:", parseErr);
            results.failed.push({ path: fullPath, error: "Parse response failed" });
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
    const cleanPath = path.replace(/\/$/, "");
    if (this.username && this.password) {
      const srcUrl = `${this.serverUrl}${this.encodePath(this.webdavPath + path)}`;
      const dstDir = cleanPath.substring(0, cleanPath.lastIndexOf("/"));
      const dstPath = `${dstDir}/${newName}`;
      const dstUrl = `${this.serverUrl}${this.encodePath(this.webdavPath + dstPath)}`;
      console.log("[CloudAttach] rename WebDAV MOVE: src:", srcUrl, "dst:", dstUrl);
      const response2 = await this.requestViaObsidian(srcUrl, {
        method: "MOVE",
        headers: {
          "Authorization": "Basic " + btoa(`${this.username}:${this.password}`),
          "Destination": dstUrl
        }
      });
      console.log("[CloudAttach] rename WebDAV response status:", response2.status);
      if (response2.status !== 201 && response2.status !== 204 && !response2.ok) {
        throw new Error(response2.text || "Rename failed");
      }
      return;
    }
    const response = await this.authFetch("/api/fs/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        src_dir: cleanPath.substring(0, cleanPath.lastIndexOf("/")),
        src_name: cleanPath.substring(cleanPath.lastIndexOf("/") + 1),
        dst_dir: cleanPath.substring(0, cleanPath.lastIndexOf("/")),
        dst_name: newName
      })
    });
    if (!response.ok) {
      throw new Error(response.text || "Rename failed");
    }
  }
  async listDirectory(remotePath = "/") {
    if (this.webdavPath)
      return this.listDirectoryWebDAV(remotePath);
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
      const file = this.app.vault.getAbstractFileByPath(localPath);
      if (!file) {
        return { ok: false, error: t("error.local_file_not_found") };
      }
      const fileName = file.name;
      const normalizedDir = remoteDir.endsWith("/") ? remoteDir : remoteDir + "/";
      const remotePath = normalizedDir + fileName;
      let content;
      if (file instanceof require("obsidian").TFile) {
        content = await this.app.vault.readBinary(file);
      } else {
        return { ok: false, error: t("error.unsupported_type") };
      }
      const encodedPath = this.encodePath ? this.encodePath(remotePath) : encodeURIComponent(remotePath);
      const uploadUrl = `${this.serverUrl}${this.webdavPath}${encodedPath}`;
      console.log("[CloudAttach] \u4E0A\u4F20\u6587\u4EF6:", localPath, "->", uploadUrl);
      const response = await this.requestViaObsidian(uploadUrl, {
        method: "PUT",
        headers: {
          "Authorization": "Basic " + btoa(`${this.username}:${this.password}`),
          "Content-Type": this.getMimeType(fileName)
        },
        body: content
      });
      if (response.ok || response.status === 201 || response.status === 204) {
        const url = this.token ? await this.getSignedUrl(remotePath) : this.getFileUrl(remotePath);
        return { ok: true, remotePath, url };
      } else {
        return { ok: false, error: t("error.upload_failed", { status: response.status }) };
      }
    } catch (e) {
      console.error("[CloudAttach] uploadFile error:", e);
      return { ok: false, error: e.message };
    }
  }
  getMimeType(filename) {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const mimeTypes = {
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png",
      "gif": "image/gif",
      "webp": "image/webp",
      "svg": "image/svg+xml",
      "pdf": "application/pdf",
      "mp4": "video/mp4",
      "mov": "video/quicktime",
      "mp3": "audio/mpeg",
      "wav": "audio/wav",
      "zip": "application/zip",
      "doc": "application/msword",
      "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "xls": "application/vnd.ms-excel",
      "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "md": "text/markdown",
      "txt": "text/plain",
      "html": "text/html"
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
  async listDirectoryWebDAV(remotePath) {
    const webdavUrl = `${this.serverUrl}${this.webdavPath}${remotePath}`;
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:"><D:prop><D:displayname/><D:getcontentlength/><D:getlastmodified/><D:resourcetype/></D:prop></D:propfind>`;
    const response = await this.requestViaObsidian(webdavUrl, {
      method: "PROPFIND",
      headers: {
        "Authorization": "Basic " + btoa(`${this.username}:${this.password}`),
        "Content-Type": "application/xml",
        "Depth": "1"
      },
      body: propfindBody
    });
    if (!response.ok && response.status !== 207)
      throw new Error(`WebDAV error: ${response.status}`);
    let text = response.text;
    if (!text) {
      console.log("[CloudAttach] WebDAV 207 response text is empty, retrying with fetch");
      const fetchResp = await fetch(webdavUrl, {
        method: "PROPFIND",
        headers: {
          "Authorization": "Basic " + btoa(`${this.username}:${this.password}`),
          "Content-Type": "application/xml",
          "Depth": "1"
        },
        body: propfindBody
      });
      text = await fetchResp.text();
      console.log("[CloudAttach] fetch retry status:", fetchResp.status, "text length:", text?.length || 0);
    }
    const files = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");
    let responses = doc.getElementsByTagNameNS("DAV:", "response");
    if (responses.length === 0) {
      const upper = doc.getElementsByTagName("D:response");
      const lower = doc.getElementsByTagName("d:response");
      responses = upper.length > 0 ? upper : lower;
    }
    console.log("[CloudAttach] WebDAV raw response text (first 800):", text.substring(0, 800));
    console.log("[CloudAttach] d:response count:", responses.length);
    const parseError = doc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
      console.error("[CloudAttach] WebDAV XML parse error:", parseError[0].textContent?.substring(0, 200));
    }
    if (responses.length === 0) {
      const allElements = doc.getElementsByTagName("*");
      const tagNames = [];
      for (let i = 0; i < Math.min(allElements.length, 20); i++)
        tagNames.push(allElements[i].tagName);
      console.log("[CloudAttach] XML elements found (sample):", tagNames.join(", "));
    }
    function getTag(el, prefix, localName) {
      const ns = el.getElementsByTagNameNS("DAV:", localName);
      if (ns.length > 0)
        return ns[0];
      const upper = el.getElementsByTagName(prefix + ":" + localName);
      if (upper.length > 0)
        return upper[0];
      const lower = el.getElementsByTagName(prefix.toLowerCase() + ":" + localName);
      return lower[0] || null;
    }
    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const hrefEl = getTag(resp, "D", "href") || getTag(resp, "d", "href");
      const href = hrefEl?.textContent || "";
      const displayNameEl = getTag(resp, "D", "displayname") || getTag(resp, "d", "displayname");
      const displayName = displayNameEl?.textContent || "";
      const contentLengthEl = getTag(resp, "D", "getcontentlength") || getTag(resp, "d", "getcontentlength");
      const contentLength = parseInt(contentLengthEl?.textContent || "0");
      const collUpper = resp.getElementsByTagName("D:collection");
      const collLower = resp.getElementsByTagName("d:collection");
      const isDirectory = collUpper.length > 0 || collLower.length > 0;
      let decodedHref = decodeURIComponent(href);
      if (decodedHref.startsWith("http")) {
        try {
          const url = new URL(decodedHref);
          decodedHref = url.pathname;
          console.log("[CloudAttach] WebDAV: href \u662F\u5B8C\u6574 URL\uFF0C\u63D0\u53D6\u8DEF\u5F84:", url.pathname);
        } catch (e) {
          console.warn("[CloudAttach] WebDAV: \u89E3\u6790 href URL \u5931\u8D25:", decodedHref);
        }
      }
      let name = displayName;
      if (!name) {
        const parts = decodedHref.split("/").filter((p) => p);
        name = parts.length > 0 ? parts[parts.length - 1] : decodedHref;
      }
      let relativePath = decodedHref;
      const decodedWebdavPath = decodeURIComponent(this.webdavPath || "");
      console.log("[CloudAttach] listDirectory decode - webdavPath:", JSON.stringify(this.webdavPath), "decoded:", JSON.stringify(decodedWebdavPath), "decodedHref:", JSON.stringify(decodedHref));
      if (relativePath.startsWith(decodedWebdavPath)) {
        relativePath = relativePath.slice(decodedWebdavPath.length) || "/";
      }
      if (relativePath === remotePath || relativePath === remotePath + "/")
        continue;
      files.push({ name, path: relativePath, isDirectory, size: contentLength });
      if (files.length <= 3)
        console.log("[CloudAttach] listDir path:", JSON.stringify(relativePath));
    }
    if (responses.length > 0 && files.length === 0) {
      console.warn("[CloudAttach] WebDAV: XML\u89E3\u6790\u5230", responses.length, "\u6761\u76EE\u4F46\u5168\u90E8\u88AB\u8FC7\u6EE4\uFF0CremotePath=", remotePath, "webdavPath=", this.webdavPath);
    }
    return files.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory)
        return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
  async listDirectoryAPI(remotePath = "/") {
    const apiUrl = `${this.serverUrl}/api/fs/list`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": this.token || ""
      },
      body: JSON.stringify({
        path: remotePath,
        password: this.password || "",
        username: this.username || "",
        page: 1,
        per_page: 0
      })
    });
    if (!response.ok)
      throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    console.log("[CloudAttach] listDirectory response:", data);
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
      if (a.isDirectory !== b.isDirectory)
        return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
};
var S3Client = class {
  constructor(account, app) {
    this.app = app;
    this.endpoint = account.endpoint?.replace(/\/$/, "") || "";
    this.bucket = account.bucket || "";
    this.region = account.region || "";
    this.accessKey = account.accessKey || "";
    this.secretKey = account.secretKey || "";
    this.publicUrl = account.publicUrl?.replace(/\/$/, "") || "";
    this.prefix = account.prefix ? account.prefix.replace(/^\/+|\/+$/g, "") + "/" : "";
  }
  /**
   * 通过 Obsidian requestUrl 发请求，绕过 CORS
   */
  async requestViaObsidian(url, options = {}) {
    let requestUrl = null;
    try {
      requestUrl = require("obsidian").requestUrl;
    } catch {
      requestUrl = globalThis.requestUrl || this.app?.requestUrl;
    }
    if (requestUrl) {
      try {
        const result = await requestUrl({
          url,
          method: options.method || "GET",
          headers: options.headers || {},
          body: options.body || void 0
        });
        return {
          status: result.status,
          text: result.text,
          ok: result.status >= 200 && result.status < 300
        };
      } catch (e) {
        const errStr = e.message || String(e);
        const statusMatch = errStr.match(/status\s+(\d+)/i);
        const status = statusMatch ? parseInt(statusMatch[1], 10) : e.status || 0;
        return { ok: false, status, error: errStr, text: "" };
      }
    }
    const resp = await fetch(url, {
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body || void 0
    });
    return { status: resp.status, ok: resp.ok, text: await resp.text().catch(() => "") };
  }
  /**
   * 列出目录内容
   * @param {string} remotePath - 远程路径，如 "/" 或 "/folder/"
   * @returns {Promise<Array>} 文件列表
   */
  async listDirectory(remotePath = "/") {
    try {
      const cleanPath = remotePath === "/" ? "" : remotePath.replace(/^\/|\/$/g, "");
      const basePrefix = this.prefix ? this.prefix.replace(/\/$/, "") : "";
      const s3Prefix = cleanPath ? basePrefix ? basePrefix + "/" + cleanPath + "/" : cleanPath + "/" : basePrefix ? basePrefix + "/" : "";
      console.log("[CloudAttach] listDirectory remotePath:", remotePath, "cleanPath:", cleanPath, "s3Prefix:", s3Prefix);
      const params = new URLSearchParams({
        "list-type": "2",
        "prefix": s3Prefix,
        "delimiter": "/",
        "encoding-type": "url"
      });
      const response = await this.s3Request(`/?${params.toString()}`, "GET");
      if (!response.ok) {
        throw new Error(`S3 error: ${response.status}`);
      }
      const text = typeof response.text === "function" ? await response.text() : response.text || "";
      console.log("[CloudAttach] listDirectory response:", text.substring(0, 500));
      return this.parseListResult(text, s3Prefix);
    } catch (e) {
      console.error("[CloudAttach] S3 listDirectory error:", e);
      throw e;
    }
  }
  /**
   * 构造文件公共访问 URL（无签名，适用于公共读桶）
   * @param {string} remotePath - 远程路径，如 "/images/photo.jpg"
   * @returns {string} 公共 URL
   */
  getFileUrl(remotePath) {
    const encodePath = (p) => p.split("/").map((s) => encodeURIComponent(s)).join("/");
    const basePrefix = this.prefix ? this.prefix.replace(/\/$/, "") : "";
    const cleanPath = remotePath.replace(/^\/+/, "");
    const fullPath = basePrefix ? `${basePrefix}/${cleanPath}` : cleanPath;
    let base = this.publicUrl || this.endpoint;
    const protoFromEndpoint = (this.endpoint || "").match(/^https?:/)?.[0] || "http:";
    if (!base.startsWith("http")) {
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
      const cleanPath = remotePath.replace(/^\/+/, "");
      const params = new URLSearchParams({ "X-Amz-Expires": expires.toString() });
      const signedQuery = await this.signQuery(params, cleanPath);
      const objectKey = encodeURIComponent(cleanPath);
      return `${this.endpoint}/${this.bucket}/${objectKey}?${signedQuery}`;
    } catch (e) {
      console.error("[CloudAttach] S3 getSignedUrl error:", e);
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
      if (!file)
        return { ok: false, error: t("error.local_file_not_found") };
      const fileName = file.name;
      const TFile = require("obsidian").TFile;
      if (!(file instanceof TFile))
        return { ok: false, error: t("error.unsupported_type") };
      const content = await this.app.vault.readBinary(file);
      const normalizedDir = remoteDir.endsWith("/") ? remoteDir : remoteDir + "/";
      const basePrefix = this.prefix ? this.prefix.replace(/\/$/, "") : "";
      const dirClean = normalizedDir.replace(/^\/+/, "");
      const objectKey = basePrefix ? `${basePrefix}/${dirClean}${fileName}` : `${dirClean}${fileName}`;
      const remotePath = `${normalizedDir}${fileName}`;
      const mimeType = this.getMimeType(fileName);
      const params = new URLSearchParams({ "X-Amz-Expires": "3600" });
      const signedQuery = await this.signQuery(params, objectKey, "PUT", { "content-type": mimeType });
      const encodedKey = encodeURIComponent(objectKey);
      const uploadUrl = `${this.endpoint}/${this.bucket}/${encodedKey}?${signedQuery}`;
      const response = await this.requestViaObsidian(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": this.getMimeType(fileName) },
        body: content
      });
      if (response.ok || response.status === 200) {
        const url = this.getFileUrl(remotePath);
        return { ok: true, remotePath, url };
      } else {
        return { ok: false, error: t("error.s3_upload_failed", { status: response.status }) };
      }
    } catch (e) {
      console.error("[CloudAttach] S3 uploadFile error:", e);
      return { ok: false, error: e.message };
    }
  }
  getMimeType(filename) {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const mimeTypes = {
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png",
      "gif": "image/gif",
      "webp": "image/webp",
      "svg": "image/svg+xml",
      "pdf": "application/pdf",
      "mp4": "video/mp4",
      "mov": "video/quicktime",
      "mp3": "audio/mpeg",
      "wav": "audio/wav",
      "zip": "application/zip",
      "doc": "application/msword",
      "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "xls": "application/vnd.ms-excel",
      "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "ppt": "application/vnd.ms-powerpoint",
      "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "txt": "text/plain",
      "md": "text/markdown",
      "html": "text/html",
      "json": "application/json",
      "csv": "text/csv"
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
  /**
   * 测试连接
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const diagUrl = `${this.endpoint}/${this.bucket}/?list-type=2&max-keys=1`;
      const usingAppUrl = !!(this.app && this.app.requestUrl);
      console.log("[CloudAttach] S3 testConnection URL:", diagUrl);
      console.log("[CloudAttach] S3 config - endpoint:", this.endpoint, "bucket:", this.bucket, "region:", this.region, "accessKey:", this.accessKey ? "(set)" : "(empty)", "| using app.requestUrl:", usingAppUrl);
      const response = await this.s3Request(`/?list-type=2&max-keys=1`, "GET");
      const status = response.status;
      const text = typeof response.text === "function" ? await response.text().catch(() => "") : response.text || "";
      console.log("[CloudAttach] S3 testConnection status:", status, "body:", text.slice(0, 200));
      if (status === 403 || status === 401 || status === 404 || response.ok) {
        return response.ok || status === 403;
      }
      return false;
    } catch (e) {
      console.error("[CloudAttach] S3 testConnection error:", e);
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
  async s3Request(path, method = "GET", options = {}) {
    const url = `${this.endpoint}/${this.bucket}${path}`;
    const urlObj = new URL(url);
    const prefix = `/${this.bucket}/`;
    const objectKey = urlObj.pathname.startsWith(prefix) ? urlObj.pathname.slice(prefix.length) : urlObj.pathname.slice(1);
    const params = new URLSearchParams(urlObj.search);
    const signedQuery = await this.signQuery(params, objectKey);
    const baseUrl = objectKey ? `${this.endpoint}/${this.bucket}/${objectKey}` : `${this.endpoint}/${this.bucket}`;
    const signedUrl = `${baseUrl}?${signedQuery}`;
    return this.requestViaObsidian(signedUrl, { method: "GET", ...options });
  }
  /**
   * AWS Signature V4 签名
   */
  async signRequest(method, url, headers, dateStr) {
    const dateOnly = dateStr.slice(0, 8);
    const signedHeaders = {};
    const credential = `${this.accessKey}/${dateOnly}/${this.region}/s3/aws4_request`;
    const signedHeaderNames = ["host"].sort().join(";");
    signedHeaders["host"] = headers["Host"];
    const signature = await this.computeSignature(method, url, signedHeaders, dateStr);
    signedHeaders["Authorization"] = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`;
    return signedHeaders;
  }
  async computeSignature(method, url, signedHeaders, dateStr) {
    const dateOnly = dateStr.slice(0, 8);
    const urlObj = new URL(url);
    const canonicalUri = encodeURIComponent(urlObj.pathname.replace(/\\/g, "/")).replace(/%2F/g, "/");
    const canonicalQueryString = urlObj.search.slice(1).split("&").filter(Boolean).sort().map((p) => {
      const [k, v] = p.split("=");
      return `${encodeURIComponent(k)}=${encodeURIComponent(v || "")}`;
    }).join("&");
    const sortedHeaders = Object.entries(signedHeaders).sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()));
    const signedHeadersLine = sortedHeaders.map(([k]) => k).join(";");
    const canonicalHeaders = sortedHeaders.map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`).join("\n") + "\n";
    const canonicalRequest = [
      method.toUpperCase(),
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeadersLine,
      "UNSIGNED-PAYLOAD"
    ].join("\n");
    const canonicalHash = await this.sha256(canonicalRequest);
    const stringToSign = [`AWS4-HMAC-SHA256`, dateStr, `${dateOnly}/${this.region}/s3/aws4_request`, canonicalHash].join("\n");
    const kDate = await this.hmacSha256(`AWS4${this.secretKey}`, dateOnly);
    const kRegion = await this.hmacSha256(kDate, this.region);
    const kService = await this.hmacSha256(kRegion, "s3");
    const kSigning = await this.hmacSha256(kService, "aws4_request");
    const signature = await this.hmacSha256Hex(kSigning, stringToSign);
    return signature;
  }
  async signQuery(additionalParams, objectKey, method = "GET", extraHeaders = {}) {
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateOnly = dateStr.slice(0, 8);
    const hostHeader = { "host": new URL(this.endpoint).host };
    const allSignedHeaders = { ...hostHeader, ...extraHeaders };
    const signedHeaderNames = Object.keys(allSignedHeaders).sort().join(";");
    const params = {
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${this.accessKey}/${dateOnly}/${this.region}/s3/aws4_request`,
      "X-Amz-Date": dateStr,
      "X-Amz-Expires": "3600",
      "X-Amz-SignedHeaders": signedHeaderNames,
      ...Object.fromEntries(additionalParams.entries())
    };
    const sortedParams = Object.entries(params).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    const canonicalQueryString = sortedParams.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
    const canonicalUri = objectKey ? encodeURIComponent(`/${this.bucket}/${objectKey}`).replace(/%2F/g, "/") : encodeURIComponent(`/${this.bucket}`).replace(/%2F/g, "/");
    const sortedHeaderEntries = Object.entries(allSignedHeaders).sort((a, b) => a[0].localeCompare(b[0]));
    const canonicalHeaders = sortedHeaderEntries.map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`).join("\n") + "\n";
    const canonicalRequest = [method.toUpperCase(), canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaderNames, "UNSIGNED-PAYLOAD"].join("\n");
    const canonicalHash = await this.sha256(canonicalRequest);
    const stringToSign = [`AWS4-HMAC-SHA256`, dateStr, `${dateOnly}/${this.region}/s3/aws4_request`, canonicalHash].join("\n");
    const kDate = await this.hmacSha256(`AWS4${this.secretKey}`, dateOnly);
    const kRegion = await this.hmacSha256(kDate, this.region);
    const kService = await this.hmacSha256(kRegion, "s3");
    const kSigning = await this.hmacSha256(kService, "aws4_request");
    const signature = await this.hmacSha256Hex(kSigning, stringToSign);
    return canonicalQueryString + `&X-Amz-Signature=${signature}`;
  }
  async sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async hmacSha256(key, data) {
    const encoder = new TextEncoder();
    const keyBytes = key instanceof Uint8Array ? key : encoder.encode(key);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
    return new Uint8Array(signature);
  }
  async hmacSha256Hex(key, data) {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
    return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  /**
   * 解析 ListObjectsV2 XML 响应
   * @param {string} xmlText - XML 文本
   * @param {string} currentPrefix - 当前前缀
   * @returns {Array} 文件列表
   */
  parseListResult(xmlText, currentPrefix) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const files = [];
    const commonPrefixes = doc.getElementsByTagName("CommonPrefixes");
    for (let i = 0; i < commonPrefixes.length; i++) {
      const prefix = commonPrefixes[i].getElementsByTagName("Prefix")[0]?.textContent || "";
      const decodedPrefix = decodeURIComponent(prefix);
      const decodedCurrentPrefix = decodeURIComponent(currentPrefix);
      const name = decodedPrefix.slice(decodedCurrentPrefix.length).replace(/\/$/, "");
      const fullPath = decodedPrefix.replace(/\/$/, "");
      files.push({ name, path: "/" + fullPath + "/", isDirectory: true, size: 0 });
    }
    const contents = doc.getElementsByTagName("Contents");
    for (let i = 0; i < contents.length; i++) {
      const keyEl = contents[i].getElementsByTagName("Key")[0];
      const sizeEl = contents[i].getElementsByTagName("LastModified")[0];
      const key = keyEl?.textContent || "";
      const lastModified = sizeEl?.textContent || "";
      if (!key || key === currentPrefix)
        continue;
      if (key.endsWith("/"))
        continue;
      const decodedKey = decodeURIComponent(key);
      const decodedCurrentPrefix = decodeURIComponent(currentPrefix);
      const relativePath = decodedKey.slice(decodedCurrentPrefix.length);
      const name = relativePath.split("/").pop();
      const size = parseInt(contents[i].getElementsByTagName("Size")[0]?.textContent || "0");
      files.push({ name, path: "/" + decodedKey, isDirectory: false, size, lastModified });
    }
    return files.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory)
        return a.isDirectory ? -1 : 1;
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
    const objKey = (filePath) => {
      const clean = filePath.replace(/^\/+/, "");
      return this.prefix ? this.prefix.replace(/\/$/, "") + "/" + clean : clean;
    };
    for (const fullPath of paths) {
      try {
        const objectKey = objKey(fullPath);
        const isDir = fullPath.endsWith("/");
        if (isDir) {
          const dirContents = await this.listDirectory(fullPath);
          for (const item of dirContents) {
            const itemKey = objKey(item.path);
            const itemSignedQuery = await this.signQuery(new URLSearchParams({ "X-Amz-Expires": "3600" }), itemKey, "DELETE", {});
            const itemEncodedKey = encodeURIComponent(itemKey);
            const itemDeleteUrl = `${this.endpoint}/${this.bucket}/${itemEncodedKey}?${itemSignedQuery}`;
            const r = await this.requestViaObsidian(itemDeleteUrl, { method: "DELETE" });
            if (!r.ok)
              results.failed.push({ path: item.path, error: `HTTP ${r.status}` });
            else
              results.success.push(item.path);
          }
        } else {
          const signedQuery = await this.signQuery(new URLSearchParams({ "X-Amz-Expires": "3600" }), objectKey, "DELETE", {});
          const encodedKey = encodeURIComponent(objectKey);
          const deleteUrl = `${this.endpoint}/${this.bucket}/${encodedKey}?${signedQuery}`;
          const r = await this.requestViaObsidian(deleteUrl, { method: "DELETE" });
          if (r.ok)
            results.success.push(fullPath);
          else
            results.failed.push({ path: fullPath, error: `HTTP ${r.status}` });
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
    const isDir = path.endsWith("/");
    const objKey = (filePath) => {
      const clean = filePath.replace(/^\/+/, "");
      return this.prefix ? this.prefix.replace(/\/$/, "") + "/" + clean : clean;
    };
    if (isDir) {
      const cleanPath = path.replace(/\/$/, "");
      const dstDir = cleanPath.substring(0, cleanPath.lastIndexOf("/"));
      const dstBase = dstDir + "/" + newName;
      const dirContents = await this.listDirectory(path);
      for (const item of dirContents) {
        const srcKey2 = objKey(item.path);
        const relativeName = item.path.slice(path.length);
        const dstKey2 = objKey(dstBase + "/" + relativeName.replace(/^\//, ""));
        const copySource2 = encodeURIComponent("/" + this.bucket + "/" + srcKey2).replace(/%2F/g, "/");
        const copyParams2 = new URLSearchParams({ "X-Amz-Expires": "3600" });
        const copyQuery2 = await this.signQuery(copyParams2, dstKey2, "PUT", { "x-amz-copy-source": copySource2 });
        const copyResp2 = await this.requestViaObsidian(
          `${this.endpoint}/${this.bucket}/${encodeURIComponent(dstKey2)}?${copyQuery2}`,
          { method: "PUT", headers: { "x-amz-copy-source": copySource2 } }
        );
        if (!copyResp2.ok) {
          throw new Error(`CopyObject failed for ${item.name}: HTTP ${copyResp2.status}`);
        }
        const delQuery2 = await this.signQuery(new URLSearchParams({ "X-Amz-Expires": "3600" }), srcKey2, "DELETE", {});
        const delResp2 = await this.requestViaObsidian(
          `${this.endpoint}/${this.bucket}/${encodeURIComponent(srcKey2)}?${delQuery2}`,
          { method: "DELETE" }
        );
        if (!delResp2.ok) {
          throw new Error(`Delete original failed for ${item.name}: HTTP ${delResp2.status}`);
        }
      }
      return;
    }
    const srcKey = objKey(path);
    const dstPath = path.substring(0, path.lastIndexOf("/") + 1) + newName;
    const dstKey = objKey(dstPath);
    const copySource = encodeURIComponent("/" + this.bucket + "/" + srcKey).replace(/%2F/g, "/");
    const copyParams = new URLSearchParams({ "X-Amz-Expires": "3600" });
    const copyQuery = await this.signQuery(copyParams, dstKey, "PUT", { "x-amz-copy-source": copySource });
    const copyResp = await this.requestViaObsidian(
      `${this.endpoint}/${this.bucket}/${encodeURIComponent(dstKey)}?${copyQuery}`,
      { method: "PUT", headers: { "x-amz-copy-source": copySource } }
    );
    if (!copyResp.ok) {
      const err = copyResp.text || `HTTP ${copyResp.status}`;
      throw new Error(err);
    }
    const delQuery = await this.signQuery(new URLSearchParams({ "X-Amz-Expires": "3600" }), srcKey, "DELETE", {});
    const delResp = await this.requestViaObsidian(
      `${this.endpoint}/${this.bucket}/${encodeURIComponent(srcKey)}?${delQuery}`,
      { method: "DELETE" }
    );
    if (!delResp.ok) {
      throw new Error(`Delete original failed: HTTP ${delResp.status}`);
    }
  }
};
var CloudAttachView = class extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.accountId = null;
    this.currentPath = "/";
    this.files = [];
    this.selectedFiles = /* @__PURE__ */ new Set();
    this.client = null;
  }
  getViewType() {
    return VIEW_TYPE_CLOUDATTACH;
  }
  getDisplayText() {
    return t("cmd.open_cloud_attach");
  }
  getIcon() {
    return "folder-open";
  }
  async onOpen() {
    console.log("[CloudAttach] onOpen called");
    this.contentEl.innerHTML = '<div style="padding:20px">' + t("view.loading") + "</div>";
    this.render();
  }
  async onClose() {
  }
  async render() {
    try {
      this.contentEl.innerHTML = "";
      const header = document.createElement("div");
      header.className = "cloud-attach-header";
      const titleRow = document.createElement("div");
      titleRow.style.display = "flex";
      titleRow.style.alignItems = "center";
      titleRow.style.justifyContent = "space-between";
      const titleEl = document.createElement("h3");
      titleEl.className = "cloud-attach-title";
      titleEl.textContent = "\u2601\uFE0F " + t("view.plugin_title");
      titleEl.style.margin = "0";
      titleRow.appendChild(titleEl);
      header.appendChild(titleRow);
      this.contentEl.appendChild(header);
      if (this.plugin.accounts.length === 0) {
        this.contentEl.innerHTML += '<p class="cloud-attach-hint">' + t("view.no_account_hint") + "</p>";
        return;
      }
      if (this.plugin.accounts.length === 1 && !this.accountId) {
        this.accountId = this.plugin.accounts[0].id;
        this.client = this.plugin.createClient(this.accountId);
        console.log("[CloudAttach] loading dir for single account");
        await this.loadDir();
        return;
      }
      const selectArea = document.createElement("div");
      selectArea.className = "cloud-attach-select-area";
      const select = document.createElement("select");
      select.className = "cloud-attach-select";
      select.innerHTML = '<option value="">' + t("view.select_account_hint") + "</option>";
      this.plugin.accounts.forEach((acc) => {
        const opt = document.createElement("option");
        opt.value = acc.id;
        opt.textContent = acc.name;
        if (acc.id === this.accountId)
          opt.selected = true;
        select.appendChild(opt);
      });
      select.onchange = async (e) => {
        this.accountId = e.target.value;
        this.selectedFiles.clear();
        if (this.accountId) {
          this.currentPath = "/";
          this.client = this.plugin.createClient(this.accountId);
          await this.loadDir();
        }
      };
      selectArea.appendChild(select);
      this.contentEl.appendChild(selectArea);
      this.breadcrumbEl = document.createElement("div");
      this.breadcrumbEl.className = "cloud-attach-breadcrumb";
      this.batchBarEl = document.createElement("div");
      this.batchBarEl.className = "cloud-attach-batch-bar";
      this.batchBarEl.style.display = "none";
      this.fileListEl = document.createElement("div");
      this.fileListEl.className = "cloud-attach-file-list";
      this.contentEl.appendChild(this.breadcrumbEl);
      this.contentEl.appendChild(this.batchBarEl);
      this.contentEl.appendChild(this.fileListEl);
      if (this.accountId && this.client) {
        await this.loadDir();
      } else {
        this.breadcrumbEl.innerHTML = '<span style="color:var(--text-muted);padding:10px;">' + t("view.select_account_hint") + "</span>";
      }
      console.log("[CloudAttach] render completed");
    } catch (e) {
      console.error("[CloudAttach] render error:", e);
      this.contentEl.innerHTML = `<p class="cloud-attach-error">${t("view.error", { error: e.message })}</p>`;
    }
  }
  renderBreadcrumb() {
    if (!this.breadcrumbEl)
      return;
    this.breadcrumbEl.innerHTML = "";
    const webdavPath = this.client?.webdavPath;
    const s3Prefix = this.client?.prefix;
    let rootLabel;
    if (webdavPath) {
      rootLabel = "\u{1F4C1} " + webdavPath.replace(/^\/+/, "").split("/").pop() || webdavPath;
    } else if (s3Prefix) {
      rootLabel = "\u{1F4C1} " + s3Prefix.replace(/^\/+|\/+$/g, "").split("/").pop() || s3Prefix;
    } else {
      rootLabel = t("view.root");
    }
    const root = document.createElement("button");
    root.className = "cloud-attach-breadcrumb-btn";
    root.textContent = rootLabel;
    root.onclick = () => {
      this.navigateTo("/");
    };
    this.breadcrumbEl.appendChild(root);
    if (this.currentPath === "/") {
      const refresh2 = document.createElement("button");
      refresh2.className = "cloud-attach-refresh";
      refresh2.textContent = t("view.refresh");
      refresh2.onclick = () => this.loadDir();
      this.breadcrumbEl.appendChild(refresh2);
      this.renderBatchBar();
      return;
    }
    const parts = this.currentPath.split("/").filter((p) => p);
    for (let i = 0; i < parts.length; i++) {
      const sep = document.createElement("span");
      sep.className = "cloud-attach-breadcrumb-sep";
      sep.textContent = t("view.breadcrumb_sep");
      this.breadcrumbEl.appendChild(sep);
      const targetPath = "/" + parts.slice(0, i + 1).join("/");
      const btn = document.createElement("button");
      btn.className = "cloud-attach-breadcrumb-btn";
      btn.textContent = parts[i];
      btn.onclick = () => {
        this.navigateTo(targetPath);
      };
      this.breadcrumbEl.appendChild(btn);
    }
    const refresh = document.createElement("button");
    refresh.className = "cloud-attach-refresh";
    refresh.textContent = t("view.refresh");
    refresh.onclick = () => this.loadDir();
    this.breadcrumbEl.appendChild(refresh);
    this.renderBatchBar();
  }
  // 统一的导航方法
  navigateTo(path) {
    console.log("[CloudAttach] navigateTo:", path, "from:", this.currentPath);
    if (this.currentPath !== path) {
      this.currentPath = path;
      this.selectedFiles.clear();
      this.loadDir();
    }
  }
  renderBatchBar() {
    if (!this.batchBarEl)
      return;
    this.batchBarEl.innerHTML = "";
    const count = this.selectedFiles.size;
    const totalCount = this.files.length;
    if (count === 0) {
      this.batchBarEl.style.display = "none";
      return;
    }
    this.batchBarEl.style.display = "flex";
    const span = document.createElement("span");
    span.className = "cloud-attach-batch-count";
    span.textContent = t("view.file_count", { count, total: totalCount });
    this.batchBarEl.appendChild(span);
    const selectAllBtn = document.createElement("button");
    selectAllBtn.className = "cloud-attach-batch-btn mod-secondary";
    selectAllBtn.textContent = t("view.select_all");
    selectAllBtn.onclick = () => {
      this.files.forEach((f) => this.selectedFiles.add(f.path));
      this.renderFiles();
      this.renderBatchBar();
    };
    this.batchBarEl.appendChild(selectAllBtn);
    const deselectBtn = document.createElement("button");
    deselectBtn.className = "cloud-attach-batch-btn mod-secondary";
    deselectBtn.textContent = t("view.cancel");
    deselectBtn.onclick = () => {
      this.selectedFiles.clear();
      this.renderFiles();
      this.renderBatchBar();
    };
    this.batchBarEl.appendChild(deselectBtn);
    const insertBtn = document.createElement("button");
    insertBtn.className = "cloud-attach-batch-btn";
    insertBtn.textContent = t("view.insert");
    insertBtn.onclick = () => this.insertSelectedFiles();
    this.batchBarEl.appendChild(insertBtn);
    const copyUrlBtn = document.createElement("button");
    copyUrlBtn.className = "cloud-attach-batch-btn mod-secondary";
    copyUrlBtn.textContent = t("view.copy_url");
    copyUrlBtn.onclick = async () => {
      if (!this.client || this.selectedFiles.size === 0) {
        new Notice(t("notice.no_file_selected"));
        return;
      }
      const selected = this.files.filter((f) => this.selectedFiles.has(f.path));
      const urls = await Promise.all(selected.map(async (f) => {
        try {
          if (this.client.token) {
            return this.client.getSignedUrl ? await this.client.getSignedUrl(f.path) : await this.client.getFileUrl(f.path);
          }
          return await this.client.getFileUrl(f.path);
        } catch (e) {
          console.error("[CloudAttach] getFileUrl failed:", f.path, e.message);
          return null;
        }
      }));
      const validUrls = urls.filter(Boolean);
      await navigator.clipboard.writeText(urls.join("\n"));
      new Notice(t("notice.copied_count", { count: urls.length }));
    };
    this.batchBarEl.appendChild(copyUrlBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "cloud-attach-batch-btn";
    deleteBtn.style.color = "var(--text-error)";
    deleteBtn.textContent = t("view.delete_btn") + (count > 0 ? ` (${count})` : "");
    deleteBtn.onclick = () => this.showDeleteConfirmModal();
    this.batchBarEl.appendChild(deleteBtn);
  }
  /**
   * 显示删除确认弹窗
   */
  showDeleteConfirmModal() {
    const selected = this.files.filter((f) => this.selectedFiles.has(f.path));
    if (selected.length === 0)
      return;
    const modal = new (require("obsidian")).Modal(this.app);
    modal.titleEl.textContent = t("view.delete_confirm_title");
    const content = modal.contentEl;
    content.style.padding = "16px";
    const body = document.createElement("p");
    body.style.marginBottom = "12px";
    body.textContent = t("view.delete_confirm_body", { count: selected.length });
    content.appendChild(body);
    const list = document.createElement("div");
    list.style.maxHeight = "200px";
    list.style.overflow = "auto";
    list.style.border = "1px solid var(--background-modifier-border)";
    list.style.borderRadius = "4px";
    list.style.padding = "8px";
    list.style.marginBottom = "16px";
    const maxShow = 10;
    selected.slice(0, maxShow).forEach((f) => {
      const item = document.createElement("div");
      item.style.padding = "3px 0";
      item.style.fontSize = "13px";
      item.textContent = f.isDirectory ? t("view.delete_folder", { name: f.name }) : t("view.delete_item", { name: f.name });
      list.appendChild(item);
    });
    if (selected.length > maxShow) {
      const more = document.createElement("div");
      more.style.padding = "3px 0";
      more.style.fontSize = "13px";
      more.style.color = "var(--text-muted)";
      more.textContent = t("view.delete_and_more", { count: selected.length - maxShow });
      list.appendChild(more);
    }
    content.appendChild(list);
    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.gap = "8px";
    btnRow.style.justifyContent = "flex-end";
    const confirmBtn2 = document.createElement("button");
    confirmBtn2.style.background = "var(--text-error)";
    confirmBtn2.style.color = "var(--background-primary)";
    confirmBtn2.style.padding = "8px 16px";
    confirmBtn2.textContent = t("view.confirm_delete", { count: selected.length });
    confirmBtn2.onclick = async () => {
      modal.close();
      await this.doDelete(selected);
    };
    btnRow.appendChild(confirmBtn2);
    content.appendChild(btnRow);
    modal.open();
  }
  /**
   * 执行删除
   * @param {Array} files - 要删除的文件对象列表
   */
  async doDelete(files) {
    if (!this.client)
      return;
    const paths = files.map((f) => f.path);
    const result = await this.client.delete(paths);
    if (result.failed.length === 0) {
      new Notice(t("notice.delete_success", { count: result.success.length }));
    } else if (result.success.length === 0) {
      new Notice(t("notice.delete_failed", { error: result.failed[0].error }), 5e3);
    } else {
      new Notice(t("notice.delete_partial", { success: result.success.length, failed: result.failed.length }), 5e3);
    }
    this.selectedFiles.clear();
    this.loadDir();
  }
  /**
   * 显示重命名弹窗
   * @param {Object} file - 文件对象
   */
  showRenameModal(file) {
    const modal = new (require("obsidian")).Modal(this.app);
    modal.titleEl.textContent = t("view.rename_title");
    const content = modal.contentEl;
    content.style.padding = "16px";
    const label = document.createElement("label");
    label.style.display = "block";
    label.style.marginBottom = "8px";
    label.style.fontSize = "13px";
    label.textContent = t("view.rename_label");
    content.appendChild(label);
    const input = document.createElement("input");
    input.type = "text";
    input.value = file.name;
    input.style.width = "100%";
    input.style.padding = "6px 8px";
    input.style.boxSizing = "border-box";
    input.style.marginBottom = "16px";
    input.placeholder = t("view.rename_placeholder");
    input.onkeydown = (e) => {
      if (e.key === "Enter")
        confirmBtn.click();
    };
    content.appendChild(input);
    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.gap = "8px";
    btnRow.style.justifyContent = "flex-end";
    const confirmBtn2 = document.createElement("button");
    confirmBtn2.style.background = "var(--interactive-accent)";
    confirmBtn2.style.color = "var(--text-on-accent)";
    confirmBtn2.style.padding = "8px 16px";
    confirmBtn2.textContent = t("view.confirm_rename", { count: 1 });
    confirmBtn2.onclick = async () => {
      const newName = input.value.trim();
      if (!newName) {
        new Notice(t("notice.rename_failed", { error: "Name cannot be empty" }), 3e3);
        return;
      }
      if (newName.includes("/")) {
        new Notice(t("notice.rename_failed", { error: "Name cannot contain /" }), 3e3);
        return;
      }
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
    if (!this.client)
      return;
    try {
      await this.client.rename(file.path, newName);
      new Notice(t("notice.rename_success"));
      this.selectedFiles.clear();
      this.loadDir();
    } catch (e) {
      const msg = e.message || String(e);
      if (msg.includes("exist") || msg.includes("409") || msg.includes("already")) {
        new Notice(t("notice.rename_conflict"), 4e3);
      } else {
        new Notice(t("notice.rename_failed", { error: msg }), 5e3);
      }
    }
  }
  // 刷新账户下拉框
  refreshAccountSelect() {
    const select = this.contentEl.querySelector("select.cloud-attach-select");
    if (!select)
      return;
    select.innerHTML = '<option value="">' + t("view.select_account_hint") + "</option>";
    this.plugin.accounts.forEach((acc) => {
      const opt = document.createElement("option");
      opt.value = acc.id;
      opt.textContent = acc.name;
      if (acc.id === this.accountId)
        opt.selected = true;
      select.appendChild(opt);
    });
  }
  async loadDir() {
    if (!this.accountId)
      return;
    this.renderBreadcrumb();
    if (!this.fileListEl)
      return;
    this.fileListEl.innerHTML = '<p class="cloud-attach-loading">' + t("view.loading") + "</p>";
    if (!this.client) {
      this.client = this.plugin.createClient(this.accountId);
    }
    if (!this.client) {
      this.fileListEl.innerHTML = '<p class="cloud-attach-error">' + t("view.no_account_selected") + "</p>";
      return;
    }
    try {
      this.files = await this.client.listDirectory(this.currentPath);
      this.selectedFiles.clear();
      this.renderFiles();
    } catch (e) {
      console.error("[CloudAttach] loadDir error:", e);
      this.fileListEl.innerHTML = `<p class="cloud-attach-error">${t("view.connect_failed", { error: e.message })}</p><p class="cloud-attach-hint">${t("settings.check_account_settings")}</p>`;
    }
  }
  renderFiles() {
    if (!this.fileListEl)
      return;
    this.fileListEl.innerHTML = "";
    console.log("[CloudAttach] rendering files, count:", this.files.length);
    if (this.files.length === 0) {
      this.fileListEl.innerHTML = '<p class="cloud-attach-empty">' + t("view.empty_dir") + "</p>";
      return;
    }
    this.files.forEach((file) => {
      const item = document.createElement("div");
      item.className = "cloud-attach-file";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "cloud-attach-checkbox";
      checkbox.checked = this.selectedFiles.has(file.path);
      checkbox.onclick = (e) => {
        e.stopPropagation();
        if (checkbox.checked)
          this.selectedFiles.add(file.path);
        else
          this.selectedFiles.delete(file.path);
        this.renderBatchBar();
      };
      item.appendChild(checkbox);
      const icon = document.createElement("span");
      icon.className = "cloud-attach-icon";
      icon.textContent = file.isDirectory ? "\u{1F4C1}" : this.getFileIcon(file.name);
      item.appendChild(icon);
      const name = document.createElement("span");
      name.className = "cloud-attach-name";
      name.textContent = file.name;
      if (file.isDirectory) {
        name.onclick = () => {
          this.currentPath = file.path;
          this.selectedFiles.clear();
          this.loadDir();
        };
      } else {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        name.onclick = () => this.insertFile(file);
      }
      name.style.cursor = "pointer";
      item.appendChild(name);
      item.oncontextmenu = (e) => {
        e.preventDefault();
        this.showMenu(file, e);
      };
      this.fileListEl.appendChild(item);
    });
  }
  getFileIcon(name) {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const icons = {
      "jpg": "\u{1F5BC}\uFE0F",
      "jpeg": "\u{1F5BC}\uFE0F",
      "png": "\u{1F5BC}\uFE0F",
      "gif": "\u{1F5BC}\uFE0F",
      "webp": "\u{1F5BC}\uFE0F",
      "svg": "\u{1F5BC}\uFE0F",
      "bmp": "\u{1F5BC}\uFE0F",
      "mp4": "\u{1F3AC}",
      "mov": "\u{1F3AC}",
      "avi": "\u{1F3AC}",
      "mkv": "\u{1F3AC}",
      "webm": "\u{1F3AC}",
      "flv": "\u{1F3AC}",
      "mp3": "\u{1F3B5}",
      "wav": "\u{1F3B5}",
      "flac": "\u{1F3B5}",
      "aac": "\u{1F3B5}",
      "ogg": "\u{1F3B5}",
      "m4a": "\u{1F3B5}",
      "pdf": "\u{1F4C4}",
      "doc": "\u{1F4C4}",
      "docx": "\u{1F4C4}",
      "txt": "\u{1F4C4}",
      "md": "\u{1F4DD}",
      "zip": "\u{1F4E6}",
      "rar": "\u{1F4E6}",
      "7z": "\u{1F4E6}",
      "tar": "\u{1F4E6}",
      "gz": "\u{1F4E6}"
    };
    return icons[ext] || "\u{1F4C4}";
  }
  // 获取要插入的 Markdown 格式（异步）
  // width: 可选数字宽度（px），支持图片和 PDF（pdfjs 模式）
  async getInsertMarkdown(file, width) {
    console.log("[CloudAttach] getInsertMarkdown file.path:", JSON.stringify(file.path));
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic", "heif"];
    const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "flv"];
    const audioExts = ["mp3", "wav", "flac", "aac", "ogg", "m4a"];
    const docExts = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];
    const isPdfJsInsert = ext === "pdf" && this.plugin.settings.pdfPreview === "pdfjs";
    const useRawUrl = docExts.includes(ext) && !isPdfJsInsert;
    let url;
    if (useRawUrl) {
      url = this.client.getRawUrl ? this.client.getRawUrl(file.path) : this.client.getFileUrl(file.path);
    } else {
      const client = this.client;
      try {
        url = client.token ? await (client.getSignedUrl ? client.getSignedUrl(file.path) : client.getFileUrl(file.path)) : client.getFileUrl(file.path);
      } catch (signErr) {
        new Notice(t("notice.sign_rebuild_failed", { error: signErr.message }));
        throw signErr;
      }
    }
    if (imageExts.includes(ext)) {
      const w = width ? `|${width}` : "";
      return `![${nameWithoutExt}${w}](${url})`;
    } else if (videoExts.includes(ext)) {
      return `<video controls width="600" height="400">
 <source src="${url}" type="video/mp4">
</video>`;
    } else if (audioExts.includes(ext)) {
      return `<audio controls>
 <source src="${url}" type="audio/mpeg">
</audio>`;
    } else if (docExts.includes(ext)) {
      if (ext === "pdf" && this.plugin.settings.pdfPreview === "pdfjs") {
        const w = width ? `|${width}` : "";
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
    if (this.plugin.activeMarkdownView?.editor) {
      return this.plugin.activeMarkdownView;
    }
    let view = workspace.getActiveViewOfType(MarkdownView);
    if (view?.editor)
      return view;
    const recentLeaf = workspace.getMostRecentLeaf();
    if (recentLeaf?.view instanceof MarkdownView && recentLeaf.view.editor) {
      return recentLeaf.view;
    }
    const leaves = workspace.getLeavesOfType("markdown");
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
      view.editor.replaceRange(md + "\n", cursor);
      new Notice(t("notice.inserted", { name: file.name }));
    } else {
      new Notice(t("notice.open_note_first"));
    }
  }
  // 批量插入（异步）
  async insertSelectedFiles() {
    if (!this.client || this.selectedFiles.size === 0)
      return;
    const selected = this.files.filter((f) => this.selectedFiles.has(f.path));
    const mds = await Promise.all(selected.map((file) => this.getInsertMarkdown(file)));
    const view = this.findMostRecentMarkdownView();
    if (view?.editor) {
      const cursor = view.editor.getCursor();
      view.editor.replaceRange(mds.map((md) => md + "\n").join("\n") + "\n", cursor);
      new Notice(t("notice.inserted_count", { count: selected.length }));
    } else {
      new Notice(t("notice.open_note_first"));
    }
    this.selectedFiles.clear();
    this.renderFiles();
    this.renderBatchBar();
  }
  showMenu(file, event) {
    const menu = new Menu(this.plugin.app);
    if (!file.isDirectory) {
      menu.addItem((item) => {
        const isMulti = this.selectedFiles.size > 1;
        item.setTitle(isMulti ? t("menu.insert_note_multi", { count: this.selectedFiles.size }) : t("menu.insert_note")).setIcon("link");
        item.onClick(() => {
          if (isMulti)
            this.insertSelectedFiles();
          else
            this.insertFile(file);
        });
      });
      menu.addItem((item) => {
        item.setTitle(t("menu.copy_link"));
        item.onClick(async () => {
          if (!this.client)
            return;
          try {
            const files = this.selectedFiles.size > 1 ? this.files.filter((f) => this.selectedFiles.has(f.path)) : [file];
            const urls = await Promise.all(files.map(
              (f) => this.client.getSignedUrl ? this.client.getSignedUrl(f.path) : this.client.getFileUrl(f.path)
            ));
            await navigator.clipboard.writeText(urls.join("\n"));
            new Notice(t("notice.copied_count_links", { count: urls.length }));
          } catch {
            new Notice(t("notice.copy_link_failed"));
          }
        });
      });
      menu.addItem((item) => {
        item.setTitle(t("menu.rename")).onClick(() => this.showRenameModal(file));
      });
      menu.addItem((item) => {
        item.setTitle(this.selectedFiles.has(file.path) ? t("menu.deselect") : t("menu.select")).onClick(() => {
          if (this.selectedFiles.has(file.path))
            this.selectedFiles.delete(file.path);
          else
            this.selectedFiles.add(file.path);
          this.renderFiles();
          this.renderBatchBar();
        });
      });
    }
    if (file.isDirectory) {
      menu.addItem((item) => {
        item.setTitle(t("view.open_dir")).onClick(() => {
          this.currentPath = file.path;
          this.selectedFiles.clear();
          this.loadDir();
        });
      });
      menu.addItem((item) => {
        item.setTitle(t("menu.rename")).onClick(() => this.showRenameModal(file));
      });
    }
    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }
};
var AddAccountModal = class extends Modal {
  constructor(app, plugin, onSave, account = null) {
    super(app);
    this.plugin = plugin;
    this.onSave = onSave;
    this.account = account;
  }
  async onOpen() {
    this.contentEl.innerHTML = "";
    const title = document.createElement("h2");
    title.textContent = this.account ? t("settings.edit_account") : t("settings.add_account");
    this.contentEl.appendChild(title);
    const fields = {};
    const typeDiv = document.createElement("div");
    typeDiv.style.margin = "16px 0";
    const typeLabel = document.createElement("label");
    typeLabel.style.display = "block";
    typeLabel.style.marginBottom = "8px";
    typeLabel.style.fontSize = "12px";
    typeLabel.style.color = "var(--text-muted)";
    typeLabel.textContent = t("settings.storage_type");
    typeDiv.appendChild(typeLabel);
    const typeRow = document.createElement("div");
    typeRow.style.display = "flex";
    typeRow.style.gap = "16px";
    const typeOpenList = document.createElement("label");
    typeOpenList.style.display = "flex";
    typeOpenList.style.alignItems = "center";
    typeOpenList.style.gap = "6px";
    typeOpenList.style.cursor = "pointer";
    typeOpenList.style.fontSize = "13px";
    const radioOpenList = document.createElement("input");
    radioOpenList.type = "radio";
    radioOpenList.name = "accountType";
    radioOpenList.value = "openlist";
    typeOpenList.appendChild(radioOpenList);
    typeOpenList.appendChild(document.createTextNode(t("settings.openlist_webdav_label")));
    const typeS3 = document.createElement("label");
    typeS3.style.display = "flex";
    typeS3.style.alignItems = "center";
    typeS3.style.gap = "6px";
    typeS3.style.cursor = "pointer";
    typeS3.style.fontSize = "13px";
    const radioS3 = document.createElement("input");
    radioS3.type = "radio";
    radioS3.name = "accountType";
    radioS3.value = "s3";
    typeS3.appendChild(radioS3);
    typeS3.appendChild(document.createTextNode(t("settings.s3_type_label")));
    typeRow.appendChild(typeOpenList);
    typeRow.appendChild(typeS3);
    typeDiv.appendChild(typeRow);
    this.contentEl.appendChild(typeDiv);
    const nameDiv = this.createFieldDiv(t("settings.account_name"), t("settings.account_name_placeholder"));
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = t("settings.account_name_placeholder");
    nameInput.value = this.account?.name || "";
    nameInput.className = "cloud-attach-input";
    nameDiv.appendChild(nameInput);
    fields.name = nameInput;
    this.contentEl.appendChild(nameDiv);
    const openlistFields = document.createElement("div");
    openlistFields.id = "ol-fields";
    const urlDiv = this.createFieldDiv(t("settings.server_address"), t("settings.server_address_placeholder"));
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.placeholder = "http://192.168.62.200:5244";
    urlInput.value = this.account?.url || "";
    urlInput.className = "cloud-attach-input";
    urlDiv.appendChild(urlInput);
    fields.url = urlInput;
    openlistFields.appendChild(urlDiv);
    const webdavDiv = this.createFieldDiv(t("settings.webdav_path_label"), t("settings.webdav_path_placeholder"));
    const webdavInput = document.createElement("input");
    webdavInput.type = "text";
    webdavInput.placeholder = "/dav";
    webdavInput.value = this.account?.webdavPath || "";
    webdavInput.className = "cloud-attach-input";
    webdavDiv.appendChild(webdavInput);
    fields.webdavPath = webdavInput;
    openlistFields.appendChild(webdavDiv);
    const userDiv = this.createFieldDiv(t("settings.username"), "");
    const userInput = document.createElement("input");
    userInput.type = "text";
    userInput.value = this.account?.username || "";
    userInput.className = "cloud-attach-input";
    userDiv.appendChild(userInput);
    fields.username = userInput;
    openlistFields.appendChild(userDiv);
    const passDiv = this.createFieldDiv(t("settings.password"), "");
    const passWrapper = document.createElement("div");
    passWrapper.style.display = "flex";
    passWrapper.style.gap = "4px";
    const passInput = document.createElement("input");
    passInput.type = "password";
    passInput.value = this.account?.password || "";
    passInput.className = "cloud-attach-input";
    passInput.style.flex = "1";
    passWrapper.appendChild(passInput);
    const passToggle = document.createElement("button");
    passToggle.textContent = "\u{1F441}\uFE0F";
    passToggle.type = "button";
    passToggle.style.padding = "6px 8px";
    passToggle.style.cursor = "pointer";
    passToggle.onclick = () => {
      passInput.type = passInput.type === "password" ? "text" : "password";
      passToggle.textContent = passInput.type === "password" ? "\u{1F441}\uFE0F" : "\u{1F512}";
    };
    passWrapper.appendChild(passToggle);
    passDiv.appendChild(passWrapper);
    fields.password = passInput;
    openlistFields.appendChild(passDiv);
    const tokenDiv = this.createFieldDiv(t("settings.token"), t("settings.token_hint"));
    const tokenWrapper = document.createElement("div");
    tokenWrapper.style.display = "flex";
    tokenWrapper.style.gap = "4px";
    const tokenInput = document.createElement("input");
    tokenInput.type = "password";
    tokenInput.value = this.account?.token || "";
    tokenInput.className = "cloud-attach-input";
    tokenInput.style.flex = "1";
    tokenWrapper.appendChild(tokenInput);
    const tokenToggle = document.createElement("button");
    tokenToggle.textContent = "\u{1F441}\uFE0F";
    tokenToggle.type = "button";
    tokenToggle.style.padding = "6px 8px";
    tokenToggle.style.cursor = "pointer";
    tokenToggle.onclick = () => {
      tokenInput.type = tokenInput.type === "password" ? "text" : "password";
      tokenToggle.textContent = tokenInput.type === "password" ? "\u{1F441}\uFE0F" : "\u{1F512}";
    };
    tokenWrapper.appendChild(tokenToggle);
    tokenDiv.appendChild(tokenWrapper);
    fields.token = tokenInput;
    openlistFields.appendChild(tokenDiv);
    const olPublicUrlDiv = this.createFieldDiv(t("settings.public_url"), t("settings.cdn_url_placeholder"));
    const olPublicUrlInput = document.createElement("input");
    olPublicUrlInput.type = "text";
    olPublicUrlInput.placeholder = "https://public.example.com";
    olPublicUrlInput.value = this.account?.publicUrl || "";
    olPublicUrlInput.className = "cloud-attach-input";
    olPublicUrlDiv.appendChild(olPublicUrlInput);
    fields.olPublicUrl = olPublicUrlInput;
    openlistFields.appendChild(olPublicUrlDiv);
    this.contentEl.appendChild(openlistFields);
    const s3Fields = document.createElement("div");
    s3Fields.id = "s3-fields";
    s3Fields.style.display = "none";
    const endpointDiv = this.createFieldDiv(t("settings.endpoint"), t("settings.endpoint_placeholder"));
    const endpointInput = document.createElement("input");
    endpointInput.type = "text";
    endpointInput.placeholder = "https://xxx.r2.cloudflarestorage.com";
    endpointInput.value = this.account?.endpoint || "";
    endpointInput.className = "cloud-attach-input";
    endpointDiv.appendChild(endpointInput);
    fields.endpoint = endpointInput;
    s3Fields.appendChild(endpointDiv);
    const bucketDiv = this.createFieldDiv(t("settings.bucket"), t("settings.bucket_placeholder"));
    const bucketInput = document.createElement("input");
    bucketInput.type = "text";
    bucketInput.placeholder = "my-vault-attach";
    bucketInput.value = this.account?.bucket || "";
    bucketInput.className = "cloud-attach-input";
    bucketDiv.appendChild(bucketInput);
    fields.bucket = bucketInput;
    s3Fields.appendChild(bucketDiv);
    const regionDiv = this.createFieldDiv(t("settings.region"), t("settings.region_placeholder"));
    const regionInput = document.createElement("input");
    regionInput.type = "text";
    regionInput.placeholder = "auto";
    regionInput.value = this.account?.region || "";
    regionInput.className = "cloud-attach-input";
    regionDiv.appendChild(regionInput);
    fields.region = regionInput;
    s3Fields.appendChild(regionDiv);
    const akDiv = this.createFieldDiv(t("settings.access_key"), "");
    const akInput = document.createElement("input");
    akInput.type = "text";
    akInput.value = this.account?.accessKey || "";
    akInput.className = "cloud-attach-input";
    akDiv.appendChild(akInput);
    fields.accessKey = akInput;
    s3Fields.appendChild(akDiv);
    const skDiv = this.createFieldDiv(t("settings.secret_key"), "");
    const skWrapper = document.createElement("div");
    skWrapper.style.display = "flex";
    skWrapper.style.gap = "4px";
    const skInput = document.createElement("input");
    skInput.type = "password";
    skInput.value = this.account?.secretKey || "";
    skInput.className = "cloud-attach-input";
    skInput.style.flex = "1";
    skWrapper.appendChild(skInput);
    const skToggle = document.createElement("button");
    skToggle.textContent = "\u{1F441}\uFE0F";
    skToggle.type = "button";
    skToggle.style.padding = "6px 8px";
    skToggle.style.cursor = "pointer";
    skToggle.onclick = () => {
      skInput.type = skInput.type === "password" ? "text" : "password";
      skToggle.textContent = skInput.type === "password" ? "\u{1F441}\uFE0F" : "\u{1F512}";
    };
    skWrapper.appendChild(skToggle);
    skDiv.appendChild(skWrapper);
    fields.secretKey = skInput;
    s3Fields.appendChild(skDiv);
    const publicUrlDiv = this.createFieldDiv(t("settings.public_url"), t("settings.cdn_url_placeholder"));
    const publicUrlInput = document.createElement("input");
    publicUrlInput.type = "text";
    publicUrlInput.placeholder = "https://cdn.example.com";
    publicUrlInput.value = this.account?.publicUrl || "";
    publicUrlInput.className = "cloud-attach-input";
    publicUrlDiv.appendChild(publicUrlInput);
    fields.publicUrl = publicUrlInput;
    s3Fields.appendChild(publicUrlDiv);
    const prefixDiv = this.createFieldDiv(t("settings.prefix"), t("settings.prefix_placeholder"));
    const prefixInput = document.createElement("input");
    prefixInput.type = "text";
    prefixInput.placeholder = "obsidian/";
    prefixInput.value = this.account?.prefix || "";
    prefixInput.className = "cloud-attach-input";
    prefixDiv.appendChild(prefixInput);
    fields.prefix = prefixInput;
    s3Fields.appendChild(prefixDiv);
    this.contentEl.appendChild(s3Fields);
    const switchType = (type) => {
      openlistFields.style.display = type === "openlist" ? "block" : "none";
      s3Fields.style.display = type === "s3" ? "block" : "none";
    };
    radioOpenList.onchange = () => switchType("openlist");
    radioS3.onchange = () => switchType("s3");
    const currentType = this.account?.type === "s3" ? "s3" : "openlist";
    if (currentType === "s3")
      radioS3.checked = true;
    else
      radioOpenList.checked = true;
    switchType(currentType);
    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.gap = "8px";
    btnRow.style.justifyContent = "flex-end";
    btnRow.style.marginTop = "16px";
    const saveBtn = document.createElement("button");
    saveBtn.textContent = t("settings.save");
    saveBtn.className = "cloud-attach-btn mod-cta";
    saveBtn.onclick = async () => {
      const accountType = radioOpenList.checked ? "openlist" : "s3";
      let accountData;
      if (accountType === "s3") {
        let endpoint = fields.endpoint.value.trim().replace(/\/$/, "");
        if (endpoint && !/^https?:\/\//i.test(endpoint))
          endpoint = "http://" + endpoint;
        const bucket = fields.bucket.value.trim();
        if (!endpoint) {
          new Notice(t("settings.please_fill_endpoint"), 3e3);
          return;
        }
        if (!bucket) {
          new Notice(t("settings.please_fill_bucket"), 3e3);
          return;
        }
        accountData = {
          type: "s3",
          name: fields.name.value.trim() || t("settings.s3_account_label", { n: this.plugin.accounts.length + 1 }),
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
        let url = fields.url.value.trim().replace(/\/$/, "");
        if (url && !/^https?:\/\//i.test(url))
          url = "http://" + url;
        if (!url) {
          new Notice(t("settings.please_fill_server"), 3e3);
          return;
        }
        let autoWebdavPath = "";
        try {
          const urlObj = new URL(url);
          if (urlObj.pathname && urlObj.pathname !== "/") {
            autoWebdavPath = decodeURIComponent(urlObj.pathname.replace(/\/$/, ""));
            url = url.split(urlObj.pathname)[0].replace(/\/$/, "");
          }
        } catch {
        }
        const finalWebdavPath = autoWebdavPath || fields.webdavPath.value.trim() || "";
        accountData = {
          type: "openlist",
          name: fields.name.value.trim() || t("settings.account_label", { n: this.plugin.accounts.length + 1 }),
          url,
          webdavPath: finalWebdavPath,
          username: fields.username.value.trim(),
          password: fields.password.value,
          token: fields.token.value,
          publicUrl: fields.olPublicUrl.value.trim() || "",
          isActive: true
        };
      }
      if (this.account)
        await this.plugin.updateAccount(this.account.id, accountData);
      else
        await this.plugin.addAccount(accountData);
      this.close();
      setTimeout(() => this.onSave?.(), 50);
    };
    btnRow.appendChild(saveBtn);
    this.contentEl.appendChild(btnRow);
  }
  createFieldDiv(label, placeholder) {
    const div = document.createElement("div");
    div.style.margin = "12px 0";
    const lbl = document.createElement("label");
    lbl.textContent = label;
    lbl.style.display = "block";
    lbl.style.marginBottom = "4px";
    lbl.style.fontSize = "12px";
    lbl.style.color = "var(--text-muted)";
    div.appendChild(lbl);
    return div;
  }
};
var CloudAttachSettingTab = class extends PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }
  // 刷新侧边栏视图的下拉框
  refreshViewSelect() {
    const view = this.app.workspace.getLeavesOfType("cloud-attach-view")[0]?.view;
    if (view && view.refreshAccountSelect) {
      view.refreshAccountSelect();
    }
  }
  display() {
    this.render();
  }
  render() {
    this.containerEl.innerHTML = "";
    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.alignItems = "center";
    titleRow.style.justifyContent = "space-between";
    titleRow.style.marginBottom = "8px";
    const title = document.createElement("h2");
    title.textContent = t("settings.title");
    title.style.margin = "0";
    titleRow.appendChild(title);
    const advBtn = document.createElement("button");
    advBtn.textContent = "\u2699\uFE0F " + t("settings.advanced");
    advBtn.className = "cloud-attach-btn";
    advBtn.style.fontSize = "12px";
    advBtn.style.padding = "4px 10px";
    advBtn.onclick = () => new AdvancedSettingModal(this.app, this.plugin).open();
    titleRow.appendChild(advBtn);
    this.containerEl.appendChild(titleRow);
    if (this.plugin.accounts.length > 0) {
      this.plugin.accounts.forEach((account) => this.renderAccount(account));
    }
    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.gap = "8px";
    btnRow.style.marginTop = "16px";
    const addBtn = document.createElement("button");
    addBtn.textContent = "+ " + t("settings.add_account");
    addBtn.className = "cloud-attach-add-btn";
    addBtn.onclick = () => new AddAccountModal(this.plugin.app, this.plugin, () => {
      this.containerEl.innerHTML = "";
      this.render();
      this.refreshViewSelect();
    }).open();
    btnRow.appendChild(addBtn);
    this.containerEl.appendChild(btnRow);
  }
  renderAccount(account) {
    const card = document.createElement("div");
    card.className = "cloud-attach-card";
    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.alignItems = "center";
    headerRow.style.justifyContent = "flex-start";
    headerRow.style.marginBottom = "8px";
    const h3 = document.createElement("h3");
    h3.textContent = account.name;
    h3.style.margin = "0";
    h3.style.fontSize = "14px";
    const starBtn = document.createElement("button");
    starBtn.className = "cloud-attach-btn";
    starBtn.style.fontSize = "14px";
    starBtn.style.padding = "0 4px";
    starBtn.style.marginRight = "6px";
    starBtn.style.cursor = "pointer";
    starBtn.style.background = "none";
    starBtn.style.border = "none";
    starBtn.title = this.plugin.defaultAccountId === account.id ? t("settings.unset_default") : t("settings.set_as_default");
    starBtn.textContent = this.plugin.defaultAccountId === account.id ? "\u2728" : "\u2606";
    starBtn.style.color = this.plugin.defaultAccountId === account.id ? "#f1c40f" : "var(--text-muted)";
    starBtn.onmouseenter = () => {
      starBtn.style.opacity = "0.7";
    };
    starBtn.onmouseleave = () => {
      starBtn.style.opacity = "1";
    };
    starBtn.onclick = async () => {
      if (this.plugin.defaultAccountId === account.id) {
        await this.plugin.setDefaultAccount(null);
      } else {
        await this.plugin.setDefaultAccount(account.id);
      }
      this.containerEl.innerHTML = "";
      this.render();
      this.refreshViewSelect();
    };
    headerRow.appendChild(starBtn);
    headerRow.appendChild(h3);
    const typeBadge = document.createElement("span");
    typeBadge.style.fontSize = "10px";
    typeBadge.style.padding = "2px 6px";
    typeBadge.style.borderRadius = "10px";
    typeBadge.style.fontWeight = "600";
    if (account.type === "s3") {
      typeBadge.textContent = t("settings.openlist");
      typeBadge.style.background = "#e8f5e9";
      typeBadge.style.color = "#2e7d32";
    } else {
      typeBadge.textContent = t("settings.webdav_label");
      typeBadge.style.background = "#e3f2fd";
      typeBadge.style.color = "#1565c0";
    }
    headerRow.appendChild(typeBadge);
    card.appendChild(headerRow);
    if (account.type === "s3") {
      const p1 = document.createElement("p");
      p1.textContent = `${t("view.account_endpoint")}: ${account.endpoint}`;
      p1.className = "setting-item-description";
      p1.style.wordBreak = "break-all";
      card.appendChild(p1);
      const p2 = document.createElement("p");
      p2.textContent = `${t("view.account_bucket")}: ${account.bucket}`;
      p2.className = "setting-item-description";
      card.appendChild(p2);
      if (account.prefix) {
        const p3 = document.createElement("p");
        p3.textContent = `${t("view.account_prefix")}: ${account.prefix}`;
        p3.className = "setting-item-description";
        card.appendChild(p3);
      }
    } else {
      const p1 = document.createElement("p");
      p1.textContent = `${t("view.account_address")}: ${account.url}`;
      p1.className = "setting-item-description";
      card.appendChild(p1);
      if (account.username) {
        const p2 = document.createElement("p");
        p2.textContent = `${t("view.account_user")}: ${account.username}`;
        p2.className = "setting-item-description";
        card.appendChild(p2);
      }
    }
    const btnRow = document.createElement("div");
    btnRow.className = "cloud-attach-card-btns";
    const editBtn = document.createElement("button");
    editBtn.textContent = t("settings.edit");
    editBtn.className = "cloud-attach-btn";
    editBtn.onclick = () => new AddAccountModal(this.plugin.app, this.plugin, () => {
      this.containerEl.innerHTML = "";
      this.render();
      this.refreshViewSelect();
    }, account).open();
    const testBtn = document.createElement("button");
    testBtn.textContent = t("settings.test");
    testBtn.className = "cloud-attach-btn";
    testBtn.onclick = async () => {
      const client = this.plugin.createClient(account.id);
      if (client) {
        const ok = await client.testConnection();
        new Notice(ok ? t("notice.connect_success") : t("notice.connect_failed"), 3e3);
      }
    };
    const delBtn = document.createElement("button");
    delBtn.textContent = t("settings.delete");
    delBtn.className = "cloud-attach-btn";
    delBtn.onclick = async () => {
      await this.plugin.removeAccount(account.id);
      this.containerEl.innerHTML = "";
      this.render();
      this.refreshViewSelect();
    };
    const upBtn = document.createElement("button");
    upBtn.textContent = "\u2191";
    upBtn.className = "cloud-attach-btn";
    upBtn.title = t("settings.move_up");
    upBtn.onclick = async () => {
      await this.plugin.moveAccount(account.id, "up");
      this.containerEl.innerHTML = "";
      this.render();
      this.refreshViewSelect();
    };
    const downBtn = document.createElement("button");
    downBtn.textContent = "\u2193";
    downBtn.className = "cloud-attach-btn";
    downBtn.title = t("settings.move_down");
    downBtn.onclick = async () => {
      await this.plugin.moveAccount(account.id, "down");
      this.containerEl.innerHTML = "";
      this.render();
      this.refreshViewSelect();
    };
    btnRow.appendChild(editBtn);
    btnRow.appendChild(testBtn);
    btnRow.appendChild(delBtn);
    const spacer = document.createElement("div");
    spacer.style.flex = "1";
    btnRow.appendChild(spacer);
    btnRow.appendChild(upBtn);
    btnRow.appendChild(downBtn);
    card.appendChild(btnRow);
    this.containerEl.appendChild(card);
  }
};
var AdvancedSettingModal = class extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.innerHTML = "";
    contentEl.style.padding = "24px";
    contentEl.style.maxWidth = "520px";
    const title = contentEl.createEl("h2", { text: t("settings.advanced_title") });
    title.style.marginTop = "0";
    title.style.marginBottom = "20px";
    const autoUploadCard = contentEl.createDiv();
    autoUploadCard.className = "cloudattach-settings-card";
    autoUploadCard.style.background = "var(--background-secondary)";
    autoUploadCard.style.borderRadius = "8px";
    autoUploadCard.style.padding = "20px";
    autoUploadCard.style.marginBottom = "16px";
    const Setting = require("obsidian").Setting;
    new Setting(autoUploadCard).setName(t("settings.auto_upload")).setDesc(t("settings.auto_upload_desc")).addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.enableAutoUpload);
      toggle.onChange(async (value) => {
        if (value) {
          if (!this.plugin.defaultAccountId) {
            new Notice("\u26A0\uFE0F " + t("settings.auto_upload_need_default"), 4e3);
            toggle.setValue(false);
            return;
          }
          const defAccount = this.plugin.accounts.find((a) => a.id === this.plugin.defaultAccountId);
          if (!defAccount) {
            new Notice("\u26A0\uFE0F " + t("settings.auto_upload_need_default"), 4e3);
            toggle.setValue(false);
            return;
          }
          const confirmModal = new (require("obsidian")).Modal(this.app);
          confirmModal.titleEl.textContent = t("settings.auto_upload_confirm_title");
          const cContent = confirmModal.contentEl;
          let confirmed = false;
          confirmModal.onClose = () => {
            if (!confirmed)
              toggle.setValue(false);
          };
          cContent.style.padding = "16px";
          cContent.createEl("p", { text: t("settings.auto_upload_confirm_msg") }).style.marginBottom = "12px";
          const pathBox = cContent.createDiv();
          pathBox.style.marginBottom = "12px";
          pathBox.style.padding = "10px 12px";
          pathBox.style.background = "var(--background-secondary)";
          pathBox.style.borderRadius = "4px";
          pathBox.style.fontSize = "13px";
          pathBox.textContent = "\u{1F4C2} " + defAccount.name + "/" + (defAccount.prefix || "/");
          cContent.createEl("p", { text: t("settings.auto_upload_confirm_again") }).style.marginBottom = "12px";
          confirmModal.modalEl.querySelector(".modal-button-container")?.remove();
          const btnContainer = document.createElement("div");
          btnContainer.className = "modal-button-container";
          const okBtn = document.createElement("button");
          okBtn.className = "mod-cta";
          okBtn.textContent = t("settings.auto_upload_confirm_title") || "\u786E\u8BA4\u542F\u7528";
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
    const card = contentEl.createDiv();
    card.className = "cloudattach-settings-card";
    card.style.background = "var(--background-secondary)";
    card.style.borderRadius = "8px";
    card.style.padding = "20px";
    card.style.marginBottom = "16px";
    const catTitle = card.createEl("h3", { text: t("settings.preview_category") });
    catTitle.style.marginTop = "0";
    catTitle.style.marginBottom = "16px";
    catTitle.style.fontSize = "14px";
    catTitle.style.fontWeight = "600";
    catTitle.style.color = "var(--text-normal)";
    catTitle.style.textTransform = "uppercase";
    catTitle.style.letterSpacing = "0.5px";
    catTitle.style.opacity = "0.7";
    const pdfGroup = card.createDiv();
    pdfGroup.style.marginBottom = "16px";
    const pdfLabelRow = pdfGroup.createDiv();
    pdfLabelRow.style.display = "flex";
    pdfLabelRow.style.alignItems = "center";
    pdfLabelRow.style.gap = "6px";
    pdfLabelRow.style.marginBottom = "10px";
    const pdfIndent = pdfLabelRow.createSpan();
    pdfIndent.textContent = "\u25B8";
    pdfIndent.style.color = "var(--text-accent)";
    pdfIndent.style.fontWeight = "700";
    pdfIndent.style.fontSize = "11px";
    const pdfLabel = pdfLabelRow.createEl("span", { text: t("settings.pdf_preview") });
    pdfLabel.style.fontWeight = "600";
    pdfLabel.style.fontSize = "13px";
    const pdfOptRow = pdfGroup.createDiv();
    pdfOptRow.style.marginLeft = "18px";
    pdfOptRow.style.display = "flex";
    pdfOptRow.style.flexDirection = "column";
    pdfOptRow.style.gap = "8px";
    const mkRadio = (label, value, group) => {
      const opt = group.createDiv();
      opt.style.display = "flex";
      opt.style.alignItems = "center";
      opt.style.gap = "4px";
      const radio = opt.createEl("input", { type: "radio", attr: { name: "pdf_preview" } });
      radio.checked = this.plugin.settings.pdfPreview === value;
      radio.onchange = async () => {
        if (radio.checked) {
          this.plugin.settings.pdfPreview = value;
          await this.plugin.saveSettings();
          this.onOpen();
        }
      };
      opt.createEl("label", { text: label });
      return radio;
    };
    mkRadio(t("settings.pdf_preview_iframe"), "iframe", pdfOptRow);
    const pdfjsOpt = pdfOptRow.createDiv();
    pdfjsOpt.style.display = "flex";
    pdfjsOpt.style.alignItems = "center";
    pdfjsOpt.style.gap = "4px";
    const pdfjsRadio = pdfjsOpt.createEl("input", { type: "radio", attr: { name: "pdf_preview" } });
    pdfjsRadio.checked = this.plugin.settings.pdfPreview === "pdfjs";
    pdfjsRadio.onchange = async () => {
      if (pdfjsRadio.checked) {
        this.plugin.settings.pdfPreview = "pdfjs";
        await this.plugin.saveSettings();
        this.onOpen();
      }
    };
    const pdfjsPath = (this.app.vault.configDir || ".obsidian") + "/plugins/cloud-attach/libs/pdfjs/";
    const hasPdfjs = await this.app.vault.adapter.exists(pdfjsPath + "pdf.min.js");
    pdfjsOpt.createEl("label", { text: hasPdfjs ? "PDF.js" + (t("settings.pdfjs_installed") || "") : "PDF.js" + (t("settings.pdfjs_auto_install") || "") });
    if (hasPdfjs) {
      const delBtn = pdfjsOpt.createEl("button", { text: t("settings.pdfjs_uninstall") || "\u5378\u8F7D" });
      delBtn.style.marginLeft = "4px";
      delBtn.onclick = async () => {
        try {
          await this.app.vault.adapter.rmdir(pdfjsPath, true);
        } catch (e) {
        }
        this.onOpen();
      };
    }
    const pdfNote = pdfGroup.createDiv();
    pdfNote.style.marginLeft = "18px";
    pdfNote.style.marginTop = "6px";
    pdfNote.style.fontSize = "12px";
    pdfNote.style.color = "var(--text-muted)";
    pdfNote.textContent = "\u9009\u5B9A PDF.js \u540E\u4F7F\u7528 `![]()` \u8BED\u6CD5\u63D2\u5165\u9884\u89C8";
    const excelGroup = card.createDiv();
    excelGroup.style.marginBottom = "16px";
    const excelLabelRow = excelGroup.createDiv();
    excelLabelRow.style.display = "flex";
    excelLabelRow.style.alignItems = "center";
    excelLabelRow.style.gap = "6px";
    excelLabelRow.style.marginBottom = "6px";
    const excelIndent = excelLabelRow.createSpan();
    excelIndent.textContent = "\u25B8";
    excelIndent.style.color = "var(--text-muted)";
    excelIndent.style.fontWeight = "700";
    excelIndent.style.fontSize = "11px";
    const excelLabel = excelLabelRow.createEl("span", { text: t("settings.excel_preview") });
    excelLabel.style.fontWeight = "600";
    excelLabel.style.fontSize = "13px";
    excelLabel.style.color = "var(--text-muted)";
    const excelNote = excelGroup.createDiv();
    excelNote.style.marginLeft = "18px";
    excelNote.style.fontSize = "12px";
    excelNote.style.color = "var(--text-faint)";
    excelNote.textContent = t("settings.preview_coming_soon");
    const wordGroup = card.createDiv();
    const wordLabelRow = wordGroup.createDiv();
    wordLabelRow.style.display = "flex";
    wordLabelRow.style.alignItems = "center";
    wordLabelRow.style.gap = "6px";
    wordLabelRow.style.marginBottom = "6px";
    const wordIndent = wordLabelRow.createSpan();
    wordIndent.textContent = "\u25B8";
    wordIndent.style.color = "var(--text-muted)";
    wordIndent.style.fontWeight = "700";
    wordIndent.style.fontSize = "11px";
    const wordLabel = wordLabelRow.createEl("span", { text: t("settings.word_preview") });
    wordLabel.style.fontWeight = "600";
    wordLabel.style.fontSize = "13px";
    wordLabel.style.color = "var(--text-muted)";
    const wordNote = wordGroup.createDiv();
    wordNote.style.marginLeft = "18px";
    wordNote.style.fontSize = "12px";
    wordNote.style.color = "var(--text-faint)";
    wordNote.textContent = t("settings.preview_coming_soon");
    const btnRow = contentEl.createDiv();
    btnRow.style.marginTop = "20px";
    btnRow.style.display = "flex";
    btnRow.style.justifyContent = "flex-end";
    btnRow.style.gap = "8px";
    const saveBtn = btnRow.createEl("button", { text: t("settings.save") || "\u4FDD\u5B58" });
    saveBtn.className = "mod-cta";
    saveBtn.onclick = async () => {
      const pdfjsPath2 = (this.app.vault.configDir || ".obsidian") + "/plugins/cloud-attach/libs/pdfjs/";
      if (this.plugin.settings.pdfPreview === "pdfjs" && !await this.app.vault.adapter.exists(pdfjsPath2 + "pdf.min.js")) {
        new Notice(t("settings.pdfjs_installing"));
        try {
          await this.downloadPdfjs(pdfjsPath2);
          new Notice("\u2705 PDF.js " + (t("settings.pdfjs_installed") || "\u5B89\u88C5\u6210\u529F"));
        } catch (e) {
          new Notice("\u274C PDF.js \u5B89\u88C5\u5931\u8D25: " + e.message);
          return;
        }
      }
      await this.plugin.saveSettings();
      new Notice(t("settings.saved") || "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
      this.close();
    };
  }
  async downloadPdfjs(destDir) {
    const destDirNorm = destDir.replace(/\/$/, "");
    try {
      await this.app.vault.adapter.mkdir(destDirNorm, { recursive: true });
    } catch (e) {
    }
    const files = [
      { name: "pdf.min.js", url: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js" },
      { name: "pdf.worker.min.js", url: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js" }
    ];
    for (const f of files) {
      const res = await fetch(f.url);
      if (!res.ok)
        throw new Error("download failed: " + f.name + " HTTP " + res.status);
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 1e3)
        throw new Error("file too small: " + f.name + " (" + buf.byteLength + " bytes, possibly HTML error page)");
      await this.app.vault.adapter.writeBinary(destDirNorm + "/" + f.name, new Uint8Array(buf));
    }
    try {
      delete globalThis.pdfjsLib;
    } catch (e) {
    }
  }
};
var CloudAttachSuggest = class extends EditorSuggest {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.limit = 100;
  }
  onTrigger(cursor, editor, file) {
    if (!file)
      return null;
    const line = editor.getLine(cursor.line);
    const sub = line.substring(0, cursor.ch);
    const idx = sub.lastIndexOf("cloud-");
    if (idx === -1)
      return null;
    if (idx > 0 && /[\w-]/.test(sub[idx - 1]))
      return null;
    const query = sub.substring(idx + 6);
    return { start: { line: cursor.line, ch: idx }, end: { line: cursor.line, ch: cursor.ch }, query };
  }
  async getSuggestions(context) {
    const ctx = this.plugin.getDefaultUploadContext();
    if (!ctx || !ctx.ok)
      return [];
    const query = context.query || "";
    let dirPath = "/";
    let filter = "";
    if (query) {
      const lastSlash = query.lastIndexOf("/");
      if (lastSlash >= 0) {
        const pathParts = query.substring(0, lastSlash).split("/").filter((p) => p);
        dirPath = "/" + pathParts.join("/");
        if (dirPath !== "/")
          dirPath += "/";
        filter = query.substring(lastSlash + 1);
      } else {
        filter = query;
      }
    }
    try {
      const files = await ctx.client.listDirectory(dirPath);
      if (!filter)
        return files;
      const q = filter.toLowerCase();
      return files.filter((f) => {
        if (f.name.toLowerCase().includes(q))
          return true;
        if (f.isDirectory)
          return f.name.toLowerCase().startsWith(q);
        return false;
      });
    } catch (e) {
      console.error("[CloudAttach] EditorSuggest list error:", e);
      return [];
    }
  }
  renderSuggestion(suggestion, el) {
    const icon = suggestion.isDirectory ? "\u{1F4C1} " : "\u{1F4C4} ";
    el.createSpan({ text: icon });
    const nameEl = el.createSpan({ text: suggestion.name });
    nameEl.style.color = "var(--text-normal)";
    if (!suggestion.isDirectory && suggestion.size) {
      const sizeStr = suggestion.size < 1024 * 1024 ? ` ${(suggestion.size / 1024).toFixed(0)}KB` : ` ${(suggestion.size / 1024 / 1024).toFixed(1)}MB`;
      const sizeEl = el.createSpan({ text: sizeStr });
      sizeEl.style.color = "var(--text-faint)";
      sizeEl.style.fontSize = "12px";
    }
  }
  async selectSuggestion(suggestion, evt) {
    const context = this.context;
    if (!context)
      return;
    const { editor, start, end, query } = context;
    if (suggestion.isDirectory) {
      const q = query || "";
      let basePath = "";
      if (q.includes("/")) {
        const lastSlash = q.lastIndexOf("/");
        basePath = q.substring(0, lastSlash + 1);
      }
      const nextPath = `cloud-${basePath}${suggestion.name}/`;
      editor.replaceRange(nextPath, start, end);
      return;
    }
    const ctx = this.plugin.getDefaultUploadContext();
    if (!ctx || !ctx.ok)
      return;
    try {
      const ext = (suggestion.name.split(".").pop() || "").toLowerCase();
      const nameWithoutExt = suggestion.name.replace(/\.[^.]+$/, "");
      const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "heic", "heif"];
      const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "flv"];
      const audioExts = ["mp3", "wav", "flac", "aac", "ogg", "m4a"];
      const docExts = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];
      const isPdfJsInsert = ext === "pdf" && this.plugin.settings.pdfPreview === "pdfjs";
      let url;
      if (docExts.includes(ext) && !isPdfJsInsert) {
        url = ctx.client.getRawUrl ? ctx.client.getRawUrl(suggestion.path) : ctx.client.getFileUrl(suggestion.path);
      } else {
        const signedUrl = await (ctx.client.getSignedUrl ? ctx.client.getSignedUrl(suggestion.path) : null);
        url = signedUrl || ctx.client.getFileUrl(suggestion.path);
      }
      let syntax;
      if (imageExts.includes(ext)) {
        syntax = `![${nameWithoutExt}](${url})`;
      } else if (videoExts.includes(ext)) {
        const videoType = ext === "webm" ? "video/webm" : ext === "mov" ? "video/quicktime" : "video/mp4";
        syntax = `<video controls width="600" height="400">
 <source src="${url}" type="${videoType}">
</video>`;
      } else if (audioExts.includes(ext)) {
        const audioType = ext === "ogg" ? "audio/ogg" : ext === "wav" ? "audio/wav" : "audio/mpeg";
        syntax = `<audio controls>
 <source src="${url}" type="${audioType}">
</audio>`;
      } else if (docExts.includes(ext) && !isPdfJsInsert) {
        syntax = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
      } else if (isPdfJsInsert) {
        syntax = `![${nameWithoutExt}](${url})`;
      } else {
        syntax = `[${nameWithoutExt}](${url})`;
      }
      editor.replaceRange(syntax, start, end);
    } catch (e) {
      console.error("[CloudAttach] EditorSuggest select error:", e);
      new Notice("\u274C " + e.message, 4e3);
    }
  }
};
module.exports = class CloudAttachPlugin extends Plugin {
  constructor() {
    super(...arguments);
    this.accounts = [];
  }
  async onload() {
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
    const momentLocale = (window.moment || moment).locale();
    const lang = this.app.vault.config?.language || momentLocale || "zh";
    I18n.setLang(lang);
    console.log("CloudAttach loading, language:", I18n.currentLang, "momentLocale:", momentLocale);
    await this.loadSettings();
    globalThis._cloudAttachPlugin = this;
    this.addStyles();
    this.addRibbonIcon("folder-open", t("cmd.open_browser"), () => this.activateView());
    this.addSettingTab(new CloudAttachSettingTab(this));
    this.registerEditorSuggest(new CloudAttachSuggest(this.app, this));
    this.addCommand({ id: "open-browser", name: t("cmd.open_cloud_attach"), callback: () => this.activateView() });
    this.addCommand({
      id: "reload-plugin",
      name: t("cmd.reload_plugin"),
      callback: async () => {
        new Notice("\u8BF7\u624B\u52A8\u7981\u7528\u518D\u542F\u7528\u63D2\u4EF6\u4EE5\u91CD\u8F7D", 2e3);
      }
    });
    this.addCommand({
      id: "check-sign-current-note",
      name: t("cmd.check_and_refresh_note_sign"),
      callback: () => this.checkAndRefreshCurrentNote()
    });
    this.addCommand({
      id: "check-sign-current-url",
      name: t("cmd.check_and_refresh_url_sign"),
      callback: () => this.checkAndRefreshCurrentUrl()
    });
    this.addCommand({
      id: "upload-current-attachment",
      name: t("cmd.upload_current_attachment"),
      callback: () => this.uploadCurrentAttachment()
    });
    this.addCommand({
      id: "upload-all-attachments",
      name: t("cmd.upload_all_in_note"),
      callback: () => this.uploadAllAttachments()
    });
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        menu.addItem((item) => {
          item.setTitle("CloudAttach");
          item.setSubmenu();
          const submenu = item.submenu;
          if (!submenu)
            return;
          submenu.addItem((si) => {
            si.setTitle(t("menu.refresh_current_url_sign")).onClick(() => {
              this.checkAndRefreshCurrentUrl();
            });
          });
          submenu.addItem((si) => {
            si.setTitle(t("menu.refresh_all_note_sign")).onClick(() => {
              this.checkAndRefreshCurrentNote();
            });
          });
          submenu.addSeparator();
          submenu.addItem((si) => {
            si.setTitle(t("menu.upload_current_attach")).onClick(() => {
              this.uploadCurrentAttachment();
            });
          });
          submenu.addItem((si) => {
            si.setTitle(t("menu.upload_all_attach")).onClick(() => {
              this.uploadAllAttachments();
            });
          });
        });
      })
    );
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file, source) => {
        if (!file || !source.startsWith("file-explorer"))
          return;
        const ext = file.extension?.toLowerCase() || "";
        if (ext === "md")
          return;
        menu.addSeparator();
        menu.addItem((item) => {
          item.setTitle("\u2601\uFE0F " + t("menu.upload_to_cloud"));
          item.onClick(async () => {
            try {
              const linkedNotes = this._findNotesWithFile(file.path);
              let targetNote = linkedNotes[0];
              if (!targetNote) {
                targetNote = this.app.workspace.getActiveFile();
                if (!targetNote || targetNote.extension !== "md") {
                  new Notice(t("notice.file_not_linked"), 3e3);
                  return;
                }
              } else if (linkedNotes.length > 1) {
                const activeFile = this.app.workspace.getActiveFile();
                const found = linkedNotes.find((n) => n.path === activeFile?.path);
                if (found)
                  targetNote = found;
              }
              const noteContent = await this.app.vault.read(targetNote);
              let syntax = null;
              const patterns = [
                new RegExp(`!\\[([^\\]]*)\\]\\(.*?${this._escapeRegex(file.name)}\\)`),
                new RegExp(`!\\[\\[(${this._escapeRegex(file.name)})(?:\\|[^\\]]*)?\\]\\]`),
                new RegExp(`\\[\\[(${this._escapeRegex(file.name)})(?:\\|[^\\]]*)?\\]\\]`)
              ];
              for (const p of patterns) {
                const m = noteContent.match(p);
                if (m) {
                  syntax = m[0];
                  break;
                }
              }
              if (!syntax)
                syntax = `![${file.name}](${file.path})`;
              const viewOpen = !!this.app.workspace.getLeavesOfType(VIEW_TYPE_CLOUDATTACH).length;
              let ctx = null;
              if (viewOpen)
                ctx = this.getUploadContext();
              const confirmed = await this.showUploadConfirmModal([{ localPath: file.path, syntax }], ctx?.remotePath || "", viewOpen);
              if (!confirmed)
                return;
              const uploadCtx = confirmed.useDefault || !viewOpen ? this.getDefaultUploadContext() : ctx;
              if (!uploadCtx || !uploadCtx.ok) {
                new Notice(`\u26A0\uFE0F ${uploadCtx?.error || t("error.no_account")}`, 4e3);
                return;
              }
              await this.doUpload([{ localPath: file.path, syntax }], uploadCtx);
            } catch (e) {
              console.error("[CloudAttach] file-menu upload error:", e);
              new Notice(`\u274C ${e.message}`, 4e3);
            }
          });
        });
      })
    );
    this.activeMarkdownView = null;
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      if (leaf?.view instanceof MarkdownView && leaf.view.editor) {
        this.activeMarkdownView = leaf.view;
      }
    }));
    const activeLeaf = this.app.workspace.getMostRecentLeaf();
    if (activeLeaf?.view instanceof MarkdownView && activeLeaf.view.editor) {
      this.activeMarkdownView = activeLeaf.view;
    }
    this._observePdfEmbeds();
    this.registerMarkdownPostProcessor(async (el, ctx) => {
      const imgs = el.querySelectorAll("img");
      if (imgs.length === 0)
        return;
      const blobImgs = Array.from(imgs).filter(
        (img) => !img.closest(".cloudattach-pdf-container") && (img.getAttribute("src") || "").startsWith("blob:")
      );
      if (blobImgs.length === 0)
        return;
      if (!ctx.sourcePath)
        return;
      const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
      if (!file || !file.extension)
        return;
      try {
        const content = await this.app.vault.cachedRead(file);
        const pdfPatterns = [];
        const re = /!?\[([^\]]*)\]\(([^)]*)\)/gi;
        let m;
        while ((m = re.exec(content)) !== null) {
          const url = m[2];
          if (url.toLowerCase().includes(".pdf")) {
            const label = m[1];
            let width = "";
            const barIdx = label.lastIndexOf("|");
            if (barIdx !== -1) {
              const afterBar = label.substring(barIdx + 1).trim();
              if (/^\d+$/.test(afterBar))
                width = afterBar;
            }
            pdfPatterns.push({ url, width });
          }
          if (this._isHeicUrl(url)) {
            pdfPatterns.push({ url, width: "", heic: true });
          }
        }
        blobImgs.forEach((img, idx) => {
          if (idx < pdfPatterns.length) {
            const pat = pdfPatterns[idx];
            if (pat.heic) {
              img.dataset.cloudattachHeicUrl = pat.url;
            } else {
              img.dataset.cloudattachPdfUrl = pat.url;
              if (pat.width)
                img.dataset.cloudattachWidth = pat.width;
            }
            img.dataset.cloudattachProcessed = "pending";
          }
        });
      } catch (e) {
        console.log("[CloudAttach] PostProcessor error:", e);
      }
    });
    try {
      this.registerView(VIEW_TYPE_CLOUDATTACH, (leaf) => new CloudAttachView(leaf, this));
    } catch (e) {
      if (e.message?.includes("existing view type")) {
        console.log("[CloudAttach] view type already registered, skipping");
      } else {
        throw e;
      }
    }
    if (!this._autoUploadChain)
      this._autoUploadChain = Promise.resolve();
    this.registerEvent(this.app.vault.on("create", (file) => {
      if (!this.settings.enableAutoUpload)
        return;
      if (!this.defaultAccountId)
        return;
      const TFile = require("obsidian").TFile;
      if (!(file instanceof TFile))
        return;
      if (file.extension.toLowerCase() === "md")
        return;
      this._autoUploadChain = this._autoUploadChain.then(() => new Promise((resolve) => {
        const tryUpload = async (retriesLeft) => {
          const view = this.activeMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
          if (!view?.editor || !view.file) {
            resolve();
            return;
          }
          const text = view.editor.getValue();
          const fileName = file.path.split("/").pop();
          const escapedName = this._escapeRegex(fileName);
          const wikiPattern = new RegExp("!\\[\\[(?:.*/)?" + escapedName + "(?:\\|[^\\]]*)?\\]\\]");
          const mdPattern = new RegExp("!\\[[^\\]]*\\]\\((?:.*/)?" + escapedName + "\\)");
          const wikiMatch = text.match(wikiPattern);
          const mdMatch = text.match(mdPattern);
          if (!wikiMatch && !mdMatch) {
            if (retriesLeft > 0) {
              setTimeout(() => tryUpload(retriesLeft - 1), 1e3);
            } else {
              resolve();
            }
            return;
          }
          const ctx = this.getDefaultUploadContext();
          if (!ctx || !ctx.ok) {
            resolve();
            return;
          }
          await this.doUpload([{ localPath: file.path, syntax: (wikiMatch || mdMatch)[0] }], ctx);
          resolve();
        };
        setTimeout(() => tryUpload(2), 500);
      }));
    }));
    console.log("CloudAttach loaded");
  }
  addStyles() {
    const css = `
      .cloud-attach-header { padding: 8px 8px 6px; }
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
    
    /* PDF \u9884\u89C8\u5BB9\u5668 - \u53CC\u5C42\u7ED3\u6784\uFF0C\u4EFF Obsidian \u539F\u751F .pdf-embed */
    .cloudattach-pdf-container { box-sizing: border-box !important; display: inline-block !important; width: 100%; max-width: 100% !important; border: 1px solid var(--background-modifier-border) !important; border-radius: 8px !important; background: var(--background-secondary) !important; vertical-align: top !important; position: relative !important; overflow: hidden !important; }
    .cloudattach-pdf-page { display: block !important; box-sizing: border-box !important; width: 100% !important; height: auto !important; max-width: 100% !important; min-width: 0 !important; }
    `;
    const styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    this.register(() => styleEl.remove());
  }
  async activateView() {
    const { workspace } = this.app;
    console.log("[CloudAttach] activateView called");
    const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_CLOUDATTACH);
    console.log("[CloudAttach] existing leaves:", existingLeaves.length);
    if (existingLeaves.length > 0) {
      console.log("[CloudAttach] revealing existing leaf");
      workspace.revealLeaf(existingLeaves[0]);
      return;
    }
    console.log("[CloudAttach] creating new leaf");
    let leaf = workspace.getRightLeaf(false);
    if (!leaf) {
      console.log("[CloudAttach] no right leaf, using default");
      leaf = workspace.getLeaf("split", "vertical");
    }
    await leaf.setViewState({ type: VIEW_TYPE_CLOUDATTACH, active: true });
    workspace.revealLeaf(leaf);
    console.log("[CloudAttach] new leaf created");
  }
  onunload() {
    console.log("CloudAttach unloading...");
    if (this._pdfObserver)
      this._pdfObserver.disconnect();
    this._flushPdfErrorLog();
  }
  _flushPdfErrorLog() {
    if (!this._pdfErrorLog)
      return;
    try {
      const filePath = (this.app.vault.configDir || ".obsidian") + "/plugins/cloud-attach/pdf-error-log.md";
      const existingPromise = this.app.vault.adapter.read(filePath).catch(() => "");
      existingPromise.then((existing) => {
        const content = (existing ? existing + "\n" : "# CloudAttach PDF Error Log\n") + this._pdfErrorLog;
        this.app.vault.adapter.write(filePath, content).catch((e) => console.error("[CloudAttach] flush log failed:", e));
      });
    } catch (e) {
      console.error("[CloudAttach] _flushPdfErrorLog failed:", e);
    }
    this._pdfErrorLog = "";
  }
  // ============================================================
  // PDF.js 内联预览（v0.3.026）
  // ============================================================
  async _loadPdfJs() {
    if (window.pdfjsLib)
      return window.pdfjsLib;
    const pdfJsPath = (this.app.vault.configDir || ".obsidian") + "/plugins/cloud-attach/libs/pdfjs/pdf.min.js";
    const workerPath = (this.app.vault.configDir || ".obsidian") + "/plugins/cloud-attach/libs/pdfjs/pdf.worker.min.js";
    try {
      const pdfJsText = await this.app.vault.adapter.read(pdfJsPath);
      const fn = new Function("window", pdfJsText + "\nreturn window.pdfjsLib;");
      window.pdfjsLib = fn(window);
      const workerText = await this.app.vault.adapter.read(workerPath);
      const uint8 = new TextEncoder().encode(workerText);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const workerBase64 = btoa(binary);
      const lib = window.pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = "data:application/javascript;base64," + workerBase64;
      return window.pdfjsLib;
    } catch (e) {
      console.error("[CloudAttach] _loadPdfJs failed:", e);
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
    if (window._cloudAttachHeic2any)
      return window._cloudAttachHeic2any;
    const path = (this.app.vault.configDir || ".obsidian") + "/plugins/cloud-attach/heic2any.bundle.js";
    const code = await this.app.vault.adapter.read(path);
    const clean = code.replace(/^!\s*/, "");
    const m = { exports: {} };
    const fn = new Function("exports", "require", "module", "__filename", "__dirname", "return (" + clean + ")");
    window._cloudAttachHeic2any = fn(m.exports, void 0, m, "", "");
    return window._cloudAttachHeic2any;
  }
  async _renderHeicAsImage(imgEl, url) {
    url = encodeURI(decodeURI(url));
    if (imgEl.closest(".cloudattach-heic-container"))
      return;
    const modeKey = imgEl.closest(".markdown-reading-view") ? "reading" : "editing";
    if (!this._renderedHeic)
      this._renderedHeic = {};
    if (!this._renderedHeic[modeKey])
      this._renderedHeic[modeKey] = /* @__PURE__ */ new Set();
    const renderedSet = this._renderedHeic[modeKey];
    if (renderedSet.has(url))
      return;
    try {
      let reqUrlFn = null;
      try {
        reqUrlFn = require("obsidian").requestUrl;
      } catch (e) {
      }
      const resp = reqUrlFn ? await reqUrlFn({ url, method: "GET" }) : await fetch(url);
      const buf = resp.arrayBuffer || await resp.arrayBuffer();
      const blob = new Blob([buf]);
      const heic2any = await this._loadHeic2any();
      const result = await heic2any({ blob, toType: "image/png" });
      const pngBlob = Array.isArray(result) ? result[0] : result;
      const blobUrl = URL.createObjectURL(pngBlob);
      imgEl.src = blobUrl;
      imgEl.style.maxWidth = "100%";
      imgEl.style.height = "auto";
      renderedSet.add(url);
    } catch (e) {
      if (e.message && e.message.includes("401"))
        return;
      console.log("[CloudAttach] HEIC render failed:", e.message || e);
    }
  }
  async _renderPdfAsCanvas(imgEl, url) {
    const modeKey = imgEl.closest(".markdown-reading-view") ? "reading" : "editing";
    if (!this._renderedPdfUrlsByMode)
      this._renderedPdfUrlsByMode = {};
    if (!this._renderedPdfUrlsByMode[modeKey])
      this._renderedPdfUrlsByMode[modeKey] = /* @__PURE__ */ new Set();
    const renderedSet = this._renderedPdfUrlsByMode[modeKey];
    if (renderedSet.has(url))
      return;
    if (!this._pdfRenderChain)
      this._pdfRenderChain = Promise.resolve();
    if (this._pdfQueuedUrls && this._pdfQueuedUrls.has(url)) {
      return this._pdfRenderPromises ? this._pdfRenderPromises.get(url) : void 0;
    }
    if (!this._pdfQueuedUrls)
      this._pdfQueuedUrls = /* @__PURE__ */ new Set();
    if (!this._pdfRenderPromises)
      this._pdfRenderPromises = /* @__PURE__ */ new Map();
    this._pdfQueuedUrls.add(url);
    const doRender = async () => {
      let failStage = "unknown";
      try {
        let pdfjsLib;
        try {
          pdfjsLib = await this._loadPdfJs();
        } catch (loadErr) {
          failStage = "loadPdfJs";
          throw loadErr;
        }
        let fetchInfo = "";
        let pdfData = null;
        try {
          const resp = await fetch(url, { method: "HEAD" });
          fetchInfo = "status=" + resp.status + " size=" + (resp.headers.get("content-length") || "?");
        } catch (fErr) {
          fetchInfo = "fetch_err:" + (fErr.message || fErr);
        }
        let reqUrlFn = null;
        try {
          reqUrlFn = require("obsidian").requestUrl;
        } catch (e) {
        }
        if (reqUrlFn) {
          try {
            const resp = await reqUrlFn({ url, method: "GET" });
            pdfData = resp.arrayBuffer;
            if (fetchInfo.indexOf("viaObsidian") === -1)
              fetchInfo += " viaObsidian";
          } catch (e) {
            if (!fetchInfo)
              fetchInfo = "download_err:" + (e.message || e);
          }
        }
        const loadingTask = pdfData ? pdfjsLib.getDocument({ data: pdfData, ownerDocument: imgEl.ownerDocument }) : pdfjsLib.getDocument({ url, ownerDocument: imgEl.ownerDocument, disableAutoFetch: true });
        let pdf;
        try {
          pdf = await loadingTask.promise;
          console.log("[CloudAttach] PDF doc loaded, pages:", pdf.numPages);
        } catch (docErr) {
          failStage = "getDocument";
          docErr._fetchInfo = fetchInfo;
          throw docErr;
        }
        let imgWidth = imgEl.dataset.cloudattachWidth || imgEl.getAttribute("width") || imgEl.style.width || "";
        console.log("[CloudAttach] _renderPdfAsCanvas width \u2014 dataset:", imgEl.dataset.cloudattachWidth, "attr:", imgEl.getAttribute("width"), "style:", imgEl.style.width, "final:", imgWidth);
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
        const altWidthMatch = imgEl.alt?.match(/^(\d+)$/);
        if (altWidthMatch && !imgWidth && !imgEl.dataset.cloudattachWidth) {
          imgWidth = altWidthMatch[1] + "px";
        }
        const container = document.createElement("span");
        container.className = "cloudattach-pdf-container";
        container.dataset.currentPage = "1";
        container.dataset.totalPages = pdf.numPages.toString();
        container.dataset.pdfUrl = url;
        const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
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
        const scrollArea = document.createElement("div");
        scrollArea.className = "cloudattach-pdf-scrollarea";
        let touchDevice = false;
        scrollArea.style.overflowY = isTouchDevice ? "scroll" : "auto";
        scrollArea.style.overflowX = "hidden";
        scrollArea.style.position = "relative";
        container.appendChild(scrollArea);
        imgEl.replaceWith(container);
        const containerW = container.clientWidth || 800;
        container.style.setProperty("opacity", "0", "important");
        const firstPage = await pdf.getPage(1);
        const firstViewport = firstPage.getViewport({ scale: FIXED_SCALE });
        const canvasW = firstViewport.width;
        const canvasH = firstViewport.height;
        const firstCanvas = document.createElement("canvas");
        firstCanvas.className = "cloudattach-pdf-page";
        firstCanvas.dataset.pageNum = "1";
        firstCanvas.style.userSelect = "none";
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
        const resizeObserver = new ResizeObserver(() => {
          const newW = container.clientWidth || 800;
          const newH = Math.round(canvasH * (newW / canvasW));
          if (!userHeightStr) {
            container.style.setProperty("height", newH + "px", "important");
          }
        });
        resizeObserver.observe(container);
        this._initPdfToolbar(container, pdf);
        const pagePlaceholders = [];
        for (let i = 2; i <= pdf.numPages; i++) {
          const placeholder = document.createElement("div");
          placeholder.className = "cloudattach-pdf-placeholder";
          placeholder.dataset.pageNum = String(i);
          placeholder.dataset.pdfUrl = url;
          placeholder.style.minHeight = "100px";
          placeholder.style.background = "#f0f0f0";
          placeholder.style.margin = "10px 0";
          scrollArea.appendChild(placeholder);
          pagePlaceholders.push(placeholder);
        }
        if (pagePlaceholders.length > 0) {
          const lazyQueue = [];
          let lazyBusy = false;
          const processQueue = async () => {
            if (lazyBusy || lazyQueue.length === 0)
              return;
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
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const ph = entry.target;
                if (ph.dataset.rendered)
                  return;
                ph.dataset.rendered = "true";
                lazyQueue.push(ph);
                processQueue();
                lazyObserver.unobserve(ph);
              }
            });
          }, { rootMargin: "200px" });
          pagePlaceholders.forEach((ph) => lazyObserver.observe(ph));
          if (!this._pdfLazyObservers)
            this._pdfLazyObservers = /* @__PURE__ */ new Set();
          this._pdfLazyObservers.add(lazyObserver);
        }
        imgEl.dataset.cloudattachProcessed = "done";
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
        this._pdfErrorLog = (this._pdfErrorLog || "") + "\n- " + (/* @__PURE__ */ new Date()).toISOString() + " | " + errorDetails + " | " + url;
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
    const renderPromise = this._pdfRenderChain.then(() => doRender());
    renderPromise.finally(() => {
      this._pdfRenderPromises.delete(url);
      this._pdfQueuedUrls.delete(url);
    });
    this._pdfRenderPromises.set(url, renderPromise);
    this._pdfRenderChain = renderPromise;
    return renderPromise;
  }
  // 渲染指定页码的 PDF 页面到指定 canvas
  // containerW: 容器实际显示宽度，用于计算 canvas CSS 高度以维护宽高比
  async _renderPdfPage(canvas, pdf, pageNum, scale, containerW) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = "100%";
    if (containerW) {
      canvas.style.height = Math.round(viewport.height * (containerW / viewport.width)) + "px";
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    await page.render({ canvasContext: ctx, viewport }).promise;
  }
  // 懒加载：渲染单页并替换占位符
  async _renderLazyPage(placeholder, pdf, pageNum, scale, containerW) {
    const canvas = document.createElement("canvas");
    canvas.className = "cloudattach-pdf-page";
    canvas.dataset.pageNum = String(pageNum);
    canvas.style.userSelect = "none";
    canvas.draggable = false;
    await this._renderPdfPage(canvas, pdf, pageNum, scale, containerW);
    placeholder.replaceWith(canvas);
    console.log("[CloudAttach] lazy page", pageNum, "rendered");
  }
  // 监听滚动更新当前页码（连续滚动模式，scroll 事件 + scrollTop/scrollHeight）
  _bindPdfScroll(container, pdf) {
    const scrollArea = container.querySelector(".cloudattach-pdf-scrollarea");
    if (!scrollArea)
      return;
    const onScroll = () => {
      if (container.dataset.scrollProgrammatic)
        return;
      const canvases = scrollArea.querySelectorAll("canvas.cloudattach-pdf-page");
      if (!canvases.length)
        return;
      const scrollMid = scrollArea.scrollTop + scrollArea.clientHeight / 3;
      let pageNum = 1;
      for (let i = 0; i < canvases.length; i++) {
        if (canvases[i].offsetTop <= scrollMid) {
          pageNum = parseInt(canvases[i].dataset.pageNum) || i + 1;
        } else
          break;
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
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
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
      const { Notice: Notice2 } = require("obsidian");
      new Notice2("\u{1F50D} \u5168\u5C4F\u9884\u89C8\u529F\u80FD\uFF0C\u656C\u8BF7\u671F\u5F85");
    };
    const scrollArea = container.querySelector(".cloudattach-pdf-scrollarea");
    const scrollToPage = (pageNum) => {
      const firstPage = scrollArea.querySelector(".cloudattach-pdf-page");
      if (!firstPage)
        return;
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
    if (this._pdfObserver)
      return;
    if (!this._renderedPdfUrlsByMode)
      this._renderedPdfUrlsByMode = { editing: /* @__PURE__ */ new Set(), reading: /* @__PURE__ */ new Set() };
    this._pdfObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1)
            return;
          const imgs = n.tagName === "IMG" ? [n] : Array.from(n.querySelectorAll("img"));
          imgs.forEach((img) => {
            if (img.closest(".cloudattach-pdf-container"))
              return;
            const src = img.getAttribute("src") || "";
            if (this._isPdfUrl(src)) {
              this._renderPdfAsCanvas(img, src);
            }
          });
        });
      });
    });
    this._pdfObserver.observe(document.body, { childList: true, subtree: true });
    this._popoutObservers = /* @__PURE__ */ new Map();
    this._registerPopoutObservers();
    setTimeout(() => this._scanAllPdfImgs(), 500);
    setTimeout(() => this._scanAllPdfImgs(), 3e3);
    const rescanPdfImgs = () => {
      this._renderedPdfUrlsByMode = { editing: /* @__PURE__ */ new Set(), reading: /* @__PURE__ */ new Set() };
      if (this._pdfLazyObservers) {
        this._pdfLazyObservers.forEach((obs) => obs.disconnect());
        this._pdfLazyObservers.clear();
      }
      this._scanAllPdfImgs();
      setTimeout(() => this._scanAllPdfImgs(), 500);
      setTimeout(() => this._scanAllPdfImgs(), 1500);
      setTimeout(() => this._scanAllPdfImgs(), 3e3);
      this._popoutObservers.forEach((obs, doc) => {
        this._scanAllPdfImgs(doc);
        setTimeout(() => this._scanAllPdfImgs(doc), 500);
        setTimeout(() => this._scanAllPdfImgs(doc), 1500);
        setTimeout(() => this._scanAllPdfImgs(doc), 3e3);
      });
    };
    this.registerEvent(this.app.workspace.on("active-leaf-change", rescanPdfImgs));
    this.registerEvent(this.app.workspace.on("layout-change", () => {
      this._renderedPdfUrlsByMode = { editing: /* @__PURE__ */ new Set(), reading: /* @__PURE__ */ new Set() };
      this._scanAllPdfImgs();
      setTimeout(() => this._scanAllPdfImgs(), 500);
      setTimeout(() => this._scanAllPdfImgs(), 3e3);
      this._registerPopoutObservers();
    }));
  }
  _registerPopoutObservers() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const doc = leaf.containerEl.ownerDocument;
      if (doc === document)
        return;
      if (this._popoutObservers.has(doc))
        return;
      const popoutObserver = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          m.addedNodes.forEach((n) => {
            if (n.nodeType !== 1)
              return;
            const imgs = n.tagName === "IMG" ? [n] : Array.from(n.querySelectorAll("img"));
            imgs.forEach((img) => {
              if (img.closest(".cloudattach-pdf-container"))
                return;
              const src = img.getAttribute("src") || "";
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
    const pendingImgs = d.querySelectorAll('img[data-cloudattach-processed="pending"]');
    pendingImgs.forEach((img) => {
      if (img.closest(".cloudattach-pdf-container"))
        return;
      const pdfUrl = img.dataset.cloudattachPdfUrl;
      const heicUrl = img.dataset.cloudattachHeicUrl;
      if (pdfUrl) {
        img.dataset.cloudattachProcessed = "done";
        this._renderPdfAsCanvas(img, pdfUrl);
      } else if (heicUrl) {
        img.dataset.cloudattachProcessed = "done";
        this._renderHeicAsImage(img, heicUrl);
      }
    });
    const allImgs = d.querySelectorAll("img");
    allImgs.forEach((img) => {
      if (img.closest(".cloudattach-pdf-container"))
        return;
      const src = img.getAttribute("src") || "";
      if (this._isPdfUrl(src)) {
        this._renderPdfAsCanvas(img, src);
        return;
      }
      if (this._isHeicUrl(src)) {
        this._renderHeicAsImage(img, src);
        return;
      }
      const alt = img.getAttribute("alt") || "";
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
    const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const linkRe = /(?<![!])\[([^\]]*)\]\(([^)]+)\)/g;
    const iframeRe = /<iframe[^>]+src=["']([^"']+)["']/gi;
    const bareRe = /(?:^|\s)(https?:\/\/[^\s<>"\)\]&?=]+)/gm;
    let m;
    while ((m = imgRe.exec(text)) !== null)
      urls.push(m[2]);
    while ((m = linkRe.exec(text)) !== null)
      urls.push(m[2]);
    while ((m = iframeRe.exec(text)) !== null)
      urls.push(m[1]);
    while ((m = bareRe.exec(text)) !== null) {
      const url = m[1].replace(/[),\]]+$/, "");
      if (url)
        urls.push(url);
    }
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
      const host = urlObj.host;
      for (const account of this.accounts) {
        if (account.type === "s3")
          continue;
        const accountUrl = account.url?.replace(/\/$/, "") || "";
        const accountHost = new URL(accountUrl).host;
        if (host === accountHost) {
          return { account, client: this.createClient(account.id) };
        }
      }
    } catch {
    }
    return null;
  }
  /**
   * 检查并刷新当前笔记中所有 sign URL
   */
  async checkAndRefreshCurrentNote() {
    const view = this.activeMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.editor) {
      new Notice(t("notice.open_note_first"), 3e3);
      return;
    }
    const text = view.editor.getValue();
    const urls = this.extractUrls(text);
    if (urls.length === 0) {
      new Notice(t("notice.no_urls_in_note"), 3e3);
      return;
    }
    new Notice(t("notice.check_start", { count: urls.length }), 3e3);
    const results = { valid: 0, refreshed: 0, refreshedPaths: [], failed: 0, failedUrls: [], skipped: 0 };
    let accumulatedText = text;
    let cursorPos = null;
    for (const url of urls) {
      console.log("[CloudAttach] \u68C0\u67E5 URL:", url);
      const match = this.matchAccount(url);
      if (!match) {
        results.skipped++;
        continue;
      }
      const { account, client } = match;
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const isOpenListUrl = path.startsWith("/p/") || path.startsWith("/d/");
      if (!isOpenListUrl) {
        results.skipped++;
        continue;
      }
      if (url.includes("sign=")) {
        console.log("[CloudAttach] \u9A8C\u8BC1 sign URL...");
        const verify = await client.verifySignUrl(url);
        console.log("[CloudAttach] \u9A8C\u8BC1\u7ED3\u679C:", verify);
        if (verify.ok) {
          results.valid++;
        } else if (verify.reason === "sign_expired") {
          const realPath = client.extractRealPath(url);
          console.log("[CloudAttach] \u63D0\u53D6\u771F\u5B9E\u8DEF\u5F84:", realPath, "token:", account.token ? "\u6709" : "\u65E0");
          if (!realPath || !account.token) {
            results.failed++;
            results.failedUrls.push({ url, reason: t("error.cannot_extract_path") });
            continue;
          }
          try {
            const originalPrefix = url.match(/\/(d|p)\//)?.[1] || "p";
            const newUrl = await client.getSignedUrl(realPath, originalPrefix[0]);
            if (newUrl && newUrl !== url) {
              const newVerify2 = await client.verifySignUrl(newUrl);
              if (newVerify2.ok) {
                const newText = client.findAndReplaceUrl(accumulatedText, realPath, newUrl);
                if (newText !== accumulatedText) {
                  if (!cursorPos)
                    cursorPos = view.editor.getCursor();
                  accumulatedText = newText;
                  results.refreshed++;
                  results.refreshedPaths.push(realPath);
                } else {
                  results.valid++;
                }
              } else {
                console.log("[CloudAttach] \u65B0 URL \u9A8C\u8BC1\u5931\u8D25\uFF0C\u4FDD\u7559\u539F URL:", newVerify2.reason);
                results.failed++;
                results.failedUrls.push({ url, reason: t("error.sign_rebuild_failed", { error: newVerify2.reason }) });
              }
            } else {
              results.valid++;
            }
          } catch (e) {
            results.failed++;
            results.failedUrls.push({ url, reason: t("error.rebuild_failed", { error: e.message }) });
          }
        } else {
          results.failed++;
          results.failedUrls.push({ url, reason: verify.reason });
        }
      } else {
        const verify = await client.verifySignUrl(url);
        if (verify.ok) {
          results.skipped++;
        } else if (verify.reason === "sign_expired" && account.token) {
          const realPath = client.extractRealPath(url);
          if (realPath) {
            try {
              const originalPrefix = url.match(/\/(d|p)\//)?.[1] || "p";
              const newUrl = await client.getSignedUrl(realPath, originalPrefix[0]);
              if (newUrl && newUrl !== url) {
                const newVerify2 = await client.verifySignUrl(newUrl);
                if (newVerify2.ok) {
                  const newText = client.findAndReplaceUrl(accumulatedText, realPath, newUrl);
                  if (newText !== accumulatedText) {
                    if (!cursorPos)
                      cursorPos = view.editor.getCursor();
                    accumulatedText = newText;
                    results.refreshed++;
                    results.refreshedPaths.push(realPath);
                  }
                }
              } else {
                console.log("[CloudAttach] \u65B0 URL \u9A8C\u8BC1\u5931\u8D25\uFF0C\u4FDD\u7559\u539F URL:", newVerify.reason);
                results.failed++;
                results.failedUrls.push({ url, reason: t("error.sign_rebuild_failed", { error: newVerify.reason }) });
              }
            } catch (e) {
              results.failed++;
              results.failedUrls.push({ url, reason: t("error.sign_rebuild_failed", { error: e.message }) });
            }
          }
        } else {
          results.failed++;
          results.failedUrls.push({ url, reason: verify.reason });
        }
      }
    }
    const parts = [];
    if (results.valid > 0)
      parts.push(t("notice.url_parts_valid", { count: results.valid }));
    if (results.refreshed > 0)
      parts.push(t("notice.urls_refreshed", { count: results.refreshed }));
    if (results.failed > 0)
      parts.push(t("notice.urls_failed", { count: results.failed }));
    if (results.skipped > 0)
      parts.push(t("notice.urls_skipped", { count: results.skipped }));
    if (accumulatedText !== text && cursorPos) {
      view.editor.setValue(accumulatedText);
      view.editor.setCursor(cursorPos);
      view.editor.setSelection(cursorPos);
    }
    if (results.refreshed > 0) {
      new Notice(t("notice.check_complete", { parts: parts.join(", ") }), 6e3);
    } else {
      new Notice(t("notice.check_complete_partial", { parts: parts.join(", ") }), 4e3);
    }
    if (results.failedUrls.length > 0) {
    }
  }
  /**
   * 检查并刷新当前光标所在行/选中的 URL
   */
  async checkAndRefreshCurrentUrl() {
    const view = this.activeMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
    console.log("[CloudAttach] checkAndRefreshCurrentUrl view:", !!view, "editor:", !!view?.editor);
    if (!view?.editor) {
      new Notice(t("notice.open_note_first"), 3e3);
      return;
    }
    const cursor = view.editor.getCursor();
    const fullText = view.editor.getValue();
    const selection = view.editor.getSelection();
    let url = null;
    let urlType = "";
    if (selection) {
      const imgMatch = selection.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      const linkMatch = selection.match(/(?<![!])\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        url = imgMatch[2];
        urlType = "image";
      } else if (linkMatch) {
        url = linkMatch[2];
        urlType = "link";
      } else {
        const bareMatch = selection.match(/https?:\/\/[^\s<>"\)\]&]+/);
        if (bareMatch) {
          url = bareMatch[0];
          urlType = "bare";
        }
      }
    }
    if (!url) {
      let offset = 0;
      for (let i = 0; i < cursor.line; i++) {
        offset += view.editor.getLine(i).length + 1;
      }
      offset += cursor.ch;
      const urlPattern = /(!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]*)\]\(([^)]+)\)|https?:\/\/[^\s<>"\)\]]+)/g;
      let match2;
      let nearestUrl = null;
      let nearestDist = Infinity;
      while ((match2 = urlPattern.exec(fullText)) !== null) {
        const matchStart = match2.index;
        const matchEnd = matchStart + match2[0].length;
        const dist = Math.min(Math.abs(offset - matchStart), Math.abs(offset - matchEnd));
        if (dist < nearestDist) {
          nearestDist = dist;
          if (match2[3]) {
            nearestUrl = match2[3];
            urlType = "image";
          } else if (match2[5]) {
            nearestUrl = match2[5];
            urlType = "link";
          } else {
            nearestUrl = match2[0];
            urlType = "bare";
          }
        }
      }
      if (nearestDist < 500) {
        url = nearestUrl;
      }
    }
    if (!url) {
      new Notice(t("notice.no_url_near_cursor"), 3e3);
      return;
    }
    console.log("[CloudAttach] \u627E\u5230 URL:", url.substring(0, 80), "type:", urlType);
    new Notice(t("notice.check_url", { url: url.substring(0, 50) }), 3e3);
    const match = this.matchAccount(url);
    if (!match) {
      new Notice(t("notice.not_my_url_skip"), 4e3);
      return;
    }
    const { account, client } = match;
    const path = new URL(url).pathname;
    if (!path.startsWith("/p/") && !path.startsWith("/d/")) {
      new Notice(t("notice.no_openlist_url"), 3e3);
      return;
    }
    const verify = await client.verifySignUrl(url);
    if (verify.ok) {
      new Notice(t("notice.sign_ok"), 3e3);
      return;
    }
    if (verify.reason === "sign_expired") {
      const realPath = client.extractRealPath(url);
      if (!realPath || !account.token) {
        new Notice(t("notice.cannot_refresh"), 4e3);
        return;
      }
      try {
        const originalPrefix = url.match(/\/(d|p)\//)?.[1] || "p";
        const newUrl = await client.getSignedUrl(realPath, originalPrefix[0]);
        if (newUrl) {
          const newVerify2 = await client.verifySignUrl(newUrl);
          if (newVerify2.ok) {
            const fullText2 = view.editor.getValue();
            const newText = fullText2.replace(url, newUrl);
            view.editor.setValue(newText);
            view.editor.setCursor(0, 0);
            view.editor.setSelection(0, 0);
            new Notice(t("notice.sign_refreshed"), 3e3);
          }
        } else {
          console.log("[CloudAttach] \u65B0 URL \u9A8C\u8BC1\u5931\u8D25:", newVerify.reason);
          new Notice(t("notice.refresh_failed", { error: newVerify.reason }), 4e3);
        }
      } catch (e) {
        new Notice(t("notice.refresh_failed", { error: e.message }), 4e3);
      }
    } else {
      const reasonMap = {
        file_not_found: t("error.file_not_found"),
        network_error: t("error.network_error"),
        http_error: `HTTP ${verify.status}`
      };
      new Notice(t("notice.url_invalid", { reason: reasonMap[verify.reason] || verify.reason }), 5e3);
    }
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = { accounts: [], pdfPreview: "iframe", enableAutoUpload: false, ...data };
    this.accounts = this.settings.accounts || [];
    this.settings.pdfPreview = this.settings.pdfPreview || "iframe";
    this.settings.enableAutoUpload = this.settings.enableAutoUpload || false;
    this.defaultAccountId = this.settings.defaultAccountId || null;
  }
  async saveSettings() {
    this.settings.accounts = this.accounts;
    this.settings.defaultAccountId = this.defaultAccountId;
    await this.saveData(this.settings);
  }
  getAccount(id) {
    return this.accounts.find((a) => a.id === id) || null;
  }
  async addAccount(account) {
    account.id = `ca_${Date.now()}`;
    this.accounts.push(account);
    await this.saveSettings();
  }
  async removeAccount(id) {
    this.accounts = this.accounts.filter((a) => a.id !== id);
    if (this.defaultAccountId === id)
      this.defaultAccountId = null;
    await this.saveSettings();
  }
  async setDefaultAccount(id) {
    if (id && !this.accounts.find((a) => a.id === id))
      return;
    this.defaultAccountId = id || null;
    await this.saveSettings();
  }
  async updateAccount(id, updates) {
    const idx = this.accounts.findIndex((a) => a.id === id);
    if (idx >= 0) {
      this.accounts[idx] = { ...this.accounts[idx], ...updates };
      await this.saveSettings();
    }
  }
  async moveAccount(id, direction) {
    const idx = this.accounts.findIndex((a) => a.id === id);
    if (idx < 0)
      return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= this.accounts.length)
      return;
    [this.accounts[idx], this.accounts[targetIdx]] = [this.accounts[targetIdx], this.accounts[idx]];
    await this.saveSettings();
  }
  createClient(accountId) {
    const account = this.getAccount(accountId);
    if (!account)
      return null;
    if (account.type === "s3")
      return new S3Client(account, this.app);
    return new OpenListClient(account, this.app);
  }
  /**
   * 检查是否可以上传（需要至少一个账户且当前打开了视图并选中了目录）
   * @returns {{ok: boolean, client: object, remotePath: string, account: object}|null}
   */
  getUploadContext() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CLOUDATTACH);
    if (!leaves || leaves.length === 0) {
      return { ok: false, error: t("error.no_view_or_folder") };
    }
    const view = leaves[0].view;
    if (!view.client) {
      return { ok: false, error: t("error.no_account") };
    }
    if (!view.accountId) {
      return { ok: false, error: t("error.no_account") };
    }
    const isWebDAV = view.client.webdavPath;
    const remotePath = isWebDAV ? view.client.webdavPath + view.currentPath : view.currentPath;
    return {
      ok: true,
      client: view.client,
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
      return { ok: false, error: t("view.no_default_account_hint") };
    }
    const account = this.getAccount(this.defaultAccountId);
    if (!account) {
      return { ok: false, error: t("error.no_account") };
    }
    const client = this.createClient(this.defaultAccountId);
    if (!client) {
      return { ok: false, error: t("error.no_account") };
    }
    const remotePath = "/";
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
      new Notice(t("notice.open_note_first"), 3e3);
      return;
    }
    const cursor = view.editor.getCursor();
    const fullText = view.editor.getValue();
    let localPath = null;
    let markdownSyntax = "";
    const selection = view.editor.getSelection();
    if (selection) {
      const imgMatch = selection.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        localPath = imgMatch[2];
        markdownSyntax = selection;
      }
    }
    if (!localPath) {
      const line = view.editor.getLine(cursor.line);
      const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        localPath = imgMatch[2];
        markdownSyntax = imgMatch[0];
      } else {
        const attachMatch = line.match(/!\[([^\]]*)\]\((?!http)([^)#\s?]+)/);
        if (attachMatch) {
          localPath = attachMatch[2];
          markdownSyntax = attachMatch[0];
        } else {
          const wikiMatch = line.match(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
          if (wikiMatch) {
            localPath = wikiMatch[1];
            markdownSyntax = wikiMatch[0];
          } else {
            const plainWikiMatch = line.match(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
            if (plainWikiMatch) {
              localPath = plainWikiMatch[1];
              markdownSyntax = plainWikiMatch[0];
            }
          }
        }
      }
    }
    if (!localPath || localPath.startsWith("http://") || localPath.startsWith("https://")) {
      new Notice(t("notice.no_attachment"), 3e3);
      return;
    }
    let absolutePath;
    const notePath = view.file?.path || "";
    const noteDir = notePath.substring(0, notePath.lastIndexOf("/") + 1);
    const cacheResolved = this.app.metadataCache.getFirstLinkpathDest(localPath, notePath);
    if (cacheResolved && cacheResolved.path) {
      absolutePath = cacheResolved.path;
    } else {
      if (localPath.startsWith("/")) {
        absolutePath = localPath.substring(1);
      } else {
        absolutePath = noteDir + localPath;
      }
    }
    const viewOpen = !!this.app.workspace.getLeavesOfType(VIEW_TYPE_CLOUDATTACH).length;
    let ctx = null;
    if (viewOpen) {
      ctx = this.getUploadContext();
      if (!ctx.ok) {
        new Notice(`\u26A0\uFE0F ${ctx.error}`, 4e3);
        return;
      }
    }
    const confirmed = await this.showUploadConfirmModal([{ localPath: absolutePath, syntax: markdownSyntax }], ctx?.remotePath || "", viewOpen);
    if (!confirmed)
      return;
    const uploadCtx = confirmed.useDefault || !viewOpen ? this.getDefaultUploadContext() : ctx;
    if (!uploadCtx || !uploadCtx.ok) {
      new Notice(`\u26A0\uFE0F ${uploadCtx?.error || t("error.no_account")}`, 4e3);
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
      new Notice(t("notice.open_note_first"), 3e3);
      return;
    }
    let text = view.editor.getValue();
    const codeFreeText = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "");
    const notePath = view.file?.path || "";
    const noteDir = notePath.substring(0, notePath.lastIndexOf("/") + 1);
    const attachmentRegex = /!\[([^\]]*)\]\((?!http)([^)#\s?]+)/g;
    const attachments = [];
    let match;
    while ((match = attachmentRegex.exec(codeFreeText)) !== null) {
      const localPath = match[2];
      const cacheResolved = this.app.metadataCache.getFirstLinkpathDest(localPath, notePath);
      let absolutePath;
      if (cacheResolved && cacheResolved.path) {
        absolutePath = cacheResolved.path;
      } else {
        if (localPath.startsWith("/")) {
          absolutePath = localPath.substring(1);
        } else {
          absolutePath = noteDir + localPath;
        }
      }
      if (!absolutePath || !absolutePath.trim())
        continue;
      if (!attachments.find((a) => a.localPath === absolutePath)) {
        attachments.push({
          localPath: absolutePath,
          syntax: match[0]
        });
      }
    }
    const wikiRegex = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
    while ((match = wikiRegex.exec(codeFreeText)) !== null) {
      const localPath = match[1];
      const cacheResolved = this.app.metadataCache.getFirstLinkpathDest(localPath, notePath);
      let absolutePath;
      if (cacheResolved && cacheResolved.path) {
        absolutePath = cacheResolved.path;
      } else {
        if (localPath.startsWith("/")) {
          absolutePath = localPath.substring(1);
        } else {
          absolutePath = noteDir + localPath;
        }
      }
      if (!absolutePath || !absolutePath.trim())
        continue;
      if (!attachments.find((a) => a.localPath === absolutePath)) {
        attachments.push({
          localPath: absolutePath,
          syntax: match[0]
        });
      }
    }
    const plainWikiRegex = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
    while ((match = plainWikiRegex.exec(codeFreeText)) !== null) {
      const localPath = match[1];
      const cacheResolved = this.app.metadataCache.getFirstLinkpathDest(localPath, notePath);
      let absolutePath;
      if (cacheResolved && cacheResolved.path) {
        absolutePath = cacheResolved.path;
      } else {
        if (localPath.startsWith("/")) {
          absolutePath = localPath.substring(1);
        } else {
          absolutePath = noteDir + localPath;
        }
      }
      if (!attachments.find((a) => a.localPath === absolutePath)) {
        attachments.push({
          localPath: absolutePath,
          syntax: match[0]
        });
      }
    }
    if (attachments.length === 0) {
      new Notice(t("notice.no_attachment_found"), 3e3);
      return;
    }
    const viewOpen = !!this.app.workspace.getLeavesOfType(VIEW_TYPE_CLOUDATTACH).length;
    let ctx = null;
    if (viewOpen) {
      ctx = this.getUploadContext();
      if (!ctx.ok) {
        new Notice(`\u26A0\uFE0F ${ctx.error}`, 4e3);
        return;
      }
    }
    const confirmed = await this.showUploadConfirmModal(attachments, ctx?.remotePath || "", viewOpen);
    if (!confirmed)
      return;
    const uploadCtx = confirmed.useDefault || !viewOpen ? this.getDefaultUploadContext() : ctx;
    if (!uploadCtx || !uploadCtx.ok) {
      new Notice(`\u26A0\uFE0F ${uploadCtx?.error || t("error.no_account")}`, 4e3);
      return;
    }
    await this.doUpload(attachments, uploadCtx);
  }
  /**
   * 查找引用了指定文件的笔记列表（通过 metadataCache embeds/links）
   */
  _findNotesWithFile(filePath) {
    const results = [];
    const fileName = filePath.split("/").pop();
    const mdFiles = this.app.vault.getMarkdownFiles();
    for (const mf of mdFiles) {
      const cache = this.app.metadataCache.getFileCache(mf);
      if (!cache?.embeds && !cache?.links)
        continue;
      const allRefs = [...cache.embeds || [], ...cache.links || []];
      if (allRefs.some((ref) => (ref.link || "").toLowerCase() === fileName.toLowerCase() || (ref.link || "").toLowerCase() === filePath.toLowerCase())) {
        results.push(mf);
      }
    }
    if (results.length === 0) {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile?.extension === "md")
        results.push(activeFile);
    }
    return results;
  }
  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  /**
   * 显示上传确认对话框
   * @param {Array} attachments - 要上传的附件列表
   * @param {string} remotePath - 远程目录
   * @returns {Promise<boolean>} 用户是否确认
   */
  showUploadConfirmModal(attachments, remotePath, viewOpen = true) {
    return new Promise((resolve) => {
      const modal = new (require("obsidian")).Modal(this.app);
      modal.titleEl.textContent = t("view.upload_confirm_title");
      const content = modal.contentEl;
      content.style.padding = "16px";
      const listEl = document.createElement("div");
      listEl.style.maxHeight = "200px";
      listEl.style.overflow = "auto";
      listEl.style.marginBottom = "16px";
      listEl.style.border = "1px solid var(--background-modifier-border)";
      listEl.style.borderRadius = "4px";
      listEl.style.padding = "8px";
      attachments.forEach((att) => {
        const fileName = att.localPath.split("/").pop();
        const item = document.createElement("div");
        item.style.padding = "4px 0";
        item.style.fontSize = "13px";
        item.textContent = `\u{1F4CE} ${fileName}`;
        listEl.appendChild(item);
      });
      content.appendChild(listEl);
      let useDefault = false;
      if (viewOpen) {
        const targetGroup = document.createElement("div");
        targetGroup.style.marginBottom = "16px";
        targetGroup.style.padding = "12px";
        targetGroup.style.background = "var(--background-secondary)";
        targetGroup.style.borderRadius = "6px";
        const mkRadio = (label, subLabel, checked, onCheck) => {
          const row = document.createElement("div");
          row.style.display = "flex";
          row.style.alignItems = "center";
          row.style.gap = "6px";
          row.style.padding = "4px 0";
          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = "upload_target";
          radio.checked = checked;
          radio.onchange = () => {
            if (radio.checked)
              onCheck();
          };
          row.appendChild(radio);
          const labelEl = document.createElement("span");
          labelEl.style.fontSize = "13px";
          labelEl.style.fontWeight = "600";
          labelEl.textContent = label;
          row.appendChild(labelEl);
          if (subLabel) {
            const sub = document.createElement("span");
            sub.style.fontSize = "11px";
            sub.style.color = "var(--text-muted)";
            sub.textContent = subLabel;
            row.appendChild(sub);
          }
          return row;
        };
        targetGroup.appendChild(mkRadio(
          t("view.upload_to_current_path"),
          this.escapeHtml(remotePath),
          true,
          // 视图打开时默认选中当前路径（用户已主动浏览到此路径）
          () => {
            useDefault = false;
          }
        ));
        if (this.defaultAccountId) {
          const defAccount = this.accounts.find((a) => a.id === this.defaultAccountId);
          if (defAccount) {
            targetGroup.appendChild(mkRadio(
              t("view.upload_to_default_account"),
              defAccount.name,
              false,
              () => {
                useDefault = true;
              }
            ));
          }
        }
        content.appendChild(targetGroup);
      } else {
        const defAccount = this.defaultAccountId ? this.accounts.find((a) => a.id === this.defaultAccountId) : null;
        if (!defAccount) {
          const warnEl = document.createElement("div");
          warnEl.style.marginBottom = "16px";
          warnEl.style.padding = "12px";
          warnEl.style.background = "var(--background-secondary)";
          warnEl.style.borderRadius = "6px";
          warnEl.style.color = "var(--text-warning)";
          warnEl.style.fontSize = "13px";
          warnEl.textContent = "\u26A0\uFE0F " + t("error.no_default_account_set");
          content.appendChild(warnEl);
        } else {
          const infoEl = document.createElement("div");
          infoEl.style.marginBottom = "16px";
          infoEl.style.padding = "12px";
          infoEl.style.background = "var(--background-secondary)";
          infoEl.style.borderRadius = "6px";
          const infoLabel = document.createElement("div");
          infoLabel.style.fontSize = "12px";
          infoLabel.style.color = "var(--text-muted)";
          infoLabel.style.marginBottom = "4px";
          infoLabel.textContent = t("view.upload_to_default_account") + ":";
          infoEl.appendChild(infoLabel);
          const infoValue = document.createElement("div");
          infoValue.style.fontSize = "13px";
          infoValue.style.fontWeight = "600";
          infoValue.innerHTML = `<span style="color:var(--text-accent);font-size:11px">\u2728</span> ${this.escapeHtml(defAccount.name)}`;
          infoEl.appendChild(infoValue);
          content.appendChild(infoEl);
          useDefault = true;
        }
      }
      const btnRow = document.createElement("div");
      btnRow.style.display = "flex";
      btnRow.style.gap = "8px";
      btnRow.style.justifyContent = "flex-end";
      const uploadBtn = document.createElement("button");
      uploadBtn.textContent = t("view.upload_btn", { count: attachments.length });
      uploadBtn.className = "mod-cta";
      uploadBtn.style.background = "var(--interactive-accent)";
      uploadBtn.style.color = "var(--text-on-accent)";
      uploadBtn.style.padding = "8px 16px";
      uploadBtn.onclick = () => {
        modal.close();
        resolve({ confirmed: true, useDefault });
      };
      btnRow.appendChild(uploadBtn);
      content.appendChild(btnRow);
      modal.open();
    });
  }
  escapeHtml(text) {
    const div = document.createElement("div");
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
    new Notice(t("notice.upload_start", { count: attachments.length }), 3e3);
    const results = { success: 0, failed: 0, skipped: 0 };
    const replacements = [];
    for (const att of attachments) {
      console.log("[CloudAttach] \u4E0A\u4F20:", att.localPath);
      let file = this.app.vault.getAbstractFileByPath(att.localPath);
      if (!file) {
        console.log("[CloudAttach] \u672C\u5730\u6587\u4EF6\u4E0D\u5B58\u5728:", att.localPath);
        results.skipped++;
        continue;
      }
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
      }
    }
    if (replacements.length > 0 && view?.editor) {
      let text = view.editor.getValue();
      const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "heic", "heif"];
      const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "flv"];
      const audioExts = ["mp3", "wav", "flac", "aac", "ogg", "m4a"];
      const docExts = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];
      for (const rep of replacements) {
        const ext = rep.localPath.split(".").pop().toLowerCase();
        const fileName = rep.localPath.split("/").pop();
        const nameWithoutExt = fileName.replace(/\.[^.]+$/, "");
        const isPdfJsInsert = ext === "pdf" && this.settings.pdfPreview === "pdfjs";
        let url;
        if (docExts.includes(ext) && !isPdfJsInsert) {
          url = client.getRawUrl ? client.getRawUrl(rep.remotePath) : client.getFileUrl(rep.remotePath);
        } else {
          url = rep.newUrl;
        }
        let newSyntax;
        if (rep.oldSyntax.startsWith("![[")) {
          const aliasMatch = rep.oldSyntax.match(/!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/);
          const alias = aliasMatch?.[2] || nameWithoutExt;
          if (imageExts.includes(ext)) {
            newSyntax = `![${alias}](${url})`;
          } else if (videoExts.includes(ext)) {
            newSyntax = `<video controls width="600" height="400">
 <source src="${url}" type="video/mp4">
</video>`;
          } else if (audioExts.includes(ext)) {
            newSyntax = `<audio controls>
 <source src="${url}" type="audio/mpeg">
</audio>`;
          } else if (docExts.includes(ext) && !isPdfJsInsert) {
            newSyntax = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
          } else if (isPdfJsInsert) {
            newSyntax = `![${alias}](${url})`;
          } else {
            newSyntax = `[${alias}](${url})`;
          }
        } else if (rep.oldSyntax.startsWith("![")) {
          const altMatch = rep.oldSyntax.match(/!\[([^\]]*)\]\(/);
          const alt = altMatch?.[1] || nameWithoutExt;
          if (imageExts.includes(ext)) {
            newSyntax = `![${alt}](${url})`;
          } else if (videoExts.includes(ext)) {
            newSyntax = `<video controls width="600" height="400">
 <source src="${url}" type="video/mp4">
</video>`;
          } else if (audioExts.includes(ext)) {
            newSyntax = `<audio controls>
 <source src="${url}" type="audio/mpeg">
</audio>`;
          } else if (docExts.includes(ext) && !isPdfJsInsert) {
            newSyntax = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
          } else if (isPdfJsInsert) {
            newSyntax = `![${alt}](${url})`;
          } else {
            newSyntax = `[${alt}](${url})`;
          }
        } else if (rep.oldSyntax.startsWith("[[")) {
          const aliasMatch = rep.oldSyntax.match(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/);
          const alias = aliasMatch?.[2] || nameWithoutExt;
          if (imageExts.includes(ext)) {
            newSyntax = `![${alias}](${url})`;
          } else if (videoExts.includes(ext)) {
            newSyntax = `<video controls width="600" height="400">
 <source src="${url}" type="video/mp4">
</video>`;
          } else if (audioExts.includes(ext)) {
            newSyntax = `<audio controls>
 <source src="${url}" type="audio/mpeg">
</audio>`;
          } else if (docExts.includes(ext) && !isPdfJsInsert) {
            newSyntax = `<iframe src="${url}" width="100%" height="800px"></iframe>`;
          } else if (isPdfJsInsert) {
            newSyntax = `![${alias}](${url})`;
          } else {
            newSyntax = `[${alias}](${url})`;
          }
        } else {
          newSyntax = rep.oldSyntax.replace(/file:\S+/, url);
        }
        text = text.replace(rep.oldSyntax, newSyntax);
        try {
          await this.app.vault.delete(this.app.vault.getAbstractFileByPath(rep.localPath));
          console.log("[CloudAttach] \u5DF2\u5220\u9664\u672C\u5730\u6587\u4EF6:", rep.localPath);
        } catch (e) {
          console.log("[CloudAttach] \u5220\u9664\u672C\u5730\u6587\u4EF6\u5931\u8D25:", e.message);
        }
      }
      const finalCursor = view.editor.getCursor();
      view.editor.setValue(text);
      view.editor.setCursor(finalCursor);
      view.editor.setSelection(finalCursor, finalCursor);
      view.editor.setSelection(finalCursor);
    }
    const parts = [];
    if (results.success > 0)
      parts.push(t("notice.upload_success_count", { count: results.success }));
    if (results.failed > 0)
      parts.push(t("notice.upload_failed_count", { count: results.failed }));
    if (results.skipped > 0)
      parts.push(t("notice.upload_skipped_count", { count: results.skipped }));
    new Notice(t("notice.upload_complete", { parts: parts.join(", ") }), 5e3);
  }
};
