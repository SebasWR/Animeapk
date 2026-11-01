import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimeCard } from '../../components/AnimeCard';
import { metadata, type Anime } from '../../providers';
import { colors, fonts, radius, spacing } from '../../theme';

const GENRES = ['Acción', 'Romance', 'Comedia', 'Fantasía', 'Isekai', 'Deportes'];

export default function Search() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const columns = width > 600 ? 4 : 3;
  const cardWidth = (width - spacing.lg * 2 - spacing.md * (columns - 1)) / columns;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let alive = true;
    const t = setTimeout(() => {
      setLoading(true);
      setError(undefined);
      metadata
        .search(q)
        .then((r) => alive && setResults(r))
        .catch(() => alive && setError('Error al buscar. Inténtalo de nuevo.'))
        .finally(() => alive && setLoading(false));
    }, 450);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <Text style={[fonts.title, { paddingHorizontal: spacing.lg }]}>Buscar</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={colors.textDim} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Títulos, por ejemplo: Frieren"
          placeholderTextColor={colors.textDim}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
        />
        {loading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
        {query && !loading ? <Ionicons name="close-circle" size={18} color={colors.textDim} onPress={() => setQuery('')} /> : null}
      </View>

      {query.trim().length < 2 ? (
        <View style={styles.chips}>
          {GENRES.map((g) => (
            <Text key={g} style={styles.chip}>{g}</Text>
          ))}
          <Text style={[fonts.small, { width: '100%', marginTop: spacing.md }]}>Escribe al menos 2 letras para buscar.</Text>
        </View>
      ) : (
        <FlatList
          key={columns}
          data={results}
          numColumns={columns}
          keyExtractor={(a) => a.id}
          columnWrapperStyle={{ gap: spacing.md }}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
          renderItem={({ item }) => <AnimeCard anime={item} width={cardWidth} />}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>{error ?? "Sin resultados."}</Text> : undefined}
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg },
  chip: {
    color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.pill, overflow: 'hidden', fontSize: 13,
  },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
