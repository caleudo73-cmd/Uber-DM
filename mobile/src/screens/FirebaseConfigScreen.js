import { StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { missingFirebaseKeys } from '../config/env';

const { colors, spacing, fontSize, fontWeight } = theme;

// Se muestra en lugar de la app cuando faltan las variables de mobile/.env.
export default function FirebaseConfigScreen({ message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Falta configurar Firebase</Text>
      <Text style={styles.text}>{message}</Text>

      <View style={styles.box}>
        <Text style={styles.step}>1. Copia mobile/.env.example a mobile/.env</Text>
        <Text style={styles.step}>2. Pega los valores de tu proyecto Firebase</Text>
        <Text style={styles.step}>3. Reinicia con: npx expo start -c</Text>
      </View>

      <Text style={styles.missing}>Variables pendientes:</Text>
      {missingFirebaseKeys.map((key) => (
        <Text key={key} style={styles.key}>
          • {key}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  text: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg },
  box: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg },
  step: { color: colors.textPrimary, marginBottom: spacing.xs },
  missing: { fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  key: { color: colors.danger, marginBottom: 2 },
});
