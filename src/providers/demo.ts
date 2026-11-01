import type { Anime, ContentProvider, Episode, Stream } from './types';

/**
 * Proveedor de demostración.
 *
 * Reproduce películas abiertas de la Blender Foundation (licencia Creative
 * Commons) para que el reproductor se pueda probar de punta a punta. No son
 * los episodios reales del anime: sustitúyelo por un proveedor con licencia.
 */
const SAMPLES: { title: string; url: string; format: Stream['format']; durationSec: number }[] = [
  { title: 'Sintel', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', format: 'progressive', durationSec: 888 },
  { title: 'Big Buck Bunny (HLS)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', format: 'hls', durationSec: 596 },
  { title: 'Tears of Steel', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', format: 'progressive', durationSec: 734 },
  { title: 'Elephants Dream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', format: 'progressive', durationSec: 653 },
];

export const demoProvider: ContentProvider = {
  id: 'demo',
  name: 'Demo (videos libres)',
  description: 'Videos de demostración con licencia libre para probar el reproductor.',

  async episodes(anime: Anime): Promise<Episode[]> {
    const count = Math.min(anime.episodes ?? 12, 24);
    return Array.from({ length: count }, (_, i) => {
      const sample = SAMPLES[i % SAMPLES.length];
      return {
        id: `${anime.id}-${i + 1}`,
        animeId: anime.id,
        number: i + 1,
        title: `Episodio ${i + 1} · demo: ${sample.title}`,
        thumbnail: anime.banner ?? anime.poster,
        durationSec: sample.durationSec,
      };
    });
  },

  async streams(episode: Episode): Promise<Stream[]> {
    const sample = SAMPLES[(episode.number - 1) % SAMPLES.length];
    return [{ url: sample.url, quality: 'auto', format: sample.format }];
  },
};
