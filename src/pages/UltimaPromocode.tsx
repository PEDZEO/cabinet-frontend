import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CircleAlert, LoaderCircle, TicketCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { UltimaPortal } from '@/components/ultima/UltimaPortal';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getPromocodeErrorKey } from '@/utils/promocodeErrors';

type GiftActivationNotice = {
  senderDisplay: string | null;
  tariffName: string | null;
  periodDays: number | null;
};
type ActivationState = 'idle' | 'pending' | 'success' | 'error';

function GiftActivationDialog({
  notice,
  isDesktop,
  onClose,
}: {
  notice: GiftActivationNotice;
  isDesktop: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const dialog = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-activation-title"
      className="ultima-step-enter ultima-offers-dialog"
      data-testid="ultima-promocode-gift-dialog"
    >
      <header className="ultima-offers-dialog-heading">
        <h2 id="gift-activation-title">
          {t('balance.promocode.giftNoticeTitle', { defaultValue: 'Подарок активирован' })}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="ultima-offers-icon-button"
          aria-label={t('common.close', { defaultValue: 'Закрыть' })}
        >
          <X size={20} />
        </button>
      </header>
      <p className="ultima-offers-muted">
        {t('balance.promocode.giftNoticeDesc', {
          defaultValue:
            'Подарочная подписка уже применена к вашему аккаунту. Параметры подписки обновлены автоматически.',
        })}
      </p>
      <dl className="ultima-offers-details">
        <div>
          <dt>{t('balance.promocode.giftSender', { defaultValue: 'Отправитель' })}</dt>
          <dd>{notice.senderDisplay ?? t('common.notSpecified', { defaultValue: 'Не указан' })}</dd>
        </div>
        <div>
          <dt>{t('balance.promocode.giftTariff', { defaultValue: 'Тариф' })}</dt>
          <dd>{notice.tariffName ?? t('common.notSpecified', { defaultValue: 'Не указан' })}</dd>
        </div>
        <div>
          <dt>{t('balance.promocode.giftPeriod', { defaultValue: 'Срок подарка' })}</dt>
          <dd>
            {notice.periodDays != null
              ? `${notice.periodDays} ${t('gift.days', { defaultValue: 'дн.' })}`
              : t('common.notSpecified', { defaultValue: 'Не указан' })}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onClose}
        className="ultima-btn-pill ultima-btn-primary ultima-offers-submit"
      >
        {t('subscription.connection.gotIt', { defaultValue: 'Готово' })}
      </button>
    </div>
  );
  if (isDesktop)
    return (
      <>
        <div className="ultima-offers-dialog-backdrop" onClick={onClose} />
        <div className="ultima-offers-dialog-position">{dialog}</div>
      </>
    );
  return (
    <UltimaPortal>
      <div className="ultima-mobile-overlay-backdrop" onClick={onClose} />
      <div className="ultima-mobile-overlay">
        <div className="ultima-mobile-overlay-panel">{dialog}</div>
      </div>
    </UltimaPortal>
  );
}

