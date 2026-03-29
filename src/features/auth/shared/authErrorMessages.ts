import type { TFunction } from 'i18next';

type RawApiErrorPayload = {
  code?: unknown;
  message?: unknown;
  provider?: unknown;
  reason?: unknown;
  retry_after_seconds?: unknown;
};

export type ParsedAuthErrorDetail = {
  status?: number | null;
  code?: string | null;
  message?: string | null;
  provider?: string | null;
  reason?: string | null;
  retryAfterSeconds?: number | null;
  fallback?: string | null;
};

const PROVIDER_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  email: 'Email',
  google: 'Google',
  yandex: 'Яндекс',
  discord: 'Discord',
  vk: 'VK',
};

const PROVIDER_ACCOUNT_LABELS: Record<string, string> = {
  telegram: 'Telegram-аккаунт',
  email: 'email-аккаунт',
  google: 'Google-аккаунт',
  yandex: 'аккаунт Яндекса',
  discord: 'Discord-аккаунт',
  vk: 'VK-аккаунт',
};

function normalizeProvider(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function inferProviderFromMessage(message?: string | null): string | null {
  if (!message) return null;
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('telegram')) return 'telegram';
  if (normalized.includes('яндекс') || normalized.includes('yandex')) return 'yandex';
  if (normalized.includes('google')) return 'google';
  if (normalized.includes('discord')) return 'discord';
  if (normalized.includes('vk') || normalized.includes('вконтакте')) return 'vk';
  if (normalized.includes('email') || normalized.includes('почт')) return 'email';

  return null;
}

function getProviderAccountLabel(provider?: string | null): string | null {
  const normalized = normalizeProvider(provider);
  if (!normalized) return null;
  return PROVIDER_ACCOUNT_LABELS[normalized] ?? `${getAuthProviderLabel(normalized)}-аккаунт`;
}

export function getAuthProviderLabel(provider?: string | null): string {
  const normalized = normalizeProvider(provider);
  if (!normalized) return 'этот способ входа';
  return PROVIDER_LABELS[normalized] ?? normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function parseApiErrorDetail(error: unknown): ParsedAuthErrorDetail {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    if (error instanceof Error) {
      return { message: error.message };
    }
    return {};
  }

  const response = (
    error as {
      response?: {
        status?: number;
        data?: {
          detail?: unknown;
        };
      };
    }
  ).response;

  const detail = response?.data?.detail;

  if (!detail) {
    return {
      status: response?.status ?? null,
      message: error instanceof Error ? error.message : null,
    };
  }

  if (typeof detail === 'string') {
    return {
      status: response?.status ?? null,
      message: detail,
      provider: inferProviderFromMessage(detail),
    };
  }

  if (typeof detail === 'object') {
    const payload = detail as RawApiErrorPayload;
    const message = typeof payload.message === 'string' ? payload.message : null;
    const providerFromPayload = typeof payload.provider === 'string' ? payload.provider : null;

    return {
      status: response?.status ?? null,
      code: typeof payload.code === 'string' ? payload.code : null,
      message,
      provider: normalizeProvider(providerFromPayload) ?? inferProviderFromMessage(message),
      reason: typeof payload.reason === 'string' ? payload.reason : null,
      retryAfterSeconds:
        typeof payload.retry_after_seconds === 'number' ? payload.retry_after_seconds : null,
    };
  }

  return {
    status: response?.status ?? null,
  };
}

export function getLocalizedAuthErrorMessage(
  t: TFunction,
  error: unknown,
  options?: {
    provider?: string | null;
    fallback?: string | null;
  },
): string {
  const parsed = parseApiErrorDetail(error);
  return getLocalizedAuthErrorDetailMessage(t, {
    ...parsed,
    provider:
      normalizeProvider(options?.provider) ??
      normalizeProvider(parsed.provider) ??
      inferProviderFromMessage(parsed.message),
    fallback: options?.fallback ?? parsed.fallback ?? null,
  });
}

export function shouldShowSupportCtaForAuthError(error: unknown): boolean {
  return shouldShowSupportCtaForAuthErrorDetail(parseApiErrorDetail(error));
}

export function shouldShowSupportCtaForAuthErrorDetail(detail: ParsedAuthErrorDetail): boolean {
  const code = detail.code?.trim().toLowerCase() ?? '';
  const message = detail.message?.trim().toLowerCase() ?? '';

  return (
    code === 'account_inactive' ||
    code === 'manual_merge_required' ||
    /user account is not active/i.test(message)
  );
}

