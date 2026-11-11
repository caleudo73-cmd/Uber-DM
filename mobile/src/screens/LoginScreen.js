import { StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import Button from '../components/Button';
import ErrorText from '../components/ErrorText';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';
import useLoginForm from '../hooks/useLoginForm';

export default function LoginScreen({ navigation }) {
  const form = useLoginForm();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <Input label="Correo" value={form.email} onChangeText={form.setEmail} keyboardType="email-address" />
        <Input label="Contraseña" value={form.password} onChangeText={form.setPassword} secureTextEntry />
        <ErrorText message={form.error} />

        <Button title="Entrar" onPress={form.submit} loading={form.loading} />
        <View style={styles.gap} />
        <Button title="Crear cuenta" variant="ghost" onPress={() => navigation.navigate('Register')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  subtitle: { color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  gap: { height: theme.spacing.sm },
});
