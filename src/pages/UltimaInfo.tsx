import DOMPurify from 'dompurify';
import { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { infoApi, type FaqPage } from '@/api/info';
import { promoApi, type LoyaltyTierInfo } from '@/api/promo';
import { ticketsApi } from '@/api/tickets';
import { ultimaAgreementApi } from '@/api/ultimaAgreement';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import {
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
  ultimaPanelClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

type InfoTabId = 'faq' | 'rules' | 'agreement' | 'privacy' | 'offer' | 'loyalty';

type InfoTab = {
  id: InfoTabId;
  label: string;
  description: string;
  icon: ReactNode;
};

const InfoIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 11.25v5M12 7.75h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DocumentIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M7.5 3.5h6.2L18.5 8v12.5h-11A2 2 0 0 1 5.5 18.5v-13a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M13.5 3.5V8h5M8.5 12h7M8.5 15.5h7" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const QuestionIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M9.4 8.2a3.1 3.1 0 0 1 5.3 2.2c0 1.9-1.5 2.7-2.4 3.2-.5.3-.8.7-.8 1.4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M12 18h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ShieldIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 3.3 5.2 6v5.4c0 4.2 2.8 8 6.8 9.3 4-1.3 6.8-5.1 6.8-9.3V6L12 3.3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="m9 12.3 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const StarIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="m12 3.8 2.5 5 5.5.8-4 3.9 1 5.5-5-2.6L7 19l1-5.5-4-3.9 5.5-.8 2.5-5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
  >
    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const sanitizeHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'i',
      'u',
      'strong',
      'em',
      'a',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
      's',
      'del',
      'ins',
      'span',
      'div',
      'tg-spoiler',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'start'],
    ALLOW_DATA_ATTR: false,
  });

const formatContent = (content: string): string => {
  const value = (content || '').trim();
  if (!value) return '';

  if (/<(p|div|h[1-6]|ul|ol|blockquote)\b/i.test(value)) {
    return sanitizeHtml(value);
  }

  return sanitizeHtml(
    value
      .split(/\n\n+/)
      .map((paragraph) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';

        if (/^#{1,4}\s/.test(trimmed)) {
          const level = trimmed.match(/^(#{1,4})/)?.[1].length ?? 1;
          const text = trimmed.replace(/^#{1,4}\s*/, '');
          return `<h${level}>${text}</h${level}>`;
        }

        if (/^[-\u2022]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
          const lines = trimmed.split('\n');
          const firstLine = lines[0] ?? '';
          const isOrdered = /^\d+[.)]\s/.test(firstLine);
          const startNum = isOrdered ? parseInt(firstLine.match(/^(\d+)/)?.[1] || '1', 10) : 1;
          const listItems = lines
            .map((line) => line.replace(/^[-\u2022]\s*/, '').replace(/^\d+[.)]\s*/, ''))
            .filter((line) => line.trim())
            .map((line) => `<li>${line}</li>`)
            .join('');
          return isOrdered ? `<ol start="${startNum}">${listItems}</ol>` : `<ul>${listItems}</ul>`;
        }

        return `<p>${trimmed.split('\n').join('<br/>')}</p>`;
      })
      .filter(Boolean)
      .join(''),
  );
};

