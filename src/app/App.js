import {useState} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AlarmEditorScreen} from '../screens/AlarmEditorScreen';
import {HomeScreen} from '../screens/HomeScreen';

export default function App() {
  const [screen, setScreen] = useState({name: 'home'});

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#10141A" />
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
    </SafeAreaProvider>
  );
}
