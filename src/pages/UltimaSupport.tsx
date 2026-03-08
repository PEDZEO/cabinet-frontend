import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { infoApi } from '@/api/info';
import { ticketsApi } from '@/api/tickets';
import { subscriptionApi } from '@/api/subscription';
import { usePlatform } from '@/platform';
import { UltimaBottomNav } from '@/components/ultima/UltimaBottomNav';
import type { Ticket } from '@/types';

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
  const [showOldTickets, setShowOldTickets] = useState(false);

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
        (Number.isFinite(updated) && updated >= cutoffMs)
      );
    });
    const old = items.filter((ticket) => !recent.some((item) => item.id === ticket.id));
    return { recent, old };
  }, [tickets?.items]);

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
        classes: 'bg-white/10 text-white/80',
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

  const ticketsDisabled = Boolean(supportConfig && !supportConfig.tickets_enabled);

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
      onClick={() => setSelectedTicketId(ticket.id)}
      className={`w-full rounded-2xl px-3 py-2 text-left transition lg:px-3.5 lg:py-2.5 ${
        selectedTicketId === ticket.id
          ? 'bg-emerald-500/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'bg-emerald-950/36 hover:bg-emerald-900/30'
      }`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[14px] font-medium leading-5 text-white/95 lg:text-[15px]">
          {ticket.title}
        </p>
        <span
          className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusMeta(ticket.status).classes}`}
        >
          {getStatusMeta(ticket.status).label}
        </span>
      </div>
      {ticket.last_message?.message_text ? (
        <p className="text-white/62 truncate text-[12px]">
          {ticket.last_message.is_from_admin
            ? `${t('support.supportTeam', { defaultValue: 'Администратор' })}: `
            : `${t('support.you', { defaultValue: 'Вы' })}: `}
          {ticket.last_message.message_text}
        </p>
      ) : null}
      <p className="text-white/48 mt-1 text-[11px]">{formatDate(ticket.updated_at)}</p>
    </button>
  );

  return (
    <div className="ultima-shell ultima-flat-frames">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_70%_at_50%_45%,rgba(33,208,154,0.14),rgba(7,20,46,0.02)_62%,rgba(7,20,46,0)_100%)]" />
      <div className="ultima-shell-inner lg:max-w-[980px]">
        <header className="mb-4">
          <h1 className="text-[clamp(34px,9vw,46px)] font-semibold leading-[0.92] tracking-[-0.01em] text-white">
            {t('support.title')}
          </h1>
          <p className="mt-1.5 text-[16px] leading-tight text-white/60">
            {ticketsDisabled
              ? t('support.contactSupport', {
                  username: supportConfig?.support_username || '@support',
                })
              : t('support.yourTickets')}
          </p>
        </header>

        {configLoading ? (
          <section className="flex min-h-0 flex-1 items-center justify-center rounded-3xl bg-[rgba(12,45,42,0.2)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/35 border-t-transparent" />
          </section>
        ) : ticketsDisabled ? (
          <section className="rounded-3xl bg-[rgba(12,45,42,0.2)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => supportContact?.action()}
              className="flex w-full items-center justify-center rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-5 py-3 text-sm font-medium text-white"
            >
              {supportContact?.label || t('support.contactUs')}
            </button>
          </section>
        ) : showCreate ? (
          <section className="space-y-3 rounded-3xl bg-[rgba(12,45,42,0.2)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder={t('support.subjectPlaceholder')}
              className="w-full rounded-2xl bg-emerald-950/30 px-4 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] placeholder:text-emerald-100/35"
              maxLength={255}
            />
            <textarea
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder={t('support.messagePlaceholder')}
              className="min-h-[160px] w-full rounded-2xl bg-emerald-950/30 px-4 py-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] placeholder:text-emerald-100/35"
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
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#52ecc6]/40 bg-[#12cd97] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                <SendIcon />
                {t('support.send')}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-full bg-white/10 px-4 py-2.5 text-sm text-white/90"
              >
                {t('common.cancel')}
              </button>
            </div>
          </section>
        ) : (
          <section className="flex min-h-0 flex-1 flex-col gap-3 rounded-3xl bg-[rgba(12,45,42,0.2)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md lg:rounded-[28px] lg:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] leading-none text-white/70">{t('support.yourTickets')}</p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="bg-emerald-900/42 rounded-full px-3 py-1.5 text-[12px] leading-none text-white/90"
              >
                {t('support.newTicket')}
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[330px_minmax(0,1fr)] lg:gap-4">
              <div className="bg-emerald-950/26 max-h-[30vh] space-y-2 overflow-y-auto rounded-2xl p-2 pr-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:max-h-none lg:min-h-[470px] lg:p-3 lg:pr-2">
                {ticketsLoading ? (
                  <p className="px-2 py-1 text-[13px] text-white/70">{t('common.loading')}</p>
                ) : tickets?.items?.length ? (
                  <>
                    {ticketBuckets.recent.length > 0 && (
                      <div className="space-y-2">
                        <p className="px-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                          {t('support.recentTickets', { defaultValue: 'Новые и активные' })}
                        </p>
                        {ticketBuckets.recent.map((ticket) => renderTicketCard(ticket))}
                      </div>
                    )}

                    {ticketBuckets.old.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowOldTickets((prev) => !prev)}
                          className="w-full rounded-xl bg-emerald-900/25 px-2.5 py-2 text-left text-[12px] text-white/80"
                        >
                          {showOldTickets
                            ? t('support.hideOldTickets', {
                                defaultValue: 'Скрыть старые тикеты',
                              })
                            : t('support.showOldTickets', {
                                defaultValue: 'Показать старые тикеты',
                              })}{' '}
                          ({ticketBuckets.old.length})
                        </button>
                        {showOldTickets && (
                          <div className="space-y-2">
                            {ticketBuckets.old.map((ticket) => renderTicketCard(ticket))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="px-2 py-2 text-[13px] text-white/60">{t('support.noTickets')}</p>
                )}
              </div>

              <div className="bg-emerald-950/26 min-h-0 flex-1 rounded-2xl p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:min-h-[470px] lg:p-4">
                {selectedTicketId && ticketDetail ? (
                  <div className="flex h-full min-h-0 flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-medium text-white/95 lg:text-[16px]">
                        {selectedTicket?.title}
                      </p>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusMeta(ticketDetail.status).classes}`}
                      >
                        {getStatusMeta(ticketDetail.status).label}
                      </span>
                    </div>
                    <div className="max-h-[24vh] space-y-2 overflow-y-auto pr-1 lg:max-h-[52vh] lg:space-y-2.5">
                      {ticketLoading ? (
                        <p className="text-[12px] text-white/60">{t('common.loading')}</p>
                      ) : (
                        ticketDetail.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`rounded-xl px-3 py-2 text-sm lg:px-3.5 lg:py-2.5 ${
                              msg.is_from_admin
                                ? 'bg-emerald-500/10 text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                                : 'bg-emerald-950/35 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                            }`}
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-white/68 text-[11px] font-medium">
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
                      <div className="mt-auto flex gap-2 lg:gap-2.5">
                        <input
                          value={replyMessage}
                          onChange={(event) => setReplyMessage(event.target.value)}
                          placeholder={t('support.replyPlaceholder')}
                          className="w-full rounded-xl bg-emerald-950/35 px-3 py-2 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] placeholder:text-emerald-100/35 lg:h-11 lg:text-[14px]"
                          maxLength={4000}
                        />
                        <button
                          type="button"
                          onClick={() => replyMutation.mutate()}
                          disabled={replyMutation.isPending || !replyMessage.trim()}
                          className="rounded-xl border border-[#52ecc6]/40 bg-[#12cd97] px-3 text-white disabled:opacity-60 lg:h-11 lg:px-4"
                          aria-label="send-reply"
                        >
                          <SendIcon />
                        </button>
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
        )}

        <section className="mt-auto pt-4">
          <UltimaBottomNav active="support" onProfileClick={openProfileFast} />
        </section>
      </div>
    </div>
  );
}
