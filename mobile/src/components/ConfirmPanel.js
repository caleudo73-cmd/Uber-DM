import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';
import { formatKm, formatPrice } from '../utils/format';
import { PAYMENT_METHOD_OPTIONS } from '../utils/payments';
import Button from './Button';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

export default function ConfirmPanel({
  destination,
  quote,
  loading,
  paymentMethod,
  onChangePaymentMethod,
  onConfirm,
  onChange,
}) {
  const selected = PAYMENT_METHOD_OPTIONS.find((option) => option.value === paymentMethod);

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
        <Text style={styles.price}>{quote ? formatPrice(quote.fare, quote.currency) : '—'}</Text>
      </View>

      <Text style={styles.section}>Método de pago</Text>
      <View style={styles.methods}>
        {PAYMENT_METHOD_OPTIONS.map((option) => {
          const active = option.value === paymentMethod;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChangePaymentMethod(option.value)}
              style={[styles.method, active && styles.methodActive]}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={active ? colors.primaryText : colors.textPrimary}
              />
              <Text style={[styles.methodText, active && styles.methodTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selected ? <Text style={styles.hint}>{selected.hint}</Text> : null}

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
  section: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  methods: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  method: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodText: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  methodTextActive: { color: colors.primaryText },
  hint: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md },
});
