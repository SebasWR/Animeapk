import { demoProvider } from './demo';
import { jikan } from './jikan';
import type { ContentProvider } from './types';

export * from './types';
export const metadata = jikan;

/**
 * Registro de proveedores de video. Añade aquí los tuyos; la app usa el
 * primero como predeterminado.
 */
export const providers: ContentProvider[] = [demoProvider];

export function getProvider(id?: string): ContentProvider {
  return providers.find((p) => p.id === id) ?? providers[0];
}
