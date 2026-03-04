import { Appbar } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

export default function AppBarHeader(props: any) {
  const { navigation, back, options } = props;
  const { isDark, toggleTheme, theme } = useTheme();
  const title = options?.title || 'Home';

  return (
    <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
      {back ? <Appbar.BackAction onPress={() => navigation.goBack()} /> : null}
      <Appbar.Content title={title} titleStyle={{ color: theme.colors.onSurface }} />
      <Appbar.Action
        icon={isDark ? 'brightness-5' : 'brightness-2'}
        onPress={toggleTheme}
        accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      />
    </Appbar.Header>
  );
}
