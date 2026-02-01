import AsyncStorage from '@react-native-async-storage/async-storage';

export async function storageSet(key: string, value: any) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

export async function storageGet<T = any>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    return null;
  }
}

export async function storageRemove(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
}
