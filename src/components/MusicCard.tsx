import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';

export default function MusicCard({ title, icon, gradient, onPress }: { title: string; icon?: string; gradient?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, gradient ? { backgroundColor: gradient } : null]} activeOpacity={0.9}>
      <View style={styles.content}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, minHeight: 140, padding: 16, justifyContent: 'flex-end', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  content: { },
  icon: { fontSize: 28, marginBottom: 8 },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
