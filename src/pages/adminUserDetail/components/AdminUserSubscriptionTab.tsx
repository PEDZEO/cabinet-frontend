import { AdminUserDevicesSection } from './AdminUserDevicesSection';
import { AdminUserPanelInfoSection } from './AdminUserPanelInfoSection';
import { AdminUserSubscriptionControls } from './AdminUserSubscriptionControls';
import type { AdminUserSubscriptionTabProps } from './subscriptionTypes';

export function AdminUserSubscriptionTab({
  user,
  actionLoading,
  confirmingAction,
  subAction,
  setSubAction,
  subDays,
  setSubDays,
  selectedTariffId,
  setSelectedTariffId,
  tariffs,
  currentTariff,
  selectedTrafficGb,
  setSelectedTrafficGb,
  panelInfoLoading,
  panelInfo,
  nodeUsageForPeriod,
  nodeUsageDays,
  setNodeUsageDays,
  devices,
  devicesTotal,
  deviceLimit,
  devicesLoading,
  locale,
  formatDate,
  formatBytes,
  onInlineConfirm,
  onUpdateSubscription,
  onSetDeviceLimit,
  onRemoveTraffic,
  onAddTraffic,
  onCopyToClipboard,
  onReloadSubscriptionData,
  onReloadDevices,
  onResetDevices,
  onDeleteDevice,
}: AdminUserSubscriptionTabProps) {
  return (
    <div className="space-y-4">
      <AdminUserSubscriptionControls
        user={user}
        actionLoading={actionLoading}
        confirmingAction={confirmingAction}
        subAction={subAction}
        setSubAction={setSubAction}
        subDays={subDays}
        setSubDays={setSubDays}
        selectedTariffId={selectedTariffId}
        setSelectedTariffId={setSelectedTariffId}
        tariffs={tariffs}
        currentTariff={currentTariff}
        selectedTrafficGb={selectedTrafficGb}
        setSelectedTrafficGb={setSelectedTrafficGb}
        formatDate={formatDate}
        onInlineConfirm={onInlineConfirm}
        onUpdateSubscription={onUpdateSubscription}
        onSetDeviceLimit={onSetDeviceLimit}
        onRemoveTraffic={onRemoveTraffic}
        onAddTraffic={onAddTraffic}
      />

      <AdminUserPanelInfoSection
        panelInfoLoading={panelInfoLoading}
        panelInfo={panelInfo}
        nodeUsageForPeriod={nodeUsageForPeriod}
        nodeUsageDays={nodeUsageDays}
        setNodeUsageDays={setNodeUsageDays}
        formatDate={formatDate}
        formatBytes={formatBytes}
        onCopyToClipboard={onCopyToClipboard}
        onReloadSubscriptionData={onReloadSubscriptionData}
      />

      <AdminUserDevicesSection
        devices={devices}
        devicesTotal={devicesTotal}
        deviceLimit={deviceLimit}
        devicesLoading={devicesLoading}
        locale={locale}
        actionLoading={actionLoading}
        confirmingAction={confirmingAction}
        onInlineConfirm={onInlineConfirm}
        onReloadDevices={onReloadDevices}
        onResetDevices={onResetDevices}
        onDeleteDevice={onDeleteDevice}
      />
    </div>
  );
}
