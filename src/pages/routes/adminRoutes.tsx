/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { AdminRoute, LazyPage } from '../../components/routing/RouteShells';
import type { RouteConfig } from './types';

const AdminPanel = lazy(() => import('../AdminPanel'));
const AdminTickets = lazy(() => import('../AdminTickets'));
const AdminAccountLinking = lazy(() => import('../AdminAccountLinking'));
const AdminTicketSettings = lazy(() => import('../AdminTicketSettings'));
const AdminSettings = lazy(() => import('../AdminSettings'));
const AdminApps = lazy(() => import('../AdminApps'));
const AdminWheel = lazy(() => import('../AdminWheel'));
const AdminTariffs = lazy(() => import('../AdminTariffs'));
const AdminTariffCreate = lazy(() => import('../AdminTariffCreate'));
const AdminServers = lazy(() => import('../AdminServers'));
const AdminServerEdit = lazy(() => import('../AdminServerEdit'));
const AdminDashboard = lazy(() => import('../AdminDashboard'));
const AdminBanSystem = lazy(() => import('../AdminBanSystem'));
const AdminBroadcasts = lazy(() => import('../AdminBroadcasts'));
const AdminBroadcastCreate = lazy(() => import('../AdminBroadcastCreate'));
const AdminPromocodes = lazy(() => import('../AdminPromocodes'));
const AdminPromocodeCreate = lazy(() => import('../AdminPromocodeCreate'));
const AdminPromocodeStats = lazy(() => import('../AdminPromocodeStats'));
const AdminPromoGroups = lazy(() => import('../AdminPromoGroups'));
const AdminPromoGroupCreate = lazy(() => import('../AdminPromoGroupCreate'));
const AdminCampaigns = lazy(() => import('../AdminCampaigns'));
const AdminCampaignCreate = lazy(() => import('../AdminCampaignCreate'));
const AdminCampaignStats = lazy(() => import('../AdminCampaignStats'));
const AdminCampaignEdit = lazy(() => import('../AdminCampaignEdit'));
const AdminPartners = lazy(() => import('../AdminPartners'));
const AdminPartnerSettings = lazy(() => import('../AdminPartnerSettings'));
const AdminPartnerDetail = lazy(() => import('../AdminPartnerDetail'));
const AdminApplicationReview = lazy(() => import('../AdminApplicationReview'));
const AdminPartnerCommission = lazy(() => import('../AdminPartnerCommission'));
const AdminPartnerRevoke = lazy(() => import('../AdminPartnerRevoke'));
const AdminPartnerCampaignAssign = lazy(() => import('../AdminPartnerCampaignAssign'));
const AdminWithdrawals = lazy(() => import('../AdminWithdrawals'));
const AdminWithdrawalDetail = lazy(() => import('../AdminWithdrawalDetail'));
const AdminWithdrawalReject = lazy(() => import('../AdminWithdrawalReject'));
const AdminUsers = lazy(() => import('../AdminUsers'));
const AdminPayments = lazy(() => import('../AdminPayments'));
const AdminPaymentMethods = lazy(() => import('../AdminPaymentMethods'));
const AdminPaymentMethodEdit = lazy(() => import('../AdminPaymentMethodEdit'));
const AdminPromoOffers = lazy(() => import('../AdminPromoOffers'));
const AdminPromoOfferTemplateEdit = lazy(() => import('../AdminPromoOfferTemplateEdit'));
const AdminPromoOfferSend = lazy(() => import('../AdminPromoOfferSend'));
const AdminRemnawave = lazy(() => import('../AdminRemnawave'));
const AdminRemnawaveSquadDetail = lazy(() => import('../AdminRemnawaveSquadDetail'));
const AdminEmailTemplates = lazy(() => import('../AdminEmailTemplates'));
const AdminTrafficUsage = lazy(() => import('../AdminTrafficUsage'));
const AdminUpdates = lazy(() => import('../AdminUpdates'));
const AdminUserDetail = lazy(() => import('../AdminUserDetail'));
const AdminBroadcastDetail = lazy(() => import('../AdminBroadcastDetail'));
const AdminPinnedMessages = lazy(() => import('../AdminPinnedMessages'));
const AdminPinnedMessageCreate = lazy(() => import('../AdminPinnedMessageCreate'));
const AdminMainMenuButtons = lazy(() => import('../AdminMainMenuButtons'));
const AdminChannelSubscriptions = lazy(() => import('../AdminChannelSubscriptions'));
const AdminEmailTemplatePreview = lazy(() => import('../AdminEmailTemplatePreview'));
const AdminBalancer = lazy(() => import('../AdminBalancer'));

const withAdminLayout = (element: React.ReactNode) => (
  <AdminRoute>
    <LazyPage>{element}</LazyPage>
  </AdminRoute>
);

