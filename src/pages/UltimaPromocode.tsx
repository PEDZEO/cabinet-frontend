import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BadgePercent,
  Check,
  CircleAlert,
  Gift,
  LoaderCircle,
  Sparkles,
  TicketCheck,
  WalletCards,
  X,
} from 'lucide-react';
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
      className="ultima-step-enter w-full max-w-[480px] rounded-[28px] border border-emerald-200/[0.2] bg-[#07110f]/[0.95] p-5 text-white shadow-[0_28px_70px_rgba(0,0,0,0.72)] backdrop-blur-2xl"
      data-testid="ultima-promocode-gift-dialog"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/[0.20] bg-emerald-300/[0.12] text-emerald-100">
          <Gift className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase text-emerald-100/[0.55]">
            {t('promocode.desktopApplied', { defaultValue: 'Код применён' })}
          </p>
          <h2 id="gift-activation-title" className="mt-1 text-[22px] font-semibold leading-tight">
            {t('balance.promocode.giftNoticeTitle', { defaultValue: 'Подарок активирован' })}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-white/[0.65]"
          aria-label={t('common.close', { defaultValue: 'Закрыть' })}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-white/[0.60]">
        {t('balance.promocode.giftNoticeDesc', {
          defaultValue:
            'Подарочная подписка уже применена к вашему аккаунту. Параметры подписки обновлены автоматически.',
        })}
      </p>

      <div className="mt-4 divide-y divide-white/[0.08] rounded-2xl border border-white/[0.09] bg-white/[0.035] px-3">
        <div className="flex items-center justify-between gap-3 py-3 text-[13px]">
          <span className="text-white/[0.45]">
            {t('balance.promocode.giftSender', { defaultValue: 'Отправитель' })}
          </span>
          <span className="min-w-0 truncate text-right font-medium text-white/[0.90]">
            {notice.senderDisplay ?? t('common.notSpecified', { defaultValue: 'Не указан' })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 text-[13px]">
          <span className="text-white/[0.45]">
            {t('balance.promocode.giftTariff', { defaultValue: 'Тариф' })}
          </span>
          <span className="min-w-0 truncate text-right font-medium text-white/[0.90]">
            {notice.tariffName ?? t('common.notSpecified', { defaultValue: 'Не указан' })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 text-[13px]">
          <span className="text-white/[0.45]">
            {t('balance.promocode.giftPeriod', { defaultValue: 'Срок подарка' })}
          </span>
          <span className="font-medium text-white/[0.90]">
            {notice.periodDays != null
              ? `${notice.periodDays} ${t('gift.days', { defaultValue: 'дн.' })}`
              : t('common.notSpecified', { defaultValue: 'Не указан' })}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="ultima-btn-pill ultima-btn-primary mt-4 min-h-[48px] w-full px-5 text-[14px] font-medium"
      >
        {t('subscription.connection.gotIt', { defaultValue: 'Готово' })}
      </button>
    </div>
  );

  if (isDesktop) {
    return (
      <>
        <div
          className="absolute inset-0 z-[18] bg-black/[0.60] backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">{dialog}</div>
      </>
    );
  }

  return (
    <>
      <div className="ultima-mobile-overlay-backdrop" onClick={onClose} />
      <div className="ultima-mobile-overlay">
        <div className="ultima-mobile-overlay-panel">{dialog}</div>
      </div>
    </>
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
      className="rounded-[28px] border border-emerald-200/[0.14] bg-[rgba(9,35,34,0.58)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5"
      data-testid="ultima-promocode-card"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/[0.18] bg-emerald-300/[0.1] text-emerald-100">
          <TicketCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase text-emerald-100/[0.50]">
            {t('balance.promocode.title', { defaultValue: 'Промокод' })}
          </p>
          <h2 className="mt-1 text-[20px] font-semibold leading-tight text-white">
            {t('balance.promocode.inputLabel', { defaultValue: 'Активировать код' })}
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-white/[0.48]">
            {t('balance.promocode.ultimaDescription', {
              defaultValue: 'Введите промокод на скидку, бонус или подарочную подписку.',
            })}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="ultima-promocode-input" className="sr-only">
          {t('balance.promocode.inputLabel', { defaultValue: 'Введите промокод' })}
        </label>
        <div
          className={`flex min-h-[56px] items-center gap-2 rounded-2xl border bg-black/[0.15] px-3 transition ${
            error
              ? 'border-rose-200/[0.30]'
              : success
                ? 'border-emerald-200/[0.35]'
                : 'border-white/[0.12] focus-within:border-emerald-200/[0.35]'
          }`}
        >
          <TicketCheck className="h-5 w-5 shrink-0 text-white/[0.35]" />
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
            placeholder={t('balance.promocode.placeholder', {
              defaultValue: 'Например, GIFT-XXXX',
            })}
            disabled={activateMutation.isPending}
            data-testid="ultima-promocode-input"
            className="min-w-0 flex-1 bg-transparent font-mono text-[15px] font-medium text-white outline-none placeholder:font-sans placeholder:text-white/[0.25] disabled:opacity-60"
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/[0.40]"
              aria-label={t('common.clear', { defaultValue: 'Очистить' })}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onApply}
        disabled={activateMutation.isPending || !promocode.trim()}
        data-testid="ultima-promocode-submit"
        className="ultima-btn-pill ultima-btn-primary mt-3 flex min-h-[50px] w-full items-center justify-center gap-2.5 px-5 text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-45"
      >
        {activateMutation.isPending ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
        {activateMutation.isPending
          ? t('common.loading', { defaultValue: 'Проверяем код...' })
          : t('balance.promocode.activate', { defaultValue: 'Активировать' })}
      </button>

      {activationState !== 'idle' ? (
        <div
          className={`mt-3 flex gap-2.5 rounded-2xl border p-3 text-[12px] leading-relaxed ${
            activationState === 'error'
              ? 'border-rose-200/[0.2] bg-rose-300/[0.08] text-rose-100'
              : activationState === 'success'
                ? 'border-emerald-200/[0.2] bg-emerald-300/[0.08] text-emerald-100'
                : 'border-sky-200/[0.18] bg-sky-300/[0.07] text-sky-50/[0.85]'
          }`}
          role={activationState === 'error' ? 'alert' : 'status'}
          data-testid="ultima-promocode-status"
        >
          {activationState === 'pending' ? (
            <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          ) : activationState === 'success' ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
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

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex min-h-[70px] items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-emerald-100/[0.70]">
            <BadgePercent className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[12px] font-medium text-white/[0.85]">Промокод</span>
            <span className="mt-0.5 block text-[9px] leading-tight text-white/[0.38]">
              Скидка или бонус
            </span>
          </span>
        </div>
        <div className="flex min-h-[70px] items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-emerald-100/[0.70]">
            <Gift className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[12px] font-medium text-white/[0.85]">Подарочный код</span>
            <span className="mt-0.5 block text-[9px] leading-tight text-white/[0.38]">
              Готовая подписка
            </span>
          </span>
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] leading-relaxed text-white/[0.35]">
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

  if (isDesktop) {
    return (
      <div
        className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop"
        data-testid="ultima-promocode-page"
      >
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<TicketCheck className="h-6 w-6" />}
          eyebrow={t('balance.promocode.title', { defaultValue: 'Промокод' })}
          title={t('balance.promocode.title', { defaultValue: 'Промокод' })}
          subtitle={t('balance.promocode.ultimaDescription', {
            defaultValue: 'Активируйте скидку, бонус или подарочную подписку в одном месте.',
          })}
          metrics={[
            {
              label: t('balance.promocode.inputLabel', { defaultValue: 'Код' }),
              value: promocode || '—',
              hint: t('promocode.desktopCodeHint', {
                defaultValue: 'Поддерживаются обычные и подарочные коды.',
              }),
            },
            {
              label: t('common.status', { defaultValue: 'Статус' }),
              value:
                activationState === 'pending'
                  ? t('common.loading', { defaultValue: 'Проверяем' })
                  : activationState === 'success'
                    ? t('promocode.desktopApplied', { defaultValue: 'Применён' })
                    : activationState === 'error'
                      ? t('common.error', { defaultValue: 'Ошибка' })
                      : t('promocode.desktopWaiting', { defaultValue: 'Готов' }),
              hint:
                success ||
                error ||
                t('promocode.desktopStatusHint', {
                  defaultValue: 'Изменения применяются к аккаунту автоматически.',
                }),
            },
            {
              label: t('common.result', { defaultValue: 'Результат' }),
              value: giftActivationNotice
                ? t('nav.gift', { defaultValue: 'Подарок' })
                : success
                  ? t('promocode.desktopApplied', { defaultValue: 'Применён' })
                  : '—',
              hint: t('promocode.desktopGiftHint', {
                defaultValue: 'Подарочная подписка активируется в этом же поле.',
              }),
            },
          ]}
          aside={
            <UltimaDesktopPanel
              title={t('promocode.desktopAsideTitle', { defaultValue: 'Что можно активировать' })}
              subtitle={t('promocode.desktopAsideHint', {
                defaultValue: 'Один экран для скидок, бонусов и подарочных подписок.',
              })}
            >
              <div className="space-y-2">
                {[
                  {
                    icon: <BadgePercent className="h-5 w-5" />,
                    title: 'Скидка на тариф',
                    description: 'Будет учтена при следующей покупке или продлении.',
                  },
                  {
                    icon: <WalletCards className="h-5 w-5" />,
                    title: 'Бонус на баланс',
                    description: 'Сумма появится на балансе сразу после активации.',
                  },
                  {
                    icon: <Gift className="h-5 w-5" />,
                    title: 'Подарочная подписка',
                    description: 'Тариф и срок автоматически добавятся к аккаунту.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-300/[0.08] text-emerald-100/[0.75]">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium text-white/[0.90]">{item.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/[0.45]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </UltimaDesktopPanel>
          }
          bottomNav={bottomNav}
        >
          {activationCard}
        </UltimaDesktopSectionLayout>
        {dialog}
      </div>
    );
  }

  return (
    <div
      className="ultima-shell ultima-shell-wide ultima-flat-frames"
      data-testid="ultima-promocode-page"
    >
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <header className="mb-4 flex items-start gap-3 px-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/[0.16] bg-emerald-300/[0.09] text-emerald-100">
            <TicketCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[30px] font-semibold leading-none text-white">
              {t('balance.promocode.title', { defaultValue: 'Промокод' })}
            </h1>
            <p className="mt-2 text-[13px] leading-[1.45] text-white/[0.58]">
              {t('balance.promocode.ultimaDescription', {
                defaultValue: 'Скидки, бонусы и подарки активируются здесь.',
              })}
            </p>
          </div>
        </header>

        <main className="ultima-scrollbar min-h-0 flex-1 overflow-y-auto pb-2">
          {activationCard}
        </main>

        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">{bottomNav}</div>
        </div>
      </div>
      {dialog}
    </div>
  );
}
