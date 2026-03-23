import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { newsApi } from '../../api/news';
import { useHapticFeedback } from '../../platform/hooks/useHaptic';
import { cn } from '../../lib/utils';
import type { NewsListItem } from '../../types/news';
import GridBackground from './GridBackground';

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

function ScanLine() {
  return (
    <motion.div
      className="pointer-events-none absolute left-0 right-0 top-0 z-[2] h-[2px]"
      style={{
        background:
          'linear-gradient(90deg, transparent, rgba(var(--color-accent-400), 0.5), transparent)',
      }}
      animate={{ y: ['0%', '2000%'] }}
      transition={{
        duration: 4,
        ease: 'easeInOut',
        repeat: Infinity,
      }}
    />
  );
}

interface CategoryBadgeProps {
  category: string;
  color: string;
  className?: string;
}

function CategoryBadge({ category, color, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest',
        className,
      )}
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
      {category}
    </span>
  );
}

interface TagBadgeProps {
  text: string;
  color: string;
}

function TagBadge({ text, color }: TagBadgeProps) {
  return (
    <span
      className="inline-block rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
      style={{
        color,
        border: `1px solid ${color}33`,
        background: `${color}11`,
      }}
    >
      {text}
    </span>
  );
}

interface FilterTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

function FilterTabs({ categories, active, onChange }: FilterTabsProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();

  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('news.title')}>
      {/* "All" tab — empty string means no filter */}
      <button
        role="tab"
        aria-selected={active === ''}
        onClick={() => {
          haptic.selectionChanged();
          onChange('');
        }}
        className={cn(
          'min-h-[44px] rounded-lg px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-300',
          active === ''
            ? 'border border-accent-400 bg-accent-400 text-dark-950'
            : 'border border-dark-700 bg-dark-800 text-dark-400 hover:border-accent-400/30 hover:text-accent-400',
        )}
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
              'min-h-[44px] rounded-lg px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-300',
              isActive
                ? 'border border-accent-400 bg-accent-400 text-dark-950'
                : 'border border-dark-700 bg-dark-800 text-dark-400 hover:border-accent-400/30 hover:text-accent-400',
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}

interface FeaturedCardProps {
  item: NewsListItem;
  onClick: () => void;
}

