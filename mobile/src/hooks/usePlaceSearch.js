import { useEffect, useRef, useState } from 'react';
import { searchPlaces } from '../services/placesService';

const MIN_CHARS = 3;
const DEBOUNCE_MS = 450;

// Busca lugares por nombre esperando a que dejes de escribir.
export default function usePlaceSearch(location) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current; // invalida respuestas anteriores
    const text = query.trim();

    if (text.length < MIN_CHARS) {
      setResults([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { places } = await searchPlaces(text, location);
        if (id === requestId.current) setResults(places);
      } catch (e) {
        if (id === requestId.current) {
          setResults([]);
          setError(e.message);
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, location]);

  const searched = query.trim().length >= MIN_CHARS && !loading && !error;

  return { query, setQuery, results, loading, error, empty: searched && results.length === 0 };
}