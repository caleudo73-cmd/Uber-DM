import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import theme from '../config/theme';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

// Interruptor Disponible / No disponible del conductor.
export default function AvailabilityToggle({ available, loading, error, onToggle }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dot, available ? styles.dotOn : styles.dotOff]} />
        <View style={styles.texts}>
          <Text style={styles.title}>{available ? 'Estás disponible' : 'No disponible'}</Text>
          <Text style={styles.meta}>
            {available ? 'Recibiendo solicitudes de viaje' : 'Actívate para recibir solicitudes'}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Switch
            value={available}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.background}
          />
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOn: { backgroundColor: colors.success },
  dotOff: { backgroundColor: colors.textSecondary },
  texts: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
  error: { color: colors.danger, fontSize: fontSize.sm, marginTop: spacing.xs },
});
