import { StyleSheet, Text } from 'react-native';
import theme from '../config/theme';

const TOTAL = 5;

export default function StarRating({ value, size = theme.fontSize.lg }) {
  const filled = Math.round(value ?? 0);
  return (
    <Text style={{ fontSize: size }}>
      <Text style={styles.filled}>{'★'.repeat(filled)}</Text>
      <Text style={styles.empty}>{'★'.repeat(TOTAL - filled)}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  filled: { color: theme.colors.star },
  empty: { color: theme.colors.starEmpty },
});