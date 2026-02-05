import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import {
  adminAppsApi,
  LocalizedText,
  RemnawaveApp,
  RemnawaveSvgItem,
  RemnawaveBlock,
  RemnawaveButton,
  RemnawaveBaseSettings,
  RemnawaveBaseTranslations,
} from '../api/adminApps';
import { useBackButton } from '../platform/hooks/useBackButton';
import { usePlatform } from '../platform/hooks/usePlatform';

// Icons

const BackIcon = () => (
  <svg
    className="h-5 w-5 text-dark-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const AppsIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
    />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`h-4 w-4 ${filled ? 'fill-warning-400 text-warning-400' : 'text-dark-500'}`}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);

const CloudSyncIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const PLATFORM_LABELS: Record<string, string> = {
  ios: 'iOS',
  android: 'Android',
  macos: 'macOS',
  windows: 'Windows',
  linux: 'Linux',
  androidTV: 'Android TV',
  appleTV: 'Apple TV',
};

const PLATFORMS = ['ios', 'android', 'macos', 'windows', 'linux', 'androidTV', 'appleTV'];

function getLocalizedText(text: LocalizedText | undefined, lang: string): string {
  if (!text) return '';
  return (
    text[lang as keyof LocalizedText] ||
    text['en'] ||
    text['ru'] ||
    Object.values(text).find((v) => v) ||
    ''
  );
}

