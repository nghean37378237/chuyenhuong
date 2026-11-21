import {
  ArticleLinkPair,
  RedirectConfig,
  SimulationResult,
  SimulationStep,
  SubpathRule,
} from '../types/redirect';

export const SAMPLE_THUMBNAILS = [
  '/src/assets/images/article_tech_ai_2026_1794371743375.jpg',
  '/src/assets/images/article_ecommerce_sale_1794371746036.jpg',
  '/src/assets/images/article_realestate_architecture_1794371746897.jpg',
];

export const DEFAULT_REDIRECT_CONFIG: RedirectConfig = {
  primaryDomain: 'https://domainchinh.vn',
  activeSecondaryDomain: 'https://domainphu.com',
  secondaryDomains: ['domainphu.com', 'tinnhanh.domainphu.com', 'khuyenmai-2026.vn'],
  subpathStrategy: 'preserve_path',
  queryParamPolicy: 'preserve',
  preserveHash: false,
  httpStatusCode: 301,
  redirectDelaySeconds: 0,
  forceHttps: true,
  stripWww: true,
  preventInfiniteLoop: true,
  articles: [
    {
      id: 'art-1',
      title: 'Xu hướng Hạ tầng AI & Điện toán Đám mây cho Doanh nghiệp Việt năm 2026',
      excerpt:
        'Phân tích chi tiết giải pháp tối ưu hóa máy chủ, đồng bộ dữ liệu đa tên miền và tăng tốc độ tải trang cho hệ thống báo chí điện tử.',
      thumbnailUrl: '/src/assets/images/article_tech_ai_2026_1794371743375.jpg',
      articlePath: '/cong-nghe/xu-huong-ha-tang-ai-doanh-nghiep-2026.html',
      primaryArticleUrl:
        'https://domainchinh.vn/cong-nghe/xu-huong-ha-tang-ai-doanh-nghiep-2026.html',
      secondaryArticleUrl:
        'https://domainphu.com/cong-nghe/xu-huong-ha-tang-ai-doanh-nghiep-2026.html',
      createdAt: '10/11/2026',
      clicksCount: 1284,
    },
    {
      id: 'art-2',
      title: 'Bộ sưu tập Thiết bị Âm thanh & Đồng hồ Thông minh Thế hệ mới',
      excerpt:
        'Đánh giá chi tiết thiết kế tối giản, thời lượng pin vượt trội và chương trình ưu đãi độc quyền khi đặt trước trên hệ thống chính thức.',
      thumbnailUrl: '/src/assets/images/article_ecommerce_sale_1794371746036.jpg',
      articlePath: '/review/bo-suu-tap-thiet-bi-am-thanh-dong-ho-2026.html',
      primaryArticleUrl:
        'https://domainchinh.vn/review/bo-suu-tap-thiet-bi-am-thanh-dong-ho-2026.html',
      secondaryArticleUrl:
        'https://domainphu.com/review/bo-suu-tap-thiet-bi-am-thanh-dong-ho-2026.html',
      createdAt: '09/11/2026',
      clicksCount: 946,
    },
    {
      id: 'art-3',
      title: 'Kiến trúc Biệt thự Nhiệt đới Hiện đại: Không gian Xanh giữa Lòng Đô thị',
      excerpt:
        'Khám phá xu hướng thiết kế kết hợp mặt nước tự nhiên, hệ vườn đứng và ánh sáng tự nhiên giúp tối ưu trải nghiệm sống nghỉ dưỡng.',
      thumbnailUrl: '/src/assets/images/article_realestate_architecture_1794371746897.jpg',
      articlePath: '/kien-truc/biet-thu-nhiet-doi-hien-dai-khong-gian-xanh.html',
      primaryArticleUrl:
        'https://domainchinh.vn/kien-truc/biet-thu-nhiet-doi-hien-dai-khong-gian-xanh.html',
      secondaryArticleUrl:
        'https://domainphu.com/kien-truc/biet-thu-nhiet-doi-hien-dai-khong-gian-xanh.html',
      createdAt: '08/11/2026',
      clicksCount: 2150,
    },
  ],
  rules: [
    {
      id: 'rule-1',
      pattern: '/admin/*',
      action: 'whitelist_bypass',
      targetPath: '/admin',
      description: 'Giữ nguyên trang quản trị hệ thống (Không chuyển hướng)',
      enabled: true,
      hitCount: 142,
    },
    {
      id: 'rule-2',
      pattern: '/api/*',
      action: 'whitelist_bypass',
      targetPath: '/api',
      description: 'Giữ nguyên các điểm cuối API và Webhook',
      enabled: true,
      hitCount: 890,
    },
    {
      id: 'rule-3',
      pattern: '/khuyen-mai/*',
      action: 'redirect_to_root',
      targetPath: '/',
      description: 'Tự động đưa mọi đường dẫn chiến dịch cũ về trang chủ domain chính',
      enabled: true,
      hitCount: 1540,
    },
    {
      id: 'rule-4',
      pattern: '/san-pham-cu/*',
      action: 'redirect_custom',
      targetPath: '/danh-muc-moi',
      description: 'Chuyển hướng đường dẫn sản phẩm cũ sang danh mục mới trên domain chính',
      enabled: true,
      hitCount: 628,
    },
  ],
};

