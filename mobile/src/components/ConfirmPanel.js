import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';
import { formatKm, formatPrice } from '../utils/format';
import Button from './Button';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

export default function ConfirmPanel({ destination, quote, loading, onConfirm, onChange }) {
  return (
    <>
      <View style={styles.header}>
        <Pressable onPress={onChange} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Elige un viaje</Text>
        <View style={styles.spacer} />
      </View>

      <Text style={styles.destination} numberOfLines={1}>Hacia {destination.name}</Text>

      <View style={styles.option}>
        <Ionicons name="car" size={36} color={colors.textPrimary} />
        <View style={styles.info}>
          <Text style={styles.name}>Económico</Text>
          <Text style={styles.meta}>{quote ? formatKm(quote.distanceKm) : 'Calculando...'}</Text>
        </View>
        <Text style={styles.price}>{quote ? formatPrice(quote.price, quote.currency) : '—'}</Text>
      </View>

      <View style={styles.payment}>
        <Ionicons name="cash-outline" size={20} color={colors.textPrimary} />
        <Text style={styles.paymentText}>Pago simulado</Text>
      </View>

      <Button title="Confirmar viaje" disabled={!quote} loading={loading} onPress={onConfirm} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  spacer: { width: 24 },
  destination: { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
  price: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  payment: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  paymentText: { color: colors.textPrimary, fontWeight: fontWeight.medium },
});