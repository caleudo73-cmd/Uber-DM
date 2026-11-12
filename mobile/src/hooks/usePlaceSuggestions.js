import { useCallback, useEffect, useState } from 'react';
import { getSuggestions } from '../services/placesService';
import useAsyncAction from './useAsyncAction';

const tag = (places, icon) => places.map((place) => ({ ...place, icon }));

// Lugares frecuentes del usuario y lugares cercanos.
export default function usePlaceSuggestions(location, enabled = true) {
  const [frequent, setFrequent] = useState([]);
  const [nearby, setNearby] = useState([]);

  const load = useCallback(async () => {
    const data = await getSuggestions(location);
    setFrequent(tag(data.frequent, 'time-outline'));
    setNearby(tag(data.nearby, 'location-outline'));
  }, [location]);
  const { run } = useAsyncAction(load);

  useEffect(() => {
    if (enabled && location) run();
  }, [enabled, location, run]);

  return { frequent, nearby, all: [...frequent, ...nearby].slice(0, 3) };
}