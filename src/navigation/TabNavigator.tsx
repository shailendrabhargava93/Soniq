import React from "react";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNavigation } from 'react-native-paper';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ExploreScreen from '../screens/ExploreScreen';
import AlbumScreen from '../screens/AlbumScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import ArtistScreen from '../screens/ArtistScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FavouritesScreen from '../screens/FavouritesScreen';
import RecentlyPlayed from '../screens/RecentlyPlayed';
import SectionListScreen from '../screens/SectionListScreen';
import PlaylistResultsScreen from '../screens/PlaylistResultsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/* ── Shared detail screens added to every tab stack ── */
const sharedScreens = (S: typeof Stack) => (
  <>
    <S.Screen name="Album" component={AlbumScreen} />
    <S.Screen name="Playlist" component={PlaylistScreen} />
    <S.Screen name="Artist" component={ArtistScreen} />
    <S.Screen name="Player" component={PlayerScreen} />
    <S.Screen name="Settings" component={SettingsScreen} />
    <S.Screen name="Favourites" component={FavouritesScreen} />
    <S.Screen name="RecentlyPlayed" component={RecentlyPlayed} />
    <S.Screen name="SectionList" component={SectionListScreen} />
    <S.Screen name="PlaylistResults" component={PlaylistResultsScreen} />
  </>
);

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      {sharedScreens(Stack)}
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain" component={SearchScreen} />
      {sharedScreens(Stack)}
    </Stack.Navigator>
  );
}

function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreMain" component={ExploreScreen} />
      {sharedScreens(Stack)}
    </Stack.Navigator>
  );
}

function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LibraryMain" component={LibraryScreen} />
      {sharedScreens(Stack)}
    </Stack.Navigator>
  );
}

/* ── Paper bottom bar ── */
function PaperBottomBar({ state, descriptors, navigation }: any) {
  const { theme, showBottomNavLabels } = useTheme();

  const paperRoutes = state.routes.map((r: any) => {
    const options = descriptors[r.key]?.options || {};
    return {
      key: r.key,
      title: options.title || r.name,
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

  const PaperBar: any = BottomNavigation.Bar;
  return (
    <PaperBar
      navigationState={{ index: state.index, routes: paperRoutes }}
      safeAreaInsets={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onIndexChange={(newIndex: number) => {
        const routeName = state.routes[newIndex].name;
        const targetMain = `${routeName}Main`;
        navigation.navigate(routeName, { screen: targetMain });
      }}
      onTabPress={(info: any) => {
        try {
          const routeKey = info?.route?.key ?? info?.key ?? info?.routeName ?? info;
          const found = state.routes.find((r: any) => r.key === routeKey || r.name === routeKey || r.name === info?.route?.name);
          if (found) {
            const targetMain = `${found.name}Main`;
            navigation.navigate(found.name, { screen: targetMain });
          }
        } catch (e) {
          // swallow
        }
      }}
      getLabelText={({ route }: any) => route.title}
      renderIcon={renderIcon}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      style={{ backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }}
      shifting={!showBottomNavLabels}
      labeled={showBottomNavLabels}
    />
  );
}

/* ── Tab navigator (root) ── */
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PaperBottomBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Search" component={SearchStack} options={{ title: 'Search' }} />
      <Tab.Screen name="Explore" component={ExploreStack} options={{ title: 'Explore' }} />
      <Tab.Screen name="Library" component={LibraryStack} options={{ title: 'Library' }} />
    </Tab.Navigator>
  );
};

export default TabNavigator;