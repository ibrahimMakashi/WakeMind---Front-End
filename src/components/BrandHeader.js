import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {AppIcon} from './AppIcon';

export function BrandHeader({subtitle = 'ALARMS'}) {
  const navigation = useNavigation();
  const {colors, typography, radius} = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: colors.surfaceElevated || colors.surfaceDeep,
              borderColor: colors.borderSubtle || colors.border,
              borderRadius: radius.icon,
            },
          ]}>
          <AppIcon name="lightning-bolt" color={colors.accent} size={22} />
        </View>
        <View>
          <Text style={[typography.brandTitle, {color: colors.text}]}>
            B-DISCIPLINE
          </Text>
          <Text style={[typography.brandSubtitle, {color: colors.accent}]}>
            {subtitle}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        onPress={() => navigation.navigate('Profile')}
        style={[styles.profile, {backgroundColor: colors.accent}]}>
        <AppIcon name="account" color={colors.accentText} size={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconTile: {
    alignItems: 'center',
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
  },
  profile: {
    alignItems: 'center',
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
});
