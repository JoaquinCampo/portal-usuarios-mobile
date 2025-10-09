import { memo, useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ClinicalDocument } from '../api/clinicalDocumentsService';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
} from '../constants/theme';

type Props = {
  document: ClinicalDocument;
  onPress: (id: string) => void;
};

function ClinicalDocumentListItemComponent({ document, onPress }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    onPress(document.id);
  }, [document.id, onPress]);

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
              <Text style={styles.name} numberOfLines={2}>
                {document.title}
              </Text>
            </View>
          </View>

          <Text style={styles.address} numberOfLines={1}>
            ID Historia: {document.clinicalHistoryId.substring(0, 8)}...
          </Text>

          <View style={styles.footer}>
            <Text style={styles.metaText} numberOfLines={1}>
              {document.createdAt}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {document.healthWorkerIds.length} profesional(es)
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

const ClinicalDocumentListItem = memo(ClinicalDocumentListItemComponent);

export default ClinicalDocumentListItem;

