import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Infinity as InfinityIcon,
  RefreshCw,
  Search,
  Users,
  WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
  adminCurrentTrafficApi,
  type CurrentTrafficItem,
  type CurrentTrafficSort,
  type CurrentTrafficStatus,
  type CurrentTrafficUsage,
} from '../api/adminCurrentTraffic';
import { AdminBackButton } from '../components/admin/AdminBackButton';
import { usePlatform } from '../platform/hooks/usePlatform';

const usageOptions: Array<{ value: CurrentTrafficUsage; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'healthy', label: 'В норме' },
  { value: 'warning', label: 'Заканчивается' },
  { value: 'exhausted', label: 'Закончился' },
  { value: 'unlimited', label: 'Безлимит' },
];

const statusLabels: Record<string, string> = {
  active: 'Активна',
  trial: 'Триал',
  expired: 'Истекла',
  disabled: 'Отключена',
  limited: 'Ограничена',
};

function formatTraffic(value: number | null, maximumFractionDigits = 2): string {
  if (value === null) return '∞';
  return value.toLocaleString('ru-RU', { maximumFractionDigits });
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getTrafficTone(item: CurrentTrafficItem, warningPercent: number) {
  if (item.is_unlimited) return 'unlimited';
  if (item.is_exhausted) return 'exhausted';
  if ((item.traffic_used_percent ?? 0) >= warningPercent) return 'warning';
  return 'healthy';
}

function TrafficBadge({
  item,
  warningPercent,
}: {
  item: CurrentTrafficItem;
  warningPercent: number;
}) {
  const tone = getTrafficTone(item, warningPercent);
  const variants = {
    unlimited: 'border-accent-500/30 bg-accent-500/10 text-accent-300',
    exhausted: 'border-error-500/30 bg-error-500/10 text-error-300',
    warning: 'border-warning-500/30 bg-warning-500/10 text-warning-300',
    healthy: 'border-success-500/30 bg-success-500/10 text-success-300',
  };
  const labels = {
    unlimited: 'Безлимит',
    exhausted: 'Закончился',
    warning: 'Заканчивается',
    healthy: 'В норме',
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${variants[tone]}`}
    >
      {labels[tone]}
    </span>
  );
}

function TrafficProgress({
  item,
  warningPercent,
}: {
  item: CurrentTrafficItem;
  warningPercent: number;
}) {
  if (item.is_unlimited) {
    return (
      <div className="flex items-center gap-2 text-xs text-accent-300">
        <InfinityIcon className="h-4 w-4" />
        Ограничения нет
      </div>
    );
  }

  const tone = getTrafficTone(item, warningPercent);
  const percent = Math.min(100, Math.max(0, item.traffic_used_percent ?? 0));
  const fill = {
    healthy: 'bg-success-400',
    warning: 'bg-warning-400',
    exhausted: 'bg-error-400',
    unlimited: 'bg-accent-400',
  }[tone];

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-dark-400">Использовано</span>
        <span className="font-medium text-dark-200">{item.traffic_used_percent?.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-dark-700">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

interface MetricButtonProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  detail?: string;
  selected?: boolean;
  tone: 'neutral' | 'success' | 'warning' | 'error';
  onClick?: () => void;
}

function MetricButton({ icon, value, label, detail, selected, tone, onClick }: MetricButtonProps) {
  const tones = {
    neutral: 'text-dark-200 border-dark-700',
    success: 'text-success-300 border-success-500/20',
    warning: 'text-warning-300 border-warning-500/20',
    error: 'text-error-300 border-error-500/20',
  };
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`min-w-0 rounded-lg border bg-dark-800 p-3 text-left transition-colors ${tones[tone]} ${
        selected ? 'ring-1 ring-accent-400' : ''
      } ${onClick ? 'hover:bg-dark-750' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-dark-400">{icon}</span>
        {selected ? <span className="text-[10px] font-medium text-accent-300">Фильтр</span> : null}
      </div>
      <div className="truncate text-xl font-semibold text-current">{value}</div>
      <div className="mt-0.5 text-xs text-dark-400">{label}</div>
      {detail ? <div className="mt-1 truncate text-[10px] text-dark-500">{detail}</div> : null}
    </Component>
  );
}

function UserIdentity({ item }: { item: CurrentTrafficItem }) {
  const secondary = item.username
    ? `@${item.username}`
    : item.email || (item.telegram_id ? `TG ${item.telegram_id}` : `ID ${item.user_id}`);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/15 text-sm font-semibold text-accent-300">
        {(item.full_name || '?').slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-dark-100">{item.full_name}</div>
        <div className="truncate text-[11px] text-dark-500">{secondary}</div>
      </div>
    </div>
  );
}

function TrafficExtras({ item }: { item: CurrentTrafficItem }) {
  if (item.purchased_traffic_gb <= 0 && item.device_bonus_traffic_gb <= 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-dark-400">
      {item.purchased_traffic_gb > 0 ? (
        <span>+{item.purchased_traffic_gb} ГБ докуплено</span>
      ) : null}
      {item.device_bonus_traffic_gb > 0 ? (
        <span>+{item.device_bonus_traffic_gb} ГБ за устройства</span>
      ) : null}
    </div>
  );
}

function DesktopRow({
  item,
  warningPercent,
  onOpen,
}: {
  item: CurrentTrafficItem;
  warningPercent: number;
  onOpen: () => void;
}) {
  const tone = getTrafficTone(item, warningPercent);
  return (
    <button
      type="button"
      data-testid={`traffic-desktop-user-${item.user_id}`}
      onClick={onOpen}
      className={`grid w-full grid-cols-[minmax(180px,1.4fr)_minmax(120px,1fr)_90px_90px_minmax(150px,1.2fr)_100px] items-center gap-3 border-t px-4 py-3 text-left transition-colors hover:bg-dark-700/40 ${
        tone === 'exhausted' ? 'border-error-500/20 bg-error-500/5' : 'border-dark-700'
      }`}
    >
      <UserIdentity item={item} />
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-dark-200">
          {item.tariff_name || 'Без тарифа'}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <TrafficBadge item={item} warningPercent={warningPercent} />
          <span className="truncate text-[10px] text-dark-500">
            {statusLabels[item.subscription_status] || item.subscription_status}
          </span>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-dark-100">
          {formatTraffic(item.traffic_used_gb)}
        </div>
        <div className="text-[10px] text-dark-500">ГБ использовано</div>
      </div>
      <div>
        <div
          className={`text-sm font-semibold ${item.is_exhausted ? 'text-error-300' : 'text-dark-100'}`}
        >
          {formatTraffic(item.traffic_remaining_gb)}
        </div>
        <div className="text-[10px] text-dark-500">ГБ осталось</div>
      </div>
      <div>
        <TrafficProgress item={item} warningPercent={warningPercent} />
        <TrafficExtras item={item} />
      </div>
      <div className="min-w-0 text-right">
        <div className="text-[11px] text-dark-300">{formatDate(item.last_checked_at)}</div>
        <div className="mt-1 text-[10px] text-dark-500">
          {item.device_limit} устр. · до {formatDate(item.end_date).split(',')[0]}
        </div>
      </div>
    </button>
  );
}

function MobileRow({
  item,
  warningPercent,
  onOpen,
}: {
  item: CurrentTrafficItem;
  warningPercent: number;
  onOpen: () => void;
}) {
  const tone = getTrafficTone(item, warningPercent);
  return (
    <button
      type="button"
      data-testid={`traffic-mobile-user-${item.user_id}`}
      onClick={onOpen}
      className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-dark-700/40 ${
        tone === 'exhausted'
          ? 'border-error-500/30 bg-error-500/5'
          : tone === 'warning'
            ? 'border-warning-500/20 bg-dark-800'
            : 'border-dark-700 bg-dark-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <UserIdentity item={item} />
        <TrafficBadge item={item} warningPercent={warningPercent} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-y border-dark-700 py-2.5">
        <div>
          <div className="text-sm font-semibold text-dark-100">
            {formatTraffic(item.traffic_used_gb)}
          </div>
          <div className="text-[10px] text-dark-500">использовано</div>
        </div>
        <div>
          <div
            className={
              item.is_exhausted
                ? 'text-sm font-semibold text-error-300'
                : 'text-sm font-semibold text-dark-100'
            }
          >
            {formatTraffic(item.traffic_remaining_gb)}
          </div>
          <div className="text-[10px] text-dark-500">осталось</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-dark-100">
            {item.is_unlimited ? '∞' : formatTraffic(item.traffic_limit_gb)}
          </div>
          <div className="text-[10px] text-dark-500">лимит, ГБ</div>
        </div>
      </div>
      <div className="mt-3">
        <TrafficProgress item={item} warningPercent={warningPercent} />
        <TrafficExtras item={item} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-dark-500">
        <span className="min-w-0 truncate">
          {item.tariff_name || 'Без тарифа'} · {item.device_limit} устр.
        </span>
        <span className="shrink-0">{formatDate(item.last_checked_at)}</span>
      </div>
    </button>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-lg bg-dark-700/50" />
      ))}
    </div>
  );
}

