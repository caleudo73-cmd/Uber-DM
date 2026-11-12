import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

// Pestañas numeradas del registro. `completed` es un mapa { clave: boolean }.
export default function TabBar({ steps, active, completed = {}, onPress }) {
  return (
    <View style={styles.row}>
      {steps.map((step, index) => {
        const isActive = index === active;
        const isDone = completed[step.key];

        return (
          <Pressable
            key={step.key}
            onPress={() => onPress?.(index)}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.badge, isActive && styles.badgeActive, isDone && styles.badgeDone]}>
              {isDone && !isActive ? (
                <Ionicons name="checkmark" size={14} color={colors.accentText} />
              ) : (
                <Text style={[styles.badgeText, (isActive || isDone) && styles.badgeTextActive]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              numberOfLines={2}
              style={[styles.label, isActive && styles.labelActive, isDone && styles.labelDone]}
            >
              {step.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.lg },
  item: { flex: 1, alignItems: 'center' },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  badgeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  badgeDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  badgeText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  badgeTextActive: { color: colors.primaryText },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
  labelActive: { color: colors.textPrimary, fontWeight: fontWeight.medium },
  labelDone: { color: colors.textSecondary },
});
