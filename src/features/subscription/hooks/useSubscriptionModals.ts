import { useCallback, useState } from 'react';

export const useSubscriptionModals = () => {
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showTariffPurchase, setShowTariffPurchase] = useState(false);
  const [showDeviceTopup, setShowDeviceTopup] = useState(false);
  const [showDeviceReduction, setShowDeviceReduction] = useState(false);
  const [showTrafficTopup, setShowTrafficTopup] = useState(false);
  const [showServerManagement, setShowServerManagement] = useState(false);

  const closeAllModals = useCallback(() => {
    setShowPurchaseForm(false);
    setShowTariffPurchase(false);
    setShowDeviceTopup(false);
    setShowDeviceReduction(false);
    setShowTrafficTopup(false);
    setShowServerManagement(false);
  }, []);

  return {
    showPurchaseForm,
    setShowPurchaseForm,
    showTariffPurchase,
    setShowTariffPurchase,
    showDeviceTopup,
    setShowDeviceTopup,
    showDeviceReduction,
    setShowDeviceReduction,
    showTrafficTopup,
    setShowTrafficTopup,
    showServerManagement,
    setShowServerManagement,
    closeAllModals,
  };
};
