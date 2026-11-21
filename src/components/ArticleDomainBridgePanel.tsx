import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Link2,
  Loader2,
  MousePointerClick,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { ArticleLinkPair, RedirectConfig } from '../types/redirect';
import {
  SAMPLE_THUMBNAILS,
  buildPairedArticleUrls,
  normalizePrimaryOrigin,
} from '../utils/redirectEngine';

interface ArticleDomainBridgePanelProps {
  config: RedirectConfig;
  onChange: (updated: RedirectConfig) => void;
  onSimulateArticleClick: (article: ArticleLinkPair) => void;
}

export const ArticleDomainBridgePanel: React.FC<ArticleDomainBridgePanelProps> = ({
  config,
  onChange,
  onSimulateArticleClick,
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

  // Active input mode: user can choose to paste into Primary Domain or Secondary Domain
  const [activeInputOption, setActiveInputOption] = useState<'secondary' | 'primary'>('secondary');

  const [primaryLinkInput, setPrimaryLinkInput] = useState(
    `${primaryOrigin}/cong-nghe/ra-mat-nen-tang-cloud-ai-2026.html`
  );
  const [secondaryLinkInput, setSecondaryLinkInput] = useState(
    `${secondaryOrigin}/cong-nghe/ra-mat-nen-tang-cloud-ai-2026.html`
  );

  const [articleTitle, setArticleTitle] = useState(
    'Ra mắt Nền tảng Cloud AI 2026: Tối ưu Tốc độ Chuyển hướng Đa Tên Miền'
  );
  const [articleExcerpt, setArticleExcerpt] = useState(
    'Khi người đọc truy cập hoặc click vào bài viết trên domain phụ, hệ thống tự động hiển thị ảnh đại diện chuẩn SEO và chuyển thẳng sang bài viết gốc trên domain chính.'
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(SAMPLE_THUMBNAILS[0]);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [fetchStatusMsg, setFetchStatusMsg] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [htmlModalArticle, setHtmlModalArticle] = useState<ArticleLinkPair | null>(null);

  // Keep sample links synced when user edits Primary Domain or Secondary Domain inputs
  const handlePrimaryDomainChange = (newDomain: string) => {
    const newCleanPrimary = normalizePrimaryOrigin(newDomain, config.forceHttps, config.stripWww);
    const paired = buildPairedArticleUrls(secondaryLinkInput, newCleanPrimary, secondaryOrigin);

    const updatedArticles = (config.articles || []).map((art) => ({
      ...art,
      primaryArticleUrl: `${newCleanPrimary}${art.articlePath}`,
    }));

    setPrimaryLinkInput(paired.primaryArticleUrl);
    onChange({
      ...config,
      primaryDomain: newDomain,
      articles: updatedArticles,
    });
  };

  const handleSecondaryDomainChange = (newDomain: string) => {
    const newCleanSecondary = normalizePrimaryOrigin(newDomain, config.forceHttps, config.stripWww);
    const paired = buildPairedArticleUrls(primaryLinkInput, primaryOrigin, newCleanSecondary);

    const hostOnly = newCleanSecondary.replace(/^https?:\/\//i, '');
    const nextSecondaryList = config.secondaryDomains.includes(hostOnly)
      ? config.secondaryDomains
      : [hostOnly, ...config.secondaryDomains];

    const updatedArticles = (config.articles || []).map((art) => ({
      ...art,
      secondaryArticleUrl: `${newCleanSecondary}${art.articlePath}`,
    }));

    setSecondaryLinkInput(paired.secondaryArticleUrl);
    onChange({
      ...config,
      activeSecondaryDomain: newDomain,
      secondaryDomains: nextSecondaryList,
      articles: updatedArticles,
    });
  };

  // Sync Primary Link -> Secondary Link automatically
  const handlePrimaryArticleLinkChange = (value: string) => {
    setPrimaryLinkInput(value);
    const paired = buildPairedArticleUrls(value, primaryOrigin, secondaryOrigin);
    setSecondaryLinkInput(paired.secondaryArticleUrl);
  };

  // Sync Secondary Link -> Primary Link automatically
  const handleSecondaryArticleLinkChange = (value: string) => {
    setSecondaryLinkInput(value);
    const paired = buildPairedArticleUrls(value, primaryOrigin, secondaryOrigin);
    setPrimaryLinkInput(paired.primaryArticleUrl);
  };

  // Fetch real og:image, og:title, og:description from the entered URL
  const handleFetchArticleMetadata = async (urlToFetch?: string) => {
    const targetUrl =
      urlToFetch ||
      (activeInputOption === 'primary' ? primaryLinkInput : secondaryLinkInput);
    if (!targetUrl.trim()) return;

    setIsFetchingMeta(true);
    setFetchStatusMsg('Đang trích xuất ảnh đại diện (og:image) và tiêu đề bài viết...');

    try {
      const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(targetUrl.trim())}`);
      const data = await res.json();

      if (res.ok && data) {
        if (data.title) {
          setArticleTitle(data.title);
        }
        if (data.description) {
          setArticleExcerpt(data.description);
        }
        if (data.image) {
          setThumbnailUrl(data.image);
          setImageLoadError(false);
          setFetchStatusMsg('Đã lấy thành công ảnh đại diện và tiêu đề từ link bài viết!');
        } else {
          // Pick a clean default high-res thumbnail if the target page doesn't have og:image
          const randomThumb =
            SAMPLE_THUMBNAILS[Math.floor(Math.random() * SAMPLE_THUMBNAILS.length)];
          setThumbnailUrl(randomThumb);
          setImageLoadError(false);
          setFetchStatusMsg(
            'Đã đồng bộ đường dẫn bài viết (Sử dụng ảnh đại diện mặc định do link đích không khai báo thẻ og:image).'
          );
        }

        // Also sync path across both domains
        if (data.pathname) {
          setPrimaryLinkInput(`${primaryOrigin}${data.pathname}`);
          setSecondaryLinkInput(`${secondaryOrigin}${data.pathname}`);
        }
      } else {
        setFetchStatusMsg('Đã đồng bộ đường dẫn sang cả 2 domain.');
      }
    } catch {
      setFetchStatusMsg('Đã đồng bộ đường dẫn bài viết giữa Domain phụ và Domain chính.');
    } finally {
      setIsFetchingMeta(false);
    }
  };

  // Allow local image upload as base64 data URL so users can also pick any thumbnail from their device
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setThumbnailUrl(reader.result);
        setImageLoadError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    setImageLoadError(false);
  }, [thumbnailUrl]);

  // Add the paired article to the list
  const handleSaveArticlePair = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceUrl = activeInputOption === 'secondary' ? secondaryLinkInput : primaryLinkInput;
    const paired = buildPairedArticleUrls(sourceUrl, primaryOrigin, secondaryOrigin);

    const newArticle: ArticleLinkPair = {
      id: `art-${Date.now()}`,
      title: articleTitle.trim() || `Bài viết tại ${paired.articlePath}`,
      excerpt:
        articleExcerpt.trim() ||
        `Click vào bài viết trên ${secondaryOrigin} sẽ tự động chuyển hướng sang ${paired.primaryArticleUrl}.`,
      thumbnailUrl: thumbnailUrl.trim() || SAMPLE_THUMBNAILS[0],
      articlePath: paired.articlePath,
      primaryArticleUrl: paired.primaryArticleUrl,
      secondaryArticleUrl: paired.secondaryArticleUrl,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      clicksCount: 0,
    };

    onChange({
      ...config,
      articles: [newArticle, ...(config.articles || [])],
    });

    setFetchStatusMsg('Đã lưu bài viết vào danh sách chuyển hướng tự động!');
  };

  const handleDeleteArticle = (id: string) => {
    onChange({
      ...config,
      articles: (config.articles || []).filter((a) => a.id !== id),
    });
  };

  const handleCopyLink = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateArticleRedirectHtml = (art: ArticleLinkPair) => {
    return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${art.title}</title>
  <!-- Thẻ OpenGraph hiển thị Ảnh đại diện của bài viết khi đăng link Domain Phụ -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${art.title.replace(/"/g, '&quot;')}" />
  <meta property="og:description" content="${art.excerpt.replace(/"/g, '&quot;')}" />
  <meta property="og:image" content="${art.thumbnailUrl}" />
  <meta property="og:url" content="${art.secondaryArticleUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${art.thumbnailUrl}" />
  <link rel="canonical" href="${art.primaryArticleUrl}" />
  <!-- Tự động chuyển hướng sang bài viết tương ứng trên Domain Chính khi người dùng click vào -->
  <meta http-equiv="refresh" content="0;url=${art.primaryArticleUrl}" />
  <script>
    window.location.replace(${JSON.stringify(art.primaryArticleUrl)});
  </script>
</head>
<body>
  <p>Đang chuyển hướng tới bài viết chính thức: <a href="${art.primaryArticleUrl}">${art.title}</a>...</p>
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      {/* Main Card: 2 Domain Choices + Article Link Input with Live Thumbnail Preview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="border-b border-slate-200 pb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Đồng Bộ Bài Viết Giữa 2 Lựa Chọn: Domain Phụ ➔ Domain Chính (Kèm Ảnh Đại Diện)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập bài viết vào Domain phụ hoặc Domain chính để hiển thị ảnh đại diện của bài đó; khi người đọc click vào bài ở Domain phụ sẽ tự động chuyển qua đúng bài đó trên Domain chính.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500">
            {(config.articles || []).length} bài viết đã đồng bộ
          </div>
        </div>

        {/* Step 1: 2 Explicit Domain Choices (Domain Chính & Domain Phụ) */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Choice 1: Domain Chính */}
          <div
            onClick={() => setActiveInputOption('primary')}
            className={`cursor-pointer rounded-xl border p-4 transition-colors ${
              activeInputOption === 'primary'
                ? 'border-blue-600 bg-blue-50/30'
                : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-900">
                  Lựa chọn 1: Domain Chính (Nhận chuyển hướng)
                </span>
              </div>
              <span className="text-xs text-blue-700 font-medium">
                {activeInputOption === 'primary' ? 'Đang chọn nhập từ Domain chính' : 'Chọn'}
              </span>
            </div>
            <input
              type="text"
              value={config.primaryDomain}
              onChange={(e) => handlePrimaryDomainChange(e.target.value)}
              placeholder="https://domainchinh.vn"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Nơi chứa nội dung bài viết gốc. Khách sẽ được đưa về đây sau khi click.
            </p>
          </div>

          {/* Choice 2: Domain Phụ */}
          <div
            onClick={() => setActiveInputOption('secondary')}
            className={`cursor-pointer rounded-xl border p-4 transition-colors ${
              activeInputOption === 'secondary'
                ? 'border-blue-600 bg-blue-50/30'
                : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-900">
                  Lựa chọn 2: Domain Phụ (Nơi đăng link vệ tinh / chia sẻ)
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-medium">
                {activeInputOption === 'secondary' ? 'Đang chọn nhập vào Domain phụ' : 'Chọn'}
              </span>
            </div>
            <input
              type="text"
              value={config.activeSecondaryDomain || 'https://domainphu.com'}
              onChange={(e) => handleSecondaryDomainChange(e.target.value)}
              placeholder="https://domainphu.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Khi người dùng click vào bài viết trên domain phụ này sẽ tự động nhảy sang bài đó ở Domain chính.
            </p>
          </div>
        </div>

        {/* Step 2: Enter Article Links & Preview Thumbnail Side-by-Side */}
        <form onSubmit={handleSaveArticlePair} className="mt-6 border-t border-slate-200 pt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Left 7 Columns: Article URLs + Metadata Form */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Nhập Link Bài Viết (Tự động đồng bộ 2 chiều & Lấy Ảnh Đại Diện)
                </h3>
                <button
                  type="button"
                  onClick={() => handleFetchArticleMetadata()}
                  disabled={isFetchingMeta}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {isFetchingMeta ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  )}
                  <span>Tự động lấy Ảnh đại diện & Tiêu đề từ Link</span>
                </button>
              </div>

              {/* Input 1: Secondary Domain Article URL */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Link bài viết trên <strong>Domain Phụ</strong> (Người dùng click vào link này):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={secondaryLinkInput}
                    onFocus={() => setActiveInputOption('secondary')}
                    onChange={(e) => handleSecondaryArticleLinkChange(e.target.value)}
                    placeholder="https://domainphu.com/tin-tuc/bai-viet-a.html"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchArticleMetadata(secondaryLinkInput)}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    Lấy ảnh từ link này
                  </button>
                </div>
              </div>

              {/* Input 2: Primary Domain Article URL */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Link bài viết tương ứng trên <strong>Domain Chính</strong> (Đích chuyển hướng tới):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={primaryLinkInput}
                    onFocus={() => setActiveInputOption('primary')}
                    onChange={(e) => handlePrimaryArticleLinkChange(e.target.value)}
                    placeholder="https://domainchinh.vn/tin-tuc/bai-viet-a.html"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchArticleMetadata(primaryLinkInput)}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    Lấy ảnh từ link gốc
                  </button>
                </div>
              </div>

              {/* Title & Thumbnail URL Inputs */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tiêu đề bài viết hiển thị:
                  </label>
                  <input
                    type="text"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài viết..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    URL Ảnh đại diện bài viết (og:image):
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="Dán link ảnh đại diện (.jpg, .png, .webp)..."
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <label className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shrink-0" title="Tải ảnh đại diện từ máy tính">
                      <Upload className="h-3.5 w-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLocalImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mô tả ngắn của bài viết:
                </label>
                <input
                  type="text"
                  value={articleExcerpt}
                  onChange={(e) => setArticleExcerpt(e.target.value)}
                  placeholder="Tóm tắt nội dung bài viết..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {fetchStatusMsg && (
                <p className="text-xs text-blue-700 font-medium">{fetchStatusMsg}</p>
              )}

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Lưu Bài Viết Vào Hệ Thống Chuyển Hướng</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Ảnh đại diện mẫu nhanh:</span>
                  {SAMPLE_THUMBNAILS.map((thumb, i) => (
                    <button
                      key={thumb}
                      type="button"
                      onClick={() => {
                        setThumbnailUrl(thumb);
                        setImageLoadError(false);
                      }}
                      className={`rounded border px-2 py-1 text-xs font-mono transition-colors ${
                        thumbnailUrl === thumb
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Ảnh #{i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Live Visual Preview of Both Domain Phụ & Domain Chính Article Cards with Thumbnail */}
            <div className="lg:col-span-5 lg:border-l lg:border-slate-200 lg:pl-6 space-y-3">
              <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>Xem trước hiển thị Ảnh đại diện & Chuyển hướng</span>
                <span className="font-mono text-emerald-700">Live Preview</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                {/* Thumbnail Preview Slot with Mandatory Zero-Broken-Image Fallback */}
                <div className="relative aspect-video w-full bg-slate-200 overflow-hidden">
                  {!imageLoadError && thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={articleTitle || 'Ảnh đại diện bài viết'}
                      referrerPolicy="no-referrer"
                      onError={() => setImageLoadError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-center text-white">
                      <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-xs font-medium line-clamp-2 max-w-xs">
                        {articleTitle || 'Ảnh đại diện bài viết'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                    <div className="text-xs font-mono text-slate-200 truncate">
                      Domain phụ: {secondaryLinkInput}
                    </div>
                  </div>
                </div>

                {/* Article Details & Redirect Mapping Preview */}
                <div className="p-4 space-y-3 bg-white">
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {articleTitle || 'Tiêu đề bài viết'}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {articleExcerpt}
                  </p>

                  <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between gap-2 text-slate-600">
                      <span className="truncate" title={secondaryLinkInput}>
                        1. Khách click ở Domain phụ: {secondaryLinkInput}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate" title={primaryLinkInput}>
                        2. Tự chuyển qua Domain chính: {primaryLinkInput}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Section: Synced Articles Grid (Click on Secondary Domain Article -> Automatically Redirects to Main Domain Article) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Danh Sách Bài Viết Trên Domain Phụ (Click Vào Bài Để Chuyển Sang Domain Chính)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mỗi bài viết đều hiển thị đầy đủ ảnh đại diện trên cả Domain phụ và Domain chính. Hãy thử click vào bất kỳ bài nào bên dưới để kiểm tra chuyển hướng tự động.
            </p>
          </div>
        </div>

        {(config.articles || []).length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-600">
              Chưa có bài viết nào được thêm. Hãy nhập link bài viết ở biểu mẫu phía trên.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
            {(config.articles || []).map((art) => (
              <ArticleCardItem
                key={art.id}
                article={art}
                copiedId={copiedId}
                onCopyLink={handleCopyLink}
                onDelete={() => handleDeleteArticle(art.id)}
                onSimulateClick={() => onSimulateArticleClick(art)}
                onShowHtmlModal={() => setHtmlModalArticle(art)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal for Per-Article Social Share + Auto-Redirect HTML */}
      {htmlModalArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Mã HTML Bài Viết Trên Domain Phụ (Có Ảnh Đại Diện + Tự Chuyển Về Domain Chính)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Giúp hiển thị đúng Ảnh đại diện khi chia sẻ link Domain phụ lên Facebook/Zalo và tự động chuyển người đọc sang bài đó trên Domain chính.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHtmlModalArticle(null)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Đóng
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  Bài viết: <strong className="text-slate-900">{htmlModalArticle.title}</strong>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyLink(
                      generateArticleRedirectHtml(htmlModalArticle),
                      `html-${htmlModalArticle.id}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedId === `html-${htmlModalArticle.id}` ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Đã sao chép mã HTML</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Sao chép mã HTML bài viết</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                <pre className="p-4 text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed max-h-[320px]">
                  <code>{generateArticleRedirectHtml(htmlModalArticle)}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ArticleCardItemProps {
  article: ArticleLinkPair;
  copiedId: string | null;
  onCopyLink: (text: string, id: string) => void;
  onDelete: () => void;
  onSimulateClick: () => void;
  onShowHtmlModal: () => void;
}

const ArticleCardItem: React.FC<ArticleCardItemProps> = ({
  article,
  copiedId,
  onCopyLink,
  onDelete,
  onSimulateClick,
  onShowHtmlModal,
}) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-slate-300 transition-colors">
      <div>
        {/* Clickable Thumbnail that triggers the Domain Phụ -> Domain Chính Redirect */}
        <div
          onClick={onSimulateClick}
          className="group relative aspect-video w-full cursor-pointer bg-slate-100 overflow-hidden"
          title="Click vào bài viết trên Domain phụ để tự động chuyển sang Domain chính"
        >
          {!imgErr && article.thumbnailUrl ? (
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              referrerPolicy="no-referrer"
              onError={() => setImgErr(true)}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-center text-white">
              <ImageIcon className="h-7 w-7 text-slate-400 mb-1.5" />
              <span className="text-xs font-medium line-clamp-2">{article.title}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white flex items-center justify-between text-xs">
            <span className="font-medium flex items-center gap-1">
              <MousePointerClick className="h-3.5 w-3.5" />
              Click bài ở Domain phụ
            </span>
            <span className="font-mono tabular-nums text-slate-200">
              {article.clicksCount.toLocaleString('vi-VN')} lượt chuyển
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ngày tạo: {article.createdAt}</span>
            <span>·</span>
            <span className="font-mono text-emerald-700">HTTP 301</span>
          </div>

          <h4
            onClick={onSimulateClick}
            className="cursor-pointer text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2"
          >
            {article.title}
          </h4>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>

          {/* Both Links: Domain Phụ & Domain Chính */}
          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-0.5">
                <span>Link bài trên Domain phụ:</span>
                <button
                  type="button"
                  onClick={() => onCopyLink(article.secondaryArticleUrl, `sec-${article.id}`)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {copiedId === `sec-${article.id}` ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
              <div
                onClick={onSimulateClick}
                className="cursor-pointer truncate font-mono text-slate-800 hover:text-blue-600"
                title={article.secondaryArticleUrl}
              >
                {article.secondaryArticleUrl}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-500 mb-0.5">
                <span>Đích chuyển tới ở Domain chính:</span>
                <button
                  type="button"
                  onClick={() => onCopyLink(article.primaryArticleUrl, `pri-${article.id}`)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {copiedId === `pri-${article.id}` ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
              <div
                className="truncate font-mono font-medium text-blue-600"
                title={article.primaryArticleUrl}
              >
                {article.primaryArticleUrl}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSimulateClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Click thử (Chuyển qua Domain chính)</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onShowHtmlModal}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
            title="Lấy mã HTML có thẻ ảnh đại diện og:image cho bài này"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Mã HTML</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
            aria-label="Xóa bài viết"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
