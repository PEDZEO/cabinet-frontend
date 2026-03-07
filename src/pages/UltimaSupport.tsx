import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { infoApi } from '@/api/info';
import { ticketsApi } from '@/api/tickets';
import { usePlatform } from '@/platform';

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SupportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M5 17.5V12a7 7 0 1 1 14 0v5.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M8 17.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SendIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L6 12zm0 0h7.5"
    />
  </svg>
);

export function UltimaSupport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openTelegramLink, openLink } = usePlatform();

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  const { data: supportConfig, isLoading: configLoading } = useQuery({
    queryKey: ['support-config'],
    queryFn: infoApi.getSupportConfig,
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketsApi.getTickets({ per_page: 20 }),
    enabled: supportConfig?.tickets_enabled === true,
  });

  const selectedTicket =
    selectedTicketId && tickets?.items?.length
      ? tickets.items.find((ticket) => ticket.id === selectedTicketId) || null
      : null;

  const { data: ticketDetail, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', selectedTicketId],
    queryFn: () => ticketsApi.getTicket(selectedTicketId as number),
    enabled: Boolean(selectedTicketId),
  });

  const createMutation = useMutation({
    mutationFn: () => ticketsApi.createTicket(newTitle.trim(), newMessage.trim()),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowCreate(false);
      setNewTitle('');
      setNewMessage('');
      setSelectedTicketId(ticket.id);
    },
  });

  const replyMutation = useMutation({
    mutationFn: () => ticketsApi.addMessage(selectedTicketId as number, replyMessage.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] });
      setReplyMessage('');
    },
  });

  const supportContact = useMemo(() => {
    if (!supportConfig) {
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
        classes: 'border-white/20 bg-white/10 text-white/80',
      };
    }
    if (status === 'answered') {
      return {
        label: t('support.statusAnswered', { defaultValue: 'Ответ админа' }),
        classes: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100',
      };
    }
    return {
      label: t('support.statusOpen', { defaultValue: 'Открыт' }),
      classes: 'border-sky-300/35 bg-sky-400/15 text-sky-100',
    };
  };

  if (configLoading) {
    return <div className="h-[100dvh] w-full bg-transparent" />;
  }

  const ticketsDisabled = Boolean(supportConfig && !supportConfig.tickets_enabled);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col">
        <header className="mb-4">
          <h1 className="text-[42px] font-semibold leading-[0.95] text-white">
            {t('support.title')}
          </h1>
          <p className="mt-2 text-[16px] leading-tight text-white/75">
            {ticketsDisabled
              ? t('support.contactSupport', {
                  username: supportConfig?.support_username || '@support',
                })
              : t('support.yourTickets')}
          </p>
        </header>

        {ticketsDisabled ? (
          <section className="border-[#5de7c2]/18 rounded-3xl border bg-[rgba(12,45,42,0.24)] p-4 backdrop-blur-md">
            <button
              type="button"
              onClick={() => supportContact?.action()}
              className="flex w-full items-center justify-center rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-5 py-3 text-base font-medium text-white"
            >
              {supportContact?.label || t('support.contactUs')}
            </button>
          </section>
        ) : showCreate ? (
          <section className="border-[#5de7c2]/18 space-y-3 rounded-3xl border bg-[rgba(12,45,42,0.24)] p-4 backdrop-blur-md">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder={t('support.subjectPlaceholder')}
              className="w-full rounded-2xl border border-[#7beacc]/25 bg-emerald-950/30 px-4 py-3 text-white placeholder:text-emerald-100/35"
              maxLength={255}
            />
            <textarea
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder={t('support.messagePlaceholder')}
              className="min-h-[160px] w-full rounded-2xl border border-[#7beacc]/25 bg-emerald-950/30 px-4 py-3 text-white placeholder:text-emerald-100/35"
              maxLength={4000}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={
                  createMutation.isPending ||
                  newTitle.trim().length < 3 ||
                  newMessage.trim().length < 10
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                <SendIcon />
                {t('support.send')}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="border-white/18 rounded-full border bg-white/10 px-4 py-3 text-sm text-white/90"
              >
                {t('common.cancel')}
              </button>
            </div>
          </section>
        ) : (
          <section className="border-[#5de7c2]/18 flex min-h-0 flex-1 flex-col gap-3 rounded-3xl border bg-[rgba(12,45,42,0.24)] p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-sm leading-none text-white/75">{t('support.yourTickets')}</p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="border-[#8af0d2]/22 bg-emerald-900/32 rounded-full border px-3 py-1.5 text-xs leading-none text-white"
              >
                {t('support.newTicket')}
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3">
              <div className="border-[#7beacc]/16 bg-emerald-950/28 max-h-[30vh] space-y-2 overflow-y-auto rounded-2xl border p-2 pr-1.5">
                {ticketsLoading ? (
                  <p className="px-2 py-1 text-sm text-white/70">{t('common.loading')}</p>
                ) : tickets?.items?.length ? (
                  tickets.items.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                        selectedTicketId === ticket.id
                          ? 'border-emerald-300/70 bg-emerald-500/15'
                          : 'border-[#7beacc]/14 hover:border-[#8ef1d5]/28 bg-emerald-950/35'
                      }`}
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium leading-5 text-white">
                          {ticket.title}
                        </p>
                        <span
                          className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusMeta(ticket.status).classes}`}
                        >
                          {getStatusMeta(ticket.status).label}
                        </span>
                      </div>
                      {ticket.last_message?.message_text ? (
                        <p className="truncate text-xs text-white/65">
                          {ticket.last_message.is_from_admin
                            ? `${t('support.supportTeam', { defaultValue: 'Администратор' })}: `
                            : `${t('support.you', { defaultValue: 'Вы' })}: `}
                          {ticket.last_message.message_text}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-white/50">{formatDate(ticket.updated_at)}</p>
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-2 text-sm text-white/60">{t('support.noTickets')}</p>
                )}
              </div>

              <div className="border-[#7beacc]/16 bg-emerald-950/28 min-h-0 flex-1 rounded-2xl border p-3">
                {selectedTicketId && ticketDetail ? (
                  <div className="flex h-full min-h-0 flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {selectedTicket?.title}
                      </p>
                      <span
                        className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusMeta(ticketDetail.status).classes}`}
                      >
                        {getStatusMeta(ticketDetail.status).label}
                      </span>
                    </div>
                    <div className="max-h-[24vh] space-y-2 overflow-y-auto pr-1">
                      {ticketLoading ? (
                        <p className="text-xs text-white/60">{t('common.loading')}</p>
                      ) : (
                        ticketDetail.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`rounded-xl px-3 py-2 text-sm ${
                              msg.is_from_admin
                                ? 'border border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
                                : 'border-[#8cefd2]/16 bg-emerald-950/38 border text-white'
                            }`}
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-white/70">
                                {msg.is_from_admin
                                  ? t('support.supportTeam', { defaultValue: 'Администратор' })
                                  : t('support.you', { defaultValue: 'Вы' })}
                              </span>
                              <span className="text-[10px] text-white/50">
                                {formatDateTime(msg.created_at)}
                              </span>
                            </div>
                            <p>{msg.message_text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {ticketDetail.status !== 'closed' && !ticketDetail.is_reply_blocked && (
                      <div className="mt-auto flex gap-2">
                        <input
                          value={replyMessage}
                          onChange={(event) => setReplyMessage(event.target.value)}
                          placeholder={t('support.replyPlaceholder')}
                          className="w-full rounded-xl border border-[#84ebcc]/25 bg-emerald-950/35 px-3 py-2 text-sm text-white placeholder:text-emerald-100/35"
                          maxLength={4000}
                        />
                        <button
                          type="button"
                          onClick={() => replyMutation.mutate()}
                          disabled={replyMutation.isPending || !replyMessage.trim()}
                          className="rounded-xl border border-[#52ecc6]/40 bg-[#12cd97] px-3 text-white disabled:opacity-60"
                          aria-label="send-reply"
                        >
                          <SendIcon />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm text-white/60">
                    {t('support.selectTicket', { defaultValue: 'Выберите тикет из списка' })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mt-auto pt-4">
          <nav className="border-white/14 grid grid-cols-4 gap-2 rounded-full border bg-emerald-900/45 p-2 text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
              onClick={() => navigate('/')}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
              onClick={() => navigate('/connection')}
            >
              <GearIcon />
            </button>
            <button
              type="button"
              className="rounded-full p-3 hover:bg-white/5"
              onClick={() => navigate('/profile')}
            >
              <ProfileIcon />
            </button>
            <button
              type="button"
              className="rounded-full border border-[#59f0c9]/35 bg-[#14cf9a] p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
              onClick={() => navigate('/support')}
            >
              <SupportIcon />
            </button>
          </nav>
        </section>
      </div>
    </div>
  );
}
