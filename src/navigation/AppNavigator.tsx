import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import AlbumScreen from '../screens/AlbumScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import ArtistScreen from '../screens/ArtistScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FavouritesScreen from '../screens/FavouritesScreen';
import RecentlyPlayed from '../screens/RecentlyPlayed';
import SectionListScreen from '../screens/SectionListScreen';
import PlaylistResultsScreen from '../screens/PlaylistResultsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Hide headers since screens have their own headers
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Album" component={AlbumScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
      <Stack.Screen name="Artist" component={ArtistScreen} />
      <Stack.Screen name="Player" component={PlayerScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="RecentlyPlayed" component={RecentlyPlayed} />
      <Stack.Screen name="SectionList" component={SectionListScreen} />
      <Stack.Screen name="PlaylistResults" component={PlaylistResultsScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;