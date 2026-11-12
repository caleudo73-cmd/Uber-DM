import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABEL,
  RIDE_STATUS,
  RIDE_STATUS_LABEL,
} from '../config/constants';
import { CATEGORY_LABEL } from '../config/pricing';
import { canPayWithCard, isCardPayment, isTestPayment } from '../utils/payments';
import Button from './Button';
import RideSummary from './RideSummary';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

// "Renault Logan · Blanco" a partir del vehículo copiado al viaje.
const vehicleLine = (vehicle) =>
  [vehicle.brand, vehicle.line, vehicle.color].filter(Boolean).join(' · ');

export default function ActiveRidePanel({ ride, canCancel, loading, paying, onCancel, onPay }) {
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

      {ride.status === RIDE_STATUS.COMPLETED ? (
        <View style={styles.payment}>
          <Text style={styles.meta}>
            Método: {PAYMENT_METHOD_LABEL[ride.paymentMethod] ?? ride.paymentMethod}
          </Text>

          {canPayWithCard(ride) ? (
            <>
              <Button
                title={isTestPayment(ride) ? 'Pagar con tarjeta (prueba)' : 'Pagar con Mercado Pago'}
                variant="accent"
                onPress={onPay}
                loading={paying}
              />
              <Text style={styles.hint}>
                {isTestPayment(ride)
                  ? 'Se abre un checkout simulado. No se cobra dinero real.'
                  : 'Se abrirá Mercado Pago en el navegador. El viaje se marca como pagado cuando se aprueba.'}
              </Text>
            </>
          ) : isCardPayment(ride) ? (
            <Text
              style={[
                styles.hint,
                ride.paymentStatus === PAYMENT_STATUS.REJECTED ? styles.rejected : styles.approved,
              ]}
            >
              {ride.paymentStatus === PAYMENT_STATUS.REJECTED
                ? 'Pago rechazado. Puedes intentar de nuevo.'
                : `Pago ${PAYMENT_STATUS_LABEL[ride.paymentStatus] ?? 'pendiente'}`}
            </Text>
          ) : (
            <Text style={styles.hint}>Paga en efectivo al conductor.</Text>
          )}
        </View>
      ) : null}

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
  payment: { gap: spacing.xs, marginBottom: spacing.sm },
  hint: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 18 },
  approved: { color: colors.success, fontWeight: fontWeight.medium },
  rejected: { color: colors.danger, fontWeight: fontWeight.medium },
});
