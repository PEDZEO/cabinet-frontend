import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminSettingsApi } from '@/api/adminSettings';
import {
  adminUltimaApi,
  type UltimaDiagnosticStatus,
  type UltimaOverview,
} from '@/api/adminUltima';
import { AdminBackButton } from '@/components/admin';
import { groupUltimaSettings, isUltimaSetting } from './adminUltimaSettings/utils';

const UltimaIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l7 2.8v5.4c0 4.3-2.9 8.3-7 9.5-4.1-1.2-7-5.2-7-9.5V5.8L12 3z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
  </svg>
);

const StartMessageIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="4" y="4" width="16" height="5" rx="1.5" />
    <rect x="4" y="15" width="10" height="5" rx="1.5" />
    <path d="M17 17.5h3M18.5 16v3" strokeLinecap="round" />
  </svg>
);

const DocIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 3.5h7l4 4v12A1.5 1.5 0 0 1 17.5 21h-9A1.5 1.5 0 0 1 7 19.5v-14A1.5 1.5 0 0 1 8.5 4"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 3.5V8h4" />
    <path strokeLinecap="round" d="M10 12h7M10 15h7M10 18h5" />
  </svg>
);

const PaletteIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3a9 9 0 0 0-9 9c0 3.9 3.1 7 7 7h1.2a1.8 1.8 0 0 0 0-3.6h-.9a1.8 1.8 0 1 1 0-3.6h5.4A5.3 5.3 0 0 0 21 6.5 3.5 3.5 0 0 0 17.5 3H12Z"
    />
    <circle cx="7.5" cy="9.5" r="1" />
    <circle cx="11" cy="7.5" r="1" />
    <circle cx="15" cy="7.8" r="1" />
  </svg>
);

const statusClasses: Record<UltimaDiagnosticStatus, string> = {
  ok: 'border-success-500/30 bg-success-500/10 text-success-300',
  warning: 'border-warning-500/30 bg-warning-500/10 text-warning-300',
  error: 'border-error-500/30 bg-error-500/10 text-error-300',
};

const statusLabel = (status: UltimaDiagnosticStatus) => {
  if (status === 'ok') return 'OK';
  if (status === 'warning') return 'Внимание';
  return 'Ошибка';
};

const SectionCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-dark-700/50 bg-dark-800/30 p-4">
    <h2 className="mb-3 text-base font-semibold text-dark-100">{title}</h2>
    {children}
  </section>
);

const MetricCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-xl border border-dark-700/50 bg-dark-900/40 p-3">
    <div className="text-xs text-dark-400">{label}</div>
    <div className="mt-1 text-xl font-semibold text-dark-100">{value}</div>
    {hint ? <div className="mt-1 text-xs text-dark-500">{hint}</div> : null}
  </div>
);

const isCustomStartActive = (overview: UltimaOverview) =>
  overview.start.enabled && !overview.start.fallback_to_regular_menu;

function getSummaryItems(overview?: UltimaOverview) {
  if (!overview) return [];
  const customStartActive = isCustomStartActive(overview);
  return [
    {
      label: 'Ultima режим',
      value: overview.mode.enabled ? 'Включен' : 'Выключен',
      hint: `MAIN_MENU_MODE: ${overview.mode.main_menu_mode}`,
    },
    {
      label: '/start',
      value: customStartActive ? 'Кастомный' : 'Обычное меню',
      hint: customStartActive
        ? overview.start.button_text
        : overview.start.enabled
          ? 'fallback из-за ссылки'
          : 'fallback включен',
    },
    {
      label: 'Поддержка',
      value: overview.support.channel_label,
      hint: overview.support.tickets_enabled
        ? 'тикеты доступны'
        : overview.support.support_username || 'профиль/url',
    },
    {
      label: 'Уведомления',
      value: overview.notifications.enabled
        ? `${overview.notifications.buttons.length} кнопок`
        : 'Выключены',
      hint: overview.notifications.enabled ? 'miniapp-кнопки' : 'без замены кнопок',
    },
  ];
}

