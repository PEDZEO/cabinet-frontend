import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ultimaAgreementApi } from '@/api/ultimaAgreement';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';

const sanitizeHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'i',
      'u',
      'strong',
      'em',
      'a',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
      's',
      'del',
      'ins',
      'span',
      'div',
      'tg-spoiler',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'start'],
    ALLOW_DATA_ATTR: false,
  });

const formatContent = (content: string): string => {
  const value = (content || '').trim();
  if (!value) return '';

  const hasBlockHtml = /<(p|div|h[1-6]|ul|ol|blockquote)\b/i.test(value);
  if (hasBlockHtml) return sanitizeHtml(value);

  return sanitizeHtml(
    value
      .split(/\n\n+/)
      .map((paragraph) => `<p>${paragraph.trim().split('\n').join('<br/>')}</p>`)
      .join(''),
  );
};

export function UltimaAgreement() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['ultima-agreement', i18n.language],
    queryFn: () => ultimaAgreementApi.getAgreement(i18n.language || 'ru'),
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const htmlContent = useMemo(() => formatContent(data?.content ?? ''), [data?.content]);
  const updatedAtLabel = useMemo(() => {
    if (!data?.updated_at) return null;
    const date = new Date(data.updated_at);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(i18n.language || 'ru', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [data, i18n.language]);

  return (
    <div className="ultima-shell ultima-flat-frames">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="ultima-shell-inner">
        <section className="mb-3 rounded-[24px] border border-emerald-200/10 bg-[linear-gradient(180deg,rgba(69,186,142,0.16),rgba(18,79,64,0.26))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md">
          <div className="bg-white/6 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/80">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path
                d="M8 3.5h7l4 4v12A1.5 1.5 0 0 1 17.5 21h-9A1.5 1.5 0 0 1 7 19.5v-14A1.5 1.5 0 0 1 8.5 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M15 3.5V8h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path
                d="m9.8 14.1 1.8 1.8 3.2-3.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="mt-2 text-[clamp(27px,7.4vw,34px)] font-semibold leading-[0.95] tracking-[-0.015em] text-white">
            {t('profile.termsTitle', { defaultValue: 'Пользовательское соглашение' })}
          </h1>
          <p className="mt-1 text-[12px] text-white/55">
            {updatedAtLabel
              ? t('common.updatedAtDate', {
                  defaultValue: `Обновлено ${updatedAtLabel}`,
                  date: updatedAtLabel,
                })
              : t('profile.termsDescription', {
                  defaultValue: 'Соглашения и правила сервиса',
                })}
          </p>
        </section>

        <section className="min-h-0 flex-1 overflow-hidden rounded-3xl">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/35 border-t-transparent" />
            </div>
          ) : (
            <div className="text-white/87 h-full overflow-y-auto px-1 pb-1 text-[14px] leading-[1.6]">
              {htmlContent ? (
                <div
                  className="prose prose-invert max-w-none [&_a]:text-[#5de8c3] [&_a]:underline [&_h1]:mb-3 [&_h1]:text-[34px] [&_h1]:font-semibold [&_h1]:leading-[1] [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-[34px] [&_h2]:font-semibold [&_h2]:leading-[1] [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-[34px] [&_h3]:font-semibold [&_h3]:leading-[1] [&_li]:mb-1 [&_p]:mb-3 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <p className="text-white/60">
                  {t('info.noContent', { defaultValue: 'Контент не заполнен' })}
                </p>
              )}
            </div>
          )}
        </section>

        <div className="ultima-nav-dock">
          <UltimaBottomNav active="profile" onProfileClick={() => navigate('/profile')} />
        </div>
      </div>
    </div>
  );
}
