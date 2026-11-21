import { AWSDK, AWScope } from '@antarctic-wallet/aw-sdk';
import { useEffect, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { connectAntarcticPayments } from './payment';
import './style.css';

type Bootstrap = {
  app_id: string;
  origins: string[];
  min_amount_kopeks: number;
  max_amount_kopeks: number;
};
type Session = { access_token: string; refresh_token: string };

const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request<T>(path: string, signal: AbortSignal, token?: string): Promise<T> {
  const response = await fetch(`${base}/cabinet/antarctic/${path}`, {
    method: token ? 'POST' : 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: 'omit',
    cache: 'no-store',
    signal,
  });
  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? 'Доступ к аккаунту ограничен.'
        : 'Не удалось открыть кабинет. Попробуйте ещё раз.',
    );
  }
  return response.json() as Promise<T>;
}

function AntarcticEntry() {
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [Cabinet, setCabinet] = useState<ComponentType | null>(null);
  const insideWallet = AWSDK.isInsideWallet();

  useEffect(() => {
    if (!insideWallet) return;
    const controller = new AbortController();
    let wallet: AWSDK | undefined;
    let disconnectPayments: (() => void) | undefined;

    const open = async () => {
      const referrer = document.referrer ? new URL(document.referrer).origin : '';
      const parentOrigin = new URLSearchParams(location.search).get('parentOrigin') ?? referrer;
      const config = await request<Bootstrap>('bootstrap', controller.signal);
      if (!config.origins.includes(parentOrigin)) {
        throw new Error('Откройте Ultimteam VPN из раздела «Сервисы» в Antarctic Wallet.');
      }
      if (controller.signal.aborted) return;
      wallet = new AWSDK({
        appId: config.app_id,
        parentOrigin,
        scopes: [AWScope.USER_DATA, AWScope.PAY],
        persistSession: false,
      });
      // Preload the shared cabinet while the wallet is establishing its session.
      const [session, { tokenStorage }, { default: WalletCabinet }] = await Promise.all([
        wallet.init().then(() => {
          if (!wallet?.idToken) throw new Error('Не удалось подтвердить вход в кошелёк.');
          return request<Session>('session', controller.signal, wallet.idToken);
        }),
        import('../utils/token'),
        import('./WalletCabinet'),
      ]);
      if (controller.signal.aborted) return;
      tokenStorage.setTokens(session.access_token, session.refresh_token);
      disconnectPayments = connectAntarcticPayments(wallet, config);
      if (!location.hash || location.hash === '#/login') history.replaceState(null, '', '#/');
      setCabinet(() => WalletCabinet);
    };

    void open().catch((cause: unknown) => {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Не удалось открыть кабинет.');
      }
    });
    return () => {
      controller.abort();
      disconnectPayments?.();
      wallet?.destroy();
    };
  }, [attempt, insideWallet]);

  if (Cabinet) return <Cabinet />;

  return (
    <main className="antarctic-entry">
      {!insideWallet ? (
        <>
          <p>Откройте приложение в Antarctic Wallet.</p>
          <a href="https://aw.me/app/85245360">Открыть Ultimteam VPN</a>
        </>
      ) : error ? (
        <>
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError('');
              setAttempt((previous) => previous + 1);
            }}
          >
            Попробовать ещё раз
          </button>
        </>
      ) : (
        <div className="antarctic-entry-loading" role="status">
          <span aria-hidden="true" />
          Открываем кабинет…
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<AntarcticEntry />);
