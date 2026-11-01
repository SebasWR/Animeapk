import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Anime } from '../providers';
import { colors, radius } from '../theme';

type Props = { anime: Anime; width?: number };

export function AnimeCard({ anime, width = 130 }: Props) {
  const height = width * 1.45;
  return (
    <Link href={{ pathname: '/anime/[id]', params: { id: anime.id } }} asChild>
      <Pressable style={({ pressed }) => [{ width, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
        <View style={[styles.poster, { height }]}>
          <Image source={{ uri: anime.poster }} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.fade} />
          {anime.score ? (
            <View style={styles.score}>
              <Ionicons name="star" size={10} color={colors.star} />
              <Text style={styles.scoreText}>{anime.score.toFixed(1)}</Text>
            </View>
          ) : null}
          {anime.type ? <Text style={styles.type}>{anime.type}</Text> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {anime.title}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  poster: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%' },
  score: {
    position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.overlay, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill,
  },
  scoreText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  type: { position: 'absolute', bottom: 6, left: 8, color: colors.text, fontSize: 10, fontWeight: '700', opacity: 0.9 },
  title: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 6, lineHeight: 17 },
});
