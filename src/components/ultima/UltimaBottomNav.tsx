import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Headphones,
  LayoutDashboard,
  Newspaper,
  Settings2,
  UserRound,
} from 'lucide-react';
import type { UltimaBottomNavTab } from '@/features/ultima/navigation';
import { cn } from '@/lib/utils';

type UltimaBottomNavProps = {
  active: UltimaBottomNavTab;
  onHomeClick?: () => void;
  onConnectionClick?: () => void;
  onNewsClick?: () => void;
  onProfileClick?: () => void;
  onSupportClick?: () => void;
};

export function UltimaBottomNav({
  active,
  onHomeClick,
  onConnectionClick,
  onNewsClick,
  onProfileClick,
  onSupportClick,
}: UltimaBottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSubscription =
    pathname.startsWith('/subscription') || pathname === '/ultima/subscription-info';
  const items = [
    {
      id: 'home',
      label: t('nav.dashboard', { defaultValue: 'Главная' }),
      icon: LayoutDashboard,
      onClick: onHomeClick ?? (() => navigate('/')),
    },
    {
      id: 'connection',
      label: t('nav.connection', { defaultValue: 'Подключение' }),
      icon: Settings2,
      onClick: onConnectionClick ?? (() => navigate('/connection')),
    },
    {
      id: 'subscription',
      label: t('nav.subscription', { defaultValue: 'Подписка' }),
      icon: CreditCard,
      onClick: () => navigate('/ultima/subscription-info'),
    },
    {
      id: 'support',
      label: t('nav.support', { defaultValue: 'Поддержка' }),
      icon: Headphones,
      onClick: onSupportClick ?? (() => navigate('/support')),
    },
    {
      id: 'profile',
      label: t('nav.profile', { defaultValue: 'Профиль' }),
      icon: UserRound,
      onClick: onProfileClick ?? (() => navigate('/profile')),
    },
    {
      id: 'news',
      label: t('nav.news', { defaultValue: 'Новости' }),
      icon: Newspaper,
      onClick: onNewsClick ?? (() => navigate('/ultima/news')),
    },
  ];

  return (
    <nav
      className="ultima-bottom-nav"
      aria-label={t('nav.mainNavigation', { defaultValue: 'Основная навигация' })}
    >
      {items.map(({ id, label, icon: Icon, onClick }) => {
        const selected = isSubscription ? id === 'subscription' : id === active;
        return (
          <button
            key={id}
            type="button"
            data-ultima-nav-btn="1"
            data-ultima-nav-target={id}
            className={cn(
              'ultima-nav-item',
              selected && 'is-active',
              id === 'news' && 'ultima-nav-news',
            )}
            onClick={onClick}
            aria-current={selected ? 'page' : undefined}
            aria-label={label}
            title={label}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
