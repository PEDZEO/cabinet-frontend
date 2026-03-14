import type { TFunction } from 'i18next';

const GIFT_GATEWAY_PREFIX_RE = /^gift gateway settle:/i;
const GIFT_PREFIX_RE = /^gift:/i;

function localizeGiftPrefix(text: string, t: TFunction): string {
  if (GIFT_GATEWAY_PREFIX_RE.test(text)) {
    return text.replace(
      GIFT_GATEWAY_PREFIX_RE,
      `${t('balance.giftGatewaySettle', { defaultValue: 'Покупка подарка' })}:`,
    );
  }

  if (GIFT_PREFIX_RE.test(text)) {
    return text.replace(GIFT_PREFIX_RE, `${t('balance.giftLabel', { defaultValue: 'Подарок' })}:`);
  }

  return text;
}

export function formatTransactionDescription(
  description: string | null,
  type: string,
  t: TFunction,
): string | null {
  if (!description) return null;

  const trimmed = description.trim();
  if (!trimmed) return null;

  const normalizedType = type?.toUpperCase?.() ?? type;
  if (normalizedType === 'GIFT_PAYMENT' || normalizedType === 'GIFT_PURCHASE') {
    return localizeGiftPrefix(trimmed, t);
  }

  return trimmed;
}
