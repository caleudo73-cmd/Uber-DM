import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import theme from '../config/theme';
import { DEFAULT_REGION } from '../config/constants';

export default function RideMap({ origin, destination, onPressMap }) {
  const region = origin ? { ...DEFAULT_REGION, ...origin } : DEFAULT_REGION;

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      region={region}
      showsUserLocation
      onPress={onPressMap ? (e) => onPressMap(e.nativeEvent.coordinate) : undefined}
    >
      {origin && <Marker coordinate={origin} pinColor={theme.colors.mapOrigin} title="Origen" />}
      {destination && <Marker coordinate={destination} pinColor={theme.colors.mapDestination} title="Destino" />}
    </MapView>
  );
}
