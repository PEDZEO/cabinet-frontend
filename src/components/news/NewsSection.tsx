import { type CSSProperties, useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { newsApi } from '../../api/news';
import {
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
  ultimaPanelClassName,
  ultimaSurfaceStyle,
} from '../../features/ultima/surfaces';
import { useHapticFeedback } from '../../platform/hooks/useHaptic';
import { cn } from '../../lib/utils';
import type { NewsListItem } from '../../types/news';

// --- Security: hex color validation to prevent CSS injection ---
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
function safeColor(color: string | null | undefined, fallback = '#888888'): string {
  if (!color || !HEX_COLOR_RE.test(color)) return fallback;
  return color;
}

// --- Animation variants ---
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const fadeSlideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: EASE_OUT,
    },
  }),
};

// --- Icons ---
const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// --- Sub-components ---

interface CategoryBadgeProps {
  category: string;
  color: string;
  className?: string;
}

const CategoryBadge = memo(function CategoryBadge({
  category,
  color,
  className,
}: CategoryBadgeProps) {
  const c = safeColor(color);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest',
        className,
      )}
      style={{
        color: c,
        background: `${c}15`,
        border: `1px solid ${c}30`,
      }}
    >
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full"
        style={{
          background: c,
          boxShadow: `0 0 8px ${c}`,
        }}
      />
      {category}
    </span>
  );
});

interface TagBadgeProps {
  text: string;
  color: string;
}

const TagBadge = memo(function TagBadge({ text, color }: TagBadgeProps) {
  const c = safeColor(color);
  return (
    <span
      className="inline-block rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
      style={{
        color: c,
        border: `1px solid ${c}33`,
        background: `${c}11`,
      }}
    >
      {text}
    </span>
  );
});

interface FilterTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
  variant?: 'default' | 'ultima';
}

const FilterTabs = memo(function FilterTabs({
  categories,
  active,
  onChange,
  variant = 'default',
}: FilterTabsProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  const isUltimaVariant = variant === 'ultima';

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('news.title')}>
      {/* "All" tab — empty string means no filter */}
      <button
        role="tab"
        aria-selected={active === ''}
        onClick={() => {
          haptic.selectionChanged();
          onChange('');
        }}
        className={cn(
          'min-h-[40px] rounded-full px-3.5 py-2 text-[12px] font-semibold tracking-wide transition-all duration-300',
          active === '' && !isUltimaVariant
            ? 'border border-accent-400 bg-accent-400 text-dark-950'
            : !isUltimaVariant
              ? 'border border-dark-700 bg-dark-800 text-dark-400 hover:border-accent-400/30 hover:text-accent-400'
              : '',
        )}
        style={
          isUltimaVariant
            ? active === ''
              ? {
                  borderColor: 'transparent',
                  background: 'var(--ultima-color-primary)',
                  color: 'var(--ultima-color-primary-text)',
                }
              : {
                  borderColor:
                    'color-mix(in srgb, var(--ultima-color-surface-border) 28%, transparent)',
                  background: 'color-mix(in srgb, var(--ultima-color-secondary) 72%, transparent)',
                  color: 'rgba(255,255,255,0.82)',
                }
            : undefined
        }
      >
        {t('news.filterAll')}
      </button>
      {categories.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              haptic.selectionChanged();
              onChange(cat);
            }}
            className={cn(
              'min-h-[40px] rounded-full px-3.5 py-2 text-[12px] font-semibold tracking-wide transition-all duration-300',
              isActive && !isUltimaVariant
                ? 'border border-accent-400 bg-accent-400 text-dark-950'
                : !isUltimaVariant
                  ? 'border border-dark-700 bg-dark-800 text-dark-400 hover:border-accent-400/30 hover:text-accent-400'
                  : '',
            )}
            style={
              isUltimaVariant
                ? isActive
                  ? {
                      borderColor: 'transparent',
                      background: 'var(--ultima-color-primary)',
                      color: 'var(--ultima-color-primary-text)',
                    }
                  : {
                      borderColor:
                        'color-mix(in srgb, var(--ultima-color-surface-border) 28%, transparent)',
                      background:
                        'color-mix(in srgb, var(--ultima-color-secondary) 72%, transparent)',
                      color: 'rgba(255,255,255,0.82)',
                    }
                : undefined
            }
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
});

interface FeaturedCardProps {
  item: NewsListItem;
  onClick: () => void;
  variant?: 'default' | 'ultima';
}

