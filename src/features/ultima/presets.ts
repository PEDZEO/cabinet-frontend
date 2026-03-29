import type { UltimaThemeConfig } from '@/api/branding';
import { DEFAULT_ULTIMA_THEME_CONFIG } from '@/api/branding';

export type UltimaThemePresetId =
  | 'emerald-classic'
  | 'neon-ocean'
  | 'sunset-mint'
  | 'arctic-glass'
  | 'rose-nebula'
  | 'midnight-gold'
  | 'crimson-luxe'
  | 'polar-night'
  | 'citrus-pulse';

export type UltimaAnimationPresetId =
  | 'classic-waves'
  | 'orbital-aura'
  | 'radar-sweep'
  | 'nebula-drift'
  | 'pulse-grid'
  | 'meteor-stream';

type ThemePresetConfig = Pick<
  UltimaThemeConfig,
  | 'primaryColor'
  | 'primaryTextColor'
  | 'secondaryColor'
  | 'secondaryTextColor'
  | 'navBackgroundColor'
  | 'navActiveColor'
  | 'navTextColor'
  | 'backgroundTopColor'
  | 'backgroundBottomColor'
  | 'auraColor'
  | 'ringColor'
  | 'surfaceColor'
  | 'surfaceBorderColor'
  | 'scrollbarThumbColor'
  | 'scrollbarTrackColor'
  | 'framesEnabled'
>;

type AnimationPresetConfig = Pick<
  UltimaThemeConfig,
  | 'contentEnterMs'
  | 'tapRingMs'
  | 'ringWaveSec'
  | 'sliderGlowSec'
  | 'stepRingSec'
  | 'successWaveMs'
  | 'itemEnterMs'
>;

export type UltimaThemePreset = {
  id: UltimaThemePresetId;
  name: string;
  description: string;
  accent: string;
  config: ThemePresetConfig;
};

export type UltimaAnimationPreset = {
  id: UltimaAnimationPresetId;
  name: string;
  description: string;
  config: AnimationPresetConfig;
};

