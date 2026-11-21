import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { RedirectConfig } from '../types/redirect';
import { evaluateUrlRedirect, normalizePrimaryOrigin } from '../utils/redirectEngine';

interface BatchSimulatorPanelProps {
  config: RedirectConfig;
  onOpenSandbox: (testUrl: string) => void;
}

export const BatchSimulatorPanel: React.FC<BatchSimulatorPanelProps> = ({
  config,
  onOpenSandbox,
}) => {
  const primaryOrigin = normalizePrimaryOrigin(
    config.primaryDomain,
    config.forceHttps,
    config.stripWww
  );

  const [singleTestUrl, setSingleTestUrl] = useState(
    `${primaryOrigin}/khuyen-mai/black-friday-2026?utm_source=zalo&utm_campaign=sale`
  );

  const [customTestUrls, setCustomTestUrls] = useState<string[]>([
    '/khuyen-mai/flash-sale-thang-11?utm_source=facebook',
    '/tin-tuc/bai-viet-seo-ve-tinh-2026',
    '/san-pham-cu/giay-the-thao-nam',
    '/duong-dan-phu-bat-ky/trang-con-123',
    '/admin/quan-ly-nguoi-dung',
    '/api/v1/webhook-payment',
    '/',
  ]);

  const [newTestInput, setNewTestInput] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'redirected' | 'bypassed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const singleResult = useMemo(
    () => evaluateUrlRedirect(singleTestUrl, config),
    [singleTestUrl, config]
  );

  const batchResults = useMemo(() => {
    const secondarySample = config.secondaryDomains[0]
      ? [`https://${config.secondaryDomains[0]}/landing-page-phu?ref=partner`]
      : [];
    const allInputs = [...secondarySample, ...customTestUrls];
    return allInputs.map((u) => evaluateUrlRedirect(u, config));
  }, [customTestUrls, config]);

  const filteredBatchResults = useMemo(() => {
    return batchResults.filter((item) => {
      if (filterMode === 'redirected' && !item.shouldRedirect) return false;
      if (filterMode === 'bypassed' && item.shouldRedirect) return false;
      if (
        searchQuery.trim() &&
        !item.inputUrl.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.finalUrl.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [batchResults, filterMode, searchQuery]);

  const handleAddTestUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTestInput.trim();
    if (!trimmed) return;
    if (!customTestUrls.includes(trimmed)) {
      setCustomTestUrls((prev) => [trimmed, ...prev]);
    }
    setNewTestInput('');
  };

  const handleRemoveTestUrl = (rawUrl: string) => {
    setCustomTestUrls((prev) => prev.filter((item) => !rawUrl.endsWith(item) && item !== rawUrl));
  };

  return (
    <div className="space-y-6">
      {/* Live Single URL Inspector */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Kiểm Tra Nhanh Đường Dẫn Phụ (Real-time URL Inspector)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập bất kỳ đường dẫn phụ hoặc URL tên miền vệ tinh nào để kiểm tra kết quả chuyển hướng tức thì.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenSandbox(singleResult.inputUrl)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Mở trong Trình duyệt giả lập</span>
          </button>
        </div>

        <div className="mt-4">
          <label htmlFor="single-url-input" className="block text-xs font-medium text-slate-700 mb-1.5">
            Địa chỉ URL hoặc đường dẫn phụ người dùng truy cập:
          </label>
          <input
            id="single-url-input"
            type="text"
            value={singleTestUrl}
            onChange={(e) => setSingleTestUrl(e.target.value)}
            placeholder="Ví dụ: https://domainchinh.vn/duong-dan-phu/123?utm_source=ads"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Immediate Diagnostic Output */}
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 gap-4 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5">
            <div className="text-xs text-slate-500">URL Đầu vào (Truy cập)</div>
            <div className="mt-1 font-mono text-xs text-slate-800 break-all">
              {singleResult.inputUrl || '—'}
            </div>
          </div>

          <div className="lg:col-span-2 flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600">
            <ArrowRight className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              {singleResult.shouldRedirect
                ? `HTTP ${singleResult.statusCode} Redirect`
                : 'Giữ nguyên (200)'}
            </span>
          </div>

          <div className="lg:col-span-5">
            <div className="text-xs text-slate-500">URL Đích sau khi xử lý</div>
            <div className="mt-1 font-mono text-xs font-semibold text-blue-600 break-all">
              {singleResult.finalUrl || '—'}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Kết luận: <strong className="text-slate-800 font-medium">{singleResult.reason}</strong>
          </span>
          <span className="font-mono tabular-nums">
            Thời gian phân giải: {singleResult.executionTimeMs}ms
          </span>
        </div>
      </div>

      {/* Batch Test Matrix Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Bảng Kiểm Thử Hàng Loạt Các Đường Dẫn Phụ ({batchResults.length} kịch bản)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đảm bảo toàn bộ đường dẫn phụ đều tự động trỏ về Domain chính trong khi các đường dẫn hệ thống (Whitelist) vẫn hoạt động bình thường.
              </p>
            </div>

            {/* Segmented Filter Control */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({batchResults.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('redirected')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  filterMode === 'redirected'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tự động chuyển hướng ({batchResults.filter((r) => r.shouldRedirect).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('bypassed')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  filterMode === 'bypassed'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giữ nguyên / Ngoại lệ ({batchResults.filter((r) => !r.shouldRedirect).length})
              </button>
            </div>
          </div>

          {/* Search and Add Test URL Row */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-5 relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm đường dẫn trong bảng..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <form onSubmit={handleAddTestUrl} className="md:col-span-7 flex gap-2">
              <input
                type="text"
                value={newTestInput}
                onChange={(e) => setNewTestInput(e.target.value)}
                placeholder="Thêm đường dẫn phụ cần test (VD: /su-kien/ra-mat-san-pham)..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm kịch bản</span>
              </button>
            </form>
          </div>
        </div>

        {/* High-Density Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-4">Đường dẫn truy cập (Input URL)</th>
                <th className="py-2.5 px-4">Trạng thái xử lý</th>
                <th className="py-2.5 px-4">URL Đích (Domain chính)</th>
                <th className="py-2.5 px-4 text-right">Mã HTTP</th>
                <th className="py-2.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredBatchResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                    Không có đường dẫn kiểm thử nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredBatchResults.map((row, idx) => (
                  <tr
                    key={`${row.inputUrl}-${idx}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-800 max-w-[280px] truncate" title={row.inputUrl}>
                      {row.inputUrl}
                    </td>
                    <td className="py-3 px-4">
                      {row.shouldRedirect ? (
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Chuyển về Domain chính</span>
                          {row.matchedRule && (
                            <>
                              <span aria-hidden="true" className="text-slate-400">·</span>
                              <span className="font-mono text-slate-500">{row.matchedRule.pattern}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                          <span>
                            {row.matchedRule ? `Ngoại lệ (${row.matchedRule.pattern})` : 'Đúng trang gốc'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-medium max-w-[280px] truncate" title={row.finalUrl}>
                      {row.finalUrl}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {row.statusCode}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenSandbox(row.inputUrl)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap shrink-0"
                        >
                          Mô phỏng
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTestUrl(row.inputUrl)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          aria-label="Xóa kịch bản"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
