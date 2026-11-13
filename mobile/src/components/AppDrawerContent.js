// AI-assisted: see docs/AI_LOG.md #11
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import theme from '../config/theme';
import { APPROVAL_STATUS, APPROVAL_STATUS_LABEL, ROLE_LABEL, ROLES } from '../config/constants';
import useAuth from '../hooks/useAuth';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

const ITEMS = [
  { route: 'Home', label: 'Inicio', icon: 'home-outline' },
  { route: 'Profile', label: 'Mi perfil', icon: 'person-outline' },
  { route: 'History', label: 'Historial', icon: 'time-outline' },
  { route: 'Earnings', label: 'Ganancias', icon: 'cash-outline', driverOnly: true },
  { route: 'Settings', label: 'Configuración', icon: 'settings-outline' },
];

// Menú lateral de la especificación: perfil, historial, ganancias y
// configuración, más el acceso al inicio y el cierre de sesión.
export default function AppDrawerContent({ navigation, state }) {
  const { user, signOut } = useAuth();
  const currentRoute = state.routes[state.index]?.name;
  const isDriver = user?.role === ROLES.DRIVER;

  return (
    <View style={styles.container}>
      <DrawerContentScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {user?.name ?? 'Sin sesión'}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email ?? ''}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{ROLE_LABEL[user?.role] ?? '—'}</Text>
          </View>
          {isDriver ? (
            <Text style={styles.status}>
              {APPROVAL_STATUS_LABEL[user?.approvalStatus] ?? ''}
              {user?.approvalStatus === APPROVAL_STATUS.APPROVED ? '' : ' · no disponible'}
            </Text>
          ) : null}
        </View>

        <View style={styles.items}>
          {ITEMS.filter((item) => !item.driverOnly || isDriver).map((item) => {
            const active = currentRoute === item.route;
            return (
              <Pressable
                key={item.route}
                onPress={() => navigation.navigate(item.route)}
                style={[styles.item, active && styles.itemActive]}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={active ? colors.primaryText : colors.textPrimary}
                />
                <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <Pressable onPress={signOut} style={styles.signOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: 0 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  initial: { color: colors.primaryText, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  name: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  email: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  status: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  items: { paddingHorizontal: spacing.md, gap: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  itemActive: { backgroundColor: colors.primary },
  itemLabel: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: fontWeight.medium },
  itemLabelActive: { color: colors.primaryText },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  signOutText: { color: colors.danger, fontSize: fontSize.md, fontWeight: fontWeight.medium },
});
