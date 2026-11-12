import { useMemo } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import theme from '../config/theme';
import { regionFor } from '../utils/map';

export default function RideMap({ origin, destination }) {
  // Solo se recalcula si cambian las coordenadas, así el mapa no "salta".
  const region = useMemo(
    () => regionFor([origin, destination]),
    [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]
  );

  return (
    <MapView style={StyleSheet.absoluteFill} region={region} showsUserLocation>
      {origin && <Marker coordinate={origin} pinColor={theme.colors.mapOrigin} title="Origen" />}
      {destination && (
        <Marker coordinate={destination} pinColor={theme.colors.mapDestination} title={destination.name ?? 'Destino'} />
      )}
    </MapView>
  );
}