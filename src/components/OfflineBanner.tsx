import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import networkStatus from '../services/networkStatus';
import { useTheme } from '../contexts/ThemeContext';

export default function OfflineBanner() {
  const [state, setState] = useState<any>(networkStatus.getLastFetchFailed());
  const { theme } = useTheme();

  useEffect(() => {
    const unsub = networkStatus.subscribeNetworkStatus((s) => setState(s));
    return unsub;
  }, []);

  if (!state?.lastFetchFailed) return null;

  return (
    <View style={{ backgroundColor: theme.colors.surfaceVariant, padding: 8 }}>
      <Text style={{ color: theme.colors.onSurfaceVariant }}>You appear to be offline or some requests failed. Showing cached content where available.</Text>
    </View>
  );
}
