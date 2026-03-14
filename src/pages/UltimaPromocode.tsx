import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { balanceApi } from '@/api/balance';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

export function UltimaPromocode() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [promocode, setPromocode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activateMutation = useMutation({
    mutationFn: async (code: string) => balanceApi.activatePromocode(code),
    onSuccess: async (result) => {
      if (!result.success) return;
      setError(null);
      if (result.activated_gift) {
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
      const axiosError = rawError as { response?: { data?: { detail?: string } } };
      const detail = (axiosError.response?.data?.detail || 'server_error').toLowerCase();
      const key = detail.includes('not found')
        ? 'not_found'
        : detail.includes('expired')
          ? 'expired'
          : detail.includes('fully used')
            ? 'used'
            : detail.includes('already used')
              ? 'already_used_by_user'
              : 'server_error';
      setSuccess(null);
      setError(t(`balance.promocode.errors.${key}`));
    },
  });

  const onApply = () => {
    const code = promocode.trim();
    if (!code || activateMutation.isPending) return;
    setError(null);
    setSuccess(null);
    activateMutation.mutate(code);
  };

  return (
    <div className="ultima-shell ultima-flat-frames">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="ultima-shell-inner">
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

        <section className="border-emerald-200/12 min-h-0 flex-1 overflow-y-auto rounded-3xl border bg-[rgba(12,45,42,0.18)] p-3 backdrop-blur-md">
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

        <div className="ultima-nav-dock">
          <UltimaBottomNav active="profile" />
        </div>
      </div>
    </div>
  );
}