/**
 * Normalize a domain string to a clean origin (e.g., https://domainchinh.vn)
 */
export function normalizePrimaryOrigin(
  rawDomain: string,
  forceHttps = true,
  stripWww = true
): string {
  let cleaned = (rawDomain || '').trim();
  if (!cleaned) return 'https://domainchinh.vn';
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = (forceHttps ? 'https://' : 'http://') + cleaned;
  }
  try {
    const url = new URL(cleaned);
    if (forceHttps) {
      url.protocol = 'https:';
    }
    if (stripWww && url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
    }
    return url.origin;
  } catch {
    return 'https://domainchinh.vn';
  }
}

/**
 * Build paired URLs for an article given either a Primary Article URL, Secondary Article URL, or Path
 */
export function buildPairedArticleUrls(
  rawInputUrl: string,
  primaryDomainOrigin: string,
  secondaryDomainOrigin: string
): {
  articlePath: string;
  primaryArticleUrl: string;
  secondaryArticleUrl: string;
  detectedSource: 'primary' | 'secondary' | 'external';
} {
  const cleanPrimary = normalizePrimaryOrigin(primaryDomainOrigin, true, true);
  const cleanSecondary = normalizePrimaryOrigin(secondaryDomainOrigin, true, true);

  let trimmed = rawInputUrl.trim();
  if (!trimmed) {
    return {
      articlePath: '/',
      primaryArticleUrl: `${cleanPrimary}/`,
      secondaryArticleUrl: `${cleanSecondary}/`,
      detectedSource: 'primary',
    };
  }

  if (trimmed.startsWith('/')) {
    return {
      articlePath: trimmed,
      primaryArticleUrl: `${cleanPrimary}${trimmed}`,
      secondaryArticleUrl: `${cleanSecondary}${trimmed}`,
      detectedSource: 'primary',
    };
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const fullPath = (parsed.pathname || '/') + (parsed.search || '') + (parsed.hash || '');
    const primaryHost = new URL(cleanPrimary).hostname.toLowerCase();
    const secondaryHost = new URL(cleanSecondary).hostname.toLowerCase();
    const inputHost = parsed.hostname.replace(/^www\./i, '').toLowerCase();

    let detectedSource: 'primary' | 'secondary' | 'external' = 'external';
    if (inputHost === primaryHost) {
      detectedSource = 'primary';
    } else if (inputHost === secondaryHost) {
      detectedSource = 'secondary';
    }

    return {
      articlePath: fullPath,
      primaryArticleUrl: `${cleanPrimary}${fullPath}`,
      secondaryArticleUrl: `${cleanSecondary}${fullPath}`,
      detectedSource,
    };
  } catch {
    const safePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return {
      articlePath: safePath,
      primaryArticleUrl: `${cleanPrimary}${safePath}`,
      secondaryArticleUrl: `${cleanSecondary}${safePath}`,
      detectedSource: 'primary',
    };
  }
}

/**
 * Convert a pattern like "/khuyen-mai/*" or "/login" into a RegExp
 */
