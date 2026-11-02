import { demoProvider } from './demo';
import { anilist } from './anilist';
import { jikan } from './jikan';
import type { ContentProvider, MetadataSource } from './types';

export * from './types';
/** AniList primero (rápido y estable); si falla, Jikan (MyAnimeList). */
function withFallback(a: MetadataSource, b: MetadataSource): MetadataSource {
  const wrap =
    <K extends keyof MetadataSource>(k: K) =>
    (...args: Parameters<MetadataSource[K]>) =>
      (a[k] as (...x: unknown[]) => Promise<never>)(...args).catch(() =>
        (b[k] as (...x: unknown[]) => Promise<never>)(...args),
      );
  return {
    trending: wrap('trending'),
    airingNow: wrap('airingNow'),
    topRated: wrap('topRated'),
    search: wrap('search'),
    details: wrap('details'),
  } as MetadataSource;
}

export const metadata = withFallback(anilist, jikan);

/**
 * Registro de proveedores de video. Añade aquí los tuyos; la app usa el
 * primero como predeterminado.
 */
export const providers: ContentProvider[] = [demoProvider];

export function getProvider(id?: string): ContentProvider {
  return providers.find((p) => p.id === id) ?? providers[0];
}
