import {useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AlarmEditorScreen} from '../screens/AlarmEditorScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {ThemeProvider, useTheme} from '../theme/ThemeProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const theme = useTheme();
  const [screen, setScreen] = useState({name: 'home'});

  if (!theme.ready) {
    return (
      <View accessibilityLabel="Loading" style={styles.boot}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.shell, {backgroundColor: theme.colors.background}]}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.colors.background}
      />
      {screen.name === 'editor' ? (
        <AlarmEditorScreen
          alarm={screen.alarm}
          onClose={() => setScreen({name: 'home'})}
        />
      ) : (
        <HomeScreen
          onAdd={() => setScreen({name: 'editor', alarm: null})}
          onEdit={alarm => setScreen({name: 'editor', alarm})}
        />
      )}
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
