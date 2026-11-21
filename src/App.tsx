/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Download,
  Play,
} from 'lucide-react';
import { ArticleLinkPair, RedirectConfig } from './types/redirect';
import {
  DEFAULT_REDIRECT_CONFIG,
  normalizePrimaryOrigin,
} from './utils/redirectEngine';
import { generateRedirectArtifact } from './utils/codeGenerators';
import { ArticleDomainBridgePanel } from './components/ArticleDomainBridgePanel';
import { RuleBuilderPanel } from './components/RuleBuilderPanel';
import { BatchSimulatorPanel } from './components/BatchSimulatorPanel';
import { CodeExportPanel } from './components/CodeExportPanel';
import { LiveSandboxModal } from './components/LiveSandboxModal';

const STORAGE_KEY = 'domainflow_redirect_config_v2';

export default function App() {
  const [config, setConfig] = useState<RedirectConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<RedirectConfig>;
        return {
          ...DEFAULT_REDIRECT_CONFIG,
          ...parsed,
          activeSecondaryDomain:
            parsed.activeSecondaryDomain || DEFAULT_REDIRECT_CONFIG.activeSecondaryDomain,
          articles:
            parsed.articles && parsed.articles.length > 0
              ? parsed.articles
              : DEFAULT_REDIRECT_CONFIG.articles,
        };
      }
    } catch {
      // ignore storage error
    }
    return DEFAULT_REDIRECT_CONFIG;
  });

  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [sandboxTestUrl, setSandboxTestUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore storage error
    }
  }, [config]);

  const primaryOrigin = normalizePrimaryOrigin(
    config.primaryDomain,
    config.forceHttps,
    config.stripWww
  );
  const secondaryOrigin = normalizePrimaryOrigin(
    config.activeSecondaryDomain || 'https://domainphu.com',
    config.forceHttps,
    config.stripWww
  );

  const handleOpenSandboxWithUrl = (url?: string) => {
    setSandboxTestUrl(url);
    setSandboxOpen(true);
  };

  const handleSimulateArticleClick = (article: ArticleLinkPair) => {
    // Increment click counter on that article
    setConfig((prev) => ({
      ...prev,
      articles: (prev.articles || []).map((a) =>
        a.id === article.id ? { ...a, clicksCount: a.clicksCount + 1 } : a
      ),
    }));
    handleOpenSandboxWithUrl(article.secondaryArticleUrl);
  };

  const handleQuickDownloadUserscript = () => {
    const artifact = generateRedirectArtifact(config, 'userscript');
    const blob = new Blob([artifact.code], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = artifact.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const enabledRulesCount = config.rules.filter((r) => r.enabled).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xs">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          DomainFlow
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#dong-bo-bai-viet"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Đồng bộ bài viết
          </a>
          <a
            href="#cau-hinh"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Cấu hình quy tắc
          </a>
          <a
            href="#kiem-thu"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Kiểm thử đường dẫn
          </a>
          <a
            href="#xuat-tien-ich"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Xuất mã & Tiện ích
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenSandboxWithUrl()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Mô phỏng chuyển hướng</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 space-y-10">
        {/* Workspace Hero & Summary Strip */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="text-xs text-slate-500">
                <span>Tiện ích đồng bộ bài viết & điều hướng tự động</span>
                <span aria-hidden="true"> · </span>
                <span>Hiển thị Ảnh đại diện (og:image) trên cả Domain phụ & Domain chính</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                Đăng Bài Ở Domain Phụ, Click Vào Tự Động Chuyển Qua Bài Đó Ở Domain Chính
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Thiết lập song song <strong>Domain chính</strong> ({primaryOrigin}) và{' '}
                <strong>Domain phụ</strong> ({secondaryOrigin}). Khi nhập link bài viết ở domain chính hoặc domain phụ, hệ thống tự động hiển thị <strong>ảnh đại diện của bài đó</strong> và chuyển hướng người đọc về đúng bài viết trên domain chính khi họ click vào.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="#dong-bo-bai-viet"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Nhập link bài viết & Xem ảnh đại diện</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handleQuickDownloadUserscript}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Tải nhanh Userscript (.user.js)</span>
                </button>
              </div>
            </div>

            {/* Live Configuration Summary Column */}
            <div className="lg:col-span-5 lg:border-l lg:border-slate-200 lg:pl-8 space-y-3">
              <div className="text-xs font-semibold text-slate-800 border-b border-slate-200 pb-2.5 flex items-center justify-between">
                <span>Cặp Domain đang kết nối</span>
                <span className="font-mono tabular-nums text-blue-600">
                  HTTP {config.httpStatusCode}
                </span>
              </div>

              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">1. Domain chính (Đích):</dt>
                  <dd className="font-mono font-semibold text-blue-600 truncate">
                    {primaryOrigin}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">2. Domain phụ (Chia sẻ):</dt>
                  <dd className="font-mono font-semibold text-slate-900 truncate">
                    {secondaryOrigin}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Bài viết có ảnh đại diện:</dt>
                  <dd className="font-mono tabular-nums text-slate-800">
                    {(config.articles || []).length} bài viết
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Chế độ chuyển hướng:</dt>
                  <dd className="font-medium text-slate-800">
                    {config.subpathStrategy === 'preserve_path'
                      ? 'Chuyển đúng sang bài viết đó ở Domain chính'
                      : 'Gom về trang chủ Domain chính'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Quy tắc đường dẫn nâng cao:</dt>
                  <dd className="font-mono tabular-nums text-slate-800">
                    {enabledRulesCount} quy tắc đang bật
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Section 0: Primary vs Secondary Domain Article Bridge with Live Thumbnail Preview */}
        <section id="dong-bo-bai-viet" className="scroll-mt-20">
          <ArticleDomainBridgePanel
            config={config}
            onChange={setConfig}
            onSimulateArticleClick={handleSimulateArticleClick}
          />
        </section>

        {/* Section 1: Rule Builder & Domain Configuration */}
        <section id="cau-hinh" className="scroll-mt-20">
          <RuleBuilderPanel config={config} onChange={setConfig} />
        </section>

        {/* Section 2: Real-time URL Inspector & Batch Simulator */}
        <section id="kiem-thu" className="scroll-mt-20">
          <BatchSimulatorPanel
            config={config}
            onOpenSandbox={(url) => handleOpenSandboxWithUrl(url)}
          />
        </section>

        {/* Section 3: Code & Extension Export */}
        <section id="xuat-tien-ich" className="scroll-mt-20">
          <CodeExportPanel config={config} />
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-5 mt-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <span>DomainFlow — Tiện ích đồng bộ bài viết từ Domain phụ sang Domain chính kèm ảnh đại diện.</span>
          <span className="font-mono tabular-nums">
            {secondaryOrigin} ➔ {primaryOrigin}
          </span>
        </div>
      </footer>

      {/* Interactive Browser Sandbox Modal */}
      <LiveSandboxModal
        isOpen={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
        config={config}
        initialTestUrl={sandboxTestUrl}
      />
    </div>
  );
}
