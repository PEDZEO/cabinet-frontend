import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import {
  UltimaDesktopPanel,
  UltimaDesktopSectionLayout,
} from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getPromocodeErrorKey } from '@/utils/promocodeErrors';

type GiftActivationNotice = {
  senderDisplay: string | null;
  tariffName: string | null;
  periodDays: number | null;
};

const PromocodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
    <path
      d="M4.5 8.5A2.5 2.5 0 0 1 7 6h10a2.5 2.5 0 0 1 2.5 2.5v1.4a1.6 1.6 0 0 0 0 3.2v1.4A2.5 2.5 0 0 1 17 17H7a2.5 2.5 0 0 1-2.5-2.5v-1.4a1.6 1.6 0 0 0 0-3.2V8.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M9.5 9.5h5M9.5 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

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

  const bottomNav = <UltimaBottomNav active="profile" />;

  const promocodeContent = (
    <section className="border-emerald-200/12 min-h-0 flex-1 overflow-y-auto rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md lg:overflow-visible lg:p-4">
      <p className="text-white/68 mb-2 text-[13px]">
        {t('balance.promocode.inputLabel', { defaultValue: 'Введите промокод' })}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={promocode}
          onChange={(event) => setPromocode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onApply();
            }
          }}
          placeholder={t('balance.promocode.placeholder')}
          disabled={activateMutation.isPending}
          className="border-emerald-200/12 h-11 min-w-0 flex-1 rounded-xl border bg-emerald-950/35 px-3 text-[14px] text-white placeholder:text-white/35 focus:border-emerald-200/30 focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={activateMutation.isPending || !promocode.trim()}
          className="h-11 shrink-0 rounded-xl border border-emerald-200/30 bg-emerald-400/90 px-3 text-[13px] font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {activateMutation.isPending ? t('common.loading') : t('balance.promocode.activate')}
        </button>
      </div>

      {error ? <p className="mt-2 text-[12px] text-rose-200">{error}</p> : null}
      {success ? <p className="mt-2 text-[12px] text-emerald-200">{success}</p> : null}

      <div className="mt-3 rounded-2xl border border-emerald-200/10 bg-emerald-950/20 px-3 py-2.5">
        <p className="text-white/58 text-[11px] leading-snug">
          {t('balance.promocode.ultimaHint', {
            defaultValue:
              'Если промокод действителен, бонус применится сразу и отразится в истории операций.',
          })}
        </p>
      </div>
    </section>
  );

  if (isDesktop) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<PromocodeIcon />}
          eyebrow={t('balance.promocode.title', { defaultValue: 'Промокод' })}
          title={t('balance.promocode.title', { defaultValue: 'Промокод' })}
          subtitle={t('balance.promocode.ultimaDescription', {
            defaultValue:
              'Активируйте промокод для бонусов. Скидки и бонусы будут учтены в подписке автоматически.',
          })}
          metrics={[
            {
              label: t('balance.promocode.inputLabel', { defaultValue: 'Код' }),
              value: promocode.trim().length > 0 ? promocode.trim().toUpperCase() : '—',
              hint: t('promocode.desktopCodeHint', {
                defaultValue: 'Код можно вставить вручную или ввести из подарочной ссылки.',
              }),
            },
            {
              label: t('common.status', { defaultValue: 'Статус' }),
              value: activateMutation.isPending ? t('common.loading') : success ? 'OK' : 'Ready',
              hint:
                error ||
                success ||
                t('promocode.desktopStatusHint', {
                  defaultValue: 'После активации обновятся баланс и параметры подписки.',
                }),
            },
            {
              label: t('nav.gift', { defaultValue: 'Подарок' }),
              value: giftActivationNotice ? 'Gift' : '—',
              hint: t('promocode.desktopGiftHint', {
                defaultValue: 'Подарочные коды активируются в этом же окне.',
              }),
            },
          ]}
          aside={
            <UltimaDesktopPanel
              title={t('promocode.desktopAsideTitle', { defaultValue: 'Как это работает' })}
              subtitle={t('promocode.desktopAsideHint', {
                defaultValue:
                  'Промокоды и подарочные коды применяются мгновенно и сразу отражаются в подписке.',
              })}
            >
              <div className="space-y-3">
                <div className="text-white/72 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-[1.6]">
                  {t('balance.promocode.ultimaHint', {
                    defaultValue:
                      'Если промокод действителен, бонус применится сразу и отразится в истории операций.',
                  })}
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-white/42 text-[11px] uppercase tracking-[0.2em]">
                    {t('common.result', { defaultValue: 'Результат' })}
                  </div>
                  <div className="mt-2 text-sm font-medium text-white/90">
                    {success ||
                      error ||
                      t('promocode.desktopReady', { defaultValue: 'Ожидает активации' })}
                  </div>
                </div>
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          {promocodeContent}
        </UltimaDesktopSectionLayout>

        {giftActivationNotice && (
          <>
            <div className="bg-black/52 absolute inset-0 z-[18]" />
            <div className="absolute inset-x-0 top-24 z-20 flex justify-center px-6">
              <div className="w-full max-w-[520px]">
                <div className="ultima-step-enter border-white/24 rounded-[24px] border bg-[#05070B] p-4 text-white shadow-[0_26px_56px_rgba(0,0,0,0.72)] backdrop-blur-xl">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="text-[24px] font-semibold leading-[1.06] text-white/95">
                      {t('balance.promocode.giftNoticeTitle', {
                        defaultValue: 'Подарок активирован',
                      })}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setGiftActivationNotice(null)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white/90"
                      aria-label="close-gift-activation-modal"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-white/88 text-[14px] leading-[1.28]">
                    {t('balance.promocode.giftNoticeDesc', {
                      defaultValue:
                        'Подарочная подписка успешно активирована. Данные подарка уже применены к вашему аккаунту.',
                    })}
                  </p>
                  <div className="text-white/92 mt-3 space-y-2 text-[14px]">
                    <p>
                      <span className="text-white/65">
                        {t('balance.promocode.giftSender', { defaultValue: 'Отправитель:' })}
                      </span>{' '}
                      {giftActivationNotice.senderDisplay ??
                        t('common.notSpecified', { defaultValue: 'Не указан' })}
                    </p>
                    <p>
                      <span className="text-white/65">
                        {t('balance.promocode.giftPeriod', { defaultValue: 'Срок подарка:' })}
                      </span>{' '}
                      {giftActivationNotice.periodDays != null
                        ? `${giftActivationNotice.periodDays} ${t('gift.days', { defaultValue: 'дн.' })}`
                        : t('common.notSpecified', { defaultValue: 'Не указан' })}
                    </p>
                    {giftActivationNotice.tariffName ? (
                      <p>
                        <span className="text-white/65">
                          {t('balance.promocode.giftTariff', { defaultValue: 'Тариф:' })}
                        </span>{' '}
                        {giftActivationNotice.tariffName}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setGiftActivationNotice(null)}
                    className="border-emerald-200/22 mt-4 flex w-full items-center justify-center rounded-full border bg-[rgba(12,45,42,0.34)] px-5 py-2.5 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md"
                  >
                    {t('subscription.connection.gotIt', {
                      defaultValue: 'Все понятно',
                    })}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-wide ultima-flat-frames">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner lg:max-w-[960px]">
        <header className="mb-3">
          <h1 className="text-[clamp(34px,9.5vw,44px)] font-semibold leading-[0.9] tracking-[-0.01em] text-white">
            {t('balance.promocode.title', { defaultValue: 'Промокод' })}
          </h1>
          <p className="text-white/62 mt-1.5 text-[14px] leading-tight">
            {t('balance.promocode.ultimaDescription', {
              defaultValue:
                'Активируйте промокод для бонусов. Скидки и бонусы будут учтены в подписке автоматически.',
            })}
          </p>
        </header>

        {promocodeContent}

        <div className="ultima-nav-dock">{bottomNav}</div>
      </div>

      {giftActivationNotice && (
        <>
          <div className="bg-black/52 absolute inset-0 z-[18]" />
          <div className="ultima-step-enter border-white/24 absolute inset-x-4 bottom-[252px] z-20 rounded-[24px] border bg-[#05070B] p-4 text-white shadow-[0_26px_56px_rgba(0,0,0,0.72)] backdrop-blur-xl lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-24 lg:w-[500px] lg:-translate-x-1/2">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="text-[24px] font-semibold leading-[1.06] text-white/95">
                {t('balance.promocode.giftNoticeTitle', { defaultValue: 'Подарок активирован' })}
              </h3>
              <button
                type="button"
                onClick={() => setGiftActivationNotice(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white/90"
                aria-label="close-gift-activation-modal"
              >
                ×
              </button>
            </div>
            <p className="text-white/88 text-[14px] leading-[1.28]">
              {t('balance.promocode.giftNoticeDesc', {
                defaultValue:
                  'Подарочная подписка успешно активирована. Данные подарка уже применены к вашему аккаунту.',
              })}
            </p>
            <div className="text-white/92 mt-3 space-y-2 text-[14px]">
              <p>
                <span className="text-white/65">
                  {t('balance.promocode.giftSender', { defaultValue: 'Отправитель:' })}
                </span>{' '}
                {giftActivationNotice.senderDisplay ??
                  t('common.notSpecified', { defaultValue: 'Не указан' })}
              </p>
              <p>
                <span className="text-white/65">
                  {t('balance.promocode.giftPeriod', { defaultValue: 'Срок подарка:' })}
                </span>{' '}
                {giftActivationNotice.periodDays != null
                  ? `${giftActivationNotice.periodDays} ${t('gift.days', { defaultValue: 'дн.' })}`
                  : t('common.notSpecified', { defaultValue: 'Не указан' })}
              </p>
              {giftActivationNotice.tariffName ? (
                <p>
                  <span className="text-white/65">
                    {t('balance.promocode.giftTariff', { defaultValue: 'Тариф:' })}
                  </span>{' '}
                  {giftActivationNotice.tariffName}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setGiftActivationNotice(null)}
              className="border-emerald-200/22 mt-4 flex w-full items-center justify-center rounded-full border bg-[rgba(12,45,42,0.34)] px-5 py-2.5 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md"
            >
              {t('subscription.connection.gotIt', {
                defaultValue: 'Все понятно',
              })}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
