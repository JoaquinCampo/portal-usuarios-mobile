import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ApiConfigurationError, fetchClinicalHistory } from '@/lib/api';
import { getSession } from '@/lib/auth/session-manager';
import type { ClinicalDocumentDTO } from '@/types/ClinicalDocumentDTO';
import type { ClinicalHistoryResponseDTO } from '@/types/ClinicalHistoryResponseDTO';

type ScreenState =
  | {
      status: 'idle' | 'loading';
      data: ClinicalHistoryResponseDTO | null;
      error: string | null;
    }
  | { status: 'ready'; data: ClinicalHistoryResponseDTO; error: null }
  | { status: 'error'; data: ClinicalHistoryResponseDTO | null; error: string };

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? isoString : date.toLocaleString('es-UY');
};

const formatClinicalHistoryError = (error: unknown): string => {
  if (error instanceof ApiConfigurationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Error inesperado al obtener la historia clínica.';
};

export default function ClinicalHistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [healthUserCi, setHealthUserCi] = useState<string | null>(null);
  const [state, setState] = useState<ScreenState>({
    status: 'idle',
    data: null,
    error: null,
  });
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);

  const toggleDocument = useCallback((documentId: string) => {
    setExpandedDocumentId((current) => (current === documentId ? null : documentId));
  }, []);

  // Load healthUserCi from session
  useEffect(() => {
    const loadHealthUserCi = async () => {
      try {
        const session = await getSession();
        if (session?.healthUser?.id) {
          setHealthUserCi(session.healthUser.id);
        } else {
          setState({
            status: 'error',
            data: null,
            error: 'No se pudo obtener la cédula de identidad de la sesión.',
          });
        }
      } catch (error) {
        console.error('Error loading session:', error);
        setState({
          status: 'error',
          data: null,
          error: 'Error al cargar la sesión.',
        });
      }
    };

    loadHealthUserCi();
  }, []);

  const loadData = useCallback(async () => {
    if (!healthUserCi) {
      return;
    }

    setState((current) => ({ ...current, status: 'loading', error: null }));

    try {
      const data = await fetchClinicalHistory(healthUserCi);
      setExpandedDocumentId(null);
      setState({ status: 'ready', data, error: null });
    } catch (error) {
      setExpandedDocumentId(null);
      const message = formatClinicalHistoryError(error);

      setState({
        status: 'error',
        data: null,
        error: message,
      });
    }
  }, [healthUserCi]);

  useEffect(() => {
    if (healthUserCi) {
      loadData();
    }
  }, [healthUserCi, loadData]);

  const handleOpenDocument = useCallback(async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening document:', error);
    }
  }, []);

  const renderDocument = (document: ClinicalDocumentDTO) => {
    const isExpanded = expandedDocumentId === document.id;
    const hasUrl = Boolean(document.contentUrl);

    return (
      <ThemedView
        key={document.id}
        style={[
          styles.documentCard,
          isDark ? styles.documentCardDark : styles.documentCardLight,
        ]}>
        <Pressable onPress={() => toggleDocument(document.id)}>
          <View style={styles.documentHeader}>
            <View style={styles.documentTitleRow}>
              <Ionicons
                name="document-text"
                size={24}
                color={isDark ? '#60a5fa' : '#2563eb'}
                style={styles.documentIcon}
              />
              <View style={styles.documentTitleContainer}>
                <ThemedText style={styles.documentTitle}>{document.title}</ThemedText>
                <ThemedText style={styles.documentDate}>
                  {formatDateTime(document.createdAt)}
                </ThemedText>
              </View>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </View>
          </View>
        </Pressable>

        {isExpanded && (
          <View style={styles.documentDetails}>
            {document.description && (
              <View style={styles.documentSection}>
                <ThemedText style={styles.sectionLabel}>Descripción:</ThemedText>
                <ThemedText style={styles.sectionValue}>{document.description}</ThemedText>
              </View>
            )}
            {document.healthWorker && (
            <View style={styles.documentSection}>
              <ThemedText style={styles.sectionLabel}>Profesional:</ThemedText>
              <ThemedText style={styles.sectionValue}>
                {document.healthWorker.firstName} {document.healthWorker.lastName}
              </ThemedText>
              <ThemedText style={styles.sectionSubValue}>
                CI: {document.healthWorker.ci}
              </ThemedText>
            </View>
            )}
            {document.clinic && (
            <View style={styles.documentSection}>
              <ThemedText style={styles.sectionLabel}>Clínica:</ThemedText>
              <ThemedText style={styles.sectionValue}>{document.clinic.name}</ThemedText>
            </View>
            )}

            {document.contentType && (
              <View style={styles.documentSection}>
                <ThemedText style={styles.sectionLabel}>Tipo de contenido:</ThemedText>
                <ThemedText style={styles.sectionValue}>{document.contentType}</ThemedText>
              </View>
            )}

            {hasUrl && (
              <Pressable
                style={[
                  styles.openButton,
                  isDark ? styles.openButtonDark : styles.openButtonLight,
                ]}
                onPress={() => handleOpenDocument(document.contentUrl)}>
                <Ionicons name="open-outline" size={20} color="#fff" />
                <ThemedText style={styles.openButtonText}>Ver documento</ThemedText>
              </Pressable>
            )}
          </View>
        )}
      </ThemedView>
    );
  };

  const renderContent = () => {
    if (state.status === 'loading') {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#2563eb'} />
          <ThemedText style={styles.loadingText}>Cargando historia clínica...</ThemedText>
        </View>
      );
    }

    if (state.status === 'error') {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color={isDark ? '#f87171' : '#dc2626'} />
          <ThemedText style={styles.errorText}>{state.error}</ThemedText>
          <Pressable
            style={[styles.retryButton, isDark ? styles.retryButtonDark : styles.retryButtonLight]}
            onPress={loadData}>
            <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
          </Pressable>
        </View>
      );
    }

    if (!state.data) {
      return (
        <View style={styles.centerContainer}>
          <ThemedText style={styles.emptyText}>No hay datos disponibles</ThemedText>
        </View>
      );
    }

    if (!state.data.hasAccess) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed" size={48} color={isDark ? '#f59e0b' : '#d97706'} />
          <ThemedText style={styles.accessMessage}>
            {state.data.accessMessage || 'No tienes acceso a esta información'}
          </ThemedText>
        </View>
      );
    }

    if (!state.data.documents || state.data.documents.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="document-outline" size={48} color={isDark ? '#9ca3af' : '#6b7280'} />
          <ThemedText style={styles.emptyText}>
            No se encontraron documentos en tu historia clínica
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.documentsContainer}>
        <ThemedText style={styles.documentsHeader}>
          {state.data.documents.length}{' '}
          {state.data.documents.length === 1 ? 'documento' : 'documentos'} encontrados
        </ThemedText>
        {state.data.documents.map(renderDocument)}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Mi Historia Clínica</ThemedText>
        {state.data?.healthUser && (
          <ThemedText style={styles.subtitle}>
            {state.data.healthUser.firstName} {state.data.healthUser.lastName}
          </ThemedText>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={state.status === 'loading'}
            onRefresh={loadData}
            colors={[isDark ? '#60a5fa' : '#2563eb']}
            tintColor={isDark ? '#60a5fa' : '#2563eb'}
          />
        }>
        {renderContent()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#dc2626',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  accessMessage: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonLight: {
    backgroundColor: '#2563eb',
  },
  retryButtonDark: {
    backgroundColor: '#60a5fa',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  documentsContainer: {
    gap: 12,
  },
  documentsHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  documentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  documentCardLight: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
  },
  documentCardDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  documentHeader: {
    marginBottom: 0,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    marginRight: 12,
  },
  documentTitleContainer: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 14,
    opacity: 0.6,
  },
  documentDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 16,
  },
  documentSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  sectionValue: {
    fontSize: 16,
  },
  sectionSubValue: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  openButtonLight: {
    backgroundColor: '#2563eb',
  },
  openButtonDark: {
    backgroundColor: '#60a5fa',
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
