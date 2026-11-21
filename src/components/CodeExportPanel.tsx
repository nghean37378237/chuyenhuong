import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode,
  Globe,
  Layers,
  Puzzle,
  Server,
  Terminal,
} from 'lucide-react';
import { CodeExportFormat, RedirectConfig } from '../types/redirect';
import { generateRedirectArtifact } from '../utils/codeGenerators';

interface CodeExportPanelProps {
  config: RedirectConfig;
}

const FORMAT_OPTIONS: {
  id: CodeExportFormat;
  shortLabel: string;
  category: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'js_head',
    shortLabel: 'Mã Nhúng Web (<script>)',
    category: 'Client-side',
    icon: Code2,
  },
  {
    id: 'userscript',
    shortLabel: 'Tampermonkey (.user.js)',
    category: 'Tiện ích trình duyệt',
    icon: Puzzle,
  },
  {
    id: 'chrome_ext',
    shortLabel: 'Chrome / Edge Extension',
    category: 'Tiện ích trình duyệt',
    icon: Globe,
  },
  {
    id: 'nginx',
    shortLabel: 'Nginx Server',
    category: 'Máy chủ',
    icon: Server,
  },
  {
    id: 'htaccess',
    shortLabel: 'Apache (.htaccess)',
    category: 'Máy chủ',
    icon: FileCode,
  },
  {
    id: 'cloudflare_worker',
    shortLabel: 'Cloudflare Worker',
    category: 'Edge CDN',
    icon: Layers,
  },
  {
    id: 'vercel',
    shortLabel: 'Vercel (vercel.json)',
    category: 'Cloud Hosting',
    icon: Terminal,
  },
];

export const CodeExportPanel: React.FC<CodeExportPanelProps> = ({ config }) => {
  const [selectedFormat, setSelectedFormat] = useState<CodeExportFormat>('js_head');
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedSecondary, setCopiedSecondary] = useState(false);

  const artifact = generateRedirectArtifact(config, selectedFormat);

  const handleCopy = async (text: string, isSecondary = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isSecondary) {
        setCopiedSecondary(true);
        setTimeout(() => setCopiedSecondary(false), 2000);
      } else {
        setCopiedMain(true);
        setTimeout(() => setCopiedMain(false), 2000);
      }
    } catch {
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      if (isSecondary) {
        setCopiedSecondary(true);
        setTimeout(() => setCopiedSecondary(false), 2000);
      } else {
        setCopiedMain(true);
        setTimeout(() => setCopiedMain(false), 2000);
      }
    }
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getInstallationSteps = (format: CodeExportFormat): string[] => {
    switch (format) {
      case 'js_head':
        return [
          'Sao chép đoạn mã <script> bên dưới.',
          'Mở tệp index.html, header.php (WordPress) hoặc phần Custom Head Code của Landing Page.',
          'Dán ngay bên dưới thẻ mở <head> để trình duyệt thực thi chuyển hướng trước khi tải nội dung phụ.',
        ];
      case 'userscript':
        return [
          'Cài đặt tiện ích Tampermonkey hoặc Violentmonkey trên trình duyệt Chrome / Edge / Cốc Cốc / Firefox.',
          'Bấm nút "Tải tệp domainflow-redirect.user.js" hoặc tạo script mới và dán mã vào.',
          'Bật công tắc kích hoạt script — mọi truy cập vào đường dẫn phụ sẽ tự động nhảy về domain chính.',
        ];
      case 'chrome_ext':
        return [
          'Tạo một thư mục mới trên máy tính (ví dụ: tien-ich-chuyen-huong).',
          'Tải về cả 2 tệp manifest.json và background.js bên dưới rồi lưu vào thư mục đó.',
          'Mở trình duyệt tới địa chỉ chrome://extensions, bật "Chế độ dành cho nhà phát triển" (Developer mode) và chọn "Tải tiện ích đã giải nén" (Load unpacked).',
        ];
      case 'nginx':
        return [
          'Mở tệp cấu hình khối server của bạn trong /etc/nginx/sites-available/ hoặc /etc/nginx/conf.d/.',
          'Thêm các khối location chuyển hướng như bên dưới vào bên trong khối server {}.',
          'Chạy lệnh "nginx -t && systemctl reload nginx" để áp dụng ngay lập tức.',
        ];
      case 'htaccess':
        return [
          'Truy cập thư mục gốc của website (public_html) qua cPanel File Manager hoặc FTP.',
          'Mở tệp .htaccess (hoặc tải tệp .htaccess bên dưới lên thư mục gốc).',
          'Đảm bảo mô-đun mod_rewrite đã được bật trên máy chủ Apache/LiteSpeed.',
        ];
      case 'cloudflare_worker':
        return [
          'Đăng nhập bảng điều khiển Cloudflare Dashboard -> Workers & Pages -> Create Worker.',
          'Dán mã nguồn worker.js bên dưới vào trình soạn thảo và bấm Deploy.',
          'Vào mục Triggers -> Add Route và gán đường dẫn *domain.com/* để Worker tự động điều hướng.',
        ];
      case 'vercel':
        return [
          'Đặt tệp vercel.json ở thư mục gốc của mã nguồn dự án.',
          'Đẩy mã nguồn lên Git hoặc chạy lệnh "vercel --prod" để cập nhật cấu hình chuyển hướng.',
        ];
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Format Selector Bar */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Xuất Tiện Ích & Mã Nguồn Tự Động Chuyển Hướng
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã nguồn được biên dịch tự động theo thời gian thực từ cấu hình Domain chính và bảng quy tắc đường dẫn phụ của bạn.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            { config.rules.filter((r) => r.enabled).length } quy tắc đang kích hoạt · HTTP { config.httpStatusCode }
          </div>
        </div>

        {/* Interactive Segmented Format Buttons */}
        <div className="mt-4 flex flex-wrap gap-1.5 rounded-lg bg-slate-100 p-1.5">
          {FORMAT_OPTIONS.map((item) => {
            const Icon = item.icon;
            const active = selectedFormat === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedFormat(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Format Content */}
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs text-slate-500">
              <span>{artifact.label}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono text-slate-700">{artifact.filename}</span>
            </div>
            <p className="text-sm text-slate-700 mt-1">{artifact.summary}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleCopy(artifact.code, false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedMain ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép mã</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Sao chép mã</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDownloadFile(artifact.filename, artifact.code)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Tải tệp {artifact.filename}</span>
            </button>
          </div>
        </div>

        {/* Primary Code Block */}
        <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400 font-mono">
            <span>{artifact.filename}</span>
            <span>{artifact.language}</span>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed">
            <code>{artifact.code}</code>
          </pre>
        </div>

        {/* Secondary File (For Chrome Extension manifest.json) */}
        {artifact.secondaryFile && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Tệp cấu hình đi kèm:{' '}
                <strong className="font-mono text-slate-900">
                  {artifact.secondaryFile.filename}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(artifact.secondaryFile!.code, true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedSecondary ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Sao chép {artifact.secondaryFile.filename}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadFile(
                      artifact.secondaryFile!.filename,
                      artifact.secondaryFile!.code
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Tải {artifact.secondaryFile.filename}</span>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400 font-mono">
                <span>{artifact.secondaryFile.filename}</span>
                <span>json</span>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed">
                <code>{artifact.secondaryFile.code}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Step-by-step Quick Setup Instructions */}
        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Các bước tích hợp nhanh ({artifact.label})
          </h3>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {getInstallationSteps(selectedFormat).map((step, idx) => (
              <li key={idx} className="text-xs text-slate-600 leading-relaxed">
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  0{idx + 1}.
                </span>{' '}
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
