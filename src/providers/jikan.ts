import type { Anime, MetadataSource } from './types';

/**
 * Metadatos desde Jikan (API pública no oficial de MyAnimeList).
 * Solo información: títulos, portadas, sinopsis, puntuaciones. No hay video.
 * Límite: ~3 peticiones/segundo, así que cacheamos y espaciamos llamadas.
 */
const BASE = 'https://api.jikan.moe/v4';
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;
let queue: Promise<unknown> = Promise.resolve();

async function get<T>(path: string): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;

  // Serializa las peticiones con una pequeña pausa para respetar el límite.
  const run = queue.then(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(BASE + path);
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`Jikan ${res.status}`);
      const json = await res.json();
      await new Promise((r) => setTimeout(r, 350));
      return json;
    }
    throw new Error('Jikan: demasiadas peticiones, prueba en unos segundos');
  });
  queue = run.catch(() => undefined);
  const data = await run;
  cache.set(path, { at: Date.now(), data });
  return data as T;
}

type JikanAnime = {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  synopsis?: string | null;
  score?: number | null;
  year?: number | null;
  episodes?: number | null;
  status?: string | null;
  type?: string | null;
  genres?: { name: string }[];
  images: { webp?: { large_image_url?: string; image_url?: string }; jpg: { large_image_url?: string; image_url: string } };
  trailer?: { youtube_id?: string | null; images?: { maximum_image_url?: string | null } };
  aired?: { prop?: { from?: { year?: number | null } } };
};

function map(a: JikanAnime): Anime {
  const poster =
    a.images.jpg?.large_image_url ?? a.images.jpg?.image_url ?? a.images.webp?.large_image_url ?? a.images.webp?.image_url ?? '';
  return {
    id: String(a.mal_id),
    title: a.title_english || a.title,
    titleJapanese: a.title_japanese ?? undefined,
    synopsis: a.synopsis?.replace(/\[Written by MAL Rewrite\]/g, '').trim() ?? undefined,
    poster,
    banner: a.trailer?.images?.maximum_image_url ?? poster,
    score: a.score ?? undefined,
    year: a.year ?? a.aired?.prop?.from?.year ?? undefined,
    episodes: a.episodes ?? undefined,
    status: a.status ?? undefined,
    type: a.type ?? undefined,
    genres: (a.genres ?? []).map((g) => g.name),
    trailerYoutubeId: a.trailer?.youtube_id ?? undefined,
  };
}

function uniq(list: Anime[]): Anime[] {
  const seen = new Set<string>();
  return list.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
}

const SAFE = 'sfw=true';

export const jikan: MetadataSource = {
  async trending(page = 1) {
    const r = await get<{ data: JikanAnime[] }>(`/top/anime?filter=bypopularity&${SAFE}&page=${page}`);
    return uniq(r.data.map(map));
  },
  async airingNow(page = 1) {
    const r = await get<{ data: JikanAnime[] }>(`/seasons/now?${SAFE}&page=${page}`);
    return uniq(r.data.map(map));
  },
  async topRated(page = 1) {
    const r = await get<{ data: JikanAnime[] }>(`/top/anime?${SAFE}&page=${page}`);
    return uniq(r.data.map(map));
  },
  async search(query, page = 1) {
    const q = encodeURIComponent(query.trim());
    const r = await get<{ data: JikanAnime[] }>(`/anime?q=${q}&${SAFE}&order_by=members&sort=desc&page=${page}`);
    return uniq(r.data.map(map));
  },
  async details(id) {
    const r = await get<{ data: JikanAnime }>(`/anime/${id}/full`);
    return map(r.data);
  },
};
