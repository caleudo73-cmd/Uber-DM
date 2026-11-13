// AI-assisted: see docs/AI_LOG.md #8, #11
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { ROLE_LABEL, ROLES } from '../config/constants';
import Button from '../components/Button';
import ErrorText from '../components/ErrorText';
import ScreenContainer from '../components/ScreenContainer';
import StarRating from '../components/StarRating';
import StatCard from '../components/StatCard';
import useAuth from '../hooks/useAuth';
import useProfile from '../hooks/useProfile';
import useProfilePhoto from '../hooks/useProfilePhoto';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

export default function ProfileScreen({ navigation }) {
  const { signOut } = useAuth();
  const { profile, loading, error } = useProfile();
  const photo = useProfilePhoto();

  if (!profile) {
    return (
      <ScreenContainer>
        {loading ? <ActivityIndicator color={colors.primary} /> : <ErrorText message={error} />}
      </ScreenContainer>
    );
  }

  const { user, stats } = profile;
  const isDriver = user.role === ROLES.DRIVER;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.initial}>{user.name[0].toUpperCase()}</Text>
            )}
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

        <Text style={styles.section}>Mi cuenta</Text>
        <Button
          title="Editar datos personales"
          variant="ghost"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <View style={styles.gap} />
        {isDriver ? (
          <>
            <Button
              title="Editar vehículo"
              variant="ghost"
              onPress={() => navigation.navigate('EditVehicle')}
            />
            <View style={styles.gap} />
            <Button
              title="Editar documentos y pagos"
              variant="ghost"
              onPress={() => navigation.navigate('EditDocuments')}
            />
            <View style={styles.gap} />
          </>
        ) : null}
        <Button
          title="Configuración"
          variant="ghost"
          onPress={() => navigation.navigate('Settings')}
        />

        <Text style={styles.section}>Actividad</Text>
        {isDriver ? (
          <>
            <Button
              title="Ganancias"
              variant="ghost"
              onPress={() => navigation.navigate('Earnings')}
            />
            <View style={styles.gap} />
          </>
        ) : null}
        <Button
          title="Historial de viajes"
          variant="ghost"
          onPress={() => navigation.navigate('History')}
        />

        <View style={styles.gap} />
        <Button title="Cerrar sesión" variant="danger" onPress={signOut} />
      </ScrollView>
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
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
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
  section: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  gap: { height: spacing.sm },
});