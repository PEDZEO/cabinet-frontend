import type { AWSDK } from '@antarctic-wallet/aw-sdk';
import { apiClient } from '@/api/client';
import type { PaymentMethod } from '@/types';
import { isAntarcticDocument } from '@/utils/token';

export const ANTARCTIC_METHOD = 'antarctic';
export type AntarcticPaymentStatus = 'credited' | 'pending' | 'rejected' | 'expired' | 'failed';

export const antarcticPaymentMessage = (status: Exclude<AntarcticPaymentStatus, 'credited'>) => {
  if (status === 'pending')
    return 'Ждём подтверждения. После оплаты баланс обновится автоматически.';
  if (status === 'rejected') return 'Оплата отменена в кошельке.';
  if (status === 'expired') return 'Срок оплаты истёк. Попробуйте ещё раз.';
  return 'Кошелёк не подтвердил оплату. Попробуйте ещё раз.';
};

type Limits = Pick<PaymentMethod, 'min_amount_kopeks' | 'max_amount_kopeks'>;
type TopUp = { id: string; operation_id: string | null; status: AntarcticPaymentStatus };
let connection: { wallet: AWSDK; limits: Limits } | undefined;

export function connectAntarcticPayments(wallet: AWSDK, limits: Limits) {
  const current = { wallet, limits };
  connection = current;
  return () => {
    if (connection === current) connection = undefined;
  };
}

export function getAntarcticPaymentMethod(): PaymentMethod | null {
  if (!isAntarcticDocument || !connection?.wallet.getSession()?.grantedScopes.includes('pay')) {
    return null;
  }
  return {
    id: ANTARCTIC_METHOD,
    name: 'Antarctic Wallet',
    description: 'Подтверждение оплаты в кошельке',
    min_amount_kopeks: connection.limits.min_amount_kopeks,
    max_amount_kopeks: connection.limits.max_amount_kopeks,
    is_available: true,
    is_default_for_subscription: true,
  };
}

const path = '/cabinet/antarctic/balance/topups';

export async function getAntarcticTopUpStatus(id: string): Promise<AntarcticPaymentStatus> {
  const token = connection?.wallet.idToken;
  if (!isAntarcticDocument || !token) throw new Error('wallet_unavailable');
  const { data } = await apiClient.get<TopUp>(`${path}/${id}`, {
    headers: { 'X-Antarctic-Token': token },
  });
  return data.status;
}

export async function payWithAntarctic(
  amountKopeks: number,
  onCreated?: (id: string) => void,
): Promise<AntarcticPaymentStatus> {
  const wallet = connection?.wallet;
  if (!getAntarcticPaymentMethod() || !wallet?.idToken) throw new Error('wallet_unavailable');
  const { data: order } = await apiClient.post<TopUp>(
    path,
    { amount_kopeks: amountKopeks },
    { headers: { 'X-Antarctic-Token': wallet.idToken } },
  );
  onCreated?.(order.id);
  if (order.status !== 'pending' || !order.operation_id) return order.status;

  try {
    await wallet.operations.requestConfirmation(order.operation_id);
  } catch (error) {
    if ((error as { errorCode?: string })?.errorCode === 'user_rejected') return 'rejected';
    // A transport error can arrive after the wallet approves. Reconcile on the server.
  }

  for (const delay of [0, 1500, 2500, 4000, 6000]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (!wallet.idToken) break;
    const status = await getAntarcticTopUpStatus(order.id).catch(() => null);
    if (status && status !== 'pending') return status;
  }
  return 'pending'; // The signed webhook can still credit the balance after closing the app.
}
