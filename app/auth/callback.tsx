import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

/**
 * OAuth callback handler route
 * This route handles the redirect from GUB.UY after authentication
 * The URL will be: portalusuariosmobileg12://auth/callback?code=...&state=...
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // The actual OAuth handling is done by WebBrowser.openAuthSessionAsync
    // This route just needs to exist so the deep link is valid
    // Redirect to home after a brief moment
    const timeout = setTimeout(() => {
      router.replace('/(tabs)');
    }, 1000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>Completing authentication...</Text>
    </View>
  );
}
