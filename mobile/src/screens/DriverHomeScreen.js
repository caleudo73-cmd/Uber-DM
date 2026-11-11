import { FlatList, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { RIDE_STATUS, RIDE_STATUS_LABEL } from '../config/constants';
import BottomSheet from '../components/BottomSheet';
import Button from '../components/Button';
import ErrorText from '../components/ErrorText';
import RideMap from '../components/RideMap';
import RideSummary from '../components/RideSummary';
import useAuth from '../hooks/useAuth';
import useDriverRides from '../hooks/useDriverRides';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

function CurrentRidePanel({ ride, driver }) {
  const isAccepted = ride.status === RIDE_STATUS.ACCEPTED;
  return (
    <>
      <Text style={styles.status}>{RIDE_STATUS_LABEL[ride.status]}</Text>
      <Text style={styles.meta}>Pasajero: {ride.passengerName}</Text>
      <RideSummary distanceKm={ride.distanceKm} price={ride.price} currency={ride.currency} />
      {isAccepted ? (
        <>
          <Button title="Iniciar viaje" variant="accent" onPress={() => driver.start(ride.id)} loading={driver.loading} />
          <View style={styles.gap} />
          <Button title="Cancelar" variant="danger" onPress={() => driver.cancel(ride.id)} />
        </>
      ) : (
        <Button title="Finalizar viaje" variant="accent" onPress={() => driver.complete(ride.id)} loading={driver.loading} />
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
            <RideSummary distanceKm={item.distanceKm} price={item.price} currency={item.currency} />
            <Button title="Aceptar" variant="accent" onPress={() => driver.accept(item.id)} loading={driver.loading} />
          </View>
        )}
      />
    </>
  );
}

export default function DriverHomeScreen() {
  const { signOut } = useAuth();
  const driver = useDriverRides();
  const { currentRide, available } = driver;

  return (
    <View style={styles.container}>
      <RideMap
        origin={currentRide?.origin}
        destination={currentRide?.destination}
      />

      <View style={styles.logout}>
        <Button title="Salir" variant="ghost" onPress={signOut} />
      </View>

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
  logout: { position: 'absolute', top: 56, right: spacing.md },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '55%' },
  status: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
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
