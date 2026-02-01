import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

export default function HorizontalScroller({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.container, { columnGap: gap }]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
});
