import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { GestureResponderEvent } from 'react-native';

export default function SongItem({
  title,
  artist,
  imageSrc,
  onPress,
  rightContent,
  playing = false,
}: {
  title: string;
  artist?: string;
  imageSrc?: string;
  onPress?: (e: GestureResponderEvent) => void;
  rightContent?: React.ReactNode;
  playing?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, playing ? styles.playing : null]} activeOpacity={0.8}>
      <View style={styles.left}>
        {imageSrc ? (
          <Image source={{ uri: imageSrc }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
      </View>
      <View style={styles.middle}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {artist ? <Text numberOfLines={1} style={styles.artist}>{artist}</Text> : null}
      </View>
      <View style={styles.right}>{rightContent}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  playing: { backgroundColor: 'rgba(0,0,0,0.04)' },
  left: { marginRight: 12 },
  image: { width: 56, height: 56, borderRadius: 6, backgroundColor: '#ddd' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, minWidth: 0 },
  title: { fontWeight: '600' },
  artist: { color: '#666', marginTop: 2, fontSize: 12 },
  right: { marginLeft: 12 },
});