export function getLocalizedAuthErrorDetailMessage(
  t: TFunction,
  detail: ParsedAuthErrorDetail,
): string {
  const message = detail.message?.trim() || '';
  const provider =
    normalizeProvider(detail.provider) ??
    inferProviderFromMessage(message) ??
    inferProviderFromMessage(detail.fallback);
  const providerLabel = getAuthProviderLabel(provider);
  const providerAccountLabel = getProviderAccountLabel(provider);
  const shouldRenderProviderConflict =
    detail.code === 'link_code_identity_conflict' ||
    /already linked to another account/i.test(message) ||
    (detail.code === 'telegram_relink_requires_unlink' &&
      provider !== null &&
      provider !== 'telegram');

  if (shouldRenderProviderConflict) {
    if (providerAccountLabel) {
      return t('auth.errors.providerAlreadyLinked', {
        providerAccount: providerAccountLabel,
        defaultValue:
          'Этот {{providerAccount}} уже привязан к другому профилю. Войдите через него или отвяжите этот способ входа в том аккаунте.',
      });
    }

    return t(
      'profile.linking.errors.identityConflict',
      'Этот способ входа уже привязан к другому профилю. Сначала войдите в него или отвяжите вход там.',
    );
  }

  switch (detail.code) {
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
      return t('auth.errors.providerUnavailable', {
        provider: providerLabel,
        defaultValue: 'Вход через {{provider}} сейчас недоступен.',
      });
    case 'oauth_exchange_failed':
      return t('auth.errors.oauthExchangeFailed', {
        provider: providerLabel,
        defaultValue: 'Не удалось подтвердить вход через {{provider}}. Попробуйте еще раз.',
      });
    case 'oauth_userinfo_failed':
      return t('auth.errors.oauthUserinfoFailed', {
        provider: providerLabel,
        defaultValue: 'Не удалось получить данные от сервиса {{provider}}. Попробуйте еще раз.',
      });
    default:
      break;
  }

  if (/access_denied|denied access|authorization was denied/i.test(message)) {
    return t('auth.errors.oauthDenied', {
      provider: providerLabel,
      defaultValue: 'Вход через {{provider}} был отменен.',
    });
  }

  if (/invalid or expired oauth state/i.test(message)) {
    return t('auth.errors.oauthStateExpired', {
      provider: providerLabel,
      defaultValue: 'Сессия входа через {{provider}} истекла. Запустите авторизацию заново.',
    });
  }

  if (/oauth state is reserved for account linking/i.test(message)) {
    return t('auth.errors.oauthStateReservedForLinking', {
      defaultValue: 'Эта ссылка предназначена для привязки аккаунта. Начните обычный вход заново.',
    });
  }

  if (/unsupported vk oauth response type/i.test(message)) {
    return t('auth.errors.vkUnsupportedResponseType', {
      defaultValue: 'VK вернул неподдерживаемый ответ. Начните вход через VK заново.',
    });
  }

  if (/missing vk device_id in callback/i.test(message)) {
    return t('auth.errors.vkMissingDeviceId', {
      defaultValue: 'VK не передал данные устройства. Начните вход через VK еще раз.',
    });
  }

  if (/missing vk pkce verifier/i.test(message)) {
    return t('auth.errors.vkMissingVerifier', {
      defaultValue: 'Сессия входа через VK устарела. Начните вход через VK заново.',
    });
  }

  if (/failed to exchange authorization code/i.test(message)) {
    return t('auth.errors.oauthExchangeFailed', {
      provider: providerLabel,
      defaultValue: 'Не удалось подтвердить вход через {{provider}}. Попробуйте еще раз.',
    });
  }

  if (/failed to fetch user information from provider/i.test(message)) {
    return t('auth.errors.oauthUserinfoFailed', {
      provider: providerLabel,
      defaultValue: 'Не удалось получить данные от сервиса {{provider}}. Попробуйте еще раз.',
    });
  }

  if (/invalid or expired telegram authentication data/i.test(message)) {
    return t('auth.errors.telegramDataExpired', {
      defaultValue: 'Данные Telegram устарели. Запустите вход заново.',
    });
  }

  if (/user account is not active/i.test(message)) {
    return t('auth.errors.accountInactive', {
      defaultValue: 'Ваш аккаунт временно недоступен. Обратитесь в поддержку.',
    });
  }

  if (/already registered/i.test(message)) {
    return t('auth.emailAlreadyRegistered', 'This email is already registered');
  }

  if (/verify your email/i.test(message)) {
    return t('auth.emailNotVerified', 'Please verify your email first');
  }

  if (/invalid email or password|invalid credentials/i.test(message)) {
    return t('auth.invalidCredentials', 'Invalid email or password');
  }

  if (detail.status === 429) {
    return t('auth.tooManyAttempts', 'Too many attempts. Please try again later');
  }

  if (message) {
    return message;
  }

  if (detail.fallback) {
    return detail.fallback;
  }

  return t('common.error', 'Произошла ошибка');
}
