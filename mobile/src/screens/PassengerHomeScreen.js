import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RIDE_STATUS } from '../config/constants';
import ActiveRidePanel from '../components/ActiveRidePanel';
import BottomSheet from '../components/BottomSheet';
import ConfirmPanel from '../components/ConfirmPanel';
import DestinationModal from '../components/DestinationModal';
import ErrorText from '../components/ErrorText';
import IdlePanel from '../components/IdlePanel';
import RideMap from '../components/RideMap';
import TopBar from '../components/TopBar';
import useLocation from '../hooks/useLocation';
import usePassengerRide from '../hooks/usePassengerRide';
import usePlaceSuggestions from '../hooks/usePlaceSuggestions';

export default function PassengerHomeScreen({ navigation }) {
  const { location, error: locationError } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const rideState = usePassengerRide();
  const { ride, destination, quote } = rideState;

  const idle = !ride && !destination;
  const suggestions = usePlaceSuggestions(location, idle);
  const canCancel = ride && [RIDE_STATUS.REQUESTED, RIDE_STATUS.ACCEPTED].includes(ride.status);

  const chooseDestination = (place) => {
    setSearchOpen(false);
    if (location) rideState.selectDestination(location, place);
  };

  return (
    <View style={styles.container}>
      <RideMap origin={location} destination={ride ? ride.destination : destination} />
      <TopBar onProfile={() => navigation.navigate('Profile')} />

      <View style={styles.bottom}>
        <BottomSheet>
          <ErrorText message={locationError || rideState.error} />

          {ride && (
            <ActiveRidePanel
              ride={ride}
              canCancel={canCancel}
              loading={rideState.loading}
              paying={rideState.paying}
              onCancel={rideState.cancel}
              onPay={rideState.pay}
            />
          )}

          {!ride && destination && (
            <ConfirmPanel
              destination={destination}
              quote={quote}
              loading={rideState.loading || rideState.quoting}
              paymentMethod={rideState.paymentMethod}
              onChangePaymentMethod={rideState.setPaymentMethod}
              onConfirm={() => rideState.request(location)}
              onChange={rideState.clearDestination}
            />
          )}

          {idle && (
            <IdlePanel
              ready={!!location}
              places={suggestions.all}
              onOpenSearch={() => location && setSearchOpen(true)}
              onSelectPlace={chooseDestination}
            />
          )}
        </BottomSheet>
      </View>

      <DestinationModal
        visible={searchOpen}
        location={location}
        suggestions={suggestions}
        onClose={() => setSearchOpen(false)}
        onSelect={chooseDestination}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});