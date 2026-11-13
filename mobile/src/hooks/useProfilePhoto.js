// AI-assisted: see docs/AI_LOG.md #8, #11
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as authService from '../services/authService';
import useAuth from './useAuth';

// Carga la foto de perfil desde users/{uid}/documents/profile.
// Se recarga al volver a la pantalla para reflejar una foto nueva.
export default function useProfilePhoto() {
  const { user } = useAuth();
  const [uri, setUri] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user?.id) return undefined;

      authService
        .getProfilePhoto(user.id)
        .then((value) => {
          if (active) setUri(value);
        })
        .catch(() => {
          if (active) setUri(null);
        });

      return () => {
        active = false;
      };
    }, [user?.id])
  );

  return uri;
}
