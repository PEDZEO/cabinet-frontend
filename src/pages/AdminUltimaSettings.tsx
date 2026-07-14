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
  type UltimaOverviewDiagnostic,
} from '@/api/adminUltima';
import { AdminBackButton } from '@/components/admin';
import { groupUltimaSettings, isUltimaSetting } from './adminUltimaSettings/utils';

const statusClasses: Record<UltimaDiagnosticStatus, string> = {
  ok: 'border-success-500/25 bg-success-500/10 text-success-300',
  warning: 'border-warning-500/25 bg-warning-500/10 text-warning-300',
  error: 'border-error-500/25 bg-error-500/10 text-error-300',
};

const statusDotClasses: Record<UltimaDiagnosticStatus, string> = {
  ok: 'bg-success-400',
  warning: 'bg-warning-400',
  error: 'bg-error-400',
};

const statusLabel = (status: UltimaDiagnosticStatus) => {
  if (status === 'ok') return 'OK';
  if (status === 'warning') return 'Внимание';
  return 'Ошибка';
};

const supportLabel = (type: string) =>
  (
    ({
      tickets: 'Тикеты',
      both: 'Тикеты + профиль',
      profile: 'Профиль Telegram',
      url: 'Внешняя ссылка',
    }) as Record<string, string>
  )[type] || type;

const mainMenuModeLabel = (mode: string) =>
  (
    ({
      cabinet: 'кабинет',
      bot: 'бот',
      default: 'обычное меню',
    }) as Record<string, string>
  )[mode] || mode;

const accountModeLabel = (mode: string) =>
  (
    ({
      provider_auth: 'авторизация провайдера',
      telegram: 'Telegram',
      email: 'email',
      disabled: 'выключено',
    }) as Record<string, string>
  )[mode] || mode;

const diagnosticCopy: Record<
  string,
  { label: string; ok: string; warning?: string; error?: string }
> = {
  ultima_mode: {
    label: 'Режим Ultima',
    ok: 'Включен для пользователей',
    warning: 'Выключен для пользователей',
  },
  miniapp_url: {
    label: 'Miniapp URL',
    ok: 'Основная ссылка настроена',
    error: 'Не задан MINIAPP_CUSTOM_URL',
  },
  start_message: {
    label: '/start',
    ok: 'Поведение настроено корректно',
    warning: 'Включен fallback на обычное меню',
    error: 'Ошибка настройки /start',
  },
  support: {
    label: 'Поддержка',
    ok: 'Канал поддержки доступен',
    warning: 'Есть неполная настройка поддержки',
    error: 'Поддержка настроена некорректно',
  },
  notification_buttons: {
    label: 'Кнопки уведомлений',
    ok: 'Кнопки для Ultima настроены',
    warning: 'Кнопки уведомлений выключены или пустые',
  },
  purchase_url: {
    label: 'Покупка',
    ok: 'Ссылка покупки корректна',
    warning: 'Используется основной Miniapp URL',
    error: 'Ссылка покупки некорректна',
  },
};

const getDiagnosticLabel = (item: UltimaOverviewDiagnostic) =>
  diagnosticCopy[item.key]?.label || item.label;

const getDiagnosticMessage = (item: UltimaOverviewDiagnostic) => {
  const copy = diagnosticCopy[item.key];
  if (!copy) return item.message;
  return copy[item.status] || copy.ok;
};

const isCustomStartActive = (overview: UltimaOverview) =>
  overview.start.enabled && !overview.start.fallback_to_regular_menu;

const compactUrl = (value: string) =>
  value.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'не задано';

