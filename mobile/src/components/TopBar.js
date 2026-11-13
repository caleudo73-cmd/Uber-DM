import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../config/theme';
import useAuth from '../hooks/useAuth';

const { colors, spacing, fontSize, fontWeight } = theme;

// Botón de menú (Drawer) y círculo con la inicial del usuario.
export default function TopBar({ onMenu, onProfile }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const top = insets.top + spacing.sm;

  return (
    <>
      {onMenu ? (
        <Pressable
          onPress={onMenu}
          style={[styles.button, styles.menu, { top }]}
          accessibilityRole="button"
          accessibilityLabel="Abrir menú"
        >
          <Ionicons name="menu" size={26} color={colors.primaryText} />
        </Pressable>
      ) : null}

      <Pressable
        onPress={onProfile}
        style={[styles.button, styles.avatar, { top }]}
        accessibilityRole="button"
        accessibilityLabel="Abrir mi perfil"
      >
        <Text style={styles.initial}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
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
  menu: { left: spacing.md },
  avatar: { right: spacing.md },
  initial: { color: colors.primaryText, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
