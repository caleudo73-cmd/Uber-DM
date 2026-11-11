import { useCallback, useState } from 'react';

// Envuelve una acción async con estados loading / error.
export default function useAsyncAction(action) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        return await action(...args);
      } catch (e) {
        setError(e.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [action]
  );

  return { run, loading, error };
}
