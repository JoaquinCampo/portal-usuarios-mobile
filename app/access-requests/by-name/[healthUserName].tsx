import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    ApiConfigurationError,
    fetchHealthUserAccessRequestsByName,
} from '@/lib/api';
import type { AccessRequestDTO } from '@/types/AccessRequestDTO';

type ScreenState =
  | { status: 'idle' | 'loading'; data: AccessRequestDTO[]; error: string | null }
  | { status: 'ready'; data: AccessRequestDTO[]; error: null }
  | { status: 'error'; data: AccessRequestDTO[]; error: string };

type MockAction = 'clinic' | 'healthWorker' | 'specialty';

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? isoString : date.toLocaleString();
};

export default function AccessRequestsForHealthUserByNameScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { healthUserName: rawHealthUserName } = useLocalSearchParams<{ healthUserName?: string | string[] }>();
  const healthUserName = Array.isArray(rawHealthUserName) ? rawHealthUserName[0] : rawHealthUserName;
  const [state, setState] = useState<ScreenState>({ status: 'idle', data: [], error: null });
  const window = useWindowDimensions();
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  const toggleActions = useCallback((requestId: string) => {
    setExpandedRequestId((current) => (current === requestId ? null : requestId));
  }, []);

  const handleMockAction = useCallback((request: AccessRequestDTO, action: MockAction) => {
    let description: string;

    switch (action) {
      case 'clinic':
        description = `granting clinic access for ${request.clinicName}`;
        break;
      case 'healthWorker':
        description = `granting access to health worker ${request.healthWorkerName}`;
        break;
      case 'specialty':
        description = `granting specialty access for ${request.specialtyName}`;
        break;
      default:
        description = 'performing the requested action';
    }

    Alert.alert(
      'Mock action',
      `This would trigger the endpoint for ${description} (request ${request.id}).`
    );
  }, []);

  const loadData = useCallback(async () => {
    if (!healthUserName) {
      setExpandedRequestId(null);
      setState({
        status: 'error',
        data: [],
        error: 'Missing health user name. Append it to the route as /access-requests/by-name/<health-user-name>.',
      });
      return;
    }

    setState((current) => ({ ...current, status: 'loading', error: null }));

    try {
      const data = await fetchHealthUserAccessRequestsByName(healthUserName);
      setExpandedRequestId(null);
      setState({ status: 'ready', data, error: null });
    } catch (error) {
      setExpandedRequestId(null);
      const message =
        error instanceof ApiConfigurationError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Unexpected error while fetching access requests.';

      setState({
        status: 'error',
        data: [],
        error: message,
      });
    }
  }, [healthUserName]);

  useEffect(() => {
    loadData().catch(() => {
      // Error is handled through state.
    });
  }, [loadData]);

  const isRefreshing = state.status === 'loading';

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={loadData} />}
        contentContainerStyle={[
          styles.content,
          {
            minHeight: window.height,
          },
        ]}>
        <View style={styles.header}>
          <ThemedText type="title">Access Requests</ThemedText>
        </View>

        {state.status === 'loading' && state.data.length === 0 ? (
          <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
        ) : null}

        {state.error ? (
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <ThemedText type="subtitle">Error</ThemedText>
            <ThemedText style={styles.errorText}>{state.error}</ThemedText>
          </View>
        ) : null}

        {!state.error && state.data.length === 0 && state.status === 'ready' ? (
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <ThemedText type="subtitle">No access requests found</ThemedText>
            <ThemedText>
              The backend returned an empty result for this health user. Try pulling to refresh or
              confirm that the name is correct.
            </ThemedText>
          </View>
        ) : null}

        {state.data.map((request, index) => (
          <View
            key={`access-request-${index}`}
            style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle">{request.healthWorkerName}</ThemedText>
              <ThemedText style={styles.metaText}>
                Requested {formatDateTime(request.createdAt)}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Clinic</ThemedText>
              <ThemedText>{request.clinicName}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Specialty</ThemedText>
              <ThemedText>{request.specialtyName}</ThemedText>
            </View>
            <Pressable
              style={styles.actionsToggle}
              onPress={() => toggleActions(request.id)}
              accessibilityRole="button"
              accessibilityLabel="Toggle actions">
              <ThemedText type="link">
                {expandedRequestId === request.id ? 'Hide actions' : 'Show actions'}
              </ThemedText>
            </Pressable>
            {expandedRequestId === request.id ? (
              <View style={styles.actionsContainer}>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => handleMockAction(request, 'clinic')}>
                  <ThemedText style={styles.actionButtonText}>Grant clinic access</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => handleMockAction(request, 'healthWorker')}>
                  <ThemedText style={styles.actionButtonText}>Grant health worker access</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonTertiary]}
                  onPress={() => handleMockAction(request, 'specialty')}>
                  <ThemedText style={styles.actionButtonText}>Grant specialty access</ThemedText>
                </Pressable>
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
    backgroundColor: '#f0f3f5',
  },
  cardDark: {
    backgroundColor: '#1c1f24',
  },
  errorText: {
    color: '#d92d20',
  },
  metaText: {
    fontSize: 14,
    opacity: 0.7,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontWeight: '600',
  },
  actionsToggle: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  actionsContainer: {
    gap: 8,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#0284c7',
  },
  actionButtonSecondary: {
    backgroundColor: '#0f766e',
  },
  actionButtonTertiary: {
    backgroundColor: '#7c3aed',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
});


