import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Animated, NativeScrollEvent, NativeSyntheticEvent, FlatListProps, Image } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

const HEADER_HEIGHT = 60;
const SCROLL_THRESHOLD = 280;

interface HeroLayoutProps {
  coverImage: string | null;
  coverImages?: string[];
  title: string;
  subtitle: string;
  isLiked?: boolean;
  onLikePress?: () => void;
  onPlayPress: () => void;
  onShufflePress: () => void;
  isPlayActive?: boolean;
  data: any[];
  renderItem: FlatListProps<any>['renderItem'];
  keyExtractor: FlatListProps<any>['keyExtractor'];
  listHeaderComponent?: React.ReactElement;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  contentContainerStyle?: any;
  coverSize?: number;
  circularCover?: boolean;
  customHeroContent?: React.ReactElement;
}

const HeroLayout: React.FC<HeroLayoutProps> = ({
  coverImage,
  coverImages = [],
  title,
  subtitle,
  isLiked = false,
  onLikePress,
  onPlayPress,
  onShufflePress,
  isPlayActive = false,
  data,
  renderItem,
  keyExtractor,
  listHeaderComponent,
  onEndReached,
  onEndReachedThreshold = 0.5,
  contentContainerStyle,
  coverSize = 200,
  circularCover = false,
  customHeroContent,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [showHeader, setShowHeader] = useState(false);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const collageImages = (Array.isArray(coverImages) ? coverImages : [])
    .filter((img) => typeof img === 'string' && img.trim().length > 0)
    .slice(0, 4);
  const showCollage = !circularCover && collageImages.length > 0;
  const collageTiles = showCollage
    ? Array.from({ length: 4 }, (_, idx) => collageImages[idx] || collageImages[idx % collageImages.length])
    : [];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShow = scrollY > SCROLL_THRESHOLD;
    if (shouldShow !== showHeader) {
      setShowHeader(shouldShow);
      Animated.timing(headerOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Floating back button - always visible */}
      <TouchableOpacity 
        style={[styles.floatingBackButton, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
      </TouchableOpacity>

      {/* Animated Header - appears on scroll */}
      <Animated.View 
        style={[
          styles.headerWrapper, 
          { 
            backgroundColor: theme.colors.surface,
            opacity: headerOpacity,
            transform: [{
              translateY: headerOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-HEADER_HEIGHT, 0],
              })
            }]
          }
        ]}
        pointerEvents={showHeader ? 'auto' : 'none'}
      >
        <View style={styles.animatedHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      {/* Main Content */}
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={
          <>
            <View style={{ height: 16 }} />
            {listHeaderComponent}
            
            {/* Hero Section */}
            {customHeroContent ? (
              customHeroContent
            ) : (
              <View style={styles.heroSection}>
                <Card style={[styles.coverCard, { 
                  backgroundColor: theme.colors.surface,
                  width: coverSize,
                  height: coverSize,
                  borderRadius: circularCover ? coverSize / 2 : 12,
                }]}>
                  {showCollage ? (
                    <View style={[styles.collageWrap, { width: coverSize, height: coverSize }]}>
                      {collageTiles.map((img, idx) => (
                        <View
                          key={`${img}-${idx}`}
                          style={[styles.collageCell, { width: coverSize / 2, height: coverSize / 2 }]}
                        >
                          <Image source={{ uri: img }} style={styles.collageImage} />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Card.Cover
                      source={coverImage ? { uri: coverImage } : require('../../assets/icon.png')}
                      style={{
                        width: coverSize,
                        height: coverSize,
                        borderRadius: circularCover ? coverSize / 2 : 0,
                      }}
                    />
                  )}
                </Card>
                <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                  {title}
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {subtitle}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.iconButton, { borderColor: theme.colors.outline }]} 
                onPress={onShufflePress}
              >
                <MaterialIcons name="shuffle" size={18} color={theme.colors.onSurface} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.playButton, { backgroundColor: theme.colors.primary }]} 
                onPress={onPlayPress}
              >
                <MaterialIcons name={isPlayActive ? 'pause' : 'play-arrow'} size={18} color={theme.colors.onPrimary || '#fff'} />
                <Text style={[styles.playButtonText, { color: theme.colors.onPrimary || '#fff' }]}>
                  {isPlayActive ? 'Pause' : 'Play'}
                </Text>
              </TouchableOpacity>

              {onLikePress && (
                <TouchableOpacity
                  style={[styles.iconButton, { borderColor: theme.colors.outline }]}
                  onPress={onLikePress}
                >
                  <MaterialIcons 
                    name={isLiked ? 'favorite' : 'favorite-border'} 
                    size={20} 
                    color={isLiked ? '#EF4444' : theme.colors.onSurfaceVariant} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  floatingBackButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 999,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  animatedHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  coverCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  collageWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  collageCell: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  collageImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  playButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HeroLayout;
