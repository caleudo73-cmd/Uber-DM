import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../config/theme';
import { formatPrice } from '../utils/format';
import { PAYMENT_OUTCOME, paymentAmount } from '../utils/payments';
import Button from './Button';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

// Tarjeta ficticia de Mercado Pago para el checkout simulado.
const TEST_CARD_NUMBER = '4242 4242 4242 4242';

export default function TestPaymentModal({ visible, ride, loading, onApprove, onReject, onClose }) {
  const insets = useSafeAreaInsets();
  const amount = paymentAmount(ride);
  const tip = Math.round(Number(ride?.tip) || 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Pago con tarjeta</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.badge}>
            <Ionicons name="flask-outline" size={14} color={colors.textPrimary} />
            <Text style={styles.badgeText}>MODO PRUEBA · no se cobra dinero real</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Ionicons name="card" size={28} color={colors.primaryText} />
              <Text style={styles.cardBrand}>MERCADO PAGO · TEST</Text>
            </View>
            <Text style={styles.cardNumber}>{TEST_CARD_NUMBER}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.cardMeta}>PASAJERO DEMO</Text>
              <Text style={styles.cardMeta}>12/30</Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amount}>{formatPrice(amount, ride?.currency)}</Text>
            <Text style={styles.meta}>
              {tip > 0 ? `Incluye propina de ${formatPrice(tip, ride?.currency)}` : 'Sin propina'}
            </Text>
          </View>

          <Text style={styles.meta}>
            {ride?.origin?.name ?? 'Origen'} → {ride?.destination?.name ?? 'Destino'}
          </Text>

          <Text style={styles.hint}>
            Elige el resultado que quieres simular. En producción este paso lo hace el
            checkout de Mercado Pago y el webhook confirma el pago.
          </Text>

          <View style={styles.actions}>
            <Button
              title="Aprobar pago de prueba"
              variant="accent"
              loading={loading}
              onPress={() => onApprove(PAYMENT_OUTCOME.APPROVED)}
            />
            <Button
              title="Simular rechazo"
              variant="ghost"
              loading={loading}
              onPress={() => onReject(PAYMENT_OUTCOME.REJECTED)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  backdropFill: { flex: 1 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.warning,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBrand: {
    color: colors.primaryText,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  cardNumber: {
    color: colors.primaryText,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    letterSpacing: 2,
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: {
    color: colors.primaryText,
    fontSize: fontSize.sm,
    opacity: 0.8,
    letterSpacing: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  amount: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
