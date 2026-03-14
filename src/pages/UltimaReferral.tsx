import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { referralApi } from '@/api/referral';
import { brandingApi } from '@/api/branding';
import { partnerApi } from '@/api/partners';
import { withdrawalApi } from '@/api/withdrawals';
import { useCurrency } from '@/hooks/useCurrency';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path d="M7 12V6.5a2.5 2.5 0 0 1 2.5-2.5h5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 5h7m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M7 11.5v7A2.5 2.5 0 0 0 9.5 21h9a2.5 2.5 0 0 0 2.5-2.5v-3"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const statusClassMap: Record<string, string> = {
  completed: 'text-emerald-200 border-emerald-200/30 bg-emerald-500/15',
  approved: 'text-sky-200 border-sky-200/30 bg-sky-500/15',
  pending: 'text-amber-200 border-amber-200/30 bg-amber-500/15',
  rejected: 'text-rose-200 border-rose-200/30 bg-rose-500/15',
  cancelled: 'text-rose-200 border-rose-200/30 bg-rose-500/15',
};

const getStatusClass = (status: string) =>
  statusClassMap[status] ?? 'text-white/80 border-white/20 bg-white/10';

export function UltimaReferral() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatPositive, formatWithCurrency } = useCurrency();
  const [copied, setCopied] = useState(false);

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

  const isPartner = partnerStatus?.partner_status === 'approved';

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

  const referralLink = info?.referral_code
    ? `${window.location.origin}/login?ref=${info.referral_code}`
    : '';

  const copyLink = () => {
    if (!referralLink) return;
    void navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const shareLink = () => {
    if (!referralLink) return;
    const shareText = t('referral.shareMessage', {
      percent: info?.commission_percent || 0,
      botName: branding?.name || import.meta.env.VITE_APP_NAME || 'Cabinet',
    });

    if (navigator.share) {
      void navigator.share({
        title: t('referral.title'),
        text: shareText,
        url: referralLink,
      });
      return;
    }

    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink,
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  const partnerStatusValue = partnerStatus?.partner_status ?? 'none';
  const showApplySection = partnerStatusValue === 'none';
  const showPendingSection = partnerStatusValue === 'pending';
  const showRejectedSection = partnerStatusValue === 'rejected';

  return (
    <div className="ultima-shell ultima-flat-frames">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner">
        <header className="mb-3">
          <h1 className="text-[clamp(34px,9vw,42px)] font-semibold leading-[0.9] tracking-[-0.01em] text-white">
            {t('referral.title')}
          </h1>
          <p className="text-white/62 mt-1.5 text-[13px]">
            {t('profile.referralDescription', { defaultValue: 'Получайте бонусы за приглашения' })}
          </p>
        </header>

        <section className="border-emerald-200/12 min-h-0 flex-1 overflow-hidden rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
          <div className="ultima-scrollbar h-full space-y-3 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/40 border-t-transparent" />
              </div>
            ) : terms && !terms.is_enabled ? (
              <div className="border-emerald-200/12 text-white/72 rounded-2xl border bg-emerald-950/25 px-3 py-5 text-center">
                {t('referral.disabled')}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border-emerald-200/12 bg-emerald-950/28 rounded-2xl border px-2.5 py-2.5">
                    <p className="text-white/52 text-[10px]">
                      {t('referral.stats.totalReferrals')}
                    </p>
                    <p className="mt-1 text-[19px] font-semibold leading-none text-white">
                      {info?.total_referrals || 0}
                    </p>
                  </div>
                  <div className="border-emerald-200/12 bg-emerald-950/28 rounded-2xl border px-2.5 py-2.5">
                    <p className="text-white/52 text-[10px]">{t('referral.stats.totalEarnings')}</p>
                    <p className="mt-1 text-[16px] font-semibold leading-none text-emerald-200">
                      {formatPositive(info?.total_earnings_rubles || 0)}
                    </p>
                  </div>
                  <div className="border-emerald-200/12 bg-emerald-950/28 rounded-2xl border px-2.5 py-2.5">
                    <p className="text-white/52 text-[10px]">
                      {t('referral.stats.commissionRate')}
                    </p>
                    <p className="mt-1 text-[19px] font-semibold leading-none text-sky-200">
                      {info?.commission_percent || 0}%
                    </p>
                  </div>
                </div>

                <div className="border-emerald-200/12 bg-emerald-950/28 rounded-2xl border p-3">
                  <p className="text-white/74 text-[12px]">{t('referral.yourLink')}</p>
                  <p className="text-white/52 mt-1 text-[11px]">
                    {t('referral.shareHint', { percent: info?.commission_percent || 0 })}
                  </p>
                  <div className="border-emerald-200/12 text-white/86 mt-2 rounded-xl border bg-emerald-950/40 px-3 py-2 text-[12px]">
                    <p className="truncate">{referralLink || '—'}</p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={copyLink}
                      disabled={!referralLink}
                      className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-200/15 bg-emerald-900/45 text-[12px] text-white/90 disabled:opacity-45"
                    >
                      {copied ? <CheckIcon /> : <CopyIcon />}
                      {copied ? t('referral.copied') : t('referral.copyLink')}
                    </button>
                    <button
                      type="button"
                      onClick={shareLink}
                      disabled={!referralLink}
                      className="border-sky-200/22 bg-sky-500/78 flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[12px] font-medium text-white disabled:opacity-45"
                    >
                      <ShareIcon />
                      {t('referral.shareButton')}
                    </button>
                  </div>
                </div>

                <div className="border-emerald-200/12 bg-emerald-950/28 rounded-2xl border p-3">
                  <p className="text-white/88 mb-2 text-[13px]">{t('referral.yourReferrals')}</p>
                  {referralList?.items && referralList.items.length > 0 ? (
                    <div className="space-y-2">
                      {referralList.items.slice(0, 10).map((ref) => (
                        <div
                          key={ref.id}
                          className="flex items-center justify-between rounded-xl border border-emerald-200/10 bg-emerald-950/40 px-2.5 py-2"
                        >
                          <div>
                            <p className="text-white/92 text-[13px]">
                              {ref.first_name || ref.username || `User #${ref.id}`}
                            </p>
                            <p className="text-[11px] text-white/45">
                              {new Date(ref.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] ${ref.has_paid ? 'border-emerald-200/30 bg-emerald-500/15 text-emerald-200' : 'border-white/20 bg-white/10 text-white/75'}`}
                          >
                            {ref.has_paid
                              ? t('referral.status.paid')
                              : t('referral.status.pending')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-white/55">{t('referral.noReferrals')}</p>
                  )}
                </div>

                {earnings?.items && earnings.items.length > 0 ? (
                  <div className="border-emerald-200/12 bg-emerald-950/28 rounded-2xl border p-3">
                    <p className="text-white/88 mb-2 text-[13px]">
                      {t('referral.earningsHistory')}
                    </p>
                    <div className="space-y-2">
                      {earnings.items.slice(0, 10).map((earning) => (
                        <div
                          key={earning.id}
                          className="flex items-center justify-between rounded-xl border border-emerald-200/10 bg-emerald-950/40 px-2.5 py-2"
                        >
                          <div>
                            <p className="text-white/88 text-[12px]">
                              {earning.referral_first_name ||
                                earning.referral_username ||
                                'Referral'}
                            </p>
                            <p className="text-[11px] text-white/45">
                              {new Date(earning.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-[13px] font-medium text-emerald-200">
                            {formatPositive(earning.amount_rubles)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {terms?.partner_section_visible !== false && showApplySection ? (
                  <div className="border-emerald-200/12 bg-emerald-950/28 rounded-2xl border p-3">
                    <p className="text-white/92 text-[14px] font-medium">
                      {t('referral.partner.becomePartner')}
                    </p>
                    <p className="text-white/58 mt-1 text-[12px]">
                      {t('referral.partner.becomePartnerDesc')}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/referral/partner/apply')}
                      className="mt-2 h-10 rounded-xl border border-emerald-200/20 bg-emerald-500/85 px-4 text-[12px] font-medium text-white"
                    >
                      {t('referral.partner.applyButton')}
                    </button>
                  </div>
                ) : null}

                {terms?.partner_section_visible !== false && showPendingSection ? (
                  <div className="rounded-2xl border border-amber-200/20 bg-amber-500/10 p-3">
                    <p className="text-[14px] font-medium text-amber-100">
                      {t('referral.partner.underReview')}
                    </p>
                    <p className="mt-1 text-[12px] text-amber-100/70">
                      {t('referral.partner.underReviewDesc')}
                    </p>
                  </div>
                ) : null}

                {terms?.partner_section_visible !== false && showRejectedSection ? (
                  <div className="rounded-2xl border border-rose-200/20 bg-rose-500/10 p-3">
                    <p className="text-[14px] font-medium text-rose-100">
                      {t('referral.partner.rejected')}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/referral/partner/apply')}
                      className="mt-2 h-10 rounded-xl border border-rose-200/20 bg-rose-500/70 px-4 text-[12px] font-medium text-white"
                    >
                      {t('referral.partner.reapplyButton')}
                    </button>
                  </div>
                ) : null}

                {terms?.partner_section_visible !== false && isPartner && withdrawalBalance ? (
                  <div className="border-emerald-200/12 bg-emerald-950/28 rounded-2xl border p-3">
                    <p className="text-white/92 text-[14px] font-medium">
                      {t('referral.withdrawal.title')}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="border-emerald-200/12 rounded-xl border bg-emerald-950/35 p-2">
                        <p className="text-white/48 text-[10px]">
                          {t('referral.withdrawal.available')}
                        </p>
                        <p className="mt-1 text-[16px] font-semibold text-emerald-200">
                          {formatWithCurrency(withdrawalBalance.available_total / 100)}
                        </p>
                      </div>
                      <div className="border-emerald-200/12 rounded-xl border bg-emerald-950/35 p-2">
                        <p className="text-white/48 text-[10px]">
                          {t('referral.withdrawal.pending')}
                        </p>
                        <p className="mt-1 text-[14px] font-semibold text-amber-200">
                          {formatWithCurrency(withdrawalBalance.pending / 100)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/referral/withdrawal/request')}
                      disabled={!withdrawalBalance.can_request}
                      className="mt-2 h-10 w-full rounded-xl border border-emerald-200/20 bg-emerald-500/85 text-[12px] font-medium text-white disabled:opacity-45"
                    >
                      {t('referral.withdrawal.requestButton')}
                    </button>
                  </div>
                ) : null}

                {terms?.partner_section_visible !== false &&
                isPartner &&
                withdrawalHistory?.items &&
                withdrawalHistory.items.length > 0 ? (
                  <div className="border-emerald-200/12 bg-emerald-950/28 rounded-2xl border p-3">
                    <p className="text-white/88 mb-2 text-[13px]">
                      {t('referral.withdrawal.history')}
                    </p>
                    <div className="space-y-2">
                      {withdrawalHistory.items.slice(0, 10).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-emerald-200/10 bg-emerald-950/40 px-2.5 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-white/92 text-[12px] font-medium">
                              {formatWithCurrency(item.amount_rubles)}
                            </p>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] ${getStatusClass(item.status)}`}
                            >
                              {t(`referral.withdrawal.status.${item.status}`, item.status)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-white/45">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                          {item.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => cancelWithdrawalMutation.mutate(item.id)}
                              disabled={cancelWithdrawalMutation.isPending}
                              className="mt-1 text-[11px] text-rose-200/90"
                            >
                              {t('common.cancel')}
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>

        <div className="ultima-nav-dock">
          <UltimaBottomNav active="profile" />
        </div>
      </div>
    </div>
  );
}
