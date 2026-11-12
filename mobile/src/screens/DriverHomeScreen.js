import { FlatList, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import {
  APPROVAL_STATUS,
  RIDE_STATUS,
  RIDE_STATUS_LABEL,
} from '../config/constants';
import { CATEGORY_LABEL } from '../config/pricing';
import { formatPrice } from '../utils/format';
import AvailabilityToggle from '../components/AvailabilityToggle';
import BottomSheet from '../components/BottomSheet';
import Button from '../components/Button';
import ErrorText from '../components/ErrorText';
import RideMap from '../components/RideMap';
import RideRequestCard from '../components/RideRequestCard';
import RideSummary from '../components/RideSummary';
import TopBar from '../components/TopBar';
import useAuth from '../hooks/useAuth';
import useDriverAvailability from '../hooks/useDriverAvailability';
import useDriverRides from '../hooks/useDriverRides';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

function PendingApproval({ user, onSignOut }) {
  const vehicle = user?.vehicle;
  const soat = user?.documents?.soat;

  return (
    <View style={styles.pending}>
      <Text style={styles.status}>Solicitud enviada</Text>
      <Text style={styles.meta}>
        Tu cuenta quedó en estado Pendiente. Un administrador revisará tus documentos antes de
        activar tu cuenta de conductor.
      </Text>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumen del registro</Text>
        <Text style={styles.summaryLine}>Documento: {user?.documentNumber ?? '—'}</Text>
        <Text style={styles.summaryLine}>
          Vehículo:{' '}
          {vehicle
            ? `${vehicle.brand ?? ''} ${vehicle.line ?? ''} ${vehicle.year ?? ''} · ${vehicle.plate ?? ''}`
            : '—'}
        </Text>
        <Text style={styles.summaryLine}>
          SOAT vigente hasta: {soat?.expiresAt ?? '—'}
        </Text>
        <Text style={styles.summaryLine}>Ciudad: {user?.city ?? '—'}</Text>
      </View>

      <Button title="Cerrar sesión" variant="ghost" onPress={onSignOut} />
    </View>
  );
}

function CurrentRidePanel({ ride, driver }) {
  const showActions = {
    [RIDE_STATUS.ACCEPTED]: (
      <Button
        title="Voy en camino"
        variant="accent"
        onPress={() => driver.arriving(ride.id)}
        loading={driver.loading}
      />
    ),
    [RIDE_STATUS.DRIVER_ARRIVING]: (
      <Button
        title="Pasajero a bordo"
        variant="accent"
        onPress={() => driver.start(ride.id)}
        loading={driver.loading}
      />
    ),
    [RIDE_STATUS.IN_PROGRESS]: (
      <Button
        title="Finalizar viaje"
        variant="accent"
        onPress={() => driver.complete(ride.id)}
        loading={driver.loading}
      />
    ),
    [RIDE_STATUS.COMPLETED]: (
      <Button
        title="Cobrar en efectivo"
        variant="accent"
        onPress={() => driver.cashPaid(ride.id)}
        loading={driver.loading}
      />
    ),
  };

  const canCancel = [RIDE_STATUS.ACCEPTED, RIDE_STATUS.DRIVER_ARRIVING].includes(ride.status);

  return (
    <>
      <Text style={styles.status}>{RIDE_STATUS_LABEL[ride.status]}</Text>
      <Text style={styles.meta}>Pasajero: {ride.passengerName}</Text>
      <Text style={styles.meta}>
        {CATEGORY_LABEL[ride.category] ?? ride.category} · {ride.origin?.name ?? 'Origen'} →{' '}
        {ride.destination?.name ?? 'Destino'}
      </Text>
      <RideSummary
        distanceKm={ride.distanceKm}
        fare={ride.fare}
        currency={ride.currency}
        subtitle={`Ganancia neta: ${formatPrice(ride.driverEarnings, ride.currency)}`}
      />

      {showActions[ride.status] ?? null}

      {canCancel && (
        <>
          <View style={styles.gap} />
          <Button title="Cancelar" variant="danger" onPress={() => driver.cancel(ride.id)} />
        </>
      )}
    </>
  );
}

function AvailableRides({ rides, driver, isAvailable }) {
  if (!isAvailable) {
    return (
      <>
        <Text style={styles.status}>No estás disponible</Text>
        <Text style={styles.meta}>
          Activa el interruptor para empezar a recibir solicitudes de viaje.
        </Text>
      </>
    );
  }

  return (
    <>
      <Text style={styles.status}>Solicitudes cercanas</Text>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.meta}>Esperando solicitudes…</Text>}
        renderItem={({ item }) => (
          <RideRequestCard
            ride={item}
            onAccept={driver.accept}
            onExpire={driver.dismiss}
            loading={driver.loading}
          />
        )}
      />
    </>
  );
}

export default function DriverHomeScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const availability = useDriverAvailability();
  const driver = useDriverRides({ isAvailable: availability.available });
  const { currentRide, available } = driver;

  if (user?.approvalStatus && user.approvalStatus !== APPROVAL_STATUS.APPROVED) {
    return (
      <View style={styles.container}>
        <TopBar onProfile={() => navigation.navigate('Profile')} />
        <View style={styles.bottom}>
          <BottomSheet>
            <PendingApproval user={user} onSignOut={signOut} />
          </BottomSheet>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RideMap origin={currentRide?.origin} destination={currentRide?.destination} />
      <TopBar onProfile={() => navigation.navigate('Profile')} />

      <View style={styles.bottom}>
        <BottomSheet>
          <ErrorText message={driver.error} />
          {currentRide ? (
            <CurrentRidePanel ride={currentRide} driver={driver} />
          ) : (
            <>
              <AvailabilityToggle
                available={availability.available}
                loading={availability.loading}
                error={availability.error}
                onToggle={availability.toggle}
              />
              <AvailableRides
                rides={available}
                driver={driver}
                isAvailable={availability.available}
              />
            </>
          )}
        </BottomSheet>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '60%' },
  pending: { paddingVertical: spacing.md },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryLine: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 2 },
  status: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  meta: { color: colors.textSecondary, marginBottom: spacing.sm },
  list: { flexGrow: 0 },
  gap: { height: spacing.sm },
});
