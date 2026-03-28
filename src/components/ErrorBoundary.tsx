import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '../i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
  level?: 'app' | 'page' | 'widget';
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { level = 'page' } = this.props;

    if (level === 'app') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-dark-900 p-4">
          <div className="max-w-md text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h1 className="mb-2 text-xl font-bold text-dark-50">
              {i18n.t('common.error', 'Произошла ошибка')}
            </h1>
            <p className="mb-6 text-dark-400">
              {i18n.t(
                'errorBoundary.appMessage',
                'Произошла непредвиденная ошибка. Перезагрузите страницу и попробуйте снова.',
              )}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-accent-500 px-6 py-3 font-medium text-white transition-colors hover:bg-accent-600"
            >
              {i18n.t('errorBoundary.reload', 'Перезагрузить страницу')}
            </button>
          </div>
        </div>
      );
    }

    if (level === 'widget') {
      return (
        <div className="rounded-xl border border-error-500/30 bg-error-500/10 p-4 text-center">
          <p className="text-sm text-error-400">
            {i18n.t('errorBoundary.widgetMessage', 'Не удалось загрузить этот блок')}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-2 text-sm text-accent-400 hover:text-accent-300"
          >
            {i18n.t('common.retry', 'Повторить')}
          </button>
        </div>
      );
    }

    // level === 'page' (default)
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="mb-2 text-xl font-bold text-dark-50">
            {i18n.t('common.error', 'Произошла ошибка')}
          </h1>
          <p className="mb-6 text-sm text-dark-400">
            {this.state.error?.message ||
              i18n.t('errorBoundary.pageMessage', 'Произошла непредвиденная ошибка')}
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-xl bg-accent-500 px-6 py-3 font-medium text-white transition-colors hover:bg-accent-600"
          >
            {i18n.t('common.retry', 'Повторить')}
          </button>
        </div>
      </div>
    );
  }
}
