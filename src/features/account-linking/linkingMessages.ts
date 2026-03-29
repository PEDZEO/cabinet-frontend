import type { TFunction } from 'i18next';
import { getLocalizedAuthErrorDetailMessage } from '@/features/auth/shared/authErrorMessages';

export function getLocalizedIdentityLinkMessage(
  t: TFunction,
  code?: string | null,
  fallback?: string | null,
  provider?: string | null,
): string {
  switch (code) {
    case 'identity_linked':
      return t(
        'successNotification.accountLinked.message',
        'Привязка завершена. Теперь вы можете входить через связанные способы входа.',
      );
    default:
      return getLocalizedAuthErrorDetailMessage(t, {
        code,
        message: fallback,
        provider,
      });
  }
}
