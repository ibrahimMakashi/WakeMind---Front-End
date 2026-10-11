import {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {DarkTheme, DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AppIcon} from '../components/AppIcon';
import {AlarmEditorScreen} from '../screens/AlarmEditorScreen';
import {AlarmsScreen} from '../screens/AlarmsScreen';
import {JournalScreen} from '../screens/JournalScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {VisionScreen} from '../screens/VisionScreen';
import {motionDuration} from '../theme/motion';
import {useTheme} from '../theme/ThemeProvider';
import {usePrefersReducedMotion} from '../theme/usePrefersReducedMotion';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AlarmsTabIcon({color, size, focused}) {
  return <AppIcon name={focused ? 'alarm' : 'alarm'} color={color} size={size} />;
}

function VisionTabIcon({color, size}) {
  return <AppIcon name="star-four-points-outline" color={color} size={size} />;
}

function JournalTabIcon({color, size}) {
  return <AppIcon name="book-open-variant" color={color} size={size} />;
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
        card: colors.tabBar || colors.background,
        text: colors.text,
        border: colors.border,
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
            animationDuration: motionDuration(reducedMotion, 180),
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MainTabs() {
  const {colors, typography} = useTheme();
  return (
    <Tab.Navigator
      initialRouteName="Alarms"
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.tabBar || colors.background,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: typography.tabLabel,
        tabBarItemStyle: styles.item,
        sceneStyle: {backgroundColor: colors.background},
      }}>
      <Tab.Screen
        name="Alarms"
        component={AlarmsScreen}
        options={{
          tabBarAccessibilityLabel: 'Alarms',
          tabBarIcon: AlarmsTabIcon,
        }}
      />
      <Tab.Screen
        name="Vision"
        component={VisionScreen}
        options={{
          tabBarAccessibilityLabel: 'Vision',
          tabBarIcon: VisionTabIcon,
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarAccessibilityLabel: 'Journal',
          tabBarIcon: JournalTabIcon,
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
  item: {
    minHeight: 48,
  },
});
