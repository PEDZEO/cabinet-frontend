/**
 * Global success notification modal.
 * Shows prominent success messages for balance top-ups and subscription purchases.
 */

import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { useSuccessNotification } from '../store/successNotification';
import { useCurrency } from '../hooks/useCurrency';
import { getCachedUltimaMode } from '../hooks/useUltimaMode';
import { useTelegramSDK } from '../hooks/useTelegramSDK';
import { useHaptic } from '@/platform';
import { useAuthStore } from '@/store/auth';
import { dismissTopUpFollowUp } from '@/utils/topUpFollowUp';

// Icons
const CheckCircleIcon = () => (
  <svg
    className="h-16 w-16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WalletIcon = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
    />
  </svg>
);

const RocketIcon = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
    />
  </svg>
);

const DevicesIcon = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
    />
  </svg>
);

const TrafficIcon = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0-5-5m5 5-5 5" />
  </svg>
);

const InstallAppIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v10m0 0 3.5-3.5M12 13 8.5 9.5M7 17.5h10M8.75 21h6.5A2.25 2.25 0 0 0 17.5 18.75V5.25A2.25 2.25 0 0 0 15.25 3h-6.5A2.25 2.25 0 0 0 6.5 5.25v13.5A2.25 2.25 0 0 0 8.75 21Z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function SuccessNotificationModal() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const isOpen = useSuccessNotification((state) => state.isOpen);
  const data = useSuccessNotification((state) => state.data);
  const hide = useSuccessNotification((state) => state.hide);
  const { formatAmount, currencySymbol } = useCurrency();
  const { safeAreaInset, contentSafeAreaInset, isTelegramWebApp } = useTelegramSDK();
  const haptic = useHaptic();

  const safeBottom = isTelegramWebApp
    ? Math.max(safeAreaInset.bottom, contentSafeAreaInset.bottom)
    : 0;
  const isUltimaTheme = getCachedUltimaMode() === true || location.pathname.startsWith('/ultima');

  const handleClose = useCallback(() => {
    hide();
  }, [hide]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Haptic feedback on open
  useEffect(() => {
    if (isOpen) {
      haptic.notification('success');
    }
  }, [isOpen, haptic]);

  // Scroll lock
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const isBalanceTopup = data.type === 'balance_topup';
  const isSubscription =
    data.type === 'subscription_activated' ||
    data.type === 'subscription_renewed' ||
    data.type === 'subscription_purchased';
  const isDevicesPurchased = data.type === 'devices_purchased';
  const isTrafficPurchased = data.type === 'traffic_purchased';
  const isUltimaBalanceTopup = isUltimaTheme && isBalanceTopup;
  const isPurchaseSuccess = isSubscription || isDevicesPurchased || isTrafficPurchased;
  const subscriptionDetailsPath =
    isUltimaTheme && isPurchaseSuccess ? '/ultima/subscription-info' : '/subscription';

  // Format amount
  const formattedAmount = data.amountKopeks
    ? `${formatAmount(data.amountKopeks / 100)} ${currencySymbol}`
    : null;

  // Format new balance
  const formattedBalance =
    data.newBalanceKopeks !== undefined
      ? `${formatAmount(data.newBalanceKopeks / 100)} ${currencySymbol}`
      : null;

  // Format expiry date
  const formattedExpiry = data.expiresAt
    ? new Date(data.expiresAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Determine title and message
  let title = data.title;
  const message = data.message;
  let icon = <CheckCircleIcon />;
  let gradientClass = 'from-success-500 to-success-600';

  if (!title) {
    if (isBalanceTopup) {
      title = t('successNotification.balanceTopup.title', 'Balance topped up!');
      icon = <WalletIcon />;
      gradientClass = 'from-success-500 to-success-600';
    } else if (data.type === 'subscription_activated') {
      title = t('successNotification.subscriptionActivated.title', 'Subscription activated!');
      icon = <RocketIcon />;
      gradientClass = 'from-accent-500 to-purple-600';
    } else if (data.type === 'subscription_renewed') {
      title = t('successNotification.subscriptionRenewed.title', 'Subscription renewed!');
      icon = <RocketIcon />;
      gradientClass = 'from-accent-500 to-purple-600';
    } else if (data.type === 'subscription_purchased') {
      title = t('successNotification.subscriptionPurchased.title', 'Subscription purchased!');
      icon = <RocketIcon />;
      gradientClass = 'from-accent-500 to-purple-600';
    } else if (data.type === 'devices_purchased') {
      title = t('successNotification.devicesPurchased.title', 'Devices added!');
      icon = <DevicesIcon />;
      gradientClass = 'from-blue-500 to-cyan-600';
    } else if (data.type === 'traffic_purchased') {
      title = t('successNotification.trafficPurchased.title', 'Traffic added!');
      icon = <TrafficIcon />;
      gradientClass = 'from-success-500 to-success-600';
    }
  }

  const handleGoToSubscription = () => {
    hide();
    navigate(subscriptionDetailsPath);
  };

  const handleGoToBalance = () => {
    hide();
    navigate('/balance');
  };

  const handleGoToConnection = () => {
    hide();
    navigate('/connection');
  };

  const handleDismissTopUpFollowUp = () => {
    dismissTopUpFollowUp(userId);
    hide();
  };

  const modalClassName = isUltimaTheme
    ? 'relative mx-3 w-full max-w-sm overflow-y-auto overscroll-contain rounded-[28px] border shadow-2xl max-h-[calc(100dvh-1.5rem)]'
    : 'relative mx-3 w-full max-w-sm overflow-y-auto overscroll-contain rounded-3xl border border-dark-700/50 bg-dark-900 shadow-2xl max-h-[calc(100dvh-1.5rem)]';
  const detailCardClassName = isUltimaTheme
    ? 'flex min-w-0 items-center justify-between gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md'
    : 'flex min-w-0 items-center justify-between rounded-xl bg-dark-800/50 px-4 py-3';
  const primaryButtonClassName = isUltimaTheme
    ? 'ultima-btn-pill ultima-btn-primary flex w-full items-center justify-center gap-2 px-4 py-3.5 text-center text-[15px] font-semibold leading-snug'
    : 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 py-3.5 text-center font-bold leading-snug text-white shadow-lg shadow-accent-500/25 transition-all hover:from-accent-400 hover:to-accent-500 active:from-accent-600 active:to-accent-700';
  const balanceButtonClassName = isUltimaTheme
    ? 'ultima-btn-pill ultima-btn-secondary flex w-full items-center justify-center gap-2 px-4 py-3.5 text-center text-[15px] font-semibold leading-snug'
    : 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-success-500 to-success-600 py-3.5 text-center font-bold leading-snug text-white shadow-lg shadow-success-500/25 transition-all hover:from-success-400 hover:to-success-500 active:from-success-600 active:to-success-700';
  const devicesButtonClassName = isUltimaTheme
    ? 'ultima-btn-pill ultima-btn-primary flex w-full items-center justify-center gap-2 px-4 py-3.5 text-center text-[15px] font-semibold leading-snug'
    : 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 py-3.5 text-center font-bold leading-snug text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-400 hover:to-cyan-500 active:from-blue-600 active:to-cyan-700';
  const trafficButtonClassName = isUltimaTheme
    ? 'ultima-btn-pill ultima-btn-primary flex w-full items-center justify-center gap-2 px-4 py-3.5 text-center text-[15px] font-semibold leading-snug'
    : 'flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-success-500 to-success-600 py-3.5 text-center font-bold leading-snug text-white shadow-lg shadow-success-500/25 transition-all hover:from-success-400 hover:to-success-500 active:from-success-600 active:to-success-700';
  const secondaryButtonClassName = isUltimaTheme
    ? 'ultima-btn-pill ultima-btn-secondary flex w-full items-center justify-center gap-2 px-4 py-3.5 text-center text-[15px] font-semibold leading-snug'
    : 'w-full rounded-xl bg-dark-800 py-3 text-center font-semibold leading-snug text-dark-300 transition-colors hover:bg-dark-700 hover:text-dark-100';

  const modalStyle = isUltimaTheme
    ? {
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 36%, transparent)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--ultima-color-bg-top) 92%, transparent) 0%, color-mix(in srgb, var(--ultima-color-bg-bottom) 94%, transparent) 100%)',
        boxShadow:
          '0 24px 64px rgba(2, 12, 20, 0.54), inset 0 1px 0 color-mix(in srgb, #ffffff 10%, transparent)',
      }
    : undefined;
  const closeButtonStyle = isUltimaTheme
    ? {
        color: 'color-mix(in srgb, var(--ultima-color-ring) 76%, #ffffff)',
      }
    : undefined;
  const headerStyle = isUltimaTheme
    ? {
        background:
          'radial-gradient(circle at top, color-mix(in srgb, var(--ultima-color-primary) 44%, transparent) 0%, color-mix(in srgb, var(--ultima-color-primary) 18%, transparent) 34%, transparent 72%)',
        borderBottom:
          '1px solid color-mix(in srgb, var(--ultima-color-surface-border) 16%, transparent)',
      }
    : undefined;
  const iconWrapStyle = isUltimaTheme
    ? {
        border: '1px solid color-mix(in srgb, var(--ultima-color-ring) 28%, transparent)',
        background: 'color-mix(in srgb, var(--ultima-color-surface) 44%, transparent)',
        boxShadow:
          '0 0 0 1px color-mix(in srgb, var(--ultima-color-ring) 10%, transparent), 0 18px 40px color-mix(in srgb, var(--ultima-color-primary) 18%, transparent)',
      }
    : undefined;
  const titleStyle = isUltimaTheme
    ? {
        color: '#ffffff',
      }
    : undefined;
  const messageStyle = isUltimaTheme
    ? {
        color: 'color-mix(in srgb, #ffffff 72%, var(--ultima-color-ring) 28%)',
      }
    : undefined;
  const detailCardStyle = isUltimaTheme
    ? {
        borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 24%, transparent)',
        background: 'color-mix(in srgb, var(--ultima-color-surface) 36%, transparent)',
      }
    : undefined;
  const detailLabelStyle = isUltimaTheme
    ? {
        color: 'rgba(255, 255, 255, 0.62)',
      }
    : undefined;
  const detailValueStyle = isUltimaTheme
    ? {
        color: '#ffffff',
      }
    : undefined;
  const detailAccentValueStyle = isUltimaTheme
    ? {
        color: 'var(--ultima-color-ring)',
      }
    : undefined;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-label={t('common.close', 'Close')}
      />

      {/* Modal */}
      <div
        className={modalClassName}
        style={{
          marginBottom: safeBottom ? `${safeBottom}px` : undefined,
          ...modalStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className={`absolute right-3 top-3 z-10 rounded-xl p-2 transition-colors ${isUltimaTheme ? 'hover:bg-white/10' : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'}`}
          style={closeButtonStyle}
          aria-label={t('common.close', 'Close')}
        >
          <CloseIcon />
        </button>

        {/* Success header with animation */}
        <div
          className={
            isUltimaTheme
              ? 'flex flex-col items-center px-6 pb-8 pt-10 text-center'
              : `flex flex-col items-center bg-gradient-to-br ${gradientClass} px-6 pb-8 pt-10`
          }
          style={headerStyle}
        >
          <div
            className={`mb-4 text-white ${isUltimaTheme ? 'flex h-20 w-20 items-center justify-center rounded-full backdrop-blur-md' : 'animate-bounce'}`}
            style={iconWrapStyle}
          >
            {icon}
          </div>
          <h2
            className="max-w-[16ch] break-words text-center text-2xl font-bold text-white"
            style={titleStyle}
          >
            {title}
          </h2>
          {message && (
            <p className="mt-2 break-words text-center text-white/80" style={messageStyle}>
              {message}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4 p-6">
          {/* Amount */}
          {formattedAmount && (
            <div className={detailCardClassName} style={detailCardStyle}>
              <span
                className={
                  isUltimaTheme ? 'min-w-0 flex-1 pr-2' : 'min-w-0 flex-1 pr-2 text-dark-400'
                }
                style={detailLabelStyle}
              >
                {isBalanceTopup
                  ? t('successNotification.amount', 'Amount')
                  : t('successNotification.price', 'Price')}
              </span>
              <span
                className={`max-w-[58%] break-words text-right text-lg font-bold ${isUltimaTheme ? '' : isDevicesPurchased || isTrafficPurchased ? 'text-dark-100' : 'text-success-400'}`}
                style={
                  isUltimaTheme
                    ? isDevicesPurchased || isTrafficPurchased
                      ? detailValueStyle
                      : detailAccentValueStyle
                    : undefined
                }
              >
                {isDevicesPurchased || isTrafficPurchased ? '' : '+'}
                {formattedAmount}
              </span>
            </div>
          )}

          {/* Devices info (for devices purchase) */}
          {isDevicesPurchased && data.devicesAdded && (
            <div className={detailCardClassName} style={detailCardStyle}>
              <span
                className={
                  isUltimaTheme ? 'min-w-0 flex-1 pr-2' : 'min-w-0 flex-1 pr-2 text-dark-400'
                }
                style={detailLabelStyle}
              >
                {t('successNotification.devicesAdded', 'Devices added')}
              </span>
              <span
                className={`max-w-[58%] break-words text-right text-lg font-bold ${isUltimaTheme ? '' : 'text-blue-400'}`}
                style={isUltimaTheme ? detailAccentValueStyle : undefined}
              >
                +{data.devicesAdded}
              </span>
            </div>
          )}

          {isDevicesPurchased && data.newDeviceLimit && (
            <div className={detailCardClassName} style={detailCardStyle}>
              <span
                className={
                  isUltimaTheme ? 'min-w-0 flex-1 pr-2' : 'min-w-0 flex-1 pr-2 text-dark-400'
                }
                style={detailLabelStyle}
              >
                {t('successNotification.totalDevices', 'Total devices')}
              </span>
              <span
                className={`max-w-[58%] break-words text-right font-semibold ${isUltimaTheme ? '' : 'text-dark-100'}`}
                style={isUltimaTheme ? detailValueStyle : undefined}
              >
                {data.newDeviceLimit}
              </span>
            </div>
          )}

          {/* Traffic info (for traffic purchase) */}
          {isTrafficPurchased && data.trafficGbAdded && (
            <div className={detailCardClassName} style={detailCardStyle}>
              <span
                className={
                  isUltimaTheme ? 'min-w-0 flex-1 pr-2' : 'min-w-0 flex-1 pr-2 text-dark-400'
                }
                style={detailLabelStyle}
              >
                {t('successNotification.trafficAdded', 'Traffic added')}
              </span>
              <span
                className={`max-w-[58%] break-words text-right text-lg font-bold ${isUltimaTheme ? '' : 'text-success-400'}`}
                style={isUltimaTheme ? detailAccentValueStyle : undefined}
              >
                +{data.trafficGbAdded} GB
              </span>
            </div>
          )}

          {isTrafficPurchased && data.newTrafficLimitGb && (
            <div className={detailCardClassName} style={detailCardStyle}>
              <span
                className={
                  isUltimaTheme ? 'min-w-0 flex-1 pr-2' : 'min-w-0 flex-1 pr-2 text-dark-400'
                }
                style={detailLabelStyle}
              >
                {t('successNotification.totalTraffic', 'Total traffic')}
              </span>
              <span
                className={`max-w-[58%] break-words text-right font-semibold ${isUltimaTheme ? '' : 'text-dark-100'}`}
                style={isUltimaTheme ? detailValueStyle : undefined}
              >
                {data.newTrafficLimitGb} GB
              </span>
            </div>
          )}

          {/* New balance (for top-up) */}
          {isBalanceTopup && formattedBalance && (
            <div className={detailCardClassName} style={detailCardStyle}>
              <span
                className={
                  isUltimaTheme ? 'min-w-0 flex-1 pr-2' : 'min-w-0 flex-1 pr-2 text-dark-400'
                }
                style={detailLabelStyle}
              >
                {t('successNotification.newBalance', 'New balance')}
              </span>
              <span
                className={`max-w-[58%] break-words text-right text-lg font-bold ${isUltimaTheme ? '' : 'text-dark-100'}`}
                style={isUltimaTheme ? detailValueStyle : undefined}
              >
                {formattedBalance}
              </span>
            </div>
          )}

          {/* Tariff name */}
          {data.tariffName && (
            <div className={detailCardClassName} style={detailCardStyle}>
              <span
                className={
                  isUltimaTheme ? 'min-w-0 flex-1 pr-2' : 'min-w-0 flex-1 pr-2 text-dark-400'
                }
                style={detailLabelStyle}
              >
                {t('successNotification.tariff', 'Tariff')}
              </span>
              <span
                className={`max-w-[58%] break-words text-right font-semibold ${isUltimaTheme ? '' : 'text-dark-100'}`}
                style={isUltimaTheme ? detailValueStyle : undefined}
              >
                {data.tariffName}
              </span>
            </div>
          )}

          {/* Expiry date */}
          {formattedExpiry && (
            <div className={detailCardClassName} style={detailCardStyle}>
              <span
                className={
                  isUltimaTheme ? 'min-w-0 flex-1 pr-2' : 'min-w-0 flex-1 pr-2 text-dark-400'
                }
                style={detailLabelStyle}
              >
                {t('successNotification.validUntil', 'Valid until')}
              </span>
              <span
                className={`max-w-[58%] break-words text-right font-semibold ${isUltimaTheme ? '' : 'text-dark-100'}`}
                style={isUltimaTheme ? detailValueStyle : undefined}
              >
                {formattedExpiry}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {isBalanceTopup && (
              <button
                type="button"
                onClick={handleGoToSubscription}
                className={primaryButtonClassName}
              >
                <ArrowRightIcon />
                <span className="min-w-0 break-words">
                  {isUltimaBalanceTopup
                    ? t('successNotification.buySubscription', 'Buy subscription')
                    : t('successNotification.goToTariffs', 'Go to Tariffs')}
                </span>
              </button>
            )}

            {isSubscription && (
              <button
                type="button"
                onClick={handleGoToSubscription}
                className={primaryButtonClassName}
              >
                <ArrowRightIcon />
                <span className="min-w-0 break-words">
                  {t('successNotification.goToSubscription', 'Go to Subscription')}
                </span>
              </button>
            )}

            {isUltimaTheme && (isPurchaseSuccess || isBalanceTopup) && (
              <button
                type="button"
                onClick={handleGoToConnection}
                className={secondaryButtonClassName}
              >
                <InstallAppIcon />
                <span className="min-w-0 break-words">
                  {t('successNotification.installApp', 'Install app')}
                </span>
              </button>
            )}

            {isBalanceTopup && !isUltimaBalanceTopup && (
              <button type="button" onClick={handleGoToBalance} className={balanceButtonClassName}>
                <WalletIcon />
                <span className="min-w-0 break-words">
                  {t('successNotification.goToBalance', 'Go to Balance')}
                </span>
              </button>
            )}

            {isDevicesPurchased && (
              <button
                type="button"
                onClick={handleGoToSubscription}
                className={devicesButtonClassName}
              >
                <ArrowRightIcon />
                <span className="min-w-0 break-words">
                  {t('successNotification.goToSubscription', 'Go to Subscription')}
                </span>
              </button>
            )}

            {isTrafficPurchased && (
              <button
                type="button"
                onClick={handleGoToSubscription}
                className={trafficButtonClassName}
              >
                <ArrowRightIcon />
                <span className="min-w-0 break-words">
                  {t('successNotification.goToSubscription', 'Go to Subscription')}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={isUltimaBalanceTopup ? handleDismissTopUpFollowUp : handleClose}
              className={secondaryButtonClassName}
            >
              {isUltimaBalanceTopup
                ? t('successNotification.dontShowAgain', 'Do not show again')
                : t('common.close', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
