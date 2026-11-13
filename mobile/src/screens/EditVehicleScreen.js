// AI-assisted: see docs/AI_LOG.md #11
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../config/theme';
import { CATEGORIES } from '../config/pricing';
import { VEHICLE_CATEGORIES, VEHICLE_COLORS } from '../config/driverRegistration';
import Button from '../components/Button';
import Choice, { LabeledChoice } from '../components/Choice';
import ErrorText from '../components/ErrorText';
import Input from '../components/Input';
import PhotoPicker from '../components/PhotoPicker';
import ScreenContainer from '../components/ScreenContainer';
import useAuth from '../hooks/useAuth';
import useDocumentPhoto from '../hooks/useDocumentPhoto';
import useProfileForm from '../hooks/useProfileForm';
import * as userService from '../services/userService';
import {
  isValidPassengerCapacity,
  isValidPlate,
  isValidVehicleText,
  isValidVehicleYear,
  normalizePlate,
  onlyDigits,
} from '../utils/validators';

const { colors, spacing, fontSize, fontWeight } = theme;

const required = (value) => String(value ?? '').trim().length > 0;

const validate = (values) => {
  const errors = {};
  if (!isValidVehicleText(values.vehicleBrand)) errors.vehicleBrand = 'Entre 1 y 30 caracteres';
  if (!isValidVehicleText(values.vehicleLine)) errors.vehicleLine = 'Entre 1 y 30 caracteres';
  if (!isValidVehicleYear(values.vehicleYear)) errors.vehicleYear = 'Año entre 1990 y el año actual';
  if (!isValidPlate(values.vehiclePlate)) errors.vehiclePlate = 'Placa inválida (ej. ABC123)';
  if (!required(values.vehicleColor)) errors.vehicleColor = 'Selecciona el color';
  if (!isValidPassengerCapacity(values.vehicleCapacity, values.vehicleCategory)) {
    errors.vehicleCapacity =
      values.vehicleCategory === CATEGORIES.XL
        ? 'XL exige mínimo 6 pasajeros'
        : 'Capacidad inválida (mínimo 1)';
  }
  return errors;
};

const normalize = (name, value) => {
  if (name === 'vehicleYear') return onlyDigits(value).slice(0, 4);
  if (name === 'vehicleCapacity') return onlyDigits(value).slice(0, 2);
  if (name === 'vehiclePlate') return normalizePlate(value).slice(0, 6);
  if (name === 'vehicleBrand' || name === 'vehicleLine') return value.slice(0, 30);
  return value;
};

// Edición del vehículo. Los cambios se guardan en users/{uid}.vehicle.
export default function EditVehicleScreen({ navigation }) {
  const { user } = useAuth();
  const [photo, setPhoto] = useDocumentPhoto('vehicle');
  const vehicle = user?.vehicle ?? {};

  const form = useProfileForm({
    initialValues: {
      vehicleBrand: vehicle.brand ?? '',
      vehicleLine: vehicle.line ?? '',
      vehicleYear: String(vehicle.year ?? ''),
      vehiclePlate: vehicle.plate ?? '',
      vehicleColor: vehicle.color ?? '',
      vehicleCapacity: String(vehicle.capacity ?? ''),
      vehicleCategory: vehicle.category ?? CATEGORIES.ECONOMY,
    },
    validate,
    normalize,
    onSubmit: async (values) => {
      if (!photo?.uri) throw new Error('Sube una foto del vehículo donde se vea la placa');

      await userService.updateProfileFields(user.id, {
        vehicle: {
          brand: values.vehicleBrand.trim(),
          line: values.vehicleLine.trim(),
          year: Number(values.vehicleYear),
          plate: normalizePlate(values.vehiclePlate),
          color: values.vehicleColor.trim(),
          category: values.vehicleCategory,
          capacity: Number(values.vehicleCapacity),
        },
      });

      if (photo.base64) await userService.saveDocumentPhoto(user.id, 'vehicle', photo);
      return true;
    },
  });

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Input
          label="Marca"
          value={form.values.vehicleBrand}
          onChangeText={(text) => form.setField('vehicleBrand', text)}
          autoCapitalize="words"
          maxLength={30}
          placeholder="Ej. Renault"
          error={form.errors.vehicleBrand}
        />
        <Input
          label="Línea o modelo"
          value={form.values.vehicleLine}
          onChangeText={(text) => form.setField('vehicleLine', text)}
          autoCapitalize="words"
          maxLength={30}
          placeholder="Ej. Logan"
          error={form.errors.vehicleLine}
        />
        <Input
          label="Año"
          value={form.values.vehicleYear}
          onChangeText={(text) => form.setField('vehicleYear', text)}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="2019"
          error={form.errors.vehicleYear}
        />
        <Input
          label="Placa"
          value={form.values.vehiclePlate}
          onChangeText={(text) => form.setField('vehiclePlate', text)}
          autoCapitalize="characters"
          maxLength={6}
          placeholder="ABC123"
          hint="Formato de carro: ABC123"
          error={form.errors.vehiclePlate}
        />

        <LabeledChoice label="Color" error={form.errors.vehicleColor}>
          <Choice
            options={VEHICLE_COLORS}
            value={form.values.vehicleColor}
            onChange={(value) => form.setField('vehicleColor', value)}
          />
        </LabeledChoice>

        <Input
          label="Capacidad de pasajeros"
          value={form.values.vehicleCapacity}
          onChangeText={(text) => form.setField('vehicleCapacity', text)}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="4"
          hint="La categoría XL exige mínimo 6"
          error={form.errors.vehicleCapacity}
        />

        <LabeledChoice label="Categoría del servicio">
          <Choice
            options={VEHICLE_CATEGORIES}
            value={form.values.vehicleCategory}
            onChange={(value) => form.setField('vehicleCategory', value)}
          />
        </LabeledChoice>

        <PhotoPicker
          label="Foto del vehículo"
          hint="Donde se vea la placa"
          value={photo}
          onChange={setPhoto}
        />

        <ErrorText message={form.error} />
        {form.saved ? (
          <View style={styles.savedBox}>
            <Text style={styles.savedText}>Vehículo actualizado.</Text>
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
