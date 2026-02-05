import React from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { usePlayer } from '../contexts/PlayerContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function UpNextDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const player = usePlayer();

  const removeAt = (idx: number) => {
    player.removeFromQueue(idx);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Up Next</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#444" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={player.queue}
            keyExtractor={(i) => i.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={styles.row} onPress={async () => { await player.playSong(item); player.open(item); }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSubtitle}>{item.artist}</Text>
                </View>
                <TouchableOpacity onPress={() => removeAt(index)}><MaterialIcons name="delete" size={22} color="#999" /></TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { height: '60%', backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemTitle: { fontWeight: '600' },
  itemSubtitle: { color: '#666', fontSize: 12 }
});
