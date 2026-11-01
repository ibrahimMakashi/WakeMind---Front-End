import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {AppIcon} from '../AppIcon';
import {SurfaceCard} from '../SurfaceCard';
import {spacing} from '../../constants/theme';
import {useTheme} from '../../theme/ThemeProvider';

export function AlarmArtworkCard({currentImage, onChangePress, disabled = false}) {
  const {colors, typography, radius} = useTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <Text style={[typography.sectionLabel, {color: colors.muted}]}>PUZZLE CHALLENGE</Text>
      </View>
      <Text style={[typography.caption, styles.description, {color: colors.textSoft}]}>
        Choose the artwork for this alarm's wake-up puzzle.
      </Text>

      <View style={[styles.contentRow, {backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md}]}>
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
            <View style={[styles.placeholder, {backgroundColor: colors.surfaceRaised}]}>
              <AppIcon color={colors.accent} name="image-outline" size={20} />
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <Text numberOfLines={1} style={[typography.bodyStrong, {color: colors.text}]}>
            {currentImage?.title || 'Moraine Lake'}
          </Text>
          <Text numberOfLines={1} style={[typography.caption, styles.subtitle, {color: colors.muted}]}>
            3×3 Puzzle Image
          </Text>
        </View>

        <Pressable
          accessibilityHint="Opens artwork gallery to choose a new puzzle picture for this alarm"
          accessibilityLabel={`Change puzzle artwork. Current artwork: ${currentImage?.title || 'Moraine Lake'}`}
          accessibilityRole="button"
          disabled={disabled}
          onPress={onChangePress}
          style={({pressed}) => [
            styles.changeButton,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
              borderRadius: radius.pill,
            },
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}>
          <AppIcon color={colors.accent} name="image-edit-outline" size={14} />
          <Text style={[typography.caption, styles.changeText, {color: colors.accent}]}>
            Change
          </Text>
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  description: {
    marginTop: spacing.xs,
  },
  contentRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  thumbnailWrap: {
    borderWidth: 1,
    height: 48,
    overflow: 'hidden',
    width: 48,
  },
  thumbnail: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  meta: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  subtitle: {
    marginTop: 2,
  },
  changeButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  changeText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
