import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../config/theme';

const { colors, spacing, radius, fontWeight } = theme;

export default function TopBar({ onLogout }) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable onPress={onLogout} style={[styles.pill, { top: insets.top + spacing.sm }]}>
      <Ionicons name="log-out-outline" size={20} color={colors.textPrimary} />
      <Text style={styles.text}>Salir</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  text: { color: colors.textPrimary, fontWeight: fontWeight.medium },
}); 