export const ULTIMA_THEME_PRESETS: UltimaThemePreset[] = [
  {
    id: 'emerald-classic',
    name: 'Emerald Classic',
    description: 'Классический Ultima: изумруд, тёмное стекло и мягкое свечение.',
    accent: '#1bd29f',
    config: {
      primaryColor: '#1bd29f',
      primaryTextColor: '#ffffff',
      secondaryColor: '#0c2d2a',
      secondaryTextColor: '#f7fffc',
      navBackgroundColor: '#0f3a38',
      navActiveColor: '#1bd29f',
      navTextColor: '#d6f6ee',
      backgroundTopColor: '#031824',
      backgroundBottomColor: '#06232b',
      auraColor: '#21d09a',
      ringColor: '#b8ffec',
      surfaceColor: '#0c2d2a',
      surfaceBorderColor: '#92f4d8',
      scrollbarThumbColor: '#49e9b3',
      scrollbarTrackColor: '#0c262a',
      framesEnabled: false,
    },
  },
  {
    id: 'neon-ocean',
    name: 'Neon Ocean',
    description: 'Холодный неон, аквамариновые акценты и глубокий океанский фон.',
    accent: '#1ed6bf',
    config: {
      primaryColor: '#1ed6bf',
      primaryTextColor: '#ffffff',
      secondaryColor: '#0a2a35',
      secondaryTextColor: '#effcff',
      navBackgroundColor: '#0b2f36',
      navActiveColor: '#1ed6bf',
      navTextColor: '#cdf8ff',
      backgroundTopColor: '#021425',
      backgroundBottomColor: '#052933',
      auraColor: '#20d0c0',
      ringColor: '#c8fff8',
      surfaceColor: '#0b2d36',
      surfaceBorderColor: '#7ef0e4',
      scrollbarThumbColor: '#42dec9',
      scrollbarTrackColor: '#0b242b',
      framesEnabled: false,
    },
  },
  {
    id: 'sunset-mint',
    name: 'Sunset Mint',
    description: 'Тёплый янтарный акцент на насыщенном зелёно-графитовом фоне.',
    accent: '#f3b63c',
    config: {
      primaryColor: '#f3b63c',
      primaryTextColor: '#1f1a0a',
      secondaryColor: '#1f3a32',
      secondaryTextColor: '#f7fff3',
      navBackgroundColor: '#24423a',
      navActiveColor: '#f3b63c',
      navTextColor: '#f3f7ea',
      backgroundTopColor: '#111f2d',
      backgroundBottomColor: '#1a3d37',
      auraColor: '#f0b04f',
      ringColor: '#ffe0a3',
      surfaceColor: '#1f3f39',
      surfaceBorderColor: '#f4d08a',
      scrollbarThumbColor: '#f0bd67',
      scrollbarTrackColor: '#1f2f2b',
      framesEnabled: true,
    },
  },
  {
    id: 'arctic-glass',
    name: 'Arctic Glass',
    description: 'Полярная стеклянная палитра со светлым сиянием и чистыми контурами.',
    accent: '#7de6d5',
    config: {
      primaryColor: '#7de6d5',
      primaryTextColor: '#0d1c1f',
      secondaryColor: '#12313a',
      secondaryTextColor: '#eefeff',
      navBackgroundColor: '#12313a',
      navActiveColor: '#8cf5e4',
      navTextColor: '#d9fcff',
      backgroundTopColor: '#041a29',
      backgroundBottomColor: '#0a2f3d',
      auraColor: '#7fefe0',
      ringColor: '#ddfffb',
      surfaceColor: '#12363e',
      surfaceBorderColor: '#b7faf0',
      scrollbarThumbColor: '#99f3e5',
      scrollbarTrackColor: '#14313b',
      framesEnabled: true,
    },
  },
  {
    id: 'rose-nebula',
    name: 'Rose Nebula',
    description: 'Розово-малиновое свечение с темным космическим фоном.',
    accent: '#ff7ab6',
    config: {
      primaryColor: '#ff7ab6',
      primaryTextColor: '#2c0b18',
      secondaryColor: '#2a1633',
      secondaryTextColor: '#fff2fa',
      navBackgroundColor: '#30163a',
      navActiveColor: '#ff7ab6',
      navTextColor: '#ffd8eb',
      backgroundTopColor: '#14081e',
      backgroundBottomColor: '#2c1034',
      auraColor: '#ff5aa2',
      ringColor: '#ffc1de',
      surfaceColor: '#2f1638',
      surfaceBorderColor: '#ff9ec8',
      scrollbarThumbColor: '#ff7db7',
      scrollbarTrackColor: '#231126',
      framesEnabled: true,
    },
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    description: 'Почти чёрная база с золотистыми бликами и премиальным контрастом.',
    accent: '#f0c35a',
    config: {
      primaryColor: '#f0c35a',
      primaryTextColor: '#191205',
      secondaryColor: '#1b1a1b',
      secondaryTextColor: '#fff8ea',
      navBackgroundColor: '#1d1c1f',
      navActiveColor: '#f0c35a',
      navTextColor: '#f3e7bd',
      backgroundTopColor: '#06070a',
      backgroundBottomColor: '#13151a',
      auraColor: '#dca63f',
      ringColor: '#ffe5a6',
      surfaceColor: '#1d1d21',
      surfaceBorderColor: '#b99544',
      scrollbarThumbColor: '#d8ad4c',
      scrollbarTrackColor: '#15151a',
      framesEnabled: true,
    },
  },
  {
    id: 'crimson-luxe',
    name: 'Crimson Luxe',
    description: 'Бордовый люкс с насыщенным красным свечением и темным металлом.',
    accent: '#ff5a5f',
    config: {
      primaryColor: '#ff5a5f',
      primaryTextColor: '#210708',
      secondaryColor: '#2a1115',
      secondaryTextColor: '#fff1f1',
      navBackgroundColor: '#311318',
      navActiveColor: '#ff5a5f',
      navTextColor: '#ffd7d8',
      backgroundTopColor: '#0f0709',
      backgroundBottomColor: '#220d12',
      auraColor: '#ff4a57',
      ringColor: '#ffc0c4',
      surfaceColor: '#2b1217',
      surfaceBorderColor: '#ff8e95',
      scrollbarThumbColor: '#ff6a70',
      scrollbarTrackColor: '#1d0c10',
      framesEnabled: false,
    },
  },
  {
    id: 'polar-night',
    name: 'Polar Night',
    description: 'Сине-ледяной градиент с северным свечением и спокойной глубиной.',
    accent: '#72b8ff',
    config: {
      primaryColor: '#72b8ff',
      primaryTextColor: '#071521',
      secondaryColor: '#10263d',
      secondaryTextColor: '#f0f7ff',
      navBackgroundColor: '#122b43',
      navActiveColor: '#72b8ff',
      navTextColor: '#d6ecff',
      backgroundTopColor: '#040b18',
      backgroundBottomColor: '#0c1d31',
      auraColor: '#5cb8ff',
      ringColor: '#c4e7ff',
      surfaceColor: '#12283d',
      surfaceBorderColor: '#93cfff',
      scrollbarThumbColor: '#69bcff',
      scrollbarTrackColor: '#102131',
      framesEnabled: false,
    },
  },
  {
    id: 'citrus-pulse',
    name: 'Citrus Pulse',
    description: 'Лаймово-цитрусовый импульс с современным тёмным интерфейсом.',
    accent: '#d8ff5a',
    config: {
      primaryColor: '#d8ff5a',
      primaryTextColor: '#122000',
      secondaryColor: '#23301a',
      secondaryTextColor: '#fbffe9',
      navBackgroundColor: '#27361d',
      navActiveColor: '#d8ff5a',
      navTextColor: '#eef7c8',
      backgroundTopColor: '#0d1308',
      backgroundBottomColor: '#1b2a12',
      auraColor: '#c4ff47',
      ringColor: '#efffc0',
      surfaceColor: '#22311b',
      surfaceBorderColor: '#d2f58c',
      scrollbarThumbColor: '#c4ec54',
      scrollbarTrackColor: '#182211',
      framesEnabled: true,
    },
  },
];

