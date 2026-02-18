import { useParams, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { partnerApi } from '../api/partners';
import { AdminBackButton } from '../components/admin';

export default function AdminPartnerRevoke() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const revokeMutation = useMutation({
    mutationFn: () => partnerApi.revokePartner(Number(userId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partner-stats'] });
      navigate(`/admin/partners/${userId}`);
    },
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <AdminBackButton to={`/admin/partners/${userId}`} />
        <h1 className="text-xl font-semibold text-dark-100">
          {t('admin.partnerDetail.revokeDialog.title')}
        </h1>
      </div>

      <div className="rounded-xl border border-error-500/30 bg-dark-800 p-6">
        <div className="mb-6 rounded-lg bg-error-500/10 p-4">
          <p className="text-dark-400">{t('admin.partnerDetail.revokeDialog.description')}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/partners/${userId}`)}
            className="flex-1 rounded-lg bg-dark-700 px-4 py-3 text-dark-300 transition-colors hover:bg-dark-600 hover:text-dark-100"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => revokeMutation.mutate()}
            disabled={revokeMutation.isPending}
            className="flex-1 rounded-lg bg-error-500 px-4 py-3 font-medium text-white transition-colors hover:bg-error-600 disabled:opacity-50"
          >
            {revokeMutation.isPending
              ? t('common.saving')
              : t('admin.partnerDetail.dangerZone.revokeButton')}
          </button>
        </div>

        {revokeMutation.isError && (
          <div className="mt-4 rounded-lg bg-error-500/10 p-3 text-sm text-error-400">
            {t('common.error')}
          </div>
        )}
      </div>
    </div>
  );
}
