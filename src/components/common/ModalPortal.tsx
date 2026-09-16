import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

/**
 * ModalPortal guarantees that dialogs and overlays are rendered directly into
 * document.body, detached from any ancestor transform, filter, or scrolling contexts.
 * This ensures the modal calculates its center against the active viewport display,
 * rather than the full document height.
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({ children, isOpen = true }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(children, document.body);
};
