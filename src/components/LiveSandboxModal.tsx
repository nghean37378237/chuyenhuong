import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CornerDownRight,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Lock,
  Play,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import { RedirectConfig } from '../types/redirect';
import { evaluateUrlRedirect, normalizePrimaryOrigin } from '../utils/redirectEngine';

interface LiveSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RedirectConfig;
  initialTestUrl?: string;
}

export const LiveSandboxModal: React.FC<LiveSandboxModalProps> = ({
  isOpen,
  onClose,
  config,
  initialTestUrl,
}) => {
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

  const defaultSampleUrl =
    config.articles?.[0]?.secondaryArticleUrl ||
    `${secondaryOrigin}/cong-nghe/xu-huong-ha-tang-ai-doanh-nghiep-2026.html`;

  const [addressInput, setAddressInput] = useState(initialTestUrl || defaultSampleUrl);
  const [currentBrowserUrl, setCurrentBrowserUrl] = useState(addressInput);
  const [phase, setPhase] = useState<'idle' | 'intercepted' | 'redirected' | 'bypassed'>('idle');
  const [countdown, setCountdown] = useState<number>(0);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const target = initialTestUrl || defaultSampleUrl;
      setAddressInput(target);
      setImgErr(false);
      triggerNavigation(target);
    }
  }, [initialTestUrl, isOpen]);

  const result = evaluateUrlRedirect(addressInput, config);

  const triggerNavigation = (targetInput: string) => {
    const evalRes = evaluateUrlRedirect(targetInput, config);
    setCurrentBrowserUrl(evalRes.inputUrl);

    if (!evalRes.shouldRedirect) {
      setPhase('bypassed');
      return;
    }

    if (config.redirectDelaySeconds > 0) {
      setPhase('intercepted');
      setCountdown(config.redirectDelaySeconds);
    } else {
      setPhase('intercepted');
      setTimeout(() => {
        setCurrentBrowserUrl(evalRes.finalUrl);
        setPhase('redirected');
      }, 450);
    }
  };

  useEffect(() => {
    if (phase !== 'intercepted' || config.redirectDelaySeconds === 0) return;
    if (countdown <= 0) {
      setCurrentBrowserUrl(result.finalUrl);
      setPhase('redirected');
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown, config.redirectDelaySeconds, result.finalUrl]);

  if (!isOpen) return null;

  const matchedArticle = result.matchedArticle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sandbox-modal-title"
    >
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="sandbox-modal-title" className="text-base font-semibold text-slate-900">
              Mô Phỏng Click Bài Viết Từ Domain Phụ ➔ Tự Động Chuyển Qua Domain Chính
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiển thị trực quan quá trình người đọc click vào bài viết trên Domain phụ và được chuyển sang đúng bài viết đó trên Domain chính kèm ảnh đại diện.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Đóng cửa sổ mô phỏng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preset Article Buttons */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="text-xs font-medium text-slate-600 mb-2">
            Chọn nhanh bài viết trên Domain phụ để thử click chuyển hướng:
          </div>
          <div className="flex flex-wrap gap-2">
            {(config.articles || []).slice(0, 4).map((art, i) => (
              <button
                key={art.id}
                type="button"
                onClick={() => {
                  setAddressInput(art.secondaryArticleUrl);
                  setImgErr(false);
                  triggerNavigation(art.secondaryArticleUrl);
                }}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-colors max-w-[220px] truncate shrink-0"
              >
                Bài #{i + 1}: {art.title}
              </button>
            ))}
          </div>
        </div>

        {/* Simulated Browser Chrome */}
        <div className="p-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            {/* Browser Address Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                triggerNavigation(addressInput);
              }}
              className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5 pr-1">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              </div>

              <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Nhập link bài trên Domain phụ..."
                  className="w-full bg-transparent font-mono text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="h-3.5 w-3.5" />
                Click truy cập
              </button>
            </form>

            {/* Active Browser Viewport */}
            <div className="p-6 bg-white min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3 mb-4">
                  <span className="truncate">
                    Thanh địa chỉ trình duyệt hiện tại:{' '}
                    <strong className="font-mono text-slate-900">{currentBrowserUrl}</strong>
                  </span>
                  <span className="font-mono tabular-nums shrink-0 ml-2">
                    HTTP {result.statusCode} · {result.executionTimeMs}ms
                  </span>
                </div>

                {phase === 'intercepted' && (
                  <div className="py-6 text-center">
                    <RefreshCw className="h-7 w-7 text-blue-600 animate-spin mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-900">
                      Đang chuyển từ bài viết ở Domain phụ sang bài viết ở Domain chính...
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-lg mx-auto">
                      Từ <span className="font-mono text-slate-800">{result.inputUrl}</span> chuyển sang{' '}
                      <span className="font-mono font-semibold text-blue-600">{result.finalUrl}</span>
                    </p>
                    {config.redirectDelaySeconds > 0 && (
                      <p className="mt-3 font-mono text-xs font-semibold text-amber-700 tabular-nums">
                        Tự động chuyển trang sau {countdown} giây...
                      </p>
                    )}
                  </div>
                )}

                {phase === 'redirected' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Đã chuyển hướng thành công sang bài viết trên Domain chính!
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-mono text-slate-600">
                          <span>Domain phụ: {result.inputUrl}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-emerald-700">
                            Domain chính: {result.finalUrl}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Article Preview with Thumbnail on Primary Domain */}
                    {matchedArticle && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 rounded-lg border border-slate-200 bg-slate-50 p-3.5 items-center">
                        <div className="sm:col-span-4 aspect-video rounded-md overflow-hidden bg-slate-200">
                          {!imgErr && matchedArticle.thumbnailUrl ? (
                            <img
                              src={matchedArticle.thumbnailUrl}
                              alt={matchedArticle.title}
                              referrerPolicy="no-referrer"
                              onError={() => setImgErr(true)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-white">
                              <ImageIcon className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="sm:col-span-8 space-y-1.5">
                          <div className="text-xs text-emerald-700 font-medium">
                            Đang hiển thị bài viết trên Domain chính ({primaryOrigin})
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            {matchedArticle.title}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {matchedArticle.excerpt}
                          </p>
                          <div className="pt-1">
                            <a
                              href={result.finalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                            >
                              <span>Mở URL đích trong tab trình duyệt mới</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {phase === 'bypassed' && (
                  <div className="py-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-slate-700 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Đã ở trên bài viết của Domain chính (Hoặc thuộc Whitelist)
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{result.reason}</p>
                        <p className="text-xs font-mono text-slate-500 mt-2">
                          URL hiện tại: {result.finalUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Execution Step Trace */}
              <div className="mt-5 border-t border-slate-100 pt-3">
                <div className="text-xs font-medium text-slate-500 mb-1.5">
                  Nhật ký xử lý chuyển hướng tự động:
                </div>
                <div className="space-y-1">
                  {result.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="flex items-start gap-2 text-xs text-slate-600"
                    >
                      <CornerDownRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-slate-900">
                          Bước {step.stepNumber} ({step.title}):
                        </span>{' '}
                        <span>{step.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Globe className="h-4 w-4 text-slate-400" />
            <span>
              Domain phụ <strong className="font-mono text-slate-900">{secondaryOrigin}</strong> ➔ Domain chính{' '}
              <strong className="font-mono text-blue-600">{primaryOrigin}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            Đóng trình mô phỏng
          </button>
        </div>
      </div>
    </div>
  );
};
