import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import type { HealthWorker } from '../api/healthWorkersService';
import HealthWorkerListItem from '../components/HealthWorkerListItem';
import { EmptyState } from '../components/EmptyState';
import { SkeletonList } from '../components/SkeletonLoader';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { useHealthWorkers } from '../hooks/useHealthWorkers';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HealthWorkers'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function HealthWorkerListScreen() {
  const navigation = useNavigation<Navigation>();
  const { data, isLoading, isError, refetch, isRefetching } = useHealthWorkers();

  const healthWorkers = useMemo(() => data ?? [], [data]);

  const handleSelectHealthWorker = useCallback(
    (id: string) => {
      navigation.navigate('HealthWorkerDetail', { id });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: HealthWorker }) => (
      <HealthWorkerListItem healthWorker={item} onPress={handleSelectHealthWorker} />
    ),
    [handleSelectHealthWorker],
  );

  const keyExtractor = useCallback((item: HealthWorker) => item.id, []);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isRefetching}
        onRefresh={refetch}
        tintColor={Colors.primary}
      />
    ),
    [isRefetching, refetch],
  );

  const ListHeaderComponent = useCallback(
    () => (
      <View>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profesionales de la Salud</Text>
          <Text style={styles.headerSubtitle}>
            {healthWorkers.length} {healthWorkers.length === 1 ? 'profesional disponible' : 'profesionales disponibles'}
          </Text>
          {isError && (
            <View style={styles.banner}>
              <Icon name="information-circle" size={20} color={Colors.info} style={styles.bannerIcon} />
              <Text style={styles.bannerText}>
                Mostrando datos de ejemplo. Verifica la conexión al backend.
              </Text>
            </View>
          )}
        </View>
      </View>
    ),
    [healthWorkers.length, isError],
  );

  const ListEmptyComponent = useCallback(
    () => (
      <EmptyState
        icon="medkit-outline"
        title="No hay profesionales"
        description="No se encontraron profesionales de la salud. Desliza hacia abajo para actualizar."
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {isLoading ? (
          <SkeletonList />
        ) : (
          <FlatList
            data={healthWorkers}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            refreshControl={refreshControl}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={
              healthWorkers.length === 0 ? styles.emptyContainer : styles.listContent
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  banner: {
    backgroundColor: Colors.info + '10',
    padding: Spacing.sm,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    marginRight: Spacing.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
  },
});

export default HealthWorkerListScreen;

