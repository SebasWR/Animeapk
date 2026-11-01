import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { Anime } from '../providers';
import { colors, radius, spacing } from '../theme';

export function Hero({ anime }: { anime: Anime }) {
  const { width } = useWindowDimensions();
  const open = () => router.push({ pathname: '/anime/[id]', params: { id: anime.id } });
  return (
    <View style={{ width, height: width * 1.15 }}>
      <Image source={{ uri: anime.poster }} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <LinearGradient
        colors={['rgba(11,11,18,0.3)', 'transparent', 'rgba(11,11,18,0.85)', colors.bg]}
        locations={[0, 0.3, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.kicker}>DESTACADO</Text>
        <Text style={styles.title} numberOfLines={2}>{anime.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[anime.year, anime.type, anime.genres.slice(0, 2).join(' · ')].filter(Boolean).join('  •  ')}
        </Text>
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.primary]} onPress={open}>
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={styles.btnText}>Ver ahora</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.ghost]} onPress={open}>
            <Ionicons name="information-circle-outline" size={18} color={colors.text} />
            <Text style={styles.btnText}>Detalles</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.md },
  kicker: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  meta: { color: colors.textMuted, marginTop: 6, fontSize: 13 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.pill },
  primary: { backgroundColor: colors.primary },
  ghost: { backgroundColor: 'rgba(255,255,255,0.14)' },
  btnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
