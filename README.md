# AnimeFlow

App móvil (Android / iOS) para ver anime, hecha con **Expo (React Native) + TypeScript**.
Sin anuncios ni rastreadores.

## Probarla en tu teléfono

```bash
npm install
npx expo start
```

Escanea el QR con la app **Expo Go** (Android/iOS).
> Nota: si Expo Go no soporta la versión del SDK, usa un "development build": `npx expo run:android`.

## Generar el APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile apk
```

Al terminar, EAS te da un enlace para descargar el `.apk` e instalarlo.
Sin cuenta de EAS: `npx expo prebuild -p android` y luego `cd android && ./gradlew assembleRelease` (necesitas Android Studio / SDK).

## Estructura

```
src/
  app/                    Pantallas (Expo Router)
    (tabs)/index.tsx      Inicio: destacado + filas de títulos
    (tabs)/search.tsx     Búsqueda
    (tabs)/sources.tsx    Fuentes de contenido
    anime/[id].tsx        Detalle + lista de episodios
    player.tsx            Pantalla del reproductor
  components/player/      Reproductor con controles propios
  providers/              Capa de fuentes (catálogo y video)
  theme/                  Colores y tipografía
```

## Reproductor

- Controles propios que se ocultan solos (3,5 s)
- Doble toque a izquierda/derecha: retrocede/avanza 10 s (acumulable)
- Barra de progreso arrastrable con búfer visible
- Velocidad 0,5x – 2x
- Pantalla completa (gira a horizontal) y modo recorte/ajuste
- Bloqueo de controles, siguiente episodio y reproducción automática del siguiente
- HLS (.m3u8), DASH y MP4; cabeceras HTTP por fuente; imagen en imagen (PiP)

## Fuentes de contenido

El catálogo (portadas, sinopsis, notas) viene de **Jikan**, la API pública de datos de MyAnimeList.
El video viene de un **ContentProvider** (ver `src/providers/types.ts`). Para añadir una fuente:

1. Crea `src/providers/miFuente.ts` implementando `episodes(anime)` y `streams(episode)`.
2. Regístrala en `src/providers/index.ts`.

Ahora mismo solo hay un proveedor **demo** con películas libres de la Blender Foundation, para probar el reproductor.

### Sobre AnimeAV1 y derechos de autor

AnimeAV1 y sitios similares publican anime sin licencia. Por eso esta app **no** incluye un extractor
de ese sitio ni código para saltarse sus protecciones o quitar los anuncios de su reproductor.
Usa fuentes con derechos: tu propio servidor con contenido que tengas derecho a distribuir,
material con licencia libre, o servicios oficiales (Crunchyroll, Netflix, etc.), que normalmente
no ofrecen API pública y requieren abrirse en su propia app.
