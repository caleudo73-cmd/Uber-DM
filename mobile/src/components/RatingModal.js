import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../config/theme';
import { ratingLabel } from '../utils/ratings';
import Button from './Button';
import ErrorText from './ErrorText';
import RatingInput from './RatingInput';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

export default function RatingModal({ visible, ride, loading, error, onRate, onClose }) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(0);
  const driverName = ride?.driverName ?? 'tu conductor';

  // Cada vez que se abre, empieza sin estrellas.
  useEffect(() => {
    if (visible) setValue(0);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Califica tu viaje</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.initial}>{(driverName[0] ?? 'C').toUpperCase()}</Text>
          </View>

          <Text style={styles.question}>¿Cómo estuvo el viaje con {driverName}?</Text>
          <Text style={styles.meta}>Tu calificación ayuda a otros pasajeros a elegir.</Text>

          <View style={styles.stars}>
            <RatingInput value={value} onChange={setValue} size={40} />
          </View>
          <Text style={styles.label}>{ratingLabel(value) ?? 'Toca las estrellas'}</Text>

          <ErrorText message={error} />

          <View style={styles.actions}>
            <Button
              title="Enviar calificación"
              variant="accent"
              disabled={!value}
              loading={loading}
              onPress={() => onRate(value)}
            />
            <Button title="Ahora no" variant="ghost" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  backdropFill: { flex: 1 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  initial: { color: colors.primaryText, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  question: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  stars: { marginTop: spacing.lg },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.xs },
});
