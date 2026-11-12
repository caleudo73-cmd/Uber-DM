import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { ROLES } from '../config/constants';
import Button from '../components/Button';
import DriverRegisterForm from '../components/DriverRegisterForm';
import ErrorText from '../components/ErrorText';
import Input from '../components/Input';
import RoleSelector from '../components/RoleSelector';
import ScreenContainer from '../components/ScreenContainer';
import useDriverRegisterForm from '../hooks/useDriverRegisterForm';
import useRegisterForm from '../hooks/useRegisterForm';

const { colors, spacing, fontSize, fontWeight } = theme;

function PassengerFields({ form }) {
  return (
    <>
      <Input label="Nombre" value={form.name} onChangeText={form.setName} autoCapitalize="words" />
      <Input
        label="Correo"
        value={form.email}
        onChangeText={form.setEmail}
        keyboardType="email-address"
      />
      <Input
        label="Contraseña"
        value={form.password}
        onChangeText={form.setPassword}
        secureTextEntry
      />
      <ErrorText message={form.error} />

      <Button title="Registrarme" onPress={form.submit} loading={form.loading} />
    </>
  );
}

export default function RegisterScreen({ navigation }) {
  const form = useRegisterForm();
  const driverForm = useDriverRegisterForm();
  const isDriver = form.role === ROLES.DRIVER;

  return (
    <ScreenContainer padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{isDriver ? 'Registro de conductor' : 'Crear cuenta'}</Text>
          <Text style={styles.subtitle}>
            {isDriver
              ? 'Completa los tres pasos. Revisaremos tus documentos antes de activar tu cuenta.'
              : 'Pide viajes en segundos.'}
          </Text>

          <RoleSelector value={form.role} onChange={form.setRole} />

          {isDriver ? <DriverRegisterForm form={driverForm} /> : <PassengerFields form={form} />}

          <View style={styles.gap} />
          <Button title="Ya tengo cuenta" variant="ghost" onPress={() => navigation.goBack()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xl },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  gap: { height: spacing.sm },
});
