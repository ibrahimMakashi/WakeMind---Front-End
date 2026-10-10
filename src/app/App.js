import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AlarmsProvider} from '../alarms/AlarmsProvider';
import {boot} from '../constants/theme';
import {RootNavigator} from '../navigation/RootNavigator';
import {ThemeProvider, useTheme} from '../theme/ThemeProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlarmsProvider>
          <Root />
        </AlarmsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const theme = useTheme();

  if (!theme.ready || !theme.colors) {
    return (
      <View
        accessibilityLabel="Loading"
        style={[styles.boot, {backgroundColor: boot.background}]}>
        <ActivityIndicator color={boot.indicator} />
      </View>
    );
  }

  return (
    <View style={[styles.shell, {backgroundColor: theme.colors.background}]}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.colors.background}
      />
      <RootNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  shell: {
    flex: 1,
  },
});
