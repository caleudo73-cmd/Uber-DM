import { StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import Button from '../components/Button';
import ErrorText from '../components/ErrorText';
import Input from '../components/Input';
import RoleSelector from '../components/RoleSelector';
import ScreenContainer from '../components/ScreenContainer';
import useRegisterForm from '../hooks/useRegisterForm';

export default function RegisterScreen({ navigation }) {
  const form = useRegisterForm();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Crear cuenta</Text>

        <RoleSelector value={form.role} onChange={form.setRole} />
        <Input label="Nombre" value={form.name} onChangeText={form.setName} autoCapitalize="words" />
        <Input label="Correo" value={form.email} onChangeText={form.setEmail} keyboardType="email-address" />
        <Input label="Contraseña" value={form.password} onChangeText={form.setPassword} secureTextEntry />
        <ErrorText message={form.error} />

        <Button title="Registrarme" onPress={form.submit} loading={form.loading} />
        <View style={styles.gap} />
        <Button title="Ya tengo cuenta" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center' },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  gap: { height: theme.spacing.sm },
});
