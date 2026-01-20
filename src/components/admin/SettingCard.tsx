import { useState, useCallback } from 'react'

interface SettingChoice {
  value: string
  label: string
  description?: string
}

interface SettingDefinition {
  key: string
  name: string
  description?: string
  category: string
  type: string
  is_optional: boolean
  current: string | number | boolean | null
  original: string | number | boolean | null
  has_override: boolean
  read_only: boolean
  choices?: SettingChoice[]
  hint?: string
}

interface SettingCardProps {
  setting: SettingDefinition
  translatedName?: string
  translatedDescription?: string
  isFavorite: boolean
  onToggleFavorite: () => void
  onUpdate: (value: string) => void
  onReset: () => void
  disabled?: boolean
}

// Icons
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
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

export function SettingCard({
  setting,
  translatedName,
  translatedDescription,
  isFavorite,
  onToggleFavorite,
  onUpdate,
  onReset,
  disabled
}: SettingCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const displayName = translatedName || setting.name || setting.key
  const displayDescription = translatedDescription || setting.description

  const handleStartEdit = useCallback(() => {
    if (setting.read_only) return
    setEditValue(String(setting.current ?? ''))
    setIsEditing(true)
  }, [setting.current, setting.read_only])

  const handleSave = useCallback(() => {
    onUpdate(editValue)
    setIsEditing(false)
  }, [editValue, onUpdate])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditValue('')
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }, [handleSave, handleCancel])

  const handleToggle = useCallback(() => {
    if (setting.read_only) return
    const newValue = setting.current === true || setting.current === 'true' ? 'false' : 'true'
    onUpdate(newValue)
  }, [setting.current, setting.read_only, onUpdate])

  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(e.target.value)
  }, [onUpdate])

  // Render input based on type
  const renderInput = () => {
    // Read-only display
    if (setting.read_only) {
      return (
        <div className="flex items-center gap-2 text-dark-400">
          <LockIcon />
          <span className="font-mono text-sm">{String(setting.current ?? '-')}</span>
        </div>
      )
    }

    // Boolean toggle
    if (setting.type === 'bool') {
      const isChecked = setting.current === true || setting.current === 'true'
      return (
        <button
          onClick={handleToggle}
          disabled={disabled}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isChecked ? 'bg-accent-500' : 'bg-dark-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            isChecked ? 'left-7' : 'left-1'
          }`} />
        </button>
      )
    }

    // Select dropdown
    if (setting.choices && setting.choices.length > 0) {
      return (
        <select
          value={String(setting.current ?? '')}
          onChange={handleSelectChange}
          disabled={disabled}
          className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-dark-100 focus:outline-none focus:border-accent-500 disabled:opacity-50"
        >
          {setting.choices.map(choice => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      )
    }

    // Text/number input
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <input
            type={setting.type === 'int' || setting.type === 'float' ? 'number' : 'text'}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="bg-dark-700 border border-accent-500 rounded-lg px-3 py-1.5 text-sm text-dark-100 focus:outline-none w-40"
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
        onClick={handleStartEdit}
        disabled={disabled}
        className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-dark-200 hover:border-dark-500 hover:text-dark-100 transition-colors disabled:opacity-50 min-w-[100px] text-left font-mono"
      >
        {String(setting.current ?? '-')}
      </button>
    )
  }

  return (
    <div className={`group p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-dark-600 transition-all ${
      setting.has_override ? 'ring-1 ring-warning-500/30' : ''
    }`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left side - info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-dark-100 truncate">{displayName}</span>
            {setting.has_override && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-warning-500/20 text-warning-400">
                Изменено
              </span>
            )}
          </div>
          {displayDescription && (
            <p className="text-sm text-dark-400 line-clamp-2">{displayDescription}</p>
          )}
          {setting.hint && (
            <p className="text-xs text-warning-400 mt-1">{setting.hint}</p>
          )}
        </div>

        {/* Right side - controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Favorite button */}
          <button
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite
                ? 'text-warning-400 bg-warning-500/10'
                : 'text-dark-500 hover:text-dark-300 opacity-0 group-hover:opacity-100'
            }`}
            title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            <StarIcon filled={isFavorite} />
          </button>

          {/* Input control */}
          {renderInput()}

          {/* Reset button */}
          {setting.has_override && !setting.read_only && (
            <button
              onClick={onReset}
              disabled={disabled}
              className="p-1.5 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors disabled:opacity-50"
              title="Сбросить к значению по умолчанию"
            >
              <RefreshIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
