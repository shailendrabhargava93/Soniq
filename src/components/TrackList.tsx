import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function TrackList<T>({
  items,
  loading = false,
  renderItem,
  emptyMessage = 'No items',
  skeletonCount = 6,
  keyExtractor,
}: {
  items: T[];
  loading?: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  skeletonCount?: number;
  keyExtractor?: (item: T, index: number) => string;
}) {
  if (loading) {
    const arr = new Array(skeletonCount).fill(0);
    return (
      <View style={{ padding: 8 }}>
        {arr.map((_, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text style={{ backgroundColor: '#eee', height: 48, borderRadius: 6 }} />
          </View>
        ))}
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: '#666' }}>{emptyMessage}</Text>
      </View>
    );
  }

  const defaultKey = (item: any, idx: number) => (item && (item.id ?? item.key ?? item.name) ? String(item.id ?? item.key ?? item.name) : String(idx));

  return (
    <FlatList
      data={items}
      keyExtractor={(item, idx) => (keyExtractor ? keyExtractor(item, idx) : defaultKey(item, idx))}
      renderItem={({ item, index }) => <>{renderItem(item as T, index)}</>}
    />
  );
}

const styles = StyleSheet.create({
  empty: { padding: 16, alignItems: 'center' },
});
