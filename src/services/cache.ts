import AsyncStorage from '@react-native-async-storage/async-storage';

export async function cacheSet(key: string, value: any) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ value, ts: Date.now() }));
  } catch (e) {
    console.warn('cacheSet failed', e);
  }
}

export async function cacheGet(key: string, maxAgeMs = 1000 * 60 * 5) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.value;
  } catch (e) {
    return null;
  }
}
