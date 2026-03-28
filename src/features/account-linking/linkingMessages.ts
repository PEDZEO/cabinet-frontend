import type { TFunction } from 'i18next';

export function getLocalizedIdentityLinkMessage(
  t: TFunction,
  code?: string | null,
  fallback?: string | null,
): string {
  switch (code) {
    case 'identity_linked':
      return t(
        'successNotification.accountLinked.message',
        'Привязка завершена. Теперь вы можете входить через связанные способы входа.',
      );
    case 'manual_merge_required':
      return t(
        'profile.linking.errors.manualMergeRequired',
        'Оба аккаунта содержат данные. Нужна ручная обработка поддержки.',
      );
    case 'link_target_missing':
      return t('profile.linking.errors.targetMissing', 'Аккаунт для привязки не найден');
    case 'link_target_mismatch':
      return t(
        'profile.linking.errors.targetMismatch',
        'Привязка относится к другой сессии кабинета. Запустите ее заново.',
      );
    case 'oauth_provider_invalid':
      return t('profile.linking.errors.providerUnavailable', 'Этот способ входа сейчас недоступен');
    default:
      return fallback || t('common.error', 'Произошла ошибка');
  }
}
