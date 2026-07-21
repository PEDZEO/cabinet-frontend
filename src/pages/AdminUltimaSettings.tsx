import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BellRing,
  ChevronRight,
  CircleCheck,
  FileText,
  Gauge,
  Headphones,
  Info,
  LayoutDashboard,
  MessageSquareText,
  MonitorSmartphone,
  Palette,
  Settings2,
  ShieldCheck,
  Smartphone,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { adminSettingsApi } from '@/api/adminSettings';
import { adminUltimaApi, type UltimaOverview } from '@/api/adminUltima';
import { AdminBackButton } from '@/components/admin';
import { groupUltimaSettings, isUltimaSetting } from './adminUltimaSettings/utils';

const supportLabel = (type: string) =>
  (
    ({
      tickets: 'Тикеты',
      both: 'Тикеты и Telegram',
      profile: 'Telegram',
      url: 'Внешняя ссылка',
    }) as Record<string, string>
  )[type] || type;

const mainMenuModeLabel = (mode: string) =>
  (
    ({
      cabinet: 'Кабинет',
      bot: 'Бот',
      default: 'Обычное меню',
    }) as Record<string, string>
  )[mode] || mode;

const compactUrl = (value?: string) =>
  value?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'Не настроен';

const formatSettingsCount = (count: number) => {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} параметров`;
  if (mod10 === 1) return `${count} параметр`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} параметра`;
  return `${count} параметров`;
};

const SettingsSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section className="min-w-0">
    <div className="mb-2.5 px-1">
      <h2 className="text-sm font-semibold text-dark-100">{title}</h2>
      <p className="mt-0.5 text-xs leading-5 text-dark-500">{description}</p>
    </div>
    <div className="overflow-hidden rounded-lg border border-dark-700/55 bg-dark-900/25">
      {children}
    </div>
  </section>
);

