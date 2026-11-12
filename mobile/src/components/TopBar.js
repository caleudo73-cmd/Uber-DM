import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../config/theme';
import useAuth from '../hooks/useAuth';

const { colors, spacing, fontSize, fontWeight } = theme;

// Círculo con la inicial del usuario, abre el perfil.
export default function TopBar({ onProfile }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <Pressable onPress={onProfile} style={[styles.avatar, { top: insets.top + spacing.sm }]}>
      <Text style={styles.initial}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    position: 'absolute',
    left: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  initial: { color: colors.primaryText, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});