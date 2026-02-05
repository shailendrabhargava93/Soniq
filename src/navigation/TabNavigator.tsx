import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNavigation } from 'react-native-paper';
import Home from '../screens/Home';
import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';
import HomeScreen from '../screens/HomeScreen';
import AppBarHeader from '../components/AppBarHeader';

const Tab = createBottomTabNavigator();

function PaperBottomBar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();

  const paperRoutes = state.routes.map((r: any) => {
    const options = descriptors[r.key]?.options || {};
    return {
      key: r.key,
      title: options.title || r.name,
      // store the nav route name so we can navigate on index change
      routeName: r.name,
    };
  });

  const renderIcon = ({ route, focused, color }: any) => {
    const name = route.title === 'Home' ? 'home'
      : route.title === 'Search' ? 'search'
      : route.title === 'Explore' ? 'explore'
      : route.title === 'Library' ? 'library-music'
      : 'circle';
    return <MaterialIcons name={name as any} size={24} color={color} />;
  };

  // TS types for Paper's BottomNavigation.Bar don't line up with react-navigation's tabBar props
  // Use a typed alias to bypass the mismatch.
  const PaperBar: any = BottomNavigation.Bar;
  return (
    <PaperBar
      navigationState={{ index: state.index, routes: paperRoutes }}
      safeAreaInsets={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onIndexChange={(newIndex: number) => {
        const routeName = state.routes[newIndex].name;
        navigation.navigate(routeName);
      }}
      // some versions of react-native-paper call `onTabPress`; provide it to avoid runtime errors
      onTabPress={(info: any) => {
        try {
          const routeKey = info?.route?.key ?? info?.key ?? info?.routeName ?? info;
          const found = state.routes.find((r: any) => r.key === routeKey || r.name === routeKey || r.name === info?.route?.name);
          if (found) navigation.navigate(found.name);
        } catch (e) {
          // swallow
        }
      }}
      getLabelText={({ route }: any) => route.title}
      renderIcon={renderIcon}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      style={{ backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }}
    />
  );
}

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PaperBottomBar {...props} />}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: 'Home', header: (props) => <AppBarHeader {...props} /> , headerShown: true}} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="Explore" component={require('../screens/ExploreScreen').default} options={{ title: 'Explore' }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'Library' }} />
    </Tab.Navigator>
  );
};

export default TabNavigator;