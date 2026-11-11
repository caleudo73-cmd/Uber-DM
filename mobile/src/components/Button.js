import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import theme from '../config/theme';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

const VARIANTS = {
  primary: { bg: colors.primary, text: colors.primaryText },
  accent: { bg: colors.accent, text: colors.accentText },
  danger: { bg: colors.danger, text: colors.textInverse },
  ghost: { bg: colors.surface, text: colors.textPrimary },
};

export default function Button({ title, onPress, variant = 'primary', loading, disabled }) {
  const { bg, text } = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={[styles.base, { backgroundColor: bg }, inactive && styles.inactive]}
    >
      {loading ? <ActivityIndicator color={text} /> : <Text style={[styles.text, { color: text }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  inactive: { opacity: 0.5 },
});
