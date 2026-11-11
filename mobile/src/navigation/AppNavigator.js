import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import theme from '../config/theme';
import { ROLES } from '../config/constants';
import useAuth from '../hooks/useAuth';
import DriverHomeScreen from '../screens/DriverHomeScreen';
import LoginScreen from '../screens/LoginScreen';
import PassengerHomeScreen from '../screens/PassengerHomeScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, booting } = useAuth();

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
