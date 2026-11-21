import { CodeExportFormat, RedirectConfig } from '../types/redirect';
import { normalizePrimaryOrigin } from './redirectEngine';

export interface GeneratedArtifact {
  format: CodeExportFormat;
  label: string;
  filename: string;
  language: string;
  summary: string;
  code: string;
  secondaryFile?: {
    filename: string;
    code: string;
  };
}

export function generateRedirectArtifact(
  config: RedirectConfig,
  format: CodeExportFormat
): GeneratedArtifact {
  const primaryOrigin = normalizePrimaryOrigin(
    config.primaryDomain,
    config.forceHttps,
    config.stripWww
  );
  let primaryHost = 'domainchinh.vn';
  try {
    primaryHost = new URL(primaryOrigin).hostname;
  } catch {
    primaryHost = 'domainchinh.vn';
  }

  const enabledRules = config.rules.filter((r) => r.enabled);
  const whitelistRules = enabledRules.filter((r) => r.action === 'whitelist_bypass');
  const customRedirectRules = enabledRules.filter((r) => r.action !== 'whitelist_bypass');

  switch (format) {
    case 'js_head': {
      const whitelistPrefixes = whitelistRules.map((r) => r.pattern.replace(/\/?\*$/, ''));
      const customMap = customRedirectRules.map((r) => ({
        prefix: r.pattern.replace(/\/?\*$/, ''),
        target: r.action === 'redirect_to_root' ? '/' : r.targetPath,
      }));

      const code = `<!-- Tiện ích Tự Động Chuyển Hướng Đường Dẫn Phụ Về Domain Chính -->
<!-- Dán đoạn mã này ngay bên dưới thẻ <head> của website -->
<script>
(function () {
  var PRIMARY_ORIGIN = ${JSON.stringify(primaryOrigin)};
  var PRIMARY_HOST = ${JSON.stringify(primaryHost)};
  var STRATEGY = ${JSON.stringify(config.subpathStrategy)};
  var QUERY_POLICY = ${JSON.stringify(config.queryParamPolicy)};
  var PRESERVE_HASH = ${JSON.stringify(config.preserveHash)};
  var DELAY_MS = ${config.redirectDelaySeconds * 1000};

  var WHITELIST_PREFIXES = ${JSON.stringify(whitelistPrefixes)};
  var CUSTOM_RULES = ${JSON.stringify(customMap)};

  var loc = window.location;
  var currentHost = loc.hostname.replace(/^www\\./i, '');
  var currentPath = loc.pathname || '/';

  // 1. Kiểm tra danh sách ngoại lệ (Whitelist)
  for (var i = 0; i < WHITELIST_PREFIXES.length; i++) {
    var wp = WHITELIST_PREFIXES[i];
    if (wp && (currentPath === wp || currentPath.indexOf(wp + '/') === 0)) {
      return; // Giữ nguyên không chuyển hướng
    }
  }

  // 2. Xác định đường dẫn đích trên Domain chính
  var targetPath = '/';
  var matchedCustom = false;

  for (var j = 0; j < CUSTOM_RULES.length; j++) {
    var rule = CUSTOM_RULES[j];
    if (rule.prefix && (currentPath === rule.prefix || currentPath.indexOf(rule.prefix + '/') === 0)) {
      targetPath = rule.target || '/';
      matchedCustom = true;
      break;
    }
  }

  if (!matchedCustom) {
    if (STRATEGY === 'preserve_path') {
      targetPath = currentPath;
    } else {
      // Đưa mọi đường dẫn phụ về gốc Domain chính
      targetPath = '/';
    }
  }

  // 3. Xử lý Query String / Tham số UTM
  var finalSearch = '';
  if (QUERY_POLICY === 'preserve') {
    finalSearch = loc.search || '';
  } else if (QUERY_POLICY === 'utm_only' && loc.search) {
    var params = new URLSearchParams(loc.search);
    var kept = new URLSearchParams();
    params.forEach(function (val, key) {
      var k = key.toLowerCase();
      if (k.indexOf('utm_') === 0 || k === 'gclid' || k === 'fbclid' || k === 'ref') {
        kept.set(key, val);
      }
    });
    var qs = kept.toString();
    finalSearch = qs ? '?' + qs : '';
  }

  var finalHash = PRESERVE_HASH ? (loc.hash || '') : '';
  var destinationUrl = PRIMARY_ORIGIN + targetPath + finalSearch + finalHash;

  // 4. Chống lặp vô hạn: Chỉ chuyển hướng khi đang ở đường dẫn phụ hoặc domain khác
  var isOnPrimaryRoot = (currentHost.toLowerCase() === PRIMARY_HOST.toLowerCase()) && (currentPath === targetPath);
  if (!isOnPrimaryRoot && loc.href !== destinationUrl) {
    if (DELAY_MS > 0) {
      setTimeout(function () {
        window.location.replace(destinationUrl);
      }, DELAY_MS);
    } else {
      window.location.replace(destinationUrl);
    }
  }
})();
</script>`;

      return {
        format: 'js_head',
        label: 'Mã Nhúng Website (<script>)',
        filename: 'auto-redirect-head.html',
        language: 'html',
        summary: 'Dán trực tiếp vào thẻ <head> của Website, Landing Page hoặc WordPress để tự động đưa mọi đường dẫn phụ về domain chính.',
        code,
      };
    }

    case 'userscript': {
      const allHosts = [primaryHost, ...config.secondaryDomains.map((d) => d.trim()).filter(Boolean)];
      const matchLines = allHosts
        .map((host) => `// @match        *://${host}/*\n// @match        *://*.${host}/*`)
        .join('\n');
      const whitelistPrefixes = whitelistRules.map((r) => r.pattern.replace(/\/?\*$/, ''));

      const code = `// ==UserScript==
// @name         DomainFlow - Tự Động Chuyển Hướng Về ${primaryHost}
// @namespace    https://domainflow.local/
// @version      1.2.0
// @description  Tự động chuyển hướng sang domain chính (${primaryOrigin}) khi truy cập các đường dẫn phụ hoặc tên miền vệ tinh.
// @author       DomainFlow Utility
${matchLines}
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const PRIMARY_ORIGIN = ${JSON.stringify(primaryOrigin)};
  const PRIMARY_HOST = ${JSON.stringify(primaryHost)};
  const WHITELIST_PREFIXES = ${JSON.stringify(whitelistPrefixes)};
  const STRATEGY = ${JSON.stringify(config.subpathStrategy)};

  const loc = window.location;
  const path = loc.pathname || '/';
  const host = loc.hostname.replace(/^www\\./i, '');

  // Bỏ qua các đường dẫn nằm trong Whitelist
  for (const prefix of WHITELIST_PREFIXES) {
    if (prefix && (path === prefix || path.startsWith(prefix + '/'))) {
      return;
    }
  }

  // Nếu đang ở đường dẫn phụ (path !== '/') hoặc tên miền phụ
  const isSubpath = path !== '/' && path !== '';
  const isSecondaryHost = host.toLowerCase() !== PRIMARY_HOST.toLowerCase();

  if (isSubpath || isSecondaryHost) {
    const targetPath = STRATEGY === 'preserve_path' ? path : '/';
    const search = ${config.queryParamPolicy === 'strip' ? "''" : 'loc.search'};
    const destination = PRIMARY_ORIGIN + targetPath + search;

    if (loc.href !== destination) {
      window.location.replace(destination);
    }
  }
})();`;

      return {
        format: 'userscript',
        label: 'Tiện Ích Tampermonkey (.user.js)',
        filename: 'domainflow-redirect.user.js',
        language: 'javascript',
        summary: 'Tiện ích Userscript chạy ở chế độ document-start trên trình duyệt, tự động chuyển về domain chính ngay trước khi trang phụ tải xong.',
        code,
      };
    }

    case 'chrome_ext': {
      const allHosts = [primaryHost, ...config.secondaryDomains.map((d) => d.trim()).filter(Boolean)];
      const hostPermissions = allHosts.flatMap((h) => [`*://${h}/*`, `*://*.${h}/*`]);
      const whitelistPrefixes = whitelistRules.map((r) => r.pattern.replace(/\/?\*$/, ''));

      const manifestJson = JSON.stringify(
        {
          manifest_version: 3,
          name: `Tự Động Chuyển Hướng Về ${primaryHost}`,
          version: '1.0.0',
          description: `Tự động chuyển hướng mọi đường dẫn phụ và tên miền phụ về ${primaryOrigin}`,
          permissions: ['webNavigation', 'tabs'],
          host_permissions: hostPermissions,
          background: {
            service_worker: 'background.js',
          },
        },
        null,
        2
      );

      const backgroundJs = `// Tệp xử lý nền của Tiện ích Chrome / Edge / Cốc Cốc (background.js)
const PRIMARY_ORIGIN = ${JSON.stringify(primaryOrigin)};
const PRIMARY_HOST = ${JSON.stringify(primaryHost)};
const WHITELIST_PREFIXES = ${JSON.stringify(whitelistPrefixes)};
const STRATEGY = ${JSON.stringify(config.subpathStrategy)};
const STRIP_QUERY = ${JSON.stringify(config.queryParamPolicy === 'strip')};

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Chỉ xử lý khung chính (main_frame)
  if (details.frameId !== 0) return;

  try {
    const url = new URL(details.url);
    const cleanHost = url.hostname.replace(/^www\\./i, '');
    const path = url.pathname || '/';

    // 1. Kiểm tra Whitelist
    for (const prefix of WHITELIST_PREFIXES) {
      if (prefix && (path === prefix || path.startsWith(prefix + '/'))) {
        return;
      }
    }

    const isSubpath = path !== '/' && path !== '';
    const isSecondaryHost = cleanHost.toLowerCase() !== PRIMARY_HOST.toLowerCase();

    if (isSubpath || isSecondaryHost) {
      const targetPath = STRATEGY === 'preserve_path' ? path : '/';
      const query = STRIP_QUERY ? '' : url.search;
      const targetUrl = PRIMARY_ORIGIN + targetPath + query;

      if (details.url !== targetUrl) {
        chrome.tabs.update(details.tabId, { url: targetUrl });
      }
    }
  } catch (err) {
    console.error('Redirect error:', err);
  }
});`;

      return {
        format: 'chrome_ext',
        label: 'Chrome / Edge Extension (MV3)',
        filename: 'background.js',
        language: 'javascript',
        summary: 'Trọn bộ tiện ích mở rộng trình duyệt Chrome / Edge / Cốc Cốc (Manifest V3) bắt sự kiện điều hướng và đưa thẳng về domain chính.',
        code: backgroundJs,
        secondaryFile: {
          filename: 'manifest.json',
          code: manifestJson,
        },
      };
    }

    case 'nginx': {
      const serverNames = [
        primaryHost,
        `www.${primaryHost}`,
        ...config.secondaryDomains.map((d) => d.trim()).filter(Boolean),
      ].join(' ');

      const querySuffix = config.queryParamPolicy === 'strip' ? '?' : '$is_args$args';
      const status = config.httpStatusCode;

      const whitelistBlocks = whitelistRules
        .map((r) => {
          const clean = r.pattern.replace(/\/?\*$/, '');
          return `    # Ngoại lệ Whitelist: ${r.description}\n    location ^~ ${clean} {\n        try_files $uri $uri/ /index.html;\n    }`;
        })
        .join('\n\n');

      const customBlocks = customRedirectRules
        .map((r) => {
          const clean = r.pattern.replace(/\/?\*$/, '');
          const dest = r.action === 'redirect_to_root' ? '/' : r.targetPath;
          return `    # Quy tắc: ${r.description}\n    location ^~ ${clean} {\n        return ${status} ${primaryOrigin}${dest}${querySuffix};\n    }`;
        })
        .join('\n\n');

      const code = `# Cấu hình Nginx Tự Động Chuyển Hướng Đường Dẫn Phụ Về Domain Chính
server {
    listen 80;
    listen 443 ssl http2;
    server_name ${serverNames};

    # 1. Chuyển hướng mọi tên miền phụ / www về Domain chính
    if ($host != "${primaryHost}") {
        return ${status} ${primaryOrigin}${config.subpathStrategy === 'preserve_path' ? '$request_uri' : `/${querySuffix}`};
    }

${whitelistBlocks ? whitelistBlocks + '\n\n' : ''}${customBlocks ? customBlocks + '\n\n' : ''}    # 2. Giữ nguyên trang chủ gốc (/)
    location = / {
        try_files $uri /index.html;
    }

    # 3. Tự động chuyển hướng mọi đường dẫn phụ khác về trang chủ Domain chính
    location ~ ^/.+$ {
        return ${status} ${primaryOrigin}/${querySuffix};
    }
}`;

      return {
        format: 'nginx',
        label: 'Cấu Hình Nginx (nginx.conf)',
        filename: 'domainflow-redirect.conf',
        language: 'nginx',
        summary: 'Cấu hình máy chủ Nginx tốc độ cao giúp chuyển hướng 301/302 mọi đường dẫn phụ và domain vệ tinh về domain chính chuẩn SEO.',
        code,
      };
    }

    case 'htaccess': {
      const status = config.httpStatusCode;
      const qsaFlag = config.queryParamPolicy === 'strip' ? '?' : '';

      const whitelistConds = whitelistRules
        .map((r) => {
          const clean = r.pattern.replace(/\/?\*$/, '');
          return `    # Ngoại lệ Whitelist: ${r.description}\n    RewriteCond %{REQUEST_URI} !^${clean}(/.*)?$ [NC]`;
        })
        .join('\n');

      const customRulesLines = customRedirectRules
        .map((r) => {
          const clean = r.pattern.replace(/^\//, '').replace(/\/?\*$/, '');
          const dest = r.action === 'redirect_to_root' ? '/' : r.targetPath;
          return `    # ${r.description}\n    RewriteRule ^${clean}(/.*)?$ ${primaryOrigin}${dest}${qsaFlag} [R=${status},L,NC]`;
        })
        .join('\n\n');

      const code = `# Cấu hình Apache (.htaccess) Tự Động Chuyển Hướng Về Domain Chính
<IfModule mod_rewrite.c>
    RewriteEngine On

${customRulesLines ? customRulesLines + '\n\n' : ''}    # 1. Chuyển hướng mọi đường dẫn phụ (khác trang chủ /) về gốc Domain chính
    RewriteCond %{REQUEST_URI} !^/$
    RewriteCond %{REQUEST_URI} !^/index\\.(html|php)$ [NC]
${whitelistConds ? whitelistConds + '\n' : ''}    RewriteRule ^(.+)$ ${primaryOrigin}/${qsaFlag} [R=${status},L]

    # 2. Đảm bảo mọi truy cập từ tên miền phụ đều về Domain chính
    RewriteCond %{HTTP_HOST} !^${primaryHost.replace(/\./g, '\\.')}$ [NC]
    RewriteRule ^(.*)$ ${primaryOrigin}/${qsaFlag} [R=${status},L]
</IfModule>`;

      return {
        format: 'htaccess',
        label: 'Apache (.htaccess)',
        filename: '.htaccess',
        language: 'apache',
        summary: 'Tệp .htaccess chuẩn dành cho hosting Apache / cPanel / WordPress giúp gom toàn bộ đường dẫn phụ về trang chủ domain chính.',
        code,
      };
    }

    case 'cloudflare_worker': {
      const whitelistPrefixes = whitelistRules.map((r) => r.pattern.replace(/\/?\*$/, ''));
      const customMap = customRedirectRules.map((r) => ({
        prefix: r.pattern.replace(/\/?\*$/, ''),
        target: r.action === 'redirect_to_root' ? '/' : r.targetPath,
      }));

      const code = `// Cloudflare Worker — Tự động chuyển hướng đường dẫn phụ ở tầng Edge
export default {
  async fetch(request) {
    const PRIMARY_ORIGIN = ${JSON.stringify(primaryOrigin)};
    const PRIMARY_HOST = ${JSON.stringify(primaryHost)};
    const STATUS_CODE = ${config.httpStatusCode};
    const STRATEGY = ${JSON.stringify(config.subpathStrategy)};
    const QUERY_POLICY = ${JSON.stringify(config.queryParamPolicy)};
    const WHITELIST_PREFIXES = ${JSON.stringify(whitelistPrefixes)};
    const CUSTOM_RULES = ${JSON.stringify(customMap)};

    const url = new URL(request.url);
    const path = url.pathname || '/';
    const host = url.hostname.replace(/^www\\./i, '');

    // 1. Bỏ qua các đường dẫn thuộc Whitelist
    for (const wp of WHITELIST_PREFIXES) {
      if (wp && (path === wp || path.startsWith(wp + '/'))) {
        return fetch(request);
      }
    }

    // 2. Xác định đường dẫn đích
    let targetPath = '/';
    let matched = false;
    for (const rule of CUSTOM_RULES) {
      if (rule.prefix && (path === rule.prefix || path.startsWith(rule.prefix + '/'))) {
        targetPath = rule.target || '/';
        matched = true;
        break;
      }
    }

    if (!matched && STRATEGY === 'preserve_path') {
      targetPath = path;
    }

    // 3. Xử lý Query String
    let search = '';
    if (QUERY_POLICY === 'preserve') {
      search = url.search;
    } else if (QUERY_POLICY === 'utm_only' && url.search) {
      const kept = new URLSearchParams();
      url.searchParams.forEach((v, k) => {
        if (k.toLowerCase().startsWith('utm_') || k === 'gclid' || k === 'fbclid') {
          kept.set(k, v);
        }
      });
      const qs = kept.toString();
      search = qs ? '?' + qs : '';
    }

    const destination = PRIMARY_ORIGIN + targetPath + search;
    const isAlreadyAtTarget = host.toLowerCase() === PRIMARY_HOST.toLowerCase() && path === targetPath;

    if (!isAlreadyAtTarget) {
      return Response.redirect(destination, STATUS_CODE);
    }

    return fetch(request);
  }
};`;

      return {
        format: 'cloudflare_worker',
        label: 'Cloudflare Worker (Edge)',
        filename: 'worker.js',
        language: 'javascript',
        summary: 'Chuyển hướng trực tiếp trên mạng lưới Cloudflare Edge trước khi request chạm tới máy chủ gốc, độ trễ dưới 10ms.',
        code,
      };
    }

    case 'vercel': {
      const permanent = config.httpStatusCode === 301 || config.httpStatusCode === 308;
      const redirects = [
        ...customRedirectRules.map((r) => ({
          source: r.pattern.endsWith('/*')
            ? `${r.pattern.slice(0, -2)}/:path*`
            : r.pattern,
          destination: `${primaryOrigin}${r.action === 'redirect_to_root' ? '/' : r.targetPath}`,
          permanent,
        })),
        {
          source: '/:path((?!api/|admin/).+)',
          destination: `${primaryOrigin}/`,
          permanent,
        },
      ];

      const code = JSON.stringify({ redirects }, null, 2);

      return {
        format: 'vercel',
        label: 'Vercel Config (vercel.json)',
        filename: 'vercel.json',
        language: 'json',
        summary: 'Cấu hình chuyển hướng tự động cho dự án triển khai trên Vercel, tự động bỏ qua /api và /admin.',
        code,
      };
    }
  }
}
