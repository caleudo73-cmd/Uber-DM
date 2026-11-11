import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import theme from '../config/theme';

export default function ScreenContainer({ children, padded = true }) {
  return <SafeAreaView style={[styles.container, padded && styles.padded]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  padded: { padding: theme.spacing.lg },
});
