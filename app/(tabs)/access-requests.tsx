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
  ApiConfigurationError,
  denyAccessRequest,
  fetchHealthUserAccessRequests,
  grantClinicAccessPolicy,
  grantHealthWorkerAccessPolicy,
  grantSpecialtyAccessPolicy,
} from "@/lib/api";
import { getSession } from "@/lib/auth/session-manager";
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
  return Number.isNaN(date.getTime()) ? isoString : date.toLocaleString("es-UY");
};

const formatAccessRequestsError = (error: unknown): string => {
  if (error instanceof ApiConfigurationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Error inesperado al obtener las solicitudes de acceso.";
};

const buildModalTitle = (action: ActionType | undefined) =>
  action === "deny"
    ? "Denegar acceso a historia clínica"
    : "Otorgar acceso a historia clínica";

const buildModalBody = (
  action: { type: ActionType; specialtyName?: string } | null,
  request: AccessRequestDTO | null
) => {
  if (!action || !request) {
    return "";
  }

  const workerName = request.healthWorker
    ? `${request.healthWorker.firstName} ${request.healthWorker.lastName}`.trim()
    : "el profesional";
  const clinicName = request.clinic?.name ?? "la clínica";

  switch (action.type) {
    case "deny":
      return `¿Estás seguro que quieres denegar acceso a ${workerName} a tu historia clínica?`;
    case "grant-by-clinic":
      return `¿Estás seguro que quieres otorgar acceso a ${clinicName} a tu historia clínica?`;
    case "grant-by-health-worker":
      return `¿Estás seguro que quieres otorgar acceso a ${workerName} a tu historia clínica?`;
    case "grant-by-specialty":
      return `¿Estás seguro que quieres otorgar acceso a la especialidad ${action.specialtyName}?`;
    default:
      return "";
  }
};

const buildConfirmText = (action: ActionType | undefined) =>
  action === "deny" ? "Rechazar" : "Aceptar";

export default function AccessRequestsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [healthUserId, setHealthUserId] = useState<string | null>(null);
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
    specialtyName?: string;
  } | null>(null);
  const isChoiceModalVisible = selectedAction !== null;

  function openModal(action: ActionType, requestId: string, specialtyName?: string) {
    setSelectedAction({ type: action, requestId, specialtyName });
  }

  function closeModal() {
    setSelectedAction(null);
  }

  // Load healthUserId from session
  useEffect(() => {
    const loadHealthUserId = async () => {
      try {
        const session = await getSession();
        if (session?.healthUser?.id) {
          setHealthUserId(session.healthUser.id);
        } else {
          setState({
            status: "error",
            data: [],
            error: "No se pudo obtener el ID de usuario de la sesión.",
          });
        }
      } catch (error) {
        console.error("Error loading session:", error);
        setState({
          status: "error",
          data: [],
          error: "Error al cargar la sesión.",
        });
      }
    };

    loadHealthUserId();
  }, []);

  const loadData = useCallback(async () => {
    if (!healthUserId) {
      return;
    }

    setState((current) => ({ ...current, status: "loading", error: null }));

    try {
      const data = await fetchHealthUserAccessRequests(healthUserId);
      setExpandedRequestId(null);
      setState({ status: "ready", data, error: null });
    } catch (error) {
      setExpandedRequestId(null);
      const message = formatAccessRequestsError(error);

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
      // Find the access request
      const accessRequest = state.data.find(
        (request) => request.id === selectedAction.requestId
      );

      if (!accessRequest) {
        console.error("Access request not found");
        closeModal();
        return;
      }

      let response: Response;

      switch (selectedAction.type) {
        case "grant-by-clinic":
          response = await grantClinicAccessPolicy(accessRequest);
          break;
        case "grant-by-health-worker":
          if (!accessRequest.healthWorker?.ci) {
            throw new Error("La solicitud no contiene profesional");
          }
          response = await grantHealthWorkerAccessPolicy(accessRequest);
          break;
        case "grant-by-specialty":
          if (!selectedAction.specialtyName) {
            throw new Error("Falta seleccionar una especialidad");
          }
          response = await grantSpecialtyAccessPolicy(
            accessRequest,
            selectedAction.specialtyName
          );
          break;
        case "deny":
          response = await denyAccessRequest(accessRequest.id);
          break;
        default:
          console.error("Unknown action type");
          closeModal();
          return;
      }

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
  }, [selectedAction, healthUserId, loadData, state.data]);

  useEffect(() => {
    if (healthUserId) {
      loadData().catch(() => {
        // Error is handled through state.
      });
    }
  }, [loadData, healthUserId]);

  const isRefreshing = state.status === "loading";
  const selectedRequest = selectedAction
    ? state.data.find((request) => request.id === selectedAction.requestId) ?? null
    : null;

  return (
    <AccessRequestsLayout
      isDark={isDark}
      state={state}
      windowHeight={window.height}
      notificationsReady={notificationsReady}
      notificationError={notificationError}
      isRegisteringNotification={isRegisteringNotification}
      loadData={loadData}
      isRefreshing={isRefreshing}
      expandedRequestId={expandedRequestId}
      toggleActions={toggleActions}
      openModal={openModal}
      isChoiceModalVisible={isChoiceModalVisible}
      selectedAction={selectedAction}
      selectedRequest={selectedRequest}
      closeModal={closeModal}
      handleAction={handleAction}
    />
  );
}

