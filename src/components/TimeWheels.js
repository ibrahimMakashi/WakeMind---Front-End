import {useEffect, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import {spacing} from '../constants/theme';
import {useTheme} from '../theme/ThemeProvider';
import {
  hourPickerItems,
  minutePickerItems,
  periodPickerItems,
  shouldCommitPickerValue,
} from './timePickerData';

const ITEM_HEIGHT = 44;
const READY_DELAY_MS = 350;
const HOURS = hourPickerItems();
const MINUTES = minutePickerItems();
const PERIODS = periodPickerItems();

export function TimeWheels({hour12, minute, period, onHourChange, onMinuteChange, onPeriodChange}) {
  const {colors} = useTheme();
  return (
    <View style={styles.row}>
      <WheelColumn
        label="Hour"
        data={HOURS}
        value={hour12}
        onChange={onHourChange}
        colors={colors}
      />
      <WheelColumn
        label="Minute"
        data={MINUTES}
        value={minute}
        onChange={onMinuteChange}
        colors={colors}
      />
      <WheelColumn
        label="AM or PM"
        data={PERIODS}
        value={period}
        onChange={onPeriodChange}
        colors={colors}
      />
    </View>
  );
}

function WheelColumn({label, data, value, onChange, colors}) {
  const readyRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      readyRef.current = true;
    }, READY_DELAY_MS);
    return () => {
      clearTimeout(timer);
      readyRef.current = false;
    };
  }, []);

  function onValueChanged(event) {
    const nextValue = event && event.item ? event.item.value : null;
    if (shouldCommitPickerValue(readyRef.current, nextValue, value)) {
      onChange(nextValue);
    }
  }

  return (
    <View
      accessibilityLabel={label}
      style={styles.column}>
      <Text style={[styles.label, {color: colors.muted}]}>{label}</Text>
      <WheelPicker
        data={data}
        value={value}
        itemHeight={ITEM_HEIGHT}
        visibleItemCount={5}
        width="100%"
        enableScrollByTapOnItem
        disableIntervalMomentum
        onValueChanged={onValueChanged}
        itemTextStyle={[styles.itemText, {color: colors.text}]}
        overlayItemStyle={[
          styles.overlay,
          {borderColor: colors.line, backgroundColor: colors.surfaceRaised},
        ]}
        style={styles.picker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  picker: {
    marginTop: spacing.xs,
  },
  itemText: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  overlay: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    opacity: 0.9,
  },
});