export function UltimaPromocode() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [promocode, setPromocode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [giftActivationNotice, setGiftActivationNotice] = useState<GiftActivationNotice | null>(
    null,
  );

  const activateMutation = useMutation({
    mutationFn: async (code: string) => balanceApi.activatePromocode(code),
    onSuccess: async (result) => {
      if (!result.success) return;
      setError(null);
      if (result.activated_gift) {
        setGiftActivationNotice({
          senderDisplay: result.gift_sender_display ?? null,
          tariffName: result.gift_tariff_name ?? null,
          periodDays: result.gift_period_days ?? null,
        });
        const giftLabel =
          result.gift_tariff_name && result.gift_period_days
            ? `${result.gift_tariff_name} • ${result.gift_period_days} ${t('gift.days', { defaultValue: 'дн.' })}`
            : null;
        setSuccess(
          giftLabel
            ? t('balance.promocode.giftActivatedWithName', {
                defaultValue: `Подарок активирован: ${giftLabel}`,
              })
            : t('balance.promocode.giftActivated', {
                defaultValue: 'Подарок успешно активирован',
              }),
        );
      } else {
        setSuccess(result.bonus_description || t('balance.promocode.success'));
      }
      setPromocode('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['subscription'] }),
      ]);
    },
    onError: (rawError: unknown) => {
      const key = getPromocodeErrorKey(rawError);
      setSuccess(null);
      setError(t(`balance.promocode.errors.${key}`));
    },
  });

  const onApply = () => {
    const code = promocode.trim();
    if (!code || activateMutation.isPending) return;
    setError(null);
    setSuccess(null);
    setGiftActivationNotice(null);
    activateMutation.mutate(code);
  };

  const activationState: ActivationState = activateMutation.isPending
    ? 'pending'
    : error
      ? 'error'
      : success
        ? 'success'
        : 'idle';
  const bottomNav = <UltimaBottomNav active="profile" />;

  const activationCard = (
    <section
      className="ultima-offers-section ultima-offers-code-form"
      data-testid="ultima-promocode-card"
    >
      <h2>{t('balance.promocode.inputLabel', { defaultValue: 'Активировать код' })}</h2>
      <p className="ultima-offers-muted">
        {t('balance.promocode.ultimaDescription', {
          defaultValue: 'Введите промокод на скидку, бонус или подарочную подписку.',
        })}
      </p>
      <label htmlFor="ultima-promocode-input" className="ultima-offers-field-label">
        {t('balance.promocode.title', { defaultValue: 'Промокод' })}
      </label>
      <div className={`ultima-offers-code-input ${error ? 'is-error' : ''}`}>
        <input
          id="ultima-promocode-input"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          value={promocode}
          onChange={(event) => {
            setPromocode(event.target.value.toUpperCase().replace(/\s+/g, ''));
            if (error) setError(null);
            if (success) setSuccess(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onApply();
          }}
          placeholder={t('balance.promocode.placeholder', { defaultValue: 'Например, GIFT-XXXX' })}
          disabled={activateMutation.isPending}
          data-testid="ultima-promocode-input"
        />
        {promocode ? (
          <button
            type="button"
            onClick={() => {
              setPromocode('');
              setError(null);
              setSuccess(null);
            }}
            disabled={activateMutation.isPending}
            className="ultima-offers-icon-button"
            aria-label={t('common.clear', { defaultValue: 'Очистить' })}
          >
            <X size={18} />
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={activateMutation.isPending || !promocode.trim()}
        data-testid="ultima-promocode-submit"
        className="ultima-btn-pill ultima-btn-primary ultima-offers-submit"
      >
        {activateMutation.isPending ? <LoaderCircle size={18} className="animate-spin" /> : null}
        {activateMutation.isPending
          ? t('common.loading', { defaultValue: 'Проверяем код...' })
          : t('balance.promocode.activate', { defaultValue: 'Активировать' })}
      </button>
      {activationState !== 'idle' ? (
        <div
          className={`ultima-offers-notice is-${activationState}`}
          role={activationState === 'error' ? 'alert' : 'status'}
          data-testid="ultima-promocode-status"
        >
          {activationState === 'pending' ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : activationState === 'success' ? (
            <Check size={18} />
          ) : (
            <CircleAlert size={18} />
          )}
          <span>
            {activationState === 'pending'
              ? t('promocode.desktopChecking', {
                  defaultValue: 'Проверяем код и применяем бонус...',
                })
              : success || error}
          </span>
        </div>
      ) : null}
      <p className="ultima-offers-hint">
        {t('balance.promocode.ultimaHint', {
          defaultValue: 'Результат сразу появится в подписке, балансе или истории операций.',
        })}
      </p>
    </section>
  );
  const dialog = giftActivationNotice ? (
    <GiftActivationDialog
      notice={giftActivationNotice}
      isDesktop={isDesktop}
      onClose={() => setGiftActivationNotice(null)}
    />
  ) : null;
  const explanation = (
    <div className="ultima-offers-explanation">
      <dl className="ultima-offers-info-list">
        <div>
          <dt>Скидка на тариф</dt>
          <dd>Будет учтена при следующей покупке или продлении.</dd>
        </div>
        <div>
          <dt>Бонус на баланс</dt>
          <dd>Сумма появится на балансе сразу после активации.</dd>
        </div>
        <div>
          <dt>Подарочная подписка</dt>
          <dd>Тариф и срок автоматически добавятся к аккаунту.</dd>
        </div>
      </dl>
    </div>
  );
  if (isDesktop)
    return (
      <div
        className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop ultima-offers-page ultima-promocode-page"
        data-testid="ultima-promocode-page"
      >
        <UltimaDesktopSectionLayout
          icon={<TicketCheck size={24} />}
          title={t('balance.promocode.title', { defaultValue: 'Промокод' })}
          subtitle={t('balance.promocode.ultimaDescription', {
            defaultValue: 'Активируйте скидку, бонус или подарочную подписку в одном месте.',
          })}
          aside={
            <UltimaDesktopPanel
              title={t('promocode.desktopAsideTitle', { defaultValue: 'Что можно активировать' })}
            >
              {explanation}
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          {activationCard}
        </UltimaDesktopSectionLayout>
        {dialog}
      </div>
    );
  return (
    <div
      className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-offers-page ultima-promocode-page"
      data-testid="ultima-promocode-page"
    >
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <header className="ultima-offers-mobile-heading">
          <h1>{t('balance.promocode.title', { defaultValue: 'Промокод' })}</h1>
          <p>
            {t('balance.promocode.ultimaDescription', {
              defaultValue: 'Скидки, бонусы и подарки активируются здесь.',
            })}
          </p>
        </header>
        <main className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto pb-2">
          {activationCard}
          {explanation}
        </main>
        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">{bottomNav}</div>
        </div>
      </div>
      {dialog}
    </div>
  );
}
