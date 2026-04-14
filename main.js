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

/**
 * S3 兼容对象存储客户端
 * 支持所有使用 S3 协议的对象存储服务：
 * - 腾讯云 COS
 * - 阿里云 OSS
 * - AWS S3
 * - 兼容 S3 的自建存储（MinIO、Ceph RGW 等）
 */
class S3Client {
  constructor(account) {
    this.endpoint = account.endpoint?.replace(/\/$/, '') || '';
    this.bucket = account.bucket || '';
    this.region = account.region || '';
    this.accessKey = account.accessKey || '';
    this.secretKey = account.secretKey || '';
    this.publicUrl = account.publicUrl?.replace(/\/$/, '') || '';
    this.prefix = account.prefix ? '/' + account.prefix.replace(/^\/+|\/+$/g, '') + '/' : '/';
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
      // S3 prefix：不以 / 结尾，但需要表示目录层级
      const s3Prefix = cleanPath ? this.prefix.replace(/\/$/, '') + '/' + cleanPath + '/' : this.prefix;

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

      const text = await response.text();
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
    const basePrefix = this.prefix.replace(/\/$/, '');
    const cleanPath = remotePath.replace(/^\/+/, '');
    const fullPath = basePrefix ? `${basePrefix}/${cleanPath}` : `/${cleanPath}`;
    // publicUrl 可能是裸域名（无协议），自动补 https://
    const base = this.publicUrl.startsWith('http') ? this.publicUrl : `https://${this.publicUrl}`;
    return `${base}${fullPath}`;
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
      const text = await response.text().catch(() => '');
      console.log('[CloudAttach] S3 testConnection status:', status, 'body:', text.slice(0, 200));
      // 403 = 签名正确但无权限，401 = 签名错误，其他 2xx = 成功
      if (status === 403) {
        new Notice(`✅ app.requestUrl连接成功(403无权限)。body: ${text.slice(0, 100)}`, 5000);
        return true;
      }
      if (status === 401) {
        new Notice(`❌ 签名错误(401)，请检查AccessKey/SecretKey/Region`, 5000);
        return false;
      }
      if (status === 404) {
        new Notice(`❌ 存储桶未找到(404)`, 5000);
        return false;
      }
      if (response.ok) {
        new Notice(`✅ 连接成功! body: ${text.slice(0, 80)}`, 5000);
        return true;
      }
      new Notice(`❌ 失败 status=${status} body: ${text.slice(0, 80)}`, 5000);
      return false;
    } catch (e) {
      console.error('[CloudAttach] S3 testConnection error:', e);
      new Notice(`❌ 连接异常: ${e.message}`, 5000);
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
    
    return fetch(signedUrl, { method: 'GET', ...options });
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
    const canonicalHeaders = sortedHeaders.map(([k, v]) => `${k}:${v.trim()}`).join('\n') + '\n';
    const signedHeadersLine = sortedHeaders.map(([k]) => k).join(';');

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

  async signQuery(additionalParams, objectKey) {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateOnly = dateStr.slice(0, 8);

    const params = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.accessKey}/${dateOnly}/${this.region}/s3/aws4_request`,
      'X-Amz-Date': dateStr,
      'X-Amz-Expires': '3600',
      'X-Amz-SignedHeaders': 'host',
      ...Object.fromEntries(additionalParams.entries())
    };

    const sortedParams = Object.entries(params).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    const canonicalQueryString = sortedParams.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const canonicalUri = objectKey 
      ? encodeURIComponent(`/${this.bucket}/${objectKey}`).replace(/%2F/g, '/')
      : encodeURIComponent(`/${this.bucket}`).replace(/%2F/g, '/');
    const signedHeaders = `host:${new URL(this.endpoint).host}`;

    const canonicalRequest = ['GET', canonicalUri, canonicalQueryString, `host:${new URL(this.endpoint).host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
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
    const cryptoKey = await crypto.subtle.importKey(
      'raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
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
      const name = prefix.slice(currentPrefix.length).replace(/\/$/, '');
      files.push({ name, path: '/' + name + '/', isDirectory: true, size: 0 });
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

      // 去掉当前前缀得到相对路径
      const relativePath = key.slice(currentPrefix.length);
      const name = decodeURIComponent(relativePath.split('/').pop());

      const size = parseInt(contents[i].getElementsByTagName('Size')[0]?.textContent || '0');

      files.push({ name, path: '/' + relativePath, isDirectory: false, size, lastModified });
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

  // 刷新账户下拉框
  refreshAccountSelect() {
    const select = this.contentEl.querySelector('select.cloud-attach-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">请选择账户</option>';
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
    
    // ---- 账户类型选择 ----
    const typeDiv = document.createElement('div');
    typeDiv.style.margin = '16px 0';
    const typeLabel = document.createElement('label');
    typeLabel.style.display = 'block';
    typeLabel.style.marginBottom = '8px';
    typeLabel.style.fontSize = '12px';
    typeLabel.style.color = 'var(--text-muted)';
    typeLabel.textContent = '存储类型';
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
    typeS3.appendChild(document.createTextNode('对象存储 (S3)'));
    
    typeRow.appendChild(typeOpenList);
    typeRow.appendChild(typeS3);
    typeDiv.appendChild(typeRow);
    this.contentEl.appendChild(typeDiv);

    // ---- 账户名称（通用）----
    const nameDiv = this.createFieldDiv('账户名称', '例如：我的COS桶');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = '例如：我的COS桶';
    nameInput.value = this.account?.name || '';
    nameInput.className = 'cloud-attach-input';
    nameDiv.appendChild(nameInput);
    fields.name = nameInput;
    this.contentEl.appendChild(nameDiv);

    // ---- OpenList / WebDAV 字段集 ----
    const openlistFields = document.createElement('div');
    openlistFields.id = 'ol-fields';

    const urlDiv = this.createFieldDiv('服务器地址', 'http://192.168.62.200:5244');
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.placeholder = 'http://192.168.62.200:5244';
    urlInput.value = this.account?.url || '';
    urlInput.className = 'cloud-attach-input';
    urlDiv.appendChild(urlInput);
    fields.url = urlInput;
    openlistFields.appendChild(urlDiv);
    
    const webdavDiv = this.createFieldDiv('WebDAV 路径', '/dav');
    const webdavInput = document.createElement('input');
    webdavInput.type = 'text';
    webdavInput.placeholder = '/dav';
    webdavInput.value = this.account?.webdavPath || '/dav';
    webdavInput.className = 'cloud-attach-input';
    webdavDiv.appendChild(webdavInput);
    fields.webdavPath = webdavInput;
    openlistFields.appendChild(webdavDiv);
    
    const userDiv = this.createFieldDiv('用户名', '');
    const userInput = document.createElement('input');
    userInput.type = 'text';
    userInput.value = this.account?.username || '';
    userInput.className = 'cloud-attach-input';
    userDiv.appendChild(userInput);
    fields.username = userInput;
    openlistFields.appendChild(userDiv);
    
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
    openlistFields.appendChild(passDiv);
    
    const tokenDiv = this.createFieldDiv('Token（选填）', '在 OpenList 后台获取，不填则不签名');
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

    const endpointDiv = this.createFieldDiv('端点', 'https://xxx.r2.cloudflarestorage.com');
    const endpointInput = document.createElement('input');
    endpointInput.type = 'text';
    endpointInput.placeholder = 'https://xxx.r2.cloudflarestorage.com';
    endpointInput.value = this.account?.endpoint || '';
    endpointInput.className = 'cloud-attach-input';
    endpointDiv.appendChild(endpointInput);
    fields.endpoint = endpointInput;
    s3Fields.appendChild(endpointDiv);

    const bucketDiv = this.createFieldDiv('存储桶', 'my-vault-attach');
    const bucketInput = document.createElement('input');
    bucketInput.type = 'text';
    bucketInput.placeholder = 'my-vault-attach';
    bucketInput.value = this.account?.bucket || '';
    bucketInput.className = 'cloud-attach-input';
    bucketDiv.appendChild(bucketInput);
    fields.bucket = bucketInput;
    s3Fields.appendChild(bucketDiv);

    const regionDiv = this.createFieldDiv('地域', 'auto（Cloudflare R2 可留空）');
    const regionInput = document.createElement('input');
    regionInput.type = 'text';
    regionInput.placeholder = 'auto';
    regionInput.value = this.account?.region || '';
    regionInput.className = 'cloud-attach-input';
    regionDiv.appendChild(regionInput);
    fields.region = regionInput;
    s3Fields.appendChild(regionDiv);

    const akDiv = this.createFieldDiv('访问密钥 ID', '');
    const akInput = document.createElement('input');
    akInput.type = 'text';
    akInput.value = this.account?.accessKey || '';
    akInput.className = 'cloud-attach-input';
    akDiv.appendChild(akInput);
    fields.accessKey = akInput;
    s3Fields.appendChild(akDiv);

    const skDiv = this.createFieldDiv('访问密钥', '');
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

    const publicUrlDiv = this.createFieldDiv('自定义主机', 'https://cdn.example.com（选填，用于拼公共访问URL）');
    const publicUrlInput = document.createElement('input');
    publicUrlInput.type = 'text';
    publicUrlInput.placeholder = 'https://cdn.example.com';
    publicUrlInput.value = this.account?.publicUrl || '';
    publicUrlInput.className = 'cloud-attach-input';
    publicUrlDiv.appendChild(publicUrlInput);
    fields.publicUrl = publicUrlInput;
    s3Fields.appendChild(publicUrlDiv);

    const prefixDiv = this.createFieldDiv('存储路径（选填）', 'obsidian/，默认根目录');
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
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'cloud-attach-btn';
    cancelBtn.onclick = () => this.close();
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存';
    saveBtn.className = 'cloud-attach-btn mod-cta';
    saveBtn.onclick = async () => {
      const accountType = radioOpenList.checked ? 'openlist' : 's3';
      let accountData;

      if (accountType === 's3') {
        // S3 模式校验
        const endpoint = fields.endpoint.value.trim().replace(/\/$/, '');
        const bucket = fields.bucket.value.trim();
        if (!endpoint) { new Notice('请填写端点', 3000); return; }
        if (!bucket) { new Notice('请填写存储桶', 3000); return; }

        accountData = {
          type: 's3',
          name: fields.name.value.trim() || `S3 账户 ${this.plugin.accounts.length + 1}`,
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
        if (!url) { new Notice('请填写服务器地址', 3000); return; }

        accountData = {
          type: 'openlist',
          name: fields.name.value.trim() || `账户 ${this.plugin.accounts.length + 1}`,
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
      typeBadge.textContent = '对象存储';
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
      p1.textContent = `端点: ${account.endpoint}`;
      p1.className = 'setting-item-description';
      p1.style.wordBreak = 'break-all';
      card.appendChild(p1);
      const p2 = document.createElement('p');
      p2.textContent = `存储桶: ${account.bucket}`;
      p2.className = 'setting-item-description';
      card.appendChild(p2);
      if (account.prefix) {
        const p3 = document.createElement('p');
        p3.textContent = `存储路径: ${account.prefix}`;
        p3.className = 'setting-item-description';
        card.appendChild(p3);
      }
    } else {
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
    }

    const btnRow = document.createElement('div');
    btnRow.className = 'cloud-attach-card-btns';
    
    const editBtn = document.createElement('button');
    editBtn.textContent = '编辑';
    editBtn.className = 'cloud-attach-btn';
    editBtn.onclick = () => new AddAccountModal(this.plugin.app, this.plugin, () => {
      this.containerEl.innerHTML = '';
      this.render();
      this.refreshViewSelect();
    }, account).open();
    
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
    console.log('CloudAttach v0.1.013 loading...');
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
    if (!account) return null;
    if (account.type === 's3') return new S3Client(account);
    // 默认走 openlist / WebDAV
    return new OpenListClient(account);
  }
};
