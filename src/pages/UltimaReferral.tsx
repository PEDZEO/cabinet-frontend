import { type CSSProperties, type ReactNode, useState } from 'react';
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
  Gift,
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
import {
  ultimaAccentSurfaceStyle,
  ultimaCardClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { useCurrency } from '@/hooks/useCurrency';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { trackAnalyticsEvent } from '@/utils/analyticsEvents';
import { copyToClipboard } from '@/utils/clipboard';
import { getReferralBonusParts } from '@/utils/referralBonus';

const PREVIEW_LIMIT = 5;
const defaultCardStyle: CSSProperties = ultimaSurfaceStyle;
const accentCardStyle: CSSProperties = ultimaAccentSurfaceStyle;

const statusClassMap: Record<string, string> = {
  completed: 'border-emerald-200/25 bg-emerald-300/[0.1] text-emerald-100',
  approved: 'border-sky-200/25 bg-sky-300/[0.1] text-sky-100',
  pending: 'border-amber-200/25 bg-amber-300/[0.1] text-amber-100',
  rejected: 'border-rose-200/25 bg-rose-300/[0.1] text-rose-100',
  cancelled: 'border-rose-200/25 bg-rose-300/[0.1] text-rose-100',
};

const getStatusClass = (status: string) =>
  statusClassMap[status] ?? 'border-white/[0.12] bg-white/[0.05] text-white/[0.72]';

type MetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'info';
};

