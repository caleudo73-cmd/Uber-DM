import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';
import PlaceRow from './PlaceRow';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

export default function IdlePanel({ ready, places, onOpenSearch, onSelectPlace }) {
  return (
    <>
      <Pressable onPress={onOpenSearch} style={styles.search}>
        <Ionicons name="search" size={22} color={colors.textPrimary} />
        <Text style={styles.placeholder}>{ready ? '¿A dónde vas?' : 'Obteniendo tu ubicación...'}</Text>
      </Pressable>
      {places.map((place) => (
        <PlaceRow key={place.id} place={place} onPress={onSelectPlace} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  placeholder: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
});