export function matchPathPattern(pathname: string, pattern: string): boolean {
  const cleanPattern = pattern.trim() || '/';
  const normalizedPath = pathname || '/';

  if (cleanPattern === '*' || cleanPattern === '/*') {
    return normalizedPath !== '/' && normalizedPath !== '';
  }

  if (cleanPattern.endsWith('/*')) {
    const base = cleanPattern.slice(0, -2);
    return normalizedPath === base || normalizedPath.startsWith(base + '/');
  }

  const escaped = cleanPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}/?$`, 'i');
  return regex.test(normalizedPath);
}

/**
 * Filter query string based on configured policy
 */
export function filterQueryString(
  search: string,
  policy: RedirectConfig['queryParamPolicy']
): string {
  if (!search || search === '?' || policy === 'strip') {
    return '';
  }
  if (policy === 'preserve') {
    return search.startsWith('?') ? search : `?${search}`;
  }
  try {
    const params = new URLSearchParams(search);
    const kept = new URLSearchParams();
    params.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower.startsWith('utm_') || lower === 'gclid' || lower === 'fbclid' || lower === 'ref') {
        kept.set(key, value);
      }
    });
    const str = kept.toString();
    return str ? `?${str}` : '';
  } catch {
    return '';
  }
}

/**
 * Evaluate any input URL against the current RedirectConfig and return a detailed trace
 */
export function evaluateUrlRedirect(inputUrl: string, config: RedirectConfig): SimulationResult {
  const steps: SimulationStep[] = [];
  let rawInput = inputUrl.trim();

  if (!rawInput) {
    return {
      inputUrl,
      parsedValid: false,
      shouldRedirect: false,
      finalUrl: '',
      matchedRule: null,
      matchedArticle: null,
      statusCode: 200,
      reason: 'Chưa nhập địa chỉ URL cần kiểm tra.',
      executionTimeMs: 0.1,
      steps: [],
    };
  }

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

  if (rawInput.startsWith('/')) {
    rawInput = `${secondaryOrigin}${rawInput}`;
  } else if (!/^https?:\/\//i.test(rawInput)) {
    rawInput = `https://${rawInput}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawInput);
  } catch {
    return {
      inputUrl,
      parsedValid: false,
      shouldRedirect: false,
      finalUrl: inputUrl,
      matchedRule: null,
      matchedArticle: null,
      statusCode: 200,
      reason: 'Định dạng URL không hợp lệ.',
      executionTimeMs: 0.1,
      steps: [
        {
          stepNumber: 1,
          title: 'Phân tích cú pháp URL',
          detail: `Không thể phân tích cú pháp địa chỉ "${inputUrl}".`,
          passed: false,
        },
      ],
    };
  }

  const primaryUrl = new URL(primaryOrigin);
  const targetHost = primaryUrl.hostname;

  const isDifferentHost = parsed.hostname.toLowerCase() !== targetHost.toLowerCase();
  const isDifferentProtocol = config.forceHttps && parsed.protocol !== 'https:';
  const isSubpath = parsed.pathname !== '/' && parsed.pathname !== '';

  steps.push({
    stepNumber: 1,
    title: 'Phân tích Domain & Đường dẫn bài viết',
    detail: `Domain truy cập: ${parsed.hostname} · Đường dẫn: "${parsed.pathname}"`,
    passed: true,
  });

  // Check if input matches a synced ArticleLinkPair
  const articles = config.articles || [];
  const matchedArticle: ArticleLinkPair | null =
    articles.find(
      (art) =>
        art.articlePath === parsed.pathname ||
        art.secondaryArticleUrl.toLowerCase() === rawInput.toLowerCase() ||
        art.primaryArticleUrl.toLowerCase() === rawInput.toLowerCase()
    ) || null;

  if (matchedArticle) {
    steps.push({
      stepNumber: 2,
      title: `Khớp bài viết đã đồng bộ: "${matchedArticle.title}"`,
      detail: `Chuyển hướng trực tiếp từ bài trên Domain phụ sang đúng bài viết đó trên Domain chính (${matchedArticle.primaryArticleUrl}).`,
      passed: true,
    });
  }

  // Step 2: Check enabled custom rules
  const enabledRules = config.rules.filter((r) => r.enabled);
  let matchedRule: SubpathRule | null = null;

  if (!matchedArticle) {
    for (const rule of enabledRules) {
      if (matchPathPattern(parsed.pathname, rule.pattern)) {
        matchedRule = rule;
        break;
      }
    }
  }

  if (matchedRule) {
    if (matchedRule.action === 'whitelist_bypass') {
      steps.push({
        stepNumber: 2,
        title: `Khớp quy tắc ngoại lệ (Whitelist): ${matchedRule.pattern}`,
        detail: `Đường dẫn "${parsed.pathname}" nằm trong danh sách giữ nguyên (${matchedRule.description}).`,
        passed: true,
      });

      return {
        inputUrl: rawInput,
        parsedValid: true,
        shouldRedirect: false,
        finalUrl: rawInput,
        matchedRule,
        matchedArticle: null,
        statusCode: 200,
        reason: `Bỏ qua chuyển hướng do khớp ngoại lệ Whitelist (${matchedRule.pattern}).`,
        executionTimeMs: 0.4,
        steps,
      };
    }

    steps.push({
      stepNumber: 2,
      title: `Khớp quy tắc đường dẫn phụ: ${matchedRule.pattern}`,
      detail: matchedRule.description,
      passed: true,
    });
  } else if (!matchedArticle) {
    steps.push({
      stepNumber: 2,
      title: 'Kiểm tra danh sách quy tắc tùy chỉnh',
      detail: 'Áp dụng chính sách chuyển hướng sang bài viết tương ứng trên Domain chính.',
      passed: true,
    });
  }

  // Step 3: Determine target pathname
  let targetPathname = '/';
  if (matchedArticle) {
    try {
      const pUrl = new URL(matchedArticle.primaryArticleUrl);
      targetPathname = pUrl.pathname;
    } catch {
      targetPathname = matchedArticle.articlePath || parsed.pathname || '/';
    }
  } else if (matchedRule) {
    if (matchedRule.action === 'redirect_to_root') {
      targetPathname = '/';
    } else if (matchedRule.action === 'redirect_custom') {
      targetPathname = matchedRule.targetPath.startsWith('/')
        ? matchedRule.targetPath
        : `/${matchedRule.targetPath}`;
    }
  } else {
    if (config.subpathStrategy === 'preserve_path') {
      targetPathname = parsed.pathname || '/';
    } else if (config.subpathStrategy === 'strip_to_root') {
      targetPathname = '/';
    } else {
      targetPathname = '/';
    }
  }

  const filteredQuery = filterQueryString(parsed.search, config.queryParamPolicy);
  const filteredHash = config.preserveHash ? parsed.hash : '';
  const finalUrl = `${primaryOrigin}${targetPathname}${filteredQuery}${filteredHash}`;

  steps.push({
    stepNumber: 3,
    title: 'Xây dựng URL đích tại Domain chính',
    detail: `Đích: ${finalUrl}`,
    passed: true,
  });

  const normalizedRaw = rawInput.replace(/\/$/, '');
  const normalizedFinal = finalUrl.replace(/\/$/, '');
  const isIdentical =
    normalizedRaw === normalizedFinal && !isDifferentHost && !isDifferentProtocol;

  if (config.preventInfiniteLoop && (rawInput === finalUrl || isIdentical)) {
    steps.push({
      stepNumber: 4,
      title: 'Bảo vệ chống lặp vô hạn (Loop Guard)',
      detail: 'Người dùng đã ở đúng bài viết trên Domain chính. Không thực hiện chuyển hướng thừa.',
      passed: true,
    });

    return {
      inputUrl: rawInput,
      parsedValid: true,
      shouldRedirect: false,
      finalUrl,
      matchedRule: null,
      matchedArticle,
      statusCode: 200,
      reason: 'Đã ở tại đúng bài viết trên Domain chính.',
      executionTimeMs: 0.3,
      steps,
    };
  }

  const reasonParts: string[] = [];
  if (isDifferentHost) {
    reasonParts.push(`Click từ Domain phụ (${parsed.hostname})`);
  }
  if (isSubpath) {
    reasonParts.push(`Đường dẫn bài viết (${parsed.pathname})`);
  }

  const reasonText =
    reasonParts.length > 0
      ? `${reasonParts.join(' · ')} → Tự động chuyển sang bài viết trên Domain chính (${config.httpStatusCode}).`
      : `Tự động chuẩn hóa URL về Domain chính (${config.httpStatusCode}).`;

  steps.push({
    stepNumber: 4,
    title: `Chuyển hướng sang bài viết ở Domain chính (${config.httpStatusCode})`,
    detail: reasonText,
    passed: true,
  });

  return {
    inputUrl: rawInput,
    parsedValid: true,
    shouldRedirect: true,
    finalUrl,
    matchedRule,
    matchedArticle,
    statusCode: config.httpStatusCode,
    reason: reasonText,
    executionTimeMs: 0.5,
    steps,
  };
}
