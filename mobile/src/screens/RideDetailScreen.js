// AI-assisted: see docs/AI_LOG.md #9, #14
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  RIDE_STATUS_LABEL,
} from '../config/constants';
import { CATEGORY_LABEL } from '../config/pricing';
import { formatDateTime, formatKm, formatPrice } from '../utils/format';
import { canRateRide, canShowRating, ratingLabel } from '../utils/ratings';
import * as rideService from '../services/rideService';
import Button from '../components/Button';
import ErrorText from '../components/ErrorText';
import RatingInput from '../components/RatingInput';
import RideMap from '../components/RideMap';
import ScreenContainer from '../components/ScreenContainer';
import StarRating from '../components/StarRating';
import useAuth from '../hooks/useAuth';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

function Line({ label, value, strong }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.label, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.value, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function RideDetailScreen({ route }) {
  const { ride } = route.params;
  const { user } = useAuth();
  const vehicle = ride.driver?.vehicle;

  // La ruta trae una copia del viaje; la calificación se actualiza en local.
  const [rating, setRating] = useState(ride.rating ?? 0);
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);
  const [ratingError, setRatingError] = useState(null);

  const isPassenger = user?.id === ride.passengerId;
  const canRate = canRateRide({ ...ride, rating }, user?.id);

  const submitRating = async () => {
    setSaving(true);
    setRatingError(null);
    try {
      const result = await rideService.rateRide(ride.id, selected);
      setRating(result.rating);
    } catch (error) {
      setRatingError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.status}>{RIDE_STATUS_LABEL[ride.status] ?? ride.status}</Text>
        <Text style={styles.date}>{formatDateTime(ride.completedAt ?? ride.createdAt)}</Text>

        <View style={styles.map}>
          <RideMap origin={ride.origin} destination={ride.destination} showRoute />
        </View>
        <Text style={styles.mapNote}>Ruta aproximada del viaje.</Text>

        <Section title="Recorrido">
          <Line label="Origen" value={ride.origin?.name ?? '—'} />
          <Line label="Destino" value={ride.destination?.name ?? '—'} />
          <Line label="Distancia" value={formatKm(ride.distanceKm ?? 0)} />
          <Line label="Duración estimada" value={`${ride.durationMin ?? 0} min`} />
          <Line label="Categoría" value={CATEGORY_LABEL[ride.category] ?? ride.category ?? '—'} />
        </Section>

        <Section title="Pago">
          <Line label="Tarifa" value={formatPrice(ride.fare, ride.currency)} />
          <Line label="Comisión de la plataforma" value={`- ${formatPrice(ride.commission, ride.currency)}`} />
          <Line label="Propina" value={formatPrice(ride.tip ?? 0, ride.currency)} />
          <View style={styles.divider} />
          <Line
            label="Ganancia del conductor"
            value={formatPrice(ride.driverEarnings, ride.currency)}
            strong
          />
          <Line
            label="Método"
            value={PAYMENT_METHOD_LABEL[ride.paymentMethod] ?? ride.paymentMethod ?? '—'}
          />
          <Line
            label="Estado del pago"
            value={PAYMENT_STATUS_LABEL[ride.paymentStatus] ?? ride.paymentStatus ?? '—'}
          />
        </Section>

        <Section title="Personas">
          <Line label="Pasajero" value={ride.passengerName ?? '—'} />
          <Line label="Conductor" value={ride.driverName ?? 'Sin asignar'} />
          {vehicle ? (
            <>
              <Line
                label="Vehículo"
                value={[vehicle.brand, vehicle.line, vehicle.color].filter(Boolean).join(' · ') || '—'}
              />
              <Line label="Placa" value={vehicle.plate ?? '—'} />
            </>
          ) : null}
        </Section>

        {canShowRating(ride) ? (
          <Section title="Calificación">
            {rating > 0 ? (
              <>
                <View style={styles.ratingRow}>
                  <StarRating value={rating} />
                  <Text style={styles.ratingValue}>{rating}.0</Text>
                </View>
                <Text style={styles.ratingNote}>
                  {isPassenger
                    ? 'Tu calificación para el conductor.'
                    : 'Calificación que dejó el pasajero.'}
                </Text>
              </>
            ) : canRate ? (
              <>
                <Text style={styles.ratingNote}>
                  ¿Cómo estuvo el viaje con {ride.driverName ?? 'tu conductor'}?
                </Text>
                <View style={styles.ratingRow}>
                  <RatingInput value={selected} onChange={setSelected} />
                  <Text style={styles.ratingValue}>{ratingLabel(selected) ?? ''}</Text>
                </View>
                <ErrorText message={ratingError} />
                <Button
                  title="Enviar calificación"
                  variant="accent"
                  disabled={!selected}
                  loading={saving}
                  onPress={submitRating}
                />
              </>
            ) : (
              <Text style={styles.ratingNote}>Sin calificación.</Text>
            )}
          </Section>
        ) : null}

        <Text style={styles.note}>
          La tarifa y la comisión se congelan al finalizar el viaje con la misma función que
          usa la estimación del pasajero.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  status: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  date: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md },
  map: {
    height: 190,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  mapNote: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  label: { color: colors.textSecondary, fontSize: fontSize.sm, flex: 1, paddingRight: spacing.md },
  value: { color: colors.textPrimary, fontSize: fontSize.sm, textAlign: 'right' },
  strong: { fontWeight: fontWeight.bold, fontSize: fontSize.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ratingValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  ratingNote: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 18, marginBottom: spacing.sm },
  note: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
});
