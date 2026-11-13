// AI-assisted: see docs/AI_LOG.md #8
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';
import { PRICING } from '../config/pricing';
import {
  DOCUMENT_TYPES,
  DRIVER_STEPS,
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS,
  REQUIRED_DOCUMENTS,
  VEHICLE_CATEGORIES,
  VEHICLE_COLORS,
} from '../config/driverRegistration';
import Button from './Button';
import Choice, { LabeledChoice } from './Choice';
import ErrorText from './ErrorText';
import Input from './Input';
import PhotoPicker from './PhotoPicker';
import TabBar from './TabBar';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

const DOCUMENT_FIELD = {
  license: { number: 'licenseNumber', expiry: 'licenseExpiresAt' },
  soat: { number: 'soatNumber', expiry: 'soatExpiresAt' },
  technomechanical: { number: 'technomechanicalNumber', expiry: 'technomechanicalExpiresAt' },
};

function PersonalStep({ form }) {
  const { values, errors, setField, photos, setPhoto } = form;

  return (
    <>
      <PhotoPicker
        label="Foto de perfil"
        hint="De frente y con buena luz"
        value={photos.profile}
        onChange={(photo) => setPhoto('profile', photo)}
        error={errors.photo_profile}
      />

      <Input
        label="Nombre completo"
        value={values.name}
        onChangeText={(text) => setField('name', text)}
        autoCapitalize="words"
        placeholder="Ej. Ana María Pérez"
        error={errors.name}
      />
      <Input
        label="Correo electrónico"
        value={values.email}
        onChangeText={(text) => setField('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="correo@ejemplo.com"
        error={errors.email}
      />
      <Input
        label="Contraseña"
        value={values.password}
        onChangeText={(text) => setField('password', text)}
        secureTextEntry
        placeholder="Mínimo 6 caracteres"
        error={errors.password}
      />
      <Input
        label="Confirmar contraseña"
        value={values.confirmPassword}
        onChangeText={(text) => setField('confirmPassword', text)}
        secureTextEntry
        error={errors.confirmPassword}
      />

      <LabeledChoice label="Tipo de documento">
        <Choice
          options={DOCUMENT_TYPES}
          value={values.documentType}
          onChange={(value) => setField('documentType', value)}
        />
      </LabeledChoice>

      <Input
        label="Número de documento"
        value={values.documentNumber}
        onChangeText={(text) => setField('documentNumber', text)}
        keyboardType="number-pad"
        maxLength={10}
        error={errors.documentNumber}
      />
      <Input
        label="Fecha de nacimiento"
        value={values.birthDate}
        onChangeText={(text) => setField('birthDate', text)}
        keyboardType="number-pad"
        placeholder="DD/MM/AAAA"
        maxLength={10}
        hint="Debes tener entre 18 y 80 años"
        error={errors.birthDate}
      />
      <Input
        label="Celular"
        value={values.phone}
        onChangeText={(text) => setField('phone', text)}
        keyboardType="phone-pad"
        maxLength={10}
        placeholder="3001234567"
        error={errors.phone}
      />

      <LabeledChoice label="Género" error={errors.gender}>
        <Choice
          options={GENDER_OPTIONS}
          value={values.gender}
          onChange={(value) => setField('gender', value)}
        />
      </LabeledChoice>

      <Input
        label="Ciudad"
        value={values.city}
        onChangeText={(text) => setField('city', text)}
        autoCapitalize="words"
        error={errors.city}
      />
      <Input
        label="Dirección"
        value={values.address}
        onChangeText={(text) => setField('address', text)}
        autoCapitalize="sentences"
        placeholder="Calle 10 # 20-30"
        error={errors.address}
      />

      <LabeledChoice label="Idioma" error={errors.language}>
        <Choice
          options={LANGUAGE_OPTIONS}
          value={values.language}
          onChange={(value) => setField('language', value)}
        />
      </LabeledChoice>
    </>
  );
}

function VehicleStep({ form }) {
  const { values, errors, setField, photos, setPhoto } = form;

  return (
    <>
      <Input
        label="Marca"
        value={values.vehicleBrand}
        onChangeText={(text) => setField('vehicleBrand', text)}
        autoCapitalize="words"
        maxLength={30}
        placeholder="Ej. Renault"
        error={errors.vehicleBrand}
      />
      <Input
        label="Línea o modelo"
        value={values.vehicleLine}
        onChangeText={(text) => setField('vehicleLine', text)}
        autoCapitalize="words"
        maxLength={30}
        placeholder="Ej. Logan"
        error={errors.vehicleLine}
      />
      <Input
        label="Año"
        value={values.vehicleYear}
        onChangeText={(text) => setField('vehicleYear', text)}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="2019"
        error={errors.vehicleYear}
      />
      <Input
        label="Placa"
        value={values.vehiclePlate}
        onChangeText={(text) => setField('vehiclePlate', text)}
        autoCapitalize="characters"
        maxLength={6}
        placeholder="ABC123"
        hint="Formato de carro: ABC123"
        error={errors.vehiclePlate}
      />
      <LabeledChoice label="Color" error={errors.vehicleColor}>
        <Choice
          options={VEHICLE_COLORS}
          value={values.vehicleColor}
          onChange={(value) => setField('vehicleColor', value)}
        />
      </LabeledChoice>
      <Input
        label="Capacidad de pasajeros"
        value={values.vehicleCapacity}
        onChangeText={(text) => setField('vehicleCapacity', text)}
        keyboardType="number-pad"
        maxLength={2}
        placeholder="4"
        hint="La categoría XL exige mínimo 6"
        error={errors.vehicleCapacity}
      />

      <LabeledChoice label="Categoría del servicio" error={errors.vehicleCategory}>
        <Choice
          options={VEHICLE_CATEGORIES}
          value={values.vehicleCategory}
          onChange={(value) => setField('vehicleCategory', value)}
        />
      </LabeledChoice>

      <PhotoPicker
        label="Foto del vehículo"
        hint="Donde se vea la placa"
        value={photos.vehicle}
        onChange={(photo) => setPhoto('vehicle', photo)}
        error={errors.photo_vehicle}
      />
    </>
  );
}

function DocumentsStep({ form }) {
  const { values, errors, setField, photos, setPhoto } = form;

  return (
    <>
      {REQUIRED_DOCUMENTS.map((document) => {
        const fields = DOCUMENT_FIELD[document.key];
        return (
          <View key={document.key} style={styles.document}>
            <Text style={styles.documentTitle}>{document.label}</Text>
            <Input
              label={document.numberLabel}
              value={values[fields.number]}
              onChangeText={(text) => setField(fields.number, text)}
              autoCapitalize="characters"
              error={errors[fields.number]}
            />
            <Input
              label={document.expiryLabel}
              value={values[fields.expiry]}
              onChangeText={(text) => setField(fields.expiry, text)}
              keyboardType="number-pad"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              error={errors[fields.expiry]}
            />
            <PhotoPicker
              label="Foto del documento"
              hint={document.photoHint}
              value={photos[document.key]}
              onChange={(photo) => setPhoto(document.key, photo)}
              error={errors[`photo_${document.key}`]}
            />
          </View>
        );
      })}

      <Input
        label="Correo de Mercado Pago"
        value={values.mercadoPagoEmail}
        onChangeText={(text) => setField('mercadoPagoEmail', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="correo@ejemplo.com"
        hint="Donde recibirías tus pagos"
        error={errors.mercadoPagoEmail}
      />

      <Pressable
        style={styles.terms}
        onPress={() => setField('acceptTerms', !values.acceptTerms)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: values.acceptTerms }}
      >
        <Ionicons
          name={values.acceptTerms ? 'checkbox' : 'square-outline'}
          size={24}
          color={values.acceptTerms ? colors.success : colors.textSecondary}
        />
        <Text style={styles.termsText}>
          Acepto los términos y la comisión del{' '}
          {Math.round(PRICING.COMMISSION_RATE * 100)}% sobre cada viaje.
        </Text>
      </Pressable>
      {errors.acceptTerms ? <Text style={styles.fieldError}>{errors.acceptTerms}</Text> : null}

      <Text style={styles.note}>
        Tu cuenta quedará en estado Pendiente hasta que un administrador revise los documentos.
        Te avisaremos cuando esté aprobada.
      </Text>
    </>
  );
}

export default function DriverRegisterForm({ form }) {
  const content = {
    personal: <PersonalStep form={form} />,
    vehicle: <VehicleStep form={form} />,
    documents: <DocumentsStep form={form} />,
  };

  return (
    <View>
      <TabBar
        steps={DRIVER_STEPS}
        active={form.step}
        completed={form.completed}
        onPress={(index) => {
          if (index < form.step) form.goToStep(index);
        }}
      />

      {content[form.stepKey]}

      <ErrorText message={form.error} />

      {form.isLastStep ? (
        <Button
          title="Enviar solicitud"
          variant="accent"
          onPress={form.submit}
          loading={form.loading}
        />
      ) : (
        <Button title="Siguiente" onPress={form.next} />
      )}

      {form.step > 0 ? (
        <>
          <View style={styles.gap} />
          <Button title="Atrás" variant="ghost" onPress={form.back} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldError: { color: colors.danger, fontSize: fontSize.sm, marginTop: spacing.xs },
  terms: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  termsText: { flex: 1, color: colors.textPrimary, fontSize: fontSize.sm, lineHeight: 18 },
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
  note: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  gap: { height: spacing.sm },
});
