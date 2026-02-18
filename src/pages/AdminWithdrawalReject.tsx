import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { withdrawalApi } from '../api/withdrawals';
import { AdminBackButton } from '../components/admin';
import { useCurrency } from '../hooks/useCurrency';

export default function AdminWithdrawalReject() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { formatWithCurrency } = useCurrency();

  const [comment, setComment] = useState('');

  // Try to get withdrawal summary from navigate state
  const passedDetail = location.state as {
    amountKopeks?: number;
    username?: string;
    firstName?: string;
  } | null;

  const rejectMutation = useMutation({
    mutationFn: (rejectComment: string) =>
      withdrawalApi.reject(Number(id), rejectComment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      navigate(`/admin/withdrawals/${id}`);
    },
  });

  const displayName = passedDetail?.username
    ? `@${passedDetail.username}`
    : passedDetail?.firstName || '';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <AdminBackButton to={`/admin/withdrawals/${id}`} />
        <div>
          <h1 className="text-xl font-semibold text-dark-100">
            {t('admin.withdrawals.detail.rejectTitle')}
          </h1>
          {passedDetail?.amountKopeks != null && passedDetail.amountKopeks > 0 && (
            <p className="text-sm text-dark-400">
              #{id} {'\u2022'} {formatWithCurrency(passedDetail.amountKopeks / 100, 0)}
              {displayName && ` \u2022 ${displayName}`}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-error-500/30 bg-dark-800 p-6">
        <p className="mb-4 text-sm text-dark-400">
          {t('admin.withdrawals.detail.rejectDescription')}
        </p>

        <label className="mb-1 block text-sm font-medium text-dark-300">
          {t('admin.withdrawals.detail.commentPlaceholder')}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('admin.withdrawals.detail.commentPlaceholder')}
          className="mb-6 w-full rounded-lg border border-dark-600 bg-dark-700 p-3 text-sm text-dark-200 placeholder:text-dark-500 focus:border-accent-500 focus:outline-none"
          rows={3}
        />

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/withdrawals/${id}`)}
            className="flex-1 rounded-lg bg-dark-700 px-4 py-3 text-dark-300 transition-colors hover:bg-dark-600 hover:text-dark-100"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => rejectMutation.mutate(comment)}
            disabled={rejectMutation.isPending}
            className="flex-1 rounded-lg bg-error-500 px-4 py-3 font-medium text-white transition-colors hover:bg-error-600 disabled:opacity-50"
          >
            {rejectMutation.isPending
              ? t('admin.withdrawals.detail.rejecting')
              : t('admin.withdrawals.detail.confirmReject')}
          </button>
        </div>

        {rejectMutation.isError && (
          <div className="mt-4 rounded-lg bg-error-500/10 p-3 text-sm text-error-400">
            {t('common.error')}
          </div>
        )}
      </div>
    </div>
  );
}
