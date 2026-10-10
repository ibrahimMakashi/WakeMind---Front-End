import {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {DarkTheme, DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AppIcon} from '../components/AppIcon';
import {AlarmEditorScreen} from '../screens/AlarmEditorScreen';
import {AlarmsScreen} from '../screens/AlarmsScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {motionDuration} from '../theme/motion';
import {useTheme} from '../theme/ThemeProvider';
import {usePrefersReducedMotion} from '../theme/usePrefersReducedMotion';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabIcon({color, size, focused}) {
  return (
    <AppIcon name={focused ? 'home' : 'home-outline'} color={color} size={size} />
  );
}

function AlarmsTabIcon({color, size}) {
  return <AppIcon name="alarm" color={color} size={size} />;
}

function ProfileTabIcon({color, size, focused}) {
  return (
    <AppIcon
      name={focused ? 'account-circle' : 'account-circle-outline'}
      color={color}
      size={size}
    />
  );
}

export function RootNavigator() {
  const {colors, scheme} = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.line,
        notification: colors.accent,
      },
    };
  }, [colors, scheme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: colors.background},
        }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Editor"
          component={AlarmEditorScreen}
          options={{
            animation: reducedMotion ? 'none' : 'slide_from_right',
            animationDuration: motionDuration(reducedMotion, 220),
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MainTabs() {
  const {colors} = useTheme();
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        sceneStyle: {backgroundColor: colors.background},
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tab.Screen
        name="Alarms"
        component={AlarmsScreen}
        options={{
          tabBarAccessibilityLabel: 'Alarms',
          tabBarIcon: AlarmsTabIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarAccessibilityLabel: 'Profile',
          tabBarIcon: ProfileTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  item: {
    minHeight: 48,
  },
});
