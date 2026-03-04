import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import MediaContextMenu from './MediaContextMenu';
import type { GestureResponderEvent } from 'react-native';

type MediaRowShape = 'square' | 'round';
type MediaType = 'song' | 'album' | 'playlist' | 'artist';

type MediaRowItem = {
  id?: string | number;
  title?: string;
  name?: string;
  subtitle?: string;
  artist?: string;
  artwork?: string | null;
  playing?: boolean;
  albumId?: string | number;
  album?: string;
  uri?: string;
  image?: string | null;
  songs?: any[];
};

type MediaRowProps = {
  item: MediaRowItem;
  type: MediaType;
  label?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  shape?: MediaRowShape;
  onPress?: (e?: GestureResponderEvent) => void;
  onLongPress?: () => void;
  showContextMenu?: boolean;
  showDragHandle?: boolean;
  onPlayAll?: (item: any) => void;
  onShuffle?: (item: any) => void;
  onAddToQueue?: (item: any) => void;
  onPlayNow?: (item: any) => void;
  onPlayNext?: (item: any) => void;
  onGoToAlbum?: (item: any) => void;
};

function MediaRow({
  item,
  type,
  label,
  iconName = 'music-note',
  shape = 'square',
  onPress,
  onLongPress,
  showContextMenu = true,
  showDragHandle = false,
  onPlayAll,
  onShuffle,
  onAddToQueue,
  onPlayNow,
  onPlayNext,
  onGoToAlbum,
}: MediaRowProps) {
  const { theme } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const isSong = type === 'song';
  const isRound = shape === 'round';
  const title = item.title || item.name;
  const subtitle = isSong ? item.artist || item.subtitle : item.subtitle;
  const imageSrc = isSong ? item.artwork || item.image : item.image;

  const imageStyle = useMemo(
    () => [styles.imageBase, isRound ? styles.imageRound : styles.imageSquare],
    [isRound],
  );
  const rowStyle = useMemo(
    () => [
      styles.container,
      { backgroundColor: isSong && item.playing ? theme.colors.surfaceVariant : theme.colors.background },
    ],
    [isSong, item.playing, theme.colors.background, theme.colors.surfaceVariant],
  );
  const placeholderStyle = useMemo(
    () => [imageStyle, styles.placeholder, { backgroundColor: theme.colors.surfaceVariant }],
    [imageStyle, theme.colors.surfaceVariant],
  );
  const titleStyle = useMemo(
    () => [styles.title, { color: theme.colors.onSurface }],
    [theme.colors.onSurface],
  );
  const subtitleStyle = useMemo(
    () => [styles.subtitle, { color: theme.colors.onSurfaceVariant }, isSong ? styles.songSubtitle : null],
    [isSong, theme.colors.onSurfaceVariant],
  );
  const labelStyle = useMemo(
    () => [styles.label, { color: theme.colors.primary }],
    [theme.colors.primary],
  );

  const handleOpenMenu = useCallback(() => setMenuVisible(true), []);
  const handleDismissMenu = useCallback(() => setMenuVisible(false), []);
  const handleNavigate = useCallback(() => onPress?.(), [onPress]);
  const renderMoreIcon = useCallback(
    ({ size, color }: { size: number; color: string }) => <MaterialIcons name="more-vert" size={size} color={color} />,
    [],
  );

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        style={rowStyle}
        activeOpacity={0.8}
      >
        <View style={styles.left}>
          {imageSrc ? (
            <Image source={{ uri: imageSrc }} style={imageStyle} />
          ) : (
            <View style={placeholderStyle}>
              <MaterialIcons name={iconName} size={24} color={theme.colors.onSurfaceVariant} />
            </View>
          )}
        </View>
        <View style={styles.middle}>
          {title ? (
            <Text numberOfLines={1} style={titleStyle}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text numberOfLines={1} style={subtitleStyle}>
              {subtitle}
            </Text>
          ) : null}
          {!isSong && label ? (
            <Text numberOfLines={1} style={labelStyle}>
              {label}
            </Text>
          ) : null}
        </View>
        {showContextMenu && (
          <View style={[styles.right, styles.rightRow]}>
            {isSong && showDragHandle ? (
              <MaterialIcons
                name="drag-handle"
                size={20}
                color={theme.colors.onSurfaceVariant}
                style={styles.dragHandle}
              />
            ) : null}
            <IconButton
              icon={renderMoreIcon}
              onPress={handleOpenMenu}
            />
          </View>
        )}
      </TouchableOpacity>

      <MediaContextMenu
        visible={menuVisible}
        onDismiss={handleDismissMenu}
        item={item}
        type={type}
        onPlayNow={onPlayNow}
        onPlayAll={onPlayAll}
        onShuffle={onShuffle}
        onAddToQueue={onAddToQueue}
        onPlayNext={onPlayNext}
        onGoToAlbum={onGoToAlbum}
        onNavigate={handleNavigate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  left: { marginRight: 12 },
  imageBase: { width: 56, height: 56, backgroundColor: '#ddd' },
  imageSquare: { borderRadius: 6 },
  imageRound: { borderRadius: 28 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, minWidth: 0 },
  title: { fontWeight: '400', fontSize: 15 },
  subtitle: { marginTop: 2, fontSize: 12 },
  songSubtitle: { fontSize: 12 },
  label: { marginTop: 2, fontSize: 11, fontWeight: '500' },
  right: { marginLeft: 12 },
  rightRow: { flexDirection: 'row', alignItems: 'center' },
  dragHandle: { marginRight: 8 },
});

export default memo(MediaRow);
