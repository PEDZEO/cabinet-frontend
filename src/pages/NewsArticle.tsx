import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { newsApi, normalizeNewsMediaUrl } from '../api/news';
import { UltimaBottomNav } from '../components/ultima/UltimaBottomNav';
import {
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
  ultimaPanelClassName,
  ultimaSurfaceStyle,
} from '../features/ultima/surfaces';
import { usePlatform } from '../platform/hooks/usePlatform';

// Icons
const BackIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);

/**
 * Sanitizes HTML content using DOMPurify to prevent XSS attacks.
 * Uses explicit allowlists (not ADD_TAGS/ADD_ATTR) for defense-in-depth.
 *
 * iframe elements are allowed only when their src points to a trusted
 * video host (YouTube, Vimeo) over HTTPS. All other iframes are stripped.
 */
const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'player.vimeo.com',
  'www.youtube-nocookie.com',
]);

/**
 * Validate that an iframe src URL points to a trusted host over HTTPS.
 * Returns false for any non-HTTPS, non-allowlisted, or malformed URL.
 */
function isAllowedIframeSrc(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && ALLOWED_IFRAME_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

// Hook: strip iframes with disallowed src before DOMPurify finalizes the DOM.
// Using 'afterSanitizeAttributes' is more reliable than 'uponSanitizeElement'
// because the node is fully formed at this point.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IFRAME') {
    const src = node.getAttribute('src') ?? '';
    if (!isAllowedIframeSrc(src)) {
      node.remove();
      return;
    }
    // Force sandbox attribute on surviving iframes for defense-in-depth.
    // allow-scripts + allow-same-origin are needed for YouTube/Vimeo embeds.
    node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    // Strip any allow/allowfullscreen values we did not explicitly set
    if (node.hasAttribute('allow')) {
      // Only permit safe feature policies for video embeds
      node.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    }
  }
});

// Hook: validate <video> src — only allow http/https URLs
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'VIDEO') {
    const src = node.getAttribute('src') ?? '';
    try {
      const url = new URL(src);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        node.remove();
        return;
      }
    } catch {
      node.remove();
      return;
    }
    // Force safe defaults
    node.setAttribute('controls', '');
    node.setAttribute('preload', 'metadata');
  }
});

/**
 * Strict allowlist of tags and attributes for article content.
 * Using ALLOWED_TAGS / ALLOWED_ATTR instead of ADD_TAGS / ADD_ATTR
 * ensures nothing from the permissive defaults leaks through.
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    // Block elements
    'p',
    'div',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'pre',
    'code',
    'ul',
    'ol',
    'li',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    // Inline elements
    'a',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'del',
    'ins',
    'span',
    'mark',
    'sub',
    'sup',
    'small',
    'img',
    'video',
    // Embed (validated by afterSanitizeAttributes hook)
    'iframe',
    'figure',
    'figcaption',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'src',
    'alt',
    'title',
    'width',
    'height',
    'loading',
    'class',
    'start',
    'reversed',
    'type',
    // video-specific
    'controls',
    'preload',
    // iframe-specific (validated by hook)
    'frameborder',
    'allowfullscreen',
    'allow',
    'sandbox',
    // text-align from TipTap editor
    'style',
  ],
  ALLOW_DATA_ATTR: false,
  // Force all links to open in new tab safely
  ADD_ATTR: ['target'],
};

// Hook: force rel="noopener noreferrer" on all <a> tags to prevent tabnabbing
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Restrict inline styles to only text-align (used by TipTap).
 * Strip any other CSS property to prevent CSS injection / exfiltration.
 */
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.hasAttribute('style')) {
    const style = node.getAttribute('style') ?? '';
    const match = style.match(/text-align\s*:\s*(left|center|right|justify)/i);
    if (match) {
      node.setAttribute('style', `text-align: ${match[1]}`);
    } else {
      node.removeAttribute('style');
    }
  }
});

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

