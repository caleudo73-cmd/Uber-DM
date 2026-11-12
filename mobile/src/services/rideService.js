import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  CURRENT_RIDE_STATUSES,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  RIDE_STATUS,
} from '../config/constants';
import { DEFAULT_CATEGORY, PRICING } from '../config/pricing';
import { calculateFare } from '../utils/calculateFare';
import { distanceKm, estimateDurationMin } from '../utils/geo';
import { isValidRating } from '../utils/ratings';
import { db, requireFirebase } from './firebase';

const TRIPS = 'trips';

const toISO = (value) => (value?.toDate ? value.toDate().toISOString() : value ?? null);

const toPoint = (point) => ({
  latitude: point.latitude,
  longitude: point.longitude,
  name: typeof point.name === 'string' ? point.name.slice(0, 120) : null,
});

export const toRide = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: toISO(data.createdAt),
    acceptedAt: toISO(data.acceptedAt),
    completedAt: toISO(data.completedAt),
  };
};

const quoteFor = (origin, destination, category, tip = 0) => {
  const km = distanceKm(origin, destination);
  const durationMin = estimateDurationMin(km);
  const result = calculateFare({ distanceKm: km, durationMin, category, tip });
  return {
    distanceKm: +km.toFixed(2),
    durationMin,
    category,
    currency: PRICING.CURRENCY,
    tip: Math.round(Number(tip) || 0),
    ...result,
  };
};

// La estimación usa la misma función pura que el cierre del viaje.
export const quoteRide = async (origin, destination, category = DEFAULT_CATEGORY, tip = 0) =>
  quoteFor(origin, destination, category, tip);

export const requestRide = async (origin, destination, options = {}) => {
  const { auth } = requireFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión');

  const category = options.category ?? DEFAULT_CATEGORY;
  const tip = Math.round(Number(options.tip) || 0);
  const quote = quoteFor(origin, destination, category, tip);

  const trip = {
    passengerId: user.uid,
    passengerName: user.displayName || 'Pasajero',
    driverId: null,
    driverName: null,
    driver: null,
    participants: [user.uid],
    origin: toPoint(origin),
    destination: toPoint(destination),
    distanceKm: quote.distanceKm,
    durationMin: quote.durationMin,
    category,
    fare: quote.fare,
    commission: quote.commission,
    tip,
    driverEarnings: quote.driverEarnings,
    commissionRate: quote.commissionRate,
    currency: quote.currency,
    paymentMethod: options.paymentMethod ?? PAYMENT_METHOD.CASH,
    paymentStatus: PAYMENT_STATUS.PENDING,
    paymentId: null,
    status: RIDE_STATUS.REQUESTED,
    rating: null,
    createdAt: serverTimestamp(),
    acceptedAt: null,
    completedAt: null,
  };

  const ref = await addDoc(collection(db, TRIPS), trip);
  return { ride: { id: ref.id, ...trip, createdAt: new Date().toISOString() } };
};

// Tiempo real: cualquier cambio del viaje activo llega por onSnapshot.
export const subscribeCurrentRide = (userId, onChange, onError) => {
  const q = query(collection(db, TRIPS), where('participants', 'array-contains', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      // Puede haber más de un viaje en curso (por ejemplo, uno completado sin
      // pagar). Se muestra siempre el más reciente.
      const active = snapshot.docs
        .map(toRide)
        .filter((trip) => CURRENT_RIDE_STATUSES.includes(trip.status))
        .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
      onChange(active[0] ?? null);
    },
    (error) => onError?.(error.message)
  );
};

export const subscribeAvailableRides = (onChange, onError) => {
  const q = query(collection(db, TRIPS), where('status', '==', RIDE_STATUS.REQUESTED), limit(20));

  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map(toRide)),
    (error) => onError?.(error.message)
  );
};

export const subscribeDriverHistory = (driverId, onChange, onError) => {
  const q = query(collection(db, TRIPS), where('driverId', '==', driverId));

  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map(toRide)),
    (error) => onError?.(error.message)
  );
};

// Historial completo del usuario (como pasajero o conductor).
export const subscribeRideHistory = (userId, onChange, onError) => {
  const q = query(collection(db, TRIPS), where('participants', 'array-contains', userId));

  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map(toRide)),
    (error) => onError?.(error.message)
  );
};