const FeaturedCard = memo(function FeaturedCard({
  item,
  onClick,
  variant = 'default',
}: FeaturedCardProps) {
  const { t, i18n } = useTranslation();
  const isUltimaVariant = variant === 'ultima';

  return (
    <motion.article
      custom={0}
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group col-span-full cursor-pointer rounded-2xl p-px transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950"
      style={
        isUltimaVariant
          ? {
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 32%, transparent)',
              background:
                'linear-gradient(145deg, color-mix(in srgb, var(--ultima-color-aura) 16%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 80%, transparent))',
            }
          : {
              background:
                'linear-gradient(135deg, rgba(var(--color-accent-400), 0.2), rgba(var(--color-dark-900), 0.2), rgba(var(--color-accent-400), 0.2))',
            }
      }
      whileHover={{
        background: isUltimaVariant
          ? 'linear-gradient(145deg, color-mix(in srgb, var(--ultima-color-aura) 24%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 74%, transparent))'
          : 'linear-gradient(135deg, rgba(var(--color-accent-400), 0.4), rgba(var(--color-accent-500), 0.4), rgba(var(--color-accent-400), 0.4))',
      }}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative flex min-h-[236px] flex-col justify-between overflow-hidden rounded-[15px] p-7 sm:p-10',
          isUltimaVariant ? ultimaPaneClassName : 'bg-dark-900',
        )}
        style={isUltimaVariant ? ultimaPaneSurfaceStyle : undefined}
      >
        {/* Corner decoration */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-[200px] w-[200px]"
          style={{
            background:
              'radial-gradient(circle at top right, rgba(var(--color-accent-400), 0.08), transparent 70%)',
          }}
        />

        {/* Shimmer top border */}
        <div
          className="absolute -top-px left-[20%] right-[20%] h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(var(--color-accent-400), 0.4), transparent)',
            animation: 'newsShimmer 3s ease-in-out infinite',
          }}
        />

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <CategoryBadge category={item.category} color={item.category_color} />
            {item.tag && <TagBadge text={item.tag} color={item.category_color} />}
            <span
              className={cn(
                'ml-auto font-mono text-[11px]',
                isUltimaVariant ? 'text-white/45' : 'text-dark-500',
              )}
            >
              {item.read_time_minutes} {t('news.readTime')}
            </span>
          </div>

          <h2
            className={cn(
              'mb-3 max-w-[700px] break-words text-2xl font-extrabold leading-tight transition-colors duration-300 sm:text-[28px]',
              isUltimaVariant
                ? 'text-white/94 group-hover:text-white'
                : 'text-dark-50 group-hover:text-white',
            )}
          >
            {item.title}
          </h2>

          {item.excerpt && (
            <p
              className={cn(
                'max-w-[600px] text-[15px] leading-relaxed',
                isUltimaVariant ? 'text-white/66' : 'text-dark-400',
              )}
            >
              {item.excerpt}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span
            className={cn('font-mono text-xs', isUltimaVariant ? 'text-white/42' : 'text-dark-600')}
          >
            {item.published_at ? new Date(item.published_at).toLocaleDateString(i18n.language) : ''}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-[13px] font-semibold transition-all duration-300 group-hover:gap-2.5',
              isUltimaVariant ? 'text-white/82' : 'text-accent-400',
            )}
          >
            {t('news.readMore')}
            <ArrowIcon />
          </span>
        </div>
      </div>
    </motion.article>
  );
});

interface NewsCardProps {
  item: NewsListItem;
  index: number;
  onClick: () => void;
  variant?: 'default' | 'ultima';
}

