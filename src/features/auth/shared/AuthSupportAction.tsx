import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { infoApi } from '@/api/info';
import { Button } from '@/components/primitives';
import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';
import { buildSupportTelegramUrl, formatSupportUsername } from '@/utils/supportContact';

interface AuthSupportActionProps {
  visible?: boolean;
  containerClassName?: string;
  buttonClassName?: string;
  usernameClassName?: string;
}

export function AuthSupportAction({
  visible = true,
  containerClassName,
  buttonClassName,
  usernameClassName,
}: AuthSupportActionProps) {
  const { t } = useTranslation();
  const { openTelegramLink } = usePlatform();
  const { data: supportConfig } = useQuery({
    queryKey: ['support-config'],
    queryFn: infoApi.getSupportConfig,
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });

  const supportUsername = useMemo(
    () => formatSupportUsername(supportConfig?.support_username),
    [supportConfig?.support_username],
  );
  const supportTelegramUrl = useMemo(
    () => buildSupportTelegramUrl(supportConfig?.support_username),
    [supportConfig?.support_username],
  );

  if (!visible || !supportTelegramUrl) {
    return null;
  }

  return (
    <div className={cn('space-y-2', containerClassName)}>
      <Button
        type="button"
        variant="secondary"
        size="md"
        fullWidth
        className={buttonClassName}
        onClick={() => openTelegramLink(supportTelegramUrl)}
      >
        {t('support.contactUs', { defaultValue: 'Связаться с поддержкой' })}
      </Button>
      {supportUsername ? (
        <p className={cn('text-center text-xs text-dark-500', usernameClassName)}>
          {supportUsername}
        </p>
      ) : null}
    </div>
  );
}
