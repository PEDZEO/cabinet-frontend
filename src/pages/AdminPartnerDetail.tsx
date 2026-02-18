import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { partnerApi } from '../api/partners';
import {
  AdminBackButton,
  AdminInfoTile,
  AdminMetricCard,
  AdminPageErrorState,
  AdminPageLoadingState,
  AdminSectionCard,
} from '../components/admin';
import { useCurrency } from '../hooks/useCurrency';
import { useMutationSuccessActions } from '../hooks/useMutationSuccessActions';

// Status badge config — keys must match backend PartnerStatus enum values
const statusConfig: Record<string, { labelKey: string; color: string; bgColor: string }> = {
  approved: {
    labelKey: 'admin.partnerDetail.status.approved',
    color: 'text-success-400',
    bgColor: 'bg-success-500/20',
  },
  pending: {
    labelKey: 'admin.partnerDetail.status.pending',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  rejected: {
    labelKey: 'admin.partnerDetail.status.rejected',
    color: 'text-error-400',
    bgColor: 'bg-error-500/20',
  },
  none: {
    labelKey: 'admin.partnerDetail.status.none',
    color: 'text-dark-400',
    bgColor: 'bg-dark-600',
  },
};

const unknownStatus = {
  labelKey: 'admin.partnerDetail.status.none',
  color: 'text-dark-400',
  bgColor: 'bg-dark-600',
};

export default function AdminPartnerDetail() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const runSuccessActions = useMutationSuccessActions();
  const { formatWithCurrency } = useCurrency();

  const unassignMutation = useMutation({
    mutationFn: (campaignId: number) => partnerApi.unassignCampaign(Number(userId), campaignId),
    onSuccess: () => {
      return runSuccessActions({
        invalidateKeys: [['admin-partner-detail', userId]],
      });
    },
  });

  // Fetch partner detail
  const {
    data: partner,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-partner-detail', userId],
    queryFn: () => partnerApi.getPartnerDetail(Number(userId)),
    enabled: !!userId,
  });

  if (isLoading) {
    return <AdminPageLoadingState />;
  }

  if (error || !partner) {
    return (
      <AdminPageErrorState
        backTo="/admin/partners"
        title={t('admin.partnerDetail.title')}
        message={t('admin.partnerDetail.loadError')}
        backLabel={t('common.back')}
      />
    );
  }

  const badge = statusConfig[partner.partner_status] || unknownStatus;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <AdminBackButton to="/admin/partners" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-dark-100">
              {partner.first_name || partner.username || `#${partner.user_id}`}
            </h1>
            <span className={`rounded px-2 py-0.5 text-xs ${badge.bgColor} ${badge.color}`}>
              {t(badge.labelKey)}
            </span>
          </div>
          {partner.username && <p className="text-sm text-dark-400">@{partner.username}</p>}
        </div>
      </div>

      <div className="space-y-6">
        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminMetricCard
            value={partner.total_referrals}
            label={t('admin.partnerDetail.stats.totalReferrals')}
          />
          <AdminMetricCard
            value={partner.paid_referrals}
            label={t('admin.partnerDetail.stats.paidReferrals')}
            valueClassName="text-2xl font-bold text-success-400"
          />
          <AdminMetricCard
            value={partner.active_referrals}
            label={t('admin.partnerDetail.stats.activeReferrals')}
            valueClassName="text-2xl font-bold text-accent-400"
          />
          <AdminMetricCard
            value={`${partner.conversion_to_paid}%`}
            label={t('admin.partnerDetail.stats.conversionRate')}
            valueClassName="text-2xl font-bold text-accent-400"
          />
        </div>

        {/* Earnings */}
        <AdminSectionCard title={t('admin.partnerDetail.earnings.title')}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AdminInfoTile
              label={t('admin.partnerDetail.earnings.allTime')}
              value={formatWithCurrency(partner.earnings_all_time / 100)}
              valueClassName="text-lg font-medium text-success-400"
            />
            <AdminInfoTile
              label={t('admin.partnerDetail.earnings.today')}
              value={formatWithCurrency(partner.earnings_today / 100)}
              valueClassName="text-lg font-medium text-dark-200"
            />
            <AdminInfoTile
              label={t('admin.partnerDetail.earnings.week')}
              value={formatWithCurrency(partner.earnings_week / 100)}
              valueClassName="text-lg font-medium text-dark-200"
            />
            <AdminInfoTile
              label={t('admin.partnerDetail.earnings.month')}
              value={formatWithCurrency(partner.earnings_month / 100)}
              valueClassName="text-lg font-medium text-dark-200"
            />
          </div>
        </AdminSectionCard>

        {/* Commission */}
        <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-dark-200">
                {t('admin.partnerDetail.commission.title')}
              </h3>
              <div className="mt-1 text-2xl font-bold text-accent-400">
                {partner.commission_percent ?? 0}%
              </div>
            </div>
            <button
              onClick={() =>
                navigate(`/admin/partners/${userId}/commission`, {
                  state: { currentCommission: partner.commission_percent ?? 0 },
                })
              }
              className="rounded-lg bg-dark-700 px-4 py-2 text-sm text-dark-300 transition-colors hover:bg-dark-600 hover:text-dark-100"
            >
              {t('admin.partnerDetail.commission.update')}
            </button>
          </div>
        </div>

        {/* Campaigns */}
        <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-dark-200">
              {t('admin.partnerDetail.campaigns.title')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/admin/partners/${userId}/campaigns/assign`)}
                className="rounded-lg bg-dark-700 px-3 py-1.5 text-xs text-dark-300 transition-colors hover:bg-dark-600 hover:text-dark-100"
              >
                {t('admin.partnerDetail.campaigns.assign')}
              </button>
              <button
                onClick={() => navigate(`/admin/campaigns/create?partnerId=${userId}`)}
                className="rounded-lg bg-accent-500/20 px-3 py-1.5 text-xs font-medium text-accent-400 transition-colors hover:bg-accent-500/30"
              >
                {t('admin.partnerDetail.campaigns.createNew')}
              </button>
            </div>
          </div>
          {partner.campaigns.length === 0 ? (
            <div className="py-4 text-center text-sm text-dark-500">
              {t('admin.partnerDetail.campaigns.noCampaigns')}
            </div>
          ) : (
            <div className="space-y-2">
              {partner.campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`flex items-center justify-between rounded-lg bg-dark-700/50 p-3 ${
                    !campaign.is_active ? 'opacity-60' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-dark-100">{campaign.name}</div>
                    <div className="font-mono text-xs text-dark-500">
                      ?start={campaign.start_parameter}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.is_active ? (
                      <span className="rounded bg-success-500/20 px-2 py-0.5 text-xs text-success-400">
                        {t('admin.partnerDetail.campaigns.active')}
                      </span>
                    ) : (
                      <span className="rounded bg-dark-600 px-2 py-0.5 text-xs text-dark-400">
                        {t('admin.partnerDetail.campaigns.inactive')}
                      </span>
                    )}
                    <button
                      onClick={() => unassignMutation.mutate(campaign.id)}
                      disabled={unassignMutation.isPending}
                      className="rounded p-1 text-dark-500 transition-colors hover:bg-error-500/10 hover:text-error-400"
                      title={t('admin.partnerDetail.campaigns.unassign')}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
          <h3 className="mb-4 font-medium text-dark-200">
            {t('admin.partnerDetail.dangerZone.title')}
          </h3>
          <button
            onClick={() => navigate(`/admin/partners/${userId}/revoke`)}
            className="w-full rounded-lg bg-error-500/20 px-4 py-3 text-sm font-medium text-error-400 transition-colors hover:bg-error-500/30"
          >
            {t('admin.partnerDetail.dangerZone.revokeButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
