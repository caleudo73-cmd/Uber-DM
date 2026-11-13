// AI-assisted: see docs/AI_LOG.md #13
import { StyleSheet, Text, TextInput, View } from 'react-native';
import theme from '../config/theme';

const { colors, spacing, radius, fontSize } = theme;

export default function Input({ label, error, hint, rightAccessory, inputStyle, ...props }) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, error && styles.fieldError]}>
        <TextInput
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          style={[styles.input, inputStyle]}
          {...props}
        />
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldError: { borderColor: colors.danger },
  input: {
    flex: 1,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  accessory: { paddingRight: spacing.md },
  error: { color: colors.danger, fontSize: fontSize.sm, marginTop: spacing.xs },
  hint: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
});