export const adminRoutes: RouteConfig[] = [
  { path: '/admin', element: withAdminLayout(<AdminPanel />) },
  { path: '/admin/tickets', element: withAdminLayout(<AdminTickets />) },
  { path: '/admin/account-linking', element: withAdminLayout(<AdminAccountLinking />) },
  { path: '/admin/tickets/settings', element: withAdminLayout(<AdminTicketSettings />) },
  { path: '/admin/settings', element: withAdminLayout(<AdminSettings />) },
  { path: '/admin/apps', element: withAdminLayout(<AdminApps />) },
  { path: '/admin/wheel', element: withAdminLayout(<AdminWheel />) },
  { path: '/admin/tariffs', element: withAdminLayout(<AdminTariffs />) },
  { path: '/admin/tariffs/create', element: withAdminLayout(<AdminTariffCreate />) },
  { path: '/admin/tariffs/:id/edit', element: withAdminLayout(<AdminTariffCreate />) },
  { path: '/admin/servers', element: withAdminLayout(<AdminServers />) },
  { path: '/admin/servers/:id/edit', element: withAdminLayout(<AdminServerEdit />) },
  { path: '/admin/dashboard', element: withAdminLayout(<AdminDashboard />) },
  { path: '/admin/ban-system', element: withAdminLayout(<AdminBanSystem />) },
  { path: '/admin/broadcasts', element: withAdminLayout(<AdminBroadcasts />) },
  { path: '/admin/broadcasts/create', element: withAdminLayout(<AdminBroadcastCreate />) },
  { path: '/admin/broadcasts/:id', element: withAdminLayout(<AdminBroadcastDetail />) },
  { path: '/admin/promocodes', element: withAdminLayout(<AdminPromocodes />) },
  { path: '/admin/promocodes/create', element: withAdminLayout(<AdminPromocodeCreate />) },
  { path: '/admin/promocodes/:id/edit', element: withAdminLayout(<AdminPromocodeCreate />) },
  { path: '/admin/promocodes/:id/stats', element: withAdminLayout(<AdminPromocodeStats />) },
  { path: '/admin/promo-groups', element: withAdminLayout(<AdminPromoGroups />) },
  { path: '/admin/promo-groups/create', element: withAdminLayout(<AdminPromoGroupCreate />) },
  { path: '/admin/promo-groups/:id/edit', element: withAdminLayout(<AdminPromoGroupCreate />) },
  { path: '/admin/campaigns', element: withAdminLayout(<AdminCampaigns />) },
  { path: '/admin/campaigns/create', element: withAdminLayout(<AdminCampaignCreate />) },
  { path: '/admin/campaigns/:id/stats', element: withAdminLayout(<AdminCampaignStats />) },
  { path: '/admin/campaigns/:id/edit', element: withAdminLayout(<AdminCampaignEdit />) },
  { path: '/admin/partners', element: withAdminLayout(<AdminPartners />) },
  { path: '/admin/partners/settings', element: withAdminLayout(<AdminPartnerSettings />) },
  {
    path: '/admin/partners/applications/:id/review',
    element: withAdminLayout(<AdminApplicationReview />),
  },
  {
    path: '/admin/partners/:userId/commission',
    element: withAdminLayout(<AdminPartnerCommission />),
  },
  { path: '/admin/partners/:userId/revoke', element: withAdminLayout(<AdminPartnerRevoke />) },
  {
    path: '/admin/partners/:userId/campaigns/assign',
    element: withAdminLayout(<AdminPartnerCampaignAssign />),
  },
  { path: '/admin/partners/:userId', element: withAdminLayout(<AdminPartnerDetail />) },
  { path: '/admin/withdrawals', element: withAdminLayout(<AdminWithdrawals />) },
  { path: '/admin/withdrawals/:id/reject', element: withAdminLayout(<AdminWithdrawalReject />) },
  { path: '/admin/withdrawals/:id', element: withAdminLayout(<AdminWithdrawalDetail />) },
  { path: '/admin/users', element: withAdminLayout(<AdminUsers />) },
  { path: '/admin/users/:id', element: withAdminLayout(<AdminUserDetail />) },
  { path: '/admin/payments', element: withAdminLayout(<AdminPayments />) },
  { path: '/admin/traffic-usage', element: withAdminLayout(<AdminTrafficUsage />) },
  { path: '/admin/payment-methods', element: withAdminLayout(<AdminPaymentMethods />) },
  {
    path: '/admin/payment-methods/:methodId/edit',
    element: withAdminLayout(<AdminPaymentMethodEdit />),
  },
  { path: '/admin/promo-offers', element: withAdminLayout(<AdminPromoOffers />) },
  {
    path: '/admin/promo-offers/templates/:id/edit',
    element: withAdminLayout(<AdminPromoOfferTemplateEdit />),
  },
  { path: '/admin/promo-offers/send', element: withAdminLayout(<AdminPromoOfferSend />) },
  { path: '/admin/remnawave', element: withAdminLayout(<AdminRemnawave />) },
  {
    path: '/admin/remnawave/squads/:uuid',
    element: withAdminLayout(<AdminRemnawaveSquadDetail />),
  },
  { path: '/admin/email-templates', element: withAdminLayout(<AdminEmailTemplates />) },
  {
    path: '/admin/email-templates/preview/:type/:lang',
    element: withAdminLayout(<AdminEmailTemplatePreview />),
  },
  { path: '/admin/updates', element: withAdminLayout(<AdminUpdates />) },
  { path: '/admin/pinned-messages', element: withAdminLayout(<AdminPinnedMessages />) },
  { path: '/admin/pinned-messages/create', element: withAdminLayout(<AdminPinnedMessageCreate />) },
  {
    path: '/admin/pinned-messages/:id/edit',
    element: withAdminLayout(<AdminPinnedMessageCreate />),
  },
  { path: '/admin/main-menu-buttons', element: withAdminLayout(<AdminMainMenuButtons />) },
  { path: '/admin/channel-subscriptions', element: withAdminLayout(<AdminChannelSubscriptions />) },
  { path: '/admin/balancer', element: withAdminLayout(<AdminBalancer />) },
];
