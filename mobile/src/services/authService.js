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

const toProfile = (firebaseUser, data = {}) => ({
  id: firebaseUser.uid,
  name: data.name ?? firebaseUser.displayName ?? '',
  email: firebaseUser.email ?? data.email ?? '',
  role: data.role ?? ROLES.PASSENGER,
  approvalStatus: data.approvalStatus ?? APPROVAL_STATUS.APPROVED,
  photoURL: data.photoURL ?? firebaseUser.photoURL ?? null,
});

const loadProfile = async (firebaseUser) => {
  const { db } = requireFirebase();
  const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
  return toProfile(firebaseUser, snapshot.exists() ? snapshot.data() : {});
};

export const login = async (email, password) => {
  requireFirebase();
  const { user } = await signInWithEmailAndPassword(auth, String(email).trim(), password);
  return { user: await loadProfile(user) };
};

export const register = async ({ name, email, password, role }) => {
  const { db } = requireFirebase();
  const cleanEmail = String(email).trim().toLowerCase();
  const { user } = await createUserWithEmailAndPassword(auth, cleanEmail, password);

  await updateProfile(user, { displayName: name });

  const profile = {
    name,
    email: cleanEmail,
    role,
    approvalStatus: role === ROLES.DRIVER ? APPROVAL_STATUS.PENDING : APPROVAL_STATUS.APPROVED,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', user.uid), profile);

  return { user: toProfile(user, profile) };
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
