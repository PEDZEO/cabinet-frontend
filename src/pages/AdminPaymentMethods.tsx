import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { adminPaymentMethodsApi } from '../api/adminPaymentMethods'
import type { PaymentMethodConfig, PromoGroupSimple } from '../types'

// ============ Icons ============

const BackIcon = () => (
  <svg className="w-5 h-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
)

const GripIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
)

// ============ Method icon by type ============

const METHOD_ICONS: Record<string, string> = {
  telegram_stars: '\u2B50',
  tribute: '\uD83C\uDF81',
  cryptobot: '\uD83E\uDE99',
  heleket: '\u26A1',
  yookassa: '\uD83C\uDFE6',
  mulenpay: '\uD83D\uDCB3',
  pal24: '\uD83D\uDCB8',
  platega: '\uD83D\uDCB0',
  wata: '\uD83D\uDCA7',
  freekassa: '\uD83D\uDCB5',
  cloudpayments: '\u2601\uFE0F',
}

const METHOD_LABELS: Record<string, string> = {
  telegram_stars: 'Telegram Stars',
  tribute: 'Tribute',
  cryptobot: 'CryptoBot',
  heleket: 'Heleket',
  yookassa: 'YooKassa',
  mulenpay: 'MulenPay',
  pal24: 'PayPalych',
  platega: 'Platega',
  wata: 'WATA',
  freekassa: 'Freekassa',
  cloudpayments: 'CloudPayments',
}

// ============ Sortable Card ============

interface SortableCardProps {
  config: PaymentMethodConfig
  onClick: () => void
}

