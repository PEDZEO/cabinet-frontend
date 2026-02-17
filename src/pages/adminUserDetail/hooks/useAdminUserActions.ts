import { useCallback } from 'react';
import { adminUsersApi, type UpdateSubscriptionRequest } from '../../../api/adminUsers';
import { promoOffersApi } from '../../../api/promoOffers';
import { promocodesApi } from '../../../api/promocodes';
import { toNumber } from '../../../utils/inputHelpers';

const SUBSCRIPTION_ACTIONS: UpdateSubscriptionRequest['action'][] = [
  'extend',
  'set_end_date',
  'change_tariff',
  'set_traffic',
  'toggle_autopay',
  'cancel',
  'activate',
  'create',
  'add_traffic',
  'remove_traffic',
  'set_device_limit',
];

function isValidSubscriptionAction(action: string): action is UpdateSubscriptionRequest['action'] {
  return SUBSCRIPTION_ACTIONS.includes(action as UpdateSubscriptionRequest['action']);
}

interface NotifyLike {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
}

interface UseAdminUserActionsParams {
  userId: number | null;
  subAction: string;
  subDays: number | '';
  selectedTariffId: number | null;
  balanceAmount: number | '';
  balanceDescription: string;
  referralCommissionValue: number | '';
  offerDiscountPercent: number | '';
  offerValidHours: number | '';
  setActionLoading: (value: boolean) => void;
  setOfferSending: (value: boolean) => void;
  setBalanceAmount: (value: number | '') => void;
  setBalanceDescription: (value: string) => void;
  setEditingPromoGroup: (value: boolean) => void;
  setEditingReferralCommission: (value: boolean) => void;
  setOfferDiscountPercent: (value: number | '') => void;
  setOfferValidHours: (value: number | '') => void;
  setSelectedTrafficGb: (value: string) => void;
  loadUser: () => Promise<void>;
  loadSyncStatus: () => Promise<void>;
  loadDevices: () => Promise<void>;
  navigateToUsers: () => void;
  confirmAction: (message: string) => boolean;
  t: (key: string) => string;
  notify: NotifyLike;
}

