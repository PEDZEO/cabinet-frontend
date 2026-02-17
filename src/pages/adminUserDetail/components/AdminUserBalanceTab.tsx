import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserDetailResponse } from '../../../api/adminUsers';
import { createNumberInputHandler } from '../../../utils/inputHelpers';
import { MinusIcon, PlusIcon } from './Icons';

interface AdminUserBalanceTabProps {
  user: UserDetailResponse;
  balanceAmount: number | '';
  setBalanceAmount: Dispatch<SetStateAction<number | ''>>;
  balanceDescription: string;
  setBalanceDescription: Dispatch<SetStateAction<string>>;
  offerDiscountPercent: number | '';
  setOfferDiscountPercent: Dispatch<SetStateAction<number | ''>>;
  offerValidHours: number | '';
  setOfferValidHours: Dispatch<SetStateAction<number | ''>>;
  offerSending: boolean;
  actionLoading: boolean;
  confirmingAction: string | null;
  formatDate: (date: string) => string;
  formatWithCurrency: (value: number) => string;
  onUpdateBalance: (isAdd: boolean) => void;
  onConfirmDeactivateOffer: () => void;
  onSendOffer: () => void;
}

export function AdminUserBalanceTab({
  user,
  balanceAmount,
  setBalanceAmount,
  balanceDescription,
  setBalanceDescription,
  offerDiscountPercent,
  setOfferDiscountPercent,
  offerValidHours,
  setOfferValidHours,
  offerSending,
  actionLoading,
  confirmingAction,
  formatDate,
  formatWithCurrency,
  onUpdateBalance,
  onConfirmDeactivateOffer,
  onSendOffer,
}: AdminUserBalanceTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-accent-500/30 bg-gradient-to-r from-accent-500/20 to-accent-700/20 p-4">
        <div className="mb-1 text-sm text-dark-400">{t('admin.users.detail.balance.current')}</div>
        <div className="text-3xl font-bold text-dark-100">
          {formatWithCurrency(user.balance_rubles)}
        </div>
      </div>

      <div className="space-y-3 rounded-xl bg-dark-800/50 p-4">
        <input
          type="number"
          value={balanceAmount}
          onChange={createNumberInputHandler(setBalanceAmount)}
          placeholder={t('admin.users.detail.balance.amountPlaceholder')}
          className="input"
        />
        <input
          type="text"
          value={balanceDescription}
          onChange={(event) => setBalanceDescription(event.target.value)}
          placeholder={t('admin.users.detail.balance.descriptionPlaceholder')}
          className="input"
          maxLength={500}
        />
        <div className="flex gap-2">
          <button
            onClick={() => onUpdateBalance(true)}
            disabled={actionLoading || balanceAmount === ''}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success-500 py-2 text-white transition-colors hover:bg-success-600 disabled:opacity-50"
          >
            <PlusIcon /> {t('admin.users.detail.balance.add')}
          </button>
          <button
            onClick={() => onUpdateBalance(false)}
            disabled={actionLoading || balanceAmount === ''}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-error-500 py-2 text-white transition-colors hover:bg-error-600 disabled:opacity-50"
          >
            <MinusIcon /> {t('admin.users.detail.balance.subtract')}
          </button>
        </div>
      </div>

      {user.promo_offer_discount_percent > 0 && (
        <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-accent-400">
              {t('admin.users.detail.activePromoOffer')}
            </span>
            <button
              onClick={onConfirmDeactivateOffer}
              disabled={actionLoading}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
                confirmingAction === 'deactivateOffer'
                  ? 'bg-error-500 text-white'
                  : 'bg-error-500/15 text-error-400 hover:bg-error-500/25'
              }`}
            >
              {confirmingAction === 'deactivateOffer'
                ? t('admin.users.detail.actions.areYouSure')
                : t('admin.users.detail.deactivateOffer')}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-dark-100">
                {user.promo_offer_discount_percent}%
              </div>
              <div className="text-xs text-dark-500">{t('admin.users.detail.discount')}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-dark-100">
                {user.promo_offer_discount_source || '-'}
              </div>
              <div className="text-xs text-dark-500">{t('admin.users.detail.source')}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-dark-100">
                {user.promo_offer_discount_expires_at
                  ? formatDate(user.promo_offer_discount_expires_at)
                  : '-'}
              </div>
              <div className="text-xs text-dark-500">{t('admin.users.detail.expiresAt')}</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-dark-800/50 p-4">
        <div className="mb-3 text-sm font-medium text-dark-200">
          {t('admin.users.detail.sendOffer')}
        </div>
        <div className="space-y-3">
          <input
            type="number"
            value={offerDiscountPercent}
            onChange={createNumberInputHandler(setOfferDiscountPercent, 1)}
            placeholder={t('admin.users.detail.discountPercent')}
            className="input"
            min={1}
            max={100}
          />
          <input
            type="number"
            value={offerValidHours}
            onChange={createNumberInputHandler(setOfferValidHours, 1)}
            placeholder={t('admin.users.detail.validHours')}
            className="input"
            min={1}
            max={8760}
          />
          <button
            onClick={onSendOffer}
            disabled={offerSending || offerDiscountPercent === '' || offerValidHours === ''}
            className="btn-primary w-full disabled:opacity-50"
          >
            {offerSending ? t('common.loading') : t('admin.users.detail.sendOffer')}
          </button>
        </div>
      </div>

      {user.recent_transactions.length > 0 && (
        <div className="rounded-xl bg-dark-800/50 p-4">
          <div className="mb-3 font-medium text-dark-200">
            {t('admin.users.detail.balance.recentTransactions')}
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {user.recent_transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b border-dark-700 py-2 last:border-0"
              >
                <div>
                  <div className="text-sm text-dark-200">
                    {transaction.description || transaction.type}
                  </div>
                  <div className="text-xs text-dark-500">{formatDate(transaction.created_at)}</div>
                </div>
                <div
                  className={transaction.amount_kopeks >= 0 ? 'text-success-400' : 'text-error-400'}
                >
                  {transaction.amount_kopeks >= 0 ? '+' : ''}
                  {formatWithCurrency(transaction.amount_rubles)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
