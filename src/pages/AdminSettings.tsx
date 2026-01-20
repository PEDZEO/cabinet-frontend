import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { adminSettingsApi, SettingDefinition } from '../api/adminSettings'
import { brandingApi, setCachedBranding } from '../api/branding'
import { setCachedAnimationEnabled } from '../components/AnimatedBackground'
import { setCachedFullscreenEnabled } from '../hooks/useTelegramWebApp'
import { themeColorsApi } from '../api/themeColors'
import { ThemeColors, DEFAULT_THEME_COLORS } from '../types/theme'
import { ColorPicker } from '../components/ColorPicker'
import { applyThemeColors } from '../hooks/useThemeColors'
import { updateEnabledThemesCache } from '../hooks/useTheme'
import { useFavoriteSettings } from '../hooks/useFavoriteSettings'

// ============ ICONS ============
const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="w-5 h-5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
)

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
)

// ============ TAB DEFINITIONS ============
const TABS = [
  { id: 'favorites', label: 'Избранное', icon: StarIcon },
  { id: 'branding', label: 'Брендинг', icon: null },
  { id: 'theme', label: 'Тема', icon: null },
  { id: 'payments', label: 'Платежи', icon: null },
  { id: 'subscriptions', label: 'Подписки', icon: null },
  { id: 'interface', label: 'Интерфейс', icon: null },
  { id: 'more', label: 'Ещё', icon: ChevronDownIcon, isDropdown: true },
] as const

const MORE_TABS = [
  { id: 'notifications', label: 'Уведомления' },
  { id: 'database', label: 'База данных' },
  { id: 'system', label: 'Система' },
  { id: 'users', label: 'Пользователи' },
] as const

// ============ META CATEGORIES ============
const META_CATEGORIES: Record<string, { label: string; categories: string[] }> = {
  payments: {
    label: 'Платежные системы',
    categories: ['PAYMENT', 'PAYMENT_VERIFICATION', 'YOOKASSA', 'CRYPTOBOT', 'HELEKET', 'PLATEGA', 'TRIBUTE', 'MULENPAY', 'PAL24', 'WATA', 'TELEGRAM'],
  },
  subscriptions: {
    label: 'Подписки и тарифы',
    categories: ['SUBSCRIPTIONS_CORE', 'SIMPLE_SUBSCRIPTION', 'PERIODS', 'SUBSCRIPTION_PRICES', 'TRAFFIC', 'TRAFFIC_PACKAGES', 'TRIAL', 'AUTOPAY'],
  },
  interface: {
    label: 'Интерфейс',
    categories: ['INTERFACE', 'INTERFACE_BRANDING', 'INTERFACE_SUBSCRIPTION', 'CONNECT_BUTTON', 'MINIAPP', 'HAPP', 'SKIP', 'ADDITIONAL'],
  },
  notifications: {
    label: 'Уведомления',
    categories: ['NOTIFICATIONS', 'ADMIN_NOTIFICATIONS', 'ADMIN_REPORTS'],
  },
  database: {
    label: 'База данных',
    categories: ['DATABASE', 'POSTGRES', 'SQLITE', 'REDIS'],
  },
  system: {
    label: 'Система',
    categories: ['CORE', 'REMNAWAVE', 'SERVER_STATUS', 'MONITORING', 'MAINTENANCE', 'BACKUP', 'VERSION', 'WEB_API', 'WEBHOOK', 'LOG', 'DEBUG', 'EXTERNAL_ADMIN'],
  },
  users: {
    label: 'Пользователи',
    categories: ['SUPPORT', 'LOCALIZATION', 'CHANNEL', 'TIMEZONE', 'REFERRAL', 'MODERATION'],
  },
}

