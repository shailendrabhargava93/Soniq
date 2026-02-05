import React, { createContext, useContext, useState, useEffect } from 'react';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  uri: string;
}

interface FavoritesContextType {
  favorites: Song[];
  addToFavorites: (song: Song) => void;
  removeFromFavorites: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Song[]>([]);

  useEffect(() => {
    // Load favorites from storage if needed
  }, []);

  const addToFavorites = (song: Song) => {
    if (!favorites.find(fav => fav.id === song.id)) {
      setFavorites([...favorites, song]);
    }
  };

  const removeFromFavorites = (songId: string) => {
    setFavorites(favorites.filter(song => song.id !== songId));
  };

  const isFavorite = (songId: string) => {
    return favorites.some(song => song.id === songId);
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};