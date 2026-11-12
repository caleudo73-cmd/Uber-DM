import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { RIDE_STATUS, RIDE_STATUS_LABEL } from '../config/constants';
import Button from './Button';
import RideSummary from './RideSummary';

const { colors, spacing, fontSize, fontWeight } = theme;

export default function ActiveRidePanel({ ride, canCancel, loading, onCancel }) {
  const searching = ride.status === RIDE_STATUS.REQUESTED;

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
          <View>
            <Text style={styles.driverName}>{ride.driverName}</Text>
            <Text style={styles.meta}>Tu conductor</Text>
          </View>
        </View>
      )}

      <RideSummary distanceKm={ride.distanceKm} price={ride.price} currency={ride.currency} />
      {canCancel && <Button title="Cancelar viaje" variant="ghost" onPress={onCancel} loading={loading} />}
    </>
  );
}

const styles = StyleSheet.create({
  status: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, textAlign: 'center' },
  loader: { marginVertical: spacing.sm },
  destination: { color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.sm },
  driver: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: colors.primaryText, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  driverName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
});