import type { BlockRendererProps } from './types';

export function AccordionBlock({
  blocks,
  isLight,
  getLocalizedText,
  platformKey,
  renderBlockButtons,
}: BlockRendererProps) {
  const visibleBlocks = blocks
    .filter(
      (b) =>
        getLocalizedText(b.title) ||
        getLocalizedText(b.description) ||
        b.buttons?.length ||
        b.customNode,
    )
    .slice(0, 3);

  const installDescriptionByPlatform: Record<string, string> = {
    ios: 'Установите приложение из App Store',
    android: 'Установите приложение из Google Play или APK',
    windows: 'Установите приложение для Windows',
    macos: 'Установите приложение для macOS',
    linux: 'Установите приложение для Linux',
    androidtv: 'Установите приложение на Android TV',
    appletv: 'Установите приложение на Apple TV',
  };

  const compactCopy = [
    {
      title: 'Установка приложения',
      description:
        installDescriptionByPlatform[(platformKey || '').toLowerCase()] || 'Установите приложение',
    },
    { title: 'Импортируйте конфигурацию', description: 'Добавьте подписку в приложении' },
    { title: 'Подключитесь к VPN', description: 'Нажмите кнопку подключения' },
  ];

  if (!visibleBlocks.length) return null;

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
      {visibleBlocks.map((block, index) => {
        const title = compactCopy[index]?.title || getLocalizedText(block.title);
        const description = compactCopy[index]?.description || getLocalizedText(block.description);

        return (
          <div
            key={index}
            className={`rounded-[26px] border px-5 py-4 ${
              isLight
                ? 'border-champagne-300/70 bg-white/65 shadow-sm'
                : 'border-dark-700/70 bg-dark-900/45'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold ${
                  isLight
                    ? 'border-accent-500 bg-accent-950/15 text-accent-600'
                    : 'border-accent-500 bg-accent-500/10 text-accent-400'
                }`}
              >
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold leading-tight text-dark-100">{title}</h3>
                {description && (
                  <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-snug text-dark-400">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {renderBlockButtons(block.buttons, 'light')}
            {block.customNode}
          </div>
        );
      })}
    </div>
  );
}
