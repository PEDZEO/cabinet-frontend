import { getColorGradientSolid } from '@/utils/colorParser';
import type { BlockRendererProps } from './types';

export function TimelineBlock({
  blocks,
  isMobile,
  isLight,
  getLocalizedText,
  getSvgHtml: _getSvgHtml,
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

  if (!visibleBlocks.length) return null;

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 lg:gap-4">
      {visibleBlocks.map((block, index) => {
        const gradientStyle = getColorGradientSolid(block.svgIconColor || 'cyan', isLight);
        const stepNumber = String(index + 1);
        const compactCopy = [
          {
            title: 'Установка приложения',
            description:
              installDescriptionByPlatform[(platformKey || '').toLowerCase()] ||
              'Установите приложение',
          },
          { title: 'Импортируйте конфигурацию', description: 'Добавьте подписку в приложении' },
          { title: 'Подключитесь к VPN', description: 'Нажмите кнопку подключения' },
        ];
        const title = compactCopy[index]?.title || getLocalizedText(block.title);
        const description = compactCopy[index]?.description || getLocalizedText(block.description);

        return (
          <div
            key={index}
            className={`rounded-[26px] border px-4 py-4 sm:px-5 lg:px-6 lg:py-5 ${
              isLight ? 'border-champagne-300/70 bg-white/55' : 'border-dark-700/70 bg-dark-900/45'
            }`}
          >
            <div className="flex gap-4">
              {/* Left column: bullet + line segment */}
              <div className="flex flex-col items-center">
                <div
                  className="flex shrink-0 items-center justify-center rounded-full border"
                  style={{
                    width: isMobile ? 36 : 40,
                    height: isMobile ? 36 : 40,
                    background: gradientStyle.background,
                    border: gradientStyle.border,
                    boxShadow: gradientStyle.boxShadow,
                    color: isLight
                      ? 'rgb(var(--color-accent-600))'
                      : 'rgb(var(--color-accent-400))',
                    fontWeight: 700,
                    fontSize: isMobile ? 14 : 16,
                  }}
                >
                  {stepNumber}
                </div>
              </div>
              {/* Right column: content */}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold leading-tight text-dark-100 sm:text-lg">
                  {title}
                </h3>
                {description && (
                  <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-snug text-dark-400 sm:text-base">
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
