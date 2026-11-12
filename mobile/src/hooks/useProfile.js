import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as userService from '../services/userService';
import useAsyncAction from './useAsyncAction';

// Carga el perfil cada vez que la pantalla se abre.
export default function useProfile() {
  const [profile, setProfile] = useState(null);

  const load = useCallback(async () => setProfile(await userService.getStats()), []);
  const { run, loading, error } = useAsyncAction(load);

  useFocusEffect(
    useCallback(() => {
      run();
    }, [run])
  );

  return { profile, loading, error };
}