import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { RIDE_STATUS } from '../config/constants';
import { db, requireFirebase } from './firebase';
import { toRide } from './rideService';

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
  const received = completed.map((ride) => ride.rating).filter((value) => value > 0);

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
