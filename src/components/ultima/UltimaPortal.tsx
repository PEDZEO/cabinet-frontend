import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type UltimaPortalProps = {
  children: ReactNode;
};

export function UltimaPortal({ children }: UltimaPortalProps) {
  if (typeof document === 'undefined') {
    return children;
  }

  return createPortal(children, document.body);
}
