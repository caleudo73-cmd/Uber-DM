import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import theme from '../config/theme';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

const MAX_BASE64_LENGTH = 320000; // ~240 KB por foto

// Reduce la foto antes de guardarla: el documento va como base64 a Firestore.
const compress = async (uri) => {
  let width = 900;
  let compressValue = 0.35;
  let result = await manipulateAsync(uri, [{ resize: { width } }], {
    compress: compressValue,
    format: SaveFormat.JPEG,
    base64: true,
  });

  while (result.base64.length > MAX_BASE64_LENGTH && width > 400) {
    width -= 150;
    compressValue = Math.max(0.2, compressValue - 0.05);
    result = await manipulateAsync(uri, [{ resize: { width } }], {
      compress: compressValue,
      format: SaveFormat.JPEG,
      base64: true,
    });
  }

  return { uri: result.uri, base64: result.base64, mimeType: 'image/jpeg' };
};

export default function PhotoPicker({ label, hint, value, onChange, error }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAsset = async (asset) => {
    try {
      setBusy(true);
      setMessage(null);
      onChange(await compress(asset.uri));
    } catch (e) {
      setMessage('No se pudo procesar la imagen');
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setMessage('Permiso de cámara denegado. Usa la galería.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) await handleAsset(result.assets[0]);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) await handleAsset(result.assets[0]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        <View style={[styles.preview, error && styles.previewError]}>
          {value?.uri ? (
            <Image source={{ uri: value.uri }} style={styles.image} resizeMode="cover" />
          ) : (
            <Ionicons name="document-outline" size={28} color={colors.textSecondary} />
          )}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={takePhoto} disabled={busy}>
            <Ionicons name="camera-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.actionText}>{value ? 'Repetir' : 'Cámara'}</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={pickPhoto} disabled={busy}>
            <Ionicons name="images-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.actionText}>{busy ? 'Procesando…' : 'Galería'}</Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : message ? (
        <Text style={styles.error}>{message}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  preview: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewError: { borderColor: colors.danger },
  image: { width: '100%', height: '100%' },
  actions: { flex: 1, gap: spacing.xs },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  error: { color: colors.danger, fontSize: fontSize.sm, marginTop: spacing.xs },
  hint: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
});
