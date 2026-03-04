import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { PlayerProvider } from './src/contexts/PlayerContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import AppNavigator from './src/navigation/AppNavigator';
import WelcomeScreen, { checkHasVisited } from './src/screens/WelcomeScreen';
import OfflineBanner, { OFFLINE_BANNER_HEIGHT } from './src/components/OfflineBanner';
import networkStatus from './src/services/networkStatus';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isOffline, setIsOffline] = useState(networkStatus.getLastFetchFailed().lastFetchFailed);

  useEffect(() => {
    // Load Roboto font for web
    if (Platform.OS === 'web') {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      // Set default font family on body
      document.body.style.fontFamily = 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif';
    }
  }, []);

  useEffect(() => {
    (async () => {
      const hasVisited = await checkHasVisited();
      setShowWelcome(!hasVisited);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    const unsub = networkStatus.subscribeNetworkStatus((s) => setIsOffline(Boolean(s?.lastFetchFailed)));
    return unsub;
  }, []);

  // Don't render anything while checking
  if (isLoading) {
    return null;
  }

  // Show welcome screen if first visit
  if (showWelcome) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <WelcomeScreen onGetStarted={() => setShowWelcome(false)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <FavoritesProvider>
          <PlayerProvider>
            <View style={{ flex: 1 }}>
              <OfflineBanner />
              <View style={{ flex: 1, paddingTop: isOffline ? OFFLINE_BANNER_HEIGHT : 0 }}>
                <NavigationContainer
                  linking={{
                    prefixes: ['soniq://', 'https://soniq.app', 'app://'],
                    config: {
                      screens: {
                        Home: {
                          screens: {
                            HomeMain: '',
                            Album: 'album',
                            Playlist: 'playlist',
                            Artist: 'artist',
                            Player: 'player',
                            Settings: 'settings',
                            Favourites: 'favourites',
                            RecentlyPlayed: 'recently-played',
                            SectionList: 'section',
                            PlaylistResults: 'playlist-results',
                          }
                        },
                        Search: {
                          screens: {
                            SearchMain: 'search',
                          }
                        },
                        Explore: {
                          screens: {
                            ExploreMain: 'explore',
                          }
                        },
                        Library: {
                          screens: {
                            LibraryMain: 'library',
                          }
                        },
                      }
                    },
                  }}
                >
                  <AppNavigator />
                  <StatusBar style="auto" />
                </NavigationContainer>
              </View>
            </View>
          </PlayerProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
