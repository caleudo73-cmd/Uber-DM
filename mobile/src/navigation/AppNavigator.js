import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import theme from '../config/theme';
import { ROLES } from '../config/constants';
import useAuth from '../hooks/useAuth';
import DriverHomeScreen from '../screens/DriverHomeScreen';
import EarningsScreen from '../screens/EarningsScreen';
import FirebaseConfigScreen from '../screens/FirebaseConfigScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LoginScreen from '../screens/LoginScreen';
import PassengerHomeScreen from '../screens/PassengerHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RideDetailScreen from '../screens/RideDetailScreen';

const Stack = createNativeStackNavigator();

// Las pantallas internas comparten el mismo encabezado.
const innerOptions = (title) => ({
  headerShown: true,
  title,
  headerTintColor: theme.colors.textPrimary,
  headerStyle: { backgroundColor: theme.colors.background },
  headerShadowVisible: false,
});

export default function AppNavigator() {
  const { user, booting, configError } = useAuth();

  if (configError) return <FirebaseConfigScreen message={configError} />;

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user && (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
        {user?.role === ROLES.PASSENGER && <Stack.Screen name="PassengerHome" component={PassengerHomeScreen} />}
        {user?.role === ROLES.DRIVER && <Stack.Screen name="DriverHome" component={DriverHomeScreen} />}
        {user && (
          <>
            <Stack.Screen name="Profile" component={ProfileScreen} options={innerOptions('Mi perfil')} />
            <Stack.Screen name="Earnings" component={EarningsScreen} options={innerOptions('Ganancias')} />
            <Stack.Screen name="History" component={HistoryScreen} options={innerOptions('Historial')} />
            <Stack.Screen
              name="RideDetail"
              component={RideDetailScreen}
              options={innerOptions('Detalle del viaje')}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
