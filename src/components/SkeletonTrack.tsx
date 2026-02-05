import React from 'react';
import { View } from 'react-native';

export default function SkeletonTrack() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
      <View style={{ width: 56, height: 56, borderRadius: 6, backgroundColor: '#eee', marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <View style={{ height: 12, backgroundColor: '#eee', marginBottom: 8, borderRadius: 4, width: '60%' }} />
        <View style={{ height: 10, backgroundColor: '#f0f0f0', width: '40%', borderRadius: 4 }} />
      </View>
    </View>
  );
}
