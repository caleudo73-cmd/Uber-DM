import { StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

export default function StatCard({ label, value, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      {children}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  value: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
});