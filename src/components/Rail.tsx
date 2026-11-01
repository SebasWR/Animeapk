import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { Anime } from '../providers';
import { colors, fonts, radius, spacing } from '../theme';
import { AnimeCard } from './AnimeCard';

type Props = { title: string; items?: Anime[]; loading?: boolean };

export function Rail({ title, items, loading }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {loading && !items ? (
        <View style={styles.row}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeleton} />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={items ?? []}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <AnimeCard anime={item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl },
  title: { ...fonts.h2, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg },
  skeleton: { width: 130, height: 188, borderRadius: radius.md, backgroundColor: colors.surface },
});
