import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';
import { RATING_VALUES } from '../utils/ratings';

const { colors } = theme;

export default function RatingInput({ value = 0, onChange, size = 36 }) {
  return (
    <View style={styles.row}>
      {RATING_VALUES.map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${star} estrella${star === 1 ? '' : 's'}`}
        >
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={size}
            color={star <= value ? colors.star : colors.starEmpty}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
});