function FeaturedCard({ item, onClick }: FeaturedCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <motion.div
      custom={0}
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      className="group col-span-full cursor-pointer rounded-2xl p-px transition-all duration-500"
      style={{
        background:
          'linear-gradient(135deg, rgba(var(--color-accent-400), 0.2), rgba(var(--color-dark-900), 0.2), rgba(var(--color-accent-400), 0.2))',
      }}
      whileHover={{
        background:
          'linear-gradient(135deg, rgba(var(--color-accent-400), 0.4), rgba(var(--color-accent-500), 0.4), rgba(var(--color-accent-400), 0.4))',
      }}
      onClick={onClick}
    >
      <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[15px] bg-dark-900 p-7 sm:p-10">
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
            <span className="ml-auto font-mono text-[11px] text-dark-500">
              {item.read_time_minutes} {t('news.readTime')}
            </span>
          </div>

          <h2 className="mb-3 max-w-[700px] break-words text-2xl font-extrabold leading-tight text-dark-50 transition-colors duration-300 group-hover:text-white sm:text-[28px]">
            {item.title}
          </h2>

          {item.excerpt && (
            <p className="max-w-[600px] text-[15px] leading-relaxed text-dark-400">
              {item.excerpt}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="font-mono text-xs text-dark-600">
            {item.published_at ? new Date(item.published_at).toLocaleDateString(i18n.language) : ''}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-400 transition-all duration-300 group-hover:gap-2.5">
            {t('news.readMore')}
            <ArrowIcon />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface NewsCardProps {
  item: NewsListItem;
  index: number;
  onClick: () => void;
}

function NewsCard({ item, index, onClick }: NewsCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <motion.div
      custom={index + 1}
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      className="group cursor-pointer rounded-[14px] p-px transition-all duration-[450ms]"
      style={{
        background:
          'linear-gradient(160deg, rgba(var(--color-dark-700), 0.25), rgba(var(--color-dark-900), 0.25))',
      }}
      whileHover={{
        y: -4,
        background: `linear-gradient(160deg, ${item.category_color}55, transparent 60%)`,
      }}
      onClick={onClick}
    >
      <div className="relative flex h-full min-h-[210px] flex-col justify-between overflow-hidden rounded-[13px] bg-dark-900 p-7">
        {/* Subtle corner glow on hover */}
        <div
          className="pointer-events-none absolute -bottom-5 -right-5 h-[100px] w-[100px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle, ${item.category_color}08, transparent 70%)`,
          }}
        />

        <div>
          <div className="mb-3.5 flex items-center gap-2.5">
            <span
              className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest"
              style={{ color: item.category_color }}
            >
              <span
                className="h-[5px] w-[5px] rounded-full"
                style={{
                  background: item.category_color,
                  boxShadow: `0 0 6px ${item.category_color}80`,
                }}
              />
              {item.category}
            </span>
            {item.tag && <TagBadge text={item.tag} color={item.category_color} />}
          </div>

          <h3 className="mb-2.5 break-words text-[17px] font-bold leading-snug text-dark-100 transition-colors duration-300 group-hover:text-white">
            {item.title}
          </h3>

          {item.excerpt && (
            <p className="text-[13px] leading-relaxed text-dark-400">{item.excerpt}</p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-dark-700/50 pt-3.5">
          <span className="font-mono text-[11px] text-dark-600">
            {item.published_at ? new Date(item.published_at).toLocaleDateString(i18n.language) : ''}
          </span>
          <span className="font-mono text-[11px] text-dark-500">
            {item.read_time_minutes} {t('news.readTime')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Component ---

const NEWS_LIMIT = 6;

export default function NewsSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const [filter, setFilter] = useState<string>('');
  const [limit, setLimit] = useState(NEWS_LIMIT);

  const categoryParam = filter || undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['news', 'list', categoryParam, limit],
    queryFn: () => newsApi.getNews({ category: categoryParam, limit, offset: 0 }),
    staleTime: 60_000,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const categories = data?.categories ?? [];

  const featured = items.find((n) => n.is_featured);
  const regular = items.filter((n) => !n.is_featured);

  const handleCardClick = useCallback(
    (slug: string) => {
      haptic.buttonPress();
      navigate(`/news/${slug}`);
    },
    [haptic, navigate],
  );

  const handleLoadMore = useCallback(() => {
    haptic.buttonPress();
    setLimit((prev) => prev + NEWS_LIMIT);
  }, [haptic]);

  const handleFilterChange = useCallback((category: string) => {
    setFilter(category);
    setLimit(NEWS_LIMIT);
  }, []);

  // Don't render if no news and not loading
  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section className="relative -mx-4 overflow-hidden rounded-2xl bg-dark-950 lg:-mx-6">
      <GridBackground />
      <ScanLine />

      <div className="relative z-[1] px-5 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <motion.div
          variants={fadeSlideUp}
          custom={0}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 font-mono text-sm font-extrabold text-dark-950">
              N
            </div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-dark-500">
              {t('news.title')}
            </span>
          </div>
          <h2 className="mb-5 text-2xl font-extrabold leading-tight text-dark-50 sm:text-[34px]">
            {t('news.title')}
          </h2>

          {categories.length > 0 && (
            <FilterTabs categories={categories} active={filter} onChange={handleFilterChange} />
          )}
        </motion.div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'animate-pulse rounded-2xl bg-dark-900 p-7',
                  i === 0 && 'col-span-full',
                )}
              >
                <div className="mb-4 h-4 w-24 rounded bg-dark-800" />
                <div className="mb-3 h-6 w-3/4 rounded bg-dark-800" />
                <div className="h-4 w-1/2 rounded bg-dark-800" />
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {featured && (
              <FeaturedCard item={featured} onClick={() => handleCardClick(featured.slug)} />
            )}
            {regular.map((item, i) => (
              <NewsCard
                key={item.id}
                item={item}
                index={i}
                onClick={() => handleCardClick(item.slug)}
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
            className="mt-10 text-center"
          >
            <button
              onClick={handleLoadMore}
              className="rounded-xl border border-dark-700 bg-transparent px-8 py-3 text-[13px] font-semibold tracking-wide text-dark-400 transition-all duration-300 hover:border-accent-400/30 hover:text-accent-400"
            >
              {t('news.loadMore')}
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
