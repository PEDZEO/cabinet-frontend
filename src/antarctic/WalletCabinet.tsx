import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppWithNavigator } from '../AppWithNavigator';
import '../i18n';
import '../cabinetStyles';

const queryClient = new QueryClient();

export default function WalletCabinet() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithNavigator embedded />
    </QueryClientProvider>
  );
}