type AccessRequestsLayoutProps = {
  isDark: boolean;
  state: ScreenState;
  windowHeight: number;
  notificationsReady: boolean;
  notificationError?: string | null;
  isRegisteringNotification: boolean;
  loadData: () => Promise<void>;
  isRefreshing: boolean;
  expandedRequestId: string | null;
  toggleActions: (id: string) => void;
  openModal: (action: ActionType, id: string, specialtyName?: string) => void;
  isChoiceModalVisible: boolean;
  selectedAction: { type: ActionType; requestId: string; specialtyName?: string } | null;
  selectedRequest: AccessRequestDTO | null;
  closeModal: () => void;
  handleAction: () => Promise<void> | void;
};

function AccessRequestsLayout({
  isDark,
  state,
  windowHeight,
  notificationsReady,
  notificationError,
  isRegisteringNotification,
  loadData,
  isRefreshing,
  expandedRequestId,
  toggleActions,
  openModal,
  isChoiceModalVisible,
  selectedAction,
  selectedRequest,
  closeModal,
  handleAction,
}: AccessRequestsLayoutProps) {
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
            minHeight: windowHeight,
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={{ fontSize: 24 }}>Solicitudes de Acceso</ThemedText>
        </View>

        {renderNotificationsCard(
          notificationsReady,
          notificationError,
          isRegisteringNotification,
          isDark
        )}

        {renderLoadingIndicator(state, isDark)}

        {renderErrorCard(state, isDark)}

        {renderEmptyState(state, isDark)}

        {state.data.map((request) => (
          <AccessRequestCard
            key={request.id}
            request={request}
            isDark={isDark}
            isExpanded={expandedRequestId === request.id}
            onToggle={toggleActions}
            openModal={openModal}
          />
        ))}
        <ChoiceModal
          isVisible={isChoiceModalVisible && !!selectedAction && !!selectedRequest}
          title={buildModalTitle(selectedAction?.type)}
          body={buildModalBody(selectedAction, selectedRequest)}
          onCancel={closeModal}
          onConfirm={handleAction}
          confirmText={buildConfirmText(selectedAction?.type)}
          cancelText="Cancelar"
        />
      </ScrollView>
    </ThemedView>
  );
}

const renderNotificationsCard = (
  notificationsReady: boolean,
  notificationError: string | null | undefined,
  isRegisteringNotification: boolean,
  isDark: boolean
) => {
  if (notificationsReady && !notificationError) {
    return null;
  }

  return (
    <View
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        styles.infoCard,
      ]}
    >
      <ThemedText type="subtitle">Notificaciones push</ThemedText>
      {notificationError ? (
        <ThemedText style={styles.errorText}>{notificationError}</ThemedText>
      ) : (
        <ThemedText>
          {isRegisteringNotification
            ? "Registrando este dispositivo para notificaciones…"
            : "Las notificaciones aún no están activas. Confirma los permisos y la configuración nativa de Firebase."}
        </ThemedText>
      )}
    </View>
  );
};

