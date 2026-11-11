import { useEffect, useRef } from 'react';
import { POLLING_INTERVAL_MS } from '../config/constants';

// Ejecuta `callback` ahora y luego cada intervalo, mientras `enabled` sea true.
export default function usePolling(callback, enabled = true) {
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;
    saved.current();
    const id = setInterval(() => saved.current(), POLLING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled]);
}
