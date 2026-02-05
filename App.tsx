import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { PlayerProvider } from './src/contexts/PlayerContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <PlayerProvider>
          <FavoritesProvider>
            <NavigationContainer
              linking={({
                prefixes: ['soniq://', 'https://soniq.app', 'app://'],
                config: {
                  screens: {
                    MainTabs: {
                      screens: {
                        Home: '',
                        Search: 'search',
                        Explore: 'explore',
                      }
                    },
                    Album: 'album/:id',
                    Playlist: 'playlist/:id',
                    Artist: 'artist/:id',
                    Player: 'player/:id',
                    Settings: 'settings',
                    Favourites: 'favourites',
                    RecentlyPlayed: 'recently-played'
                  }
                }
              }) as any}
            >
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </FavoritesProvider>
        </PlayerProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