export default function AdminUltimaSettings() {
  const { t } = useTranslation();

  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingsApi.getSettings(),
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin', 'ultima', 'overview'],
    queryFn: adminUltimaApi.getOverview,
  });

  const ultimaSettings = useMemo(
    () => (allSettings ?? []).filter((setting) => isUltimaSetting(setting)),
    [allSettings],
  );
  const groupedUltimaSettings = useMemo(
    () => groupUltimaSettings(ultimaSettings),
    [ultimaSettings],
  );
  const summaryItems = useMemo(() => getSummaryItems(overview), [overview]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <AdminBackButton to="/admin" />
        <div className="rounded-lg bg-violet-500/20 p-2 text-violet-300">
          <UltimaIcon />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-dark-100">
              {t('admin.nav.ultimaSettings', { defaultValue: 'Ultima настройки' })}
            </h1>
            {overview ? (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses[overview.status]}`}
              >
                {statusLabel(overview.status)}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-dark-400">
            {t('admin.ultimaSettings.subtitle', {
              defaultValue:
                'Единый центр Ultima: режим, /start, поддержка, диагностика, уведомления и профильные параметры.',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {overviewLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl border border-dark-700/50 bg-dark-800/40"
              />
            ))
          : summaryItems.map((item) => (
              <MetricCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
            ))}
      </div>

      {overview ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
          <SectionCard title="Диагностика Ultima">
            <div className="space-y-2">
              {overview.diagnostics.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-3 rounded-xl border border-dark-700/50 bg-dark-900/35 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-dark-100">{item.label}</div>
                    <div className="mt-0.5 text-xs text-dark-400">{item.message}</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${statusClasses[item.status]}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Превью /start">
            <div className="rounded-xl border border-dark-700/50 bg-dark-950/40 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-dark-400">
                  Telegram
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${
                    isCustomStartActive(overview)
                      ? 'border-violet-400/30 bg-violet-500/10 text-violet-200'
                      : 'border-success-500/30 bg-success-500/10 text-success-300'
                  }`}
                >
                  {isCustomStartActive(overview) ? 'кастомное сообщение' : 'обычное меню'}
                </span>
              </div>
              {isCustomStartActive(overview) ? (
                <>
                  <div className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-dark-900/70 p-3 text-sm text-dark-100">
                    {overview.start.message_text}
                  </div>
                  <div className="mt-3 rounded-lg border border-accent-400/30 bg-accent-500/10 px-3 py-2 text-center text-sm font-medium text-accent-200">
                    {overview.start.button_text}
                  </div>
                  <div className="mt-2 truncate text-xs text-dark-500">
                    {overview.start.button_url}
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-dark-900/70 p-3 text-sm text-dark-300">
                  При /start бот покажет стандартный текст и обычные кнопки меню.
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {overview ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard title="Поддержка">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-dark-400">Канал</span>
                <span className="text-right text-dark-100">{overview.support.channel_label}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-dark-400">Тикеты</span>
                <span className="text-dark-100">
                  {overview.support.tickets_enabled ? 'доступны' : 'недоступны'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-dark-400">Профиль</span>
                <span className="truncate text-right text-dark-100">
                  {overview.support.support_username || '—'}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Метрики тикетов">
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Всего" value={String(overview.metrics.tickets_total)} />
              <MetricCard label="За 7 дней" value={String(overview.metrics.tickets_created_7d)} />
              <MetricCard label="Открыто" value={String(overview.metrics.tickets_open)} />
              <MetricCard label="В ожидании" value={String(overview.metrics.tickets_pending)} />
            </div>
          </SectionCard>

          <SectionCard title="Miniapp">
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-dark-400">URL</div>
                <div className="truncate text-dark-100">{overview.config.miniapp_url || '—'}</div>
              </div>
              <div>
                <div className="text-dark-400">Покупка</div>
                <div className="truncate text-dark-100">
                  {overview.config.purchase_url || 'основной URL'}
                </div>
              </div>
              <div>
                <div className="text-dark-400">Аккаунт</div>
                <div className="text-dark-100">{overview.mode.account_linking_mode}</div>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      <SectionCard title={t('admin.ultimaSettings.pages', { defaultValue: 'Страницы Ultima' })}>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          <Link
            to="/admin/ultima-settings/start-message"
            className="group flex items-start gap-3 rounded-xl border border-dark-700/50 bg-dark-800/40 px-4 py-3 transition-colors hover:border-violet-400/40 hover:bg-dark-800/70"
          >
            <span className="mt-0.5 text-violet-300">
              <StartMessageIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-dark-100">
                Сообщение после /start
              </span>
              <span className="block text-xs text-dark-400">
                Текст, WebApp-кнопка и кнопки уведомлений
              </span>
            </span>
          </Link>
          <Link
            to="/admin/ultima-settings/theme"
            className="group flex items-start gap-3 rounded-xl border border-dark-700/50 bg-dark-800/40 px-4 py-3 transition-colors hover:border-violet-400/40 hover:bg-dark-800/70"
          >
            <span className="mt-0.5 text-violet-300">
              <PaletteIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-dark-100">Темы и сцены</span>
              <span className="block text-xs text-dark-400">
                Визуальный стиль, анимации и цвета
              </span>
            </span>
          </Link>
          <Link
            to="/admin/ultima-settings/agreement"
            className="group flex items-start gap-3 rounded-xl border border-dark-700/50 bg-dark-800/40 px-4 py-3 transition-colors hover:border-violet-400/40 hover:bg-dark-800/70"
          >
            <span className="mt-0.5 text-violet-300">
              <DocIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-dark-100">
                Пользовательское соглашение
              </span>
              <span className="block text-xs text-dark-400">Текст отдельной Ultima-страницы</span>
            </span>
          </Link>
        </div>
      </SectionCard>

      <SectionCard
        title={t('admin.ultimaSettings.inlineSettings', { defaultValue: 'Параметры Ultima' })}
      >
        {isLoading ? (
          <div className="py-8 text-center text-dark-400">{t('common.loading')}</div>
        ) : ultimaSettings.length === 0 ? (
          <div className="rounded-xl border border-dark-700/40 bg-dark-800/40 p-6 text-center text-sm text-dark-400">
            Параметры Ultima не найдены. Проверьте категории MINIAPP/HAPP в системных настройках.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {groupedUltimaSettings.map((group) => (
              <Link
                key={group.key}
                to={`/admin/ultima-settings/params/${encodeURIComponent(group.key)}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-dark-700/50 bg-dark-800/40 px-4 py-3 transition-colors hover:border-violet-400/40 hover:bg-dark-800/70"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-dark-100">
                    {group.label}
                  </span>
                  <span className="block text-xs text-dark-400">
                    {t('admin.ultimaSettings.paramsCount', {
                      defaultValue: '{{count}} параметров',
                      count: group.items.length,
                    })}
                  </span>
                </span>
                <span className="shrink-0 text-dark-400 transition-colors group-hover:text-violet-300">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
