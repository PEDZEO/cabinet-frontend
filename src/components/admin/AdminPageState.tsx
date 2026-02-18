import { useNavigate } from 'react-router';
import { AdminBackButton } from './AdminBackButton';

interface AdminPageErrorStateProps {
  backTo: string;
  title: string;
  message: string;
  backLabel: string;
}

export function AdminPageLoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
    </div>
  );
}

export function AdminPageErrorState({
  backTo,
  title,
  message,
  backLabel,
}: AdminPageErrorStateProps) {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <AdminBackButton to={backTo} />
        <h1 className="text-xl font-semibold text-dark-100">{title}</h1>
      </div>
      <div className="rounded-xl border border-error-500/30 bg-error-500/10 p-6 text-center">
        <p className="text-error-400">{message}</p>
        <button
          onClick={() => navigate(backTo)}
          className="mt-4 text-sm text-dark-400 hover:text-dark-200"
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
}