const renderLoadingIndicator = (state: ScreenState, isDark: boolean) => {
  if (!(state.status === "loading" && state.data.length === 0)) {
    return null;
  }

  return (
    <ActivityIndicator size="large" color={isDark ? "#ffffff" : "#000000"} />
  );
};

const renderErrorCard = (state: ScreenState, isDark: boolean) => {
  if (!state.error) {
    return null;
  }

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <ThemedText type="subtitle">Error</ThemedText>
      <ThemedText style={styles.errorText}>{state.error}</ThemedText>
    </View>
  );
};

const renderEmptyState = (state: ScreenState, isDark: boolean) => {
  if (state.error || state.data.length !== 0 || state.status !== "ready") {
    return null;
  }

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <ThemedText type="subtitle">No se encontraron solicitudes de acceso</ThemedText>
      <ThemedText>No tienes solicitudes pendientes en este momento.</ThemedText>
    </View>
  );
};

type AccessRequestCardProps = {
  request: AccessRequestDTO;
  isDark: boolean;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  openModal: (action: ActionType, id: string, specialtyName?: string) => void;
};

function AccessRequestCard({
  request,
  isDark,
  isExpanded,
  onToggle,
  openModal,
}: AccessRequestCardProps) {
  const workerName = request.healthWorker
    ? `${request.healthWorker.firstName} ${request.healthWorker.lastName}`.trim()
    : request.clinic?.name ?? "Solicitud";

  return (
    <View
      style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
    >
      <View style={styles.cardHeader}>
        <ThemedText type="subtitle">{workerName}</ThemedText>
        <ThemedText style={styles.metaText}>
          Solicitado {request.createdAt ? formatDateTime(request.createdAt) : 'Fecha no disponible'}
        </ThemedText>
      </View>
      <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>Clínica</ThemedText>
        <ThemedText>{request.clinic?.name ?? "Sin especificar"}</ThemedText>
      </View>
      {request.specialtyNames?.length ? (
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>
            Especialidades solicitadas
          </ThemedText>
          <View style={styles.specialtyList}>
            {request.specialtyNames.map((specialty) => (
              <View
                key={`${request.id}-${specialty}-chip`}
                style={styles.specialtyChip}
              >
                <ThemedText style={styles.specialtyChipText}>
                  {specialty}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <Pressable
        style={styles.actionsToggle}
        onPress={() => onToggle(request.id)}
        accessibilityRole="button"
        accessibilityLabel="Toggle actions"
      >
        <ThemedText type="link">
          {isExpanded ? "Ocultar acciones" : "Mostrar acciones"}
        </ThemedText>
      </Pressable>
      {isExpanded ? (
        <View style={styles.actionsContainer}>
          <Pressable
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => openModal("grant-by-clinic", request.id)}
          >
            <ThemedText style={styles.actionButtonText}>
              Otorgar acceso a la clínica
            </ThemedText>
          </Pressable>
          {request.healthWorker?.ci ? (
            <Pressable
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => openModal("grant-by-health-worker", request.id)}
            >
              <ThemedText style={styles.actionButtonText}>
                Otorgar acceso al profesional
              </ThemedText>
            </Pressable>
          ) : null}
          {request.specialtyNames?.map((specialty) => (
            <Pressable
              key={`${request.id}-${specialty}-grant`}
              style={[styles.actionButton, styles.actionButtonTertiary]}
              onPress={() => openModal("grant-by-specialty", request.id, specialty)}
            >
              <ThemedText style={styles.actionButtonText}>
                Otorgar acceso a {specialty}
              </ThemedText>
            </Pressable>
          ))}
          <Pressable
            style={[styles.actionButton, styles.actionButtonDeny]}
            onPress={() => openModal("deny", request.id)}
          >
            <ThemedText style={styles.actionButtonText}>
              Denegar acceso
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 50,
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 4,
    marginBottom: 8,
    backgroundColor: '#0d47a1',
    padding: 16,
    borderRadius: 12,
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
  specialtyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  specialtyChip: {
    backgroundColor: "#0d47a1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  specialtyChipText: {
    color: "#ffffff",
    fontSize: 12,
  },
});
