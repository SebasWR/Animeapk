import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { providers } from '../../providers';
import { colors, fonts, radius, spacing } from '../../theme';

export default function Sources() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + spacing.md, padding: spacing.lg, gap: spacing.lg }}>
      <Text style={fonts.title}>Fuentes</Text>
      <Text style={fonts.body}>
        AnimeFlow separa el catálogo (información de los títulos) del video. Puedes conectar cualquier fuente de video
        con licencia implementando un proveedor.
      </Text>

      <View style={styles.card}>
        <Row icon="information-circle" title="Catálogo" text="AniList (y Jikan/MyAnimeList de respaldo): títulos, portadas, sinopsis, puntuaciones y dónde ver cada anime legalmente." />
      </View>

      <View style={styles.card}>
        <Row icon="tv" title="Episodios oficiales" text="Cada anime muestra sus episodios y enlaces a plataformas con licencia (Crunchyroll, Netflix, canales oficiales de YouTube...). Al tocarlos se abre la app o web de esa plataforma." />
      </View>

      {providers.map((p) => (
        <View key={p.id} style={styles.card}>
          <Row icon="play-circle" title={p.name} text={p.description} />
        </View>
      ))}

      <View style={[styles.card, { borderColor: colors.primarySoft }]}>
        <Row icon="shield-checkmark" title="Sin anuncios" text="La app no incluye publicidad ni rastreadores." />
      </View>
    </ScrollView>
  );
}

function Row({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <Ionicons name={icon} size={24} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{title}</Text>
        <Text style={[fonts.body, { marginTop: 2 }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
});
