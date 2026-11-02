import type { Anime, MetadataSource } from './types';

/**
 * Metadatos desde AniList (API GraphQL pública). Usamos el id de MyAnimeList
 * (idMal) como id de la app, así es intercambiable con Jikan.
 */
const URL = 'https://graphql.anilist.co';
const TIMEOUT = 12000;
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

const FIELDS = `
  id idMal type format status episodes seasonYear averageScore genres description(asHtml: false)
  title { romaji english native }
  coverImage { extraLarge large }
  bannerImage
  trailer { id site }
  startDate { year }
`;

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const key = query + JSON.stringify(variables);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    const json = (await res.json()) as { data: T; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(json.errors[0].message);
    cache.set(key, { at: Date.now(), data: json.data });
    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

type Media = {
  id: number;
  idMal: number | null;
  type?: string;
  format?: string | null;
  status?: string | null;
  episodes?: number | null;
  seasonYear?: number | null;
  averageScore?: number | null;
  genres?: string[];
  description?: string | null;
  title: { romaji?: string | null; english?: string | null; native?: string | null };
  coverImage: { extraLarge?: string | null; large?: string | null };
  bannerImage?: string | null;
  trailer?: { id?: string | null; site?: string | null } | null;
  startDate?: { year?: number | null };
};

const STATUS: Record<string, string> = {
  RELEASING: 'Currently Airing',
  FINISHED: 'Finished Airing',
  NOT_YET_RELEASED: 'Not yet aired',
};

function map(m: Media): Anime {
  const poster = m.coverImage.extraLarge ?? m.coverImage.large ?? '';
  return {
    id: String(m.idMal),
    title: m.title.english || m.title.romaji || m.title.native || '',
    titleJapanese: m.title.native ?? undefined,
    synopsis: m.description?.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim() ?? undefined,
    poster,
    banner: m.bannerImage ?? poster,
    score: m.averageScore ? m.averageScore / 10 : undefined,
    year: m.seasonYear ?? m.startDate?.year ?? undefined,
    episodes: m.episodes ?? undefined,
    status: m.status ? STATUS[m.status] ?? m.status : undefined,
    type: m.format ?? undefined,
    genres: m.genres ?? [],
    trailerYoutubeId: m.trailer?.site === 'youtube' ? m.trailer.id ?? undefined : undefined,
  };
}

const PAGE = `query ($page: Int, $sort: [MediaSort], $search: String, $status: MediaStatus) {
  Page(page: $page, perPage: 25) {
    media(type: ANIME, isAdult: false, sort: $sort, search: $search, status: $status) { ${FIELDS} }
  }
}`;

async function list(vars: Record<string, unknown>): Promise<Anime[]> {
  const r = await gql<{ Page: { media: Media[] } }>(PAGE, vars);
  return r.Page.media.filter((m) => m.idMal).map(map);
}

export const anilist: MetadataSource = {
  trending: (page = 1) => list({ page, sort: ['POPULARITY_DESC'] }),
  airingNow: (page = 1) => list({ page, sort: ['POPULARITY_DESC'], status: 'RELEASING' }),
  topRated: (page = 1) => list({ page, sort: ['SCORE_DESC'] }),
  search: (query, page = 1) => list({ page, sort: ['SEARCH_MATCH'], search: query.trim() }),
  async details(id) {
    const r = await gql<{ Media: Media }>(
      `query ($id: Int) { Media(idMal: $id, type: ANIME) { ${FIELDS} } }`,
      { id: Number(id) },
    );
    return map(r.Media);
  },
};
