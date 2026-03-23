import { useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { newsApi } from '../api/news';
import { usePlatform } from '../platform/hooks/usePlatform';

// Icons
const BackIcon = () => (
  <svg
    className="h-5 w-5 text-dark-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
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

const EyeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
 * All article content from the API is sanitized before rendering.
 */
const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'player.vimeo.com',
  'www.youtube-nocookie.com',
];

// Register DOMPurify hook to restrict iframe src to trusted hosts
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe') {
    const el = node as Element;
    const src = el.getAttribute?.('src') ?? '';
    try {
      const url = new URL(src);
      if (!ALLOWED_IFRAME_HOSTS.includes(url.hostname)) {
        el.parentNode?.removeChild(el);
      }
    } catch {
      el.parentNode?.removeChild(el);
    }
  }
});

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'frameborder', 'src', 'allow'],
  });
}

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { capabilities, backButton } = usePlatform();

  // Show Telegram native back button (use ref to avoid effect re-runs)
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    if (!capabilities.hasBackButton) return;
    backButton.show(() => navigateRef.current(-1));
    return () => backButton.hide();
  }, [capabilities.hasBackButton, backButton]);

  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['news', 'article', slug],
    queryFn: () => newsApi.getArticle(slug!),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const sanitizedContent = useMemo(() => (article ? sanitizeHtml(article.content) : ''), [article]);

  if (isLoading) {
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
    return (
      <div className="space-y-6">
        {!capabilities.hasBackButton && (
          <button
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
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

  return (
    <div className="space-y-6">
      {/* Back button */}
      {!capabilities.hasBackButton && (
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 items-center gap-2 rounded-xl border border-dark-700 bg-dark-800 px-4 text-sm text-dark-400 transition-colors hover:border-dark-600 hover:text-dark-200"
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
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest"
            style={{
              color: article.category_color,
              background: `${article.category_color}15`,
              border: `1px solid ${article.category_color}30`,
            }}
          >
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{
                background: article.category_color,
                boxShadow: `0 0 8px ${article.category_color}`,
              }}
            />
            {article.category}
          </span>
          {article.tag && (
            <span
              className="inline-block rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: article.category_color,
                border: `1px solid ${article.category_color}33`,
                background: `${article.category_color}11`,
              }}
            >
              {article.tag}
            </span>
          )}
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
          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
            <EyeIcon />
            {article.views_count} {t('news.views')}
          </span>
        </div>
      </motion.div>

      {/* Featured image */}
      {article.featured_image_url && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="overflow-hidden rounded-xl"
        >
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="h-auto w-full rounded-xl object-cover"
            loading="lazy"
          />
        </motion.div>
      )}

      {/* Article content - sanitized with DOMPurify */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="prose max-w-none lg:max-w-3xl"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  );
}
