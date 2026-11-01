import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {AppIcon} from '../AppIcon';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';

export function ArtworkBanner({currentImage, onChangePress, disabled = false}) {
  const {colors, typography, radius} = useTheme();

  return (
    <Pressable
      accessibilityHint="Opens artwork gallery to choose or crop a new puzzle picture"
      accessibilityLabel={`Current artwork: ${currentImage?.title || 'Default'}. Change artwork`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onChangePress}
      style={({pressed}) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
        },
        pressed && styles.pressed,
        disabled && styles.dimmed,
      ]}>
      <View style={styles.leftRow}>
        <View
          style={[
            styles.thumbnailWrap,
            {
              borderColor: colors.border,
              borderRadius: radius.sm,
            },
          ]}>
          {currentImage?.source ? (
            <Image
              fadeDuration={0}
              resizeMode="cover"
              source={currentImage.source}
              style={styles.thumbnail}
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                {
                  backgroundColor: colors.surfaceRaised,
                },
              ]}>
              <AppIcon color={colors.accent} name="image-outline" size={16} />
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <Text style={[typography.caption, styles.eyebrow, {color: colors.textSoft}]}>
            ARTWORK
          </Text>
          <Text numberOfLines={1} style={[typography.caption, styles.title, {color: colors.text}]}>
            {currentImage?.title || 'Moraine Lake'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.actionPill,
          {
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.border,
            borderRadius: radius.pill,
          },
        ]}>
        <AppIcon color={colors.accent} name="image-edit-outline" size={14} />
        <Text style={[typography.caption, styles.actionText, {color: colors.accent}]}>
          Change
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    width: '100%',
  },
  leftRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  thumbnailWrap: {
    borderWidth: 1,
    height: 34,
    overflow: 'hidden',
    width: 34,
  },
  thumbnail: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionPill: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  dimmed: {
    opacity: 0.5,
  },
});