const SettingLink = ({
  to,
  icon: Icon,
  title,
  description,
  badge,
  badgeTone = 'neutral',
  testId,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  badgeTone?: 'neutral' | 'success' | 'warning';
  testId?: string;
}) => {
  const badgeClasses = {
    neutral: 'border-dark-600/70 bg-dark-800/75 text-dark-300',
    success: 'border-success-500/25 bg-success-500/10 text-success-300',
    warning: 'border-warning-500/25 bg-warning-500/10 text-warning-300',
  }[badgeTone];

  return (
    <Link
      to={to}
      data-testid={testId}
      className="group flex min-h-[68px] min-w-0 items-center gap-3 border-b border-dark-700/45 px-3.5 py-3 last:border-b-0 hover:bg-dark-800/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400/60 sm:px-4"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dark-700/65 bg-dark-800/65 text-dark-300 transition group-hover:border-accent-400/30 group-hover:text-accent-300">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-dark-100">{title}</span>
          {badge ? (
            <span
              className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-flex ${badgeClasses}`}
            >
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-dark-500">{description}</span>
      </span>
      {badge ? (
        <span
          className={`max-w-[96px] shrink-0 truncate rounded-full border px-2 py-0.5 text-[10px] font-medium sm:hidden ${badgeClasses}`}
        >
          {badge}
        </span>
      ) : null}
      <ChevronRight
        className="h-4 w-4 shrink-0 text-dark-600 transition group-hover:translate-x-0.5 group-hover:text-dark-300"
        strokeWidth={1.8}
      />
    </Link>
  );
};

const StatusItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <div className="flex min-w-0 items-center gap-2.5 px-3 py-2.5 sm:px-4">
    <Icon className="h-4 w-4 shrink-0 text-dark-500" strokeWidth={1.8} />
    <span className="min-w-0">
      <span className="block text-[10px] font-medium uppercase text-dark-600">{label}</span>
      <span className="block truncate text-xs font-medium text-dark-200">{value}</span>
    </span>
  </div>
);

function startState(overview?: UltimaOverview) {
  if (!overview) return undefined;
  if (!overview.start.enabled) return { label: 'Выключено', tone: 'warning' as const };
  if (overview.start.fallback_to_regular_menu) {
    return { label: 'Обычное меню', tone: 'warning' as const };
  }
  return { label: 'Настроено', tone: 'success' as const };
}

function groupPresentation(key: string, fallbackLabel: string) {
  const normalized = key.toUpperCase();
  if (normalized === 'HAPP') {
    return {
      icon: Smartphone,
      title: 'Happ и ссылки',
      description: 'Клиент, deeplink и защищенные ссылки',
    };
  }
  if (normalized.includes('MINIAPP') || normalized.includes('MINI_APP')) {
    return {
      icon: MonitorSmartphone,
      title: 'Mini App',
      description: 'Покупка, поддержка и поведение кабинета',
    };
  }
  return {
    icon: Settings2,
    title: fallbackLabel,
    description: 'Дополнительные параметры Ultima',
  };
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

  const { data: meteredTrafficStatus } = useQuery({
    queryKey: ['admin', 'ultima', 'metered-traffic'],
    queryFn: adminSettingsApi.getMeteredTrafficStatus,
    refetchInterval: 30000,
  });

  const ultimaSettings = useMemo(
    () => (allSettings ?? []).filter((setting) => isUltimaSetting(setting)),
    [allSettings],
  );
  const groupedUltimaSettings = useMemo(
    () => groupUltimaSettings(ultimaSettings).filter((group) => group.key !== 'METERED_TRAFFIC'),
    [ultimaSettings],
  );
  const currentStartState = startState(overview);

  return (
    <div
      className="mx-auto max-w-6xl animate-fade-in space-y-6 pb-6"
      data-testid="admin-ultima-settings"
    >
      <header className="flex items-center gap-3">
        <AdminBackButton to="/admin" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-dark-100 sm:text-xl">
            {t('admin.nav.ultimaSettings', { defaultValue: 'Настройки Ultima' })}
          </h1>
          <p className="truncate text-xs text-dark-500 sm:text-sm">
            Кабинет, бот, трафик и способы подключения
          </p>
        </div>
      </header>

      {overviewLoading ? (
        <div className="h-[118px] animate-pulse rounded-lg border border-dark-700/45 bg-dark-800/30" />
      ) : overview ? (
        <section
          className="overflow-hidden rounded-lg border border-dark-700/55 bg-dark-900/30"
          data-testid="ultima-current-state"
        >
          <div className="flex flex-wrap items-center gap-3 px-3.5 py-3 sm:px-4">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                overview.mode.enabled
                  ? 'border-success-500/25 bg-success-500/10 text-success-300'
                  : 'border-warning-500/25 bg-warning-500/10 text-warning-300'
              }`}
            >
              {overview.mode.enabled ? (
                <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.8} />
              ) : (
                <Settings2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-dark-100">
                {overview.mode.enabled ? 'Ultima включена' : 'Ultima выключена'}
              </span>
              <span className="block truncate text-xs text-dark-500">
                {overview.mode.enabled
                  ? 'Новый кабинет доступен пользователям'
                  : 'Пользователи работают в обычном режиме'}
              </span>
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                overview.mode.enabled
                  ? 'border-success-500/25 bg-success-500/10 text-success-300'
                  : 'border-warning-500/25 bg-warning-500/10 text-warning-300'
              }`}
            >
              {overview.mode.enabled ? 'Активна' : 'Отключена'}
            </span>
          </div>
          <div className="grid grid-cols-1 divide-y divide-dark-700/45 border-t border-dark-700/45 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <StatusItem
              icon={LayoutDashboard}
              label="Главное меню"
              value={mainMenuModeLabel(overview.mode.main_menu_mode)}
            />
            <StatusItem
              icon={Headphones}
              label="Поддержка"
              value={supportLabel(overview.support.support_type)}
            />
            <StatusItem
              icon={MonitorSmartphone}
              label="Mini App"
              value={compactUrl(overview.config.miniapp_url)}
            />
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-x-8 gap-y-7 lg:grid-cols-2">
        <SettingsSection title="Основное" description="То, что пользователи видят в первую очередь">
          <SettingLink
            to="/admin/ultima-settings/theme"
            icon={Palette}
            title="Внешний вид"
            description="Темы, цвета, фон и анимации"
          />
          <SettingLink
            to="/admin/ultima-settings/start-message"
            icon={MessageSquareText}
            title="Сообщение /start"
            description="Текст, кнопка приложения и быстрые действия"
            badge={currentStartState?.label}
            badgeTone={currentStartState?.tone}
          />
          <SettingLink
            to="/ultima/info"
            icon={Info}
            title="Информация в кабинете"
            description="FAQ, правила, политика и оферта"
          />
          <SettingLink
            to="/admin/ultima-settings/agreement"
            icon={FileText}
            title="Соглашение Ultima"
            description="Текст согласия перед использованием"
          />
        </SettingsSection>

        <SettingsSection title="Сервис" description="Трафик, уведомления и работа с пользователями">
          <SettingLink
            to="/admin/ultima-settings/traffic-warning"
            icon={BellRing}
            title="Заканчивается трафик"
            description="Порог, сообщение и кнопка докупки"
          />
          <SettingLink
            to="/admin/ultima-settings/metered-traffic"
            icon={Gauge}
            title="Раздельный трафик"
            description={
              meteredTrafficStatus?.enabled
                ? `${meteredTrafficStatus.subscriptions.active} активных · ${meteredTrafficStatus.subscriptions.blocked} без трафика`
                : 'Спецсерверы, сквады и коэффициенты нод'
            }
            badge={
              meteredTrafficStatus?.enabled
                ? meteredTrafficStatus.running
                  ? 'Работает'
                  : 'Ожидает'
                : 'Выключен'
            }
            badgeTone={
              meteredTrafficStatus?.enabled && meteredTrafficStatus.running ? 'success' : 'neutral'
            }
          />
          <SettingLink
            to="/admin/tickets/settings"
            icon={Headphones}
            title="Поддержка и тикеты"
            description="Канал связи, уведомления и время ответа"
          />
          <SettingLink
            to="/admin/promo-groups"
            icon={Users}
            title="Лояльность"
            description="Промогруппы, скидки и условия доступа"
          />
        </SettingsSection>
      </div>

      <SettingsSection
        title="Приложение и подключения"
        description="Технические параметры клиентов собраны по назначению"
      >
        {isLoading ? (
          <div className="flex min-h-[76px] items-center justify-center px-4 text-sm text-dark-400">
            {t('common.loading')}
          </div>
        ) : groupedUltimaSettings.length === 0 ? (
          <div className="flex min-h-[76px] items-center gap-3 px-4 py-3 text-sm text-dark-400">
            <CircleCheck className="h-5 w-5 shrink-0 text-dark-600" />
            Дополнительные параметры не найдены
          </div>
        ) : (
          groupedUltimaSettings.map((group) => {
            const presentation = groupPresentation(group.key, group.label);
            return (
              <SettingLink
                key={group.key}
                to={`/admin/ultima-settings/params/${encodeURIComponent(group.key)}`}
                icon={presentation.icon}
                title={presentation.title}
                description={presentation.description}
                badge={formatSettingsCount(group.items.length)}
              />
            );
          })
        )}
      </SettingsSection>
    </div>
  );
}
