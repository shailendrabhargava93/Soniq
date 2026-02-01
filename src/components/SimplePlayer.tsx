import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { audioService } from '../services/audio';
import type { Track } from '../types/api';
import { usePlayer } from '../contexts/PlayerContext';

export default function SimplePlayer({ track, onOpenFullPlayer }: { track: Track; onOpenFullPlayer?: (t: Track) => void }) {
  const [playing, setPlaying] = useState(false);
  const [statusText, setStatusText] = useState('idle');

  useEffect(() => {
    let mounted = true;
    (async () => {
      await audioService.load(track.uri);
      audioService.setStatusUpdate((s) => {
        if (!mounted) return;
        if (!s) return setStatusText('unknown');
        setStatusText(s.isPlaying ? 'playing' : 'paused');
        setPlaying(!!s.isPlaying);
      });
    })();
    return () => {
      mounted = false;
      audioService.unload();
    };
  }, [track.uri]);

  const toggle = async () => {
    if (playing) await audioService.pause();
    else await audioService.play();
  };

  const playerCtx = (() => {
    try {
      return usePlayer();
    } catch {
      return null as any;
    }
  })();

  const openFull = () => {
    if (onOpenFullPlayer) return onOpenFullPlayer(track);
    if (playerCtx && playerCtx.open) return playerCtx.open(track);
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>{track.title}</Text>
      <Text style={{ marginBottom: 8 }}>{statusText}</Text>
      <Button title={playing ? 'Pause' : 'Play'} onPress={toggle} />
      <View style={{ height: 8 }} />
      <Button title="Open" onPress={openFull} />
    </View>
  );
}
