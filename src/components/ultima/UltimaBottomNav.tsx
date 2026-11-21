import { useId, useRef, useState, type PointerEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Headphones, House, Newspaper, Smartphone, UserRound } from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import type { UltimaBottomNavTab } from '@/features/ultima/navigation';
import { cn } from '@/lib/utils';

type UltimaBottomNavProps = {
  active: UltimaBottomNavTab;
  onHomeClick?: () => void;
  onConnectionClick?: () => void;
  onSubscriptionClick?: () => void;
  onNewsClick?: () => void;
  onProfileClick?: () => void;
  onSupportClick?: () => void;
};

type NavGesture = {
  pointerId: number;
  startX: number;
  moved: boolean;
};

const NAV_BUTTON = 'button[data-ultima-nav-target]';

function getPointedTab({ currentTarget, clientX, clientY }: PointerEvent<HTMLElement>) {
  const bounds = currentTarget.getBoundingClientRect();
  if (clientY < bounds.top - 12 || clientY > bounds.bottom + 12) return null;

  const buttons = currentTarget.querySelectorAll<HTMLButtonElement>(NAV_BUTTON);
  for (const button of buttons) {
    const rect = button.getBoundingClientRect();
    if (rect.width && clientX >= rect.left - 2 && clientX <= rect.right + 2) {
      return button.dataset.ultimaNavTarget ?? null;
    }
  }
  return null;
}

export function UltimaBottomNav({
  active,
  onHomeClick,
  onConnectionClick,
  onSubscriptionClick,
  onNewsClick,
  onProfileClick,
  onSupportClick,
}: UltimaBottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const groupId = useId();
  const reduceMotion = useReducedMotion();
  const gesture = useRef<NavGesture | null>(null);
  const ignorePointerClick = useRef(false);
  const [pointedTab, setPointedTab] = useState<string | null>(null);
  const isSubscription =
    pathname.startsWith('/subscription') || pathname === '/ultima/subscription-info';
  const items = [
    {
      id: 'home',
      label: t('nav.dashboard', { defaultValue: 'Главная' }),
      icon: House,
      onClick: onHomeClick ?? (() => navigate('/')),
    },
    {
      id: 'connection',
      label: t('nav.connection', { defaultValue: 'Подключение' }),
      mobileLabel: 'VPN',
      icon: Smartphone,
      onClick: onConnectionClick ?? (() => navigate('/connection')),
    },
    {
      id: 'subscription',
      label: t('nav.subscription', { defaultValue: 'Подписка' }),
      mobileLabel: t('nav.subscriptionShort'),
      icon: BadgeCheck,
      onClick: onSubscriptionClick ?? (() => navigate('/ultima/subscription-info')),
    },
    {
      id: 'support',
      label: t('nav.support', { defaultValue: 'Поддержка' }),
      mobileLabel: t('nav.supportShort'),
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

  const startGesture = (event: PointerEvent<HTMLElement>) => {
    if (!event.isPrimary) return;
    ignorePointerClick.current = false;
    if (event.button !== 0) return;

    const button = (event.target as Element).closest<HTMLButtonElement>(NAV_BUTTON);
    if (!button) return;

    gesture.current = { pointerId: event.pointerId, startX: event.clientX, moved: false };
    button.setPointerCapture(event.pointerId);
    setPointedTab(button.dataset.ultimaNavTarget ?? null);
  };

  const moveGesture = (event: PointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (Math.abs(event.clientX - current.startX) >= 8) current.moved = true;
    if (current.moved) setPointedTab(getPointedTab(event));
  };

  const finishGesture = (event: PointerEvent<HTMLElement>, cancelled = false) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;

    gesture.current = null;
    setPointedTab(null);
    const moved = current.moved || Math.abs(event.clientX - current.startX) >= 8;
    if (cancelled) return;
    const target = getPointedTab(event);
    ignorePointerClick.current = moved || target === null;
    if (moved) items.find(({ id }) => id === target)?.onClick();
  };

  return (
    <nav
      className="ultima-bottom-nav"
      aria-label={t('nav.mainNavigation', { defaultValue: 'Основная навигация' })}
      onPointerDown={startGesture}
      onPointerMove={moveGesture}
      onPointerUp={finishGesture}
      onPointerCancel={(event) => finishGesture(event, true)}
      onLostPointerCapture={(event) => finishGesture(event, true)}
      onContextMenu={(event) => {
        if (gesture.current) event.preventDefault();
      }}
      onClickCapture={(event) => {
        if (!ignorePointerClick.current || event.detail === 0) return;
        ignorePointerClick.current = false;
        event.stopPropagation();
      }}
    >
      <LayoutGroup id={groupId}>
        {items.map(({ id, label, mobileLabel, icon: Icon, onClick }) => {
          const selected = isSubscription ? id === 'subscription' : id === active;
          const highlighted = pointedTab ? id === pointedTab : selected;
          return (
            <button
              key={id}
              type="button"
              data-ultima-nav-btn="1"
              data-ultima-nav-target={id}
              className={cn(
                'ultima-nav-item',
                highlighted && 'is-active',
                pointedTab === id && 'is-pointed',
                id === 'news' && 'ultima-nav-news',
              )}
              onClick={onClick}
              aria-current={selected ? 'page' : undefined}
              aria-label={label}
              title={label}
            >
              <i className="ultima-nav-icon" aria-hidden="true">
                {highlighted && (
                  <motion.b
                    className="ultima-nav-indicator"
                    layoutId={reduceMotion ? undefined : 'active-tab'}
                    transition={{ type: 'spring', stiffness: 410, damping: 32 }}
                  />
                )}
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              </i>
              {mobileLabel ? (
                <>
                  <span className="ultima-nav-label-full">{label}</span>
                  <span className="ultima-nav-label-mobile">{mobileLabel}</span>
                </>
              ) : (
                <span>{label}</span>
              )}
            </button>
          );
        })}
      </LayoutGroup>
    </nav>
  );
}
