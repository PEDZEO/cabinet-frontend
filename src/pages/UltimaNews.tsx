import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { infoApi } from '@/api/info';
import { ticketsApi } from '@/api/tickets';
import NewsSection from '@/components/news/NewsSection';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { UltimaDesktopSectionLayout } from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const NewspaperIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
    <path
      d="M6 5.5h11.25A1.75 1.75 0 0 1 19 7.25V18a2.5 2.5 0 0 1-2.5 2.5H8A3 3 0 0 1 5 17.5V7.5A2 2 0 0 1 7 5.5h.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 9h7M8.5 12h7M8.5 15h4.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <rect x="14.5" y="8.5" width="2.5" height="2.5" rx="0.4" fill="currentColor" />
  </svg>
);

export default function UltimaNews() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const openSupport = () => {
    void queryClient.prefetchQuery({
      queryKey: ['support-config'],
      queryFn: infoApi.getSupportConfig,
      staleTime: 60000,
    });
    void queryClient.prefetchQuery({
      queryKey: ['tickets'],
      queryFn: () => ticketsApi.getTickets({ per_page: 20 }),
      staleTime: 15000,
    });
    navigate('/support');
  };

  const bottomNav = <UltimaBottomNav active="news" onSupportClick={openSupport} />;

  if (isDesktop) {
    return (
      <div className="ultima-shell ultima-shell-shared-nav-docked ultima-flat-frames">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<NewspaperIcon />}
          eyebrow={t('news.title')}
          title={t('ultima.newsPageTitle', { defaultValue: 'Новости' })}
          subtitle={t('ultima.newsPageSubtitle', {
            defaultValue:
              'Отдельная лента новостей проекта: обновления, анонсы и важные изменения в одном месте.',
          })}
          metrics={[
            {
              label: t('ultima.newsPageMetricLabel', { defaultValue: 'Формат' }),
              value: t('ultima.newsPageMetricValue', { defaultValue: 'Лента проекта' }),
              hint: t('ultima.newsPageMetricHint', {
                defaultValue:
                  'Новые публикации открываются отдельной статьей без перегруза главной.',
              }),
            },
          ]}
          bottomNav={bottomNav}
        >
          <NewsSection showHeader={false} showEmptyState variant="ultima" />
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-shared-nav-docked ultima-shell-wide ultima-flat-frames ultima-shell-muted-aura">
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <div className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto px-0 pb-[max(12px,env(safe-area-inset-bottom,0px))] pr-1 pt-[clamp(8px,2vh,16px)] lg:overflow-visible lg:pr-0">
          <header className="mb-4 px-1">
            <div className="text-white/88 mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
              <NewspaperIcon />
            </div>
            <p className="text-white/44 text-[11px] uppercase tracking-[0.2em]">
              {t('news.title')}
            </p>
            <h1 className="mt-3 text-[clamp(34px,9vw,46px)] font-semibold leading-[0.92] tracking-[-0.02em] text-white">
              {t('ultima.newsPageTitle', { defaultValue: 'Новости' })}
            </h1>
            <p className="text-white/64 mt-2 max-w-[32rem] text-[15px] leading-[1.7]">
              {t('ultima.newsPageSubtitle', {
                defaultValue:
                  'Отдельная лента новостей проекта: обновления, анонсы и важные изменения в одном месте.',
              })}
            </p>
          </header>

          <NewsSection
            showHeader={false}
            showEmptyState
            variant="ultima"
            className="overflow-visible shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_48px_rgba(3,14,24,0.24)]"
          />
        </div>
      </div>
    </div>
  );
}
