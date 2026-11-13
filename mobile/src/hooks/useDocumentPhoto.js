// AI-assisted: see docs/AI_LOG.md #11
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as userService from '../services/userService';
import useAuth from './useAuth';

// Carga una foto de users/{uid}/documents/{key} para editarla.
// Devuelve [photo, setPhoto]: `photo` es { uri } y solo se reescribe si el
// usuario elige una imagen nueva (entonces también trae `base64`).
export default function useDocumentPhoto(key) {
  const { user } = useAuth();
  const [photo, setPhoto] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user?.id) return undefined;

      userService
        .getDocumentPhoto(user.id, key)
        .then((value) => {
          if (active && value) setPhoto(value);
        })
        .catch(() => {
          if (active) setPhoto(null);
        });

      return () => {
        active = false;
      };
    }, [user?.id, key])
  );

  return [photo, setPhoto];
}
