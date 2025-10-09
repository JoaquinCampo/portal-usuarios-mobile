import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, StyleSheet } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { Colors } from '../constants/theme';
import ClinicDetailScreen from '../screens/ClinicDetailScreen';
import ClinicalDocumentDetailScreen from '../screens/ClinicalDocumentDetailScreen';
import HealthUserDetailScreen from '../screens/HealthUserDetailScreen';
import HealthWorkerDetailScreen from '../screens/HealthWorkerDetailScreen';
import TabNavigator from './TabNavigator';
import { RootStackParamList } from './types';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

function LogoTitle() {
  return (
    <Image
      style={styles.logo}
      source={require('../assets/images/logo.png')}
      resizeMode="contain"
    />
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerShadowVisible: true,
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{
            headerTitle: LogoTitle,
            headerTitleAlign: 'center',
            headerStyle: {
              backgroundColor: Colors.surface,
            },
          }}
        />
        <Stack.Screen
          name="ClinicDetail"
          component={ClinicDetailScreen}
          options={{
            title: 'Detalle de Clínica',
            headerBackTitle: 'Volver',
          }}
        />
        <Stack.Screen
          name="HealthWorkerDetail"
          component={HealthWorkerDetailScreen}
          options={{
            title: 'Detalle de Profesional',
            headerBackTitle: 'Volver',
          }}
        />
        <Stack.Screen
          name="ClinicalDocumentDetail"
          component={ClinicalDocumentDetailScreen}
          options={{
            title: 'Detalle de Documento',
            headerBackTitle: 'Volver',
          }}
        />
        <Stack.Screen
          name="HealthUserDetail"
          component={HealthUserDetailScreen}
          options={{
            title: 'Detalle de Paciente',
            headerBackTitle: 'Volver',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 40,
    height: 40,
  },
});

export default AppNavigator;