export default function AdminCurrentTraffic() {
  const navigate = useNavigate();
  const { capabilities } = usePlatform();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const appliedSearchRef = useRef('');
  const [tariffId, setTariffId] = useState<number | undefined>();
  const [status, setStatus] = useState<CurrentTrafficStatus>('current');
  const [usage, setUsage] = useState<CurrentTrafficUsage>('all');
  const [sortBy, setSortBy] = useState<CurrentTrafficSort>('remaining');
  const [sortDesc, setSortDesc] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      if (nextSearch === appliedSearchRef.current) return;

      appliedSearchRef.current = nextSearch;
      setSearch(nextSearch);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: search || undefined,
      tariff_id: tariffId,
      status,
      usage,
      sort_by: sortBy,
      sort_desc: sortDesc,
    }),
    [page, pageSize, search, sortBy, sortDesc, status, tariffId, usage],
  );

  const query = useQuery({
    queryKey: ['admin', 'current-traffic', params],
    queryFn: () => adminCurrentTrafficApi.getCurrentTraffic(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    refetchInterval: 60_000,
  });

  const data = query.data;
  const from = data?.total ? (data.page - 1) * data.page_size + 1 : 0;
  const to = data?.total ? Math.min(data.page * data.page_size, data.total) : 0;

  const changeUsage = (next: CurrentTrafficUsage) => {
    setUsage(next);
    setPage(1);
  };

  return (
    <div className="animate-fade-in pb-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {!capabilities.hasBackButton ? <AdminBackButton to="/admin" /> : null}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-dark-100">Лимиты трафика</h1>
            <p className="text-sm text-dark-400">Текущий расход и остаток по подпискам</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/traffic-usage')}
            className="hidden items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-300 transition-colors hover:bg-dark-700 sm:flex"
          >
            <Activity className="h-4 w-4" />
            По нодам
          </button>
          <button
            type="button"
            title="Обновить данные"
            aria-label="Обновить данные"
            onClick={() => query.refetch()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-700 bg-dark-800 text-dark-300 transition-colors hover:bg-dark-700"
          >
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {data ? (
        <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <MetricButton
            icon={<Users className="h-4 w-4" />}
            value={data.stats.total}
            label="Подписок в выборке"
            detail={`${data.stats.limited} с лимитом · ${data.stats.unlimited} безлимит`}
            tone="neutral"
            selected={usage === 'all'}
            onClick={() => changeUsage('all')}
          />
          <MetricButton
            icon={<Gauge className="h-4 w-4" />}
            value={`${formatTraffic(data.stats.traffic_remaining_gb)} ГБ`}
            label="Осталось суммарно"
            detail={`Использовано ${formatTraffic(data.stats.traffic_used_gb)} ГБ`}
            tone="success"
          />
          <MetricButton
            icon={<AlertTriangle className="h-4 w-4" />}
            value={data.stats.warning}
            label="Трафик заканчивается"
            detail={`Порог ${data.warning_percent}%`}
            tone="warning"
            selected={usage === 'warning'}
            onClick={() => changeUsage(usage === 'warning' ? 'all' : 'warning')}
          />
          <MetricButton
            icon={<WifiOff className="h-4 w-4" />}
            value={data.stats.exhausted}
            label="Трафик закончился"
            tone="error"
            selected={usage === 'exhausted'}
            onClick={() => changeUsage(usage === 'exhausted' ? 'all' : 'exhausted')}
          />
        </div>
      ) : null}

      <div className="mb-4 rounded-lg border border-dark-700 bg-dark-800 p-3">
        <div className="grid gap-2 md:grid-cols-[minmax(220px,1.4fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Имя, username, email или Telegram ID"
              className="h-10 w-full rounded-lg border border-dark-700 bg-dark-900 pl-9 pr-3 text-sm text-dark-100 outline-none transition-colors placeholder:text-dark-500 focus:border-accent-500/60"
            />
          </label>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as CurrentTrafficStatus);
              setPage(1);
            }}
            className="h-10 min-w-0 rounded-lg border border-dark-700 bg-dark-900 px-3 text-sm text-dark-200 outline-none focus:border-accent-500/60"
          >
            <option value="current">Действующие подписки</option>
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="trial">Триалы</option>
            <option value="expired">Истекшие</option>
            <option value="disabled">Отключенные</option>
            <option value="limited">Ограниченные</option>
          </select>
          <select
            value={tariffId ?? ''}
            onChange={(event) => {
              setTariffId(event.target.value ? Number(event.target.value) : undefined);
              setPage(1);
            }}
            className="h-10 min-w-0 rounded-lg border border-dark-700 bg-dark-900 px-3 text-sm text-dark-200 outline-none focus:border-accent-500/60"
          >
            <option value="">Все тарифы</option>
            {(data?.tariffs ?? []).map((tariff) => (
              <option key={tariff.id} value={tariff.id}>
                {tariff.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,auto))_1fr_auto_auto]">
          {usageOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeUsage(option.value)}
              className={`h-9 rounded-lg border px-3 text-xs font-medium transition-colors ${
                usage === option.value
                  ? 'border-accent-500/50 bg-accent-500/15 text-accent-300'
                  : 'border-dark-700 bg-dark-900 text-dark-400 hover:bg-dark-700'
              }`}
            >
              {option.label}
            </button>
          ))}
          <div className="hidden lg:block" />
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as CurrentTrafficSort);
              setPage(1);
            }}
            className="h-9 min-w-0 rounded-lg border border-dark-700 bg-dark-900 px-2 text-xs text-dark-300 outline-none"
          >
            <option value="remaining">По остатку</option>
            <option value="percent">По проценту</option>
            <option value="used">По расходу</option>
            <option value="limit">По лимиту</option>
            <option value="user">По имени</option>
            <option value="tariff">По тарифу</option>
            <option value="end_date">По окончанию</option>
          </select>
          <button
            type="button"
            title={sortDesc ? 'По убыванию' : 'По возрастанию'}
            aria-label={sortDesc ? 'По убыванию' : 'По возрастанию'}
            onClick={() => {
              setSortDesc((value) => !value);
              setPage(1);
            }}
            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-dark-700 bg-dark-900 px-3 text-xs text-dark-300 hover:bg-dark-700"
          >
            {sortDesc ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
            <span className="sm:hidden">Порядок</span>
          </button>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            title="Строк на странице"
            className="h-9 min-w-0 rounded-lg border border-dark-700 bg-dark-900 px-2 text-xs text-dark-300 outline-none"
          >
            <option value={10}>10 строк</option>
            <option value={25}>25 строк</option>
            <option value={50}>50 строк</option>
            <option value={100}>100 строк</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-dark-700 bg-dark-800">
        <div className="hidden grid-cols-[minmax(180px,1.4fr)_minmax(120px,1fr)_90px_90px_minmax(150px,1.2fr)_100px] gap-3 px-4 py-2 text-[10px] font-medium uppercase text-dark-500 xl:grid">
          <span>Пользователь</span>
          <span>Тариф и статус</span>
          <span>Расход</span>
          <span>Остаток</span>
          <span>Лимит</span>
          <span className="text-right">Проверено</span>
        </div>

        {query.isLoading ? (
          <LoadingRows />
        ) : query.isError ? (
          <div className="p-8 text-center">
            <div className="text-sm font-medium text-error-300">Не удалось загрузить трафик</div>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-3 rounded-lg border border-dark-700 px-3 py-2 text-sm text-dark-300 hover:bg-dark-700"
            >
              Повторить
            </button>
          </div>
        ) : data?.items.length ? (
          <>
            <div className="hidden xl:block">
              {data.items.map((item) => (
                <DesktopRow
                  key={item.user_id}
                  item={item}
                  warningPercent={data.warning_percent}
                  onOpen={() => navigate(`/admin/users/${item.user_id}`)}
                />
              ))}
            </div>
            <div className="space-y-2 p-2 xl:hidden">
              {data.items.map((item) => (
                <MobileRow
                  key={item.user_id}
                  item={item}
                  warningPercent={data.warning_percent}
                  onOpen={() => navigate(`/admin/users/${item.user_id}`)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="p-10 text-center text-sm text-dark-400">
            По выбранным фильтрам ничего нет
          </div>
        )}
      </div>

      {data ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-dark-500">
            {from}–{to} из {data.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Предыдущая страница"
              aria-label="Предыдущая страница"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-700 bg-dark-800 text-dark-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-24 text-center text-sm text-dark-300">
              {data.page} из {data.pages}
            </div>
            <button
              type="button"
              title="Следующая страница"
              aria-label="Следующая страница"
              disabled={page >= data.pages}
              onClick={() => setPage((value) => Math.min(data.pages, value + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-700 bg-dark-800 text-dark-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
