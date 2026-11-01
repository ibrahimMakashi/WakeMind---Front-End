import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AppIcon} from '../AppIcon';
import {DEFAULT_IMAGES} from '../../puzzle/imageCatalog';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';

export function ImageGalleryModal({
  visible,
  currentImageId,
  onSelectBundled,
  onChooseFromPhone,
  onClose,
  loading = false,
}) {
  const {colors, typography, radius} = useTheme();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View style={[styles.modalBackdrop, {backgroundColor: colors.overlay}]}>
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[typography.screenTitle, {color: colors.text}]}>
                Puzzle Artwork
              </Text>
              <Text style={[typography.caption, {color: colors.textSoft}]}>
                Choose from presets or your phone library
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Close gallery"
              accessibilityRole="button"
              onPress={onClose}
              style={({pressed}) => [
                styles.closeButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                pressed && styles.pressed,
              ]}>
              <AppIcon color={colors.textSoft} name="close" size={20} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Section: Choose from Phone */}
            <Pressable
              accessibilityHint="Opens system photo picker to select a custom picture"
              accessibilityLabel="Choose from phone gallery"
              accessibilityRole="button"
              disabled={loading}
              onPress={onChooseFromPhone}
              style={({pressed}) => [
                styles.customActionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.accent,
                  borderRadius: radius.md,
                },
                pressed && styles.pressed,
                loading && styles.dimmed,
              ]}>
              <View
                style={[
                  styles.customIconContainer,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                  },
                ]}>
                {loading ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <AppIcon color={colors.accent} name="image-plus" size={24} />
                )}
              </View>

              <View style={styles.customActionCopy}>
                <Text style={[typography.bodyStrong, {color: colors.text}]}>
                  Choose from Gallery
                </Text>
                <Text style={[typography.caption, {color: colors.textSoft}]}>
                  Select and crop any photograph from your phone
                </Text>
              </View>

              <AppIcon color={colors.accent} name="chevron-right" size={22} />
            </Pressable>

            {/* Section: Default Bundled Images */}
            <View style={styles.sectionHeadingRow}>
              <Text style={[typography.sectionLabel, {color: colors.muted}]}>
                DEFAULT ARTWORK
              </Text>
            </View>

            <View style={styles.grid}>
              {DEFAULT_IMAGES.map(item => {
                const isSelected = item.id === currentImageId;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityLabel={`Select ${item.title}`}
                    accessibilityRole="button"
                    accessibilityState={{selected: isSelected}}
                    onPress={() => onSelectBundled(item.id)}
                    style={({pressed}) => [
                      styles.gridItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? colors.accent : colors.border,
                        borderRadius: radius.md,
                      },
                      isSelected && styles.selectedItemBorder,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.thumbnailContainer}>
                      <Image
                        fadeDuration={0}
                        resizeMode="cover"
                        source={item.asset}
                        style={styles.thumbnail}
                      />
                      {isSelected ? (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: colors.accent,
                            },
                          ]}>
                          <AppIcon color={colors.accentText} name="check" size={14} />
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.itemMeta}>
                      <Text
                        numberOfLines={1}
                        style={[
                          typography.caption,
                          styles.itemTitle,
                          {
                            color: isSelected ? colors.accent : colors.text,
                          },
                        ]}>
                        {item.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[typography.caption, styles.itemCategory, {color: colors.muted}]}>
                        {item.category}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopWidth: 1,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  customActionCard: {
    alignItems: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  customIconContainer: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 44,
  },
  customActionCopy: {
    flex: 1,
  },
  sectionHeadingRow: {
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  gridItem: {
    borderWidth: 1.5,
    overflow: 'hidden',
    width: '48%',
  },
  selectedItemBorder: {
    borderWidth: 2,
  },
  thumbnailContainer: {
    aspectRatio: 1,
    position: 'relative',
    width: '100%',
  },
  thumbnail: {
    height: '100%',
    width: '100%',
  },
  badge: {
    alignItems: 'center',
    borderRadius: 12,
    elevation: 3,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 22,
  },
  itemMeta: {
    padding: spacing.sm,
  },
  itemTitle: {
    fontWeight: '700',
  },
  itemCategory: {
    fontSize: 10,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.75,
  },
  dimmed: {
    opacity: 0.5,
  },
});