export const ULTIMA_ANIMATION_PRESETS: UltimaAnimationPreset[] = [
  {
    id: 'classic-waves',
    name: 'Classic Waves',
    description: 'Старые фирменные круговые волны Ultima как отдельная самостоятельная сцена.',
    config: {
      contentEnterMs: 320,
      tapRingMs: 780,
      ringWaveSec: 18,
      sliderGlowSec: 2.6,
      stepRingSec: 5.8,
      successWaveMs: 1050,
      itemEnterMs: 280,
    },
  },
  {
    id: 'orbital-aura',
    name: 'Orbital Aura',
    description: 'Плавное круговое свечение и глубокая кинематографичная пульсация.',
    config: {
      contentEnterMs: 320,
      tapRingMs: 780,
      ringWaveSec: 18,
      sliderGlowSec: 2.6,
      stepRingSec: 5.8,
      successWaveMs: 1050,
      itemEnterMs: 280,
    },
  },
  {
    id: 'radar-sweep',
    name: 'Radar Sweep',
    description: 'Чёткий сканирующий луч и более собранная, техничная динамика.',
    config: {
      contentEnterMs: 260,
      tapRingMs: 640,
      ringWaveSec: 10,
      sliderGlowSec: 1.9,
      stepRingSec: 4.4,
      successWaveMs: 820,
      itemEnterMs: 220,
    },
  },
  {
    id: 'nebula-drift',
    name: 'Nebula Drift',
    description: 'Медленные туманные переливы с мягким входом контента.',
    config: {
      contentEnterMs: 420,
      tapRingMs: 920,
      ringWaveSec: 24,
      sliderGlowSec: 3.4,
      stepRingSec: 6.9,
      successWaveMs: 1180,
      itemEnterMs: 360,
    },
  },
  {
    id: 'pulse-grid',
    name: 'Pulse Grid',
    description: 'Ритмичная геометрия, заметные импульсы и более быстрый отклик.',
    config: {
      contentEnterMs: 240,
      tapRingMs: 560,
      ringWaveSec: 9,
      sliderGlowSec: 1.7,
      stepRingSec: 3.8,
      successWaveMs: 760,
      itemEnterMs: 210,
    },
  },
  {
    id: 'meteor-stream',
    name: 'Meteor Stream',
    description: 'Диагональный поток света с энергичным темпом и живым шлейфом.',
    config: {
      contentEnterMs: 300,
      tapRingMs: 700,
      ringWaveSec: 12,
      sliderGlowSec: 2.2,
      stepRingSec: 4.8,
      successWaveMs: 900,
      itemEnterMs: 240,
    },
  },
];

export function getUltimaThemePresetById(id: string): UltimaThemePreset {
  return ULTIMA_THEME_PRESETS.find((preset) => preset.id === id) ?? ULTIMA_THEME_PRESETS[0];
}

export function getUltimaAnimationPresetById(id: string): UltimaAnimationPreset {
  return ULTIMA_ANIMATION_PRESETS.find((preset) => preset.id === id) ?? ULTIMA_ANIMATION_PRESETS[0];
}

export function applyUltimaThemePreset(
  current: UltimaThemeConfig,
  presetId: string,
): UltimaThemeConfig {
  const preset = getUltimaThemePresetById(presetId);

  return {
    ...current,
    ...preset.config,
    themePresetId: preset.id,
  };
}

export function applyUltimaAnimationPreset(
  current: UltimaThemeConfig,
  presetId: string,
): UltimaThemeConfig {
  const preset = getUltimaAnimationPresetById(presetId);

  return {
    ...current,
    ...preset.config,
    animationPresetId: preset.id,
  };
}

export function getDefaultUltimaThemeWithPresets(): UltimaThemeConfig {
  const themePreset = getUltimaThemePresetById(DEFAULT_ULTIMA_THEME_CONFIG.themePresetId);
  const animationPreset = getUltimaAnimationPresetById(
    DEFAULT_ULTIMA_THEME_CONFIG.animationPresetId,
  );

  return {
    ...DEFAULT_ULTIMA_THEME_CONFIG,
    ...themePreset.config,
    ...animationPreset.config,
    themePresetId: themePreset.id,
    animationPresetId: animationPreset.id,
  };
}
