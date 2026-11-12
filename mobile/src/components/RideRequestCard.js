import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { CATEGORY_LABEL } from '../config/pricing';
import { formatPrice } from '../utils/format';
import { remainingRatio, remainingSeconds } from '../utils/countdown';
import Button from './Button';
import RideSummary from './RideSummary';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

// Tarjeta de solicitud entrante con cuenta regresiva de 15 segundos.
export default function RideRequestCard({ ride, onAccept, onExpire, loading }) {
  const [now, setNow] = useState(() => Date.now());
  const expired = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const remaining = remainingSeconds(ride.createdAt, now);
  const ratio = remainingRatio(ride.createdAt, now);
  const seconds = Math.ceil(remaining);
  const urgent = remaining <= 5;

  useEffect(() => {
    if (remaining <= 0 && !expired.current) {
      expired.current = true;
      onExpire(ride.id);
    }
  }, [remaining, onExpire, ride.id]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Nueva solicitud</Text>
          <Text style={styles.meta}>
            {CATEGORY_LABEL[ride.category] ?? ride.category} · {ride.passengerName}
          </Text>
        </View>
        <View style={[styles.countdown, urgent && styles.countdownUrgent]}>
          <Text style={[styles.countdownText, urgent && styles.countdownTextUrgent]}>
            {seconds}s
          </Text>
        </View>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.bar,
            urgent && styles.barUrgent,
            { width: `${Math.max(0, Math.min(1, ratio)) * 100}%` },
          ]}
        />
      </View>

      <Text style={styles.route} numberOfLines={2}>
        {ride.origin?.name ?? 'Origen'} → {ride.destination?.name ?? 'Destino'}
      </Text>

      <RideSummary
        distanceKm={ride.distanceKm}
        fare={ride.fare}
        currency={ride.currency}
        subtitle={`Ganancia neta: ${formatPrice(ride.driverEarnings, ride.currency)}`}
      />

      <Button
        title="Aceptar"
        variant="accent"
        onPress={() => onAccept(ride.id)}
        loading={loading}
        disabled={remaining <= 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  headerText: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
  countdown: {
    minWidth: 46,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  countdownUrgent: { backgroundColor: colors.danger },
  countdownText: { color: colors.primaryText, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  countdownTextUrgent: { color: colors.textInverse },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  bar: { height: '100%', backgroundColor: colors.accent },
  barUrgent: { backgroundColor: colors.danger },
  route: { color: colors.textSecondary, marginBottom: spacing.sm },
});
