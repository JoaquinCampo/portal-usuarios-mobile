import { RouteProp, useRoute } from '@react-navigation/native';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { useHealthWorker } from '../hooks/useHealthWorker';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'HealthWorkerDetail'>;

type InfoCardProps = {
  title: string;
  children: React.ReactNode;
};

function InfoCard({ title, children }: InfoCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function HealthWorkerDetailScreen() {
  const { params } = useRoute<Route>();
  const { data, isLoading } = useHealthWorker(params.id);

  const healthWorker = useMemo(() => data, [data]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Cargando información...</Text>
          </View>
        ) : healthWorker ? (
          <>
            <View style={styles.headerCard}>
              <Text style={styles.workerName}>
                Dr. {healthWorker.firstName} {healthWorker.lastName}
              </Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  Licencia: {healthWorker.licenseNumber}
                </Text>
              </View>
            </View>

            <InfoCard title="Información de Contacto">
              <InfoRow label="Email" value={healthWorker.email} />
              <InfoRow label="Teléfono" value={healthWorker.phone} />
              <InfoRow label="Dirección" value={healthWorker.address} />
            </InfoCard>

            <InfoCard title="Información Profesional">
              <InfoRow
                label="Número de Licencia"
                value={healthWorker.licenseNumber}
              />
              <InfoRow label="Tipo de Documento" value={healthWorker.documentType} />
              <InfoRow label="Documento" value={healthWorker.document} />
              <InfoRow label="Género" value={healthWorker.gender} />
            </InfoCard>

            <InfoCard title="Información del Registro">
              <InfoRow
                label="Fecha de Creación"
                value={healthWorker.createdAt ?? 'No disponible'}
              />
              <InfoRow
                label="Última Actualización"
                value={healthWorker.updatedAt ?? 'No disponible'}
              />
            </InfoCard>
          </>
        ) : (
          <EmptyState
            icon="alert-circle-outline"
            title="Profesional no encontrado"
            description="No se pudo encontrar la información de este profesional."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workerName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceVariant,
  },
  typeBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cardContent: {
    gap: Spacing.md,
  },
  infoRow: {
    gap: Spacing.xs,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
});

export default HealthWorkerDetailScreen;

