import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SpecialtySelectionModalProps {
  isVisible: boolean;
  specialties: string[];
  onSelect: (specialty: string) => void;
  onCancel: () => void;
}

export default function SpecialtySelectionModal({
  isVisible,
  specialties,
  onSelect,
  onCancel,
}: SpecialtySelectionModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onCancel}
      transparent
      statusBarTranslucent
      animationType="fade">
      <View style={styles.backdrop}>
        <ThemedView style={styles.card}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Seleccionar Especialidad
            </ThemedText>
            <Pressable onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
            </Pressable>
          </View>

          <ThemedText style={styles.subtitle}>
            Selecciona la especialidad a la que deseas otorgar acceso:
          </ThemedText>

          <ScrollView style={styles.specialtiesList} showsVerticalScrollIndicator={false}>
            {specialties.map((specialty) => (
              <Pressable
                key={specialty}
                style={[
                  styles.specialtyButton,
                  isDark ? styles.specialtyButtonDark : styles.specialtyButtonLight,
                ]}
                onPress={() => onSelect(specialty)}>
                <View style={styles.specialtyButtonContent}>
                  <Ionicons
                    name="medical"
                    size={20}
                    color={isDark ? '#60a5fa' : '#2563eb'}
                    style={styles.specialtyIcon}
                  />
                  <ThemedText style={styles.specialtyButtonText}>{specialty}</ThemedText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? '#9ca3af' : '#6b7280'}
                />
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={[styles.cancelButton, isDark ? styles.cancelButtonDark : styles.cancelButtonLight]}
            onPress={onCancel}>
            <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  specialtiesList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  specialtyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  specialtyButtonLight: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  specialtyButtonDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  specialtyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  specialtyIcon: {
    marginRight: 12,
  },
  specialtyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonLight: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  cancelButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
