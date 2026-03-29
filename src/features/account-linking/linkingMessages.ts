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
    case 'link_code_identity_conflict':
      return t(
        'profile.linking.errors.identityConflict',
        'Этот способ входа уже привязан к другому профилю. Сначала войдите в него или отвяжите вход там.',
      );
    case 'telegram_relink_requires_unlink':
      return t(
        'profile.linking.errors.telegramRelinkRequiresUnlink',
        'Чтобы привязать другой Telegram, сначала отвяжите текущий Telegram-аккаунт.',
      );
    case 'telegram_relink_cooldown_active':
      return t(
        'profile.linking.errors.telegramRelinkCooldownActive',
        'Смена Telegram-аккаунта доступна не чаще одного раза в 30 дней.',
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
