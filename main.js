/**
 * CloudAttach Plugin v0.0.016
 * 云附件管理 - 连接 OpenList/WebDAV
 */

'use strict';

const { Plugin, Notice, Menu, Modal, PluginSettingTab, MarkdownView, ItemView } = require('obsidian');

const VIEW_TYPE_CLOUDATTACH = 'cloud-attach-view';

class OpenListClient {
  constructor(account, app) {
    this.serverUrl = account.url.replace(/\/$/, '');
    this.webdavPath = (account.webdavPath || '/dav').replace(/\/$/, '');
    this.token = account.token || '';
    this.username = account.username;
    this.password = account.password;
    this.app = app;
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
    const encodedPath = encodeURI(remotePath);
    return `${this.serverUrl}/p${encodedPath}`;
  }

  // 获取文件的 WebDAV URL（用于插入到笔记）
  getFileUrl(remotePath) {
    const webdavPath = this.webdavPath || '/dav';
    // 如果有认证信息，在 URL 中带上 Basic Auth
    if (this.username && this.password) {
      const encodedCreds = btoa(`${this.username}:${this.password}`);
      const serverWithoutProtocol = this.serverUrl.replace(/^https?:\/\//, '');
      return `https://${encodedCreds}@${serverWithoutProtocol}${webdavPath}${remotePath}`;
    }
    return `${this.serverUrl}${webdavPath}${remotePath}`;
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
        return { ok: false, error: '本地文件不存在' };
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
        return { ok: false, error: '不支持的文件类型' };
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
        return { ok: false, error: `上传失败: HTTP ${response.status}` };
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
  constructor(account) {
    this.endpoint = account.endpoint?.replace(/\/$/, '') || '';
    this.bucket = account.bucket || '';
    this.region = account.region || '';
    this.accessKey = account.accessKey || '';
    this.secretKey = account.secretKey || '';
    this.publicUrl = account.publicUrl?.replace(/\/$/, '') || '';
    // S3 prefix 不应该以 / 开头，应该是相对于 bucket 的路径
    this.prefix = account.prefix ? account.prefix.replace(/^\/+|\/+$/g, '') + '/' : '';
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

      const text = await response.text();
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
    // publicUrl 可能是裸域名（无协议），自动补 https://
    const base = this.publicUrl.startsWith('http') ? this.publicUrl : `https://${this.publicUrl}`;
    return `${base}/${fullPath}`;
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
    
    // 复制 URL 按钮（复制所有选中文件的 URL）
    const copyUrlBtn = document.createElement('button');
    copyUrlBtn.className = 'cloud-attach-batch-btn mod-secondary';
    copyUrlBtn.textContent = '复制URL';
    copyUrlBtn.onclick = async () => {
      if (!this.client || this.selectedFiles.size === 0) {
        new Notice('⚠️ 请先选择文件');
        return;
      }
      const selected = this.files.filter(f => this.selectedFiles.has(f.path));
      const urls = await Promise.all(selected.map(f =>
        this.client.getSignedUrl ? this.client.getSignedUrl(f.path) : this.client.getFileUrl(f.path)
      ));
      await navigator.clipboard.writeText(urls.join('\n'));
      new Notice(`📋 已复制 ${urls.length} 个 URL`);
    };
    this.batchBarEl.appendChild(copyUrlBtn);
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
    
    // 优先使用 getSignedUrl（S3 私有桶有签名，OpenList 有 raw_url）
    // WebDAV（无 token）回退到 getFileUrl（带 Basic Auth）
    const url = await (this.client.getSignedUrl
      ? this.client.getSignedUrl(file.path)
      : this.client.getFileUrl(file.path));

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
      // 插入到笔记（多选时插入所有选中，否则只插当前）
      menu.addItem(item => {
        const isMulti = this.selectedFiles.size > 1;
        item.setTitle(isMulti ? `插入到笔记 (${this.selectedFiles.size})` : '插入到笔记').setIcon('link');
        item.onClick(() => {
          if (isMulti) this.insertSelectedFiles();
          else this.insertFile(file);
        });
      });
      // 复制链接（多选时复制所有选中文件，否则复制当前文件）
      menu.addItem(item => {
        item.setTitle('复制链接');
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
            new Notice(`📋 已复制 ${urls.length} 个链接`);
          } catch { new Notice('❌ 获取链接失败'); }
        });
      });
      // 选择/取消选择
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
    console.log('CloudAttach v0.1.052 loading...');
    await this.loadSettings();
    this.addStyles();
    this.registerView(VIEW_TYPE_CLOUDATTACH, (leaf) => new CloudAttachView(leaf, this));
    this.addRibbonIcon('folder-open', '☁️ 云附件', () => this.activateView());
    this.addSettingTab(new CloudAttachSettingTab(this));
    this.addCommand({ id: 'open-browser', name: 'Open CloudAttach Browser', callback: () => this.activateView() });
    this.addCommand({
      id: 'reload-plugin',
      name: 'Reload CloudAttach Plugin',
      callback: async () => {
        try {
          await plugin.app.plugins.disablePlugin('cloud-attach');
          await plugin.app.plugins.enablePlugin('cloud-attach');
          new Notice('✅ CloudAttach 已重新加载', 2000);
        } catch (e) {
          new Notice('❌ 重载失败: ' + e.message, 4000);
        }
      }
    });

