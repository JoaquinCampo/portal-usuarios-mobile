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
import { useClinicalDocument } from '../hooks/useClinicalDocument';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'ClinicalDocumentDetail'>;

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

function ClinicalDocumentDetailScreen() {
  const { params } = useRoute<Route>();
  const { data, isLoading } = useClinicalDocument(params.id);

  const document = useMemo(() => data, [data]);

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
        ) : document ? (
          <>
            <View style={styles.headerCard}>
              <Text style={styles.documentTitle}>{document.title}</Text>
            </View>

            <InfoCard title="Información del Documento">
              <InfoRow label="URL del Contenido" value={document.contentUrl} />
              <InfoRow label="ID Historia Clínica" value={document.clinicalHistoryId} />
            </InfoCard>

            <InfoCard title="Profesionales Asociados">
              <InfoRow
                label="Cantidad"
                value={`${document.healthWorkerIds.length} profesional(es)`}
              />
              {document.healthWorkerIds.map((id, index) => (
                <InfoRow
                  key={id}
                  label={`Profesional ${index + 1}`}
                  value={id}
                />
              ))}
            </InfoCard>

            <InfoCard title="Información del Registro">
              <InfoRow
                label="Fecha de Creación"
                value={document.createdAt ?? 'No disponible'}
              />
              <InfoRow
                label="Última Actualización"
                value={document.updatedAt ?? 'No disponible'}
              />
            </InfoCard>
          </>
        ) : (
          <EmptyState
            icon="alert-circle-outline"
            title="Documento no encontrado"
            description="No se pudo encontrar la información de este documento."
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
  documentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
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

export default ClinicalDocumentDetailScreen;