function LoadingState() {
  return (
    <div className="flex min-h-[180px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/35 border-t-transparent" />
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${ultimaPaneClassName} p-4 text-center text-sm text-white/60`}
      style={ultimaPaneSurfaceStyle}
    >
      {children}
    </div>
  );
}

function HtmlContent({
  content,
  updatedAt,
  updatedAtLabel,
}: {
  content: string;
  updatedAt?: string | null;
  updatedAtLabel: (value: string) => string | null;
}) {
  const html = useMemo(() => formatContent(content), [content]);
  const dateLabel = updatedAt ? updatedAtLabel(updatedAt) : null;

  if (!html) return null;

  return (
    <div className="space-y-4">
      <div
        className="prose prose-invert text-white/84 max-w-none text-[14px] leading-[1.7] [&_a]:break-all [&_a]:text-[#5de8c3] [&_a]:underline [&_blockquote]:rounded-[20px] [&_blockquote]:border [&_blockquote]:border-white/10 [&_blockquote]:bg-white/[0.04] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_h1]:mb-3 [&_h1]:text-[30px] [&_h1]:font-semibold [&_h1]:leading-[1.05] [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:leading-[1.1] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-[20px] [&_h3]:font-semibold [&_li]:mb-2 [&_p]:mb-4 [&_strong]:font-semibold"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {dateLabel ? (
        <p className="text-white/48 border-t border-white/10 pt-3 text-[12px]">{dateLabel}</p>
      ) : null}
    </div>
  );
}

export function UltimaInfo() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [activeTab, setActiveTab] = useState<InfoTabId>('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const tabs: InfoTab[] = useMemo(
    () => [
      {
        id: 'faq',
        label: t('info.faq', { defaultValue: 'FAQ' }),
        description: t('ultimaInfo.faqDescription', {
          defaultValue: 'Ответы на частые вопросы по сервису.',
        }),
        icon: <QuestionIcon />,
      },
      {
        id: 'rules',
        label: t('info.rules', { defaultValue: 'Правила' }),
        description: t('ultimaInfo.rulesDescription', {
          defaultValue: 'Правила использования и ограничения сервиса.',
        }),
        icon: <DocumentIcon />,
      },
      {
        id: 'agreement',
        label: t('profile.termsTitle', { defaultValue: 'Пользовательское соглашение' }),
        description: t('ultimaInfo.agreementDescription', {
          defaultValue: 'Условия обслуживания в Ultima-кабинете.',
        }),
        icon: <DocumentIcon />,
      },
      {
        id: 'privacy',
        label: t('info.privacy', { defaultValue: 'Политика' }),
        description: t('ultimaInfo.privacyDescription', {
          defaultValue: 'Политика обработки и хранения данных.',
        }),
        icon: <ShieldIcon />,
      },
      {
        id: 'offer',
        label: t('info.offer', { defaultValue: 'Оферта' }),
        description: t('ultimaInfo.offerDescription', {
          defaultValue: 'Публичная оферта и условия оплаты.',
        }),
        icon: <DocumentIcon />,
      },
      {
        id: 'loyalty',
        label: t('info.loyalty', { defaultValue: 'Лояльность' }),
        description: t('ultimaInfo.loyaltyDescription', {
          defaultValue: 'Уровни, скидки и прогресс программы лояльности.',
        }),
        icon: <StarIcon />,
      },
    ],
    [t],
  );

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]!;

  const { data: faqPages, isLoading: faqLoading } = useQuery({
    queryKey: ['faq-pages'],
    queryFn: infoApi.getFaqPages,
    enabled: activeTab === 'faq',
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: infoApi.getRules,
    enabled: activeTab === 'rules',
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const { data: agreement, isLoading: agreementLoading } = useQuery({
    queryKey: ['ultima-agreement', i18n.language],
    queryFn: () => ultimaAgreementApi.getAgreement(i18n.language || 'ru'),
    enabled: activeTab === 'agreement',
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const { data: privacy, isLoading: privacyLoading } = useQuery({
    queryKey: ['privacy-policy'],
    queryFn: infoApi.getPrivacyPolicy,
    enabled: activeTab === 'privacy',
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const { data: offer, isLoading: offerLoading } = useQuery({
    queryKey: ['public-offer'],
    queryFn: infoApi.getPublicOffer,
    enabled: activeTab === 'offer',
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const { data: loyaltyData, isLoading: loyaltyLoading } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: promoApi.getLoyaltyTiers,
    enabled: activeTab === 'loyalty',
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const title = t('nav.info', { defaultValue: 'Информация' });
  const subtitle = t('ultimaInfo.subtitle', {
    defaultValue: 'FAQ, правила, соглашение, документы и условия программы лояльности.',
  });
  const emptyLabel = t('info.noContent', { defaultValue: 'Контент не заполнен' });

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(i18n.language || 'ru', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const updatedAtLabel = (value: string) => {
    const label = formatDate(value);
    if (!label) return null;
    return t('common.updatedAtDate', {
      defaultValue: `Обновлено ${label}`,
      date: label,
    });
  };

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

  const bottomNav = (
    <UltimaBottomNav
      active="profile"
      onProfileClick={() => navigate('/profile')}
      onSupportClick={openSupport}
    />
  );

  const renderTabs = (vertical = false) => (
    <div className={cn(vertical ? 'grid gap-2' : 'flex gap-2 overflow-x-auto pb-1')}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex min-h-[44px] shrink-0 items-center gap-2 rounded-[18px] border px-3 py-2 text-left text-[13px] font-medium transition',
              vertical ? 'w-full' : 'whitespace-nowrap',
              isActive
                ? 'border-emerald-200/32 bg-emerald-300/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-white/62 hover:border-white/18 hover:text-white/84 border-white/10 bg-white/[0.04] hover:bg-white/[0.07]',
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
              {tab.icon}
            </span>
            <span className="min-w-0 break-words">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  const renderFaq = () => {
    if (faqLoading) return <LoadingState />;
    if (!faqPages || faqPages.length === 0) {
      return <EmptyState>{t('info.noFaq', { defaultValue: 'FAQ пока не заполнен' })}</EmptyState>;
    }

    return (
      <div className="space-y-2.5">
        {faqPages.map((faq: FaqPage) => {
          const expanded = expandedFaq === faq.id;
          return (
            <article key={faq.id} className={ultimaPaneClassName} style={ultimaPaneSurfaceStyle}>
              <button
                type="button"
                onClick={() => setExpandedFaq(expanded ? null : faq.id)}
                className="flex min-h-[54px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 break-words text-[14px] font-medium leading-snug text-white/90">
                  {faq.title}
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60">
                  <ChevronIcon expanded={expanded} />
                </span>
              </button>
              {expanded ? (
                <div className="border-t border-white/10 px-4 pb-4 pt-3">
                  <HtmlContent content={faq.content} updatedAtLabel={updatedAtLabel} />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  };

  const renderDocument = (
    content: string | undefined,
    updatedAt: string | null | undefined,
    isLoading: boolean,
  ) => {
    if (isLoading) return <LoadingState />;
    if (!content) return <EmptyState>{emptyLabel}</EmptyState>;

    const html = formatContent(content);
    if (!html) return <EmptyState>{emptyLabel}</EmptyState>;

    return <HtmlContent content={content} updatedAt={updatedAt} updatedAtLabel={updatedAtLabel} />;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(i18n.language || 'ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const getDiscountRows = (tier: LoyaltyTierInfo) => {
    const rows: string[] = [];
    if (tier.server_discount_percent > 0) {
      rows.push(
        t('ultimaInfo.serverDiscount', {
          defaultValue: 'Серверы: {{value}}%',
          value: tier.server_discount_percent,
        }),
      );
    }
    if (tier.traffic_discount_percent > 0) {
      rows.push(
        t('ultimaInfo.trafficDiscount', {
          defaultValue: 'Трафик: {{value}}%',
          value: tier.traffic_discount_percent,
        }),
      );
    }
    if (tier.device_discount_percent > 0) {
      rows.push(
        t('ultimaInfo.deviceDiscount', {
          defaultValue: 'Устройства: {{value}}%',
          value: tier.device_discount_percent,
        }),
      );
    }
    Object.entries(tier.period_discounts).forEach(([period, discount]) => {
      if (discount > 0) {
        rows.push(
          t('ultimaInfo.periodDiscount', {
            defaultValue: '{{period}} дней: {{value}}%',
            period,
            value: discount,
          }),
        );
      }
    });
    return rows;
  };

  const renderLoyalty = () => {
    if (loyaltyLoading) return <LoadingState />;
    if (!loyaltyData || loyaltyData.tiers.length === 0) {
      return (
        <EmptyState>
          {t('info.noLoyaltyTiers', { defaultValue: 'Уровни лояльности пока не настроены' })}
        </EmptyState>
      );
    }

    return (
      <div className="space-y-3">
        <section className={ultimaPaneClassName} style={ultimaPaneSurfaceStyle}>
          <div className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-white/46 text-[11px] font-medium uppercase">
                  {t('info.statusCurrent', { defaultValue: 'Текущий статус' })}
                </p>
                <p className="mt-1 text-[22px] font-semibold leading-none text-white">
                  {loyaltyData.current_tier_name ||
                    t('common.notSpecified', { defaultValue: 'Не указан' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/46 text-[11px] font-medium uppercase">
                  {t('info.loyaltySpent', { defaultValue: 'Потрачено' })}
                </p>
                <p className="mt-1 text-[18px] font-semibold text-white/90">
                  {formatCurrency(loyaltyData.current_spent_rubles)}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#5de8c3]"
                style={{ width: `${Math.min(100, Math.max(0, loyaltyData.progress_percent))}%` }}
              />
            </div>
            {loyaltyData.next_tier_name ? (
              <p className="text-white/58 mt-2 text-[12px]">
                {t('info.nextTier', {
                  defaultValue: 'Следующий уровень: {{name}}',
                  name: loyaltyData.next_tier_name,
                })}
              </p>
            ) : null}
          </div>
        </section>

        <div className="grid gap-2.5 lg:grid-cols-2">
          {loyaltyData.tiers.map((tier) => {
            const discounts = getDiscountRows(tier);
            return (
              <article key={tier.id} className={ultimaPaneClassName} style={ultimaPaneSurfaceStyle}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words text-[17px] font-semibold leading-tight text-white">
                        {tier.name}
                      </h3>
                      <p className="text-white/54 mt-1 text-[12px]">
                        {formatCurrency(tier.threshold_rubles)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                        tier.is_current
                          ? 'border-emerald-200/24 bg-emerald-300/12 text-emerald-50'
                          : tier.is_achieved
                            ? 'border-white/12 bg-white/[0.06] text-white/70'
                            : 'text-white/42 border-white/10 bg-white/[0.04]',
                      )}
                    >
                      {tier.is_current
                        ? t('info.statusCurrent', { defaultValue: 'Текущий' })
                        : tier.is_achieved
                          ? t('info.statusAchieved', { defaultValue: 'Достигнут' })
                          : t('info.statusLocked', { defaultValue: 'Закрыт' })}
                    </span>
                  </div>
                  {discounts.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {discounts.map((discount) => (
                        <span
                          key={`${tier.id}-${discount}`}
                          className="text-white/66 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px]"
                        >
                          {discount}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/48 mt-3 text-[12px]">
                      {t('ultimaInfo.noDiscounts', { defaultValue: 'Скидки для уровня не заданы' })}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'faq') return renderFaq();
    if (activeTab === 'rules')
      return renderDocument(rules?.content, rules?.updated_at, rulesLoading);
    if (activeTab === 'agreement') {
      return renderDocument(agreement?.content, agreement?.updated_at, agreementLoading);
    }
    if (activeTab === 'privacy') {
      return renderDocument(privacy?.content, privacy?.updated_at, privacyLoading);
    }
    if (activeTab === 'offer')
      return renderDocument(offer?.content, offer?.updated_at, offerLoading);
    return renderLoyalty();
  };

  if (isDesktop) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-reading-desktop">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<InfoIcon className="h-6 w-6" />}
          eyebrow={t('nav.profile', { defaultValue: 'Профиль' })}
          title={title}
          subtitle={subtitle}
          metrics={[
            {
              label: t('ultimaInfo.sectionsMetric', { defaultValue: 'Разделы' }),
              value: String(tabs.length),
              hint: t('ultimaInfo.sectionsHint', {
                defaultValue: 'FAQ, правила, соглашение, политика, оферта и лояльность.',
              }),
            },
            {
              label: t('ultimaInfo.currentMetric', { defaultValue: 'Открыто' }),
              value: activeTabConfig.label,
              hint: activeTabConfig.description,
            },
          ]}
          aside={
            <>
              <UltimaDesktopPanel
                title={t('ultimaInfo.sectionsTitle', { defaultValue: 'Разделы' })}
                subtitle={t('ultimaInfo.sectionsSubtitle', {
                  defaultValue: 'Выберите нужный документ или справочный блок.',
                })}
              >
                {renderTabs(true)}
              </UltimaDesktopPanel>
              <UltimaDesktopPanel
                title={t('nav.support', { defaultValue: 'Поддержка' })}
                subtitle={t('ultimaInfo.supportSubtitle', {
                  defaultValue: 'Если ответа нет в информации, откройте обращение.',
                })}
              >
                <button
                  type="button"
                  onClick={openSupport}
                  className="ultima-btn-pill ultima-btn-primary w-full px-5 py-3 text-sm"
                >
                  {t('support.title', { defaultValue: 'Поддержка' })}
                </button>
              </UltimaDesktopPanel>
            </>
          }
          bottomNav={bottomNav}
        >
          <UltimaDesktopPanel title={activeTabConfig.label} subtitle={activeTabConfig.description}>
            <div className="max-h-[min(58svh,720px)] overflow-y-auto pr-1">{renderContent()}</div>
          </UltimaDesktopPanel>
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <section
          className={`${ultimaPanelClassName} mb-3 p-4`}
          style={{
            borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 28%, transparent)',
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-aura) 18%, transparent), color-mix(in srgb, var(--ultima-color-secondary) 68%, transparent))',
          }}
        >
          <div className="text-white/82 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]">
            <InfoIcon className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-[clamp(29px,7.6vw,36px)] font-semibold leading-[1] text-white">
            {title}
          </h1>
          <p className="text-white/62 mt-2 text-[13px] leading-[1.45]">{subtitle}</p>
        </section>

        <section
          className={`${ultimaPanelClassName} flex min-h-0 flex-1 flex-col p-3.5`}
          style={ultimaSurfaceStyle}
        >
          {renderTabs(false)}
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">{renderContent()}</div>
        </section>

        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">{bottomNav}</div>
        </div>
      </div>
    </div>
  );
}

export default UltimaInfo;
