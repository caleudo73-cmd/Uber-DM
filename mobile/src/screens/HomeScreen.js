// AI-assisted: see docs/AI_LOG.md #11
import { ROLES } from '../config/constants';
import useAuth from '../hooks/useAuth';
import DriverHomeScreen from './DriverHomeScreen';
import PassengerHomeScreen from './PassengerHomeScreen';

// Pantalla de inicio del Drawer: muestra la vista del rol de la sesión.
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  return user?.role === ROLES.DRIVER ? (
    <DriverHomeScreen navigation={navigation} />
  ) : (
    <PassengerHomeScreen navigation={navigation} />
  );
}
