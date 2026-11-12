import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { PRICING } from '../config/pricing';
import { formatPrice } from '../utils/format';
import {
  EARNINGS_PERIODS,
  EARNINGS_PERIOD_LABEL,
  summarizeEarnings,
} from '../utils/earnings';
import ErrorText from '../components/ErrorText';
import ScreenContainer from '../components/ScreenContainer';
import useRideHistory from '../hooks/useRideHistory';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

const PERIODS = Object.values(EARNINGS_PERIODS);

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Line({ label, value, strong }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, strong && styles.lineStrong]}>{label}</Text>
      <Text style={[styles.lineValue, strong && styles.lineStrong]}>{value}</Text>
    </View>
  );
}

export default function EarningsScreen() {
  const { rides, loading, error } = useRideHistory();
  const [period, setPeriod] = useState(EARNINGS_PERIODS.TODAY);

  const totals = useMemo(() => summarizeEarnings(rides, period), [rides, period]);

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.periods}>
        {PERIODS.map((value) => {
          const active = value === period;
          return (
            <Pressable
              key={value}
              onPress={() => setPeriod(value)}
              style={[styles.period, active && styles.periodActive]}
            >
              <Text style={[styles.periodText, active && styles.periodTextActive]}>
                {EARNINGS_PERIOD_LABEL[value]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ErrorText message={error} />

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Ganancia neta · {EARNINGS_PERIOD_LABEL[period]}</Text>
        <Text style={styles.heroValue}>{formatPrice(totals.net)}</Text>
        <Text style={styles.heroMeta}>
          {totals.trips} {totals.trips === 1 ? 'viaje' : 'viajes'} · propinas{' '}
          {formatPrice(totals.tips)}
        </Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Bruto" value={formatPrice(totals.gross)} />
        <Stat
          label={`Comisión ${Math.round(PRICING.COMMISSION_RATE * 100)}%`}
          value={formatPrice(totals.commission)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Desglose</Text>
        <Line label="Tarifas cobradas" value={formatPrice(totals.gross)} />
        <Line label="Comisión de la plataforma" value={`- ${formatPrice(totals.commission)}`} />
        <Line label="Propinas (100% para ti)" value={formatPrice(totals.tips)} />
        <View style={styles.divider} />
        <Line label="Total a recibir" value={formatPrice(totals.net)} strong />
      </View>

      <Text style={styles.note}>
        Solo se cuentan los viajes finalizados y pagados. La comisión se guarda por viaje al
        momento de aceptarlo.
      </Text>

      {totals.trips === 0 ? (
        <Text style={styles.note}>Todavía no hay viajes finalizados en este período.</Text>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  periods: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  period: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  periodTextActive: { color: colors.primaryText },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroLabel: { color: colors.textInverse, fontSize: fontSize.sm, marginBottom: spacing.xs, opacity: 0.8 },
  heroValue: { color: colors.primaryText, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  heroMeta: { color: colors.textInverse, fontSize: fontSize.sm, marginTop: spacing.xs, opacity: 0.8 },
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  statLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineLabel: { color: colors.textSecondary, fontSize: fontSize.sm, flex: 1 },
  lineValue: { color: colors.textPrimary, fontSize: fontSize.sm },
  lineStrong: { fontWeight: fontWeight.bold, color: colors.textPrimary, fontSize: fontSize.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  note: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.sm },
});
