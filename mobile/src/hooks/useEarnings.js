// AI-assisted: see docs/AI_LOG.md #10
import { useMemo } from 'react';
import { summarizeBalance, summarizeEarnings } from '../utils/earnings';
import useRideHistory from './useRideHistory';

// Totales de ganancias y saldo del conductor para el período elegido.
// La especificación pide un hook llamado useEarnings; concentra aquí el
// useMemo que antes vivía en la pantalla.
export default function useEarnings(period) {
  const { rides, loading, error } = useRideHistory();

  const totals = useMemo(() => summarizeEarnings(rides, period), [rides, period]);
  const balance = useMemo(() => summarizeBalance(rides), [rides]);

  return { rides, loading, error, totals, balance };
}
