import { getSession, initiateLogin } from '@/lib/auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    try {
      setLoading(true);
      await initiateLogin();

      const session = await getSession();
      if (!session) {
        throw new Error('No session found after login');
      }

      // Navigation will be handled by _layout.tsx after successful authentication
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Error de autenticación',
        error instanceof Error ? error.message : 'No se pudo iniciar sesión. Por favor, intente nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo or Icon */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🏥</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Portal de Usuarios</Text>
        <Text style={styles.subtitle}>Sistema de Historia Clínica Electrónica Nacional</Text>

        {/* Login Button */}
        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed,
            loading && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>🇺🇾 Iniciar sesión con GUB.UY</Text>
          )}
        </Pressable>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Para acceder al sistema, debes autenticarte con tu cuenta de ID Uruguay (GUB.UY)
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Sistema seguro de autenticación mediante ID Uruguay
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoText: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 280,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonPressed: {
    backgroundColor: '#0052A3',
    transform: [{ scale: 0.98 }],
  },
  loginButtonDisabled: {
    backgroundColor: '#999',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    marginTop: 24,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
