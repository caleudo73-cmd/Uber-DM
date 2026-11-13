import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import theme from '../config/theme';
import { ROLES } from '../config/constants';
import useAuth from '../hooks/useAuth';
import AppDrawerContent from '../components/AppDrawerContent';
import EarningsScreen from '../screens/EarningsScreen';
import EditDocumentsScreen from '../screens/EditDocumentsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import EditVehicleScreen from '../screens/EditVehicleScreen';
import FirebaseConfigScreen from '../screens/FirebaseConfigScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RideDetailScreen from '../screens/RideDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Las pantallas internas del Stack comparten el mismo encabezado.
const innerOptions = (title) => ({
  headerShown: true,
  title,
  headerTintColor: theme.colors.textPrimary,
  headerStyle: { backgroundColor: theme.colors.background },
  headerShadowVisible: false,
});

// El Drawer agrupa las pantallas de la especificación: inicio, perfil,
// historial, ganancias y configuración. El Stack conserva el flujo del viaje
// y las pantallas de edición con botón de regreso.
function MainDrawer() {
  const { user } = useAuth();
  const isDriver = user?.role === ROLES.DRIVER;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerTintColor: theme.colors.textPrimary,
        headerStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
        drawerStyle: { backgroundColor: theme.colors.background, width: 300 },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi perfil' }} />
      <Drawer.Screen name="History" component={HistoryScreen} options={{ title: 'Historial' }} />
      {isDriver ? (
        <Drawer.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Ganancias' }} />
      ) : null}
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configuración' }} />
    </Drawer.Navigator>
  );
}

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
        {user && (
          <>
            <Stack.Screen name="Main" component={MainDrawer} />
            <Stack.Screen
              name="RideDetail"
              component={RideDetailScreen}
              options={innerOptions('Detalle del viaje')}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={innerOptions('Editar datos personales')}
            />
            <Stack.Screen
              name="EditVehicle"
              component={EditVehicleScreen}
              options={innerOptions('Editar vehículo')}
            />
            <Stack.Screen
              name="EditDocuments"
              component={EditDocumentsScreen}
              options={innerOptions('Editar documentos')}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
