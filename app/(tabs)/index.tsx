import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchHealthUser } from "@/lib/api";
import { logout } from "@/lib/auth/gubuy-client";
import { getSession } from "@/lib/auth/session-manager";
import type { PortalSession } from "@/lib/types";

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [session, setSession] = useState<PortalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCheckingHealthUser, setIsCheckingHealthUser] = useState(false);
  const [healthUserMissing, setHealthUserMissing] = useState(false);
  const [healthUserError, setHealthUserError] = useState<string | null>(null);
  const hasRedirectedToLogin = useRef(false);

  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentSession = await getSession();
      setSession(currentSession);
    } catch (error) {
      console.error("Error loading session:", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await logout();
              router.replace("/(auth)/login");
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert(
                "Error",
                "No se pudo cerrar sesión. Por favor intenta nuevamente."
              );
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadSession();
    }, [loadSession])
  );

  useEffect(() => {
    if (!isLoading && !session && !hasRedirectedToLogin.current) {
      hasRedirectedToLogin.current = true;
      router.replace("/(auth)/login");
    }
  }, [isLoading, session, router]);

  const verifyHealthUser = useCallback(async () => {
    if (!session?.healthUser?.id) {
      setHealthUserMissing(false);
      setHealthUserError(null);
      return;
    }

    try {
      setIsCheckingHealthUser(true);
      setHealthUserMissing(false);
      setHealthUserError(null);
      const healthUser = await fetchHealthUser(session.healthUser.id);
      setHealthUserMissing(!healthUser);
    } catch (error) {
      console.error("Error verifying health user:", error);
      setHealthUserError(
        error instanceof Error
          ? error.message
          : "No se pudo verificar tu usuario. Intenta nuevamente."
      );
    } finally {
      setIsCheckingHealthUser(false);
    }
  }, [session]);

  useEffect(() => {
    verifyHealthUser();
  }, [verifyHealthUser]);

  const renderHealthUserGate = () => {
    if (!session) {
      return null;
    }

    if (isCheckingHealthUser) {
      return (
        <ThemedView style={styles.screen}>
          <View style={styles.centerContent}>
            <ActivityIndicator
              size="large"
              color={isDark ? "#ffffff" : "#000000"}
            />
            <ThemedText style={styles.loadingText}>
              Verificando tu usuario...
            </ThemedText>
          </View>
        </ThemedView>
      );
    }

    if (healthUserMissing) {
      return (
        <ThemedView style={styles.screen}>
          <View style={styles.centerContent}>
            <ThemedText type="title">Usuario no registrado</ThemedText>
            <ThemedText style={styles.messageText}>
              Necesitas que un administrador de clínica registre tu usuario en
              el sistema antes de continuar.
            </ThemedText>
            <Pressable
              style={styles.button}
              onPress={verifyHealthUser}
              disabled={isCheckingHealthUser}
            >
              <ThemedText style={styles.buttonText}>Reintentar verificación</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.logoutButton, styles.logoutButtonSecondary]}
              onPress={handleLogout}
            >
              <ThemedText style={styles.logoutButtonText}>Cerrar sesión</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      );
    }

    if (healthUserError) {
      return (
        <ThemedView style={styles.screen}>
          <View style={styles.centerContent}>
            <ThemedText type="title">
              No pudimos verificar tu usuario
            </ThemedText>
            <ThemedText style={styles.messageText}>{healthUserError}</ThemedText>
            <Pressable
              style={styles.button}
              onPress={verifyHealthUser}
              disabled={isCheckingHealthUser}
            >
              <ThemedText style={styles.buttonText}>Intentar nuevamente</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.centerContent}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#ffffff" : "#000000"}
          />
          <ThemedText style={styles.loadingText}>Cargando perfil...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.centerContent}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#ffffff" : "#000000"}
          />
          <ThemedText type="title">
            Redirigiendo a inicio de sesión...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const healthUserGate = renderHealthUserGate();
  if (healthUserGate) {
    return healthUserGate;
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={{ fontSize: 24 }}>Mi Perfil</ThemedText>
        </ThemedView>

        {/* User Information Card */}
        <View
          style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
        >
          <ThemedText type="subtitle">Información Personal</ThemedText>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Nombre:</ThemedText>
            <ThemedText style={styles.value}>
              {session.healthUser.name}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Cédula de Identidad:</ThemedText>
            <ThemedText style={styles.value}>
              {session.healthUser.id}
            </ThemedText>
          </View>

          {session.attributes?.email && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Email:</ThemedText>
              <ThemedText style={styles.value}>
                {session.attributes.email}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Authentication Information Card */}
        <View
          style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
        >
          <ThemedText type="subtitle">Información de Autenticación</ThemedText>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Proveedor:</ThemedText>
            <ThemedText style={styles.value}>
              {session.attributes?.idp || session.access.source}
            </ThemedText>
          </View>

          {session.attributes?.issuer && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Emisor:</ThemedText>
              <ThemedText style={styles.value} numberOfLines={2}>
                {session.attributes.issuer}
              </ThemedText>
            </View>
          )}

          {session.issuedAt && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Sesión iniciada:</ThemedText>
              <ThemedText style={styles.value}>
                {new Date(session.issuedAt).toLocaleString("es-UY")}
              </ThemedText>
            </View>
          )}

          {session.tokens?.expiresAt && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Expira:</ThemedText>
              <ThemedText style={styles.value}>
                {new Date(session.tokens.expiresAt).toLocaleString("es-UY")}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <Pressable
          style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.logoutButtonText}>
              Cerrar sesión
            </ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 50,
    gap: 16,
    backgroundColor: '#121212',
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 16,
  },
  header: {
    gap: 4,
    marginBottom: 8,
    backgroundColor: '#0d47a1',
    padding: 16,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 8,
  },
  messageText: {
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardLight: {
    backgroundColor: "#f0f3f5",
  },
  cardDark: {
    backgroundColor: "#1e1e1e",
  },
  infoRow: {
    gap: 4,
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#0a7ea4",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#ffffff",
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#dc2626",
    marginTop: 8,
  },
  logoutButtonSecondary: {
    width: "100%",
  },
  logoutButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