export function useAdminUserActions({
  userId,
  subAction,
  subDays,
  selectedTariffId,
  balanceAmount,
  balanceDescription,
  referralCommissionValue,
  offerDiscountPercent,
  offerValidHours,
  setActionLoading,
  setOfferSending,
  setBalanceAmount,
  setBalanceDescription,
  setEditingPromoGroup,
  setEditingReferralCommission,
  setOfferDiscountPercent,
  setOfferValidHours,
  setSelectedTrafficGb,
  loadUser,
  loadSyncStatus,
  loadDevices,
  navigateToUsers,
  confirmAction,
  t,
  notify,
}: UseAdminUserActionsParams) {
  const handleUpdateBalance = useCallback(
    async (isAdd: boolean) => {
      if (balanceAmount === '' || !userId) {
        return;
      }

      setActionLoading(true);
      try {
        const amount = Math.abs(toNumber(balanceAmount) * 100);
        await adminUsersApi.updateBalance(userId, {
          amount_kopeks: isAdd ? amount : -amount,
          description:
            balanceDescription ||
            (isAdd
              ? t('admin.users.detail.balance.addByAdmin')
              : t('admin.users.detail.balance.subtractByAdmin')),
        });
        await loadUser();
        setBalanceAmount('');
        setBalanceDescription('');
      } catch (error) {
        console.error('Failed to update balance:', error);
      } finally {
        setActionLoading(false);
      }
    },
    [
      balanceAmount,
      balanceDescription,
      loadUser,
      setActionLoading,
      setBalanceAmount,
      setBalanceDescription,
      t,
      userId,
    ],
  );

  const handleUpdateSubscription = useCallback(
    async (overrideAction?: string) => {
      if (!userId) {
        return;
      }

      setActionLoading(true);
      try {
        const actionRaw = overrideAction || subAction;
        if (!isValidSubscriptionAction(actionRaw)) {
          notify.error(t('admin.users.userActions.error'), t('common.error'));
          return;
        }

        const action = actionRaw;
        const data: UpdateSubscriptionRequest = {
          action,
          ...(action === 'extend' ? { days: toNumber(subDays, 30) } : {}),
          ...(action === 'change_tariff' && selectedTariffId
            ? { tariff_id: selectedTariffId }
            : {}),
          ...(action === 'create'
            ? {
                days: toNumber(subDays, 30),
                ...(selectedTariffId ? { tariff_id: selectedTariffId } : {}),
              }
            : {}),
        };
        await adminUsersApi.updateSubscription(userId, data);
        await loadUser();
      } catch (error) {
        console.error('Failed to update subscription:', error);
        notify.error(t('admin.users.userActions.error'), t('common.error'));
      } finally {
        setActionLoading(false);
      }
    },
    [loadUser, notify, selectedTariffId, setActionLoading, subAction, subDays, t, userId],
  );

  const handleBlockUser = useCallback(async () => {
    if (!userId || !confirmAction(t('admin.users.confirm.block'))) {
      return;
    }

    setActionLoading(true);
    try {
      await adminUsersApi.blockUser(userId);
      await loadUser();
    } catch (error) {
      console.error('Failed to block user:', error);
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [confirmAction, loadUser, notify, setActionLoading, t, userId]);

  const handleUnblockUser = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    try {
      await adminUsersApi.unblockUser(userId);
      await loadUser();
    } catch (error) {
      console.error('Failed to unblock user:', error);
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [loadUser, notify, setActionLoading, t, userId]);

  const handleSyncFromPanel = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    try {
      await adminUsersApi.syncFromPanel(userId, {
        update_subscription: true,
        update_traffic: true,
      });
      await loadUser();
      await loadSyncStatus();
    } catch (error) {
      console.error('Failed to sync from panel:', error);
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [loadSyncStatus, loadUser, notify, setActionLoading, t, userId]);

  const handleSyncToPanel = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    try {
      await adminUsersApi.syncToPanel(userId, { create_if_missing: true });
      await loadUser();
      await loadSyncStatus();
    } catch (error) {
      console.error('Failed to sync to panel:', error);
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [loadSyncStatus, loadUser, notify, setActionLoading, t, userId]);

  const handleDeleteDevice = useCallback(
    async (hwid: string) => {
      if (!userId) {
        return;
      }

      setActionLoading(true);
      try {
        await adminUsersApi.deleteUserDevice(userId, hwid);
        notify.success(t('admin.users.detail.devices.deleted'));
        await loadDevices();
      } catch {
        notify.error(t('admin.users.userActions.error'), t('common.error'));
      } finally {
        setActionLoading(false);
      }
    },
    [loadDevices, notify, setActionLoading, t, userId],
  );

  const handleResetDevices = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    try {
      await adminUsersApi.resetUserDevices(userId);
      notify.success(t('admin.users.detail.devices.allDeleted'));
      await loadDevices();
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [loadDevices, notify, setActionLoading, t, userId]);

  const handleAddTraffic = useCallback(
    async (gb: number) => {
      if (!userId) {
        return;
      }

      setActionLoading(true);
      try {
        await adminUsersApi.updateSubscription(userId, { action: 'add_traffic', traffic_gb: gb });
        notify.success(t('admin.users.detail.subscription.trafficAdded'));
        setSelectedTrafficGb('');
        await loadUser();
      } catch {
        notify.error(t('admin.users.userActions.error'), t('common.error'));
      } finally {
        setActionLoading(false);
      }
    },
    [loadUser, notify, setActionLoading, setSelectedTrafficGb, t, userId],
  );

  const handleRemoveTraffic = useCallback(
    async (purchaseId: number) => {
      if (!userId) {
        return;
      }

      setActionLoading(true);
      try {
        await adminUsersApi.updateSubscription(userId, {
          action: 'remove_traffic',
          traffic_purchase_id: purchaseId,
        });
        notify.success(t('admin.users.detail.subscription.trafficRemoved'));
        await loadUser();
      } catch {
        notify.error(t('admin.users.userActions.error'), t('common.error'));
      } finally {
        setActionLoading(false);
      }
    },
    [loadUser, notify, setActionLoading, t, userId],
  );

  const handleSetDeviceLimit = useCallback(
    async (newLimit: number) => {
      if (!userId) {
        return;
      }

      setActionLoading(true);
      try {
        await adminUsersApi.updateSubscription(userId, {
          action: 'set_device_limit',
          device_limit: newLimit,
        });
        notify.success(t('admin.users.detail.subscription.deviceLimitUpdated'));
        await loadUser();
      } catch {
        notify.error(t('admin.users.userActions.error'), t('common.error'));
      } finally {
        setActionLoading(false);
      }
    },
    [loadUser, notify, setActionLoading, t, userId],
  );

  const handleChangePromoGroup = useCallback(
    async (groupId: number | null) => {
      if (!userId) {
        return;
      }

      setActionLoading(true);
      try {
        await adminUsersApi.updatePromoGroup(userId, groupId);
        await loadUser();
        setEditingPromoGroup(false);
      } catch {
        notify.error(t('admin.users.userActions.error'), t('common.error'));
      } finally {
        setActionLoading(false);
      }
    },
    [loadUser, notify, setActionLoading, setEditingPromoGroup, t, userId],
  );

  const handleUpdateReferralCommission = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    try {
      const value = referralCommissionValue === '' ? null : toNumber(referralCommissionValue);
      if (value !== null && (value < 0 || value > 100)) {
        notify.error(t('admin.users.detail.referral.invalidPercent'), t('common.error'));
        return;
      }
      await adminUsersApi.updateReferralCommission(userId, value);
      await loadUser();
      setEditingReferralCommission(false);
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [
    loadUser,
    notify,
    referralCommissionValue,
    setActionLoading,
    setEditingReferralCommission,
    t,
    userId,
  ]);

  const handleDeactivateOffer = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    try {
      await promocodesApi.deactivateDiscount(userId);
      notify.success(t('admin.users.detail.offerDeactivated'), t('common.success'));
      await loadUser();
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [loadUser, notify, setActionLoading, t, userId]);

  const handleSendOffer = useCallback(async () => {
    if (!userId || offerDiscountPercent === '' || offerValidHours === '') {
      return;
    }

    setOfferSending(true);
    try {
      await promoOffersApi.broadcastOffer({
        user_id: userId,
        notification_type: 'admin_personal',
        discount_percent: toNumber(offerDiscountPercent),
        valid_hours: toNumber(offerValidHours, 24),
        effect_type: 'percent_discount',
        send_notification: true,
      });
      notify.success(t('admin.users.detail.offerSent'), t('common.success'));
      setOfferDiscountPercent('');
      setOfferValidHours(24);
      await loadUser();
    } catch {
      notify.error(t('admin.users.detail.offerSendError'), t('common.error'));
    } finally {
      setOfferSending(false);
    }
  }, [
    loadUser,
    notify,
    offerDiscountPercent,
    offerValidHours,
    setOfferDiscountPercent,
    setOfferSending,
    setOfferValidHours,
    t,
    userId,
  ]);

  const handleResetTrial = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await adminUsersApi.resetTrial(userId);
      if (result.success) {
        notify.success(t('admin.users.userActions.success.resetTrial'), t('common.success'));
        await loadUser();
      } else {
        notify.error(result.message || t('admin.users.userActions.error'), t('common.error'));
      }
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [loadUser, notify, setActionLoading, t, userId]);

  const handleResetSubscription = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await adminUsersApi.resetSubscription(userId);
      if (result.success) {
        notify.success(t('admin.users.userActions.success.resetSubscription'), t('common.success'));
        await loadUser();
      } else {
        notify.error(result.message || t('admin.users.userActions.error'), t('common.error'));
      }
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [loadUser, notify, setActionLoading, t, userId]);

  const handleDisableUser = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await adminUsersApi.disableUser(userId);
      if (result.success) {
        notify.success(t('admin.users.userActions.success.disable'), t('common.success'));
        await loadUser();
      } else {
        notify.error(result.message || t('admin.users.userActions.error'), t('common.error'));
      }
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [loadUser, notify, setActionLoading, t, userId]);

  const handleFullDeleteUser = useCallback(async () => {
    if (!userId) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await adminUsersApi.fullDeleteUser(userId);
      if (result.success) {
        notify.success(t('admin.users.userActions.success.delete'), t('common.success'));
        navigateToUsers();
      } else {
        notify.error(result.message || t('admin.users.userActions.error'), t('common.error'));
      }
    } catch {
      notify.error(t('admin.users.userActions.error'), t('common.error'));
    } finally {
      setActionLoading(false);
    }
  }, [navigateToUsers, notify, setActionLoading, t, userId]);

  return {
    handleUpdateBalance,
    handleUpdateSubscription,
    handleBlockUser,
    handleUnblockUser,
    handleSyncFromPanel,
    handleSyncToPanel,
    handleDeleteDevice,
    handleResetDevices,
    handleAddTraffic,
    handleRemoveTraffic,
    handleSetDeviceLimit,
    handleChangePromoGroup,
    handleUpdateReferralCommission,
    handleDeactivateOffer,
    handleSendOffer,
    handleResetTrial,
    handleResetSubscription,
    handleDisableUser,
    handleFullDeleteUser,
  };
}
