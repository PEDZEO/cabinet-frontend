import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { infoApi } from '@/api/info';
import { ticketsApi } from '@/api/tickets';
import NewsSection from '@/components/news/NewsSection';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import {
  ultimaPanelClassName,
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
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

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M12 3 9.8 9.3 3 12l6.8 2.7L12 21l2.2-6.3L21 12l-6.8-2.7L12 3Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
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
          aside={
            <UltimaDesktopPanel
              title={t('ultima.newsAsideTitle', { defaultValue: 'Что внутри' })}
              subtitle={t('ultima.newsAsideSubtitle', {
                defaultValue: 'Следите за релизами, обновлениями приложений и сервисными анонсами.',
              })}
            >
              <div className="space-y-3">
                <div
                  className={`${ultimaPaneClassName} flex items-start gap-3 p-3.5`}
                  style={ultimaPaneSurfaceStyle}
                >
                  <span className="text-white/78 mt-0.5">
                    <SparkIcon />
                  </span>
                  <p className="text-white/72 text-sm leading-relaxed">
                    {t('ultima.newsAsideBody', {
                      defaultValue:
                        'Главная Ultima остаётся сфокусированной на подписке и подключении, а новости живут отдельным экраном.',
                    })}
                  </p>
                </div>
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          <NewsSection showHeader={false} showEmptyState />
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-shared-nav-docked">
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[680px] lg:justify-between">
        <section className="ultima-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pb-[calc(16px+env(safe-area-inset-bottom,0px))] pr-1 pt-[clamp(40px,9vh,72px)] lg:flex-none lg:overflow-visible lg:pb-2 lg:pr-0 lg:pt-8">
          <section className={`${ultimaPanelClassName} p-4`} style={ultimaSurfaceStyle}>
            <div className="text-white/88 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
              <NewspaperIcon />
            </div>
            <p className="text-white/48 text-[11px] uppercase tracking-[0.2em]">
              {t('news.title')}
            </p>
            <h1 className="mt-3 text-[clamp(32px,9vw,40px)] font-semibold leading-[0.94] tracking-[-0.04em] text-white">
              {t('ultima.newsPageTitle', { defaultValue: 'Новости' })}
            </h1>
            <p className="text-white/72 mt-3 text-[14px] leading-[1.65]">
              {t('ultima.newsPageSubtitle', {
                defaultValue:
                  'Отдельная лента новостей проекта: обновления, анонсы и важные изменения в одном месте.',
              })}
            </p>
          </section>

          <div className="mt-4">
            <NewsSection showHeader={false} showEmptyState />
          </div>
        </section>
      </div>
    </div>
  );
}
