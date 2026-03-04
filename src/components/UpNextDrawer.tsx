
import { View, Modal, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { usePlayer } from '../contexts/PlayerContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function UpNextDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const player = usePlayer();
  const { theme } = useTheme();

  const removeAt = (idx: number) => {
    player.removeFromQueue(idx);
  };

  const clearAll = () => {
    player.clearQueue();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          {/* Drag handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: theme.colors.surfaceVariant }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Up Next ({player.queue.length})
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {player.queue.length > 0 && (
                <TouchableOpacity onPress={clearAll} style={{ marginRight: 16 }}>
                  <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={player.queue}
            keyExtractor={(i, idx) => `${i.id}-${idx}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity 
                style={[styles.row, { borderBottomColor: theme.colors.surfaceVariant }]} 
                onPress={async () => { 
                  await player.playSong(item); 
                  player.open(item);
                  onClose();
                }}
              >
                {item.artwork && (
                  <Image source={{ uri: item.artwork }} style={styles.thumbnail} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ padding: 24, alignItems: 'center' }}>
                <MaterialIcons name="queue-music" size={48} color={theme.colors.surfaceVariant} />
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  Queue is empty
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  sheet: { 
    height: '70%', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    paddingBottom: 12 
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  itemTitle: { 
    fontWeight: '600',
    fontSize: 15,
  },
  itemSubtitle: { 
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
  },
});
