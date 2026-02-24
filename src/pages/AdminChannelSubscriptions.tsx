import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useHaptic, useNotify } from '../platform';
import {
  adminChannelsApi,
  type RequiredChannel,
  type CreateChannelRequest,
  type UpdateChannelRequest,
} from '../api/adminChannels';
import { AdminBackButton } from '../components/admin';

// Icons
const ChannelIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
    />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const XIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
    />
  </svg>
);

const LinkIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.239a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.5 8.688"
    />
  </svg>
);

// Channel card component
function ChannelCard({
  channel,
  onToggle,
  onDelete,
  onEdit,
}: {
  channel: RequiredChannel;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (channel: RequiredChannel) => void;
}) {
  const { t } = useTranslation();

  const displayName = channel.title || channel.channel_id;
  const hasLink = !!channel.channel_link;

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        channel.is_active
          ? 'border-success-500/50 bg-success-500/5'
          : 'border-dark-700 bg-dark-800/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Status + sort order */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                channel.is_active
                  ? 'bg-success-500/20 text-success-400'
                  : 'bg-dark-500/20 text-dark-400'
              }`}
            >
              {channel.is_active
                ? t('admin.channelSubscriptions.enabled')
                : t('admin.channelSubscriptions.disabled')}
            </span>
            <span className="text-xs text-dark-400">#{channel.id}</span>
            <span className="text-xs text-dark-500">
              {t('admin.channelSubscriptions.sortOrder')}: {channel.sort_order}
            </span>
          </div>

          {/* Title / channel_id */}
          <p className="text-sm font-medium text-dark-100">{displayName}</p>

          {/* Channel ID (if title exists, show ID separately) */}
          {channel.title && <p className="mt-0.5 text-xs text-dark-400">{channel.channel_id}</p>}

          {/* Link */}
          {hasLink && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-accent-400">
              <LinkIcon />
              <a
                href={channel.channel_link!}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:underline"
              >
                {channel.channel_link}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-dark-700/50 pt-3">
        <button
          onClick={() => onEdit(channel)}
          className="flex items-center gap-1.5 rounded-lg bg-accent-500/20 px-3 py-1.5 text-xs text-accent-400 transition-colors hover:bg-accent-500/30"
        >
          <EditIcon />
          {t('admin.channelSubscriptions.edit')}
        </button>

        {channel.is_active ? (
          <button
            onClick={() => onToggle(channel.id)}
            className="flex items-center gap-1.5 rounded-lg bg-warning-500/20 px-3 py-1.5 text-xs text-warning-400 transition-colors hover:bg-warning-500/30"
          >
            <XIcon />
            {t('admin.channelSubscriptions.disable')}
          </button>
        ) : (
          <button
            onClick={() => onToggle(channel.id)}
            className="flex items-center gap-1.5 rounded-lg bg-success-500/20 px-3 py-1.5 text-xs text-success-400 transition-colors hover:bg-success-500/30"
          >
            <CheckIcon />
            {t('admin.channelSubscriptions.enable')}
          </button>
        )}

        <button
          onClick={() => onDelete(channel.id)}
          className="flex items-center gap-1.5 rounded-lg bg-error-500/20 px-3 py-1.5 text-xs text-error-400 transition-colors hover:bg-error-500/30"
        >
          <TrashIcon />
          {t('admin.channelSubscriptions.delete')}
        </button>
      </div>
    </div>
  );
}

// Shared form fields component
function ChannelFormFields({
  channelId,
  setChannelId,
  title,
  setTitle,
  channelLink,
  setChannelLink,
  sortOrder,
  setSortOrder,
  showChannelId,
  showSortOrder,
}: {
  channelId: string;
  setChannelId: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  channelLink: string;
  setChannelLink: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  showChannelId: boolean;
  showSortOrder: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      {showChannelId && (
        <div>
          <label className="mb-1 block text-xs font-medium text-dark-300">
            {t('admin.channelSubscriptions.form.channelId')} *
          </label>
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder={t('admin.channelSubscriptions.form.channelIdHint')}
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 placeholder-dark-500 outline-none transition-colors focus:border-accent-500"
            autoFocus
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-dark-300">
          {t('admin.channelSubscriptions.form.title')}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('admin.channelSubscriptions.form.title')}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 placeholder-dark-500 outline-none transition-colors focus:border-accent-500"
          autoFocus={!showChannelId}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-dark-300">
          {t('admin.channelSubscriptions.form.channelLink')}
        </label>
        <input
          type="text"
          value={channelLink}
          onChange={(e) => setChannelLink(e.target.value)}
          placeholder={t('admin.channelSubscriptions.form.channelLinkHint')}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 placeholder-dark-500 outline-none transition-colors focus:border-accent-500"
        />
      </div>

      {showSortOrder && (
        <div>
          <label className="mb-1 block text-xs font-medium text-dark-300">
            {t('admin.channelSubscriptions.sortOrder')}
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-100 placeholder-dark-500 outline-none transition-colors focus:border-accent-500"
          />
        </div>
      )}
    </>
  );
}

// Add channel form component
function AddChannelForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: CreateChannelRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const [channelId, setChannelId] = useState('');
  const [channelLink, setChannelLink] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (!channelId.trim()) return;
    onSubmit({
      channel_id: channelId.trim(),
      channel_link: channelLink.trim() || undefined,
      title: title.trim() || undefined,
    });
  };

  return (
    <div className="rounded-xl border border-accent-500/30 bg-dark-800/50 p-4">
      <div className="space-y-3">
        <ChannelFormFields
          channelId={channelId}
          setChannelId={setChannelId}
          title={title}
          setTitle={setTitle}
          channelLink={channelLink}
          setChannelLink={setChannelLink}
          sortOrder=""
          setSortOrder={() => {}}
          showChannelId
          showSortOrder={false}
        />

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={!channelId.trim() || isLoading}
            className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckIcon />
            {t('admin.channelSubscriptions.form.submit')}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-dark-700 px-4 py-2 text-sm text-dark-300 transition-colors hover:bg-dark-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XIcon />
            {t('admin.channelSubscriptions.form.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit channel form component
function EditChannelForm({
  channel,
  onSubmit,
  onCancel,
  isLoading,
}: {
  channel: RequiredChannel;
  onSubmit: (id: number, data: UpdateChannelRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(channel.title ?? '');
  const [channelLink, setChannelLink] = useState(channel.channel_link ?? '');
  const [sortOrder, setSortOrder] = useState(String(channel.sort_order));

  const handleSubmit = () => {
    const updates: UpdateChannelRequest = {};
    const newTitle = title.trim() || undefined;
    const newLink = channelLink.trim() || undefined;
    const newSort = parseInt(sortOrder, 10);

    if (newTitle !== (channel.title ?? undefined))
      updates.title = newTitle ?? (null as unknown as string);
    if (newLink !== (channel.channel_link ?? undefined))
      updates.channel_link = newLink ?? (null as unknown as string);
    if (!isNaN(newSort) && newSort !== channel.sort_order) updates.sort_order = newSort;

    onSubmit(channel.id, updates);
  };

  return (
    <div className="rounded-xl border border-accent-500/30 bg-dark-800/50 p-4">
      <p className="mb-3 text-xs text-dark-400">
        {t('admin.channelSubscriptions.editing')}:{' '}
        <code className="text-dark-300">{channel.channel_id}</code>
      </p>
      <div className="space-y-3">
        <ChannelFormFields
          channelId=""
          setChannelId={() => {}}
          title={title}
          setTitle={setTitle}
          channelLink={channelLink}
          setChannelLink={setChannelLink}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          showChannelId={false}
          showSortOrder
        />

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckIcon />
            {t('admin.channelSubscriptions.form.save')}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-dark-700 px-4 py-2 text-sm text-dark-300 transition-colors hover:bg-dark-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XIcon />
            {t('admin.channelSubscriptions.form.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main component
export default function AdminChannelSubscriptions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const haptic = useHaptic();
  const notify = useNotify();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<RequiredChannel | null>(null);

  // Fetch channels
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-channels'],
    queryFn: adminChannelsApi.list,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminChannelsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-channels'] });
      haptic.impact('light');
    },
    onError: () => {
      haptic.notification('error');
      notify.error(t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminChannelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-channels'] });
      haptic.impact('medium');
    },
    onError: () => {
      haptic.notification('error');
      notify.error(t('common.error'));
    },
  });

  const createMutation = useMutation({
    mutationFn: (req: CreateChannelRequest) => adminChannelsApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-channels'] });
      setShowAddForm(false);
      haptic.impact('light');
    },
    onError: () => {
      haptic.notification('error');
      notify.error(t('common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateChannelRequest }) =>
      adminChannelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-channels'] });
      setEditingChannel(null);
      haptic.impact('light');
    },
    onError: () => {
      haptic.notification('error');
      notify.error(t('common.error'));
    },
  });

  const handleToggle = (id: number) => {
    toggleMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    if (window.confirm(t('admin.channelSubscriptions.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = (data: CreateChannelRequest) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (id: number, data: UpdateChannelRequest) => {
    updateMutation.mutate({ id, data });
  };

  const handleEdit = (channel: RequiredChannel) => {
    setEditingChannel(channel);
    setShowAddForm(false);
  };

  const channels = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AdminBackButton />
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent-500/20 p-2 text-accent-400">
              <ChannelIcon />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-100">
                {t('admin.channelSubscriptions.title')}
              </h1>
              <p className="text-sm text-dark-400">{t('admin.channelSubscriptions.subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            aria-label={t('common.refresh')}
            className="rounded-lg bg-dark-800 p-2 text-dark-400 transition-colors hover:text-dark-100"
          >
            <RefreshIcon />
          </button>
          {!showAddForm && !editingChannel && (
            <button
              onClick={() => setShowAddForm(true)}
              aria-label={t('admin.channelSubscriptions.addChannel')}
              className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-white transition-colors hover:bg-accent-600"
            >
              <PlusIcon />
              <span className="hidden sm:inline">{t('admin.channelSubscriptions.addChannel')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <AddChannelForm
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Edit form */}
      {editingChannel && (
        <EditChannelForm
          channel={editingChannel}
          onSubmit={handleUpdate}
          onCancel={() => setEditingChannel(null)}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Channel list */}
      {isLoading ? (
        <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-8 text-center text-dark-400">
          <div className="mx-auto mb-2 w-fit animate-spin">
            <RefreshIcon />
          </div>
          <p>{t('common.loading')}</p>
        </div>
      ) : channels.length === 0 ? (
        <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-8 text-center text-dark-400">
          <div className="mx-auto mb-2 w-fit">
            <ChannelIcon />
          </div>
          <p>{t('admin.channelSubscriptions.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((channel: RequiredChannel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
