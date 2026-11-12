import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { RIDE_STATUS_LABEL } from '../config/constants';
import { formatPrice, formatShortDate } from '../utils/format';
import {
  HISTORY_ROLE_FILTERS,
  HISTORY_STATUS_FILTERS,
  filterRides,
  roleInRide,
} from '../utils/history';
import Button from '../components/Button';
import ChipRow from '../components/ChipRow';
import ErrorText from '../components/ErrorText';
import ScreenContainer from '../components/ScreenContainer';
import useAuth from '../hooks/useAuth';
import useRideHistory from '../hooks/useRideHistory';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

const PAGE_SIZE = 10;

const ROLE_LABEL = { driver: 'Conductor', passenger: 'Pasajero' };

function RideRow({ ride, userId, onPress }) {
  const role = roleInRide(ride, userId);
  const amount = role === 'driver' ? ride.driverEarnings : ride.fare;

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.date}>{formatShortDate(ride.completedAt ?? ride.createdAt)}</Text>
        <Text style={styles.status}>{RIDE_STATUS_LABEL[ride.status] ?? ride.status}</Text>
      </View>

      <Text style={styles.route} numberOfLines={1}>
        {ride.origin?.name ?? 'Origen'} → {ride.destination?.name ?? 'Destino'}
      </Text>

      <View style={styles.rowBottom}>
        {role ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{ROLE_LABEL[role]}</Text>
          </View>
        ) : (
          <View />
        )}
        <Text style={styles.amount}>{formatPrice(amount, ride.currency)}</Text>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen({ navigation }) {
  const { user } = useAuth();
  const { rides, loading, error } = useRideHistory();
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const filtered = useMemo(
    () => filterRides(rides, { status, role }, user?.id),
    [rides, status, role, user?.id]
  );

  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > visible.length;

  const changeStatus = (value) => {
    setStatus(value);
    setLimit(PAGE_SIZE);
  };

  const changeRole = (value) => {
    setRole(value);
    setLimit(PAGE_SIZE);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <View style={styles.filters}>
        <ChipRow options={HISTORY_STATUS_FILTERS} value={status} onChange={changeStatus} />
        <ChipRow options={HISTORY_ROLE_FILTERS} value={role} onChange={changeRole} />
        <ErrorText message={error} />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay viajes con estos filtros.</Text>
        }
        renderItem={({ item }) => (
          <RideRow
            ride={item}
            userId={user?.id}
            onPress={() => navigation.navigate('RideDetail', { ride: item })}
          />
        )}
        ListFooterComponent={
          hasMore ? (
            <Button
              title={`Ver más (${filtered.length - visible.length})`}
              variant="ghost"
              onPress={() => setLimit((current) => current + PAGE_SIZE)}
            />
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filters: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.xs },
  list: { padding: spacing.lg, gap: spacing.sm },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  date: { fontSize: fontSize.sm, color: colors.textSecondary },
  status: { fontSize: fontSize.sm, color: colors.textSecondary },
  route: { fontSize: fontSize.md, color: colors.textPrimary, marginBottom: spacing.sm },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: fontSize.sm, color: colors.textSecondary },
  amount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
});
