import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { audioService } from '../services/audio';
import type { Track } from '../types/api';

export default function FullPlayer({ visible, onClose, track }: { visible: boolean; onClose: () => void; track?: Track | null }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (track) {
      (async () => {
        await audioService.load(track.uri);
        audioService.setStatusUpdate((s) => {
          if (!mounted) return;
          setPlaying(!!s?.isPlaying);
        });
      })();
    }
    return () => {
      mounted = false;
      audioService.unload();
    };
  }, [track?.uri]);

  const toggle = async () => {
    if (playing) await audioService.pause();
    else await audioService.play();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text>Close</Text></TouchableOpacity>
        {track ? (
          <>
            <Image source={ track.artwork ? { uri: track.artwork } : require('../../assets/icon.png') } style={styles.art} />
            <Text style={styles.title}>{track.title}</Text>
            <TouchableOpacity onPress={toggle} style={styles.playBtn}><Text>{playing ? 'Pause' : 'Play'}</Text></TouchableOpacity>
          </>
        ) : (
          <Text>No track</Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  closeBtn: { position: 'absolute', left: 16, top: 40 },
  art: { width: 260, height: 260, borderRadius: 8, marginBottom: 18 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  playBtn: { padding: 12, backgroundColor: '#eee', borderRadius: 8 },
});