export const acceptRide = async (rideId) => {
  const { auth, db } = requireFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión');

  // Copiamos nombre y vehículo al viaje: el pasajero debe ver con qué carro
  // lo recogen y el dato no puede cambiar a mitad del servicio.
  const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
  const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
  const vehicle = profile.vehicle ?? null;
  const driverName = profile.name ?? user.displayName ?? 'Conductor';

  const ref = doc(db, TRIPS, rideId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Ese viaje ya no existe');

    const trip = snapshot.data();
    if (trip.status !== RIDE_STATUS.REQUESTED) throw new Error('Ese viaje ya fue tomado');

    transaction.update(ref, {
      driverId: user.uid,
      driverName,
      driver: {
        id: user.uid,
        name: driverName,
        phone: profile.phone ?? null,
        vehicle: vehicle
          ? {
              brand: vehicle.brand ?? null,
              line: vehicle.line ?? null,
              year: vehicle.year ?? null,
              plate: vehicle.plate ?? null,
              color: vehicle.color ?? null,
              category: vehicle.category ?? null,
            }
          : null,
      },
      participants: [trip.passengerId, user.uid],
      status: RIDE_STATUS.ACCEPTED,
      acceptedAt: serverTimestamp(),
    });
  });

  return { id: rideId };
};

const driverTransition = async (rideId, fromStatuses, toStatus, extra = {}) => {
  const { auth, db } = requireFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión');

  const ref = doc(db, TRIPS, rideId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Ese viaje ya no existe');

    const trip = snapshot.data();
    if (trip.driverId !== user.uid) throw new Error('Este viaje no es tuyo');
    if (!fromStatuses.includes(trip.status)) throw new Error('Estado inválido para esta acción');

    transaction.update(ref, { status: toStatus, ...extra(trip) });
  });

  return { id: rideId };
};

export const markDriverArriving = (rideId) =>
  driverTransition(rideId, [RIDE_STATUS.ACCEPTED], RIDE_STATUS.DRIVER_ARRIVING, () => ({}));

export const startRide = (rideId) =>
  driverTransition(
    rideId,
    [RIDE_STATUS.ACCEPTED, RIDE_STATUS.DRIVER_ARRIVING],
    RIDE_STATUS.IN_PROGRESS,
    () => ({ startedAt: serverTimestamp() })
  );

// Al finalizar se recalcula la tarifa con la misma función pura y se congela
// el commissionRate que tenía el viaje al crearse.
export const completeRide = (rideId) =>
  driverTransition(rideId, [RIDE_STATUS.IN_PROGRESS], RIDE_STATUS.COMPLETED, (trip) => {
    const { fare } = calculateFare({
      distanceKm: trip.distanceKm,
      durationMin: trip.durationMin,
      category: trip.category,
      tip: trip.tip,
    });
    const commissionRate = trip.commissionRate ?? PRICING.COMMISSION_RATE;
    const commission = Math.round(fare * commissionRate);
    const driverEarnings = fare - commission + Math.round(trip.tip ?? 0);

    return { fare, commission, driverEarnings, commissionRate, completedAt: serverTimestamp() };
  });

// Efectivo: el conductor confirma que recibió el dinero.
export const markCashPaid = (rideId) =>
  driverTransition(rideId, [RIDE_STATUS.COMPLETED], RIDE_STATUS.PAID, () => ({
    paymentStatus: PAYMENT_STATUS.CASH,
    paidAt: serverTimestamp(),
  }));

export const cancelRide = async (rideId) => {
  const { auth, db } = requireFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión');

  const ref = doc(db, TRIPS, rideId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Ese viaje ya no existe');

    const trip = snapshot.data();
    const isOwner = trip.passengerId === user.uid || trip.driverId === user.uid;
    if (!isOwner) throw new Error('Este viaje no es tuyo');

    const cancellable = [
      RIDE_STATUS.REQUESTED,
      RIDE_STATUS.ACCEPTED,
      RIDE_STATUS.DRIVER_ARRIVING,
    ];
    if (!cancellable.includes(trip.status)) throw new Error('Ya no se puede cancelar');

    transaction.update(ref, {
      status: RIDE_STATUS.CANCELLED,
      cancelledBy: user.uid,
      cancelledAt: serverTimestamp(),
    });
  });

  return { id: rideId };
};

// El pasajero califica al conductor una sola vez, cuando el viaje terminó.
export const rateRide = async (rideId, rating) => {
  const { auth, db } = requireFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión');

  const value = Math.round(Number(rating));
  if (!isValidRating(value)) throw new Error('La calificación debe ser de 1 a 5 estrellas');

  const ref = doc(db, TRIPS, rideId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Ese viaje ya no existe');

    const trip = snapshot.data();
    if (trip.passengerId !== user.uid) {
      throw new Error('Solo el pasajero puede calificar el viaje');
    }
    if (![RIDE_STATUS.COMPLETED, RIDE_STATUS.PAID].includes(trip.status)) {
      throw new Error('El viaje todavía no ha terminado');
    }
    if (trip.rating) throw new Error('Este viaje ya fue calificado');

    transaction.update(ref, {
      rating: value,
      ratedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return { id: rideId, rating: value };
};
