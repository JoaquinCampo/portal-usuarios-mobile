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
import type { Clinic } from '../api/clinicsService';
import ClinicListItem from '../components/ClinicListItem';
import { EmptyState } from '../components/EmptyState';
import { SkeletonList } from '../components/SkeletonLoader';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { useClinics } from '../hooks/useClinics';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Clinics'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function ClinicListScreen() {
  const navigation = useNavigation<Navigation>();
  const { data, isLoading, isError, refetch, isRefetching } = useClinics();

  const clinics = useMemo(() => data ?? [], [data]);

  const handleSelectClinic = useCallback(
    (id: string) => {
      navigation.navigate('ClinicDetail', { id });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Clinic }) => (
      <ClinicListItem clinic={item} onPress={handleSelectClinic} />
    ),
    [handleSelectClinic],
  );

  const keyExtractor = useCallback((item: Clinic) => item.id, []);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isRefetching}
        onRefresh={refetch}
        tintColor={Colors.primary}
        colors={[Colors.primary, Colors.secondary]}
      />
    ),
    [isRefetching, refetch],
  );

  const ListHeaderComponent = useCallback(
    () => (
      <View>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Clínicas</Text>
          <Text style={styles.headerSubtitle}>
            {clinics.length} {clinics.length === 1 ? 'clínica disponible' : 'clínicas disponibles'}
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
    [clinics.length, isError],
  );

  const ListEmptyComponent = useCallback(
    () => (
      <EmptyState
        icon="business-outline"
        title="No hay clínicas"
        description="No se encontraron clínicas. Desliza hacia abajo para actualizar."
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
            data={clinics}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            refreshControl={refreshControl}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={
              clinics.length === 0 ? styles.emptyContainer : styles.listContent
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

export default ClinicListScreen;
