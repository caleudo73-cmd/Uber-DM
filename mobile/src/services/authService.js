import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { APPROVAL_STATUS, ROLES } from '../config/constants';
import { auth, firebaseConfigError, requireFirebase } from './firebase';

const PROFILE_READ_ATTEMPTS = 10;
const PROFILE_READ_DELAY_MS = 250;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// El listener de Auth puede dispararse antes de que terminemos de escribir el
// documento del usuario. Mientras haya un registro en curso, se reintenta la lectura.
let registrationInProgress = false;

const AUTH_ERRORS = {
  'auth/email-already-in-use': 'Ese correo ya está registrado',
  'auth/invalid-email': 'Correo electrónico inválido',
  'auth/weak-password': 'La contraseña debe tener mínimo 6 caracteres',
  'auth/user-not-found': 'No existe una cuenta con ese correo',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
  'auth/operation-not-allowed': 'El registro con correo no está habilitado en Firebase',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
};

const translateError = (error) => {
  const message = AUTH_ERRORS[error?.code] ?? error?.message ?? 'Ocurrió un error';
  return new Error(message);
};

const toProfile = (firebaseUser, data = {}) => ({
  id: firebaseUser.uid,
  name: data.name ?? firebaseUser.displayName ?? '',
  email: firebaseUser.email ?? data.email ?? '',
  role: data.role ?? ROLES.PASSENGER,
  approvalStatus: data.approvalStatus ?? APPROVAL_STATUS.APPROVED,
  photoURL: data.photoURL ?? firebaseUser.photoURL ?? null,
  phone: data.phone ?? null,
  city: data.city ?? null,
  documentNumber: data.documentNumber ?? null,
  vehicle: data.vehicle ?? null,
  documents: data.documents ?? null,
});

const readProfile = async (firebaseUser) => {
  const { db } = requireFirebase();
  const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
  return snapshot.exists() ? toProfile(firebaseUser, snapshot.data()) : null;
};

const loadProfile = async (firebaseUser) => {
  let profile = await readProfile(firebaseUser);
  if (profile) return profile;

  // Recién creado: el documento puede estar en camino.
  for (let attempt = 0; attempt < PROFILE_READ_ATTEMPTS && registrationInProgress; attempt += 1) {
    await sleep(PROFILE_READ_DELAY_MS);
    profile = await readProfile(firebaseUser);
    if (profile) return profile;
  }

  return toProfile(firebaseUser);
};

const driverProfile = (payload) => ({
  phone: payload.phone ?? null,
  documentType: payload.documentType ?? 'CC',
  documentNumber: payload.documentNumber ?? null,
  birthDate: payload.birthDate ?? null,
  city: payload.city ?? null,
  address: payload.address ?? null,
  vehicle: payload.vehicle ?? null,
  documents: payload.documents ?? null,
  driverRegisteredAt: serverTimestamp(),
});

// Las fotos van en una subcolección para no cargar el documento del perfil.
// Se guardan como base64 comprimido porque el plan Spark no incluye Storage.
const saveDocumentPhotos = async (uid, photos) => {
  if (!photos) return;

  const { db } = requireFirebase();
  const entries = Object.entries(photos).filter(([, photo]) => photo?.base64);

  const results = await Promise.allSettled(
    entries.map(([key, photo]) =>
      setDoc(doc(db, 'users', uid, 'documents', key), {
        type: key,
        base64: photo.base64,
        mimeType: photo.mimeType ?? 'image/jpeg',
        updatedAt: serverTimestamp(),
      })
    )
  );

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(`No se pudo guardar la foto ${entries[index][0]}:`, result.reason?.message);
    }
  });
};

export const login = async (email, password) => {
  requireFirebase();
  try {
    const { user } = await signInWithEmailAndPassword(auth, String(email).trim(), password);
    return { user: await loadProfile(user) };
  } catch (error) {
    throw translateError(error);
  }
};

export const register = async (payload) => {
  const { db } = requireFirebase();
  const { name, password, role } = payload;
  const cleanEmail = String(payload.email).trim().toLowerCase();

  registrationInProgress = true;
  try {
    const { user } = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await updateProfile(user, { displayName: name });

    const profile = {
      name,
      email: cleanEmail,
      role,
      approvalStatus: role === ROLES.DRIVER ? APPROVAL_STATUS.PENDING : APPROVAL_STATUS.APPROVED,
      createdAt: serverTimestamp(),
      ...(role === ROLES.DRIVER ? driverProfile(payload) : {}),
    };

    await setDoc(doc(db, 'users', user.uid), profile);

    if (role === ROLES.DRIVER) {
      await saveDocumentPhotos(user.uid, payload.photos);
    }

    return { user: toProfile(user, profile) };
  } catch (error) {
    throw translateError(error);
  } finally {
    registrationInProgress = false;
  }
};

export const logout = async () => {
  requireFirebase();
  await firebaseSignOut(auth);
};

// Mantiene la sesión sincronizada con Firebase Auth.
export const subscribeToAuth = (onChange) => {
  if (firebaseConfigError) {
    onChange(null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      onChange(null);
      return;
    }
    try {
      onChange(await loadProfile(firebaseUser));
    } catch (error) {
      console.warn('No se pudo leer el perfil del usuario:', error.message);
      onChange(toProfile(firebaseUser));
    }
  });
};
