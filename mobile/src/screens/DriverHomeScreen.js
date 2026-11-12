import { FlatList, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import {
  APPROVAL_STATUS,
  RIDE_STATUS,
  RIDE_STATUS_LABEL,
} from '../config/constants';
import { CATEGORY_LABEL } from '../config/pricing';
import { formatPrice } from '../utils/format';
import BottomSheet from '../components/BottomSheet';
import Button from '../components/Button';
import ErrorText from '../components/ErrorText';
import RideMap from '../components/RideMap';
import RideSummary from '../components/RideSummary';
import TopBar from '../components/TopBar';
import useAuth from '../hooks/useAuth';
import useDriverRides from '../hooks/useDriverRides';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

function PendingApproval() {
  return (
    <View style={styles.pending}>
      <Text style={styles.status}>Cuenta pendiente de aprobación</Text>
      <Text style={styles.meta}>
        Un administrador debe aprobar tu registro antes de que puedas recibir solicitudes de viaje.
      </Text>
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

function AvailableRides({ rides, driver }) {
  return (
    <>
      <Text style={styles.status}>Solicitudes cercanas</Text>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.meta}>No hay solicitudes por ahora</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.meta}>{item.passengerName}</Text>
            <Text style={styles.meta}>
              {item.origin?.name ?? 'Origen'} → {item.destination?.name ?? 'Destino'}
            </Text>
            <RideSummary
              distanceKm={item.distanceKm}
              fare={item.fare}
              currency={item.currency}
              subtitle={`Ganancia neta: ${formatPrice(item.driverEarnings, item.currency)}`}
            />
            <Button
              title="Aceptar"
              variant="accent"
              onPress={() => driver.accept(item.id)}
              loading={driver.loading}
            />
          </View>
        )}
      />
    </>
  );
}

export default function DriverHomeScreen({ navigation }) {
  const { user } = useAuth();
  const driver = useDriverRides();
  const { currentRide, available } = driver;

  if (user?.approvalStatus && user.approvalStatus !== APPROVAL_STATUS.APPROVED) {
    return (
      <View style={styles.container}>
        <TopBar onProfile={() => navigation.navigate('Profile')} />
        <View style={styles.bottom}>
          <BottomSheet>
            <PendingApproval />
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
            <AvailableRides rides={available} driver={driver} />
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
  status: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  meta: { color: colors.textSecondary, marginBottom: spacing.sm },
  list: { flexGrow: 0 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  gap: { height: spacing.sm },
});