function normalizeArticleHtmlMediaUrls(html: string): string {
  if (typeof window === 'undefined' || !html) return html;

  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');

  for (const element of document.querySelectorAll('img, video, source')) {
    const source = element.getAttribute('src');
    const normalized = normalizeNewsMediaUrl(source);

    if (source && !normalized) {
      element.remove();
      continue;
    }

    if (normalized) {
      element.setAttribute('src', normalized);
    }

    if (element.tagName === 'IMG') {
      element.setAttribute('loading', 'lazy');
      element.setAttribute('decoding', 'async');
    }
  }

  return document.body.innerHTML;
}

/**
 * Validates that a color string is a safe hex color.
 * Prevents CSS injection via malicious category_color values.
 * Returns the color if valid, otherwise returns a safe fallback.
 */
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
function safeColor(color: string | null | undefined, fallback = '#888888'): string {
  if (!color || !HEX_COLOR_RE.test(color)) return fallback;
  return color;
}

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { capabilities, backButton } = usePlatform();
  const isUltimaRoute = location.pathname.startsWith('/ultima/news');
  const backPath = isUltimaRoute ? '/ultima/news' : '/';
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [featuredImageFailed, setFeaturedImageFailed] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);

  // Show Telegram native back button (use ref to avoid effect re-runs)
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    if (!capabilities.hasBackButton) return;
    backButton.show(() => navigateRef.current(backPath, { replace: true }));
    return () => backButton.hide();
  }, [backButton, backPath, capabilities.hasBackButton]);

  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['news', 'article', slug],
    queryFn: () => {
      if (!slug) throw new Error('Missing slug parameter');
      return newsApi.getArticle(slug);
    },
    enabled: !!slug,
    staleTime: 60_000,
  });

  const sanitizedContent = useMemo(() => {
    if (!article) return '';
    return sanitizeHtml(normalizeArticleHtmlMediaUrls(article.content));
  }, [article]);
  const featuredImageUrl = normalizeNewsMediaUrl(article?.featured_image_url);

  useEffect(() => {
    setFeaturedImageFailed(false);
  }, [featuredImageUrl]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;

      const src = normalizeNewsMediaUrl(target.currentSrc || target.src);
      if (!src) return;

      setExpandedImage({
        src,
        alt: target.alt || article?.title || 'News image',
      });
    };

    const handleError = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;

      const figure = target.closest('figure');
      if (figure instanceof HTMLElement) {
        figure.style.display = 'none';
        return;
      }

      target.style.display = 'none';
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('error', handleError, true);

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('error', handleError, true);
    };
  }, [article?.title, sanitizedContent]);

  const renderExpandedImage = () =>
    expandedImage ? (
      <div
        className="bg-black/88 fixed inset-0 z-[90] flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={() => setExpandedImage(null)}
        role="dialog"
        aria-modal="true"
        aria-label={expandedImage.alt}
      >
        <button
          type="button"
          className="text-white/92 absolute right-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/10"
          onClick={() => setExpandedImage(null)}
          aria-label={t('common.close', { defaultValue: 'Close' })}
        >
          ×
        </button>
        <img
          src={expandedImage.src}
          alt={expandedImage.alt}
          className="max-h-[82svh] w-auto max-w-full rounded-[24px] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    ) : null;

  const renderUltimaLayout = (content: ReactNode) => (
    <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-muted-aura">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 pt-[clamp(8px,2vh,16px)] lg:overflow-visible lg:pr-0">
          {content}
        </div>
        <div className="ultima-mobile-dock-footer lg:hidden">
          <div className="ultima-nav-dock">
            <UltimaBottomNav active="news" />
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    if (isUltimaRoute) {
      return renderUltimaLayout(
        <div className="space-y-3">
          <section className={`${ultimaPanelClassName} p-4 sm:p-5`} style={ultimaSurfaceStyle}>
            <div className="skeleton mb-3 h-9 w-24 rounded-full" />
            <div className="skeleton h-10 w-3/4 rounded-2xl" />
            <div className="skeleton mt-3 h-5 w-48 rounded-xl" />
          </section>
          <section className={`${ultimaPanelClassName} p-4 sm:p-5`} style={ultimaSurfaceStyle}>
            <div className="skeleton mb-4 h-52 w-full rounded-[24px]" />
            <div className="space-y-3">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-5/6 rounded" />
              <div className="skeleton h-4 w-4/6 rounded" />
            </div>
          </section>
        </div>,
      );
    }

    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-32 rounded-lg" />
        <div className="skeleton h-10 w-3/4 rounded-lg" />
        <div className="skeleton h-5 w-48 rounded-lg" />
        <div className="skeleton h-64 w-full rounded-xl" />
        <div className="space-y-3">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-4 w-4/6 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    if (isUltimaRoute) {
      return renderUltimaLayout(
        <section
          className={`${ultimaPanelClassName} p-4 text-left sm:p-5`}
          style={ultimaSurfaceStyle}
        >
          <button
            onClick={() => navigate(backPath)}
            className="text-white/78 mb-4 flex min-h-[40px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm transition-colors hover:bg-white/[0.08] hover:text-white"
            aria-label={t('news.backToHome')}
          >
            <BackIcon />
            <span>{t('news.title', { defaultValue: 'Новости' })}</span>
          </button>
          <div
            className={`${ultimaPaneClassName} text-white/62 p-5 text-center`}
            style={ultimaPaneSurfaceStyle}
          >
            {t('news.noNews')}
          </div>
        </section>,
      );
    }

    return (
      <div className="space-y-6">
        {!capabilities.hasBackButton && (
          <button
            onClick={() => navigate(backPath)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
            aria-label={t('news.backToHome')}
          >
            <BackIcon />
          </button>
        )}
        <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-8 text-center text-dark-400">
          {t('news.noNews')}
        </div>
      </div>
    );
  }

  if (isUltimaRoute) {
    const color = safeColor(article.category_color);

    return renderUltimaLayout(
      <div className="space-y-3">
        <section className={`${ultimaPanelClassName} p-4 sm:p-5`} style={ultimaSurfaceStyle}>
          <button
            onClick={() => navigate(backPath)}
            className="text-white/78 mb-4 flex min-h-[40px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm transition-colors hover:bg-white/[0.08] hover:text-white"
            aria-label={t('news.title', { defaultValue: 'Новости' })}
          >
            <BackIcon />
            <span>{t('news.title', { defaultValue: 'Новости' })}</span>
          </button>

          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest"
              style={{
                color,
                background: `${color}15`,
                border: `1px solid ${color}30`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                }}
              />
              {article.category}
            </span>
            {article.tag && (
              <span
                className="inline-block rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color,
                  border: `1px solid ${color}33`,
                  background: `${color}11`,
                }}
              >
                {article.tag}
              </span>
            )}
          </div>

          <h1 className="text-[clamp(30px,8.6vw,42px)] font-semibold leading-[0.96] tracking-[-0.02em] text-white">
            {article.title}
          </h1>

          <div className="text-white/52 mt-3 flex flex-wrap items-center gap-4 text-xs">
            {article.published_at && (
              <span className="inline-flex items-center gap-1.5 font-mono">
                <CalendarIcon />
                {new Date(article.published_at).toLocaleDateString(i18n.language)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 font-mono">
              <ClockIcon />
              {article.read_time_minutes} {t('news.readTime')}
            </span>
          </div>
        </section>

        <section
          className={`${ultimaPanelClassName} overflow-hidden p-4 sm:p-5`}
          style={ultimaSurfaceStyle}
        >
          {featuredImageUrl && !featuredImageFailed ? (
            <button
              type="button"
              className="mb-4 block w-full overflow-hidden rounded-[24px] bg-black/10 text-left"
              onClick={() => setExpandedImage({ src: featuredImageUrl, alt: article.title })}
              aria-label={t('news.openImage', { defaultValue: 'Open image' })}
            >
              <img
                src={featuredImageUrl}
                alt={article.title}
                className="h-auto max-h-[min(48svh,420px)] w-full rounded-[24px] object-contain"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onError={() => setFeaturedImageFailed(true)}
              />
            </button>
          ) : null}

          <div
            ref={contentRef}
            className="text-white/86 prose prose-invert [&_blockquote]:text-white/72 [&_figcaption]:text-white/54 [&_td]:border-white/8 max-w-none text-[15px] leading-[1.78] [&_a]:break-all [&_a]:text-[#74f0d0] [&_a]:underline [&_blockquote]:rounded-[20px] [&_blockquote]:border [&_blockquote]:border-white/10 [&_blockquote]:bg-white/[0.04] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figure]:my-5 [&_h1]:mb-3 [&_h1]:text-[30px] [&_h1]:font-semibold [&_h1]:leading-[1] [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:leading-[1.1] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-[20px] [&_h3]:font-semibold [&_h3]:leading-[1.15] [&_img]:my-5 [&_img]:max-h-[min(52svh,480px)] [&_img]:w-full [&_img]:cursor-zoom-in [&_img]:rounded-[24px] [&_img]:object-contain [&_li]:mb-2 [&_ol]:mb-5 [&_ol]:pl-5 [&_p]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-[20px] [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-black/20 [&_pre]:p-4 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_td]:border-b [&_td]:px-3 [&_td]:py-2 [&_th]:border-b [&_th]:border-white/10 [&_th]:px-3 [&_th]:py-2 [&_ul]:mb-5 [&_ul]:pl-5 [&_video]:my-5 [&_video]:max-h-[min(52svh,480px)] [&_video]:w-full [&_video]:rounded-[24px] [&_video]:bg-black/20"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </section>
        {renderExpandedImage()}
      </div>,
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      {!capabilities.hasBackButton && (
        <button
          onClick={() => navigate(backPath)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-dark-700 bg-dark-800 px-4 text-sm text-dark-400 transition-colors hover:border-dark-600 hover:text-dark-200"
          aria-label={t('news.backToHome')}
        >
          <BackIcon />
          <span>{t('news.backToHome')}</span>
        </button>
      )}

      {/* Article header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Category + tag */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {(() => {
            const color = safeColor(article.category_color);
            return (
              <>
                <span
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest"
                  style={{
                    color,
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full"
                    style={{
                      background: color,
                      boxShadow: `0 0 8px ${color}`,
                    }}
                  />
                  {article.category}
                </span>
                {article.tag && (
                  <span
                    className="inline-block rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color,
                      border: `1px solid ${color}33`,
                      background: `${color}11`,
                    }}
                  >
                    {article.tag}
                  </span>
                )}
              </>
            );
          })()}
        </div>

        {/* Title */}
        <h1 className="mb-4 text-2xl font-extrabold leading-tight text-dark-50 sm:text-3xl">
          {article.title}
        </h1>

        {/* Meta info */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-dark-400">
          {article.published_at && (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs">
              <CalendarIcon />
              {new Date(article.published_at).toLocaleDateString(i18n.language)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
            <ClockIcon />
            {article.read_time_minutes} {t('news.readTime')}
          </span>
        </div>
      </motion.div>

      {/* Featured image - only render if URL uses safe protocol */}
      {featuredImageUrl && !featuredImageFailed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="overflow-hidden rounded-xl"
        >
          <button
            type="button"
            className="block w-full overflow-hidden rounded-xl"
            onClick={() => setExpandedImage({ src: featuredImageUrl, alt: article.title })}
            aria-label={t('news.openImage', { defaultValue: 'Open image' })}
          >
            <img
              src={featuredImageUrl}
              alt={article.title}
              className="h-auto max-h-[min(56svh,560px)] w-full rounded-xl object-contain"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={() => setFeaturedImageFailed(true)}
            />
          </button>
        </motion.div>
      )}

      {/* Article content - sanitized with DOMPurify */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        ref={contentRef}
        className="prose max-w-none lg:max-w-3xl [&_img]:max-h-[min(56svh,560px)] [&_img]:w-full [&_img]:cursor-zoom-in [&_img]:object-contain [&_video]:max-h-[min(56svh,560px)] [&_video]:w-full"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
      {renderExpandedImage()}
    </div>
  );
}
