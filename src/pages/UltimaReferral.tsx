import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  BadgePercent,
  Check,
  ChevronDown,
  Clock3,
  Coins,
  Copy,
  HandCoins,
  Share2,
  UserCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { brandingApi } from '@/api/branding';
import { partnerApi } from '@/api/partners';
import { referralApi } from '@/api/referral';
import { withdrawalApi } from '@/api/withdrawals';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { useCurrency } from '@/hooks/useCurrency';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { trackAnalyticsEvent } from '@/utils/analyticsEvents';
import { copyToClipboard } from '@/utils/clipboard';
import { getReferralBonusParts } from '@/utils/referralBonus';

const PREVIEW_LIMIT = 5;
const ultimaCardClassName = 'ultima-offers-section';

const statusClassMap: Record<string, string> = {
  completed: 'ultima-offers-line ultima-offers-fill ultima-offers-accent',
  approved: 'ultima-offers-line ultima-offers-fill ultima-offers-accent',
  pending: 'ultima-offers-line ultima-offers-fill ultima-offers-accent',
  rejected: 'ultima-offers-line ultima-offers-fill ultima-offers-accent',
  cancelled: 'ultima-offers-line ultima-offers-fill ultima-offers-accent',
};

const getStatusClass = (status: string) =>
  statusClassMap[status] ?? 'ultima-offers-line ultima-offers-fill ultima-offers-muted';

type MetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'info';
};

function Metric({ label, value }: MetricProps) {
  return (
    <div className="ultima-offers-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionHeading({ title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <header className="ultima-offers-section-heading">
      <h2>{title}</h2>
      {hint ? <p>{hint}</p> : null}
    </header>
  );
}

function ExpandButton({
  expanded,
  hiddenCount,
  onClick,
  showMoreLabel,
  showLessLabel,
}: {
  expanded: boolean;
  hiddenCount: number;
  onClick: () => void;
  showMoreLabel: string;
  showLessLabel: string;
}) {
  if (hiddenCount <= 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="ultima-offers-line ultima-offers-muted mt-2 flex min-h-[40px] w-full items-center justify-center gap-2 border-t pt-2 text-[13px] font-medium transition-colors"
    >
      {expanded ? showLessLabel : showMoreLabel}
      <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
    </button>
  );
}

