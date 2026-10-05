import { useState, useEffect } from 'react';
import { notify } from '../lib/toast';

/**
 * useNetworkStatus — Monitors browser online/offline status
 * Emits toasts and provides state for offline banner alerts.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notify.deviceOnline();
    };

    const handleOffline = () => {
      setIsOnline(false);
      notify.deviceOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
