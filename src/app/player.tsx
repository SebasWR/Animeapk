import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimePlayer } from '../components/player/AnimePlayer';
import { ErrorState, Loading } from '../components/States';
import { useAsync } from '../components/useAsync';
import { getProvider, metadata } from '../providers';
import { colors, fonts, radius, spacing } from '../theme';

export default function PlayerScreen() {
  const params = useLocalSearchParams<{ animeId: string; episode: string; provider?: string }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const provider = getProvider(params.provider);
  const [epNumber, setEpNumber] = useState(Number(params.episode) || 1);

  const anime = useAsync(() => metadata.details(params.animeId), [params.animeId]);
  const episodes = useAsync(async () => (anime.data ? provider.episodes(anime.data) : []), [anime.data]);
  const episode = episodes.data?.find((e) => e.number === epNumber);
  const streams = useAsync(async () => (episode ? provider.streams(episode) : []), [episode?.id]);
  const nextEp = episodes.data?.find((e) => e.number === epNumber + 1);

  // Al salir del reproductor volvemos a vertical.
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const toggleFullscreen = () => {
    ScreenOrientation.lockAsync(
      landscape ? ScreenOrientation.OrientationLock.PORTRAIT_UP : ScreenOrientation.OrientationLock.LANDSCAPE,
    ).catch(() => {});
  };

  if (anime.error) return <ErrorState message="No se pudo cargar el episodio." onRetry={anime.retry} />;
  const stream = streams.data?.[0];

  const playerBox = (
    <View style={landscape ? StyleSheet.absoluteFill : { width, aspectRatio: 16 / 9, marginTop: insets.top }}>
      {stream && anime.data && episode ? (
        <AnimePlayer
          key={episode.id}
          stream={stream}
          title={anime.data.title}
          subtitle={`Episodio ${episode.number}`}
          fullscreen={landscape}
          onBack={() => (landscape ? toggleFullscreen() : router.back())}
          onToggleFullscreen={toggleFullscreen}
          onNext={nextEp ? () => setEpNumber(nextEp.number) : undefined}
          onEnded={nextEp ? () => setEpNumber(nextEp.number) : undefined}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {streams.error ? <ErrorState message="Esta fuente no devolvió video para el episodio." onRetry={streams.retry} /> : <Loading />}
        </View>
      )}
    </View>
  );

  if (landscape) {
    return (
      <View style={styles.black}>
        <StatusBar hidden />
        {playerBox}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={{ backgroundColor: '#000' }}>{playerBox}</View>
      <FlatList
        data={episodes.data ?? []}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          anime.data ? (
            <View style={styles.info}>
              <Text style={styles.title}>{anime.data.title}</Text>
              <Text style={fonts.small}>
                Episodio {epNumber} · {provider.name}
              </Text>
              {nextEp ? (
                <Pressable style={styles.nextBtn} onPress={() => setEpNumber(nextEp.number)}>
                  <Ionicons name="play-skip-forward" size={16} color={colors.primary} />
                  <Text style={styles.nextText}>Siguiente: episodio {nextEp.number}</Text>
                </Pressable>
              ) : null}
              <Text style={[fonts.h2, { marginTop: spacing.lg }]}>Episodios</Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => {
          const active = item.number === epNumber;
          return (
            <Pressable onPress={() => setEpNumber(item.number)} style={[styles.ep, active && styles.epActive]}>
              <View style={styles.thumb}>
                {item.thumbnail ? <Image source={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
                {active ? (
                  <View style={styles.nowPlaying}>
                    <Ionicons name="volume-high" size={16} color="#fff" />
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.epNum, active && { color: colors.primary }]}>EP {item.number}</Text>
                <Text style={styles.epTitle} numberOfLines={2}>{item.title}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#000' },
  screen: { flex: 1, backgroundColor: colors.bg },
  info: { padding: spacing.lg, gap: 4 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: spacing.md,
    backgroundColor: colors.primarySoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
  },
  nextText: { color: colors.primary, fontWeight: '700' },
  ep: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, alignItems: 'center' },
  epActive: { backgroundColor: colors.surface },
  thumb: { width: 120, aspectRatio: 16 / 9, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  nowPlaying: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,77,109,0.55)', alignItems: 'center', justifyContent: 'center' },
  epNum: { color: colors.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  epTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
