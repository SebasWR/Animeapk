/**
 * Capa de fuentes de contenido.
 *
 * La app separa dos cosas:
 *  - Metadatos (títulos, portadas, sinopsis): vienen de un MetadataSource.
 *  - Video (episodios y enlaces de reproducción): vienen de un ContentProvider.
 *
 * Para añadir una fuente nueva solo hay que implementar ContentProvider y
 * registrarla en providers/index.ts. Usa únicamente fuentes que tengan
 * derechos para distribuir el contenido (servicios con licencia, una API
 * propia, o material con licencia libre).
 */

export type Anime = {
  id: string;
  title: string;
  titleJapanese?: string;
  synopsis?: string;
  poster: string;
  banner?: string;
  score?: number;
  year?: number;
  episodes?: number;
  status?: string;
  genres: string[];
  type?: string;
  trailerYoutubeId?: string;
  /** Dónde verlo legalmente (Crunchyroll, Netflix, YouTube oficial...). */
  watchLinks?: WatchLink[];
  /** Episodios en plataformas oficiales, cada uno con su enlace. */
  officialEpisodes?: OfficialEpisode[];
};

export type WatchLink = { site: string; url: string; color?: string };
export type OfficialEpisode = { number: number; title: string; thumbnail?: string; url: string; site: string };

export type Episode = {
  id: string;
  animeId: string;
  number: number;
  title: string;
  thumbnail?: string;
  durationSec?: number;
};

export type StreamQuality = 'auto' | '1080p' | '720p' | '480p' | '360p';

export type Stream = {
  url: string;
  quality: StreamQuality;
  /** hls (.m3u8), dash (.mpd) o progressive (.mp4). */
  format: 'hls' | 'dash' | 'progressive';
  headers?: Record<string, string>;
  subtitles?: { language: string; label: string; url: string }[];
};

export interface MetadataSource {
  trending(page?: number): Promise<Anime[]>;
  airingNow(page?: number): Promise<Anime[]>;
  topRated(page?: number): Promise<Anime[]>;
  search(query: string, page?: number): Promise<Anime[]>;
  details(id: string): Promise<Anime>;
}

export interface ContentProvider {
  id: string;
  name: string;
  /** Texto corto que se muestra al usuario (p. ej. "Contenido de demostración"). */
  description: string;
  episodes(anime: Anime): Promise<Episode[]>;
  streams(episode: Episode): Promise<Stream[]>;
}
