import { useState, useRef, useEffect, useMemo, useCallback } from 'react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label: string
  description?: string
  disabled?: boolean
}

// Check if running in Telegram WebApp (native color picker causes crash)
const isTelegramWebApp = (): boolean => {
  return !!(window as unknown as { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp
}

// Convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

// Convert RGB to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ffffff', // White
  '#64748b', // Slate
  '#1e293b', // Dark
  '#000000', // Black
]

export function ColorPicker({ value, onChange, label, description, disabled }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [rgb, setRgb] = useState(() => hexToRgb(value))
  const containerRef = useRef<HTMLDivElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Memoize Telegram check to avoid recalculating
  const isTelegram = useMemo(() => isTelegramWebApp(), [])

  useEffect(() => {
    setLocalValue(value)
    setRgb(hexToRgb(value))
  }, [value])

  // Handle RGB slider change
  const handleRgbChange = useCallback((channel: 'r' | 'g' | 'b', val: number) => {
    const newRgb = { ...rgb, [channel]: val }
    setRgb(newRgb)
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    setLocalValue(hex)
    onChange(hex)
  }, [rgb, onChange])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setLocalValue(newColor)
    setRgb(hexToRgb(newColor))
    onChange(newColor)
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value

    // Add # if not present
    if (newValue && !newValue.startsWith('#')) {
      newValue = '#' + newValue
    }

    // Validate hex format
    if (newValue === '' || newValue.match(/^#[0-9A-Fa-f]{0,6}$/)) {
      setLocalValue(newValue)

      // Only trigger onChange and update RGB for valid complete hex
      if (newValue.match(/^#[0-9A-Fa-f]{6}$/)) {
        setRgb(hexToRgb(newValue))
        onChange(newValue)
      }
    }
  }

  const handlePresetClick = (color: string) => {
    setLocalValue(color)
    setRgb(hexToRgb(color))
    onChange(color)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-dark-200 mb-1">{label}</label>
      {description && <p className="text-xs text-dark-500 mb-2">{description}</p>}

      <div className="flex items-center gap-3">
        {/* Color preview button - min 44px for touch accessibility */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-11 h-11 rounded-lg border-2 border-dark-700 shadow-inner transition-all hover:scale-105 hover:border-dark-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          style={{ backgroundColor: localValue || '#000000' }}
          title={localValue}
          aria-label={`Select color: ${localValue}`}
        />

        {/* Hex input */}
        <input
          type="text"
          value={localValue}
          onChange={handleHexInputChange}
          disabled={disabled}
          className="input w-28 py-2 font-mono text-sm uppercase"
          placeholder="#000000"
          maxLength={7}
        />

        {/* Native color picker - hidden in Telegram WebApp (causes crash) */}
        {!isTelegram && (
          <>
            <input
              ref={colorInputRef}
              type="color"
              value={localValue || '#000000'}
              onChange={handleColorInputChange}
              disabled={disabled}
              className="sr-only"
            />

            {/* Native picker button - min 44px for touch accessibility */}
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              disabled={disabled}
              className="btn-secondary min-w-[44px] min-h-[44px] p-2.5 disabled:opacity-50"
              title="Open color picker"
              aria-label="Open color picker"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dropdown with presets and RGB sliders */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 sm:p-4 bg-dark-800 rounded-xl border border-dark-700 shadow-xl animate-fade-in w-[calc(100vw-2rem)] sm:w-80 max-w-sm left-0 sm:left-auto">
          {/* RGB Sliders - always visible on all devices */}
          <div className="mb-3 pb-3 border-b border-dark-700">
            <div className="text-xs text-dark-400 mb-3">RGB</div>
            <div className="space-y-3 sm:space-y-2">
              {/* Red */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs font-medium text-red-400 w-4 flex-shrink-0">R</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', parseInt(e.target.value))}
                  className="flex-1 h-3 sm:h-2 rounded-full appearance-none cursor-pointer touch-pan-x"
                  style={{
                    background: `linear-gradient(to right, rgb(0,${rgb.g},${rgb.b}), rgb(255,${rgb.g},${rgb.b}))`,
                  }}
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', Math.min(255, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-14 sm:w-12 text-xs text-center bg-dark-700 border border-dark-600 rounded px-1 py-1 text-dark-200"
                />
              </div>
              {/* Green */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs font-medium text-green-400 w-4 flex-shrink-0">G</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', parseInt(e.target.value))}
                  className="flex-1 h-3 sm:h-2 rounded-full appearance-none cursor-pointer touch-pan-x"
                  style={{
                    background: `linear-gradient(to right, rgb(${rgb.r},0,${rgb.b}), rgb(${rgb.r},255,${rgb.b}))`,
                  }}
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', Math.min(255, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-14 sm:w-12 text-xs text-center bg-dark-700 border border-dark-600 rounded px-1 py-1 text-dark-200"
                />
              </div>
              {/* Blue */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs font-medium text-blue-400 w-4 flex-shrink-0">B</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', parseInt(e.target.value))}
                  className="flex-1 h-3 sm:h-2 rounded-full appearance-none cursor-pointer touch-pan-x"
                  style={{
                    background: `linear-gradient(to right, rgb(${rgb.r},${rgb.g},0), rgb(${rgb.r},${rgb.g},255))`,
                  }}
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', Math.min(255, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-14 sm:w-12 text-xs text-center bg-dark-700 border border-dark-600 rounded px-1 py-1 text-dark-200"
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-dark-400 mb-2">Preset colors</div>
          <div className="grid grid-cols-4 gap-2 sm:gap-1">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 active:scale-95 ${
                  localValue.toLowerCase() === preset.toLowerCase() ? 'border-white ring-2 ring-white/30' : 'border-dark-600 hover:border-dark-500'
                }`}
                style={{ backgroundColor: preset }}
                title={preset}
                aria-label={`Select color ${preset}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
