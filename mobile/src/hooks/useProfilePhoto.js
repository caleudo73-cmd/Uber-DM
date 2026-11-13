// AI-assisted: see docs/AI_LOG.md #8
import { useEffect, useState } from 'react';
import * as authService from '../services/authService';
import useAuth from './useAuth';

// Carga la foto de perfil desde users/{uid}/documents/profile.
export default function useProfilePhoto() {
  const { user } = useAuth();
  const [uri, setUri] = useState(null);

  useEffect(() => {
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
  }, [user?.id]);

  return uri;
}
