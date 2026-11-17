import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  CircleHelp,
  CreditCard,
  Headphones,
  Image as ImageIcon,
  MessageCircleMore,
  Send as SendIcon,
  ShieldCheck,
  Smartphone,
  X as CloseIcon,
} from 'lucide-react';
import { infoApi } from '@/api/info';
import { ticketsApi } from '@/api/tickets';
import type { TicketMediaType } from '@/api/tickets';
import { subscriptionApi } from '@/api/subscription';
import { UltimaDesktopSectionLayout } from '@/components/ultima/desktop/UltimaDesktopSectionLayout';
import {
  ultimaPaneClassName,
  ultimaPaneSurfaceStyle,
  ultimaPanelClassName,
  ultimaSurfaceStyle,
} from '@/features/ultima/surfaces';
import { usePlatform } from '@/platform';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import { UltimaPortal } from '@/components/ultima/UltimaPortal';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Ticket } from '@/types';
import { trackAnalyticsEvent } from '@/utils/analyticsEvents';

const TICKETS_BATCH_SIZE = 5;
const MOBILE_TICKET_LIST_EXPANDED_HEIGHT = 'max-h-[34vh]';
const ULTIMA_SUPPORT_SECTION_STYLE: CSSProperties = ultimaSurfaceStyle;
const ULTIMA_SUPPORT_PANE_STYLE: CSSProperties = ultimaPaneSurfaceStyle;

type MediaAttachment = {
  file: File;
  preview: string;
  uploading: boolean;
  fileId?: string;
  mediaType: TicketMediaType;
  error?: string;
};

const ALLOWED_FILE_TYPES: Record<string, TicketMediaType> = {
  'image/jpeg': 'photo',
  'image/png': 'photo',
  'image/gif': 'photo',
  'image/webp': 'photo',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'text/plain': 'document',
  'application/zip': 'document',
  'application/x-rar-compressed': 'document',
};

const ACCEPT_STRING = Object.keys(ALLOWED_FILE_TYPES).join(',');
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type TicketListMode = 'active' | 'archive';

const QUICK_SUPPORT_TOPICS = [
  {
    key: 'connection',
    labelKey: 'support.quickConnection',
    titleKey: 'support.quickConnectionTitle',
    messageKey: 'support.quickConnectionMessage',
  },
  {
    key: 'payment',
    labelKey: 'support.quickPayment',
    titleKey: 'support.quickPaymentTitle',
    messageKey: 'support.quickPaymentMessage',
  },
  {
    key: 'subscription',
    labelKey: 'support.quickSubscription',
    titleKey: 'support.quickSubscriptionTitle',
    messageKey: 'support.quickSubscriptionMessage',
  },
] as const;

const SELF_HELP_ACTIONS = [
  {
    key: 'setup',
    titleKey: 'support.selfHelpSetupTitle',
    descriptionKey: 'support.selfHelpSetupDescription',
    icon: ShieldCheck,
    to: '/connection',
  },
  {
    key: 'payment',
    titleKey: 'support.selfHelpPaymentTitle',
    descriptionKey: 'support.selfHelpPaymentDescription',
    icon: CreditCard,
    to: '/subscription',
  },
  {
    key: 'devices',
    titleKey: 'support.selfHelpDevicesTitle',
    descriptionKey: 'support.selfHelpDevicesDescription',
    icon: Smartphone,
    to: '/ultima/devices',
  },
  {
    key: 'info',
    titleKey: 'support.selfHelpInfoTitle',
    descriptionKey: 'support.selfHelpInfoDescription',
    icon: CircleHelp,
    to: '/ultima/info',
  },
] as const;

