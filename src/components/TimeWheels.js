import {useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import {useTheme} from '../theme/ThemeProvider';
import {
  hourPickerItems,
  minutePickerItems,
  periodPickerItems,
  shouldCommitPickerValue,
} from './timePickerData';

const ITEM_HEIGHT = 44;
const HOURS = hourPickerItems();
const MINUTES = minutePickerItems();
const PERIODS = periodPickerItems();

export function TimeWheels({
  hour12,
  minute,
  period,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
}) {
  const {colors} = useTheme();
  return (
    <View style={styles.wheels}>
      <View
        pointerEvents="none"
        style={[styles.band, {backgroundColor: colors.pickerBand}]}
      />
      <View style={styles.row}>
        <WheelColumn
          label="Hour"
          data={HOURS}
          value={hour12}
          onChange={onHourChange}
          textColor={colors.text}
        />
        <WheelColumn
          label="Minute"
          data={MINUTES}
          value={minute}
          onChange={onMinuteChange}
          textColor={colors.text}
        />
        <WheelColumn
          label="AM or PM"
          data={PERIODS}
          value={period}
          onChange={onPeriodChange}
          textColor={colors.text}
        />
      </View>
    </View>
  );
}

function WheelColumn({label, data, value, onChange, textColor}) {
  const touchedRef = useRef(false);

  function onValueChanged(event) {
    const nextValue = event && event.item ? event.item.value : null;
    if (shouldCommitPickerValue(touchedRef.current, nextValue, value)) {
      onChange(nextValue);
    }
  }

  return (
    <View
      accessibilityLabel={label}
      style={styles.column}
      onStartShouldSetResponderCapture={() => {
        touchedRef.current = true;
        return false;
      }}>
      <WheelPicker
        data={data}
        value={value}
        itemHeight={ITEM_HEIGHT}
        visibleItemCount={5}
        width="100%"
        enableScrollByTapOnItem
        disableIntervalMomentum
        renderOverlay={null}
        onValueChanged={onValueChanged}
        itemTextStyle={[styles.itemText, {color: textColor}]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wheels: {
    justifyContent: 'center',
    marginTop: 8,
  },
  band: {
    borderRadius: 12,
    height: ITEM_HEIGHT,
    left: 0,
    marginTop: -ITEM_HEIGHT / 2,
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
  itemText: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
});
