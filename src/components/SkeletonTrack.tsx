import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const SHIMMER = {
  minOpacity: 0.35,
  maxOpacity: 0.95,
  pulseIn: 650,
  pulseOut: 650,
};

const LAYOUT = {
  rowPaddingVertical: 8,
  rowPaddingHorizontal: 6,
  image: 56,
  imageRadius: 6,
  titleHeight: 15,
  subtitleHeight: 12,
};

export default function SkeletonTrack(): React.JSX.Element {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(SHIMMER.minOpacity)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
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
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: LAYOUT.rowPaddingVertical, paddingHorizontal: LAYOUT.rowPaddingHorizontal }}>
      <Animated.View 
        style={{ 
          width: LAYOUT.image, 
          height: LAYOUT.image, 
          borderRadius: LAYOUT.imageRadius, 
          marginRight: 12, 
          backgroundColor,
          opacity,
        }} 
      />
      <View style={{ flex: 1 }}>
        <Animated.View 
          style={{ 
            height: LAYOUT.titleHeight, 
            marginBottom: 8, 
            borderRadius: 4, 
            width: '60%',
            backgroundColor,
            opacity,
          }} 
        />
        <Animated.View 
          style={{ 
            height: LAYOUT.subtitleHeight, 
            width: '40%', 
            borderRadius: 4,
            backgroundColor,
            opacity,
          }} 
        />
      </View>
    </View>
  );
}
