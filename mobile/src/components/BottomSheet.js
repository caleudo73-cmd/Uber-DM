import { StyleSheet, View } from 'react-native';
import theme from '../config/theme';

const { colors, spacing, radius } = theme;

export default function BottomSheet({ children }) {
  return <View style={styles.sheet}>{children}</View>;
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
});
