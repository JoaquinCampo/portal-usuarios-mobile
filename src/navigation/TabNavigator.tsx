import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../constants/theme';
import ClinicListScreen from '../screens/ClinicListScreen';
import ClinicalDocumentListScreen from '../screens/ClinicalDocumentListScreen';
import HealthUserListScreen from '../screens/HealthUserListScreen';
import HealthWorkerListScreen from '../screens/HealthWorkerListScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 60,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Clinics"
        component={ClinicListScreen}
        options={{
          tabBarLabel: 'Clínicas',
          tabBarIcon: ({ color, size }) => (
            <Icon name="business-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HealthWorkers"
        component={HealthWorkerListScreen}
        options={{
          tabBarLabel: 'Profesionales',
          tabBarIcon: ({ color, size }) => (
            <Icon name="medkit-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ClinicalDocuments"
        component={ClinicalDocumentListScreen}
        options={{
          tabBarLabel: 'Documentos',
          tabBarIcon: ({ color, size }) => (
            <Icon name="document-text-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HealthUsers"
        component={HealthUserListScreen}
        options={{
          tabBarLabel: 'Pacientes',
          tabBarIcon: ({ color, size }) => (
            <Icon name="people-outline" size={size || 24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default TabNavigator;

