import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  ultimaAccentSurfaceStyle,
  ultimaCardClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';

type UltimaDesktopAgreementProps = {
  title: string;
  subtitle: string;
  updatedAtLabel: string | null;
  htmlContent: string;
  isLoading: boolean;
  emptyLabel: string;
  bottomNav: ReactNode;
};

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
    <path
      d="M8 3.5h7l4 4v12A1.5 1.5 0 0 1 17.5 21h-9A1.5 1.5 0 0 1 7 19.5v-14A1.5 1.5 0 0 1 8.5 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M15 3.5V8h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="m9.8 14.1 1.8 1.8 3.2-3.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function UltimaDesktopAgreement({
  title,
  subtitle,
  updatedAtLabel,
  htmlContent,
  isLoading,
  emptyLabel,
  bottomNav,
}: UltimaDesktopAgreementProps) {
  const { t } = useTranslation();

  return (
    <div
      className="ultima-shell-inner lg:max-w-[1260px]"
      style={{
        height: 'calc(100dvh - 32px - env(safe-area-inset-bottom, 0px))',
        minHeight: 'calc(100dvh - 32px - env(safe-area-inset-bottom, 0px))',
        maxHeight: 'calc(100dvh - 32px - env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <aside className="ultima-desktop-aside space-y-5 lg:sticky lg:top-4">
          <section
            className={cn(ultimaCardClassName, 'relative overflow-hidden p-5')}
            style={ultimaAccentSurfaceStyle}
          >
            <div className="text-white/84 flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.07]">
              <DocumentIcon />
            </div>
            <h1 className="mt-4 text-[32px] font-semibold leading-[0.98] tracking-[-0.035em] text-white">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-[1.6] text-white/70">{subtitle}</p>
            <div className="mt-6 rounded-[18px] border border-white/10 bg-black/15 px-4 py-3">
              <div className="text-white/42 text-[11px] uppercase tracking-[0.22em]">
                {t('common.lastUpdated', { defaultValue: 'Последнее обновление' })}
              </div>
              <div className="text-white/88 mt-2 text-sm font-medium">
                {updatedAtLabel ?? t('common.notSpecified', { defaultValue: 'Не указано' })}
              </div>
            </div>
          </section>

          <div className="ultima-nav-dock mt-0">{bottomNav}</div>
        </aside>

        <section
          className={cn(ultimaCardClassName, 'flex min-h-0 flex-col overflow-hidden p-0')}
          style={ultimaSurfaceStyle}
        >
          <div className="border-white/8 flex items-center justify-between border-b px-6 py-5">
            <div>
              <div className="text-2xl font-semibold tracking-[-0.03em] text-white">{title}</div>
            </div>
            <div className="text-white/52 text-sm">
              {updatedAtLabel ?? t('common.currentVersion', { defaultValue: 'Актуальная версия' })}
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/35 border-t-transparent" />
            </div>
          ) : (
            <div className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {htmlContent ? (
                <div
                  className="prose prose-invert max-w-none text-[15px] leading-[1.75] [&_a]:text-[#5de8c3] [&_a]:underline [&_h1]:mb-4 [&_h1]:text-[38px] [&_h1]:font-semibold [&_h1]:leading-[1] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-[32px] [&_h2]:font-semibold [&_h2]:leading-[1.08] [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[26px] [&_h3]:font-semibold [&_li]:mb-2 [&_p]:mb-4 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <p className="text-white/60">{emptyLabel}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