function AttachmentPreview({
  attachment,
  onClear,
}: {
  attachment: MediaAttachment | null;
  onClear: () => void;
}) {
  if (!attachment) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-2.5">
      {attachment.preview ? (
        <img
          src={attachment.preview}
          alt={attachment.file.name}
          className="h-14 w-14 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/60">
          <ImageIcon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white/85">{attachment.file.name}</p>
        <p className="mt-0.5 text-[13px] text-white/[0.72]">
          {attachment.uploading
            ? 'Загрузка...'
            : attachment.error
              ? attachment.error
              : attachment.mediaType === 'photo'
                ? 'Скриншот прикреплен'
                : 'Файл прикреплен'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70"
        aria-label="remove-attachment"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function MessageMedia({ message }: { message: Ticket['last_message'] }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  if (!message?.has_media || !message.media_file_id) {
    return null;
  }

  const mediaUrl = ticketsApi.getMediaUrl(message.media_file_id);

  if (message.media_type === 'photo') {
    return (
      <>
        <div className="mt-2">
          {!imageLoaded && !imageError ? (
            <div className="flex h-32 w-full animate-pulse items-center justify-center rounded-xl bg-white/[0.06]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-300/40 border-t-transparent" />
            </div>
          ) : null}
          {imageError ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white/55">
              Изображение не загрузилось
            </div>
          ) : (
            <img
              src={mediaUrl}
              alt={message.media_caption || 'attachment'}
              className={`max-h-56 max-w-full cursor-pointer rounded-xl object-contain transition-opacity hover:opacity-90 ${
                imageLoaded ? '' : 'hidden'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              onClick={() => setShowFullImage(true)}
            />
          )}
          {message.media_caption ? (
            <p className="mt-1 text-[13px] text-white/50">{message.media_caption}</p>
          ) : null}
        </div>
        {showFullImage ? (
          <UltimaPortal>
            <div
              className="ultima-modal-layer ultima-modal-layer--media"
              onClick={() => setShowFullImage(false)}
              role="dialog"
              aria-modal="true"
              aria-label={message.media_caption || 'attachment'}
            >
              <button
                type="button"
                className="absolute right-[max(16px,env(safe-area-inset-right,0px))] top-[max(16px,env(safe-area-inset-top,0px))] inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
                onClick={() => setShowFullImage(false)}
                aria-label="close-image"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
              <img
                src={mediaUrl}
                alt={message.media_caption || 'attachment'}
                className="max-h-full max-w-full object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          </UltimaPortal>
        ) : null}
      </>
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[13px] text-white/75"
    >
      <ImageIcon className="h-4 w-4" />
      {message.media_caption || 'Открыть вложение'}
    </a>
  );
}

export function UltimaSupport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { openTelegramLink, openLink } = usePlatform();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [ticketListMode, setTicketListMode] = useState<TicketListMode>('active');
  const [mobileTicketsExpanded, setMobileTicketsExpanded] = useState(false);
  const [visibleRecentCount, setVisibleRecentCount] = useState(TICKETS_BATCH_SIZE);
  const [visibleOldCount, setVisibleOldCount] = useState(TICKETS_BATCH_SIZE);
  const [createAttachment, setCreateAttachment] = useState<MediaAttachment | null>(null);
  const [replyAttachment, setReplyAttachment] = useState<MediaAttachment | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const createPreviewRef = useRef<string | null>(null);
  const replyPreviewRef = useRef<string | null>(null);

  const { data: supportConfig, isLoading: configLoading } = useQuery({
    queryKey: ['support-config'],
    queryFn: infoApi.getSupportConfig,
    staleTime: 60000,
    placeholderData: (previousData) => previousData,
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketsApi.getTickets({ per_page: 20 }),
    enabled: supportConfig?.tickets_enabled === true,
    staleTime: 15000,
    placeholderData: (previousData) => previousData,
  });

  const selectedTicket =
    selectedTicketId && tickets?.items?.length
      ? tickets.items.find((ticket) => ticket.id === selectedTicketId) || null
      : null;

  const ticketBuckets = useMemo(() => {
    const items = [...(tickets?.items ?? [])];
    items.sort((a, b) => {
      const aTime = new Date(a.updated_at).getTime();
      const bTime = new Date(b.updated_at).getTime();
      return bTime - aTime;
    });

    const cutoffMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = items.filter((ticket) => {
      const updated = new Date(ticket.updated_at).getTime();
      return (
        ticket.status === 'open' ||
        ticket.status === 'answered' ||
        (ticket.status !== 'closed' && Number.isFinite(updated) && updated >= cutoffMs)
      );
    });
    const recentIds = new Set(recent.map((ticket) => ticket.id));
    const old = items.filter((ticket) => !recentIds.has(ticket.id));
    return { recent, old };
  }, [tickets?.items]);

  const ticketParam = Number(searchParams.get('ticket'));
  const requestedTicketId = Number.isInteger(ticketParam) && ticketParam > 0 ? ticketParam : null;
  useEffect(() => {
    setSelectedTicketId(requestedTicketId);
    if (!requestedTicketId) return;
    setMobileTicketsExpanded(false);
    setShowCreate(false);
  }, [requestedTicketId]);

  useEffect(() => {
    const ticketFromUrl = tickets?.items?.find((ticket) => ticket.id === requestedTicketId);
    if (ticketFromUrl) {
      const isArchiveTicket = ticketBuckets.old.some((ticket) => ticket.id === requestedTicketId);
      setTicketListMode(isArchiveTicket ? 'archive' : 'active');
    }
  }, [requestedTicketId, ticketBuckets.old, tickets?.items]);

  const replaceTicketSearchParam = useCallback(
    (ticketId: number | null) => {
      const next = new URLSearchParams(searchParams);
      if (ticketId) {
        next.set('ticket', String(ticketId));
      } else {
        next.delete('ticket');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const { data: ticketDetail, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', selectedTicketId],
    queryFn: () => ticketsApi.getTicket(selectedTicketId as number),
    enabled: Boolean(selectedTicketId),
  });

  const clearCreateAttachment = () => {
    if (createPreviewRef.current) {
      URL.revokeObjectURL(createPreviewRef.current);
      createPreviewRef.current = null;
    }
    setCreateAttachment(null);
    if (createFileInputRef.current) {
      createFileInputRef.current.value = '';
    }
  };

  const clearReplyAttachment = () => {
    if (replyPreviewRef.current) {
      URL.revokeObjectURL(replyPreviewRef.current);
      replyPreviewRef.current = null;
    }
    setReplyAttachment(null);
    if (replyFileInputRef.current) {
      replyFileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (
    file: File,
    setAttachment: (attachment: MediaAttachment | null) => void,
    previewRef: MutableRefObject<string | null>,
  ) => {
    const mediaType = ALLOWED_FILE_TYPES[file.type];
    if (!mediaType) {
      setAttachment({
        file,
        preview: '',
        uploading: false,
        mediaType: 'document',
        error: t('adminTickets.invalidFileType', {
          defaultValue: t('support.invalidFileType'),
        }),
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAttachment({
        file,
        preview: '',
        uploading: false,
        mediaType,
        error: t('adminTickets.fileTooLarge', { defaultValue: t('support.fileTooLarge') }),
      });
      return;
    }

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }
    const preview = mediaType === 'photo' ? URL.createObjectURL(file) : '';
    previewRef.current = preview || null;
    setAttachment({ file, preview, uploading: true, mediaType });

    try {
      const result = await ticketsApi.uploadMedia(file, mediaType);
      setAttachment({ file, preview, uploading: false, mediaType, fileId: result.file_id });
    } catch {
      setAttachment({
        file,
        preview,
        uploading: false,
        mediaType,
        error: t('adminTickets.uploadFailed', { defaultValue: t('support.uploadFailed') }),
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      ticketsApi.createTicket(
        newTitle.trim(),
        newMessage.trim(),
        createAttachment?.fileId
          ? {
              media_type: createAttachment.mediaType,
              media_file_id: createAttachment.fileId,
            }
          : undefined,
      ),
    onSuccess: (ticket) => {
      trackAnalyticsEvent('ultima_support_ticket_created', {
        ticket_id: ticket.id,
        has_attachment: Boolean(createAttachment?.fileId),
      });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowCreate(false);
      setNewTitle('');
      setNewMessage('');
      clearCreateAttachment();
      setTicketListMode('active');
      setSelectedTicketId(ticket.id);
      replaceTicketSearchParam(ticket.id);
    },
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      ticketsApi.addMessage(
        selectedTicketId as number,
        replyMessage.trim(),
        replyAttachment?.fileId
          ? {
              media_type: replyAttachment.mediaType,
              media_file_id: replyAttachment.fileId,
            }
          : undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setReplyMessage('');
      clearReplyAttachment();
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => ticketsApi.closeTicket(selectedTicketId as number),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.setQueryData(['ticket', selectedTicketId], updated);
    },
  });

  const quickSupportTopics = useMemo(
    () =>
      QUICK_SUPPORT_TOPICS.map((topic) => ({
        key: topic.key,
        label: t(topic.labelKey),
        title: t(topic.titleKey),
        message: t(topic.messageKey),
      })),
    [t],
  );

  const selfHelpActions = useMemo(
    () =>
      SELF_HELP_ACTIONS.map((action) => ({
        key: action.key,
        title: t(action.titleKey),
        description: t(action.descriptionKey),
        icon: action.icon,
        to: action.to,
      })),
    [t],
  );

  const applyQuickTopic = (topic: { title: string; message: string }) => {
    setNewTitle((current) => current.trim() || topic.title);
    setNewMessage((current) => current.trim() || topic.message);
  };

  const openCreateTicket = () => {
    trackAnalyticsEvent('ultima_support_new_ticket_start');
    replaceTicketSearchParam(null);
    clearCreateAttachment();
    clearReplyAttachment();
    setSelectedTicketId(null);
    setMobileTicketsExpanded(false);
    setShowCreate(true);
  };

  const supportContact = useMemo(() => {
    if (!supportConfig) {
      return null;
    }

    if (supportConfig.support_type === 'tickets') {
      return null;
    }

    if (supportConfig.support_type === 'url' && supportConfig.support_url) {
      return {
        label: t('support.openSupport'),
        action: () => openLink(supportConfig.support_url!, { tryInstantView: false }),
      };
    }
    const raw = supportConfig.support_username || '@support';
    const username = raw.startsWith('@') ? raw.slice(1) : raw;
    return {
      label: t('support.contactUs'),
      action: () => openTelegramLink(`https://t.me/${username}`),
    };
  }, [supportConfig, t, openLink, openTelegramLink]);

  const supportChannelHint = useMemo(() => {
    if (supportConfig?.support_type === 'url' && supportConfig.support_url) {
      return supportConfig.support_url;
    }

    if (
      supportConfig?.support_username &&
      (supportConfig.support_type === 'profile' || supportConfig.support_type === 'both')
    ) {
      return supportConfig.support_username.startsWith('@')
        ? supportConfig.support_username
        : `@${supportConfig.support_username}`;
    }

    return t('support.desktopChannelHint', {
      defaultValue: 'Канал поддержки доступен из этого окна.',
    });
  }, [supportConfig?.support_type, supportConfig?.support_url, supportConfig?.support_username, t]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();
  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusMeta = (status: string) => {
    if (status === 'closed') {
      return {
        label: t('support.statusClosed', { defaultValue: 'Закрыт' }),
        classes: 'bg-white/10 text-white/80',
        style: undefined as CSSProperties | undefined,
      };
    }
    if (status === 'answered') {
      return {
        label: t('support.statusAnswered', { defaultValue: 'Ответ админа' }),
        classes: 'border text-white',
        style: {
          borderColor: 'color-mix(in srgb, var(--ultima-color-surface-border) 48%, transparent)',
          background: 'color-mix(in srgb, var(--ultima-color-primary) 20%, transparent)',
          color: 'color-mix(in srgb, var(--ultima-color-ring) 86%, #fff)',
        } as CSSProperties,
      };
    }
    return {
      label: t('support.statusOpen', { defaultValue: 'Открыт' }),
      classes: 'border-sky-300/[0.35] bg-sky-400/[0.15] text-sky-100',
      style: undefined as CSSProperties | undefined,
    };
  };

  const ticketsDisabled = Boolean(supportConfig && !supportConfig.tickets_enabled);
  const showInlineSupportContact = Boolean(
    !isDesktop &&
    supportContact &&
    supportConfig?.tickets_enabled &&
    supportConfig.support_type === 'both',
  );

  useEffect(() => {
    setVisibleRecentCount(TICKETS_BATCH_SIZE);
    setVisibleOldCount(TICKETS_BATCH_SIZE);
  }, [ticketBuckets.recent.length, ticketBuckets.old.length]);

  useEffect(() => {
    if (selectedTicketId) {
      setMobileTicketsExpanded(false);
    }
  }, [selectedTicketId]);

  useEffect(
    () => () => {
      if (createPreviewRef.current) URL.revokeObjectURL(createPreviewRef.current);
      if (replyPreviewRef.current) URL.revokeObjectURL(replyPreviewRef.current);
    },
    [],
  );

  const visibleRecentTickets = useMemo(
    () => ticketBuckets.recent.slice(0, visibleRecentCount),
    [ticketBuckets.recent, visibleRecentCount],
  );

  const visibleOldTickets = useMemo(
    () => ticketBuckets.old.slice(0, visibleOldCount),
    [ticketBuckets.old, visibleOldCount],
  );

  const currentTicketBucket =
    ticketListMode === 'archive' ? ticketBuckets.old : ticketBuckets.recent;
  const visibleTicketList = ticketListMode === 'archive' ? visibleOldTickets : visibleRecentTickets;
  const visibleTicketCount = ticketListMode === 'archive' ? visibleOldCount : visibleRecentCount;

  const handleTicketListModeChange = (mode: TicketListMode) => {
    setTicketListMode(mode);
    setSelectedTicketId(null);
    clearReplyAttachment();
    replaceTicketSearchParam(null);
    setShowCreate(false);
    setMobileTicketsExpanded(true);
  };

  const handleLoadMoreTickets = () => {
    if (ticketListMode === 'archive') {
      setVisibleOldCount((prev) => Math.min(ticketBuckets.old.length, prev + TICKETS_BATCH_SIZE));
      return;
    }

    setVisibleRecentCount((prev) =>
      Math.min(ticketBuckets.recent.length, prev + TICKETS_BATCH_SIZE),
    );
  };

  const openProfileFast = () => {
    void queryClient.prefetchQuery({
      queryKey: ['subscription'],
      queryFn: subscriptionApi.getSubscription,
      staleTime: 15000,
    });
    void import('./Profile');
    navigate('/profile');
  };

  const renderTicketCard = (ticket: Ticket) => (
    <button
      key={ticket.id}
      type="button"
      onClick={() => {
        setSelectedTicketId(ticket.id);
        replaceTicketSearchParam(ticket.id);
        clearReplyAttachment();
        setMobileTicketsExpanded(false);
      }}
      className={`ultima-support-ticket-row w-full rounded-2xl px-3 py-2 text-left transition lg:px-3.5 lg:py-2.5 ${
        selectedTicketId === ticket.id
          ? 'bg-[color:color-mix(in_srgb,var(--ultima-color-primary)_16%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'bg-[color:color-mix(in_srgb,var(--ultima-color-secondary)_58%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--ultima-color-secondary)_72%,transparent)]'
      }`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[14px] font-medium leading-5 text-white/95 lg:text-[15px]">
          {ticket.title}
        </p>
        <span
          className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[13px] font-medium ${getStatusMeta(ticket.status).classes}`}
          style={getStatusMeta(ticket.status).style}
        >
          {getStatusMeta(ticket.status).label}
        </span>
      </div>
      {ticket.last_message?.message_text ? (
        <p className="line-clamp-2 break-words text-[13px] leading-snug text-white/[0.62]">
          {ticket.last_message.is_from_admin
            ? `${t('support.supportTeam', { defaultValue: 'Администратор' })}: `
            : `${t('support.you', { defaultValue: 'Вы' })}: `}
          {ticket.last_message.message_text}
        </p>
      ) : null}
      <p className="mt-1 text-[13px] text-white/[0.72]">{formatDate(ticket.updated_at)}</p>
    </button>
  );

  const renderTicketListTab = (mode: TicketListMode, label: string, count: number) => {
    const active = ticketListMode === mode;

    return (
      <button
        type="button"
        onClick={() => handleTicketListModeChange(mode)}
        className={`flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-[13px] font-medium transition lg:text-[13px] ${
          active
            ? 'border-transparent text-white'
            : 'border-white/10 bg-white/[0.04] text-white/[0.72] hover:bg-white/[0.07] hover:text-white/[0.78]'
        }`}
        style={
          active
            ? {
                background:
                  'color-mix(in srgb, var(--ultima-color-primary) 12%, var(--ultima-color-surface))',
              }
            : undefined
        }
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[13px] text-white/[0.78]">
          {count}
        </span>
      </button>
    );
  };

  const renderSelfHelpActions = (showHeading = true) => (
    <section className="ultima-support-help">
      {showHeading && (
        <header>
          <h2>{t('support.selfHelpTitle')}</h2>
          <p>{t('support.selfHelpSubtitle')}</p>
        </header>
      )}
      <div className="ultima-support-help-list">
        {selfHelpActions.map(({ key, to, title, description, icon: Icon }) => (
          <Link key={key} to={to} className="ultima-support-help-row">
            <span className="ultima-support-help-icon" aria-hidden="true">
              <Icon size={18} strokeWidth={1.8} />
            </span>
            <span className="ultima-support-help-copy">
              <strong>{title}</strong>
              <span>{description}</span>
            </span>
            <ChevronRight size={17} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );

  const bottomNav = <UltimaBottomNav active="support" onProfileClick={openProfileFast} />;
  const isTicketListEmpty = !ticketsLoading && !tickets?.items?.length;

  const supportContent = configLoading ? (
    <section
      className={`${ultimaPanelClassName} flex min-h-0 flex-1 items-center justify-center p-4`}
      style={ULTIMA_SUPPORT_SECTION_STYLE}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/[0.35] border-t-transparent" />
    </section>
  ) : ticketsDisabled ? (
    <section className={`${ultimaPanelClassName} p-4`} style={ULTIMA_SUPPORT_SECTION_STYLE}>
      <button
        type="button"
        onClick={() => supportContact?.action()}
        className="ultima-btn-pill ultima-btn-primary flex w-full items-center justify-center px-5 py-3 text-sm"
      >
        {supportContact?.label || t('support.contactUs')}
      </button>
    </section>
  ) : showCreate ? (
    <section
      className={`${ultimaPanelClassName} space-y-4 p-4 sm:p-5`}
      style={ULTIMA_SUPPORT_SECTION_STYLE}
      data-testid="ultima-ticket-create"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: 'color-mix(in srgb, var(--ultima-color-primary) 30%, transparent)',
              background: 'color-mix(in srgb, var(--ultima-color-primary) 12%, transparent)',
              color: 'color-mix(in srgb, var(--ultima-color-primary) 72%, white)',
            }}
          >
            <MessageCircleMore className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">{t('support.newTicket')}</h2>
            <p className="mt-0.5 text-xs leading-5 text-white/50">
              {t('support.messagePlaceholder')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            clearCreateAttachment();
            setShowCreate(false);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
          aria-label={t('common.cancel')}
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickSupportTopics.map((topic) => (
          <button
            key={topic.key}
            type="button"
            onClick={() => applyQuickTopic(topic)}
            className="ultima-support-topic"
          >
            {topic.label}
          </button>
        ))}
      </div>
      <label className="ultima-support-form-label">
        {t('support.subject', { defaultValue: 'Тема' })}
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder={t('support.subjectPlaceholder')}
          className="ultima-support-field"
          maxLength={255}
        />
      </label>
      <label className="ultima-support-form-label">
        {t('support.message', { defaultValue: 'Сообщение' })}
        <textarea
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          placeholder={t('support.messagePlaceholder')}
          className="ultima-support-field ultima-support-textarea"
          maxLength={4000}
        />
      </label>
      <input
        ref={createFileInputRef}
        type="file"
        accept={ACCEPT_STRING}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFileSelect(file, setCreateAttachment, createPreviewRef);
          }
        }}
      />
      <AttachmentPreview attachment={createAttachment} onClear={clearCreateAttachment} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => createFileInputRef.current?.click()}
          className="ultima-btn-pill ultima-btn-secondary flex h-11 w-11 items-center justify-center p-0 text-sm"
          aria-label="attach-screenshot"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => createMutation.mutate()}
          disabled={
            createMutation.isPending ||
            createAttachment?.uploading ||
            newTitle.trim().length < 3 ||
            newMessage.trim().length < 10
          }
          className="ultima-btn-pill ultima-btn-primary flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60"
        >
          <SendIcon className="h-4 w-4" />
          {t('support.send')}
        </button>
      </div>
      <details className="ultima-support-create-help">
        <summary>
          {t('support.selfHelpTitle')}
          <ChevronRight size={16} aria-hidden="true" />
        </summary>
        {renderSelfHelpActions(false)}
      </details>
    </section>
  ) : (
    <>
      {showInlineSupportContact && supportContact ? (
        <section
          className={`${ultimaPanelClassName} mb-3 p-3.5`}
          style={ULTIMA_SUPPORT_SECTION_STYLE}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/[0.72]">
                {t('support.desktopChannelLabel', { defaultValue: 'Канал связи' })}
              </p>
              <p className="mt-1 break-words text-[14px] font-medium text-white/[0.88]">
                {supportChannelHint}
              </p>
            </div>
            <button
              type="button"
              onClick={() => supportContact.action()}
              className="ultima-btn-pill ultima-btn-secondary px-4 py-2.5 text-sm"
            >
              {supportContact.label}
            </button>
          </div>
        </section>
      ) : null}

      <section
        className={`${ultimaPanelClassName} flex min-h-0 flex-1 flex-col gap-3 p-4 lg:p-5`}
        style={ULTIMA_SUPPORT_SECTION_STYLE}
        data-testid="ultima-ticket-workspace"
        data-empty={isTicketListEmpty}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="ultima-support-workspace-label">{t('support.yourTickets')}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {selectedTicketId && tickets?.items?.length ? (
              <button
                type="button"
                onClick={() => setMobileTicketsExpanded((prev) => !prev)}
                className="ultima-btn-pill ultima-btn-secondary px-3 py-1.5 text-[13px] leading-none lg:hidden"
              >
                {mobileTicketsExpanded
                  ? t('support.collapseTickets', { defaultValue: 'Свернуть' })
                  : t('support.showTickets', { defaultValue: 'Тикеты' })}
              </button>
            ) : null}
            <button
              type="button"
              onClick={openCreateTicket}
              className="ultima-btn-pill ultima-btn-primary min-h-11 px-3 text-[13px] lg:hidden"
            >
              {t('support.newTicket')}
            </button>
          </div>
        </div>

        {tickets?.items?.length ? (
          <div className="grid grid-cols-2 gap-2 lg:max-w-[380px]">
            {renderTicketListTab(
              'active',
              t('support.activeTickets', { defaultValue: 'Активные' }),
              ticketBuckets.recent.length,
            )}
            {renderTicketListTab(
              'archive',
              t('support.archiveTickets', { defaultValue: 'Архив' }),
              ticketBuckets.old.length,
            )}
          </div>
        ) : null}

        {isTicketListEmpty ? (
          <div className="ultima-support-empty">
            <h2>{t('support.noTickets')}</h2>
            <p>
              {t('support.webEmptyHint', {
                defaultValue: 'Создайте обращение — переписка с поддержкой появится здесь.',
              })}
            </p>
          </div>
        ) : null}

        <div className="ultima-support-columns grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-4">
          <div
            className={`${ultimaPaneClassName} ultima-scrollbar ${
              selectedTicketId && !mobileTicketsExpanded ? 'hidden lg:block' : ''
            } ${
              selectedTicketId ? MOBILE_TICKET_LIST_EXPANDED_HEIGHT : 'max-h-[58dvh]'
            } space-y-2 overflow-y-auto p-2 pr-1.5 lg:max-h-none lg:min-h-[500px] lg:p-3 lg:pr-2`}
            style={ULTIMA_SUPPORT_PANE_STYLE}
          >
            {ticketsLoading ? (
              <p className="px-2 py-1 text-[13px] text-white/70">{t('common.loading')}</p>
            ) : tickets?.items?.length ? (
              <>
                <div className="space-y-2">
                  <p className="px-1 text-[13px] uppercase tracking-[0.18em] text-white/[0.72]">
                    {ticketListMode === 'archive'
                      ? t('support.archiveTickets', { defaultValue: 'Архив' })
                      : t('support.recentTickets', { defaultValue: 'Новые и активные' })}
                  </p>
                  {visibleTicketList.length > 0 ? (
                    <>
                      {visibleTicketList.map((ticket) => renderTicketCard(ticket))}
                      {currentTicketBucket.length > visibleTicketCount ? (
                        <button
                          type="button"
                          onClick={handleLoadMoreTickets}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-left text-[13px] text-white/80 transition hover:bg-white/[0.08]"
                        >
                          {t('support.desktopShowMoreTickets', {
                            count: Math.min(
                              TICKETS_BATCH_SIZE,
                              currentTicketBucket.length - visibleTicketCount,
                            ),
                            defaultValue: `Показать еще ${Math.min(TICKETS_BATCH_SIZE, currentTicketBucket.length - visibleTicketCount)}`,
                          })}
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4 text-[13px] text-white/[0.72]">
                      {ticketListMode === 'archive'
                        ? t('support.noArchiveTickets', {
                            defaultValue: 'В архиве пока нет тикетов',
                          })
                        : t('support.noActiveTickets', { defaultValue: 'Активных тикетов нет' })}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="px-2 py-2 text-[13px] text-white/60">{t('support.noTickets')}</p>
            )}
          </div>

          <div
            className={`${ultimaPaneClassName} ultima-support-chat ${
              selectedTicketId ? 'flex' : 'hidden lg:flex'
            } min-h-[58dvh] flex-1 flex-col p-3 lg:min-h-[500px] lg:p-4`}
            style={ULTIMA_SUPPORT_PANE_STYLE}
          >
            {selectedTicketId && ticketDetail ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="ultima-support-chat-heading">
                  <h2>{ticketDetail.title || selectedTicket?.title || `#${selectedTicketId}`}</h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[13px] font-medium ${getStatusMeta(ticketDetail.status).classes}`}
                      style={getStatusMeta(ticketDetail.status).style}
                    >
                      {getStatusMeta(ticketDetail.status).label}
                    </span>
                    {ticketDetail.status !== 'closed' && (
                      <button
                        type="button"
                        onClick={() => closeMutation.mutate()}
                        disabled={closeMutation.isPending}
                        className="ultima-btn-pill ultima-btn-secondary px-2.5 py-1 text-[13px] disabled:opacity-60"
                      >
                        {t('support.closeTicket', { defaultValue: 'Закрыть' })}
                      </button>
                    )}
                  </div>
                </div>
                <div className="ultima-support-messages ultima-scrollbar min-h-[260px] flex-1 overflow-y-auto lg:max-h-[52vh] lg:min-h-0">
                  {ticketLoading ? (
                    <p className="text-[13px] text-white/60">{t('common.loading')}</p>
                  ) : (
                    ticketDetail.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="ultima-support-message"
                        data-author={msg.is_from_admin ? 'support' : 'user'}
                      >
                        <div className="ultima-support-message-meta">
                          <strong>
                            {msg.is_from_admin
                              ? t('support.supportTeam', { defaultValue: 'Администратор' })
                              : t('support.you', { defaultValue: 'Вы' })}
                          </strong>
                          <time dateTime={msg.created_at}>{formatDateTime(msg.created_at)}</time>
                        </div>
                        {msg.message_text && (
                          <p className="ultima-support-message-text">{msg.message_text}</p>
                        )}
                        <MessageMedia message={msg} />
                      </div>
                    ))
                  )}
                </div>

                {ticketDetail.status !== 'closed' && !ticketDetail.is_reply_blocked && (
                  <div className="ultima-support-composer mt-auto space-y-2">
                    <input
                      ref={replyFileInputRef}
                      type="file"
                      accept={ACCEPT_STRING}
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleFileSelect(file, setReplyAttachment, replyPreviewRef);
                        }
                      }}
                    />
                    <AttachmentPreview
                      attachment={replyAttachment}
                      onClear={clearReplyAttachment}
                    />
                    <div className="ultima-support-composer-row">
                      <button
                        type="button"
                        onClick={() => replyFileInputRef.current?.click()}
                        className="ultima-btn-pill ultima-btn-secondary rounded-xl px-3 text-sm lg:h-11"
                        aria-label="attach-reply-screenshot"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                      <input
                        value={replyMessage}
                        onChange={(event) => setReplyMessage(event.target.value)}
                        placeholder={t('support.replyPlaceholder')}
                        aria-label={t('support.replyPlaceholder')}
                        className="ultima-support-field"
                        maxLength={4000}
                      />
                      <button
                        type="button"
                        onClick={() => replyMutation.mutate()}
                        disabled={
                          replyMutation.isPending ||
                          replyAttachment?.uploading ||
                          (!replyMessage.trim() && !replyAttachment?.fileId)
                        }
                        className="ultima-btn-pill ultima-btn-primary rounded-xl px-3 text-sm disabled:opacity-60 lg:h-11 lg:px-4"
                        aria-label="send-reply"
                      >
                        <SendIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-[13px] text-white/60">
                {t('support.selectTicket', { defaultValue: 'Выберите тикет из списка' })}
              </div>
            )}
          </div>
        </div>
      </section>
      {isTicketListEmpty && renderSelfHelpActions()}
    </>
  );

  if (isDesktop) {
    return (
      <div className="ultima-shell ultima-support-page ultima-shell-wide ultima-flat-frames ultima-shell-profile-desktop ultima-shell-muted-aura">
        <div className="ultima-shell-aura" />
        <UltimaDesktopSectionLayout
          icon={<Headphones className="h-5 w-5" />}
          eyebrow={t('nav.support', { defaultValue: 'Поддержка' })}
          title={t('support.title')}
          subtitle={
            ticketsDisabled
              ? t('support.contactSupport', {
                  username: supportConfig?.support_username || '@support',
                })
              : t('support.desktopDescription', {
                  defaultValue:
                    'Здесь можно открыть новый тикет, прочитать ответы и быстро вернуться к нужному диалогу.',
                })
          }
          heroActions={
            !ticketsDisabled ? (
              <>
                <button
                  type="button"
                  onClick={openCreateTicket}
                  className="ultima-btn-pill ultima-btn-primary px-5 py-3 text-sm"
                >
                  {t('support.newTicket')}
                </button>
                {supportConfig?.support_type === 'both' && supportContact ? (
                  <button
                    type="button"
                    onClick={() => supportContact.action()}
                    className="ultima-btn-pill ultima-btn-secondary px-5 py-3 text-sm"
                  >
                    {supportContact.label}
                  </button>
                ) : null}
              </>
            ) : undefined
          }
          bottomNav={bottomNav}
          contentClassName="max-w-[1500px]"
        >
          {supportContent}
        </UltimaDesktopSectionLayout>
      </div>
    );
  }

  return (
    <div className="ultima-shell ultima-support-page ultima-shell-shared-nav-docked ultima-shell-wide ultima-flat-frames ultima-shell-muted-aura">
      <div className="ultima-shell-inner ultima-shell-mobile-docked lg:max-w-[1100px]">
        <section className="ultima-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
          <header className="mb-4">
            <h1 className="ultima-mini-screen-title">{t('support.title')}</h1>
            {ticketsDisabled && (
              <p className="mt-1.5 text-[16px] leading-tight text-white/60">
                {t('support.contactSupport', {
                  username: supportConfig?.support_username || '@support',
                })}
              </p>
            )}
          </header>

          {supportContent}
        </section>
      </div>
    </div>
  );
}
