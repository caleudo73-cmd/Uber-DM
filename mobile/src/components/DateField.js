// AI-assisted: see docs/AI_LOG.md #13
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';
import { parseDateInput } from '../utils/validators';
import Input from './Input';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

const pad = (value) => String(value).padStart(2, '0');

const toDisplayDate = (date) =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

// Límites reutilizables por los formularios.
export const yearsAgoDate = (years, now = new Date()) =>
  new Date(now.getFullYear() - years, now.getMonth(), now.getDate());

export const tomorrowDate = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

/**
 * Campo de fecha DD/MM/AAAA con selector nativo.
 *
 * El texto sigue siendo editable (se conserva el teclado numérico y las
 * validaciones existentes); el botón del calendario abre el selector nativo.
 * En Android se muestra como diálogo y en iOS como rueda con botón "Listo".
 */
export default function DateField({
  value,
  onChangeText,
  minimumDate,
  maximumDate,
  hint,
  error,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(new Date(2000, 0, 1));

  const openPicker = () => {
    const parsed = parseDateInput(value);
    setDraft(parsed ?? maximumDate ?? new Date(2000, 0, 1));
    setOpen(true);
  };

  const handleChange = (event, date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event?.type === 'set' && date) onChangeText(toDisplayDate(date));
      return;
    }
    if (date) setDraft(date);
  };

  const confirmIos = () => {
    onChangeText(toDisplayDate(draft));
    setOpen(false);
  };

  return (
    <View>
      <Input
        {...props}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        placeholder="DD/MM/AAAA"
        maxLength={10}
        hint={open ? undefined : hint}
        error={error}
        rightAccessory={
          <Pressable
            onPress={openPicker}
            accessibilityRole="button"
            accessibilityLabel="Abrir calendario"
            hitSlop={8}
          >
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      {open ? (
        <View style={styles.pickerBox}>
          <DateTimePicker
            value={draft}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={confirmIos} style={styles.confirm}>
              <Text style={styles.confirmText}>Listo</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pickerBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  confirm: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  confirmText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});