const NewsCard = memo(function NewsCard({
  item,
  index,
  onClick,
  variant = 'default',
}: NewsCardProps) {
  const { t, i18n } = useTranslation();
  const color = safeColor(item.category_color);
  const isUltimaVariant = variant === 'ultima';

  return (
    <motion.article
      custom={index + 1}
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer rounded-[14px] p-px transition-all duration-[450ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950"
      style={
        isUltimaVariant
          ? {
              borderColor:
                'color-mix(in srgb, var(--ultima-color-surface-border) 26%, transparent)',
              background:
                'linear-gradient(160deg, color-mix(in srgb, var(--ultima-color-secondary) 78%, transparent), color-mix(in srgb, var(--ultima-color-surface) 52%, transparent))',
            }
          : {
              background:
                'linear-gradient(160deg, rgba(var(--color-dark-700), 0.25), rgba(var(--color-dark-900), 0.25))',
            }
      }
      whileHover={{
        y: -4,
        background: isUltimaVariant
          ? `linear-gradient(160deg, ${color}28, color-mix(in srgb, var(--ultima-color-secondary) 74%, transparent) 60%)`
          : `linear-gradient(160deg, ${color}55, transparent 60%)`,
      }}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-[13px] p-7',
          isUltimaVariant ? ultimaPaneClassName : 'bg-dark-900',
        )}
        style={isUltimaVariant ? ultimaPaneSurfaceStyle : undefined}
      >
        {/* Subtle corner glow on hover */}
        <div
          className="pointer-events-none absolute -bottom-5 -right-5 h-[100px] w-[100px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle, ${color}08, transparent 70%)`,
          }}
        />

        <div>
          <div className="mb-3.5 flex items-center gap-2.5">
            <span
              className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest"
              style={{ color }}
            >
              <span
                className="h-[5px] w-[5px] rounded-full"
                style={{
                  background: color,
                  boxShadow: `0 0 6px ${color}80`,
                }}
              />
              {item.category}
            </span>
            {item.tag && <TagBadge text={item.tag} color={color} />}
          </div>

          <h3
            className={cn(
              'mb-2.5 break-words text-[17px] font-bold leading-snug transition-colors duration-300',
              isUltimaVariant
                ? 'text-white/92 group-hover:text-white'
                : 'text-dark-100 group-hover:text-white',
            )}
          >
            {item.title}
          </h3>

          {item.excerpt && (
            <p
              className={cn(
                'text-[13px] leading-[1.75]',
                isUltimaVariant ? 'text-white/62' : 'text-dark-400',
              )}
            >
              {item.excerpt}
            </p>
          )}
        </div>

        <div
          className={cn(
            'mt-5 flex items-center justify-between pt-3.5',
            isUltimaVariant ? 'border-white/8 border-t' : 'border-t border-dark-700/50',
          )}
        >
          <span
            className={cn(
              'font-mono text-[11px]',
              isUltimaVariant ? 'text-white/42' : 'text-dark-600',
            )}
          >
            {item.published_at ? new Date(item.published_at).toLocaleDateString(i18n.language) : ''}
          </span>
          <span
            className={cn(
              'font-mono text-[11px]',
              isUltimaVariant ? 'text-white/42' : 'text-dark-500',
            )}
          >
            {item.read_time_minutes} {t('news.readTime')}
          </span>
        </div>
      </div>
    </motion.article>
  );
});

// Thin wrapper that binds the per-item click handler without creating a new
// anonymous lambda in the parent's JSX on every render, which would defeat
// the memo on NewsCard.
interface NewsCardWrapperProps {
  item: NewsListItem;
  index: number;
  onCardClick: (slug: string) => void;
  variant?: 'default' | 'ultima';
}

const NewsCardWrapper = memo(function NewsCardWrapper({
  item,
  index,
  onCardClick,
  variant = 'default',
}: NewsCardWrapperProps) {
  const handleClick = useCallback(() => onCardClick(item.slug), [item.slug, onCardClick]);
  return <NewsCard item={item} index={index} onClick={handleClick} variant={variant} />;
});

// --- Main Component ---

const NEWS_LIMIT = 6;

type NewsSectionProps = {
  showHeader?: boolean;
  showEmptyState?: boolean;
  className?: string;
  variant?: 'default' | 'ultima';
};

