import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface ChoiceModalProps {
  title?: string;
  body?: string;
  requester?: string;
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ChoiceModal({
  title,
  body,
  requester,
  isVisible,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
}: ChoiceModalProps) {
  const confirmLabel = confirmText ?? "Yes";
  const cancelLabel = cancelText ?? "No";
  const defaultTitle = "Confirmar acción";
  const defaultBody = requester
    ? `¿Estás seguro que quieres otorgar acceso a ${requester} a tu historia clínica?`
    : "¿Estás seguro que quieres realizar esta acción?";

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onCancel}
      transparent
      statusBarTranslucent
      animationType="fade"
    >
      <View style={styles.backdrop}>
        <ThemedView style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            {title ?? defaultTitle}
          </ThemedText>
          <ThemedText type="default" style={styles.body}>
            {body ?? defaultBody}
          </ThemedText>
          <View style={[styles.actions, { justifyContent: "center" }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={onCancel}
              style={[styles.actionButton, styles.secondaryButton]}
            >
              <ThemedText style={styles.secondaryButtonText}>
                {cancelLabel}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              onPress={onConfirm}
              style={[styles.actionButton, styles.primaryButton]}
            >
              <ThemedText style={styles.primaryButtonText}>
                {confirmLabel}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 16,
    padding: 20,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    // Android elevation
    elevation: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    textAlign: "center",
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
