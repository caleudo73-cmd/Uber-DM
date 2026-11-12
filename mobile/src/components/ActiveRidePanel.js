import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { RIDE_STATUS, RIDE_STATUS_LABEL } from '../config/constants';
import { CATEGORY_LABEL } from '../config/pricing';
import Button from './Button';
import RideSummary from './RideSummary';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

// "Renault Logan · Blanco" a partir del vehículo copiado al viaje.
const vehicleLine = (vehicle) =>
  [vehicle.brand, vehicle.line, vehicle.color].filter(Boolean).join(' · ');

export default function ActiveRidePanel({ ride, canCancel, loading, onCancel }) {
  const searching = ride.status === RIDE_STATUS.REQUESTED;
  const vehicle = ride.driver?.vehicle;

  return (
    <>
      <Text style={styles.status}>{RIDE_STATUS_LABEL[ride.status]}</Text>
      {searching && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      <Text style={styles.destination} numberOfLines={1}>Hacia {ride.destination.name ?? 'tu destino'}</Text>

      {ride.driverName && (
        <View style={styles.driver}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>{ride.driverName[0].toUpperCase()}</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{ride.driverName}</Text>
            <Text style={styles.meta}>Tu conductor</Text>

            {vehicle ? (
              <>
                {vehicleLine(vehicle) ? (
                  <Text style={styles.vehicle}>{vehicleLine(vehicle)}</Text>
                ) : null}
                <View style={styles.vehicleRow}>
                  <View style={styles.plate}>
                    <Text style={styles.plateText}>{vehicle.plate ?? 'SIN PLACA'}</Text>
                  </View>
                  <Text style={styles.meta}>
                    {CATEGORY_LABEL[vehicle.category] ?? 'Vehículo'}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      )}

      <RideSummary distanceKm={ride.distanceKm} fare={ride.fare} currency={ride.currency} />
      {canCancel && <Button title="Cancelar viaje" variant="ghost" onPress={onCancel} loading={loading} />}
    </>
  );
}

const styles = StyleSheet.create({
  status: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, textAlign: 'center' },
  loader: { marginVertical: spacing.sm },
  destination: { color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.sm },
  driver: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginVertical: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: colors.primaryText, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  driverInfo: { flex: 1 },
  driverName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
  vehicle: { fontSize: fontSize.sm, color: colors.textPrimary, marginTop: spacing.xs },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  plate: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  plateText: {
    color: colors.primaryText,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
});
