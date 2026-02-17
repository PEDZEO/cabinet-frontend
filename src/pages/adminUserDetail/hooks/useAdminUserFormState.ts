import { useState } from 'react';

export function useAdminUserFormState() {
  const [balanceAmount, setBalanceAmount] = useState<number | ''>('');
  const [balanceDescription, setBalanceDescription] = useState('');

  const [subAction, setSubAction] = useState<string>('extend');
  const [subDays, setSubDays] = useState<number | ''>(30);
  const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);

  const [editingPromoGroup, setEditingPromoGroup] = useState(false);
  const [editingReferralCommission, setEditingReferralCommission] = useState(false);
  const [referralCommissionValue, setReferralCommissionValue] = useState<number | ''>('');

  const [offerDiscountPercent, setOfferDiscountPercent] = useState<number | ''>('');
  const [offerValidHours, setOfferValidHours] = useState<number | ''>(24);
  const [offerSending, setOfferSending] = useState(false);

  const [selectedTrafficGb, setSelectedTrafficGb] = useState<string>('');

  return {
    balanceAmount,
    setBalanceAmount,
    balanceDescription,
    setBalanceDescription,
    subAction,
    setSubAction,
    subDays,
    setSubDays,
    selectedTariffId,
    setSelectedTariffId,
    editingPromoGroup,
    setEditingPromoGroup,
    editingReferralCommission,
    setEditingReferralCommission,
    referralCommissionValue,
    setReferralCommissionValue,
    offerDiscountPercent,
    setOfferDiscountPercent,
    offerValidHours,
    setOfferValidHours,
    offerSending,
    setOfferSending,
    selectedTrafficGb,
    setSelectedTrafficGb,
  };
}
