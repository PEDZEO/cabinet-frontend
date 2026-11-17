import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ultimaAgreementApi } from '@/api/ultimaAgreement';
import { UltimaDesktopSectionLayout } from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import '@/styles/ultima-agreement.css';

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
  const isDesktopViewport = useMediaQuery('(min-width: 1024px)');

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

  const title = t('profile.termsTitle', { defaultValue: 'Пользовательское соглашение' });
  const subtitle = updatedAtLabel
    ? t('common.updatedAtDate', {
        defaultValue: `Обновлено ${updatedAtLabel}`,
        date: updatedAtLabel,
      })
    : t('profile.termsDescription', {
        defaultValue: 'Соглашения и правила сервиса',
      });
  const emptyLabel = t('info.noContent', { defaultValue: 'Контент не заполнен' });
  const bottomNav = (
    <UltimaBottomNav active="profile" onProfileClick={() => navigate('/profile')} />
  );
  const documentBody = (
    <section className="ultima-agreement-document" aria-busy={isLoading}>
      {isLoading ? (
        <div className="ultima-agreement-loading" role="status" aria-label={t('common.loading')}>
          <span className="ultima-agreement-spinner" aria-hidden="true" />
        </div>
      ) : htmlContent ? (
        <article
          className="ultima-agreement-body"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <p className="ultima-agreement-empty">{emptyLabel}</p>
      )}
    </section>
  );

  if (isDesktopViewport) {
    return (
      <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-shell-reading-desktop ultima-agreement">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={null}
          title={title}
          subtitle={subtitle}
          bottomNav={bottomNav}
          contentClassName="ultima-agreement-page"
        >
          {documentBody}
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-shell-wide ultima-flat-frames ultima-agreement">
      <div className="ultima-shell-aura" />
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[960px]">
        <header className="ultima-agreement-heading">
          <h1 className="ultima-agreement-title">{title}</h1>
          <p className="ultima-agreement-subtitle">{subtitle}</p>
        </header>

        <div className="ultima-scrollbar ultima-agreement-mobile-reading">{documentBody}</div>

        <div className="ultima-mobile-dock-footer">
          <div className="ultima-nav-dock">{bottomNav}</div>
        </div>
      </div>
    </div>
  );
}
