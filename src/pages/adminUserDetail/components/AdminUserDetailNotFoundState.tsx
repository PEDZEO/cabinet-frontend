import { useTranslation } from 'react-i18next';

interface AdminUserDetailNotFoundStateProps {
  onBack: () => void;
}

export function AdminUserDetailNotFoundState({ onBack }: AdminUserDetailNotFoundStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <p className="text-dark-400">{t('admin.users.notFound')}</p>
      <button
        onClick={onBack}
        className="rounded-lg bg-accent-500 px-4 py-2 text-white transition-colors hover:bg-accent-600"
      >
        {t('common.back')}
      </button>
    </div>
  );
}
