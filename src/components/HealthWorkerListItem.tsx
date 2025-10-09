import { memo, useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { HealthWorker } from '../api/healthWorkersService';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
} from '../constants/theme';

type Props = {
  healthWorker: HealthWorker;
  onPress: (id: string) => void;
};

function HealthWorkerListItemComponent({ healthWorker, onPress }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    onPress(healthWorker.id);
  }, [healthWorker.id, onPress]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.container}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.name} numberOfLines={1}>
                Dr. {healthWorker.firstName} {healthWorker.lastName}
              </Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  Lic. {healthWorker.licenseNumber}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.address} numberOfLines={2}>
            {healthWorker.address}
          </Text>

          <View style={styles.footer}>
            <Text style={styles.metaText} numberOfLines={1}>
              {healthWorker.phone}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {healthWorker.email}
            </Text>
          </View>
        </View>
        <View style={styles.chevron}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.md,
    paddingRight: 40,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
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
  address: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  separator: {
    fontSize: 12,
    color: Colors.borderLight,
  },
  chevron: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  chevronText: {
    fontSize: 20,
    color: Colors.textTertiary,
    fontWeight: '400',
  },
});

const HealthWorkerListItem = memo(HealthWorkerListItemComponent);

export default HealthWorkerListItem;

