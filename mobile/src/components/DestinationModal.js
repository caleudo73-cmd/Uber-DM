import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../config/theme';
import usePlaceSearch from '../hooks/usePlaceSearch';
import PlaceRow from './PlaceRow';

const { colors, spacing, radius, fontSize, fontWeight } = theme;

function Section({ title, places, onSelect }) {
  if (places.length === 0) return null;
  return (
    <View>
      <Text style={styles.section}>{title}</Text>
      {places.map((place) => (
        <PlaceRow key={place.id} place={place} onPress={onSelect} />
      ))}
    </View>
  );
}

export default function DestinationModal({ visible, location, suggestions, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
  const search = usePlaceSearch(location);
  const searching = search.query.trim().length >= 3;

  const close = () => {
    search.setQuery('');
    onClose();
  };

  const select = (place) => {
    search.setQuery('');
    onSelect(place);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <Pressable onPress={close} hitSlop={12}>
            <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Tu ruta</Text>
        </View>

        <View style={styles.route}>
          <View style={styles.dots}>
            <View style={styles.dotOrigin} />
            <View style={styles.line} />
            <View style={styles.dotDestination} />
          </View>
          <View style={styles.inputs}>
            <View style={styles.originBox}>
              <Text style={styles.originText}>Tu ubicación actual</Text>
            </View>
            <TextInput
              autoFocus
              value={search.query}
              onChangeText={search.setQuery}
              placeholder="¿A dónde vas?"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {searching ? (
            <>
              {search.loading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
              {search.error && <Text style={[styles.message, styles.error]}>{search.error}</Text>}
              {search.empty && <Text style={styles.message}>No encontramos ese lugar</Text>}
              {search.results.map((place) => (
                <PlaceRow key={place.id} place={{ ...place, icon: 'location-outline' }} onPress={select} />
              ))}
            </>
          ) : (
            <>
              <Section title="Tus lugares frecuentes" places={suggestions.frequent} onSelect={select} />
              <Section title="Cerca de ti" places={suggestions.nearby} onSelect={select} />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  route: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  dots: { width: 20, alignItems: 'center', paddingTop: 17, marginRight: spacing.sm },
  dotOrigin: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  line: { width: 2, height: 34, backgroundColor: colors.border },
  dotDestination: { width: 10, height: 10, backgroundColor: colors.primary },
  inputs: { flex: 1 },
  originBox: { height: 44, justifyContent: 'center' },
  originText: { fontSize: fontSize.md, color: colors.textSecondary },
  input: {
    height: 44,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  section: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.md },
  loader: { padding: spacing.md },
  message: { padding: spacing.md, color: colors.textSecondary },
  error: { color: colors.danger },
});