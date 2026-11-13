// AI-assisted: see docs/AI_LOG.md #11
import { useCallback, useState } from 'react';
import useAsyncAction from './useAsyncAction';

// Formulario reutilizable para editar secciones del perfil.
// - `validate(values)` devuelve un objeto { campo: mensaje }.
// - `normalize(name, value)` limpia el valor antes de guardarlo en el estado.
// - `onSubmit(values)` guarda en Firestore y devuelve algo distinto de null.
export default function useProfileForm({ initialValues, validate, normalize, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const { run, loading, error } = useAsyncAction(onSubmit);

  const setField = useCallback(
    (name, rawValue) => {
      const value = normalize ? normalize(name, rawValue) : rawValue;
      setValues((current) => ({ ...current, [name]: value }));
      setErrors((current) => {
        if (!current[name]) return current;
        const next = { ...current };
        delete next[name];
        return next;
      });
      setSaved(false);
    },
    [normalize]
  );

  const submit = useCallback(async () => {
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return false;

    const result = await run(values);
    if (result !== null) setSaved(true);
    return result;
  }, [run, validate, values]);

  return { values, errors, setField, submit, loading, error, saved };
}
