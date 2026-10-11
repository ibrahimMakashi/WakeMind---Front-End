import {StyleSheet, Text, View} from 'react-native';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';

export function SectionHeader({label, meta, style}) {
  const {colors, typography} = useTheme();
  return (
    <View style={[styles.row, style]}>
      <Text style={[typography.sectionLabel, {color: colors.muted}]}>{label}</Text>
      {meta ? (
        <Text style={[typography.caption, styles.meta, {color: colors.accent}]}>
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  meta: {
    fontWeight: '700',
  },
});
