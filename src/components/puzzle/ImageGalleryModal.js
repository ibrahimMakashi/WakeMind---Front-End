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
import {DEFAULT_IMAGES, resolveImageSource} from '../../puzzle/imageCatalog';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';

export function ImageGalleryModal({
  visible,
  currentImageId,
  recentImages = [],
  onSelectRecent,
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
                Choose from presets, recents, or your phone library
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
            {/* 3.1 Recently Selected Section */}
            {recentImages && recentImages.length > 0 ? (
              <View style={styles.recentSection}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={[typography.sectionLabel, {color: colors.muted}]}>
                    RECENTLY SELECTED
                  </Text>
                  <Text style={[typography.caption, {color: colors.muted}]}>
                    {recentImages.length} available
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentScrollRow}>
                  {recentImages.slice(0, 8).map(item => {
                    const isSelected = item.id === currentImageId;
                    const resolved = resolveImageSource(
                      item.id,
                      item.type,
                      item.uri,
                      item.title,
                    );

                    return (
                      <Pressable
                        key={`recent-${item.id}-${item.timestamp || 0}`}
                        accessibilityLabel={`Select recent ${item.title || 'photo'}`}
                        accessibilityRole="button"
                        accessibilityState={{selected: isSelected}}
                        onPress={() => {
                          if (typeof onSelectRecent === 'function') {
                            onSelectRecent(resolved);
                          } else if (item.type === 'bundled') {
                            onSelectBundled(item.id);
                          }
                        }}
                        style={({pressed}) => [
                          styles.recentItem,
                          {
                            backgroundColor: colors.surface,
                            borderColor: isSelected ? colors.accent : colors.border,
                            borderRadius: radius.md,
                          },
                          isSelected && styles.selectedItemBorder,
                          pressed && styles.pressed,
                        ]}>
                        <View style={styles.recentThumbnailContainer}>
                          {resolved.source ? (
                            <Image
                              fadeDuration={0}
                              resizeMode="cover"
                              source={resolved.source}
                              style={styles.thumbnail}
                            />
                          ) : (
                            <View
                              style={[
                                styles.placeholderBox,
                                {backgroundColor: colors.surfaceRaised},
                              ]}>
                              <AppIcon color={colors.muted} name="image-outline" size={24} />
                            </View>
                          )}
                          {isSelected ? (
                            <View
                              style={[
                                styles.badge,
                                {backgroundColor: colors.accent},
                              ]}>
                              <AppIcon color={colors.accentText} name="check" size={12} />
                            </View>
                          ) : null}
                        </View>

                        <Text
                          numberOfLines={1}
                          style={[
                            typography.caption,
                            styles.recentItemTitle,
                            {color: isSelected ? colors.accent : colors.text},
                          ]}>
                          {item.title || (item.type === 'custom' ? 'Custom Photo' : 'Artwork')}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[typography.caption, styles.recentItemType, {color: colors.muted}]}>
                          {item.type === 'custom' ? 'Custom' : 'Preset'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* 3.2 Default Artwork Section */}
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

            {/* 3.3 Choose from Phone Section */}
            <View style={[styles.sectionHeadingRow, {marginTop: spacing.lg}]}>
              <Text style={[typography.sectionLabel, {color: colors.muted}]}>
                DEVICE PHOTOS
              </Text>
            </View>

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
  recentSection: {
    marginBottom: spacing.lg,
  },
  recentScrollRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  recentItem: {
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 6,
    width: 96,
  },
  recentThumbnailContainer: {
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  recentItemTitle: {
    fontWeight: '700',
    marginTop: 4,
  },
  recentItemType: {
    fontSize: 10,
    marginTop: 1,
  },
  placeholderBox: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  customActionCard: {
    alignItems: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    marginTop: spacing.xs,
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
