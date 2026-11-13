import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { RIDE_STATUS } from '../config/constants';
import { db, requireFirebase } from './firebase';
import { toRide } from './rideService';

// Actualiza campos del perfil. El contexto escucha users/{uid}, así que la app
// refleja el cambio sin cerrar sesión.
export const updateProfileFields = async (uid, fields) => {
  await updateDoc(doc(db, 'users', uid), { ...fields, updatedAt: serverTimestamp() });
};

// Guarda una foto de la subcolección de documentos (base64 comprimido).
export const saveDocumentPhoto = async (uid, key, photo) => {
  if (!photo?.base64) return;
  await setDoc(doc(db, 'users', uid, 'documents', key), {
    type: key,
    base64: photo.base64,
    mimeType: photo.mimeType ?? 'image/jpeg',
    updatedAt: serverTimestamp(),
  });
};

// Devuelve la foto como data URI para mostrarla en PhotoPicker.
export const getDocumentPhoto = async (uid, key) => {
  if (!uid) return null;
  const snapshot = await getDoc(doc(db, 'users', uid, 'documents', key));
  if (!snapshot.exists()) return null;
  const { base64, mimeType } = snapshot.data();
  return base64 ? { uri: `data:${mimeType ?? 'image/jpeg'};base64,${base64}` } : null;
};

// El conductor decide si recibe solicitudes. Se guarda en su perfil para que
// el estado sobreviva a reinicios y se vea igual desde cualquier dispositivo.
export const setDriverAvailability = async (uid, isAvailable, location = null) => {
  const data = { isAvailable, availabilityUpdatedAt: serverTimestamp() };

  if (location) {
    data.driverLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
    };
    data.locationUpdatedAt = serverTimestamp();
  }

  await updateDoc(doc(db, 'users', uid), data);
};

// Posición mientras está disponible (se escribe con límite de frecuencia).
export const updateDriverLocation = async (uid, location) => {
  await updateDoc(doc(db, 'users', uid), {
    driverLocation: {
      latitude: location.latitude,
      longitude: location.longitude,
    },
    locationUpdatedAt: serverTimestamp(),
  });
};

// Perfil + estadísticas calculadas sobre los viajes del usuario.
export const getStats = async () => {
  const { auth } = requireFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión');

  const [snapshot, profileSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'trips'), where('participants', 'array-contains', user.uid))),
    getDoc(doc(db, 'users', user.uid)),
  ]);
  const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
  const rides = snapshot.docs.map(toRide);

  const completed = rides.filter((ride) =>
    [RIDE_STATUS.COMPLETED, RIDE_STATUS.PAID].includes(ride.status)
  );
  const cancelled = rides.filter((ride) => ride.status === RIDE_STATUS.CANCELLED);
  // Solo cuentan las calificaciones que el usuario recibió como conductor.
  const received = completed
    .filter((ride) => ride.driverId === user.uid)
    .map((ride) => ride.rating)
    .filter((value) => value > 0);

  return {
    user: {
      id: user.uid,
      name: profile.name ?? user.displayName,
      email: profile.email ?? user.email,
      role: profile.role ?? 'passenger',
    },
    stats: {
      rating: received.length
        ? +(received.reduce((sum, value) => sum + value, 0) / received.length).toFixed(1)
        : null,
      ratingCount: received.length,
      completedRides: completed.length,
      cancelledRides: cancelled.length,
    },
  };
};