export function UltimaReferral() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatPositive, formatWithCurrency } = useCurrency();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [copied, setCopied] = useState(false);
  const [showAllReferrals, setShowAllReferrals] = useState(false);
  const [showAllEarnings, setShowAllEarnings] = useState(false);
  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);

  const { data: info, isLoading } = useQuery({
    queryKey: ['referral-info'],
    queryFn: referralApi.getReferralInfo,
    placeholderData: (previousData) => previousData,
  });

  const { data: terms } = useQuery({
    queryKey: ['referral-terms'],
    queryFn: referralApi.getReferralTerms,
    placeholderData: (previousData) => previousData,
  });

  const { data: referralList } = useQuery({
    queryKey: ['referral-list'],
    queryFn: () => referralApi.getReferralList({ per_page: 20 }),
    placeholderData: (previousData) => previousData,
  });

  const { data: earnings } = useQuery({
    queryKey: ['referral-earnings'],
    queryFn: () => referralApi.getReferralEarnings({ per_page: 20 }),
    placeholderData: (previousData) => previousData,
  });

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: brandingApi.getBranding,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const { data: partnerStatus } = useQuery({
    queryKey: ['partner-status'],
    queryFn: partnerApi.getStatus,
    placeholderData: (previousData) => previousData,
  });

  const partnerStatusValue = partnerStatus?.partner_status ?? 'none';
  const isPartner = partnerStatusValue === 'approved';
  const showApplySection = partnerStatusValue === 'none';
  const showPendingSection = partnerStatusValue === 'pending';
  const showRejectedSection = partnerStatusValue === 'rejected';
  const showPartnerSection = terms?.partner_section_visible !== false;

  const { data: withdrawalBalance } = useQuery({
    queryKey: ['withdrawal-balance'],
    queryFn: withdrawalApi.getBalance,
    enabled: isPartner,
    placeholderData: (previousData) => previousData,
  });

  const { data: withdrawalHistory } = useQuery({
    queryKey: ['withdrawal-history'],
    queryFn: withdrawalApi.getHistory,
    enabled: isPartner,
    placeholderData: (previousData) => previousData,
  });

  const cancelWithdrawalMutation = useMutation({
    mutationFn: withdrawalApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-balance'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-history'] });
    },
  });

  const dateFormatter = new Intl.DateTimeFormat(i18n.language || 'ru', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formatDate = (value: string) => dateFormatter.format(new Date(value));
  const referralLink = info?.referral_code
    ? `${window.location.origin}/login?ref=${info.referral_code}`
    : '';

  const copyLink = async () => {
    if (!referralLink) return;
    trackAnalyticsEvent('ultima_referral_link_copy', {
      source: 'referral_page',
      commission_percent: info?.commission_percent || 0,
    });
    await copyToClipboard(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const shareLink = () => {
    if (!referralLink) return;
    trackAnalyticsEvent('ultima_referral_link_share', {
      source: 'referral_page',
      commission_percent: info?.commission_percent || 0,
      native_share: Boolean(navigator.share),
    });
    const shareText = t('referral.shareMessage', {
      percent: info?.commission_percent || 0,
      botName: branding?.name || import.meta.env.VITE_APP_NAME || 'Cabinet',
    });

    if (navigator.share) {
      void navigator.share({ title: t('referral.title'), text: shareText, url: referralLink });
      return;
    }

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink,
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  const formatReferralDaysBonus = (days: number) =>
    t('referral.terms.subscriptionDaysBonus', {
      count: days,
      defaultValue: '+{{count}} d. subscription',
    });
  const hasFirstTopupBonus = Boolean(
    terms && ((terms.first_topup_bonus_rubles ?? 0) > 0 || (terms.first_topup_bonus_days ?? 0) > 0),
  );
  const hasInviterBonus = Boolean(
    terms && ((terms.inviter_bonus_rubles ?? 0) > 0 || (terms.inviter_bonus_days ?? 0) > 0),
  );
  const firstTopupBonus =
    terms && hasFirstTopupBonus
      ? getReferralBonusParts({
          rubles: terms.first_topup_bonus_rubles,
          days: terms.first_topup_bonus_days,
          formatPositive,
          formatDays: formatReferralDaysBonus,
        })
      : null;
  const inviterBonus =
    terms && hasInviterBonus
      ? getReferralBonusParts({
          rubles: terms.inviter_bonus_rubles,
          days: terms.inviter_bonus_days,
          formatPositive,
          formatDays: formatReferralDaysBonus,
        })
      : null;
  const referralBenefitItems = [
    inviterBonus?.primary
      ? t('referral.inviterBenefitShort', {
          value: inviterBonus.primary,
          defaultValue: 'Вам {{value}}',
        })
      : null,
    firstTopupBonus?.primary
      ? t('referral.friendBenefitShort', {
          value: firstTopupBonus.primary,
          defaultValue: 'Другу {{value}}',
        })
      : null,
  ].filter((item): item is string => Boolean(item));

  const referrals = referralList?.items ?? [];
  const earningsItems = earnings?.items ?? [];
  const withdrawalItems = withdrawalHistory?.items ?? [];
  const visibleReferrals = showAllReferrals ? referrals : referrals.slice(0, PREVIEW_LIMIT);
  const visibleEarnings = showAllEarnings ? earningsItems : earningsItems.slice(0, PREVIEW_LIMIT);
  const visibleWithdrawals = showAllWithdrawals
    ? withdrawalItems
    : withdrawalItems.slice(0, PREVIEW_LIMIT);
  const activeReferrals =
    info?.active_referrals ?? referrals.filter((item) => item.has_paid).length;
  const showMoreLabel = (count: number) =>
    t('referral.showMore', { count, defaultValue: `Показать ещё ${count}` });
  const showLessLabel = t('referral.showLess', { defaultValue: 'Свернуть' });

  const metrics = [
    {
      icon: <UsersRound className="h-4 w-4" />,
      label: t('referral.stats.totalReferrals'),
      value: String(info?.total_referrals || 0),
      tone: 'default' as const,
    },
    {
      icon: <UserCheck className="h-4 w-4" />,
      label: t('referral.stats.activeReferrals'),
      value: String(activeReferrals),
      tone: 'success' as const,
    },
    {
      icon: <Coins className="h-4 w-4" />,
      label: t('referral.stats.totalEarnings'),
      value: formatPositive(info?.total_earnings_rubles || 0),
      tone: 'info' as const,
    },
  ];

  const inviteCard = (
    <section
      data-testid="ultima-referral-hero"
      className={cn(ultimaCardClassName, 'ultima-offers-invite')}
    >
      <div className="flex items-start gap-3 lg:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="ultima-offers-text mt-2 max-w-[24ch] text-[22px] font-semibold leading-snug lg:text-[26px]">
            {t('referral.inviteTitle', {
              defaultValue: 'Приглашайте друзей и получайте бонусы',
            })}
          </h2>
          <p className="ultima-offers-muted mt-2 max-w-[62ch] text-[13px] leading-relaxed lg:text-[13px]">
            {t('referral.inviteSubtitle', {
              percent: info?.commission_percent || 0,
              defaultValue: 'Друг получает бонус, а вы — вознаграждение после его оплаты.',
            })}
          </p>
        </div>
      </div>

      {referralBenefitItems.length > 0 ? (
        <div className="ultima-offers-benefits">
          {referralBenefitItems.map((item) => (
            <span key={item} className="ultima-offers-muted">
              {item}
            </span>
          ))}
        </div>
      ) : null}

      <div className="ultima-offers-line ultima-offers-fill mt-4 flex min-w-0 items-center gap-2 rounded-[8px] border p-2">
        <p
          data-testid="ultima-referral-link"
          className="ultima-offers-muted min-w-0 flex-1 truncate px-1 text-[13px] lg:text-[13px]"
        >
          {referralLink || '—'}
        </p>
        <button
          type="button"
          data-testid="ultima-referral-copy"
          onClick={copyLink}
          disabled={!referralLink}
          className="ultima-offers-line ultima-offers-fill ultima-offers-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border transition-colors disabled:opacity-40"
          aria-label={copied ? t('referral.copied') : t('referral.copyLink')}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-3">
        <button
          type="button"
          data-testid="ultima-referral-share"
          onClick={shareLink}
          disabled={!referralLink}
          className="ultima-btn-pill ultima-btn-primary flex min-h-[44px] w-full items-center justify-center gap-2 px-3 text-[13px] disabled:opacity-40"
        >
          <Share2 className="h-4 w-4" />
          {t('referral.shareButton')}
        </button>
      </div>
    </section>
  );

  const mobileStats = (
    <section
      data-testid="ultima-referral-stats"
      className={cn(ultimaCardClassName, 'ultima-offers-metrics')}
    >
      {metrics.map((metric) => (
        <Metric key={metric.label} {...metric} />
      ))}
    </section>
  );

  const termsCard = terms ? (
    <section data-testid="ultima-referral-terms" className={ultimaCardClassName}>
      <div className="flex items-start justify-between gap-3">
        <SectionHeading
          icon={<BadgePercent className="h-4 w-4" />}
          title={t('referral.terms.title')}
          hint={t('referral.howItWorks', {
            defaultValue: 'Бонусы начисляются после выполнения условий программы.',
          })}
        />
        <span className="ultima-offers-line ultima-offers-fill ultima-offers-accent shrink-0 rounded-full border px-2.5 py-1 text-[13px] font-semibold">
          {terms.commission_percent}%
        </span>
      </div>

      <div className="ultima-offers-terms">
        {[
          [t('referral.terms.minTopup'), formatWithCurrency(terms.minimum_topup_rubles ?? 0)],
          [t('referral.terms.newUserBonus'), firstTopupBonus?.primary ?? '—'],
          [t('referral.terms.commission'), `${terms.commission_percent}%`],
          [t('referral.terms.inviterBonus'), inviterBonus?.primary ?? '—'],
        ].map(([label, value], index) => (
          <div key={String(label)} className={cn('ultima-offers-term-row')}>
            <p className="ultima-offers-muted text-[13px] font-medium uppercase leading-snug">
              {label}
            </p>
            <p className="ultima-offers-text mt-1.5 break-words text-[13px] font-semibold leading-snug">
              {value}
            </p>
            {index === 1 && firstTopupBonus?.secondary ? (
              <p className="ultima-offers-accent mt-0.5 text-[13px]">{firstTopupBonus.secondary}</p>
            ) : null}
            {index === 3 && inviterBonus?.secondary ? (
              <p className="ultima-offers-accent mt-0.5 text-[13px]">{inviterBonus.secondary}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const referralsCard = (
    <section data-testid="ultima-referral-list" className={ultimaCardClassName}>
      <SectionHeading
        icon={<UsersRound className="h-4 w-4" />}
        title={t('referral.yourReferrals')}
        hint={t('referral.referralsHint', {
          defaultValue: 'Кто зарегистрировался по вашей ссылке и выполнил условие.',
        })}
      />

      {visibleReferrals.length > 0 ? (
        <div className="mt-4">
          {visibleReferrals.map((ref) => (
            <div
              key={ref.id}
              className="ultima-offers-line flex min-h-[54px] items-center justify-between gap-3 border-t py-3 first:border-t-0 first:pt-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="ultima-offers-line ultima-offers-fill ultima-offers-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold">
                  {(ref.first_name || ref.username || String(ref.id))
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="ultima-offers-text truncate text-[13px] font-medium">
                    {ref.first_name || ref.username || t('referral.anonymousUser', { id: ref.id })}
                  </p>
                  <p className="ultima-offers-muted mt-0.5 text-[13px]">
                    {formatDate(ref.created_at)}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2.5 py-1 text-[13px] font-semibold',
                  ref.has_paid
                    ? 'ultima-offers-line ultima-offers-fill ultima-offers-accent'
                    : 'ultima-offers-line ultima-offers-fill ultima-offers-muted',
                )}
              >
                {ref.has_paid ? t('referral.status.paid') : t('referral.status.pending')}
              </span>
            </div>
          ))}
          <ExpandButton
            expanded={showAllReferrals}
            hiddenCount={Math.max(referrals.length - PREVIEW_LIMIT, 0)}
            onClick={() => setShowAllReferrals((value) => !value)}
            showMoreLabel={showMoreLabel(Math.max(referrals.length - PREVIEW_LIMIT, 0))}
            showLessLabel={showLessLabel}
          />
        </div>
      ) : (
        <div className="ultima-offers-line mt-4 border-t pt-4">
          <p className="ultima-offers-muted text-[13px] leading-relaxed">
            {t('referral.noReferrals')}
          </p>
          <button
            type="button"
            onClick={shareLink}
            disabled={!referralLink}
            className="ultima-offers-accent mt-3 inline-flex items-center gap-2 text-[13px] font-medium disabled:opacity-40"
          >
            {t('referral.shareButton')}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );

  const earningsCard = (
    <section data-testid="ultima-referral-earnings" className={ultimaCardClassName}>
      <SectionHeading
        icon={<HandCoins className="h-4 w-4" />}
        title={t('referral.earningsHistory')}
        hint={t('referral.earningsHint', {
          defaultValue: 'Последние начисления за приглашённых пользователей.',
        })}
      />

      {visibleEarnings.length > 0 ? (
        <div className="mt-4">
          {visibleEarnings.map((earning) => (
            <div
              key={earning.id}
              className="ultima-offers-line flex min-h-[54px] items-center justify-between gap-3 border-t py-3 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="ultima-offers-text truncate text-[13px] font-medium">
                  {earning.referral_first_name ||
                    earning.referral_username ||
                    t('referral.anonymousReferral')}
                </p>
                <p className="ultima-offers-muted mt-0.5 truncate text-[13px]">
                  {t(`referral.reasons.${earning.reason}`, { defaultValue: earning.reason })} ·{' '}
                  {formatDate(earning.created_at)}
                </p>
              </div>
              <p className="ultima-offers-accent shrink-0 text-[13px] font-semibold">
                {formatPositive(earning.amount_rubles)}
              </p>
            </div>
          ))}
          <ExpandButton
            expanded={showAllEarnings}
            hiddenCount={Math.max(earningsItems.length - PREVIEW_LIMIT, 0)}
            onClick={() => setShowAllEarnings((value) => !value)}
            showMoreLabel={showMoreLabel(Math.max(earningsItems.length - PREVIEW_LIMIT, 0))}
            showLessLabel={showLessLabel}
          />
        </div>
      ) : (
        <p className="ultima-offers-line ultima-offers-muted mt-4 border-t pt-4 text-[13px]">
          {t('referral.emptyEarnings', { defaultValue: 'Начислений пока нет.' })}
        </p>
      )}
    </section>
  );

  const partnerBody = (
    <div data-testid="ultima-referral-partner" className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <span className="ultima-offers-muted text-[13px] font-semibold uppercase">
          {t('referral.partnerStatusLabel', { defaultValue: 'Статус партнёра' })}
        </span>
        <span
          className={cn(
            'rounded-full border px-2.5 py-1 text-[13px]',
            getStatusClass(partnerStatusValue),
          )}
        >
          {t(`referral.partnerStatus.${partnerStatusValue}`, {
            defaultValue: partnerStatusValue,
          })}
        </span>
      </div>

      {showApplySection ? (
        <>
          <h2 className="ultima-offers-text mt-4 text-[17px] font-semibold">
            {t('referral.partner.becomePartner')}
          </h2>
          <p className="ultima-offers-muted mt-1.5 text-[13px] leading-relaxed">
            {t('referral.partner.becomePartnerDesc')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/referral/partner/apply')}
            className="ultima-btn-pill ultima-btn-primary mt-4 flex min-h-[42px] w-full items-center justify-center gap-2 px-4 text-[13px]"
          >
            {t('referral.partner.applyButton')}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </>
      ) : null}

      {showPendingSection ? (
        <>
          <h2 className="ultima-offers-accent mt-4 text-[17px] font-semibold">
            {t('referral.partner.underReview')}
          </h2>
          <p className="ultima-offers-muted mt-1.5 text-[13px] leading-relaxed">
            {t('referral.partner.underReviewDesc')}
          </p>
        </>
      ) : null}

      {showRejectedSection ? (
        <>
          <h2 className="ultima-offers-accent mt-4 text-[17px] font-semibold">
            {t('referral.partner.rejected')}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/referral/partner/apply')}
            className="ultima-offers-line ultima-offers-fill ultima-offers-accent mt-4 flex min-h-[42px] w-full items-center justify-center rounded-[7px] border px-4 text-[13px] font-medium"
          >
            {t('referral.partner.reapplyButton')}
          </button>
        </>
      ) : null}

      {isPartner && withdrawalBalance ? (
        <>
          <div className="ultima-offers-line ultima-offers-line mt-4 grid grid-cols-2 divide-x border-y py-3">
            <div className="min-w-0 pr-3">
              <p className="ultima-offers-muted text-[13px] uppercase">
                {t('referral.withdrawal.available')}
              </p>
              <p className="ultima-offers-accent mt-1.5 truncate text-[15px] font-semibold">
                {formatWithCurrency(withdrawalBalance.available_total / 100)}
              </p>
            </div>
            <div className="min-w-0 pl-3">
              <p className="ultima-offers-muted text-[13px] uppercase">
                {t('referral.withdrawal.pending')}
              </p>
              <p className="ultima-offers-accent mt-1.5 truncate text-[15px] font-semibold">
                {formatWithCurrency(withdrawalBalance.pending / 100)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/referral/withdrawal/request')}
            disabled={!withdrawalBalance.can_request}
            className="ultima-btn-pill ultima-btn-primary mt-4 flex min-h-[42px] w-full items-center justify-center gap-2 px-4 text-[13px] disabled:opacity-40"
          >
            <WalletCards className="h-4 w-4" />
            {t('referral.withdrawal.requestButton')}
          </button>
        </>
      ) : null}
    </div>
  );

  const mobilePartnerCard = showPartnerSection ? (
    <section className={ultimaCardClassName}>{partnerBody}</section>
  ) : null;

  const withdrawalHistoryCard =
    showPartnerSection && isPartner && withdrawalItems.length > 0 ? (
      <section className={ultimaCardClassName}>
        <SectionHeading
          icon={<Clock3 className="h-4 w-4" />}
          title={t('referral.withdrawal.history')}
          hint={t('referral.withdrawalHistoryHint', {
            defaultValue: 'Статусы последних запросов на вывод.',
          })}
        />
        <div className="mt-4">
          {visibleWithdrawals.map((item) => (
            <div
              key={item.id}
              className="ultima-offers-line border-t py-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ultima-offers-text text-[13px] font-semibold">
                    {formatWithCurrency(item.amount_rubles)}
                  </p>
                  <p className="ultima-offers-muted mt-0.5 text-[13px]">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[13px] font-semibold',
                    getStatusClass(item.status),
                  )}
                >
                  {t(`referral.withdrawal.status.${item.status}`, { defaultValue: item.status })}
                </span>
              </div>
              {item.status === 'pending' ? (
                <button
                  type="button"
                  onClick={() => cancelWithdrawalMutation.mutate(item.id)}
                  disabled={cancelWithdrawalMutation.isPending}
                  className="ultima-offers-accent mt-2 text-[13px] font-medium disabled:opacity-40"
                >
                  {t('common.cancel')}
                </button>
              ) : null}
            </div>
          ))}
          <ExpandButton
            expanded={showAllWithdrawals}
            hiddenCount={Math.max(withdrawalItems.length - PREVIEW_LIMIT, 0)}
            onClick={() => setShowAllWithdrawals((value) => !value)}
            showMoreLabel={showMoreLabel(Math.max(withdrawalItems.length - PREVIEW_LIMIT, 0))}
            showLessLabel={showLessLabel}
          />
        </div>
      </section>
    ) : null;

  const loadingContent = (
    <div data-testid="ultima-referral-loading" className="space-y-3">
      <div className={cn(ultimaCardClassName, 'h-[252px] animate-pulse')} />
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(ultimaCardClassName, 'h-[180px] animate-pulse')} />
        <div className={cn(ultimaCardClassName, 'h-[180px] animate-pulse')} />
      </div>
    </div>
  );

  const disabledContent = (
    <section
      className={cn(
        ultimaCardClassName,
        'flex min-h-[260px] flex-col items-center justify-center p-6 text-center',
      )}
    >
      <h2 className="ultima-offers-text mt-4 text-[18px] font-semibold">{t('referral.title')}</h2>
      <p className="ultima-offers-muted mt-2 max-w-[42ch] text-[13px] leading-relaxed">
        {t('referral.disabled')}
      </p>
    </section>
  );

  const mainContent = isLoading ? (
    loadingContent
  ) : terms && !terms.is_enabled ? (
    disabledContent
  ) : (
    <>
      {inviteCard}
      {!isDesktop ? mobileStats : null}
      {termsCard}
      <div className="ultima-offers-records">
        {referralsCard}
        {earningsCard}
      </div>
      {!isDesktop ? mobilePartnerCard : null}
      {withdrawalHistoryCard}
    </>
  );

  const bottomNav = <UltimaBottomNav active="profile" />;

  if (isDesktop) {
    return (
      <div
        data-testid="ultima-referral-page"
        className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop ultima-shell-muted-aura ultima-offers-page ultima-referral-page"
      >
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<UsersRound className="h-5 w-5" />}
          eyebrow={t('nav.referral', { defaultValue: 'Рефералы' })}
          title={t('referral.title')}
          subtitle={t('referral.inviteSubtitle', {
            percent: info?.commission_percent || 0,
            defaultValue: 'Друг получает бонус, а вы — вознаграждение после его оплаты.',
          })}
          metrics={metrics.map((metric) => ({
            label: metric.label,
            value: metric.value,
            hint:
              metric.tone === 'success'
                ? t('referral.desktopActiveHint', {
                    defaultValue: 'Выполнили условие программы.',
                  })
                : metric.tone === 'info'
                  ? t('referral.desktopEarningsHint', {
                      defaultValue: 'Все начисления за приглашения.',
                    })
                  : t('referral.desktopReferralsHint', {
                      defaultValue: 'Зарегистрировались по вашей ссылке.',
                    }),
          }))}
          aside={
            showPartnerSection ? (
              <UltimaDesktopPanel
                title={t('referral.desktopAsideTitle', { defaultValue: 'Партнёрская программа' })}
                subtitle={t('referral.desktopAsideHint', {
                  defaultValue: 'Статус партнёра и вывод вознаграждений.',
                })}
              >
                {partnerBody}
              </UltimaDesktopPanel>
            ) : undefined
          }
          bottomNav={bottomNav}
        >
          <div data-testid="ultima-referral-content" className="space-y-4">
            {mainContent}
          </div>
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div
      data-testid="ultima-referral-page"
      className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-muted-aura ultima-offers-page ultima-referral-page"
    >
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <section className="ultima-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 pt-[clamp(8px,2vh,16px)]">
          <header className="ultima-offers-mobile-heading">
            <div className="min-w-0">
              <h1 className="ultima-offers-text mt-1 text-[25px] font-semibold leading-none">
                {t('referral.title')}
              </h1>
            </div>
          </header>

          <div data-testid="ultima-referral-content" className="space-y-3 pb-3">
            {mainContent}
          </div>
        </section>

        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">{bottomNav}</div>
        </div>
      </div>
    </div>
  );
}