function Metric({ icon, label, value, tone = 'default' }: MetricProps) {
  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0">
      <div className="flex items-center gap-1.5 text-white/[0.4]">
        {icon}
        <span className="truncate text-[8px] font-semibold uppercase">{label}</span>
      </div>
      <p
        className={cn(
          'mt-1.5 truncate text-[13px] font-semibold',
          tone === 'success'
            ? 'text-emerald-100'
            : tone === 'info'
              ? 'text-sky-100'
              : 'text-white/[0.94]',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeading({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border border-white/[0.08] bg-white/[0.04] text-emerald-100/[0.82]">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold leading-tight text-white/[0.94]">{title}</h2>
        {hint ? <p className="mt-1 text-[11px] leading-snug text-white/[0.46]">{hint}</p> : null}
      </div>
    </div>
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
      className="mt-2 flex min-h-[40px] w-full items-center justify-center gap-2 border-t border-white/[0.07] pt-2 text-[12px] font-medium text-white/[0.66] transition-colors hover:text-white"
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
      className={cn(ultimaCardClassName, 'relative overflow-hidden p-4 lg:p-6')}
      style={accentCardStyle}
    >
      <div className="flex items-start gap-3 lg:gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-emerald-100/[0.12] bg-emerald-300/[0.08] text-emerald-100 lg:h-12 lg:w-12">
          <Gift className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-semibold uppercase text-white/[0.42]">
              {t('referral.linkReady', { defaultValue: 'Ссылка готова' })}
            </span>
            <span className="rounded-full border border-emerald-200/[0.18] bg-emerald-300/[0.1] px-2.5 py-1 text-[10px] font-semibold text-emerald-50">
              {info?.commission_percent || 0}%
            </span>
          </div>
          <h2 className="mt-2 max-w-[24ch] text-[22px] font-semibold leading-[1.05] text-white/[0.98] lg:text-[30px]">
            {t('referral.inviteTitle', {
              defaultValue: 'Приглашайте друзей и получайте бонусы',
            })}
          </h2>
          <p className="mt-2 max-w-[62ch] text-[12px] leading-relaxed text-white/[0.56] lg:text-[13px]">
            {t('referral.inviteSubtitle', {
              percent: info?.commission_percent || 0,
              defaultValue: 'Друг получает бонус, а вы — вознаграждение после его оплаты.',
            })}
          </p>
        </div>
      </div>

      {referralBenefitItems.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {referralBenefitItems.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/[0.82]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex min-w-0 items-center gap-2 rounded-[8px] border border-white/[0.08] bg-black/[0.12] p-2">
        <p
          data-testid="ultima-referral-link"
          className="min-w-0 flex-1 truncate px-1 text-[11px] text-white/[0.68] lg:text-[12px]"
        >
          {referralLink || '—'}
        </p>
        <button
          type="button"
          data-testid="ultima-referral-copy"
          onClick={copyLink}
          disabled={!referralLink}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border border-white/[0.09] bg-white/[0.05] text-white/[0.78] transition-colors hover:bg-white/[0.09] disabled:opacity-40"
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
          className="ultima-btn-pill ultima-btn-primary flex min-h-[44px] w-full items-center justify-center gap-2 px-3 text-[12px] disabled:opacity-40"
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
      className={cn(ultimaCardClassName, 'grid grid-cols-3 divide-x divide-white/[0.07] p-4')}
      style={defaultCardStyle}
    >
      {metrics.map((metric) => (
        <Metric key={metric.label} {...metric} />
      ))}
    </section>
  );

  const termsCard = terms ? (
    <section
      data-testid="ultima-referral-terms"
      className={cn(ultimaCardClassName, 'p-4 lg:p-5')}
      style={defaultCardStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <SectionHeading
          icon={<BadgePercent className="h-4 w-4" />}
          title={t('referral.terms.title')}
          hint={t('referral.howItWorks', {
            defaultValue: 'Бонусы начисляются после выполнения условий программы.',
          })}
        />
        <span className="shrink-0 rounded-full border border-emerald-200/[0.18] bg-emerald-300/[0.1] px-2.5 py-1 text-[11px] font-semibold text-emerald-50">
          {terms.commission_percent}%
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 border-y border-white/[0.07] py-1">
        {[
          [t('referral.terms.minTopup'), formatWithCurrency(terms.minimum_topup_rubles ?? 0)],
          [t('referral.terms.newUserBonus'), firstTopupBonus?.primary ?? '—'],
          [t('referral.terms.commission'), `${terms.commission_percent}%`],
          [t('referral.terms.inviterBonus'), inviterBonus?.primary ?? '—'],
        ].map(([label, value], index) => (
          <div
            key={String(label)}
            className={cn(
              'min-w-0 px-3 py-3 first:pl-0 even:border-l even:border-white/[0.07]',
              index >= 2 && 'border-t border-white/[0.07]',
            )}
          >
            <p className="text-[9px] font-medium uppercase leading-snug text-white/[0.4]">
              {label}
            </p>
            <p className="mt-1.5 break-words text-[13px] font-semibold leading-snug text-white/[0.9]">
              {value}
            </p>
            {index === 1 && firstTopupBonus?.secondary ? (
              <p className="mt-0.5 text-[10px] text-emerald-100/[0.72]">
                {firstTopupBonus.secondary}
              </p>
            ) : null}
            {index === 3 && inviterBonus?.secondary ? (
              <p className="mt-0.5 text-[10px] text-emerald-100/[0.72]">{inviterBonus.secondary}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const referralsCard = (
    <section
      data-testid="ultima-referral-list"
      className={cn(ultimaCardClassName, 'min-w-0 p-4 lg:p-5')}
      style={defaultCardStyle}
    >
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
              className="flex min-h-[54px] items-center justify-between gap-3 border-t border-white/[0.07] py-3 first:border-t-0 first:pt-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[11px] font-semibold text-white/[0.7]">
                  {(ref.first_name || ref.username || String(ref.id))
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-white/[0.9]">
                    {ref.first_name || ref.username || t('referral.anonymousUser', { id: ref.id })}
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/[0.42]">
                    {formatDate(ref.created_at)}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold',
                  ref.has_paid
                    ? 'border-emerald-200/[0.18] bg-emerald-300/[0.1] text-emerald-100'
                    : 'border-white/[0.1] bg-white/[0.04] text-white/[0.58]',
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
        <div className="mt-4 border-t border-white/[0.07] pt-4">
          <p className="text-[12px] leading-relaxed text-white/[0.5]">
            {t('referral.noReferrals')}
          </p>
          <button
            type="button"
            onClick={shareLink}
            disabled={!referralLink}
            className="mt-3 inline-flex items-center gap-2 text-[12px] font-medium text-emerald-100 disabled:opacity-40"
          >
            {t('referral.shareButton')}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );

  const earningsCard = (
    <section
      data-testid="ultima-referral-earnings"
      className={cn(ultimaCardClassName, 'min-w-0 p-4 lg:p-5')}
      style={defaultCardStyle}
    >
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
              className="flex min-h-[54px] items-center justify-between gap-3 border-t border-white/[0.07] py-3 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-white/[0.9]">
                  {earning.referral_first_name ||
                    earning.referral_username ||
                    t('referral.anonymousReferral')}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-white/[0.42]">
                  {t(`referral.reasons.${earning.reason}`, { defaultValue: earning.reason })} ·{' '}
                  {formatDate(earning.created_at)}
                </p>
              </div>
              <p className="shrink-0 text-[13px] font-semibold text-emerald-100">
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
        <p className="mt-4 border-t border-white/[0.07] pt-4 text-[12px] text-white/[0.5]">
          {t('referral.emptyEarnings', { defaultValue: 'Начислений пока нет.' })}
        </p>
      )}
    </section>
  );

  const partnerBody = (
    <div data-testid="ultima-referral-partner" className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase text-white/[0.42]">
          {t('referral.partnerStatusLabel', { defaultValue: 'Статус партнёра' })}
        </span>
        <span
          className={cn(
            'rounded-full border px-2.5 py-1 text-[10px]',
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
          <h2 className="mt-4 text-[17px] font-semibold text-white/[0.94]">
            {t('referral.partner.becomePartner')}
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/[0.5]">
            {t('referral.partner.becomePartnerDesc')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/referral/partner/apply')}
            className="ultima-btn-pill ultima-btn-primary mt-4 flex min-h-[42px] w-full items-center justify-center gap-2 px-4 text-[12px]"
          >
            {t('referral.partner.applyButton')}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </>
      ) : null}

      {showPendingSection ? (
        <>
          <h2 className="mt-4 text-[17px] font-semibold text-amber-100">
            {t('referral.partner.underReview')}
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/[0.5]">
            {t('referral.partner.underReviewDesc')}
          </p>
        </>
      ) : null}

      {showRejectedSection ? (
        <>
          <h2 className="mt-4 text-[17px] font-semibold text-rose-100">
            {t('referral.partner.rejected')}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/referral/partner/apply')}
            className="mt-4 flex min-h-[42px] w-full items-center justify-center rounded-[7px] border border-rose-200/[0.16] bg-rose-300/[0.08] px-4 text-[12px] font-medium text-rose-50"
          >
            {t('referral.partner.reapplyButton')}
          </button>
        </>
      ) : null}

      {isPartner && withdrawalBalance ? (
        <>
          <div className="mt-4 grid grid-cols-2 divide-x divide-white/[0.07] border-y border-white/[0.07] py-3">
            <div className="min-w-0 pr-3">
              <p className="text-[9px] uppercase text-white/[0.4]">
                {t('referral.withdrawal.available')}
              </p>
              <p className="mt-1.5 truncate text-[15px] font-semibold text-emerald-100">
                {formatWithCurrency(withdrawalBalance.available_total / 100)}
              </p>
            </div>
            <div className="min-w-0 pl-3">
              <p className="text-[9px] uppercase text-white/[0.4]">
                {t('referral.withdrawal.pending')}
              </p>
              <p className="mt-1.5 truncate text-[15px] font-semibold text-amber-100">
                {formatWithCurrency(withdrawalBalance.pending / 100)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/referral/withdrawal/request')}
            disabled={!withdrawalBalance.can_request}
            className="ultima-btn-pill ultima-btn-primary mt-4 flex min-h-[42px] w-full items-center justify-center gap-2 px-4 text-[12px] disabled:opacity-40"
          >
            <WalletCards className="h-4 w-4" />
            {t('referral.withdrawal.requestButton')}
          </button>
        </>
      ) : null}
    </div>
  );

  const mobilePartnerCard = showPartnerSection ? (
    <section className={cn(ultimaCardClassName, 'p-4')} style={defaultCardStyle}>
      {partnerBody}
    </section>
  ) : null;

  const withdrawalHistoryCard =
    showPartnerSection && isPartner && withdrawalItems.length > 0 ? (
      <section className={cn(ultimaCardClassName, 'p-4 lg:p-5')} style={defaultCardStyle}>
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
              className="border-t border-white/[0.07] py-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-white/[0.9]">
                    {formatWithCurrency(item.amount_rubles)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/[0.42]">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[9px] font-semibold',
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
                  className="mt-2 text-[11px] font-medium text-rose-100/[0.82] disabled:opacity-40"
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
      <div className={cn(ultimaCardClassName, 'h-[252px] animate-pulse')} style={accentCardStyle} />
      <div className="grid grid-cols-2 gap-3">
        <div
          className={cn(ultimaCardClassName, 'h-[180px] animate-pulse')}
          style={defaultCardStyle}
        />
        <div
          className={cn(ultimaCardClassName, 'h-[180px] animate-pulse')}
          style={defaultCardStyle}
        />
      </div>
    </div>
  );

  const disabledContent = (
    <section
      className={cn(
        ultimaCardClassName,
        'flex min-h-[260px] flex-col items-center justify-center p-6 text-center',
      )}
      style={defaultCardStyle}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-white/[0.08] bg-white/[0.04] text-white/[0.6]">
        <UsersRound className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-[18px] font-semibold text-white/[0.9]">{t('referral.title')}</h2>
      <p className="mt-2 max-w-[42ch] text-[12px] leading-relaxed text-white/[0.5]">
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
      <div className="grid min-w-0 gap-3 lg:grid-cols-2 lg:gap-4">
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
        className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop ultima-shell-muted-aura"
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
      className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-muted-aura"
    >
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <section className="ultima-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 pt-[clamp(8px,2vh,16px)]">
          <header className="flex items-end justify-between gap-3 px-1">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase text-white/[0.4]">
                {t('nav.referral', { defaultValue: 'Рефералы' })}
              </p>
              <h1 className="mt-1 text-[25px] font-semibold leading-none text-white/[0.97]">
                {t('referral.title')}
              </h1>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border border-white/[0.08] bg-white/[0.04] text-emerald-100/[0.8]">
              <Share2 className="h-4 w-4" />
            </span>
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
