import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

export function SkeletonCard() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.title, { opacity }]} />
      <Animated.View style={[styles.subtitle, { opacity }]} />
      <View style={styles.row}>
        <Animated.View style={[styles.badge, { opacity }]} />
        <Animated.View style={[styles.badge, { opacity }]} />
      </View>
    </View>
  );
}

export function SkeletonList() {
  return (
    <View style={styles.list}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    height: 20,
    width: '70%',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    height: 16,
    width: '50%',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  badge: {
    height: 24,
    width: 80,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.full,
  },
});
