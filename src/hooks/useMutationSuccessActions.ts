import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { type QueryKey, useQueryClient } from '@tanstack/react-query';

interface MutationSuccessActions {
  invalidateKeys: QueryKey[];
  navigateTo?: string;
}

export function useMutationSuccessActions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useCallback(
    async ({ invalidateKeys, navigateTo }: MutationSuccessActions) => {
      await Promise.all(
        invalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );

      if (navigateTo) {
        navigate(navigateTo);
      }
    },
    [navigate, queryClient],
  );
}
