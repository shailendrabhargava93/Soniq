
import TabNavigator from './TabNavigator';

/**
 * The root navigator is now just the TabNavigator.
 * Every detail screen (Album, Playlist, Artist, Settings, etc.)
 * lives inside each tab's own stack so the bottom tab bar stays
 * visible on every screen.
 */
const AppNavigator = () => {
  return <TabNavigator />;
};

export default AppNavigator;