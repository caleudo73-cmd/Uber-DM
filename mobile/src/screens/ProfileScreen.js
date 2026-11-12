import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { ROLE_LABEL } from '../config/constants';
import Button from '../components/Button';
import ErrorText from '../components/ErrorText';
import ScreenContainer from '../components/ScreenContainer';
import StarRating from '../components/StarRating';
import StatCard from '../components/StatCard';
import useAuth from '../hooks/useAuth';
import useProfile from '../hooks/useProfile';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { profile, loading, error } = useProfile();

  if (!profile) {
    return (
      <ScreenContainer>
        {loading ? <ActivityIndicator color={colors.primary} /> : <ErrorText message={error} />}
      </ScreenContainer>
    );
  }

  const { user, stats } = profile;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{user.name[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{ROLE_LABEL[user.role]}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <StatCard
          label={stats.ratingCount ? `${stats.ratingCount} calificaciones` : 'Sin calificaciones'}
          value={stats.rating ?? '–'}
        >
          {stats.rating ? <StarRating value={stats.rating} /> : null}
        </StatCard>
        <StatCard label="Servicios" value={stats.completedRides} />
        <StatCard label="Cancelados" value={stats.cancelledRides} />
      </View>

      <Button title="Cerrar sesión" variant="danger" onPress={signOut} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  initial: { color: colors.primaryText, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  email: { color: colors.textSecondary, marginBottom: spacing.sm },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { color: colors.textPrimary, fontWeight: fontWeight.medium },
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
});