    // ---- Sign 检查与刷新命令 ----
    this.addCommand({
      id: 'check-sign-current-note',
      name: '检查并刷新当前笔记的 Sign',
      callback: () => this.checkAndRefreshCurrentNote()
    });

    this.addCommand({
      id: 'check-sign-current-url',
      name: '检查并刷新当前 URL 的 Sign',
      callback: () => this.checkAndRefreshCurrentUrl()
    });

    // ---- 上传附件命令 ----
    this.addCommand({
      id: 'upload-current-attachment',
      name: '上传当前附件',
      callback: () => this.uploadCurrentAttachment()
    });

    this.addCommand({
      id: 'upload-all-attachments',
      name: '上传笔记中全部附件',
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
            si.setTitle('刷新当前 URL 签名').onClick(() => {
              this.checkAndRefreshCurrentUrl();
            });
          });
          submenu.addItem(si => {
            si.setTitle('更新当前笔记所有 URL 签名').onClick(() => {
              this.checkAndRefreshCurrentNote();
            });
          });
          
          // 上传分隔线
          submenu.addSeparator();
          
          submenu.addItem(si => {
            si.setTitle('上传当前附件').onClick(() => {
              this.uploadCurrentAttachment();
            });
          });
          submenu.addItem(si => {
            si.setTitle('上传笔记中全部附件').onClick(() => {
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
      new Notice('❌ 请先打开一个笔记', 3000);
      return;
    }

    const text = view.editor.getValue();
    const urls = this.extractUrls(text);

    if (urls.length === 0) {
      new Notice('📭 笔记中未发现任何 URL', 3000);
      return;
    }

    new Notice(`🔍 开始检查 ${urls.length} 个 URL...`, 3000);

    const results = { valid: 0, refreshed: 0, refreshedPaths: [], failed: 0, failedUrls: [], skipped: 0 };

    for (const url of urls) {
      console.log('[CloudAttach] 检查 URL:', url);
      const match = this.matchAccount(url);
      if (!match) {
        console.log('[CloudAttach] 未匹配到账户，跳过');
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
            results.failedUrls.push({ url, reason: '无法提取路径或无 Token' });
            continue;
          }
          try {
            const newUrl = await client.getSignedUrl(realPath);
            if (newUrl && newUrl !== url) {
              // 替换笔记中的 URL
              const newText = view.editor.getValue().replace(url, newUrl);
              view.editor.setValue(newText);
              results.refreshed++;
              results.refreshedPaths.push(realPath);
            } else {
              results.valid++;
            }
          } catch (e) {
            results.failed++;
            results.failedUrls.push({ url, reason: `重建失败: ${e.message}` });
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
                const newText = view.editor.getValue().replace(url, newUrl);
                view.editor.setValue(newText);
                results.refreshed++;
                results.refreshedPaths.push(realPath);
              }
            } catch (e) {
              results.failed++;
              results.failedUrls.push({ url, reason: `补 sign 失败: ${e.message}` });
            }
          }
        } else {
          results.failed++;
          results.failedUrls.push({ url, reason: verify.reason });
        }
      }
    }

    // 汇总提示
    const parts = [];
    if (results.valid > 0) parts.push(`${results.valid} 个有效`);
    if (results.refreshed > 0) parts.push(`✅ ${results.refreshed} 个已刷新`);
    if (results.failed > 0) parts.push(`❌ ${results.failed} 个失败`);
    if (results.skipped > 0) parts.push(`${results.skipped} 个跳过`);

    if (results.refreshed > 0) {
      new Notice(`✅ 检查完成：${parts.join('，')}`, 6000);
    } else {
      new Notice(`📋 检查完成：${parts.join('，')}`, 4000);
    }

    if (results.failedUrls.length > 0) {
      console.log('[CloudAttach] Sign 检查失败列表:', results.failedUrls);
    }
  }

  /**
   * 检查并刷新当前光标所在行/选中的 URL
   */
  async checkAndRefreshCurrentUrl() {
    const view = this.activeMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
    console.log('[CloudAttach] checkAndRefreshCurrentUrl view:', !!view, 'editor:', !!view?.editor);
    if (!view?.editor) {
      new Notice('❌ 请先打开一个笔记', 3000);
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
      new Notice('❌ 光标附近未找到 URL', 3000);
      console.log('[CloudAttach] 未找到 URL，cursor line:', cursor.line, 'ch:', cursor.ch);
      return;
    }
    
    console.log('[CloudAttach] 找到 URL:', url.substring(0, 80), 'type:', urlType);
    new Notice(`🔍 检查 URL: ${url.substring(0, 50)}...`, 3000);
    const match = this.matchAccount(url);

    if (!match) {
      new Notice('⚠️ 该 URL 不属于已配置的服务器，跳过', 4000);
      return;
    }

    const { account, client } = match;
    const path = new URL(url).pathname;

    if (!path.startsWith('/p/') && !path.startsWith('/d/')) {
      new Notice('⚠️ 非 OpenList URL，跳过', 3000);
      return;
    }

    // 验证 URL
    const verify = await client.verifySignUrl(url);

    if (verify.ok) {
      new Notice('✅ Sign 有效，无需刷新', 3000);
      return;
    }

    if (verify.reason === 'sign_expired') {
      const realPath = client.extractRealPath(url);
      if (!realPath || !account.token) {
        new Notice('❌ 无法提取路径或无 Token，无法刷新', 4000);
        return;
      }
      try {
        const newUrl = await client.getSignedUrl(realPath);
        if (newUrl) {
          const fullText = view.editor.getValue();
          const newText = fullText.replace(url, newUrl);
          view.editor.setValue(newText);
          new Notice(`✅ Sign 已刷新`, 3000);
        }
      } catch (e) {
        new Notice(`❌ 刷新失败: ${e.message}`, 4000);
      }
    } else {
      const reasonMap = {
        file_not_found: '文件不存在（可能在服务器上被删除或移动）',
        network_error: '网络错误',
        http_error: `HTTP ${verify.status}`
      };
      new Notice(`❌ URL 失效：${reasonMap[verify.reason] || verify.reason}`, 5000);
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
    if (account.type === 's3') return new S3Client(account);
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
      return { ok: false, error: '请先打开 CloudAttach 标签页并选择上传目录' };
    }
    const view = leaves[0].view;
    if (!view.client) {
      return { ok: false, error: '请先选择一个账户' };
    }
    if (!view.accountId) {
      return { ok: false, error: '请先选择一个账户' };
    }
    if (!view.currentPath || view.currentPath === '/') {
      return { ok: false, error: '请先在 CloudAttach 标签页中选择上传目录（不能是根目录）' };
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
      new Notice('❌ 请先打开一个笔记', 3000);
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
      new Notice('⚠️ 当前未选中本地附件', 3000);
      return;
    }

    // 解析附件路径（可能是相对路径）
    const notePath = view.file?.path || '';
    let absolutePath = localPath;
    if (!absolutePath.startsWith('/')) {
      // 相对路径，转换为绝对路径
      const noteDir = notePath.substring(0, notePath.lastIndexOf('/') + 1);
      absolutePath = noteDir + localPath;
    }

    console.log('[CloudAttach] 上传当前附件:', absolutePath);
    
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
      new Notice('❌ 请先打开一个笔记', 3000);
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
      new Notice('📭 笔记中没有本地附件', 3000);
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
      modal.titleEl.textContent = '📤 确认上传附件';
      
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
      targetEl.innerHTML = `上传到：<code style="background:var(--background-secondary);padding:2px 6px;border-radius:3px;">${this.escapeHtml(remotePath)}</code>`;
      content.appendChild(targetEl);
      
      // 按钮行
      const btnRow = document.createElement('div');
      btnRow.style.display = 'flex';
      btnRow.style.gap = '8px';
      btnRow.style.justifyContent = 'flex-end';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '取消';
      cancelBtn.className = 'mod-cta';
      cancelBtn.style.padding = '8px 16px';
      cancelBtn.onclick = () => { modal.close(); resolve(false); };
      
      const uploadBtn = document.createElement('button');
      uploadBtn.textContent = `上传 ${attachments.length} 个文件`;
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
    
    new Notice(`📤 开始上传 ${attachments.length} 个附件...`, 3000);
    
    const results = { success: 0, failed: 0, skipped: 0 };
    const replacements = [];
    
    for (const att of attachments) {
      console.log('[CloudAttach] 上传:', att.localPath);
      
      // 检查本地文件是否存在
      const file = this.app.vault.getAbstractFileByPath(att.localPath);
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
          localPath: att.localPath
        });
      } else {
        results.failed++;
        console.log('[CloudAttach] 上传失败:', result.error);
      }
    }
    
    // 更新笔记内容
    if (replacements.length > 0 && view?.editor) {
      let text = view.editor.getValue();
      
      for (const rep of replacements) {
        // 替换 Markdown 语法中的本地路径为新的云端 URL
        const newSyntax = rep.oldSyntax.replace(/!\[([^\]]*)\]\([^)]+\)/, `![](${rep.newUrl})`);
        text = text.replace(rep.oldSyntax, newSyntax);
        
        // 删除本地文件
        try {
          await this.app.vault.deleteFile(this.app.vault.getAbstractFileByPath(rep.localPath));
          console.log('[CloudAttach] 已删除本地文件:', rep.localPath);
        } catch (e) {
          console.log('[CloudAttach] 删除本地文件失败:', e.message);
        }
      }
      
      view.editor.setValue(text);
    }
    
    // 显示结果
    const parts = [];
    if (results.success > 0) parts.push(`✅ 上传成功 ${results.success} 个`);
    if (results.failed > 0) parts.push(`❌ 失败 ${results.failed} 个`);
    if (results.skipped > 0) parts.push(`⏭️ 跳过 ${results.skipped} 个`);
    
    new Notice(`📤 上传完成：${parts.join('，')}`, 5000);
  }
};
