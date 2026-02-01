import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Button } from 'react-native';
import { Provider as PaperProvider, configureFonts, MD3LightTheme } from 'react-native-paper';
import SimplePlayer from './src/components/SimplePlayer';
import Home from './src/screens/Home';
import { PlayerProvider } from './src/contexts/PlayerContext';

// Configure Paper to use Expo vector icons
const theme = {
  ...MD3LightTheme,
};

type RootStackParamList = {
  Home: undefined;
  Player: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeScreen({ navigation }: any) {
  return <Home />;
}

function PlayerScreen({ navigation }: any) {
  const sampleTrack = {
    id: '1',
    title: 'Sample Track',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Player</Text>
      <SimplePlayer track={sampleTrack} />
      <View style={{ height: 16 }} />
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <PaperProvider theme={theme}>
          <PlayerProvider>
            <Stack.Navigator initialRouteName="Home">
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Player" component={PlayerScreen} />
            </Stack.Navigator>
            <StatusBar style="auto" />
          </PlayerProvider>
        </PaperProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

