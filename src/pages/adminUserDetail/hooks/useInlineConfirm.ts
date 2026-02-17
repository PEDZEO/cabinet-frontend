import { useCallback, useEffect, useRef, useState } from 'react';

export function useInlineConfirm(timeoutMs = 3000) {
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInlineConfirm = useCallback(
    (actionKey: string, executeFn: () => Promise<void>) => {
      if (confirmingAction === actionKey) {
        if (confirmTimerRef.current) {
          clearTimeout(confirmTimerRef.current);
        }
        setConfirmingAction(null);
        executeFn().catch(() => {
          // ignore execution error here, caller handles feedback
        });
        return;
      }

      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
      setConfirmingAction(actionKey);
      confirmTimerRef.current = setTimeout(() => setConfirmingAction(null), timeoutMs);
    },
    [confirmingAction, timeoutMs],
  );

  useEffect(
    () => () => {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
    },
    [],
  );

  return { confirmingAction, handleInlineConfirm };
}
