import { useEffect } from 'react';

export const usePolling = (callback, intervalMs, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    
    // Initial call
    callback();

    const intervalId = setInterval(callback, intervalMs);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [callback, intervalMs, enabled]);
};
