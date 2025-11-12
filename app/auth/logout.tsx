import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

/**
 * Logout callback handler route
 * This route handles the redirect from GUB.UY after logout
 * The URL will be: portalusuariosmobileg12://auth/logout
 */
export default function LogoutCallback() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 1000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>Logging out...</Text>
    </View>
  );
}