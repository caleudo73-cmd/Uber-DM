// AI-assisted: see docs/AI_LOG.md #11
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { REQUIRED_DOCUMENTS } from '../config/driverRegistration';
import Button from '../components/Button';
import ErrorText from '../components/ErrorText';
import Input from '../components/Input';
import PhotoPicker from '../components/PhotoPicker';
import ScreenContainer from '../components/ScreenContainer';
import useAuth from '../hooks/useAuth';
import useDocumentPhoto from '../hooks/useDocumentPhoto';
import useProfileForm from '../hooks/useProfileForm';
import * as userService from '../services/userService';
import {
  formatDateInput,
  fromISODate,
  isNotExpired,
  isValidEmail,
  isValidLicenseNumber,
  isValidSoatNumber,
  isValidTechnomechanicalNumber,
  toISODate,
} from '../utils/validators';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

const DOCUMENT_FIELD = {
  license: {
    number: 'licenseNumber',
    expiry: 'licenseExpiresAt',
    validateNumber: isValidLicenseNumber,
    numberError: 'Número de licencia inválido',
    expiryError: 'La licencia debe estar vigente',
  },
  soat: {
    number: 'soatNumber',
    expiry: 'soatExpiresAt',
    validateNumber: isValidSoatNumber,
    numberError: 'Número de SOAT inválido',
    expiryError: 'El SOAT debe estar vigente',
  },
  technomechanical: {
    number: 'technomechanicalNumber',
    expiry: 'technomechanicalExpiresAt',
    validateNumber: isValidTechnomechanicalNumber,
    numberError: 'Número de certificado inválido',
    expiryError: 'La tecnomecánica debe estar vigente',
  },
};

const validate = (values) => {
  const errors = {};
  REQUIRED_DOCUMENTS.forEach((document) => {
    const fields = DOCUMENT_FIELD[document.key];
    if (!fields.validateNumber(values[fields.number])) errors[fields.number] = fields.numberError;
    if (!isNotExpired(values[fields.expiry])) errors[fields.expiry] = fields.expiryError;
  });
  if (!isValidEmail(values.mercadoPagoEmail)) {
    errors.mercadoPagoEmail = 'Correo de Mercado Pago inválido';
  }
  return errors;
};

const normalize = (name, value) =>
  name.endsWith('ExpiresAt') ? formatDateInput(value) : value;

// Edición de documentos y del correo de Mercado Pago.
// Las fotos se guardan aparte, en users/{uid}/documents/{key}.
export default function EditDocumentsScreen({ navigation }) {
  const { user } = useAuth();
  const documents = user?.documents ?? {};
  const [licensePhoto, setLicensePhoto] = useDocumentPhoto('license');
  const [soatPhoto, setSoatPhoto] = useDocumentPhoto('soat');
  const [technomechanicalPhoto, setTechnomechanicalPhoto] = useDocumentPhoto('technomechanical');

  const photos = {
    license: [licensePhoto, setLicensePhoto],
    soat: [soatPhoto, setSoatPhoto],
    technomechanical: [technomechanicalPhoto, setTechnomechanicalPhoto],
  };

  const form = useProfileForm({
    initialValues: {
      licenseNumber: documents.license?.number ?? '',
      licenseExpiresAt: fromISODate(documents.license?.expiresAt),
      soatNumber: documents.soat?.number ?? '',
      soatExpiresAt: fromISODate(documents.soat?.expiresAt),
      technomechanicalNumber: documents.technomechanical?.number ?? '',
      technomechanicalExpiresAt: fromISODate(documents.technomechanical?.expiresAt),
      mercadoPagoEmail: user?.mercadoPagoEmail ?? '',
    },
    validate,
    normalize,
    onSubmit: async (values) => {
      const missing = REQUIRED_DOCUMENTS.find((document) => !photos[document.key][0]?.uri);
      if (missing) throw new Error(`Sube la foto de ${missing.label.toLowerCase()}`);

      await userService.updateProfileFields(user.id, {
        documents: {
          license: {
            number: values.licenseNumber.trim(),
            expiresAt: toISODate(values.licenseExpiresAt),
          },
          soat: {
            number: values.soatNumber.trim(),
            expiresAt: toISODate(values.soatExpiresAt),
          },
          technomechanical: {
            number: values.technomechanicalNumber.trim(),
            expiresAt: toISODate(values.technomechanicalExpiresAt),
          },
        },
        mercadoPagoEmail: values.mercadoPagoEmail.trim().toLowerCase(),
      });

      await Promise.all(
        REQUIRED_DOCUMENTS.map((document) => {
          const [photo] = photos[document.key];
          return photo?.base64
            ? userService.saveDocumentPhoto(user.id, document.key, photo)
            : Promise.resolve();
        })
      );
      return true;
    },
  });

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {REQUIRED_DOCUMENTS.map((document) => {
          const fields = DOCUMENT_FIELD[document.key];
          const [photo, setPhoto] = photos[document.key];
          return (
            <View key={document.key} style={styles.document}>
              <Text style={styles.documentTitle}>{document.label}</Text>
              <Input
                label={document.numberLabel}
                value={form.values[fields.number]}
                onChangeText={(text) => form.setField(fields.number, text)}
                autoCapitalize="characters"
                error={form.errors[fields.number]}
              />
              <Input
                label={document.expiryLabel}
                value={form.values[fields.expiry]}
                onChangeText={(text) => form.setField(fields.expiry, text)}
                keyboardType="number-pad"
                placeholder="DD/MM/AAAA"
                maxLength={10}
                hint="Debe ser posterior a hoy"
                error={form.errors[fields.expiry]}
              />
              <PhotoPicker
                label="Foto del documento"
                hint={document.photoHint}
                value={photo}
                onChange={setPhoto}
              />
            </View>
          );
        })}

        <Input
          label="Correo de Mercado Pago"
          value={form.values.mercadoPagoEmail}
          onChangeText={(text) => form.setField('mercadoPagoEmail', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="correo@ejemplo.com"
          hint="Donde recibirías tus pagos"
          error={form.errors.mercadoPagoEmail}
        />

        <ErrorText message={form.error} />
        {form.saved ? (
          <View style={styles.savedBox}>
            <Text style={styles.savedText}>Documentos actualizados.</Text>
          </View>
        ) : null}

        <Button title="Guardar cambios" onPress={form.submit} loading={form.loading} />
        <View style={styles.gap} />
        <Button title="Cancelar" variant="ghost" onPress={() => navigation.goBack()} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  document: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  documentTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  savedBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  savedText: { color: colors.success, fontWeight: fontWeight.medium, fontSize: fontSize.sm },
  gap: { height: spacing.sm },
});
