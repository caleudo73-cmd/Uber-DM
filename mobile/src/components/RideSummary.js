import { StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { formatKm, formatPrice } from '../utils/format';

const { colors, spacing, fontSize, fontWeight } = theme;

export default function RideSummary({ distanceKm, fare, price, currency, subtitle }) {
  const amount = fare ?? price;

  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.price}>{formatPrice(amount, currency)}</Text>
        <Text style={styles.meta}>{subtitle ?? 'Pago simulado'}</Text>
      </View>
      <Text style={styles.meta}>{formatKm(distanceKm)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  price: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
});
