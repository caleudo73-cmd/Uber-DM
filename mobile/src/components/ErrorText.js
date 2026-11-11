import { StyleSheet, Text } from 'react-native';
import theme from '../config/theme';

export default function ErrorText({ message }) {
  return message ? <Text style={styles.text}>{message}</Text> : null;
}

const styles = StyleSheet.create({
  text: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
});
