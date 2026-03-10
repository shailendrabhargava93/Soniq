import React from 'react';
import { View, StyleSheet, ScrollView, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import Header, { HeaderProps } from './Header';

interface ScreenWrapperProps {
  /** Header props to pass to the Header component */
  headerProps?: HeaderProps;
  /** Content to render inside the scrollable body */
  children: React.ReactNode;
  /** Custom header component (overrides default Header) */
  customHeader?: React.ReactNode;
  /** Height of the header (default: 60) */
  headerHeight?: number;
  /** Additional padding at the top (default: 8) */
  topPadding?: number;
  /** Additional padding at the bottom (default: 24) */
  bottomPadding?: number;
  /** ScrollView props to pass to the ScrollView */
  scrollViewProps?: ScrollViewProps;
  /** Whether to disable scrolling (useful for FlatList screens) */
  noScroll?: boolean;
  /** Content to render above the header (e.g., OfflineBanner) */
  aboveHeader?: React.ReactNode;
  /** Content to render at the very top of scrollable area */
  topContent?: React.ReactNode;
}

export default function ScreenWrapper({
  headerProps,
  children,
  customHeader,
  headerHeight = 60,
  topPadding = 8,
  bottomPadding = 24,
  scrollViewProps,
  noScroll = false,
  aboveHeader,
  topContent,
}: ScreenWrapperProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const safeHeaderHeight = headerHeight + insets.top;

  const contentContainerStyle = [
    { paddingTop: safeHeaderHeight + topPadding, paddingBottom: bottomPadding },
    scrollViewProps?.contentContainerStyle,
  ];

  const renderContent = () => {
    if (noScroll) {
      return (
        <View style={[styles.noScrollContent, { paddingTop: safeHeaderHeight + topPadding }]}>
          {topContent}
          {children}
        </View>
      );
    }

    return (
      <ScrollView
        {...scrollViewProps}
        contentContainerStyle={contentContainerStyle}
      >
        {topContent}
        {children}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Content above header (if any) */}
      {aboveHeader}

      {/* Fixed Header */}
      <View
        style={[
          styles.headerWrapper,
          { backgroundColor: theme.colors.surface, paddingTop: insets.top },
        ]}
      >
        {customHeader || <Header {...headerProps} />}
      </View>

      {/* Scrollable Body */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  noScrollContent: {
    flex: 1,
  },
});
