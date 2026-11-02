import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, Loading } from '../../components/States';
import { useAsync } from '../../components/useAsync';
import { getProvider, metadata, type Episode, type OfficialEpisode } from '../../providers';
import { colors, fonts, radius, spacing } from '../../theme';

export default function AnimeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const provider = getProvider();
  const [expanded, setExpanded] = useState(false);

  const anime = useAsync(() => metadata.details(id), [id]);
  const [demo, setDemo] = useState(false);
  const episodes = useAsync(async () => (anime.data && demo ? provider.episodes(anime.data) : []), [anime.data, demo]);

  if (anime.loading && !anime.data) return <Loading />;
  if (anime.error || !anime.data) return <ErrorState message="No se pudo cargar este anime." onRetry={anime.retry} />;
  const a = anime.data;

  const official = a.officialEpisodes ?? [];
  const links = a.watchLinks ?? [];
  const open = (url: string) => Linking.openURL(url).catch(() => {});
  const trailer = a.trailerYoutubeId ? `https://www.youtube.com/watch?v=${a.trailerYoutubeId}` : undefined;

  const play = (ep: Episode) =>
    router.push({ pathname: '/player', params: { animeId: a.id, episode: String(ep.number), provider: provider.id } });

  const header = (
    <View>
      <View style={{ width, height: width * 0.95 }}>
        <Image source={{ uri: a.poster }} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={18} />
        <LinearGradient colors={['rgba(11,11,18,0.2)', 'rgba(11,11,18,0.7)', colors.bg]} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerRow, { paddingTop: insets.top + 56 }]}>
          <Image source={{ uri: a.poster }} cachePolicy="memory-disk" style={styles.poster} contentFit="cover" transition={250} />
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Text style={styles.title} numberOfLines={3}>{a.title}</Text>
            {a.titleJapanese ? <Text style={fonts.small} numberOfLines={1}>{a.titleJapanese}</Text> : null}
            <View style={styles.metaRow}>
              {a.score ? (
                <View style={styles.badge}>
                  <Ionicons name="star" size={12} color={colors.star} />
                  <Text style={styles.badgeText}>{a.score.toFixed(2)}</Text>
                </View>
              ) : null}
              {a.year ? <Text style={styles.meta}>{a.year}</Text> : null}
              {a.episodes ? <Text style={styles.meta}>{a.episodes} eps</Text> : null}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {official[0] || links[0] || trailer ? (
          <Pressable style={styles.playBtn} onPress={() => open(official[0]?.url ?? links[0]?.url ?? trailer!)}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.playText}>
              {official[0] ? `Ver episodio ${official[0].number} en ${official[0].site}` : links[0] ? `Ver en ${links[0].site}` : 'Ver tráiler'}
            </Text>
          </Pressable>
        ) : null}

        {links.length || trailer ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={fonts.h2}>Dónde verlo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {trailer ? <LinkChip label="Tráiler (YouTube)" color="#FF0033" onPress={() => open(trailer)} /> : null}
              {links.map((l) => (
                <LinkChip key={l.url} label={l.site} color={l.color} onPress={() => open(l.url)} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.genres}>
          {a.genres.map((g) => (
            <Text key={g} style={styles.genre}>{g}</Text>
          ))}
        </View>

        {a.synopsis ? (
          <Pressable onPress={() => setExpanded((e) => !e)}>
            <Text style={fonts.body} numberOfLines={expanded ? undefined : 4}>{a.synopsis}</Text>
            <Text style={styles.more}>{expanded ? 'Ver menos' : 'Ver más'}</Text>
          </Pressable>
        ) : null}

        <View style={styles.epHeader}>
          <Text style={fonts.h2}>Episodios</Text>
          <Text style={styles.source}>{demo ? provider.name : official.length ? 'Oficiales' : ''}</Text>
        </View>
        {!demo && !official.length ? (
          <Text style={fonts.body}>
            {links.length
              ? 'No hay lista de episodios para este título; ábrelo en una de las plataformas de arriba.'
              : 'No conocemos una plataforma oficial con este título en este momento.'}
          </Text>
        ) : null}
        <Pressable onPress={() => setDemo((d) => !d)}>
          <Text style={styles.more}>{demo ? 'Ocultar videos de demostración' : 'Probar el reproductor con videos de demostración'}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList<Row>
        data={demo ? (episodes.data ?? []).map((e) => ({ kind: 'demo' as const, e })) : official.map((o) => ({ kind: 'official' as const, o }))}
        keyExtractor={(x) => (x.kind === 'demo' ? x.e.id : x.o.url)}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) =>
          item.kind === 'demo' ? (
            <EpisodeRow ep={item.e} onPress={() => play(item.e)} />
          ) : (
            <OfficialRow ep={item.o} onPress={() => open(item.o.url)} />
          )
        }
        ListEmptyComponent={demo && episodes.loading ? <Loading /> : undefined}
      />
      <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
    </View>
  );
}

type Row = { kind: 'demo'; e: Episode } | { kind: 'official'; o: OfficialEpisode };

function LinkChip({ label, color, onPress }: { label: string; color?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, { borderColor: color ?? colors.border }]}>
      <Ionicons name="open-outline" size={14} color={color ?? colors.text} />
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

function OfficialRow({ ep, onPress }: { ep: OfficialEpisode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ep, pressed && { backgroundColor: colors.surface }]}>
      <View style={styles.thumb}>
        {ep.thumbnail ? <Image source={{ uri: ep.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
        <View style={styles.thumbOverlay}>
          <Ionicons name="open-outline" size={18} color="#fff" />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.epNum}>EP {ep.number}</Text>
        <Text style={styles.epTitle} numberOfLines={2}>{ep.title}</Text>
        <Text style={fonts.small}>Ver en {ep.site}</Text>
      </View>
    </Pressable>
  );
}

function EpisodeRow({ ep, onPress }: { ep: Episode; onPress: () => void }) {
  const mins = ep.durationSec ? Math.round(ep.durationSec / 60) : undefined;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ep, pressed && { backgroundColor: colors.surface }]}>
      <View style={styles.thumb}>
        {ep.thumbnail ? <Image source={ep.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
        <View style={styles.thumbOverlay}>
          <Ionicons name="play" size={18} color="#fff" />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.epNum}>EP {ep.number}</Text>
        <Text style={styles.epTitle} numberOfLines={2}>{ep.title}</Text>
        {mins ? <Text style={fonts.small}>{mins} min</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: {
    position: 'absolute', left: 12, width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center',
  },
  headerRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  poster: { width: 130, height: 190, borderRadius: radius.md, backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.overlay, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  meta: { color: colors.textMuted, fontSize: 13 },
  body: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14,
  },
  playText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  genre: {
    color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill, overflow: 'hidden', fontSize: 12, fontWeight: '600',
  },
  more: { color: colors.primary, fontWeight: '700', marginTop: 4 },
  epHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm },
  source: { color: colors.textDim, fontSize: 12 },
  ep: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, alignItems: 'center' },
  thumb: { width: 140, aspectRatio: 16 / 9, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surface },
  thumbOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface,
  },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  epNum: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  epTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginVertical: 2 },
});
