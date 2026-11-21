import { AWSDK, AWScope } from '@antarctic-wallet/aw-sdk';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Plan = { amount: string; plan_name: string; days: number; device_limit: number };
type Config = Plan & { app_id: string; origins: string[] };
type Order = Plan & {
  status: 'pending' | 'paid' | 'delivered' | 'rejected' | 'failed' | 'expired';
  operation_id: string | null;
  subscription_url: string | null;
  expires_at: string | null;
};

const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function api<T>(endpoint: string, sdk?: AWSDK, signal?: AbortSignal): Promise<T> {
  const token = sdk?.idToken;
  if (sdk && !token) throw new Error('В кошельке не удалось подтвердить вход.');
  const response = await fetch(`${base}/cabinet/antarctic/${endpoint}`, {
    method: sdk ? 'POST' : 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: 'omit',
    cache: 'no-store',
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? 'Сессия истекла. Откройте приложение в кошельке заново.'
        : 'Сервис временно недоступен. Попробуйте ещё раз.',
    );
  return response.json() as Promise<T>;
}

export function MiniApp() {
  const sdk = useRef<AWSDK | null>(null);
  const busyRef = useRef(false);
  const [plan, setPlan] = useState<Plan>();
  const [order, setOrder] = useState<Order | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const open = async () => {
      const referrer = document.referrer ? new URL(document.referrer).origin : '';
      const parent = new URLSearchParams(location.search).get('parentOrigin') ?? referrer;
      if (!AWSDK.isInsideWallet() || !parent)
        throw new Error('Откройте приложение в Antarctic Wallet.');
      const config = await api<Config>('config', undefined, controller.signal);
      if (!config.origins.includes(parent))
        throw new Error('Откройте приложение в Antarctic Wallet.');
      if (controller.signal.aborted) return;
      setPlan(config);
      const wallet = new AWSDK({
        appId: config.app_id,
        parentOrigin: parent,
        scopes: [AWScope.USER_DATA, AWScope.PAY],
        persistSession: false,
      });
      sdk.current = wallet;
      await wallet.init();
      if (controller.signal.aborted) return;
      setReady(true);
      const current = await api<Order | null>('status', wallet, controller.signal);
      setOrder(current);
    };
    void open().catch((cause: unknown) => {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Не удалось открыть приложение.');
    });
    return () => {
      controller.abort();
      sdk.current?.destroy();
      sdk.current = null;
    };
  }, []);

  useEffect(() => {
    if (!waiting) return;
    const controller = new AbortController();
    let timer: number;
    let attempts = 0;
    const refresh = async () => {
      const wallet = sdk.current;
      if (!wallet) return;
      try {
        const current = await api<Order | null>('status', wallet, controller.signal);
        if (controller.signal.aborted) return;
        setOrder(current);
        if (current && current.status !== 'pending' && current.status !== 'paid') {
          setWaiting(false);
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (++attempts < 12) timer = window.setTimeout(() => void refresh(), 2500);
      else {
        setWaiting(false);
        setError('Обновите статус через несколько секунд.');
      }
    };
    void refresh();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [waiting]);

  const run = async (pay: boolean) => {
    const wallet = sdk.current;
    if (!wallet || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    let confirmationStarted = false;
    try {
      const current = await api<Order | null>(pay ? 'checkout' : 'status', wallet);
      setOrder(current);
      if (pay && current?.status === 'pending' && current.operation_id) {
        confirmationStarted = true;
        await wallet.operations.requestConfirmation(current.operation_id);
      }
      if (current?.status === 'pending' || current?.status === 'paid') setWaiting(true);
    } catch (cause) {
      if (confirmationStarted) setWaiting(true);
      else setError(cause instanceof Error ? cause.message : 'Не удалось обновить заказ.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const active = order?.status === 'delivered' && Date.parse(order.expires_at ?? '') > Date.now();
  const pending = order?.status === 'pending';
  const paid = order?.status === 'paid';
  const shown = active || pending || paid ? order : plan;

  return (
    <main>
      <p className="brand">Ultimteam VPN</p>
      <h1>{active ? 'Подписка активна' : 'Подписка на VPN'}</h1>
      {shown && (
        <section aria-label="Тариф">
          <strong>{shown.plan_name}</strong>
          <p>
            {shown.days} дней · устройств: {shown.device_limit}
          </p>
          {!active && <p className="price">${shown.amount} USD</p>}
        </section>
      )}
      {active && order?.subscription_url && (
        <a href={order.subscription_url} target="_blank" rel="noopener noreferrer">
          Подключить VPN
        </a>
      )}
      {ready && !active && !paid && (
        <button type="button" disabled={busy || waiting} onClick={() => void run(true)}>
          {pending ? 'Продолжить оплату' : 'Оплатить через Antarctic'}
        </button>
      )}
      {ready && (pending || paid) && (
        <button
          className="secondary"
          type="button"
          disabled={busy || waiting}
          onClick={() => void run(false)}
        >
          Проверить статус
        </button>
      )}
      {!ready && !error && <p role="status">Подключаем кошелёк…</p>}
      {(busy || waiting || paid) && (
        <p role="status">{paid ? 'Оплата получена. Выдаём подписку…' : 'Проверяем оплату…'}</p>
      )}
      {order?.status === 'rejected' && <p role="status">Оплата отменена.</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<MiniApp />);
