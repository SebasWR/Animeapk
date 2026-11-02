import type { Anime, ContentProvider, Episode, Stream } from './types';

/**
 * Proveedor de demostración.
 *
 * Reproduce películas abiertas de la Blender Foundation (licencia Creative
 * Commons) para que el reproductor se pueda probar de punta a punta. No son
 * los episodios reales del anime: sustitúyelo por un proveedor con licencia.
 */
const SAMPLES: { title: string; url: string; format: Stream['format']; durationSec: number }[] = [
  { title: 'Sintel (HLS)', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', format: 'hls', durationSec: 888 },
  { title: 'Big Buck Bunny (HLS)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', format: 'hls', durationSec: 596 },
  { title: 'Tears of Steel (HLS)', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', format: 'hls', durationSec: 734 },
  { title: 'Big Buck Bunny (MP4)', url: 'https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4', format: 'progressive', durationSec: 596 },
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
