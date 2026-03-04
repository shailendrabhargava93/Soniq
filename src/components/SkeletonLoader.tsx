import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonLoaderProps {
  type?: 'list' | 'grid' | 'card' | 'home';
  count?: number;
}

const SHIMMER = {
  minOpacity: 0.35,
  maxOpacity: 0.95,
  pulseIn: 650,
  pulseOut: 650,
};

const LAYOUT = {
  list: {
    image: 56,
    imageRadius: 6,
    titleHeight: 15,
    subtitleHeight: 12,
    rowPaddingVertical: 8,
    rowPaddingHorizontal: 6,
  },
  card: {
    size: 150,
    radius: 8,
    titleHeight: 14,
    subtitleHeight: 12,
    itemGap: 12,
  },
};

const SkeletonBox = ({ width, height, borderRadius = 4, style = {}, delay = 0 }: any) => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(SHIMMER.minOpacity)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: SHIMMER.maxOpacity,
          duration: SHIMMER.pulseIn,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: SHIMMER.minOpacity,
          duration: SHIMMER.pulseOut,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const backgroundColor = theme.colors.surfaceVariant;

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor,
        opacity,
        ...style,
      }}
    />
  );
};

export default function SkeletonLoader({ type = 'list', count = 5 }: SkeletonLoaderProps): React.JSX.Element {
  const renderListItem = (index: number) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: LAYOUT.list.rowPaddingVertical, paddingHorizontal: LAYOUT.list.rowPaddingHorizontal }}>
      <SkeletonBox width={LAYOUT.list.image} height={LAYOUT.list.image} borderRadius={LAYOUT.list.imageRadius} style={{ marginRight: 12 }} delay={index * 70} />
      <View style={{ flex: 1 }}>
        <SkeletonBox width="70%" height={LAYOUT.list.titleHeight} style={{ marginBottom: 8 }} delay={index * 70 + 40} />
        <SkeletonBox width="50%" height={LAYOUT.list.subtitleHeight} delay={index * 70 + 80} />
      </View>
    </View>
  );

  const renderCardItem = (index: number) => (
    <View style={{ width: LAYOUT.card.size, marginRight: LAYOUT.card.itemGap }}>
      <SkeletonBox width={LAYOUT.card.size} height={LAYOUT.card.size} borderRadius={LAYOUT.card.radius} style={{ marginBottom: 8 }} delay={index * 70} />
      <SkeletonBox width="90%" height={LAYOUT.card.titleHeight} style={{ marginBottom: 6 }} delay={index * 70 + 40} />
      <SkeletonBox width="70%" height={LAYOUT.card.subtitleHeight} delay={index * 70 + 80} />
    </View>
  );

  const renderHomeSection = (sectionIndex: number) => (
    <View style={{ marginBottom: 24 }}>
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <SkeletonBox width={140} height={24} delay={sectionIndex * 100} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {[1, 2, 3, 4].map((i, idx) => (
          <View key={i}>{renderCardItem(sectionIndex * 4 + idx)}</View>
        ))}
      </ScrollView>
    </View>
  );

  const renderGridItem = (index: number) => (
    <View style={{ width: '48%', marginBottom: 16 }}>
      <SkeletonBox width="100%" height={160} borderRadius={8} style={{ marginBottom: 8 }} delay={index * 70} />
      <SkeletonBox width="85%" height={14} style={{ marginBottom: 6 }} delay={index * 70 + 40} />
      <SkeletonBox width="60%" height={12} delay={index * 70 + 80} />
    </View>
  );

  if (type === 'home') {
    return (
      <ScrollView style={{ flex: 1, paddingTop: 16 }}>
        {[1, 2, 3, 4].map((i, idx) => (
          <View key={i}>{renderHomeSection(idx)}</View>
        ))}
      </ScrollView>
    );
  }

  if (type === 'grid') {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16 }}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i}>{renderGridItem(i)}</View>
        ))}
      </View>
    );
  }

  if (type === 'card') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i}>{renderCardItem(i)}</View>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={{ paddingTop: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>{renderListItem(i)}</View>
      ))}
    </View>
  );
}
