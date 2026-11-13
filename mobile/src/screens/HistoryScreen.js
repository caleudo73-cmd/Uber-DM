// AI-assisted: see docs/AI_LOG.md #9, #10
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { PAYMENT_STATUS_LABEL, RIDE_STATUS_LABEL } from '../config/constants';
import { CATEGORY_LABEL } from '../config/pricing';
import { formatPrice, formatShortDate } from '../utils/format';
import {
  HISTORY_PAYMENT_FILTERS,
  HISTORY_PERIOD_FILTERS,
  HISTORY_ROLE_FILTERS,
  HISTORY_STATUS_FILTERS,
  filterRides,
  roleInRide,
} from '../utils/history';
import { formatDateInput, parseDateInput } from '../utils/validators';
import Button from '../components/Button';
import ChipRow from '../components/ChipRow';
import ErrorText from '../components/ErrorText';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';
import useAuth from '../hooks/useAuth';
import useRideHistory from '../hooks/useRideHistory';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

const PAGE_SIZE = 10;

const ROLE_LABEL = { driver: 'Conductor', passenger: 'Pasajero' };

function RideRow({ ride, userId, onPress }) {
  const role = roleInRide(ride, userId);
  const isDriver = role === 'driver';
  const category = CATEGORY_LABEL[ride.category] ?? ride.category ?? '—';
  const payment = PAYMENT_STATUS_LABEL[ride.paymentStatus] ?? '—';

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.date}>{formatShortDate(ride.completedAt ?? ride.createdAt)}</Text>
        <Text style={styles.status}>{RIDE_STATUS_LABEL[ride.status] ?? ride.status}</Text>
      </View>

      <Text style={styles.route} numberOfLines={1}>
        {ride.origin?.name ?? 'Origen'} → {ride.destination?.name ?? 'Destino'}
      </Text>
      <Text style={styles.meta}>
        {category} · Pago: {payment}
      </Text>

      <View style={styles.rowBottom}>
        {role ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{ROLE_LABEL[role]}</Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.amounts}>
          <Text style={styles.amount}>{formatPrice(ride.fare, ride.currency)}</Text>
          <Text style={styles.amountNote}>
            {isDriver
              ? `Neto ${formatPrice(ride.driverEarnings, ride.currency)}`
              : `Propina ${formatPrice(ride.tip ?? 0, ride.currency)}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen({ navigation }) {
  const { user } = useAuth();
  const { rides, loading, error } = useRideHistory();
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const [period, setPeriod] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const filtered = useMemo(
    () =>
      filterRides(
        rides,
        {
          status,
          role,
          period,
          paymentMethod,
          from: parseDateInput(fromText),
          to: parseDateInput(toText),
        },
        user?.id
      ),
    [rides, status, role, period, paymentMethod, fromText, toText, user?.id]
  );

  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > visible.length;

  const from = parseDateInput(fromText);
  const to = parseDateInput(toText);
  let rangeError = null;
  if (period === 'range') {
    if (fromText && !from) rangeError = 'Fecha desde inválida (DD/MM/AAAA)';
    else if (toText && !to) rangeError = 'Fecha hasta inválida (DD/MM/AAAA)';
    else if (from && to && from.getTime() > to.getTime()) {
      rangeError = 'La fecha desde no puede ser mayor que la hasta';
    }
  }

  const changeStatus = (value) => {
    setStatus(value);
    setLimit(PAGE_SIZE);
  };

  const changeRole = (value) => {
    setRole(value);
    setLimit(PAGE_SIZE);
  };

  const changePeriod = (value) => {
    setPeriod(value);
    setLimit(PAGE_SIZE);
  };

  const changePayment = (value) => {
    setPaymentMethod(value);
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
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.filters}>
            <Text style={styles.filterLabel}>Estado</Text>
            <ChipRow options={HISTORY_STATUS_FILTERS} value={status} onChange={changeStatus} />
            <Text style={styles.filterLabel}>Rol</Text>
            <ChipRow options={HISTORY_ROLE_FILTERS} value={role} onChange={changeRole} />
            <Text style={styles.filterLabel}>Fecha</Text>
            <ChipRow options={HISTORY_PERIOD_FILTERS} value={period} onChange={changePeriod} />
            {period === 'range' ? (
              <>
                <View style={styles.rangeRow}>
                  <View style={styles.rangeField}>
                    <Input
                      label="Desde"
                      value={fromText}
                      onChangeText={(text) => {
                        setFromText(formatDateInput(text));
                        setLimit(PAGE_SIZE);
                      }}
                      keyboardType="number-pad"
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.rangeField}>
                    <Input
                      label="Hasta"
                      value={toText}
                      onChangeText={(text) => {
                        setToText(formatDateInput(text));
                        setLimit(PAGE_SIZE);
                      }}
                      keyboardType="number-pad"
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                    />
                  </View>
                </View>
                {rangeError ? <Text style={styles.rangeError}>{rangeError}</Text> : null}
              </>
            ) : null}
            <Text style={styles.filterLabel}>Pago</Text>
            <ChipRow
              options={HISTORY_PAYMENT_FILTERS}
              value={paymentMethod}
              onChange={changePayment}
            />
            <ErrorText message={error} />
          </View>
        }
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
  filters: { gap: spacing.xs, marginBottom: spacing.sm },
  filterLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  rangeRow: { flexDirection: 'row', gap: spacing.sm },
  rangeField: { flex: 1 },
  rangeError: { color: colors.danger, fontSize: fontSize.sm },
  list: { padding: spacing.lg, gap: spacing.sm },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  date: { fontSize: fontSize.sm, color: colors.textSecondary },
  status: { fontSize: fontSize.sm, color: colors.textSecondary },
  route: { fontSize: fontSize.md, color: colors.textPrimary, marginBottom: spacing.xs },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amounts: { alignItems: 'flex-end' },
  amountNote: { fontSize: fontSize.sm, color: colors.textSecondary },
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
