// usePosSync.js
// Hook that simulates periodic POS sync and exposes sync status + manual trigger.

import { useState, useEffect, useRef, useCallback } from 'react';

const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000; // Auto-sync every 5 minutes

export function usePosSync() {
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'error' | 'stale'
  const [lastSynced, setLastSynced] = useState(new Date());
  const [deviceCount, setDeviceCount] = useState(3); // Simulated number of POS terminals
  const intervalRef = useRef(null);

  const doSync = useCallback(() => {
    setSyncStatus('syncing');

    // Simulate network sync with randomised success/error
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.15; // 85% success rate
        if (success) {
          setSyncStatus('synced');
          setLastSynced(new Date());
          setDeviceCount(Math.floor(Math.random() * 2) + 3); // 3–4 devices
          resolve({ ok: true });
        } else {
          setSyncStatus('error');
          resolve({ ok: false });
        }
      }, 1800);
    });
  }, []);

  // Auto-sync on interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSyncStatus('stale');
      doSync();
    }, AUTO_SYNC_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [doSync]);

  // Mark as stale after 6 minutes if no manual sync occurs
  useEffect(() => {
    const staleTimer = setTimeout(() => {
      setSyncStatus(prev => (prev === 'synced' ? 'stale' : prev));
    }, AUTO_SYNC_INTERVAL_MS + 60_000);
    return () => clearTimeout(staleTimer);
  }, [lastSynced]);

  const formatLastSynced = () => {
    const diff = Math.floor((Date.now() - lastSynced.getTime()) / 1000);
    if (diff < 60)  return 'Just now';
    if (diff < 120) return '1 min ago';
    return `${Math.floor(diff / 60)} min ago`;
  };

  return { syncStatus, lastSynced, deviceCount, doSync, formatLastSynced };
}
