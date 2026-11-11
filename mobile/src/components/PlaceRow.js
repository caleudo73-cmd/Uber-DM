import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';

const { colors, spacing, fontSize, fontWeight } = theme;

export default function PlaceRow({ place, onPress }) {
  return (
    <Pressable onPress={() => onPress(place)} style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name={place.icon ?? 'location-outline'} size={18} color={colors.textPrimary} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
        {place.address ? <Text style={styles.address} numberOfLines={1}>{place.address}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  texts: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textPrimary },
  address: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});