const Section = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="rounded-xl border border-dark-700/45 bg-dark-800/25 p-3.5">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-dark-100">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const MiniStat = ({
  label,
  value,
  hint,
  status = 'ok',
}: {
  label: string;
  value: string;
  hint?: string;
  status?: UltimaDiagnosticStatus;
}) => (
  <div className="min-w-0 rounded-xl border border-dark-700/45 bg-dark-900/35 px-3 py-2.5">
    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-dark-500">
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotClasses[status]}`} />
      <span className="truncate">{label}</span>
    </div>
    <div className="mt-1 truncate text-base font-semibold text-dark-100">{value}</div>
    {hint ? <div className="mt-0.5 truncate text-xs text-dark-500">{hint}</div> : null}
  </div>
);

const SmallLinkCard = ({
  to,
  title,
  subtitle,
  external = false,
}: {
  to: string;
  title: string;
  subtitle: string;
  external?: boolean;
}) => (
  <Link
    to={to}
    target={external ? '_blank' : undefined}
    className="group min-w-0 rounded-lg border border-dark-700/45 bg-dark-900/30 px-3 py-2.5 transition hover:border-violet-400/40 hover:bg-dark-800/60"
  >
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-sm font-medium text-dark-100">{title}</span>
      <span className="shrink-0 text-xs text-dark-500 transition group-hover:text-violet-300">
        →
      </span>
    </div>
    <div className="mt-0.5 truncate text-xs text-dark-500">{subtitle}</div>
  </Link>
);

function getSummaryItems(overview?: UltimaOverview) {
  if (!overview) return [];
  const customStartActive = isCustomStartActive(overview);
  return [
    {
      label: 'Режим',
      value: overview.mode.enabled ? 'Включен' : 'Выключен',
      hint: `меню: ${mainMenuModeLabel(overview.mode.main_menu_mode)}`,
      status: overview.mode.enabled ? ('ok' as const) : ('warning' as const),
    },
    {
      label: '/start',
      value: customStartActive ? 'Кастомный' : 'Обычное меню',
      hint: customStartActive
        ? overview.start.button_text
        : overview.start.enabled
          ? 'fallback из-за ссылки'
          : 'кастом выключен',
      status: overview.start.fallback_to_regular_menu ? ('warning' as const) : ('ok' as const),
    },
    {
      label: 'Поддержка',
      value: supportLabel(overview.support.support_type),
      hint: overview.support.tickets_enabled ? 'тикеты доступны' : 'тикеты недоступны',
      status:
        overview.support.tickets_enabled || overview.support.support_username
          ? ('ok' as const)
          : ('warning' as const),
    },
    {
      label: 'Ошибки',
      value: String(overview.diagnostics.filter((item) => item.status === 'error').length),
      hint: `${overview.diagnostics.filter((item) => item.status === 'warning').length} предупреждений`,
      status: overview.status,
    },
  ];
}

function getTicketHealth(overview: UltimaOverview) {
  const active = overview.metrics.tickets_open + overview.metrics.tickets_pending;
  if (active > 0) return `${active} требуют внимания`;
  if (overview.metrics.tickets_created_7d > 0)
    return `${overview.metrics.tickets_created_7d} за 7 дней`;
  return 'очередь пустая';
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
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <AdminBackButton to="/admin" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-dark-100 sm:text-xl">
              {t('admin.nav.ultimaSettings', { defaultValue: 'Ultima настройки' })}
            </h1>
            {overview ? (
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses[overview.status]}`}
              >
                {statusLabel(overview.status)}
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-dark-500 sm:text-sm">
            Режим, /start, поддержка, диагностика, информация и параметры miniapp
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {overviewLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[76px] animate-pulse rounded-xl border border-dark-700/45 bg-dark-800/35"
              />
            ))
          : summaryItems.map((item) => (
              <MiniStat
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
                status={item.status}
              />
            ))}
      </div>

      {overview ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
          <Section
            title="Диагностика"
            action={
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] ${statusClasses[overview.status]}`}
              >
                {statusLabel(overview.status)}
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-3">
              {overview.diagnostics.map((item) => (
                <div
                  key={item.key}
                  className="min-w-0 rounded-lg border border-dark-700/45 bg-dark-900/30 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium text-dark-100">
                      {getDiagnosticLabel(item)}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] ${statusClasses[item.status]}`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-dark-500">
                    {getDiagnosticMessage(item)}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Превью /start">
            <div className="rounded-lg border border-dark-700/45 bg-dark-950/35 p-3">
              <div className="mb-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-dark-500">
                <span>Telegram</span>
                <span
                  className={`rounded-full border px-2 py-0.5 normal-case tracking-normal ${
                    isCustomStartActive(overview)
                      ? 'border-violet-400/25 bg-violet-500/10 text-violet-200'
                      : 'border-success-500/25 bg-success-500/10 text-success-300'
                  }`}
                >
                  {isCustomStartActive(overview) ? 'кастомный /start' : 'обычное меню'}
                </span>
              </div>
              {isCustomStartActive(overview) ? (
                <>
                  <div className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-dark-900/70 p-2.5 text-xs leading-5 text-dark-200">
                    {overview.start.message_text}
                  </div>
                  <div className="mt-2 truncate rounded-md border border-accent-400/25 bg-accent-500/10 px-2.5 py-1.5 text-center text-sm font-medium text-accent-200">
                    {overview.start.button_text}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-dark-500">
                    {compactUrl(overview.start.button_url)}
                  </div>
                </>
              ) : (
                <div className="rounded-md bg-dark-900/70 p-2.5 text-xs leading-5 text-dark-300">
                  При /start бот покажет стандартный текст и обычные кнопки меню.
                </div>
              )}
            </div>
          </Section>
        </div>
      ) : null}

      {overview ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Section title="Поддержка">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <span className="text-dark-500">Канал</span>
              <span className="truncate text-right font-medium text-dark-100">
                {supportLabel(overview.support.support_type)}
              </span>
              <span className="text-dark-500">Тикеты</span>
              <span className="text-right font-medium text-dark-100">
                {overview.support.tickets_enabled ? 'доступны' : 'недоступны'}
              </span>
              <span className="text-dark-500">Профиль</span>
              <span className="truncate text-right font-medium text-dark-100">
                {overview.support.support_username || 'не задан'}
              </span>
            </div>
          </Section>

          <Section title="Тикеты">
            <div className="grid grid-cols-4 gap-2">
              <MiniStat label="Всего" value={String(overview.metrics.tickets_total)} />
              <MiniStat label="7 дней" value={String(overview.metrics.tickets_created_7d)} />
              <MiniStat label="Открыто" value={String(overview.metrics.tickets_open)} />
              <MiniStat label="Ждут" value={String(overview.metrics.tickets_pending)} />
            </div>
            <div className="mt-2 truncate text-xs text-dark-500">{getTicketHealth(overview)}</div>
          </Section>

          <Section title="Miniapp">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-dark-500">URL</span>
                <span className="truncate text-right font-medium text-dark-100">
                  {compactUrl(overview.config.miniapp_url)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-dark-500">Покупка</span>
                <span className="truncate text-right font-medium text-dark-100">
                  {overview.config.purchase_url
                    ? compactUrl(overview.config.purchase_url)
                    : 'основной URL'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-dark-500">Аккаунт</span>
                <span className="truncate text-right font-medium text-dark-100">
                  {accountModeLabel(overview.mode.account_linking_mode)}
                </span>
              </div>
            </div>
          </Section>
        </div>
      ) : null}

      <Section title="Быстрые настройки">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SmallLinkCard
            to="/admin/ultima-settings/start-message"
            title="Сообщение /start"
            subtitle="текст, WebApp и кнопки"
          />
          <SmallLinkCard
            to="/admin/ultima-settings/theme"
            title="Темы и сцены"
            subtitle="цвета, фон и анимации"
          />
          <SmallLinkCard
            to="/admin/ultima-settings/traffic-warning"
            title="Заканчивается трафик"
            subtitle="порог, текст и кнопка докупки"
          />
        </div>
      </Section>

      <Section title="Информация">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SmallLinkCard
            to="/ultima/info"
            title="Раздел в miniapp"
            subtitle="как видит пользователь"
          />
          <SmallLinkCard to="/ultima/info" title="FAQ" subtitle="вопросы и ответы" />
          <SmallLinkCard to="/ultima/info" title="Правила" subtitle="условия сервиса" />
          <SmallLinkCard
            to="/admin/ultima-settings/agreement"
            title="Соглашение"
            subtitle="редактирование Ultima"
          />
          <SmallLinkCard to="/ultima/info" title="Политика" subtitle="конфиденциальность" />
          <SmallLinkCard to="/ultima/info" title="Оферта" subtitle="публичные условия" />
          <SmallLinkCard to="/admin/promo-groups" title="Лояльность" subtitle="уровни и группы" />
        </div>
      </Section>

      <Section title="Параметры Ultima">
        {isLoading ? (
          <div className="py-6 text-center text-sm text-dark-400">{t('common.loading')}</div>
        ) : ultimaSettings.length === 0 ? (
          <div className="rounded-lg border border-dark-700/40 bg-dark-900/35 p-4 text-center text-sm text-dark-400">
            Параметры Ultima не найдены. Проверьте категории MINIAPP/HAPP в системных настройках.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {groupedUltimaSettings.map((group) => (
              <Link
                key={group.key}
                to={`/admin/ultima-settings/params/${encodeURIComponent(group.key)}`}
                className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-dark-700/45 bg-dark-900/30 px-3 py-2.5 transition hover:border-violet-400/40 hover:bg-dark-800/60"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-dark-100">
                    {group.label}
                  </span>
                  <span className="block text-xs text-dark-500">
                    {group.items.length} параметров
                  </span>
                </span>
                <span className="shrink-0 text-xs text-dark-500 transition group-hover:text-violet-300">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
