import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const [healthUserId, setHealthUserId] = useState('');
  const [healthUserName, setHealthUserName] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const trimmedId = healthUserId.trim();
  const trimmedUserName = healthUserName.trim();
  const canNavigate = trimmedId.length > 0;
  const canNavigateUserName = trimmedUserName.length > 0;

  const handleNavigate = () => {
    if (!canNavigate) {
      return;
    }

    router.push({
      pathname: '/access-requests/by-id/[healthUserId]',
      params: { healthUserId: trimmedId },
    });
  };

  const handleNavigateUserName = () => {
    if (!canNavigateUserName) {
      return;
    }

    router.push({
      pathname: '/access-requests/by-name/[healthUserName]',
      params: { healthUserName: trimmedUserName },
    });
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Health Access Portal</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.introContainer}>
        <ThemedText>
          View the raw access requests the backend exposes for a specific health user. Provide an
          identifier to launch a dedicated screen that fetches data from the Java API configured in
          your environment.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Health User ID</ThemedText>
        <TextInput
          value={healthUserId}
          onChangeText={setHealthUserId}
          placeholder="e.g. 123456"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, isDark && styles.inputDark]}
          returnKeyType="go"
          onSubmitEditing={handleNavigate}
          placeholderTextColor={isDark ? '#9aa4b2' : '#667085'}
          cursorColor={isDark ? '#e2e8f0' : '#0a7ea4'}
          selectionColor={isDark ? '#0a7ea4' : '#0a7ea4'}
        />
        <Pressable
          onPress={handleNavigate}
          style={[styles.button, !canNavigate && styles.buttonDisabled]}
          disabled={!canNavigate}>
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>
            Open access requests
          </ThemedText>
        </Pressable>
      </ThemedView>
      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Health User Name</ThemedText>
        <TextInput
          value={healthUserName}
          onChangeText={setHealthUserName}
          placeholder="e.g. John Doe"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, isDark && styles.inputDark]}
          returnKeyType="go"
          onSubmitEditing={handleNavigateUserName}
          placeholderTextColor={isDark ? '#9aa4b2' : '#667085'}
          cursorColor={isDark ? '#e2e8f0' : '#0a7ea4'}
          selectionColor={isDark ? '#0a7ea4' : '#0a7ea4'}
        />
        <Pressable
          onPress={handleNavigateUserName}
          style={[styles.button, !canNavigateUserName && styles.buttonDisabled]}
          disabled={!canNavigateUserName}>
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>
            Open access requests by name
          </ThemedText>
        </Pressable>
      </ThemedView>
      <ThemedView style={styles.noteContainer}>
        <ThemedText>
          You can also navigate directly by visiting{' '}
          <ThemedText type="defaultSemiBold">/access-requests/by-id/&lt;health-user-id&gt;</ThemedText>{' '}
          or{' '}
          <ThemedText type="defaultSemiBold">/access-requests/by-name/&lt;health-user-name&gt;</ThemedText>{' '}
          in the Expo Router.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  introContainer: {
    gap: 8,
    marginBottom: 8,
  },
  formContainer: {
    gap: 12,
    marginBottom: 12,
  },
  noteContainer: {
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#101828',
  },
  inputDark: {
    backgroundColor: '#1f2933',
    borderColor: '#334155',
    color: '#e2e8f0',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#ffffff',
  },
});
