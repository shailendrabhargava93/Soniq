import React from 'react';
import { View, ScrollView, FlatList } from 'react-native';
import { Text, Card, IconButton, List } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';

const FavoritesScreen = () => {
  const { theme } = useTheme();
  const { favorites, removeFromFavorites } = useFavorites();

  const renderFavoriteItem = ({ item, index }: { item: any; index: number }) => (
    <Card style={{ marginBottom: 12, marginHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', padding: 16 }}>
        <Card.Cover 
          source={{ uri: item.cover }} 
          style={{ width: 60, height: 60, borderRadius: 4 }}
        />
        <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {item.title}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.artist}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.album}
          </Text>
        </View>
        <IconButton
          icon="favorite"
          size={24}
          onPress={() => removeFromFavorites(item.id)}
          iconColor={theme.colors.error}
        />
      </View>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 16 }}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground, marginBottom: 20 }}>
          Liked Songs
        </Text>
        
        {favorites.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
            <IconButton
              icon="favorite-border"
              size={64}
              iconColor={theme.colors.onSurfaceVariant}
            />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No liked songs yet
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              Tap the heart icon on any song to add it to your favorites
            </Text>
          </View>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderFavoriteItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

export default FavoritesScreen;