import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  HttpStatusCode,
  QueryParamPolicy,
  RedirectConfig,
  RuleActionType,
  SubpathRule,
  SubpathStrategy,
} from '../types/redirect';
import { DEFAULT_REDIRECT_CONFIG, normalizePrimaryOrigin } from '../utils/redirectEngine';

interface RuleBuilderPanelProps {
  config: RedirectConfig;
  onChange: (updated: RedirectConfig) => void;
}

export const RuleBuilderPanel: React.FC<RuleBuilderPanelProps> = ({ config, onChange }) => {
  const [newSecondaryDomain, setNewSecondaryDomain] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newAction, setNewAction] = useState<RuleActionType>('redirect_to_root');
  const [newTargetPath, setNewTargetPath] = useState('/');
  const [newDescription, setNewDescription] = useState('');

  const primaryOrigin = normalizePrimaryOrigin(
    config.primaryDomain,
    config.forceHttps,
    config.stripWww
  );

  const handleAddSecondaryDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newSecondaryDomain
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '');
    if (!cleaned) return;
    if (!config.secondaryDomains.includes(cleaned)) {
      onChange({
        ...config,
        secondaryDomains: [...config.secondaryDomains, cleaned],
      });
    }
    setNewSecondaryDomain('');
  };

  const handleRemoveSecondaryDomain = (domain: string) => {
    onChange({
      ...config,
      secondaryDomains: config.secondaryDomains.filter((d) => d !== domain),
    });
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    let pattern = newPattern.trim();
    if (!pattern) return;
    if (!pattern.startsWith('/')) {
      pattern = `/${pattern}`;
    }

    const created: SubpathRule = {
      id: `rule-${Date.now()}`,
      pattern,
      action: newAction,
      targetPath:
        newAction === 'redirect_to_root'
          ? '/'
          : newAction === 'whitelist_bypass'
          ? pattern.replace(/\/?\*$/, '')
          : newTargetPath.startsWith('/')
          ? newTargetPath
          : `/${newTargetPath}`,
      description:
        newDescription.trim() ||
        (newAction === 'whitelist_bypass'
          ? `Giữ nguyên đường dẫn ${pattern} không chuyển hướng`
          : newAction === 'redirect_to_root'
          ? `Tự động chuyển ${pattern} về trang chủ domain chính`
          : `Chuyển ${pattern} sang ${newTargetPath}`),
      enabled: true,
      hitCount: 0,
    };

    onChange({
      ...config,
      rules: [created, ...config.rules],
    });

    setNewPattern('');
    setNewDescription('');
    setNewTargetPath('/');
  };

  const handleToggleRule = (id: string) => {
    onChange({
      ...config,
      rules: config.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    });
  };

  const handleDeleteRule = (id: string) => {
    onChange({
      ...config,
      rules: config.rules.filter((r) => r.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Primary Domain & Sub-path Strategy */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              01. Thiết Lập Domain Chính & Chế Độ Đường Dẫn Phụ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Xác định tên miền chính thức nhận lưu lượng truy cập và cách tiện ích xử lý khi người dùng vào các đường dẫn phụ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_REDIRECT_CONFIG)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors self-start whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Khôi phục mặc định</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Primary Canonical Domain Input */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label
                htmlFor="primary-domain-input"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Domain Chính (Canonical Target Domain)
              </label>
              <input
                id="primary-domain-input"
                type="text"
                value={config.primaryDomain}
                onChange={(e) => onChange({ ...config, primaryDomain: e.target.value })}
                placeholder="https://domainchinh.vn"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Origin chuẩn hóa:{' '}
                <strong className="font-mono text-slate-900">{primaryOrigin}</strong>
              </p>
            </div>

            {/* Checkboxes for HTTPS, WWW, and Loop Guard */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.forceHttps}
                  onChange={(e) => onChange({ ...config, forceHttps: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span>Bắt buộc nâng cấp lên giao thức bảo mật HTTPS</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.stripWww}
                  onChange={(e) => onChange({ ...config, stripWww: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span>Tự động loại bỏ tiền tố www. (www.domain.vn → domain.vn)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.preventInfiniteLoop}
                  onChange={(e) =>
                    onChange({ ...config, preventInfiniteLoop: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span>Kích hoạt bộ bảo vệ chống lặp chuyển hướng vô hạn (Infinite Loop Guard)</span>
              </label>
            </div>
          </div>

          {/* Secondary / Satellite Domains */}
          <div className="lg:col-span-6 space-y-3">
            <label className="block text-xs font-semibold text-slate-800">
              Danh sách Tên miền phụ / Tên miền vệ tinh (Tự động trỏ về Domain chính)
            </label>
            <form onSubmit={handleAddSecondaryDomain} className="flex gap-2">
              <input
                type="text"
                value={newSecondaryDomain}
                onChange={(e) => setNewSecondaryDomain(e.target.value)}
                placeholder="Thêm tên miền phụ (VD: sub.domain.vn, landing-cu.com)..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Domain</span>
              </button>
            </form>

            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50">
              {config.secondaryDomains.length === 0 ? (
                <div className="p-3 text-xs text-slate-500">
                  Chưa có tên miền vệ tinh nào. Tiện ích sẽ chỉ xử lý các đường dẫn phụ trên tên miền chính.
                </div>
              ) : (
                config.secondaryDomains.map((dom) => (
                  <div
                    key={dom}
                    className="flex items-center justify-between px-3.5 py-2 text-xs"
                  >
                    <div className="font-mono text-slate-800">
                      {dom} <span className="text-slate-400">→</span>{' '}
                      <span className="text-blue-600">{primaryOrigin}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryDomain(dom)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      aria-label={`Xóa ${dom}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sub-path Handling Strategy Selection */}
        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="text-xs font-semibold text-slate-800 mb-3">
            Chế độ xử lý khi người dùng truy cập đường dẫn phụ (VD: /bai-viet, /khuyen-mai/123):
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              {
                id: 'strip_to_root' as SubpathStrategy,
                title: 'Đưa mọi đường dẫn phụ về gốc Domain chính',
                desc: 'Mọi truy cập vào /a, /b/c đều tự động chuyển thẳng về trang chủ https://domainchinh.vn/ (Trừ mục nằm trong Whitelist).',
              },
              {
                id: 'rule_mapping' as SubpathStrategy,
                title: 'Ánh xạ theo quy tắc + Fallback về gốc',
                desc: 'Ưu tiên chuyển theo danh sách ánh xạ đường dẫn bên dưới; các đường dẫn phụ lạ sẽ tự động đưa về trang chủ Domain chính.',
              },
              {
                id: 'preserve_path' as SubpathStrategy,
                title: 'Đổi sang Domain chính nhưng giữ đường dẫn',
                desc: 'Chuyển từ domainphu.com/san-pham sang domainchinh.vn/san-pham (Hữu ích khi vừa đổi tên miền thương hiệu).',
              },
            ].map((option) => {
              const selected = config.subpathStrategy === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ ...config, subpathStrategy: option.id })}
                  className={`text-left rounded-lg border p-4 transition-colors ${
                    selected
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {option.title}
                    </span>
                    {selected && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {option.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Query Parameters, Status Code & Redirect Delay */}
        <div className="mt-6 border-t border-slate-200 pt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="query-policy-select"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              Xử lý tham số Query / UTM (?utm_source=...)
            </label>
            <select
              id="query-policy-select"
              value={config.queryParamPolicy}
              onChange={(e) =>
                onChange({
                  ...config,
                  queryParamPolicy: e.target.value as QueryParamPolicy,
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="preserve">Giữ nguyên toàn bộ tham số (?utm=..., ?id=...)</option>
              <option value="utm_only">Chỉ giữ tham số Marketing (utm_*, fbclid, gclid)</option>
              <option value="strip">Xóa sạch mọi tham số (URL gốc sạch tuyệt đối)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="http-code-select"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              Mã trạng thái HTTP (Server & SEO)
            </label>
            <select
              id="http-code-select"
              value={config.httpStatusCode}
              onChange={(e) =>
                onChange({
                  ...config,
                  httpStatusCode: Number(e.target.value) as HttpStatusCode,
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value={301}>301 Moved Permanently (Chuẩn SEO vĩnh viễn)</option>
              <option value={302}>302 Found (Chuyển hướng tạm thời)</option>
              <option value={307}>307 Temporary Redirect (Giữ phương thức HTTP)</option>
              <option value={308}>308 Permanent Redirect (Vĩnh viễn nghiêm ngặt)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="delay-select"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              Độ trễ chuyển hướng trên Trình duyệt
            </label>
            <select
              id="delay-select"
              value={config.redirectDelaySeconds}
              onChange={(e) =>
                onChange({
                  ...config,
                  redirectDelaySeconds: Number(e.target.value),
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value={0}>0 giây — Chuyển hướng tức thì (Khuyên dùng)</option>
              <option value={1}>1 giây — Chờ 1s trước khi chuyển</option>
              <option value={3}>3 giây — Đếm ngược thông báo 3s</option>
              <option value={5}>5 giây — Đếm ngược thông báo 5s</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Custom Sub-path Rules & Whitelist Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                02. Quy Tắc Đường Dẫn Phụ & Danh Sách Ngoại Lệ (Whitelist)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Định nghĩa các đường dẫn phụ cần chuyển hướng đặc biệt hoặc các đường dẫn quản trị (/admin, /api) cần giữ nguyên.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              Đang bật {config.rules.filter((r) => r.enabled).length}/{config.rules.length} quy tắc
            </span>
          </div>

          {/* Add New Rule Form */}
          <form
            onSubmit={handleAddRule}
            className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:grid-cols-12"
          >
            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mẫu đường dẫn phụ (Pattern)
              </label>
              <input
                type="text"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                placeholder="VD: /su-kien/* hoặc /login"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hành động xử lý
              </label>
              <select
                value={newAction}
                onChange={(e) => setNewAction(e.target.value as RuleActionType)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="redirect_to_root">Chuyển về gốc Domain chính (/)</option>
                <option value="redirect_custom">Chuyển tới đường dẫn mới trên Domain chính</option>
                <option value="whitelist_bypass">Ngoại lệ Whitelist (Giữ nguyên không chuyển)</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Đích trên Domain chính
              </label>
              <input
                type="text"
                value={newAction === 'redirect_to_root' ? '/' : newAction === 'whitelist_bypass' ? 'Giữ nguyên' : newTargetPath}
                disabled={newAction !== 'redirect_custom'}
                onChange={(e) => setNewTargetPath(e.target.value)}
                placeholder="/danh-muc-moi"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ghi chú quy tắc
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Chiến dịch Tết 2026..."
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="lg:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 h-[32px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm quy tắc</span>
              </button>
            </div>
          </form>
        </div>

        {/* Rules Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-4">Trạng thái</th>
                <th className="py-2.5 px-4">Đường dẫn phụ (Pattern)</th>
                <th className="py-2.5 px-4">Loại quy tắc & Đích chuyển hướng</th>
                <th className="py-2.5 px-4">Mô tả</th>
                <th className="py-2.5 px-4 text-right">Lượt khớp</th>
                <th className="py-2.5 px-4 text-right">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {config.rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                    Chưa có quy tắc tùy chỉnh nào. Tất cả đường dẫn phụ sẽ tuân theo chế độ mặc định ở mục 01.
                  </td>
                </tr>
              ) : (
                config.rules.map((rule) => (
                  <tr
                    key={rule.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !rule.enabled ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                        aria-label={`Bật/tắt quy tắc ${rule.pattern}`}
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {rule.pattern}
                    </td>
                    <td className="py-3 px-4">
                      {rule.action === 'whitelist_bypass' ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                          <span>Ngoại lệ Whitelist · Giữ nguyên đường dẫn</span>
                        </span>
                      ) : rule.action === 'redirect_to_root' ? (
                        <span className="font-mono text-blue-600">
                          Chuyển về gốc → {primaryOrigin}/
                        </span>
                      ) : (
                        <span className="font-mono text-emerald-700">
                          Ánh xạ → {primaryOrigin}
                          {rule.targetPath}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rule.description}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {rule.hitCount.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        aria-label={`Xóa quy tắc ${rule.pattern}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
