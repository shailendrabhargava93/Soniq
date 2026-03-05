import { registerRootComponent } from 'expo';
import App from './App';
import { registerTrackPlayer } from './src/services/trackPlayerRegistration';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Register the playback service for background / lock-screen / notification controls.
// On web this is a no-op (trackPlayerRegistration.web.ts is used instead).
registerTrackPlayer();
