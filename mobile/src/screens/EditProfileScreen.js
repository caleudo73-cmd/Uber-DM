// AI-assisted: see docs/AI_LOG.md #11, #13
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { DOCUMENT_TYPES, GENDER_OPTIONS, LANGUAGE_OPTIONS } from '../config/driverRegistration';
import Button from '../components/Button';
import Choice, { LabeledChoice } from '../components/Choice';
import DateField, { yearsAgoDate } from '../components/DateField';
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
  isValidBirthDate,
  isValidDocumentNumber,
  isValidFullName,
  isValidPhone,
  onlyDigits,
  toISODate,
} from '../utils/validators';

const { colors, spacing, fontSize, fontWeight } = theme;

const required = (value) => String(value ?? '').trim().length > 0;

const validate = (values) => {
  const errors = {};
  if (!isValidFullName(values.name)) errors.name = 'Escribe nombre y apellido (solo letras)';
  if (!isValidPhone(values.phone)) errors.phone = 'Celular de 10 dígitos que empiece por 3';
  if (!isValidDocumentNumber(values.documentNumber)) errors.documentNumber = 'Entre 6 y 10 dígitos';
  if (!isValidBirthDate(values.birthDate)) errors.birthDate = 'Debes tener entre 18 y 80 años';
  if (!required(values.gender)) errors.gender = 'Selecciona tu género';
  if (!required(values.language)) errors.language = 'Selecciona el idioma';
  if (!required(values.city)) errors.city = 'Escribe tu ciudad';
  if (String(values.address ?? '').trim().length < 5) {
    errors.address = 'Escribe tu dirección (mínimo 5 caracteres)';
  }
  return errors;
};

const normalize = (name, value) => {
  if (name === 'phone' || name === 'documentNumber') return onlyDigits(value);
  if (name === 'birthDate') return formatDateInput(value);
  return value;
};

// Edición de los datos personales. El correo de la cuenta lo administra
// Firebase Auth, por eso se muestra de solo lectura.
export default function EditProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [photo, setPhoto] = useDocumentPhoto('profile');

  const form = useProfileForm({
    initialValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      documentType: user?.documentType ?? 'CC',
      documentNumber: user?.documentNumber ?? '',
      birthDate: fromISODate(user?.birthDate),
      gender: user?.gender ?? '',
      language: user?.language ?? 'es',
      city: user?.city ?? '',
      address: user?.address ?? '',
    },
    validate,
    normalize,
    onSubmit: async (values) => {
      if (!photo?.uri) throw new Error('Sube tu foto de perfil');

      await userService.updateProfileFields(user.id, {
        name: values.name.trim().replace(/\s+/g, ' '),
        phone: onlyDigits(values.phone),
        documentType: values.documentType,
        documentNumber: onlyDigits(values.documentNumber),
        birthDate: toISODate(values.birthDate),
        gender: values.gender,
        language: values.language,
        city: values.city.trim(),
        address: values.address.trim(),
      });

      if (photo.base64) await userService.saveDocumentPhoto(user.id, 'profile', photo);
      return true;
    },
  });

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <PhotoPicker
          label="Foto de perfil"
          hint="De frente y con buena luz"
          value={photo}
          onChange={setPhoto}
        />

        <Input
          label="Correo electrónico"
          value={user?.email ?? ''}
          editable={false}
          hint="El correo de la cuenta no se puede cambiar desde aquí."
        />

        <Input
          label="Nombre completo"
          value={form.values.name}
          onChangeText={(text) => form.setField('name', text)}
          autoCapitalize="words"
          placeholder="Ej. Ana María Pérez"
          error={form.errors.name}
        />
        <Input
          label="Celular"
          value={form.values.phone}
          onChangeText={(text) => form.setField('phone', text)}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="3001234567"
          error={form.errors.phone}
        />

        <LabeledChoice label="Tipo de documento">
          <Choice
            options={DOCUMENT_TYPES}
            value={form.values.documentType}
            onChange={(value) => form.setField('documentType', value)}
          />
        </LabeledChoice>

        <Input
          label="Número de documento"
          value={form.values.documentNumber}
          onChangeText={(text) => form.setField('documentNumber', text)}
          keyboardType="number-pad"
          maxLength={10}
          error={form.errors.documentNumber}
        />
        <DateField
          label="Fecha de nacimiento"
          value={form.values.birthDate}
          onChangeText={(text) => form.setField('birthDate', text)}
          hint="Debes tener entre 18 y 80 años"
          error={form.errors.birthDate}
          minimumDate={yearsAgoDate(80)}
          maximumDate={yearsAgoDate(18)}
        />

        <LabeledChoice label="Género" error={form.errors.gender}>
          <Choice
            options={GENDER_OPTIONS}
            value={form.values.gender}
            onChange={(value) => form.setField('gender', value)}
          />
        </LabeledChoice>

        <Input
          label="Ciudad"
          value={form.values.city}
          onChangeText={(text) => form.setField('city', text)}
          autoCapitalize="words"
          error={form.errors.city}
        />
        <Input
          label="Dirección"
          value={form.values.address}
          onChangeText={(text) => form.setField('address', text)}
          autoCapitalize="sentences"
          placeholder="Calle 10 # 20-30"
          error={form.errors.address}
        />

        <LabeledChoice label="Idioma" error={form.errors.language}>
          <Choice
            options={LANGUAGE_OPTIONS}
            value={form.values.language}
            onChange={(value) => form.setField('language', value)}
          />
        </LabeledChoice>

        <ErrorText message={form.error} />
        {form.saved ? (
          <View style={styles.savedBox}>
            <Text style={styles.savedText}>Cambios guardados.</Text>
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
  savedBox: {
    backgroundColor: colors.surface,
    borderRadius: theme.radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  savedText: { color: colors.success, fontWeight: fontWeight.medium, fontSize: fontSize.sm },
  gap: { height: spacing.sm },
});
