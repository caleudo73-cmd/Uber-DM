// AI-assisted: see docs/AI_LOG.md #9
import { useMemo } from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import theme from '../config/theme';
import { regionFor } from '../utils/map';

export default function RideMap({ origin, destination, showRoute = false }) {
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
      {showRoute && origin && destination ? (
        <Polyline
          coordinates={[
            { latitude: origin.latitude, longitude: origin.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
          ]}
          strokeColor={theme.colors.mapOrigin}
          strokeWidth={4}
        />
      ) : null}
    </MapView>
  );
}