import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hero } from '../../components/Hero';
import { Rail } from '../../components/Rail';
import { ErrorState, Loading } from '../../components/States';
import { useAsync } from '../../components/useAsync';
import { metadata } from '../../providers';
import { colors } from '../../theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const airing = useAsync(() => metadata.airingNow(), []);
  const trending = useAsync(() => metadata.trending(), []);
  const top = useAsync(() => metadata.topRated(), []);

  const all = [airing, trending, top];
  if (all.every((r) => r.loading && !r.data)) return <Loading />;
  if (all.every((r) => r.error && !r.data)) {
    const retry = () => all.forEach((r) => r.retry());
    return <ErrorState message="No se pudo cargar el catálogo. Revisa tu conexión." onRetry={retry} />;
  }

  const lead = airing.data ?? trending.data ?? top.data;
  const featured = lead?.find((a) => a.score && a.score >= 7.5) ?? lead?.[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      {featured ? <Hero anime={featured} /> : null}
      <View style={[styles.brand, { top: insets.top + 8 }]}>
        <Text style={styles.logo}>
          Anime<Text style={{ color: colors.primary }}>Flow</Text>
        </Text>
      </View>
      <Rail title="En emisión esta temporada" items={airing.data?.filter((a) => a.id !== featured?.id)} loading={airing.loading} />
      <Rail title="Los más populares" items={trending.data} loading={trending.loading} />
      <Rail title="Mejor valorados" items={top.data} loading={top.loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  brand: { position: 'absolute', left: 16 },
  logo: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
});
