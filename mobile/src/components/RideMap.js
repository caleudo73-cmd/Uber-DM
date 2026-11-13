// AI-assisted: see docs/AI_LOG.md #9, #14
import { useEffect, useMemo, useState } from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import theme from '../config/theme';
import { getRouteGeometry, isDirectionsEnabled } from '../services/directionsService';
import { regionFor } from '../utils/map';

export default function RideMap({ origin, destination, showRoute = false }) {
  const [route, setRoute] = useState(null);

  const originLat = origin?.latitude;
  const originLng = origin?.longitude;
  const destinationLat = destination?.latitude;
  const destinationLng = destination?.longitude;

  // Solo se recalcula si cambian las coordenadas, así el mapa no "salta".
  const region = useMemo(
    () => regionFor([origin, destination]),
    [originLat, originLng, destinationLat, destinationLng]
  );

  // La ruta real se pide a Directions cuando hay llave. Si falla, se dibuja la
  // línea recta; el mapa nunca se queda sin recorrido.
  useEffect(() => {
    let active = true;
    setRoute(null);

    if (!showRoute || originLat == null || destinationLat == null || !isDirectionsEnabled()) {
      return () => {
        active = false;
      };
    }

    getRouteGeometry(origin, destination).then((points) => {
      if (active) setRoute(points);
    });

    return () => {
      active = false;
    };
  }, [showRoute, originLat, originLng, destinationLat, destinationLng]);

  const fallback = useMemo(
    () =>
      origin && destination
        ? [
            { latitude: origin.latitude, longitude: origin.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
          ]
        : [],
    [originLat, originLng, destinationLat, destinationLng]
  );

  const routeCoordinates = route ?? fallback;

  return (
    <MapView style={StyleSheet.absoluteFill} region={region} showsUserLocation>
      {origin && <Marker coordinate={origin} pinColor={theme.colors.mapOrigin} title="Origen" />}
      {destination && (
        <Marker coordinate={destination} pinColor={theme.colors.mapDestination} title={destination.name ?? 'Destino'} />
      )}
      {showRoute && routeCoordinates.length >= 2 ? (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={theme.colors.mapOrigin}
          strokeWidth={4}
        />
      ) : null}
    </MapView>
  );
}
