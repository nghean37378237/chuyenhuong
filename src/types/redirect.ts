export type SubpathStrategy = 'strip_to_root' | 'rule_mapping' | 'preserve_path';

export type QueryParamPolicy = 'preserve' | 'utm_only' | 'strip';

export type HttpStatusCode = 301 | 302 | 307 | 308;

export type RuleActionType = 'redirect_to_root' | 'redirect_custom' | 'whitelist_bypass';

export interface SubpathRule {
  id: string;
  pattern: string; // e.g., "/khuyen-mai/*", "/blog/*", "/admin/*"
  action: RuleActionType;
  targetPath: string; // e.g., "/" or "/tin-tuc" (ignored for whitelist_bypass)
  description: string;
  enabled: boolean;
  hitCount: number;
}

export interface ArticleLinkPair {
  id: string;
  title: string;
  excerpt: string;
  thumbnailUrl: string;
  primaryArticleUrl: string; // e.g., https://domainchinh.vn/cong-nghe/ra-mat-ai-moi-2026.html
  secondaryArticleUrl: string; // e.g., https://domainphu.com/cong-nghe/ra-mat-ai-moi-2026.html
  articlePath: string; // e.g., /cong-nghe/ra-mat-ai-moi-2026.html
  createdAt: string;
  clicksCount: number;
}

export interface RedirectConfig {
  primaryDomain: string; // e.g., "https://domainchinh.vn"
  activeSecondaryDomain: string; // e.g., "https://domainphu.com"
  secondaryDomains: string[]; // e.g., ["domainphu.com", "old.domainchinh.vn", "promo.domainchinh.vn"]
  subpathStrategy: SubpathStrategy;
  queryParamPolicy: QueryParamPolicy;
  preserveHash: boolean;
  httpStatusCode: HttpStatusCode;
  redirectDelaySeconds: number; // 0 for instant, 1-10 for countdown banner
  forceHttps: boolean;
  stripWww: boolean;
  preventInfiniteLoop: boolean;
  rules: SubpathRule[];
  articles: ArticleLinkPair[];
}

export interface SimulationStep {
  stepNumber: number;
  title: string;
  detail: string;
  passed: boolean;
}

export interface SimulationResult {
  inputUrl: string;
  parsedValid: boolean;
  shouldRedirect: boolean;
  finalUrl: string;
  matchedRule: SubpathRule | null;
  matchedArticle?: ArticleLinkPair | null;
  statusCode: HttpStatusCode | 200;
  reason: string;
  executionTimeMs: number;
  steps: SimulationStep[];
}

export type CodeExportFormat =
  | 'js_head'
  | 'userscript'
  | 'chrome_ext'
  | 'nginx'
  | 'htaccess'
  | 'cloudflare_worker'
  | 'vercel';
