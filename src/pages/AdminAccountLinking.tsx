import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminAccountLinkingApi, type AdminManualMergeItem } from '../api/adminAccountLinking';

type MergeStateFilter = 'pending' | 'approved' | 'rejected' | 'all';

const BackIcon = () => (
  <svg
    className="h-5 w-5 text-dark-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

export default function AdminAccountLinking() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [state, setState] = useState<MergeStateFilter>('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminManualMergeItem | null>(null);
  const [comment, setComment] = useState('');
  const [primaryUserId, setPrimaryUserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-manual-merges', state, page],
    queryFn: () => adminAccountLinkingApi.getManualMerges({ state, page, per_page: 20 }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      ticketId,
      action,
      primaryUserIdValue,
      commentValue,
    }: {
      ticketId: number;
      action: 'approve' | 'reject';
      primaryUserIdValue?: number;
      commentValue?: string;
    }) =>
      adminAccountLinkingApi.resolveManualMerge(ticketId, {
        action,
        primary_user_id: primaryUserIdValue,
        comment: commentValue,
      }),
    onSuccess: () => {
      setError(null);
      setComment('');
      setPrimaryUserId('');
      queryClient.invalidateQueries({ queryKey: ['admin-manual-merges'] });
      setSelected(null);
    },
    onError: (err: { response?: { data?: { detail?: { message?: string } | string } } }) => {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
        return;
      }
      setError(detail?.message || t('common.error'));
    },
  });

  const handleApprove = () => {
    if (!selected) return;
    const parsedPrimary = Number(primaryUserId);
    if (!Number.isInteger(parsedPrimary) || parsedPrimary <= 0) {
      setError(t('admin.accountLinking.primaryRequired'));
      return;
    }
    setError(null);
    resolveMutation.mutate({
      ticketId: selected.ticket_id,
      action: 'approve',
      primaryUserIdValue: parsedPrimary,
      commentValue: comment.trim() || undefined,
    });
  };

  const handleReject = () => {
    if (!selected) return;
    setError(null);
    resolveMutation.mutate({
      ticketId: selected.ticket_id,
      action: 'reject',
      commentValue: comment.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
        >
          <BackIcon />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark-50 sm:text-3xl">
            {t('admin.accountLinking.title')}
          </h1>
          <p className="text-sm text-dark-400">{t('admin.accountLinking.subtitle')}</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value as MergeStateFilter);
              setPage(1);
            }}
            className="input w-auto px-3 py-2 text-sm"
          >
            <option value="pending">{t('admin.accountLinking.filters.pending')}</option>
            <option value="approved">{t('admin.accountLinking.filters.approved')}</option>
            <option value="rejected">{t('admin.accountLinking.filters.rejected')}</option>
            <option value="all">{t('admin.accountLinking.filters.all')}</option>
          </select>
          <span className="text-sm text-dark-500">
            {t('admin.accountLinking.total')}: {data?.total || 0}
          </span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-dark-400">{t('common.loading')}</div>
        ) : data?.items.length ? (
          <div className="space-y-3">
            {data.items.map((item) => (
              <button
                key={item.ticket_id}
                onClick={() => {
                  setSelected(item);
                  setPrimaryUserId(item.current_user_id ? String(item.current_user_id) : '');
                  setComment(item.resolution_comment || '');
                }}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  selected?.ticket_id === item.ticket_id
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-dark-700 bg-dark-800/40 hover:border-dark-600'
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-medium text-dark-100">#{item.ticket_id}</span>
                  <span className="text-xs text-dark-400">
                    {item.decision
                      ? t(`admin.accountLinking.decision.${item.decision}`)
                      : t('admin.accountLinking.decision.pending')}
                  </span>
                </div>
                <p className="text-xs text-dark-500">
                  {t('admin.accountLinking.requester')}: #{item.requester_user_id} |{' '}
                  {t('admin.accountLinking.source')}: #{item.source_user_id ?? '-'}
                </p>
                {item.user_comment && (
                  <p className="mt-2 text-sm text-dark-300">
                    {t('admin.accountLinking.userComment')}: {item.user_comment}
                  </p>
                )}
                {item.resolution_comment && (
                  <p className="mt-1 text-xs text-dark-400">
                    {t('admin.accountLinking.adminComment')}: {item.resolution_comment}
                  </p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-dark-500">{t('admin.accountLinking.empty')}</div>
        )}

        {data && data.pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.back')}
            </button>
            <span className="text-sm text-dark-400">
              {page} / {data.pages}
            </span>
            <button
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>

      {selected && !selected.decision && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-dark-100">
            {t('admin.accountLinking.resolveTitle')}
          </h2>
          <p className="text-sm text-dark-400">
            {t('admin.accountLinking.resolveHint', {
              current: selected.current_user_id ?? '-',
              source: selected.source_user_id ?? '-',
            })}
          </p>
          <input
            className="input"
            value={primaryUserId}
            onChange={(e) => setPrimaryUserId(e.target.value.replace(/\D/g, ''))}
            placeholder={t('admin.accountLinking.primaryPlaceholder')}
          />
          <textarea
            className="input min-h-[92px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('admin.accountLinking.commentPlaceholder')}
            maxLength={1000}
          />
          {error && (
            <div className="rounded-linear border border-error-500/30 bg-error-500/10 p-3 text-sm text-error-400">
              {error}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleApprove}
              disabled={resolveMutation.isPending}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('admin.accountLinking.actions.approve')}
            </button>
            <button
              onClick={handleReject}
              disabled={resolveMutation.isPending}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('admin.accountLinking.actions.reject')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
