import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_TIMESTAMP_PREFIX = 'cache_timestamp_';

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      const timestamp = await AsyncStorage.getItem(`${CACHE_TIMESTAMP_PREFIX}${key}`);

      if (!cachedData || !timestamp) {
        return null;
      }

      const cacheAge = Date.now() - parseInt(timestamp, 10);
      const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

      if (cacheAge > CACHE_TTL) {
        await this.remove(key);
        return null;
      }

      return JSON.parse(cachedData) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, data: any) {
    try {
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
      await AsyncStorage.setItem(`${CACHE_TIMESTAMP_PREFIX}${key}`, Date.now().toString());
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      await AsyncStorage.removeItem(`${CACHE_TIMESTAMP_PREFIX}${key}`);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) || k.startsWith(CACHE_TIMESTAMP_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },
};