// ============ THEME PRESETS ============
const THEME_PRESETS: { name: string; colors: ThemeColors }[] = [
  { name: 'Стандарт', colors: DEFAULT_THEME_COLORS },
  { name: 'Океан', colors: { accent: '#0ea5e9', darkBackground: '#0c1222', darkSurface: '#1e293b', darkText: '#f1f5f9', darkTextSecondary: '#94a3b8', lightBackground: '#e0f2fe', lightSurface: '#f0f9ff', lightText: '#0c4a6e', lightTextSecondary: '#0369a1', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' } },
  { name: 'Лес', colors: { accent: '#22c55e', darkBackground: '#0a1a0f', darkSurface: '#14532d', darkText: '#f0fdf4', darkTextSecondary: '#86efac', lightBackground: '#dcfce7', lightSurface: '#f0fdf4', lightText: '#14532d', lightTextSecondary: '#166534', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' } },
  { name: 'Закат', colors: { accent: '#f97316', darkBackground: '#1c1009', darkSurface: '#2d1a0e', darkText: '#fff7ed', darkTextSecondary: '#fdba74', lightBackground: '#ffedd5', lightSurface: '#fff7ed', lightText: '#7c2d12', lightTextSecondary: '#c2410c', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' } },
  { name: 'Фиолет', colors: { accent: '#a855f7', darkBackground: '#0f0a1a', darkSurface: '#1e1b2e', darkText: '#faf5ff', darkTextSecondary: '#c4b5fd', lightBackground: '#f3e8ff', lightSurface: '#faf5ff', lightText: '#581c87', lightTextSecondary: '#7e22ce', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' } },
  { name: 'Роза', colors: { accent: '#f43f5e', darkBackground: '#1a0a10', darkSurface: '#2d1520', darkText: '#fff1f2', darkTextSecondary: '#fda4af', lightBackground: '#ffe4e6', lightSurface: '#fff1f2', lightText: '#881337', lightTextSecondary: '#be123c', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' } },
  { name: 'Полночь', colors: { accent: '#6366f1', darkBackground: '#030712', darkSurface: '#111827', darkText: '#f9fafb', darkTextSecondary: '#9ca3af', lightBackground: '#e5e7eb', lightSurface: '#f3f4f6', lightText: '#111827', lightTextSecondary: '#4b5563', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' } },
  { name: 'Бирюза', colors: { accent: '#14b8a6', darkBackground: '#0a1614', darkSurface: '#134e4a', darkText: '#f0fdfa', darkTextSecondary: '#5eead4', lightBackground: '#ccfbf1', lightSurface: '#f0fdfa', lightText: '#134e4a', lightTextSecondary: '#0f766e', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' } },
]

// ============ SETTING TRANSLATIONS ============
const SETTING_TRANSLATIONS: Record<string, { name: string; description: string }> = {
  BOT_USERNAME: { name: 'Username бота', description: 'Имя бота в Telegram' },
  SUPPORT_USERNAME: { name: 'Username поддержки', description: 'Telegram @username поддержки' },
  SUPPORT_MENU_ENABLED: { name: 'Меню поддержки', description: 'Показывать раздел поддержки' },
  DEFAULT_LANGUAGE: { name: 'Язык по умолчанию', description: 'Язык интерфейса' },
  TIMEZONE: { name: 'Часовой пояс', description: 'Временная зона системы' },
  REFERRAL_PROGRAM_ENABLED: { name: 'Реферальная программа', description: 'Включить рефералку' },
  YOOKASSA_ENABLED: { name: 'YooKassa', description: 'Приём платежей через YooKassa' },
  CRYPTOBOT_ENABLED: { name: 'CryptoBot', description: 'Приём криптовалюты' },
  TELEGRAM_STARS_ENABLED: { name: 'Telegram Stars', description: 'Оплата звёздами' },
  TRIAL_DURATION_DAYS: { name: 'Триал (дней)', description: 'Длительность пробного периода' },
  DEFAULT_DEVICE_LIMIT: { name: 'Устройств по умолчанию', description: 'Лимит устройств' },
  // Add more as needed...
}

// ============ MAIN COMPONENT ============
export default function AdminSettings() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [activeTab, setActiveTab] = useState('branding')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['presets']))

  // Favorites hook
  const { favorites, toggleFavorite, isFavorite } = useFavoriteSettings()

  // ============ QUERIES ============
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: brandingApi.getBranding,
  })

  const { data: animationSettings } = useQuery({
    queryKey: ['animation-enabled'],
    queryFn: brandingApi.getAnimationEnabled,
  })

  const { data: fullscreenSettings } = useQuery({
    queryKey: ['fullscreen-enabled'],
    queryFn: brandingApi.getFullscreenEnabled,
  })

  const { data: themeColors } = useQuery({
    queryKey: ['theme-colors'],
    queryFn: themeColorsApi.getColors,
  })

  const { data: enabledThemes } = useQuery({
    queryKey: ['enabled-themes'],
    queryFn: themeColorsApi.getEnabledThemes,
  })

  const { data: allSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingsApi.getSettings(),
  })

  // ============ MUTATIONS ============
  const updateBrandingMutation = useMutation({
    mutationFn: brandingApi.updateName,
    onSuccess: (data) => {
      setCachedBranding(data)
      queryClient.invalidateQueries({ queryKey: ['branding'] })
      setEditingName(false)
    },
  })

  const uploadLogoMutation = useMutation({
    mutationFn: brandingApi.uploadLogo,
    onSuccess: (data) => {
      setCachedBranding(data)
      queryClient.invalidateQueries({ queryKey: ['branding'] })
    },
  })

  const deleteLogoMutation = useMutation({
    mutationFn: brandingApi.deleteLogo,
    onSuccess: (data) => {
      setCachedBranding(data)
      queryClient.invalidateQueries({ queryKey: ['branding'] })
    },
  })

  const updateAnimationMutation = useMutation({
    mutationFn: (enabled: boolean) => brandingApi.updateAnimationEnabled(enabled),
    onSuccess: (data) => {
      setCachedAnimationEnabled(data.enabled)
      queryClient.invalidateQueries({ queryKey: ['animation-enabled'] })
    },
  })

  const updateFullscreenMutation = useMutation({
    mutationFn: (enabled: boolean) => brandingApi.updateFullscreenEnabled(enabled),
    onSuccess: (data) => {
      setCachedFullscreenEnabled(data.enabled)
      queryClient.invalidateQueries({ queryKey: ['fullscreen-enabled'] })
    },
  })

  const updateColorsMutation = useMutation({
    mutationFn: themeColorsApi.updateColors,
    onSuccess: (data) => {
      applyThemeColors(data)
      queryClient.invalidateQueries({ queryKey: ['theme-colors'] })
    },
  })

  const resetColorsMutation = useMutation({
    mutationFn: themeColorsApi.resetColors,
    onSuccess: (data) => {
      applyThemeColors(data)
      queryClient.invalidateQueries({ queryKey: ['theme-colors'] })
    },
  })

  const updateEnabledThemesMutation = useMutation({
    mutationFn: themeColorsApi.updateEnabledThemes,
    onSuccess: (data) => {
      updateEnabledThemesCache(data)
      queryClient.invalidateQueries({ queryKey: ['enabled-themes'] })
    },
  })

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => adminSettingsApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
  })

  const resetSettingMutation = useMutation({
    mutationFn: (key: string) => adminSettingsApi.resetSetting(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
  })

  // ============ HANDLERS ============
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadLogoMutation.mutate(file)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  // Filter settings by tab
  const filteredSettings = useMemo(() => {
    if (!allSettings || !Array.isArray(allSettings)) return []

    const metaCategories = META_CATEGORIES[activeTab]?.categories || []
    let filtered = allSettings.filter((s: SettingDefinition) => metaCategories.includes(s.category.key))

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((s: SettingDefinition) =>
        s.key.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        SETTING_TRANSLATIONS[s.key]?.name.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [allSettings, activeTab, searchQuery])

  // Favorite settings
  const favoriteSettings = useMemo(() => {
    if (!allSettings || !Array.isArray(allSettings)) return []
    return allSettings.filter((s: SettingDefinition) => favorites.includes(s.key))
  }, [allSettings, favorites])

  // ============ RENDER HELPERS ============
  const renderToggle = (checked: boolean, onChange: () => void, disabled?: boolean) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-accent-500' : 'bg-dark-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
        checked ? 'left-7' : 'left-1'
      }`} />
    </button>
  )

  const renderSettingRow = (setting: SettingDefinition) => {
    const trans = SETTING_TRANSLATIONS[setting.key]
    const name = trans?.name || setting.name || setting.key
    const desc = trans?.description || setting.hint?.description
    const isFav = isFavorite(setting.key)

    return (
      <div
        key={setting.key}
        className="group flex items-center justify-between p-4 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-dark-600/50 transition-all"
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-dark-100 truncate">{name}</span>
            {setting.has_override && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-warning-500/20 text-warning-400">
                Изменено
              </span>
            )}
          </div>
          {desc && <p className="text-sm text-dark-400 truncate mt-0.5">{desc}</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Favorite button */}
          <button
            onClick={() => toggleFavorite(setting.key)}
            className={`p-1.5 rounded-lg transition-all ${
              isFav
                ? 'text-warning-400 bg-warning-500/10'
                : 'text-dark-500 hover:text-dark-300 opacity-0 group-hover:opacity-100'
            }`}
          >
            <StarIcon filled={isFav} />
          </button>

          {/* Setting control */}
          {setting.read_only ? (
            <div className="flex items-center gap-2 text-dark-400">
              <LockIcon />
              <span className="font-mono text-sm">{String(setting.current ?? '-')}</span>
            </div>
          ) : setting.type === 'bool' ? (
            renderToggle(
              setting.current === true || setting.current === 'true',
              () => updateSettingMutation.mutate({
                key: setting.key,
                value: setting.current === true || setting.current === 'true' ? 'false' : 'true'
              }),
              updateSettingMutation.isPending
            )
          ) : (
            <SettingInput
              setting={setting}
              onUpdate={(value) => updateSettingMutation.mutate({ key: setting.key, value })}
              disabled={updateSettingMutation.isPending}
            />
          )}

          {/* Reset button */}
          {setting.has_override && !setting.read_only && (
            <button
              onClick={() => resetSettingMutation.mutate(setting.key)}
              disabled={resetSettingMutation.isPending}
              className="p-1.5 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
              title="Сбросить"
            >
              <RefreshIcon />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ============ TAB CONTENT ============
  const renderBrandingTab = () => (
    <div className="space-y-6">
      {/* Logo & Name */}
      <div className="p-6 rounded-2xl bg-dark-800/50 border border-dark-700/50">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">Логотип и название</h3>

        <div className="flex items-start gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${themeColors?.accent || '#3b82f6'}, ${themeColors?.accent || '#3b82f6'}dd)`
              }}
            >
              {branding?.has_custom_logo ? (
                <img src={brandingApi.getLogoUrl(branding) ?? undefined} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                branding?.logo_letter || 'V'
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLogoMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm transition-colors disabled:opacity-50"
              >
                <UploadIcon />
              </button>
              {branding?.has_custom_logo && (
                <button
                  onClick={() => deleteLogoMutation.mutate()}
                  disabled={deleteLogoMutation.isPending}
                  className="px-3 py-2 rounded-xl bg-dark-700 hover:bg-error-500/20 text-dark-400 hover:text-error-400 transition-colors disabled:opacity-50"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-dark-300 mb-2">Название проекта</label>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-dark-700 border border-dark-600 text-dark-100 focus:outline-none focus:border-accent-500"
                  placeholder="Название"
                  maxLength={50}
                />
                <button
                  onClick={() => updateBrandingMutation.mutate(newName)}
                  disabled={updateBrandingMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-accent-500 text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
                >
                  <CheckIcon />
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="px-4 py-2 rounded-xl bg-dark-700 text-dark-300 hover:bg-dark-600 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg text-dark-100">{branding?.name || 'Не указано'}</span>
                <button
                  onClick={() => {
                    setNewName(branding?.name ?? '')
                    setEditingName(true)
                  }}
                  className="p-1.5 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
                >
                  <PencilIcon />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animation & Fullscreen toggles */}
      <div className="p-6 rounded-2xl bg-dark-800/50 border border-dark-700/50">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">Опции интерфейса</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30">
            <div>
              <span className="font-medium text-dark-100">Анимированный фон</span>
              <p className="text-sm text-dark-400">Волны на фоне приложения</p>
            </div>
            {renderToggle(
              animationSettings?.enabled ?? true,
              () => updateAnimationMutation.mutate(!(animationSettings?.enabled ?? true)),
              updateAnimationMutation.isPending
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30">
            <div>
              <span className="font-medium text-dark-100">Авто-Fullscreen</span>
              <p className="text-sm text-dark-400">В Telegram WebApp</p>
            </div>
            {renderToggle(
              fullscreenSettings?.enabled ?? false,
              () => updateFullscreenMutation.mutate(!(fullscreenSettings?.enabled ?? false)),
              updateFullscreenMutation.isPending
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderThemeTab = () => (
    <div className="space-y-6">
      {/* Theme toggles */}
      <div className="p-6 rounded-2xl bg-dark-800/50 border border-dark-700/50">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">Доступные темы</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30">
            <div className="flex items-center gap-3">
              <MoonIcon />
              <span className="font-medium text-dark-200">Тёмная</span>
            </div>
            {renderToggle(
              enabledThemes?.dark ?? true,
              () => {
                if ((enabledThemes?.dark ?? true) && !(enabledThemes?.light ?? true)) return
                updateEnabledThemesMutation.mutate({ dark: !(enabledThemes?.dark ?? true) })
              },
              updateEnabledThemesMutation.isPending
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-700/30">
            <div className="flex items-center gap-3">
              <SunIcon />
              <span className="font-medium text-dark-200">Светлая</span>
            </div>
            {renderToggle(
              enabledThemes?.light ?? true,
              () => {
                if ((enabledThemes?.light ?? true) && !(enabledThemes?.dark ?? true)) return
                updateEnabledThemesMutation.mutate({ light: !(enabledThemes?.light ?? true) })
              },
              updateEnabledThemesMutation.isPending
            )}
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="p-6 rounded-2xl bg-dark-800/50 border border-dark-700/50">
        <button
          onClick={() => toggleSection('presets')}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-lg font-semibold text-dark-100">Быстрые пресеты</h3>
          <div className={`transition-transform ${expandedSections.has('presets') ? 'rotate-180' : ''}`}>
            <ChevronDownIcon />
          </div>
        </button>

        {expandedSections.has('presets') && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => updateColorsMutation.mutate(preset.colors)}
                disabled={updateColorsMutation.isPending}
                className="p-3 rounded-xl border border-dark-600 hover:border-dark-500 transition-all hover:scale-[1.02]"
                style={{ backgroundColor: preset.colors.darkBackground }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: preset.colors.accent }}
                  />
                  <span className="text-xs font-medium" style={{ color: preset.colors.darkText }}>
                    {preset.name}
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: preset.colors.success }} />
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: preset.colors.warning }} />
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: preset.colors.error }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Colors */}
      <div className="p-6 rounded-2xl bg-dark-800/50 border border-dark-700/50">
        <button
          onClick={() => toggleSection('colors')}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-lg font-semibold text-dark-100">Ручная настройка</h3>
          <div className={`transition-transform ${expandedSections.has('colors') ? 'rotate-180' : ''}`}>
            <ChevronDownIcon />
          </div>
        </button>

        {expandedSections.has('colors') && (
          <div className="mt-4 space-y-6">
            {/* Accent */}
            <div>
              <h4 className="text-sm font-medium text-dark-300 mb-3">Акцентный цвет</h4>
              <ColorPicker
                label={t('theme.accent')}
                value={themeColors?.accent || DEFAULT_THEME_COLORS.accent}
                onChange={(color) => updateColorsMutation.mutate({ accent: color })}
                disabled={updateColorsMutation.isPending}
              />
            </div>

            {/* Dark theme */}
            <div>
              <h4 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                <MoonIcon /> Тёмная тема
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColorPicker
                  label="Фон"
                  value={themeColors?.darkBackground || DEFAULT_THEME_COLORS.darkBackground}
                  onChange={(color) => updateColorsMutation.mutate({ darkBackground: color })}
                  disabled={updateColorsMutation.isPending}
                />
                <ColorPicker
                  label="Поверхность"
                  value={themeColors?.darkSurface || DEFAULT_THEME_COLORS.darkSurface}
                  onChange={(color) => updateColorsMutation.mutate({ darkSurface: color })}
                  disabled={updateColorsMutation.isPending}
                />
                <ColorPicker
                  label="Текст"
                  value={themeColors?.darkText || DEFAULT_THEME_COLORS.darkText}
                  onChange={(color) => updateColorsMutation.mutate({ darkText: color })}
                  disabled={updateColorsMutation.isPending}
                />
                <ColorPicker
                  label="Вторичный текст"
                  value={themeColors?.darkTextSecondary || DEFAULT_THEME_COLORS.darkTextSecondary}
                  onChange={(color) => updateColorsMutation.mutate({ darkTextSecondary: color })}
                  disabled={updateColorsMutation.isPending}
                />
              </div>
            </div>

            {/* Light theme */}
            <div>
              <h4 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                <SunIcon /> Светлая тема
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColorPicker
                  label="Фон"
                  value={themeColors?.lightBackground || DEFAULT_THEME_COLORS.lightBackground}
                  onChange={(color) => updateColorsMutation.mutate({ lightBackground: color })}
                  disabled={updateColorsMutation.isPending}
                />
                <ColorPicker
                  label="Поверхность"
                  value={themeColors?.lightSurface || DEFAULT_THEME_COLORS.lightSurface}
                  onChange={(color) => updateColorsMutation.mutate({ lightSurface: color })}
                  disabled={updateColorsMutation.isPending}
                />
                <ColorPicker
                  label="Текст"
                  value={themeColors?.lightText || DEFAULT_THEME_COLORS.lightText}
                  onChange={(color) => updateColorsMutation.mutate({ lightText: color })}
                  disabled={updateColorsMutation.isPending}
                />
                <ColorPicker
                  label="Вторичный текст"
                  value={themeColors?.lightTextSecondary || DEFAULT_THEME_COLORS.lightTextSecondary}
                  onChange={(color) => updateColorsMutation.mutate({ lightTextSecondary: color })}
                  disabled={updateColorsMutation.isPending}
                />
              </div>
            </div>

            {/* Status colors */}
            <div>
              <h4 className="text-sm font-medium text-dark-300 mb-3">Статусные цвета</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ColorPicker
                  label="Успех"
                  value={themeColors?.success || DEFAULT_THEME_COLORS.success}
                  onChange={(color) => updateColorsMutation.mutate({ success: color })}
                  disabled={updateColorsMutation.isPending}
                />
                <ColorPicker
                  label="Предупреждение"
                  value={themeColors?.warning || DEFAULT_THEME_COLORS.warning}
                  onChange={(color) => updateColorsMutation.mutate({ warning: color })}
                  disabled={updateColorsMutation.isPending}
                />
                <ColorPicker
                  label="Ошибка"
                  value={themeColors?.error || DEFAULT_THEME_COLORS.error}
                  onChange={(color) => updateColorsMutation.mutate({ error: color })}
                  disabled={updateColorsMutation.isPending}
                />
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={() => resetColorsMutation.mutate()}
              disabled={resetColorsMutation.isPending}
              className="px-4 py-2 rounded-xl bg-dark-700 text-dark-300 hover:bg-dark-600 transition-colors disabled:opacity-50"
            >
              Сбросить все цвета
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderFavoritesTab = () => (
    <div className="space-y-4">
      {favoriteSettings.length === 0 ? (
        <div className="p-12 rounded-2xl bg-dark-800/30 border border-dark-700/30 text-center">
          <StarIcon filled={false} />
          <p className="text-dark-400 mt-4">Нет избранных настроек</p>
          <p className="text-dark-500 text-sm mt-1">
            Нажмите ⭐ рядом с настройкой, чтобы добавить её сюда
          </p>
        </div>
      ) : (
        favoriteSettings.map(renderSettingRow)
      )}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-4">
      {filteredSettings.length === 0 ? (
        <div className="p-12 rounded-2xl bg-dark-800/30 border border-dark-700/30 text-center">
          <p className="text-dark-400">Нет настроек в этой категории</p>
        </div>
      ) : (
        filteredSettings.map(renderSettingRow)
      )}
    </div>
  )

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 transition-colors">
            <BackIcon />
          </Link>
          <h1 className="text-2xl font-bold text-dark-100">Настройки</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск..."
            className="w-64 pl-10 pr-4 py-2 rounded-xl bg-dark-800 border border-dark-700 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">
            <SearchIcon />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-dark-800/50 border border-dark-700/50 overflow-x-auto">
        {TABS.map((tab) => {
          if (tab.id === 'more') {
            return (
              <div key={tab.id} className="relative">
                <button
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                  className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    MORE_TABS.some(t => t.id === activeTab)
                      ? 'bg-accent-500 text-white'
                      : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
                  }`}
                >
                  {tab.label}
                  <ChevronDownIcon />
                </button>

                {showMoreDropdown && (
                  <div className="absolute top-full right-0 mt-2 py-2 min-w-[160px] rounded-xl bg-dark-800 border border-dark-700 shadow-xl z-50">
                    {MORE_TABS.map((moreTab) => (
                      <button
                        key={moreTab.id}
                        onClick={() => {
                          setActiveTab(moreTab.id)
                          setShowMoreDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          activeTab === moreTab.id
                            ? 'text-accent-400 bg-accent-500/10'
                            : 'text-dark-300 hover:text-dark-100 hover:bg-dark-700/50'
                        }`}
                      >
                        {moreTab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-accent-500 text-white'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
              }`}
            >
              {tab.id === 'favorites' && <StarIcon filled={activeTab === 'favorites'} />}
              {tab.label}
              {tab.id === 'favorites' && favorites.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                  {favorites.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'favorites' && renderFavoritesTab()}
        {activeTab === 'branding' && renderBrandingTab()}
        {activeTab === 'theme' && renderThemeTab()}
        {['payments', 'subscriptions', 'interface', 'notifications', 'database', 'system', 'users'].includes(activeTab) && renderSettingsTab()}
      </div>
    </div>
  )
}

// ============ SETTING INPUT COMPONENT ============
function SettingInput({
  setting,
  onUpdate,
  disabled
}: {
  setting: SettingDefinition
  onUpdate: (value: string) => void
  disabled?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState('')

  const handleStart = () => {
    setValue(String(setting.current ?? ''))
    setIsEditing(true)
  }

  const handleSave = () => {
    onUpdate(value)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setValue('')
  }

  if (setting.choices && setting.choices.length > 0) {
    return (
      <select
        value={String(setting.current ?? '')}
        onChange={(e) => onUpdate(e.target.value)}
        disabled={disabled}
        className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-dark-100 focus:outline-none focus:border-accent-500 disabled:opacity-50"
      >
        {setting.choices.map((choice, idx) => (
          <option key={idx} value={String(choice.value)}>
            {choice.label}
          </option>
        ))}
      </select>
    )
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type={setting.type === 'int' || setting.type === 'float' ? 'number' : 'text'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
          autoFocus
          className="bg-dark-700 border border-accent-500 rounded-lg px-3 py-1.5 text-sm text-dark-100 focus:outline-none w-32"
        />
        <button
          onClick={handleSave}
          className="p-1.5 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
        >
          <CheckIcon />
        </button>
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-lg bg-dark-600 text-dark-300 hover:bg-dark-500 transition-colors"
        >
          <CloseIcon />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleStart}
      disabled={disabled}
      className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-dark-200 hover:border-dark-500 transition-colors disabled:opacity-50 min-w-[80px] text-left font-mono truncate max-w-[150px]"
    >
      {String(setting.current ?? '-')}
    </button>
  )
}
