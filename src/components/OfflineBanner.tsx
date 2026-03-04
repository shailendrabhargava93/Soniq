import React, { useEffect, useState } from "react";
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import networkStatus from '../services/networkStatus';

export const OFFLINE_BANNER_HEIGHT = 56;

export default function OfflineBanner() {
  const [state, setState] = useState<any>(networkStatus.getLastFetchFailed());

  useEffect(() => {
    const unsub = networkStatus.subscribeNetworkStatus((s) => setState(s));
    return unsub;
  }, []);

  if (!state?.lastFetchFailed) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.line}>No network.</Text>
      <Text style={styles.line}>Please reconnect to the internet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: OFFLINE_BANNER_HEIGHT,
    backgroundColor: '#E74863',
    paddingHorizontal: 16,
    justifyContent: 'center',
    zIndex: 2200,
  },
  line: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
});
