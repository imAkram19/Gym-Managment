import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  getBiometricDevices,
  getDeduplicatedDevices,
  formatLastPing,
} from '../lib/api/biometrics';
import type { BiometricDevice } from '../types';

export function useBiometricDeviceStatus() {
  const [rawDevices, setRawDevices] = useState<BiometricDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setTick] = useState(0);

  const fetchDevices = useCallback(async () => {
    try {
      const data = await getBiometricDevices();
      setRawDevices(data);
    } catch (err) {
      console.error('Failed to fetch biometric devices:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1. Initial fetch & 60-second periodic polling/staleness tick
  useEffect(() => {
    fetchDevices();

    // 60-second polling fallback & recalculates staleness and "Xm ago"
    const interval = setInterval(() => {
      fetchDevices();
      setTick((t) => t + 1);
    }, 60_000);

    return () => clearInterval(interval);
  }, [fetchDevices]);

  // 2. Real-time Postgres changes subscription on biometric_devices table
  useEffect(() => {
    const channel = supabase
      .channel('biometric_devices_live_status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'biometric_devices' },
        () => {
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDevices]);

  // Deduplicate and calculate online/offline metrics uniformly
  const { uniqueDevices, primaryDevice, isPrimaryOnline, offlineCount } =
    useMemo(() => getDeduplicatedDevices(rawDevices), [rawDevices]);

  return {
    devices: uniqueDevices,
    primaryDevice,
    isPrimaryOnline,
    offlineCount,
    isLoading,
    refetch: fetchDevices,
    formatLastPing,
  };
}