export default function NewsSection({
  showHeader = true,
  showEmptyState = false,
  className,
  variant = 'default',
}: NewsSectionProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const haptic = useHapticFeedback();
  const [filter, setFilter] = useState<string>('');
  const [limit, setLimit] = useState(NEWS_LIMIT);

  const categoryParam = filter || undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['news', 'list', categoryParam, limit],
    queryFn: () => newsApi.getNews({ category: categoryParam, limit, offset: 0 }),
    // staleTime: serve cached data for 2 min before background re-fetch.
    // gcTime: keep in cache for 10 min so navigating away and back is instant.
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const categories = data?.categories ?? [];

  // Memoized so FeaturedCard/NewsCard receive stable object references when
  // parent state unrelated to the list changes (e.g. load-more button state).
  const { featured, regular } = useMemo(
    () => ({
      featured: items.find((n) => n.is_featured),
      regular: items.filter((n) => !n.is_featured),
    }),
    [items],
  );

  const handleCardClick = useCallback(
    (slug: string) => {
      haptic.buttonPress();
      const articlePath = variant === 'ultima' ? `/ultima/news/${slug}` : `/news/${slug}`;
      void queryClient.prefetchQuery({
        queryKey: ['news', 'article', slug],
        queryFn: () => newsApi.getArticle(slug),
        staleTime: 60_000,
      });
      navigate(articlePath);
    },
    [haptic, navigate, queryClient, variant],
  );

  const handleLoadMore = useCallback(() => {
    haptic.buttonPress();
    setLimit((prev) => prev + NEWS_LIMIT);
  }, [haptic]);

  const handleFilterChange = useCallback((category: string) => {
    setFilter(category);
    setLimit(NEWS_LIMIT);
  }, []);

  // Stable reference for the featured card — avoids re-rendering FeaturedCard
  // when `featured` is a new object reference but contains the same slug.
  const featuredSlug = featured?.slug;
  const handleFeaturedClick = useCallback(() => {
    if (featuredSlug) handleCardClick(featuredSlug);
  }, [featuredSlug, handleCardClick]);

  const isUltimaVariant = variant === 'ultima';
  const emptyStateStyle: CSSProperties | undefined = isUltimaVariant
    ? ultimaSurfaceStyle
    : undefined;
  const sectionStyle: CSSProperties | undefined = isUltimaVariant ? ultimaSurfaceStyle : undefined;

  if (items.length === 0) {
    if (!showEmptyState) {
      return null;
    }

    return (
      <section
        className={cn(
          isUltimaVariant
            ? `${ultimaPanelClassName} relative overflow-hidden p-4 text-left sm:p-5`
            : 'relative overflow-hidden rounded-2xl bg-dark-850/80 px-5 py-8 text-center backdrop-blur-xl sm:px-6 sm:py-10',
          className,
        )}
        style={emptyStateStyle}
      >
        <div className={cn('mx-auto', isUltimaVariant ? 'max-w-2xl' : 'max-w-md')}>
          {showHeader ? (
            <p
              className={cn(
                'mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em]',
                isUltimaVariant ? 'text-white/48' : 'text-dark-500',
              )}
            >
              {t('news.title')}
            </p>
          ) : null}
          <div
            className={cn(
              'rounded-[26px] px-6 py-6',
              isUltimaVariant
                ? `${ultimaPaneClassName} mt-3 max-w-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`
                : '',
            )}
            style={isUltimaVariant ? ultimaPaneSurfaceStyle : undefined}
          >
            <p
              className={cn(
                'text-sm leading-[1.8]',
                isUltimaVariant ? 'text-white/76' : 'text-dark-300',
              )}
            >
              {t('news.noNews')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        isUltimaVariant
          ? `${ultimaPanelClassName} relative overflow-hidden`
          : 'relative overflow-hidden rounded-2xl bg-dark-850/80 backdrop-blur-xl',
        className,
      )}
      style={sectionStyle}
    >
      <div className={cn(isUltimaVariant ? 'p-4 sm:p-5' : 'px-5 py-8 sm:px-6 sm:py-10')}>
        {showHeader ? (
          <motion.div
            variants={fadeSlideUp}
            custom={0}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <div className="mb-2 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                    fill="currentColor"
                    className="text-dark-950/20"
                  />
                  <path
                    d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-dark-950"
                  />
                  <path
                    d="M7 8h4M7 11h10M7 14h10M7 17h6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="text-dark-950"
                  />
                  <rect
                    x="14"
                    y="7"
                    width="4"
                    height="4"
                    rx="0.5"
                    fill="currentColor"
                    className="text-dark-950"
                  />
                </svg>
              </div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-dark-500">
                {t('news.title')}
              </span>
            </div>
          </motion.div>
        ) : null}

        {categories.length > 0 && (
          <motion.div
            variants={fadeSlideUp}
            custom={0}
            initial="hidden"
            animate="visible"
            className={showHeader ? 'mb-8' : isUltimaVariant ? 'mb-4' : 'mb-6'}
          >
            <FilterTabs
              categories={categories}
              active={filter}
              onChange={handleFilterChange}
              variant={variant}
            />
          </motion.div>
        )}

        {/* Grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {featured && (
              <FeaturedCard item={featured} onClick={handleFeaturedClick} variant={variant} />
            )}
            {regular.map((item, i) => (
              <NewsCardWrapper
                key={item.id}
                item={item}
                index={i}
                onCardClick={handleCardClick}
                variant={variant}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {!isLoading && items.length < total && (
          <motion.div
            variants={fadeSlideUp}
            custom={6}
            initial="hidden"
            animate="visible"
            className="mt-6 text-center"
          >
            <button
              onClick={handleLoadMore}
              className={cn(
                'min-h-[44px] rounded-xl px-8 py-3 text-[13px] font-semibold tracking-wide transition-all duration-300',
                isUltimaVariant
                  ? 'text-white/76 border border-white/10 bg-white/[0.05] hover:bg-white/[0.075] hover:text-white'
                  : 'border border-dark-700 bg-transparent text-dark-400 hover:border-accent-400/30 hover:text-accent-400',
              )}
            >
              {t('news.loadMore')}
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
