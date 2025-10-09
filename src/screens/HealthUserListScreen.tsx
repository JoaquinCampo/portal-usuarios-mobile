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
import type { HealthUser } from '../api/healthUsersService';
import HealthUserListItem from '../components/HealthUserListItem';
import { EmptyState } from '../components/EmptyState';
import { SkeletonList } from '../components/SkeletonLoader';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { useHealthUsers } from '../hooks/useHealthUsers';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HealthUsers'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function HealthUserListScreen() {
  const navigation = useNavigation<Navigation>();
  const { data, isLoading, isError, refetch, isRefetching } = useHealthUsers();

  const healthUsers = useMemo(() => data ?? [], [data]);

  const handleSelectHealthUser = useCallback(
    (id: string) => {
      navigation.navigate('HealthUserDetail', { id });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: HealthUser }) => (
      <HealthUserListItem healthUser={item} onPress={handleSelectHealthUser} />
    ),
    [handleSelectHealthUser],
  );

  const keyExtractor = useCallback((item: HealthUser) => item.id, []);

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
          <Text style={styles.headerTitle}>Pacientes</Text>
          <Text style={styles.headerSubtitle}>
            {healthUsers.length} {healthUsers.length === 1 ? 'paciente registrado' : 'pacientes registrados'}
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
    [healthUsers.length, isError],
  );

  const ListEmptyComponent = useCallback(
    () => (
      <EmptyState
        icon="people-outline"
        title="No hay pacientes"
        description="No se encontraron pacientes registrados. Desliza hacia abajo para actualizar."
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
            data={healthUsers}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            refreshControl={refreshControl}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={
              healthUsers.length === 0 ? styles.emptyContainer : styles.listContent
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

export default HealthUserListScreen;

