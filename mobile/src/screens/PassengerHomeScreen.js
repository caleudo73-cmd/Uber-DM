import { StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { RIDE_STATUS, RIDE_STATUS_LABEL } from '../config/constants';
import BottomSheet from '../components/BottomSheet';
import Button from '../components/Button';
import ErrorText from '../components/ErrorText';
import RideMap from '../components/RideMap';
import RideSummary from '../components/RideSummary';
import useAuth from '../hooks/useAuth';
import useLocation from '../hooks/useLocation';
import usePassengerRide from '../hooks/usePassengerRide';

const { colors, spacing, fontSize, fontWeight } = theme;

export default function PassengerHomeScreen() {
  const { signOut } = useAuth();
  const { location, error: locationError } = useLocation();
  const rideState = usePassengerRide();
  const { ride, destination, quote } = rideState;

  const mapDestination = ride ? ride.destination : destination;
  const canCancel = ride && [RIDE_STATUS.REQUESTED, RIDE_STATUS.ACCEPTED].includes(ride.status);

  return (
    <View style={styles.container}>
      <RideMap
        origin={location}
        destination={mapDestination}
        onPressMap={!ride && location ? (point) => rideState.selectDestination(location, point) : undefined}
      />

      <View style={styles.logout}>
        <Button title="Salir" variant="ghost" onPress={signOut} />
      </View>

      <View style={styles.bottom}>
        <BottomSheet>
          <ErrorText message={locationError || rideState.error} />

          {ride && (
            <>
              <Text style={styles.status}>{RIDE_STATUS_LABEL[ride.status]}</Text>
              {ride.driverName && <Text style={styles.meta}>Conductor: {ride.driverName}</Text>}
              <RideSummary distanceKm={ride.distanceKm} price={ride.price} currency={ride.currency} />
              {canCancel && <Button title="Cancelar viaje" variant="danger" onPress={rideState.cancel} loading={rideState.loading} />}
            </>
          )}

          {!ride && !destination && <Text style={styles.status}>Toca el mapa para elegir tu destino</Text>}

          {!ride && destination && (
            <>
              {quote && <RideSummary distanceKm={quote.distanceKm} price={quote.price} currency={quote.currency} />}
              <Button
                title="Pedir viaje"
                variant="accent"
                disabled={!quote || !location}
                loading={rideState.loading}
                onPress={() => rideState.request(location)}
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
  logout: { position: 'absolute', top: 56, right: spacing.md },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  status: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  meta: { color: colors.textSecondary, marginBottom: spacing.sm },
});
