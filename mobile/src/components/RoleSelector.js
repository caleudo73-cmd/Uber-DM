import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { ROLES } from '../config/constants';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

const OPTIONS = [
  { value: ROLES.PASSENGER, label: 'Pasajero' },
  { value: ROLES.DRIVER, label: 'Conductor' },
];

export default function RoleSelector({ value, onChange }) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selected]}
          >
            <Text style={[styles.text, selected && styles.selectedText]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  option: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textPrimary },
  selectedText: { color: colors.primaryText },
});
