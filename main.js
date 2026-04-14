/**
 * CloudAttach Plugin v0.0.016
 * 云附件管理 - 连接 OpenList/WebDAV
 */

'use strict';

const { Plugin, Notice, Menu, Modal, PluginSettingTab, MarkdownView, ItemView } = require('obsidian');

const VIEW_TYPE_CLOUDATTACH = 'cloud-attach-view';

class OpenListClient {
  constructor(account) {
    this.serverUrl = account.url.replace(/\/$/, '');
    this.webdavPath = (account.webdavPath || '/dav').replace(/\/$/, '');
    this.token = account.token || '';
    this.username = account.username;
    this.password = account.password;
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
    
    // 回退到 WebDAV URL（无 sign）
    if (this.webdavPath && this.webdavPath !== '/') {
      return `${this.serverUrl}${this.webdavPath}${encodeURI(remotePath)}`;
    }
    
    // 最后手段：直接构造 URL（无 sign）
    return `${this.serverUrl}/d${encodeURI(remotePath)}`;
  }

  // 获取原始 URL（无签名、无 /dav /d 前缀，用于 iframe 预览）
  getRawUrl(remotePath) {
    // 保留中文等 Unicode 原文，仅编码必须转义的字符（空格、%、#、?、& 等）
    const safePath = remotePath.replace(/[%\s#?&<>"'\\|{}]/g, c => encodeURIComponent(c));
    return `${this.serverUrl}${safePath}`;
  }

  async testConnection() {
    try {
      if (this.webdavPath) {
        const webdavUrl = `${this.serverUrl}${this.webdavPath}/`;
        const response = await fetch(webdavUrl, {
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

  async listDirectory(remotePath = '/') {
    if (this.webdavPath) return this.listDirectoryWebDAV(remotePath);
    return this.listDirectoryAPI(remotePath);
  }

  async listDirectoryWebDAV(remotePath) {
    const webdavUrl = `${this.serverUrl}${this.webdavPath}${remotePath}`;
    const propfindBody = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:"><D:prop><D:displayname/><D:getcontentlength/><D:getlastmodified/><D:resourcetype/></D:prop></D:propfind>`;
    
    const response = await fetch(webdavUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`),
        'Content-Type': 'application/xml',
        'Depth': '1'
      },
      body: propfindBody
    });

    if (!response.ok && response.status !== 207) throw new Error(`WebDAV error: ${response.status}`);

    const text = await response.text();
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
  getDisplayText() { return '☁️ 云附件'; }
  getIcon() { return 'folder-open'; }

  async onOpen() {
    console.log('[CloudAttach] onOpen called');
    this.contentEl.innerHTML = '<div style="padding:20px">加载中...</div>';
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
        this.contentEl.innerHTML += '<p class="cloud-attach-hint">请先在设置中添加账户</p>';
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
      select.innerHTML = '<option value="">请选择账户</option>';
      
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
        this.breadcrumbEl.innerHTML = '<span style="color:var(--text-muted);padding:10px;">选择账户后开始浏览</span>';
      }
      
      console.log('[CloudAttach] render completed');
    } catch (e) {
      console.error('[CloudAttach] render error:', e);
      this.contentEl.innerHTML = `<p class="cloud-attach-error">❌ 错误: ${e.message}</p>`;
    }
  }

  renderBreadcrumb() {
    if (!this.breadcrumbEl) return;
    this.breadcrumbEl.innerHTML = '';

    const root = document.createElement('button');
    root.className = 'cloud-attach-breadcrumb-btn';
    root.textContent = '📁 根目录';
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
    const fileCount = this.files.filter(f => !f.isDirectory).length;
    
    if (count === 0) {
      this.batchBarEl.style.display = 'none';
      return;
    }
    
    this.batchBarEl.style.display = 'flex';
    
    const span = document.createElement('span');
    span.className = 'cloud-attach-batch-count';
    span.textContent = `${count}/${fileCount} 项已选`;
    this.batchBarEl.appendChild(span);
    
    // 全选按钮
    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'cloud-attach-batch-btn mod-secondary';
    selectAllBtn.textContent = '全选';
    selectAllBtn.onclick = () => {
      this.files.forEach(f => { if (!f.isDirectory) this.selectedFiles.add(f.path); });
      this.renderFiles();
      this.renderBatchBar();
    };
    this.batchBarEl.appendChild(selectAllBtn);
    
    // 取消全选按钮
    const deselectBtn = document.createElement('button');
    deselectBtn.className = 'cloud-attach-batch-btn mod-secondary';
    deselectBtn.textContent = '取消';
    deselectBtn.onclick = () => { this.selectedFiles.clear(); this.renderFiles(); this.renderBatchBar(); };
    this.batchBarEl.appendChild(deselectBtn);
    
    const insertBtn = document.createElement('button');
    insertBtn.className = 'cloud-attach-batch-btn';
    insertBtn.textContent = '插入';
    insertBtn.onclick = () => this.insertSelectedFiles();
    this.batchBarEl.appendChild(insertBtn);
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'cloud-attach-batch-btn mod-secondary';
    clearBtn.textContent = '清空';
    clearBtn.onclick = () => { this.selectedFiles.clear(); this.renderFiles(); this.renderBatchBar(); };
    this.batchBarEl.appendChild(clearBtn);
  }

  async loadDir() {
    if (!this.accountId) return;

    this.renderBreadcrumb();
    if (!this.fileListEl) return;
    this.fileListEl.innerHTML = '<p class="cloud-attach-loading">⏳ 加载中...</p>';

    if (!this.client) {
      this.client = this.plugin.createClient(this.accountId);
    }
    if (!this.client) {
      this.fileListEl.innerHTML = '<p class="cloud-attach-error">❌ 未选择账户</p>';
      return;
    }

    try {
      this.files = await this.client.listDirectory(this.currentPath);
      this.selectedFiles.clear();
      this.renderFiles();
    } catch (e) {
      console.error('[CloudAttach] loadDir error:', e);
      this.fileListEl.innerHTML = `<p class="cloud-attach-error">❌ 连接失败: ${e.message}</p><p class="cloud-attach-hint">请检查账户设置</p>`;
    }
  }

  renderFiles() {
    if (!this.fileListEl) return;
    this.fileListEl.innerHTML = '';
    console.log('[CloudAttach] rendering files, count:', this.files.length);
    
    if (this.files.length === 0) {
      this.fileListEl.innerHTML = '<p class="cloud-attach-empty">📂 空目录</p>';
      return;
    }

    this.files.forEach(file => {
      const item = document.createElement('div');
      item.className = 'cloud-attach-file';
      
      if (!file.isDirectory) {
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
      } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'cloud-attach-checkbox-placeholder';
        item.appendChild(placeholder);
      }
      
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
    
    if (imageExts.includes(ext)) {
      const url = await this.client.getSignedUrl(file.path);
      return `![${nameWithoutExt}](${url})`;
    } else if (videoExts.includes(ext)) {
      const url = await this.client.getSignedUrl(file.path);
      return `<video controls width="600" height="400">\n <source src="${url}" type="video/mp4">\n</video>`;
    } else if (audioExts.includes(ext)) {
      const url = await this.client.getSignedUrl(file.path);
      return `<audio controls>\n <source src="${url}" type="audio/mpeg">\n</audio>`;
    } else if (docExts.includes(ext)) {
      // iframe 预览用原始 URL（无签名）
      const url = this.client.getRawUrl(file.path);
      return `<iframe src="${url}" width="100%" height="800px"></iframe>`;
    } else {
      const url = await this.client.getSignedUrl(file.path);
      return `[${file.name}](${url})`;
    }
  }

  // 查找最近使用的 MarkdownView（排除自身侧边栏）
  findMostRecentMarkdownView() {
    const { workspace } = this.plugin.app;
    
    // 优先获取当前聚焦的 MarkdownView
    let view = workspace.getActiveViewOfType(MarkdownView);
    if (view?.editor) return view;
    
    // 如果没有，获取最近使用的 leaf
    const recentLeaf = workspace.getMostRecentLeaf();
    if (recentLeaf?.view instanceof MarkdownView && recentLeaf.view.editor) {
      return recentLeaf.view;
    }
    
    // 遍历所有 markdown leaf
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
      new Notice(`✅ 已插入: ${file.name}`);
    } else {
      new Notice('❌ 请先打开一个笔记');
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
      view.editor.replaceRange(mds.join('\n\n') + '\n', cursor);
      new Notice(`✅ 已插入 ${selected.length} 个文件`);
    } else {
      new Notice('❌ 请先打开一个笔记');
    }
    
    this.selectedFiles.clear();
    this.renderFiles();
    this.renderBatchBar();
  }

  showMenu(file, event) {
    const menu = new Menu(this.plugin.app);
    
    if (!file.isDirectory) {
      menu.addItem(item => {
        item.setTitle('插入到笔记').setIcon('link').onClick(() => this.insertFile(file));
      });
      menu.addItem(item => {
        item.setTitle('复制链接').onClick(async () => {
          if (!this.client) return;
          try {
            const url = await this.client.getSignedUrl(file.path);
            await navigator.clipboard.writeText(url);
            new Notice('📋 链接已复制');
          } catch { new Notice('❌ 获取链接失败'); }
        });
      });
      menu.addItem(item => {
        item.setTitle(this.selectedFiles.has(file.path) ? '取消选择' : '选择').onClick(() => {
          if (this.selectedFiles.has(file.path)) this.selectedFiles.delete(file.path);
          else this.selectedFiles.add(file.path);
          this.renderFiles();
          this.renderBatchBar();
        });
      });
    }
    if (file.isDirectory) {
      menu.addItem(item => {
        item.setTitle('打开目录').onClick(() => { this.currentPath = file.path; this.selectedFiles.clear(); this.loadDir(); });
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
    title.textContent = this.account ? '编辑账户' : '添加账户';
    this.contentEl.appendChild(title);

    const fields = {};
    
    const nameDiv = this.createFieldDiv('账户名称', '例如：我的NAS');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = '例如：我的NAS';
    nameInput.value = this.account?.name || '';
    nameInput.className = 'cloud-attach-input';
    nameDiv.appendChild(nameInput);
    fields.name = nameInput;
    
    const urlDiv = this.createFieldDiv('服务器地址', 'http://192.168.62.200:5244');
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.placeholder = 'http://192.168.62.200:5244';
    urlInput.value = this.account?.url || '';
    urlInput.className = 'cloud-attach-input';
    urlDiv.appendChild(urlInput);
    fields.url = urlInput;
    
    const webdavDiv = this.createFieldDiv('WebDAV 路径', '/dav');
    const webdavInput = document.createElement('input');
    webdavInput.type = 'text';
    webdavInput.placeholder = '/dav';
    webdavInput.value = this.account?.webdavPath || '/dav';
    webdavInput.className = 'cloud-attach-input';
    webdavDiv.appendChild(webdavInput);
    fields.webdavPath = webdavInput;
    
    const userDiv = this.createFieldDiv('用户名', '');
    const userInput = document.createElement('input');
    userInput.type = 'text';
    userInput.value = this.account?.username || '';
    userInput.className = 'cloud-attach-input';
    userDiv.appendChild(userInput);
    fields.username = userInput;
    
    const passDiv = this.createFieldDiv('密码', '');
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
    
    const tokenDiv = this.createFieldDiv('Token', '在 OpenList 后台获取');
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

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.justifyContent = 'flex-end';
    btnRow.style.marginTop = '16px';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'cloud-attach-btn';
    cancelBtn.onclick = () => this.close();
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存';
    saveBtn.className = 'cloud-attach-btn mod-cta';
    saveBtn.onclick = async () => {
      const url = fields.url.value.trim().replace(/\/$/, '');
      if (!url) { new Notice('请填写服务器地址', 3000); return; }
      
      const accountData = {
        name: fields.name.value.trim() || `账户 ${this.plugin.accounts.length + 1}`,
        url,
        webdavPath: fields.webdavPath.value.trim() || '/dav',
        username: fields.username.value.trim(),
        password: fields.password.value,
        token: fields.token.value,
        isActive: true
      };
      
      if (this.account) await this.plugin.updateAccount(this.account.id, accountData);
      else await this.plugin.addAccount(accountData);
      
      this.close();
      // 延时确保弹窗关闭后再刷新设置页
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
    this.contentEl.appendChild(div);
    return div;
  }
}

class CloudAttachSettingTab extends PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display() { this.render(); }

  render() {
    this.containerEl.innerHTML = '';
    
    const title = document.createElement('h2');
    title.textContent = 'CloudAttach 设置';
    this.containerEl.appendChild(title);
    
    const desc = document.createElement('p');
    desc.textContent = '连接 OpenList 管理云附件';
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
    addBtn.textContent = '+ 添加账户';
    addBtn.className = 'cloud-attach-add-btn';
    addBtn.onclick = () => new AddAccountModal(this.plugin.app, this.plugin, () => this.display()).open();
    btnRow.appendChild(addBtn);

    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '🔄 刷新';
    refreshBtn.className = 'cloud-attach-btn';
    refreshBtn.onclick = async () => {
      await this.plugin.loadSettings();
      this.display();
    };
    btnRow.appendChild(refreshBtn);

    this.containerEl.appendChild(btnRow);
  }

  renderAccount(account) {
    const card = document.createElement('div');
    card.className = 'cloud-attach-card';
    
    const h3 = document.createElement('h3');
    h3.textContent = account.name;
    h3.style.margin = '0 0 8px 0';
    h3.style.fontSize = '14px';
    card.appendChild(h3);
    
    const p1 = document.createElement('p');
    p1.textContent = `地址: ${account.url}`;
    p1.className = 'setting-item-description';
    card.appendChild(p1);
    
    if (account.username) {
      const p2 = document.createElement('p');
      p2.textContent = `用户: ${account.username}`;
      p2.className = 'setting-item-description';
      card.appendChild(p2);
    }

    const btnRow = document.createElement('div');
    btnRow.className = 'cloud-attach-card-btns';
    
    const editBtn = document.createElement('button');
    editBtn.textContent = '编辑';
    editBtn.className = 'cloud-attach-btn';
    editBtn.onclick = () => new AddAccountModal(this.plugin.app, this.plugin, () => this.display(), account).open();
    
    const testBtn = document.createElement('button');
    testBtn.textContent = '测试';
    testBtn.className = 'cloud-attach-btn';
    testBtn.onclick = async () => {
      const client = this.plugin.createClient(account.id);
      if (client) {
        const ok = await client.testConnection();
        new Notice(ok ? '✅ 连接成功' : '❌ 连接失败', 3000);
      }
    };
    
    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.className = 'cloud-attach-btn';
    delBtn.onclick = async () => {
      await this.plugin.removeAccount(account.id);
      // 延时确保删除后刷新
      setTimeout(() => this.display(), 50);
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
    console.log('CloudAttach v0.0.017 loading...');
    await this.loadSettings();
    this.addStyles();
    this.registerView(VIEW_TYPE_CLOUDATTACH, (leaf) => new CloudAttachView(leaf, this));
    this.addRibbonIcon('folder-open', '☁️ 云附件', () => this.activateView());
    this.addSettingTab(new CloudAttachSettingTab(this));
    this.addCommand({ id: 'open-browser', name: 'Open CloudAttach Browser', callback: () => this.activateView() });
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
      .cloud-attach-batch-bar { padding: 6px 8px; background: var(--background-secondary); border-bottom: 1px solid var(--background-modifier-border); display: flex; align-items: center; gap: 8px; }
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
    return account ? new OpenListClient(account) : null;
  }
};
