import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import ChoiceModal from "@/app/modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  actOnAccessRequest,
  ApiConfigurationError,
  fetchHealthUserAccessRequests,
} from "@/lib/api";
import type { AccessRequestDTO } from "@/types/AccessRequestDTO";

type ScreenState =
  | {
      status: "idle" | "loading";
      data: AccessRequestDTO[];
      error: string | null;
    }
  | { status: "ready"; data: AccessRequestDTO[]; error: null }
  | { status: "error"; data: AccessRequestDTO[]; error: string };

type ActionType =
  | "grant-by-clinic"
  | "grant-by-health-worker"
  | "grant-by-specialty"
  | "deny";

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? isoString : date.toLocaleString();
};

export default function AccessRequestsForHealthUserScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { healthUserId: rawHealthUserId } = useLocalSearchParams<{
    healthUserId?: string | string[];
  }>();
  const healthUserId = Array.isArray(rawHealthUserId)
    ? rawHealthUserId[0]
    : rawHealthUserId;
  const {
    token: notificationToken,
    error: notificationError,
    permissionStatus: notificationPermissionStatus,
    isRegistering: isRegisteringNotification,
  } = usePushNotifications(healthUserId);
  const [state, setState] = useState<ScreenState>({
    status: "idle",
    data: [],
    error: null,
  });
  const window = useWindowDimensions();
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(
    null
  );
  const notificationsReady =
    notificationPermissionStatus === "granted" &&
    typeof notificationToken === "string";

  const toggleActions = useCallback((requestId: string) => {
    setExpandedRequestId((current) =>
      current === requestId ? null : requestId
    );
  }, []);

  const [selectedAction, setSelectedAction] = useState<{
    type: ActionType;
    requestId: string;
  } | null>(null);
  const isChoiceModalVisible = selectedAction !== null;

  function openModal(action: ActionType, requestId: string) {
    setSelectedAction({ type: action, requestId });
  }

  function closeModal() {
    setSelectedAction(null);
  }

  const loadData = useCallback(async () => {
    if (!healthUserId) {
      setExpandedRequestId(null);
      setState({
        status: "error",
        data: [],
        error:
          "Falta el ID de usuario de salud. Agrégalo a la ruta como /access-requests/by-id/<health-user-id>.",
      });
      return;
    }

    setState((current) => ({ ...current, status: "loading", error: null }));

    try {
      const data = await fetchHealthUserAccessRequests(healthUserId);
      setExpandedRequestId(null);
      setState({ status: "ready", data, error: null });
    } catch (error) {
      setExpandedRequestId(null);
      const message =
        error instanceof ApiConfigurationError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Error inesperado al obtener las solicitudes de acceso.";

      setState({
        status: "error",
        data: [],
        error: message,
      });
    }
  }, [healthUserId]);

  const handleAction = useCallback(async () => {
    if (!selectedAction || !healthUserId) {
      return;
    }

    try {
      const response = await actOnAccessRequest(
        selectedAction.requestId,
        healthUserId,
        selectedAction.type
      );

      if (response.ok) {
        // Refresh the data
        await loadData();
      } else {
        console.error("Failed to act on access request:", response.statusText);
      }
    } catch (error) {
      console.error("Error acting on access request:", error);
    } finally {
      closeModal();
    }
  }, [selectedAction, healthUserId, loadData]);

  useEffect(() => {
    loadData().catch(() => {
      // Error is handled through state.
    });
  }, [loadData]);

  const isRefreshing = state.status === "loading";

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={loadData} />
        }
        contentContainerStyle={[
          styles.content,
          {
            minHeight: window.height,
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="title">Solicitudes de Acceso</ThemedText>
        </View>

        {!notificationsReady || notificationError ? (
          <View
            style={[
              styles.card,
              isDark ? styles.cardDark : styles.cardLight,
              styles.infoCard,
            ]}
          >
            <ThemedText type="subtitle">Notificaciones push</ThemedText>
            {notificationError ? (
              <ThemedText style={styles.errorText}>
                {notificationError}
              </ThemedText>
            ) : (
              <ThemedText>
                {isRegisteringNotification
                  ? "Registrando este dispositivo para notificaciones…"
                  : "Las notificaciones aún no están activas. Confirma los permisos y la configuración nativa de Firebase."}
              </ThemedText>
            )}
          </View>
        ) : null}

        {state.status === "loading" && state.data.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={isDark ? "#ffffff" : "#000000"}
          />
        ) : null}

        {state.error ? (
          <View
            style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
          >
            <ThemedText type="subtitle">Error</ThemedText>
            <ThemedText style={styles.errorText}>{state.error}</ThemedText>
          </View>
        ) : null}

        {!state.error && state.data.length === 0 && state.status === "ready" ? (
          <View
            style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
          >
            <ThemedText type="subtitle">
              No se encontraron solicitudes de acceso
            </ThemedText>
            <ThemedText>
              El servidor devolvió un resultado vacío para este usuario de
              salud. Intenta deslizar para actualizar o confirma que el ID es
              correcto.
            </ThemedText>
          </View>
        ) : null}

        {state.data.map((request, index) => (
          <View
            key={`access-request-${index}`}
            style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
          >
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle">
                {request.healthWorkerName}
              </ThemedText>
              <ThemedText style={styles.metaText}>
                Solicitado {formatDateTime(request.createdAt)}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Clínica</ThemedText>
              <ThemedText>{request.clinicName}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Especialidad</ThemedText>
              <ThemedText>{request.specialtyName}</ThemedText>
            </View>
            <Pressable
              style={styles.actionsToggle}
              onPress={() => toggleActions(request.id)}
              accessibilityRole="button"
              accessibilityLabel="Toggle actions"
            >
              <ThemedText type="link">
                {expandedRequestId === request.id
                  ? "Ocultar acciones"
                  : "Mostrar acciones"}
              </ThemedText>
            </Pressable>
            {expandedRequestId === request.id ? (
              <View style={styles.actionsContainer}>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => openModal("grant-by-clinic", request.id)}
                >
                  <ThemedText style={styles.actionButtonText}>
                    Otorgar acceso a la clínica
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() =>
                    openModal("grant-by-health-worker", request.id)
                  }
                >
                  <ThemedText style={styles.actionButtonText}>
                    Otorgar acceso al profesional
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonTertiary]}
                  onPress={() => openModal("grant-by-specialty", request.id)}
                >
                  <ThemedText style={styles.actionButtonText}>
                    Otorgar acceso a la especialidad
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonDeny]}
                  onPress={() => openModal("deny", request.id)}
                >
                  <ThemedText style={styles.actionButtonText}>
                    Denegar acceso
                  </ThemedText>
                </Pressable>
                <ChoiceModal
                  isVisible={isChoiceModalVisible}
                  title={
                    selectedAction?.type === "deny"
                      ? "Denegar acceso a historia clínica"
                      : "Otorgar acceso a historia clínica"
                  }
                  body={
                    selectedAction?.type === "deny"
                      ? `¿Estás seguro que quieres denegar acceso a ${request.healthWorkerName} a tu historia clínica?`
                      : `¿Estás seguro que quieres otorgar acceso a ${
                          selectedAction?.type === "grant-by-clinic"
                            ? request.clinicName
                            : selectedAction?.type === "grant-by-health-worker"
                            ? request.healthWorkerName
                            : selectedAction?.type === "grant-by-specialty"
                            ? request.specialtyName
                            : ""
                        } a tu historia clínica?`
                  }
                  onCancel={closeModal}
                  onConfirm={handleAction}
                  confirmText={
                    selectedAction?.type === "deny" ? "Rechazar" : "Aceptar"
                  }
                  cancelText="Cancelar"
                />
              </View>
            ) : null}
          </View>
        ))}
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
    gap: 16,
  },
  header: {
    gap: 4,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    gap: 4,
  },
  cardLight: {
    backgroundColor: "#f0f3f5",
  },
  cardDark: {
    backgroundColor: "#1c1f24",
  },
  infoCard: {
    marginBottom: 4,
  },
  errorText: {
    color: "#d92d20",
  },
  metaText: {
    fontSize: 14,
    opacity: 0.7,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontWeight: "600",
  },
  actionsToggle: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  actionsContainer: {
    gap: 8,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  actionButtonPrimary: {
    backgroundColor: "#0284c7",
  },
  actionButtonSecondary: {
    backgroundColor: "#0f766e",
  },
  actionButtonTertiary: {
    backgroundColor: "#7c3aed",
  },
  actionButtonDeny: {
    backgroundColor: "#dc2626",
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "center",
  },
});