function renderSvgIcon(svgLibrary: Record<string, RemnawaveSvgItem>, key?: string, color?: string) {
  if (!key || !svgLibrary[key]?.svgString) return null;
  const sanitized = DOMPurify.sanitize(svgLibrary[key].svgString, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
  return (
    <div
      className="h-6 w-6 flex-shrink-0 [&>svg]:h-full [&>svg]:w-full"
      style={{ color: color || 'currentColor' }}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

function BaseSettingsPanel({ settings }: { settings: RemnawaveBaseSettings }) {
  const { t } = useTranslation();
  return (
    <div className="card space-y-2 p-4">
      <h3 className="text-sm font-semibold text-dark-200">
        {t('admin.apps.baseSettings', 'Base Settings')}
      </h3>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-dark-400">{t('admin.apps.tutorialButton', 'Tutorial button')}:</span>
        <span className={settings.isShowTutorialButton ? 'text-success-400' : 'text-dark-500'}>
          {settings.isShowTutorialButton ? 'ON' : 'OFF'}
        </span>
      </div>
      {settings.tutorialUrl && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-dark-400">URL:</span>
          <span className="truncate font-mono text-xs text-dark-300">{settings.tutorialUrl}</span>
        </div>
      )}
    </div>
  );
}

function BaseTranslationsPanel({
  translations,
  lang,
}: {
  translations: RemnawaveBaseTranslations;
  lang: string;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const keys: (keyof RemnawaveBaseTranslations)[] = [
    'installApp',
    'addSubscription',
    'connectAndUse',
    'copyLink',
    'openApp',
    'tutorial',
    'close',
  ];

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <h3 className="text-sm font-semibold text-dark-200">
          {t('admin.apps.baseTranslations', 'Base Translations')}
        </h3>
        <div className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </div>
      </button>
      {expanded && (
        <div className="border-t border-dark-700 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dark-500">
                <th className="pb-2 text-left font-medium">Key</th>
                <th className="pb-2 text-left font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {keys.map((key) => (
                <tr key={key}>
                  <td className="py-2 pr-4 font-mono text-xs text-dark-400">{key}</td>
                  <td className="py-2 text-dark-200">
                    {getLocalizedText(translations[key], lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AppCard({
  app,
  svgLibrary,
  lang,
}: {
  app: RemnawaveApp;
  svgLibrary: Record<string, RemnawaveSvgItem>;
  lang: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        {/* App icon from svgLibrary */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-700/50">
          {renderSvgIcon(svgLibrary, app.svgIconKey) || <AppsIcon />}
        </div>

        {/* Name + badges */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-dark-100">{app.name}</span>
            {app.featured && <StarIcon filled />}
            {app.isNeedBase64Encoding && (
              <span className="rounded bg-dark-700 px-2 py-0.5 text-xs text-dark-400">Base64</span>
            )}
          </div>
          {app.urlScheme && (
            <div className="mt-0.5 truncate font-mono text-xs text-dark-500">{app.urlScheme}</div>
          )}
        </div>

        {/* Expand indicator */}
        <div
          className={`transform text-dark-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <ChevronDownIcon />
        </div>
      </button>

      {/* Expanded blocks */}
      {expanded && (
        <div className="space-y-3 border-t border-dark-700 p-4">
          {app.blocks?.map((block: RemnawaveBlock, idx: number) => (
            <BlockCard key={idx} block={block} index={idx} svgLibrary={svgLibrary} lang={lang} />
          ))}
          {(!app.blocks || app.blocks.length === 0) && (
            <p className="py-4 text-center text-sm text-dark-500">No blocks</p>
          )}
        </div>
      )}
    </div>
  );
}

function BlockCard({
  block,
  index,
  svgLibrary,
  lang,
}: {
  block: RemnawaveBlock;
  index: number;
  svgLibrary: Record<string, RemnawaveSvgItem>;
  lang: string;
}) {
  const title = getLocalizedText(block.title, lang);
  const description = getLocalizedText(block.description, lang);

  const iconColor = block.svgIconColor || '#8B5CF6';

  return (
    <div className="rounded-lg bg-dark-800/50 p-3">
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: iconColor + '20',
            color: iconColor,
          }}
        >
          {renderSvgIcon(svgLibrary, block.svgIconKey, block.svgIconColor) || (
            <span className="text-xs font-bold text-dark-400">{index + 1}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {title && <div className="text-sm font-medium text-dark-200">{title}</div>}
          {description && <div className="mt-1 text-sm text-dark-400">{description}</div>}
          {block.buttons && block.buttons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {block.buttons.map((btn: RemnawaveButton, btnIdx: number) => (
                <a
                  key={btnIdx}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-dark-700 px-3 py-1.5 text-xs text-dark-200 hover:bg-dark-600"
                >
                  {btn.svgIconKey && renderSvgIcon(svgLibrary, btn.svgIconKey)}
                  {getLocalizedText(btn.text, lang)}
                  {btn.type && (
                    <span className="rounded bg-dark-600 px-1.5 py-0.5 text-[10px] text-dark-400">
                      {btn.type}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminApps() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { capabilities } = usePlatform();
  const lang = i18n.language || 'en';

  useBackButton(() => navigate('/admin'));

  const [selectedPlatform, setSelectedPlatform] = useState<string>('ios');
  const [showRemnaWaveSettings, setShowRemnaWaveSettings] = useState(false);
  const [remnaWaveUuidInput, setRemnaWaveUuidInput] = useState('');

  // RemnaWave status
  const { data: remnaWaveStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['remnawave-status'],
    queryFn: adminAppsApi.getRemnaWaveStatus,
    staleTime: 60000,
  });

  // List available RemnaWave configs (for settings modal)
  const { data: availableConfigs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['remnawave-configs-list'],
    queryFn: adminAppsApi.listRemnaWaveConfigs,
    enabled: showRemnaWaveSettings,
    staleTime: 30000,
  });

  // Mutation for setting UUID
  const setUuidMutation = useMutation({
    mutationFn: adminAppsApi.setRemnaWaveUuid,
    onSuccess: () => {
      refetchStatus();
      queryClient.invalidateQueries({ queryKey: ['remnawave-config'] });
      setShowRemnaWaveSettings(false);
    },
  });

  // Fetch RemnaWave config
  const {
    data: remnaWaveConfig,
    isLoading,
    refetch: refetchRemnaWave,
  } = useQuery({
    queryKey: ['remnawave-config'],
    queryFn: adminAppsApi.getRemnaWaveConfig,
    enabled: !!remnaWaveStatus?.enabled,
    staleTime: 0,
  });

  // Extract data from raw RemnaWave config
  const currentPlatformApps = remnaWaveConfig?.platforms?.[selectedPlatform]?.apps || [];
  const svgLibrary = remnaWaveConfig?.svgLibrary || {};
  const baseSettings = remnaWaveConfig?.baseSettings;
  const baseTranslations = remnaWaveConfig?.baseTranslations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!capabilities.hasBackButton && (
            <button
              onClick={() => navigate('/admin')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
            >
              <BackIcon />
            </button>
          )}
          <h1 className="text-2xl font-bold text-dark-50 sm:text-3xl">{t('admin.apps.title')}</h1>
        </div>

        <div className="flex items-center gap-2">
          {remnaWaveStatus?.enabled && (
            <button
              onClick={() => refetchRemnaWave()}
              className="rounded-lg p-2 text-dark-400 transition-colors hover:bg-dark-700 hover:text-dark-200"
              title={t('admin.apps.refreshRemnaWave', 'Refresh from RemnaWave')}
            >
              <RefreshIcon />
            </button>
          )}
          <button
            onClick={() => {
              setRemnaWaveUuidInput(remnaWaveStatus?.config_uuid || '');
              setShowRemnaWaveSettings(true);
            }}
            className="rounded-lg p-2 text-dark-400 transition-colors hover:bg-dark-700 hover:text-dark-200"
            title={t('admin.apps.remnaWaveSettings', 'RemnaWave Settings')}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* RemnaWave Info Banner */}
      {remnaWaveStatus?.enabled && (
        <div className="flex items-center gap-2 rounded-lg border border-accent-500/30 bg-accent-500/10 p-3 text-sm text-accent-200">
          <CloudSyncIcon />
          <span>
            {t('admin.apps.remnaWaveMode', 'Showing apps from RemnaWave panel. Read-only mode.')}
          </span>
        </div>
      )}

      {/* Base Settings */}
      {baseSettings && <BaseSettingsPanel settings={baseSettings} />}

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedPlatform === platform
                ? 'bg-accent-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            {PLATFORM_LABELS[platform]}
          </button>
        ))}
      </div>

      {/* Apps List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      ) : currentPlatformApps.length > 0 ? (
        <div className="space-y-3">
          {currentPlatformApps.map((app: RemnawaveApp, index: number) => (
            <AppCard key={`${app.name}-${index}`} app={app} svgLibrary={svgLibrary} lang={lang} />
          ))}
        </div>
      ) : (
        <div className="card py-12 text-center">
          <AppsIcon />
          <p className="mt-4 text-dark-400">{t('admin.apps.noApps')}</p>
        </div>
      )}

      {/* Base Translations */}
      {baseTranslations && <BaseTranslationsPanel translations={baseTranslations} lang={lang} />}

      {/* RemnaWave Settings Modal */}
      {showRemnaWaveSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl bg-dark-900 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-dark-100">
              <CloudSyncIcon />
              {t('admin.apps.remnaWaveSettings', 'RemnaWave Settings')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-dark-300">
                  {t('admin.apps.remnaWaveConfigUuid', 'Config UUID')}
                </label>
                <input
                  type="text"
                  value={remnaWaveUuidInput}
                  onChange={(e) => setRemnaWaveUuidInput(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="input w-full font-mono text-sm"
                />
                <p className="mt-1 text-xs text-dark-500">
                  {t(
                    'admin.apps.remnaWaveConfigUuidHint',
                    'UUID of subscription page config from RemnaWave panel',
                  )}
                </p>
              </div>

              {/* Available configs from RemnaWave */}
              {isLoadingConfigs ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                </div>
              ) : (
                availableConfigs &&
                availableConfigs.length > 0 && (
                  <div>
                    <label className="mb-2 block text-sm text-dark-300">
                      {t('admin.apps.availableConfigs', 'Available configs')}
                    </label>
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {availableConfigs.map((config) => (
                        <button
                          key={config.uuid}
                          onClick={() => setRemnaWaveUuidInput(config.uuid)}
                          className={`w-full rounded-lg border p-3 text-left transition-colors ${
                            remnaWaveUuidInput === config.uuid
                              ? 'border-accent-500 bg-accent-500/10'
                              : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                          }`}
                        >
                          <div className="font-medium text-dark-100">{config.name}</div>
                          <div className="mt-1 font-mono text-xs text-dark-500">{config.uuid}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-dark-700 pt-4">
              <button onClick={() => setShowRemnaWaveSettings(false)} className="btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                onClick={() => setUuidMutation.mutate(remnaWaveUuidInput || null)}
                disabled={setUuidMutation.isPending}
                className="btn-primary"
              >
                {setUuidMutation.isPending ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
