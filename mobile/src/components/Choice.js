// AI-assisted: see docs/AI_LOG.md #8, #11
import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

// Fila de opciones seleccionables (listas desplegables de la especificación).
export default function Choice({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.choice, selected && styles.choiceSelected]}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Etiqueta + opciones + mensaje de error, como en los formularios.
export function LabeledChoice({ label, error, children }) {
  return (
    <View style={styles.labeled}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  choice: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  textSelected: { color: colors.primaryText },
  labeled: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs },
  error: { color: colors.danger, fontSize: fontSize.sm, marginTop: spacing.xs },
});
