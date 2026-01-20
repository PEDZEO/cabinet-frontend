import { ThemeColors } from '../types/theme'

export interface ColorPreset {
  id: string
  name: string
  nameRu: string
  description: string
  descriptionRu: string
  colors: ThemeColors
  // Preview colors for the card
  preview: {
    background: string
    accent: string
    text: string
  }
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    nameRu: 'Электрик',
    description: 'Classic tech blue, reliable and clean',
    descriptionRu: 'Классический технологичный синий',
    colors: {
      accent: '#3b82f6',
      darkBackground: '#0a0f1a',
      darkSurface: '#0f172a',
      darkText: '#f1f5f9',
      darkTextSecondary: '#94a3b8',
      lightBackground: '#f8fafc',
      lightSurface: '#ffffff',
      lightText: '#0f172a',
      lightTextSecondary: '#64748b',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    preview: {
      background: '#0a0f1a',
      accent: '#3b82f6',
      text: '#f1f5f9',
    },
  },
  {
    id: 'toxic-neon',
    name: 'Toxic Neon',
    nameRu: 'Токсичный неон',
    description: 'Cyberpunk vibes, high energy',
    descriptionRu: 'Киберпанк атмосфера, высокая энергия',
    colors: {
      accent: '#22c55e',
      darkBackground: '#030712',
      darkSurface: '#0a0f14',
      darkText: '#e2e8f0',
      darkTextSecondary: '#64748b',
      lightBackground: '#f0fdf4',
      lightSurface: '#ffffff',
      lightText: '#052e16',
      lightTextSecondary: '#166534',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
    },
    preview: {
      background: '#030712',
      accent: '#22c55e',
      text: '#e2e8f0',
    },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    nameRu: 'Королевский пурпур',
    description: 'Premium, sophisticated, Stripe-like',
    descriptionRu: 'Премиальный, утончённый, как Stripe',
    colors: {
      accent: '#8b5cf6',
      darkBackground: '#0c0a14',
      darkSurface: '#13111c',
      darkText: '#f1f0f5',
      darkTextSecondary: '#a1a1aa',
      lightBackground: '#faf5ff',
      lightSurface: '#ffffff',
      lightText: '#1e1b29',
      lightTextSecondary: '#6b21a8',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    preview: {
      background: '#0c0a14',
      accent: '#8b5cf6',
      text: '#f1f0f5',
    },
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    nameRu: 'Закатный оранж',
    description: 'Warm, energetic, action-oriented',
    descriptionRu: 'Тёплый, энергичный, призыв к действию',
    colors: {
      accent: '#f97316',
      darkBackground: '#0f0906',
      darkSurface: '#1a120d',
      darkText: '#fef3e2',
      darkTextSecondary: '#a3a3a3',
      lightBackground: '#fff7ed',
      lightSurface: '#ffffff',
      lightText: '#1c1917',
      lightTextSecondary: '#c2410c',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    preview: {
      background: '#0f0906',
      accent: '#f97316',
      text: '#fef3e2',
    },
  },
  {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    nameRu: 'Океанский бирюзовый',
    description: 'Calm, trustworthy, health-tech',
    descriptionRu: 'Спокойный, надёжный, медтех',
    colors: {
      accent: '#14b8a6',
      darkBackground: '#042f2e',
      darkSurface: '#0d3d3b',
      darkText: '#f0fdfa',
      darkTextSecondary: '#5eead4',
      lightBackground: '#f0fdfa',
      lightSurface: '#ffffff',
      lightText: '#134e4a',
      lightTextSecondary: '#0f766e',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    preview: {
      background: '#042f2e',
      accent: '#14b8a6',
      text: '#f0fdfa',
    },
  },
  {
    id: 'champagne-gold',
    name: 'Champagne Gold',
    nameRu: 'Шампанское золото',
    description: 'Luxury, premium, elegant',
    descriptionRu: 'Роскошный, премиальный, элегантный',
    colors: {
      accent: '#b8860b',
      darkBackground: '#0a0f1a',
      darkSurface: '#0f172a',
      darkText: '#f1f5f9',
      darkTextSecondary: '#94a3b8',
      lightBackground: '#F7E7CE',
      lightSurface: '#FEF9F0',
      lightText: '#1F1A12',
      lightTextSecondary: '#7D6B48',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    preview: {
      background: '#F7E7CE',
      accent: '#b8860b',
      text: '#1F1A12',
    },
  },
]

export function getPresetById(id: string): ColorPreset | undefined {
  return COLOR_PRESETS.find((preset) => preset.id === id)
}
