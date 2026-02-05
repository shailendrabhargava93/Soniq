import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Title, Card, Subheading, Button } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/Header';

interface SectionListScreenProps {}

const SectionListScreen: React.FC<SectionListScreenProps> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { type, title, data } = route.params as { type: string; title: string; data: any[] };

  const renderItem = ({ item }: { item: any }) => (
      <TouchableOpacity style={styles.itemContainer} onPress={() => {
        try {
          (navigation as any).navigate('Playlist', { playlist: item });
        } catch (e) {
          // fallback: do nothing
        }
      }}>
      <Card style={styles.itemCard}>
        <Card.Cover
          source={item?.image ? { uri: item.image } : require('../../assets/icon.png')}
          style={styles.itemImage}
        />
        <Card.Content>
          <Title numberOfLines={2} style={styles.itemTitle}>{item.title || item.name}</Title>
          <Subheading numberOfLines={1} style={styles.itemSubtitle}>
            {item.artist || item.subtitle || item.name}
          </Subheading>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>{title}</Title>
      </View>

      <FlatList
        data={data || []}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    flex: 1,
    margin: 4,
  },
  itemCard: {
    flex: 1,
  },
  itemImage: {
    height: 140,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default SectionListScreen;