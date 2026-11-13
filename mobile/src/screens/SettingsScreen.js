// AI-assisted: see docs/AI_LOG.md #11
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { APPROVAL_STATUS, APPROVAL_STATUS_LABEL, ROLE_LABEL, ROLES } from '../config/constants';
import { LANGUAGE_OPTIONS } from '../config/driverRegistration';
import Button from '../components/Button';
import Choice, { LabeledChoice } from '../components/Choice';
import ErrorText from '../components/ErrorText';
import ScreenContainer from '../components/ScreenContainer';
import useAsyncAction from '../hooks/useAsyncAction';
import useAuth from '../hooks/useAuth';
import * as userService from '../services/userService';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// Configuración de la cuenta: idioma, datos de la sesión y cierre de sesión.
// La interfaz sigue en español; el idioma queda guardado en el perfil.
export default function SettingsScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [language, setLanguage] = useState(user?.language ?? 'es');
  const [saved, setSaved] = useState(false);
  const { run, loading, error } = useAsyncAction((value) =>
    userService.updateProfileFields(user.id, { language: value })
  );

  const changeLanguage = async (value) => {
    setLanguage(value);
    setSaved(false);
    const result = await run(value);
    if (result !== null) setSaved(true);
  };

  const isDriver = user?.role === ROLES.DRIVER;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cuenta</Text>
          <InfoRow label="Nombre" value={user?.name ?? '—'} />
          <InfoRow label="Correo" value={user?.email ?? '—'} />
          <InfoRow label="Rol" value={ROLE_LABEL[user?.role] ?? '—'} />
          {isDriver ? (
            <InfoRow
              label="Aprobación"
              value={APPROVAL_STATUS_LABEL[user?.approvalStatus] ?? '—'}
            />
          ) : null}
          {isDriver && user?.approvalStatus !== APPROVAL_STATUS.APPROVED ? (
            <Text style={styles.note}>
              Mientras tu cuenta no esté aprobada no podrás ponerte Disponible.
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Idioma</Text>
          <LabeledChoice label="Idioma preferido">
            <Choice options={LANGUAGE_OPTIONS} value={language} onChange={changeLanguage} />
          </LabeledChoice>
          <Text style={styles.note}>
            El idioma se guarda en tu perfil. La interfaz de esta versión está en español.
          </Text>
          <ErrorText message={error} />
          {loading ? <Text style={styles.note}>Guardando…</Text> : null}
          {saved && !loading ? <Text style={styles.savedText}>Preferencia guardada.</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Editar mi información</Text>
          <Button
            title="Datos personales"
            variant="ghost"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <View style={styles.gap} />
          {isDriver ? (
            <>
              <Button
                title="Vehículo"
                variant="ghost"
                onPress={() => navigation.navigate('EditVehicle')}
              />
              <View style={styles.gap} />
              <Button
                title="Documentos y pagos"
                variant="ghost"
                onPress={() => navigation.navigate('EditDocuments')}
              />
              <View style={styles.gap} />
            </>
          ) : null}
          <Button title="Cerrar sesión" variant="danger" onPress={signOut} />
        </View>

        <Text style={styles.footer}>Uber App · versión conductor 1.0.0</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  rowLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  note: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.sm },
  savedText: { color: colors.success, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  gap: { height: spacing.sm },
  footer: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
});
