import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { ticketsApi } from '../../../api/tickets';
import type { AdminTicket, AdminTicketDetail } from '../../../api/admin';

interface AdminUserTicketsTabProps {
  selectedTicketId: number | null;
  selectedTicket: AdminTicketDetail | null;
  ticketDetailLoading: boolean;
  actionLoading: boolean;
  onBackToTickets: () => void;
  onTicketStatusChange: (status: string) => void;
  formatDate: (date: string | null) => string;
  replyText: string;
  setReplyText: (value: string) => void;
  onTicketReply: () => void;
  replySending: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  ticketsLoading: boolean;
  tickets: AdminTicket[];
  ticketsTotal: number;
  onOpenTicket: (ticketId: number) => void;
}

export function AdminUserTicketsTab({
  selectedTicketId,
  selectedTicket,
  ticketDetailLoading,
  actionLoading,
  onBackToTickets,
  onTicketStatusChange,
  formatDate,
  replyText,
  setReplyText,
  onTicketReply,
  replySending,
  messagesEndRef,
  ticketsLoading,
  tickets,
  ticketsTotal,
  onOpenTicket,
}: AdminUserTicketsTabProps) {
  const { t } = useTranslation();

  if (selectedTicketId) {
    if (ticketDetailLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        </div>
      );
    }

    if (!selectedTicket) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToTickets}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dark-800 transition-colors hover:bg-dark-700"
          >
            <svg
              className="h-4 w-4 text-dark-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-dark-100">
              #{selectedTicket.id} {selectedTicket.title}
            </div>
            <div className="flex items-center gap-2 text-xs text-dark-500">
              <span
                className={`rounded-full border px-1.5 py-0.5 ${
                  {
                    open: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
                    pending: 'border-warning-500/30 bg-warning-500/20 text-warning-400',
                    answered: 'border-success-500/30 bg-success-500/20 text-success-400',
                    closed: 'border-dark-500 bg-dark-600 text-dark-400',
                  }[selectedTicket.status] || 'border-dark-500 bg-dark-600 text-dark-400'
                }`}
              >
                {selectedTicket.status}
              </span>
              <span>{formatDate(selectedTicket.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['open', 'pending', 'answered', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onTicketStatusChange(status)}
              disabled={selectedTicket.status === status || actionLoading}
              className={`rounded-lg border px-2.5 py-1 text-xs transition-all ${
                selectedTicket.status === status
                  ? 'border-accent-500/50 bg-accent-500/20 text-accent-400'
                  : 'border-dark-700/50 text-dark-400 hover:border-dark-600 hover:text-dark-200'
              } disabled:opacity-50`}
            >
              {t(`admin.tickets.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
            </button>
          ))}
        </div>

        <div className="scrollbar-hide max-h-[60vh] space-y-3 overflow-y-auto rounded-xl bg-dark-800/30 p-3">
          {selectedTicket.messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-xl p-3 ${
                message.is_from_admin
                  ? 'ml-6 border border-accent-500/20 bg-accent-500/10'
                  : 'mr-6 border border-dark-700/30 bg-dark-800/50'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    message.is_from_admin ? 'text-accent-400' : 'text-dark-400'
                  }`}
                >
                  {message.is_from_admin
                    ? t('admin.tickets.adminLabel')
                    : t('admin.tickets.userLabel')}
                </span>
                <span className="text-xs text-dark-500">{formatDate(message.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-dark-200">{message.message_text}</p>
              {message.has_media && message.media_file_id && (
                <div className="mt-2">
                  {message.media_type === 'photo' ? (
                    <img
                      src={ticketsApi.getMediaUrl(message.media_file_id)}
                      alt={message.media_caption || ''}
                      className="max-h-48 max-w-full rounded-lg"
                    />
                  ) : (
                    <a
                      href={ticketsApi.getMediaUrl(message.media_file_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-dark-700 px-2 py-1 text-xs text-dark-200 hover:bg-dark-600"
                    >
                      {message.media_caption || message.media_type}
                    </a>
                  )}
                  {message.media_caption && message.media_type === 'photo' && (
                    <p className="mt-1 text-xs text-dark-400">{message.media_caption}</p>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {selectedTicket.status !== 'closed' && (
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder={t('admin.tickets.replyPlaceholder')}
              rows={2}
              className="input flex-1 resize-none"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onTicketReply();
                }
              }}
            />
            <button
              onClick={onTicketReply}
              disabled={!replyText.trim() || replySending}
              className="shrink-0 self-end rounded-lg bg-accent-500 px-4 py-2 text-sm text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
            >
              {replySending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-dark-800/50 py-12">
        <svg
          className="mb-3 h-12 w-12 text-dark-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
          />
        </svg>
        <p className="text-dark-400">{t('admin.users.detail.noTickets')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-sm text-dark-400">
        {ticketsTotal} {t('admin.users.detail.ticketsCount')}
      </div>
      <div className="space-y-2">
        {tickets.map((ticket) => {
          const statusStyles: Record<string, string> = {
            open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            pending: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
            answered: 'bg-success-500/20 text-success-400 border-success-500/30',
            closed: 'bg-dark-600 text-dark-400 border-dark-500',
          };

          return (
            <button
              key={ticket.id}
              onClick={() => onOpenTicket(ticket.id)}
              className="w-full rounded-xl bg-dark-800/50 p-4 text-left transition-colors hover:bg-dark-700/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-dark-100">
                  #{ticket.id} {ticket.title}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${
                    statusStyles[ticket.status] || statusStyles.closed
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-dark-500">
                <span>{formatDate(ticket.created_at)}</span>
                <span>
                  {ticket.messages_count} {t('admin.users.detail.messagesCount')}
                </span>
              </div>
              {ticket.last_message && (
                <div className="mt-2 truncate text-sm text-dark-400">
                  {ticket.last_message.is_from_admin ? '> ' : ''}
                  {ticket.last_message.message_text}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