function SortablePaymentCard({ config, onClick }: SortableCardProps) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.method_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  const displayName = config.display_name || config.default_display_name
  const icon = METHOD_ICONS[config.method_id] || '\uD83D\uDCB3'

  // Build condition summary chips
  const chips: string[] = []
  if (config.user_type_filter === 'telegram') chips.push(t('admin.paymentMethods.userTypeTelegram', 'Telegram'))
  if (config.user_type_filter === 'email') chips.push(t('admin.paymentMethods.userTypeEmail', 'Email'))
  if (config.first_topup_filter === 'yes') chips.push(t('admin.paymentMethods.firstTopupYes', 'C пополнением'))
  if (config.first_topup_filter === 'no') chips.push(t('admin.paymentMethods.firstTopupNo', 'Без пополнения'))
  if (config.promo_group_filter_mode === 'selected' && config.allowed_promo_group_ids.length > 0) {
    chips.push(`${config.allowed_promo_group_ids.length} ${t('admin.paymentMethods.promoGroupsShort', 'групп')}`)
  }

  // Count enabled sub-options
  let subOptionsInfo = ''
  if (config.available_sub_options && config.sub_options) {
    const enabledCount = config.available_sub_options.filter(o => config.sub_options?.[o.id] !== false).length
    const totalCount = config.available_sub_options.length
    if (enabledCount < totalCount) {
      subOptionsInfo = `${enabledCount}/${totalCount}`
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${
        isDragging
          ? 'bg-dark-700/80 border-accent-500/50 shadow-xl shadow-accent-500/10'
          : config.is_enabled
            ? 'bg-dark-800/50 border-dark-700/50 hover:border-dark-600'
            : 'bg-dark-900/30 border-dark-800/50 opacity-60'
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1.5 rounded-lg text-dark-500 hover:text-dark-300 hover:bg-dark-700/50 cursor-grab active:cursor-grabbing touch-manipulation"
        title={t('admin.paymentMethods.dragToReorder', 'Перетащите для изменения порядка')}
      >
        <GripIcon />
      </button>

      {/* Method icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-dark-700/50 flex items-center justify-center text-xl">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-dark-100 truncate">{displayName}</span>
          {config.is_enabled ? (
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-success-500/15 text-success-400 border border-success-500/20">
              {t('admin.paymentMethods.enabled', 'Вкл')}
            </span>
          ) : (
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-dark-700/50 text-dark-500 border border-dark-700/30">
              {t('admin.paymentMethods.disabled', 'Выкл')}
            </span>
          )}
          {!config.is_provider_configured && (
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-warning-500/15 text-warning-400 border border-warning-500/20">
              {t('admin.paymentMethods.notConfigured', 'Не настроен')}
            </span>
          )}
          {subOptionsInfo && (
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-dark-700/50 text-dark-400">
              {subOptionsInfo}
            </span>
          )}
        </div>

        {/* Condition chips */}
        {chips.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {chips.map((chip, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-accent-500/10 text-accent-400 border border-accent-500/15">
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chevron */}
      <button
        onClick={onClick}
        className="flex-shrink-0 p-1 text-dark-500 hover:text-dark-300 transition-colors"
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}

// ============ Detail Modal ============

interface DetailModalProps {
  config: PaymentMethodConfig
  promoGroups: PromoGroupSimple[]
  onClose: () => void
  onSave: (methodId: string, data: Record<string, unknown>) => void
  isSaving: boolean
}

function PaymentMethodDetailModal({ config, promoGroups, onClose, onSave, isSaving }: DetailModalProps) {
  const { t } = useTranslation()
  const displayName = config.display_name || config.default_display_name
  const icon = METHOD_ICONS[config.method_id] || '\uD83D\uDCB3'

  // Local state for editing
  const [isEnabled, setIsEnabled] = useState(config.is_enabled)
  const [customName, setCustomName] = useState(config.display_name || '')
  const [subOptions, setSubOptions] = useState<Record<string, boolean>>(config.sub_options || {})
  const [minAmount, setMinAmount] = useState(config.min_amount_kopeks?.toString() || '')
  const [maxAmount, setMaxAmount] = useState(config.max_amount_kopeks?.toString() || '')
  const [userTypeFilter, setUserTypeFilter] = useState(config.user_type_filter)
  const [firstTopupFilter, setFirstTopupFilter] = useState(config.first_topup_filter)
  const [promoGroupFilterMode, setPromoGroupFilterMode] = useState(config.promo_group_filter_mode)
  const [selectedPromoGroupIds, setSelectedPromoGroupIds] = useState<number[]>(config.allowed_promo_group_ids)

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSave = () => {
    const data: Record<string, unknown> = {
      is_enabled: isEnabled,
      user_type_filter: userTypeFilter,
      first_topup_filter: firstTopupFilter,
      promo_group_filter_mode: promoGroupFilterMode,
      allowed_promo_group_ids: promoGroupFilterMode === 'selected' ? selectedPromoGroupIds : [],
    }

    // Display name
    if (customName.trim()) {
      data.display_name = customName.trim()
    } else {
      data.reset_display_name = true
    }

    // Sub-options
    if (config.available_sub_options) {
      data.sub_options = subOptions
    }

    // Amounts
    if (minAmount.trim()) {
      data.min_amount_kopeks = parseInt(minAmount, 10) || null
    } else {
      data.reset_min_amount = true
    }
    if (maxAmount.trim()) {
      data.max_amount_kopeks = parseInt(maxAmount, 10) || null
    } else {
      data.reset_max_amount = true
    }

    onSave(config.method_id, data)
  }

  const togglePromoGroup = (id: number) => {
    setSelectedPromoGroupIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-dark-700 bg-dark-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dark-700/50 flex items-center justify-center text-xl">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-50">{displayName}</h2>
              <p className="text-xs text-dark-500">{METHOD_LABELS[config.method_id] || config.method_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-dark-200 transition-colors">
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-dark-200">{t('admin.paymentMethods.methodEnabled', 'Метод включён')}</div>
              {!config.is_provider_configured && (
                <div className="text-xs text-warning-400 mt-0.5">{t('admin.paymentMethods.providerNotConfigured', 'Провайдер не настроен в env')}</div>
              )}
            </div>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isEnabled ? 'bg-accent-500' : 'bg-dark-600'
              }`}
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                isEnabled ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              {t('admin.paymentMethods.displayName', 'Отображаемое имя')}
            </label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder={config.default_display_name}
              className="w-full px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 transition-colors"
            />
            <p className="text-xs text-dark-500 mt-1">
              {t('admin.paymentMethods.displayNameHint', 'Оставьте пустым для имени по умолчанию')}: {config.default_display_name}
            </p>
          </div>

          {/* Sub-options */}
          {config.available_sub_options && config.available_sub_options.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                {t('admin.paymentMethods.subOptions', 'Варианты оплаты')}
              </label>
              <div className="space-y-2">
                {config.available_sub_options.map(opt => {
                  const enabled = subOptions[opt.id] !== false
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSubOptions(prev => ({ ...prev, [opt.id]: !enabled }))}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        enabled
                          ? 'bg-dark-700/30 border-accent-500/30 text-dark-100'
                          : 'bg-dark-900/30 border-dark-800 text-dark-500'
                      }`}
                    >
                      <span className="text-sm">{opt.name}</span>
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        enabled ? 'bg-accent-500 text-white' : 'bg-dark-700 border border-dark-600'
                      }`}>
                        {enabled && <CheckIcon />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Min/Max amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                {t('admin.paymentMethods.minAmount', 'Мин. сумма (коп.)')}
              </label>
              <input
                type="number"
                value={minAmount}
                onChange={e => setMinAmount(e.target.value)}
                placeholder={config.default_min_amount_kopeks.toString()}
                className="w-full px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                {t('admin.paymentMethods.maxAmount', 'Макс. сумма (коп.)')}
              </label>
              <input
                type="number"
                value={maxAmount}
                onChange={e => setMaxAmount(e.target.value)}
                placeholder={config.default_max_amount_kopeks.toString()}
                className="w-full px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700 text-dark-100 placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Display conditions */}
          <div className="pt-3 border-t border-dark-700">
            <h3 className="text-sm font-semibold text-dark-200 mb-4">
              {t('admin.paymentMethods.conditions', 'Условия отображения')}
            </h3>

            {/* User type filter */}
            <div className="mb-4">
              <label className="block text-sm text-dark-300 mb-2">
                {t('admin.paymentMethods.userTypeFilter', 'Тип пользователя')}
              </label>
              <div className="flex gap-2">
                {(['all', 'telegram', 'email'] as const).map(val => (
                  <button
                    key={val}
                    onClick={() => setUserTypeFilter(val)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      userTypeFilter === val
                        ? 'bg-accent-500/20 border border-accent-500/40 text-accent-300'
                        : 'bg-dark-900/50 border border-dark-700 text-dark-400 hover:border-dark-600'
                    }`}
                  >
                    {val === 'all' ? t('admin.paymentMethods.userTypeAll', 'Все') :
                     val === 'telegram' ? 'Telegram' : 'Email'}
                  </button>
                ))}
              </div>
            </div>

            {/* First topup filter */}
            <div className="mb-4">
              <label className="block text-sm text-dark-300 mb-2">
                {t('admin.paymentMethods.firstTopupFilter', 'Первое пополнение')}
              </label>
              <div className="flex gap-2">
                {(['any', 'yes', 'no'] as const).map(val => (
                  <button
                    key={val}
                    onClick={() => setFirstTopupFilter(val)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      firstTopupFilter === val
                        ? 'bg-accent-500/20 border border-accent-500/40 text-accent-300'
                        : 'bg-dark-900/50 border border-dark-700 text-dark-400 hover:border-dark-600'
                    }`}
                  >
                    {val === 'any' ? t('admin.paymentMethods.firstTopupAny', 'Не важно') :
                     val === 'yes' ? t('admin.paymentMethods.firstTopupYes', 'Было') :
                     t('admin.paymentMethods.firstTopupNo', 'Не было')}
                  </button>
                ))}
              </div>
            </div>

            {/* Promo groups filter */}
            <div>
              <label className="block text-sm text-dark-300 mb-2">
                {t('admin.paymentMethods.promoGroupFilter', 'Промо-группы')}
              </label>
              <div className="flex gap-2 mb-3">
                {(['all', 'selected'] as const).map(val => (
                  <button
                    key={val}
                    onClick={() => setPromoGroupFilterMode(val)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      promoGroupFilterMode === val
                        ? 'bg-accent-500/20 border border-accent-500/40 text-accent-300'
                        : 'bg-dark-900/50 border border-dark-700 text-dark-400 hover:border-dark-600'
                    }`}
                  >
                    {val === 'all'
                      ? t('admin.paymentMethods.promoGroupAll', 'Все группы')
                      : t('admin.paymentMethods.promoGroupSelected', 'Выбранные')
                    }
                  </button>
                ))}
              </div>

              {promoGroupFilterMode === 'selected' && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-dark-900/30 border border-dark-700/50">
                  {promoGroups.length === 0 ? (
                    <p className="text-sm text-dark-500 text-center py-2">
                      {t('admin.paymentMethods.noPromoGroups', 'Нет промо-групп')}
                    </p>
                  ) : (
                    promoGroups.map(group => {
                      const selected = selectedPromoGroupIds.includes(group.id)
                      return (
                        <button
                          key={group.id}
                          onClick={() => togglePromoGroup(group.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                            selected
                              ? 'bg-accent-500/15 text-accent-300'
                              : 'text-dark-400 hover:bg-dark-800/50'
                          }`}
                        >
                          <span>{group.name}</span>
                          <div className={`w-4 h-4 rounded flex items-center justify-center ${
                            selected ? 'bg-accent-500 text-white' : 'border border-dark-600'
                          }`}>
                            {selected && <CheckIcon />}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center gap-3 p-5 border-t border-dark-700 bg-dark-800 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-dark-700 text-dark-300 hover:bg-dark-600 transition-colors font-medium"
          >
            {t('common.cancel', 'Отмена')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 text-white hover:bg-accent-400 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {t('common.save', 'Сохранить')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ Toast ============

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-success-500/90 text-white text-sm font-medium shadow-lg backdrop-blur-sm animate-fade-in flex items-center gap-2">
      <CheckIcon />
      {message}
    </div>
  )
}

// ============ Main Page ============

export default function AdminPaymentMethods() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [methods, setMethods] = useState<PaymentMethodConfig[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodConfig | null>(null)
  const [orderChanged, setOrderChanged] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Fetch payment methods
  const { data: fetchedMethods, isLoading } = useQuery({
    queryKey: ['admin-payment-methods'],
    queryFn: adminPaymentMethodsApi.getAll,
  })

  // Fetch promo groups
  const { data: promoGroups = [] } = useQuery({
    queryKey: ['admin-payment-methods-promo-groups'],
    queryFn: adminPaymentMethodsApi.getPromoGroups,
  })

  // Sync fetched data to local state
  useEffect(() => {
    if (fetchedMethods && !orderChanged) {
      setMethods(fetchedMethods)
    }
  }, [fetchedMethods, orderChanged])

  // Save order mutation
  const saveOrderMutation = useMutation({
    mutationFn: (methodIds: string[]) => adminPaymentMethodsApi.updateOrder(methodIds),
    onSuccess: () => {
      setOrderChanged(false)
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] })
      setToastMessage(t('admin.paymentMethods.orderSaved', 'Порядок сохранён'))
    },
    onError: () => {
      setToastMessage(t('common.error', 'Ошибка'))
    },
  })

  // Update method mutation
  const updateMethodMutation = useMutation({
    mutationFn: ({ methodId, data }: { methodId: string; data: Record<string, unknown> }) =>
      adminPaymentMethodsApi.update(methodId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] })
      setSelectedMethod(null)
      setToastMessage(t('admin.paymentMethods.saved', 'Настройки сохранены'))
    },
    onError: () => {
      setToastMessage(t('common.error', 'Ошибка'))
    },
  })

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setMethods(prev => {
        const oldIndex = prev.findIndex(m => m.method_id === active.id)
        const newIndex = prev.findIndex(m => m.method_id === over.id)
        if (oldIndex === -1 || newIndex === -1) return prev
        return arrayMove(prev, oldIndex, newIndex)
      })
      setOrderChanged(true)
    }
  }, [])

  const handleSaveOrder = () => {
    saveOrderMutation.mutate(methods.map(m => m.method_id))
  }

  const handleSaveMethod = (methodId: string, data: Record<string, unknown>) => {
    updateMethodMutation.mutate({ methodId, data })
  }

  const handleCloseToast = useCallback(() => setToastMessage(null), [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors"
          >
            <BackIcon />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-dark-50">{t('admin.paymentMethods.title', 'Платёжные методы')}</h1>
            <p className="text-sm text-dark-400">{t('admin.paymentMethods.description', 'Настройка порядка и условий отображения')}</p>
          </div>
        </div>
        {orderChanged && (
          <button
            onClick={handleSaveOrder}
            disabled={saveOrderMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {saveOrderMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {t('admin.paymentMethods.saveOrder', 'Сохранить порядок')}
          </button>
        )}
      </div>

      {/* Drag hint */}
      <div className="text-sm text-dark-500 flex items-center gap-2">
        <GripIcon />
        {t('admin.paymentMethods.dragHint', 'Перетаскивайте карточки для изменения порядка. Нажмите для настройки.')}
      </div>

      {/* Methods list */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : methods.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={methods.map(m => m.method_id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {methods.map(config => (
                  <SortablePaymentCard
                    key={config.method_id}
                    config={config}
                    onClick={() => setSelectedMethod(config)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-800 flex items-center justify-center">
              <span className="text-3xl">{'\uD83D\uDCB3'}</span>
            </div>
            <div className="text-dark-400">{t('admin.paymentMethods.noMethods', 'Нет настроенных платёжных методов')}</div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedMethod && (
        <PaymentMethodDetailModal
          config={selectedMethod}
          promoGroups={promoGroups}
          onClose={() => setSelectedMethod(null)}
          onSave={handleSaveMethod}
          isSaving={updateMethodMutation.isPending}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={handleCloseToast} />
      )}
    </div>
  )
}
