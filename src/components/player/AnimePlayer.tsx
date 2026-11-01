import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { VideoView, useVideoPlayer, type VideoContentFit } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import type { Stream } from '../../providers';
import { colors, radius } from '../../theme';
import { SeekBar } from './SeekBar';
import { formatTime } from './format';

type Props = {
  stream: Stream;
  title: string;
  subtitle?: string;
  fullscreen: boolean;
  topInset?: number;
  onBack: () => void;
  onToggleFullscreen: () => void;
  onNext?: () => void;
  onEnded?: () => void;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SKIP = 10;
const HIDE_AFTER = 3500;

export function AnimePlayer({ stream, title, subtitle, fullscreen, topInset = 0, onBack, onToggleFullscreen, onNext, onEnded }: Props) {
  const player = useVideoPlayer(
    { uri: stream.url, headers: stream.headers, contentType: stream.format, metadata: { title } },
    (p) => {
      p.timeUpdateEventInterval = 0.5;
      p.keepScreenOnWhilePlaying = true;
      p.play();
    },
  );

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const [time, setTime] = useState({ current: 0, buffered: 0, duration: 0 });
  const [speed, setSpeed] = useState(1);
  const [fit, setFit] = useState<VideoContentFit>('contain');
  const [locked, setLocked] = useState(false);
  const [showSpeeds, setShowSpeeds] = useState(false);
  const [skipHint, setSkipHint] = useState<{ side: 'left' | 'right'; amount: number } | null>(null);
  const [width, setWidth] = useState(1);

  useEventListener(player, 'timeUpdate', (e) => {
    setTime({ current: e.currentTime, buffered: e.bufferedPosition, duration: player.duration });
  });
  useEventListener(player, 'playToEnd', () => onEnded?.());

  // ---- Mostrar / ocultar controles -------------------------------------
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(
    (v: boolean) => {
      setVisible(v);
      Animated.timing(opacity, { toValue: v ? 1 : 0, duration: 200, useNativeDriver: true }).start();
    },
    [opacity],
  );

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => show(false), HIDE_AFTER);
  }, [show]);

  useEffect(() => {
    if (visible && isPlaying && !showSpeeds) scheduleHide();
    return () => clearTimeout(hideTimer.current);
  }, [visible, isPlaying, showSpeeds, scheduleHide]);

  // ---- Toques: uno muestra/oculta, doble toque salta ±10 s -------------
  const lastTap = useRef<{ t: number; side: 'left' | 'right' } | null>(null);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const skip = (seconds: number) => {
    player.seekBy(seconds);
    setTime((t) => ({ ...t, current: Math.max(0, Math.min(t.duration, t.current + seconds)) }));
  };

  const onSurfacePress = (x: number) => {
    const side = x < width / 2 ? 'left' : 'right';
    const now = Date.now();
    if (!locked && lastTap.current && now - lastTap.current.t < 280 && lastTap.current.side === side) {
      clearTimeout(singleTapTimer.current);
      const delta = side === 'left' ? -SKIP : SKIP;
      skip(delta);
      setSkipHint((h) => ({ side, amount: h && h.side === side ? h.amount + SKIP : SKIP }));
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setSkipHint(null), 700);
      lastTap.current = { t: now, side };
      return;
    }
    lastTap.current = { t: now, side };
    clearTimeout(singleTapTimer.current);
    singleTapTimer.current = setTimeout(() => {
      setShowSpeeds(false);
      show(!visible);
    }, 230);
  };

  const togglePlay = () => {
    if (isPlaying) player.pause();
    else {
      if (time.duration > 0 && time.current >= time.duration - 0.5) player.currentTime = 0;
      player.play();
    }
    scheduleHide();
  };

  const pickSpeed = (s: number) => {
    player.playbackRate = s;
    setSpeed(s);
    setShowSpeeds(false);
  };

  const loading = status === 'loading' || (status === 'idle' && !error);

  return (
    <View style={styles.root} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit={fit} nativeControls={false} allowsPictureInPicture />

      <Pressable style={StyleSheet.absoluteFill} onPress={(e) => onSurfacePress(e.nativeEvent.locationX)} />

      {skipHint ? (
        <View pointerEvents="none" style={[styles.skipHint, skipHint.side === 'left' ? { left: 0 } : { right: 0 }]}>
          <Ionicons name={skipHint.side === 'left' ? 'play-back' : 'play-forward'} size={26} color="#fff" />
          <Text style={styles.skipText}>{skipHint.amount} s</Text>
        </View>
      ) : null}

      {loading ? (
        <View pointerEvents="none" style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      {/* Capa de controles */}
      <Animated.View pointerEvents={visible ? 'box-none' : 'none'} style={[StyleSheet.absoluteFill, { opacity }]}>
        {locked ? (
          <Pressable style={[styles.lockOnly, { top: topInset + 12 }]} onPress={() => setLocked(false)}>
            <Ionicons name="lock-closed" size={20} color="#fff" />
            <Text style={styles.lockText}>Toca para desbloquear</Text>
          </Pressable>
        ) : (
          <>
            <View pointerEvents="none" style={styles.scrim} />

            {/* Barra superior */}
            <View style={[styles.top, { paddingTop: topInset + 8 }]}>
              <IconBtn name="chevron-down" onPress={onBack} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
              </View>
              <IconBtn name="lock-open-outline" onPress={() => setLocked(true)} />
              <Pressable style={styles.speedBtn} onPress={() => setShowSpeeds((s) => !s)}>
                <Text style={styles.speedBtnText}>{speed}x</Text>
              </Pressable>
            </View>

            {/* Centro */}
            <View pointerEvents="box-none" style={styles.middle}>
              <IconBtn name="play-back" size={30} label="10" onPress={() => skip(-SKIP)} />
              {!loading ? (
                <Pressable style={styles.bigPlay} onPress={togglePlay}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color="#fff" style={!isPlaying && { marginLeft: 4 }} />
                </Pressable>
              ) : (
                <View style={styles.bigPlaceholder} />
              )}
              <IconBtn name="play-forward" size={30} label="10" onPress={() => skip(SKIP)} />
            </View>

            {/* Barra inferior */}
            <View style={styles.bottom}>
              <View style={styles.timeRow}>
                <Text style={styles.time}>
                  {formatTime(time.current)} <Text style={{ color: colors.textMuted }}>/ {formatTime(time.duration)}</Text>
                </Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {onNext ? <IconBtn name="play-skip-forward" onPress={onNext} /> : null}
                  {fullscreen ? (
                    <IconBtn name={fit === 'contain' ? 'scan-outline' : 'contract-outline'} onPress={() => setFit((f) => (f === 'contain' ? 'cover' : 'contain'))} />
                  ) : null}
                  <IconBtn name={fullscreen ? 'contract' : 'expand'} onPress={onToggleFullscreen} />
                </View>
              </View>
              <SeekBar
                position={time.current}
                duration={time.duration}
                buffered={time.buffered}
                onScrubStart={() => clearTimeout(hideTimer.current)}
                onSeek={(s) => {
                  player.currentTime = s;
                  setTime((t) => ({ ...t, current: s }));
                  scheduleHide();
                }}
              />
            </View>
          </>
        )}
      </Animated.View>

      {status === 'error' ? (
        <View style={[styles.center, styles.errorBox]}>
          <View style={[styles.errorBack, { top: topInset + 8 }]}>
            <IconBtn name="chevron-down" onPress={onBack} />
          </View>
          <Ionicons name="alert-circle" size={36} color={colors.primary} />
          <Text style={styles.errorText}>No se pudo reproducir este video.</Text>
          <Text style={styles.errorDetail} numberOfLines={2}>{error?.message}</Text>
          <Pressable style={styles.retry} onPress={() => player.replace({ uri: stream.url, headers: stream.headers })}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {showSpeeds ? (
        <View style={[styles.speedMenu, { top: topInset + 56 }]}>
          <Text style={styles.speedTitle}>Velocidad</Text>
          {SPEEDS.map((s) => (
            <Pressable key={s} style={styles.speedItem} onPress={() => pickSpeed(s)}>
              <Text style={[styles.speedItemText, s === speed && { color: colors.primary, fontWeight: '800' }]}>
                {s === 1 ? 'Normal' : `${s}x`}
              </Text>
              {s === speed ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function IconBtn({ name, onPress, size = 22, label }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; size?: number; label?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
      <Ionicons name={name} size={size} color="#fff" />
      {label ? <Text style={styles.iconLabel}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  title: { color: '#fff', fontWeight: '700', fontSize: 15 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  middle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 48 },
  bigPlay: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.9)',
  },
  bigPlaceholder: { width: 72, height: 72 },
  bottom: { paddingHorizontal: 16, paddingBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { color: '#fff', fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: '600' },
  iconBtn: { padding: 6, alignItems: 'center', justifyContent: 'center' },
  iconLabel: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: -2 },
  speedBtn: { borderWidth: 1.5, borderColor: '#fff', borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 },
  speedBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  speedMenu: {
    position: 'absolute', right: 12, backgroundColor: 'rgba(21,21,31,0.97)', borderRadius: radius.md,
    paddingVertical: 6, minWidth: 150, borderWidth: 1, borderColor: colors.border,
  },
  speedTitle: { color: colors.textDim, fontSize: 11, fontWeight: '700', paddingHorizontal: 14, paddingVertical: 6, letterSpacing: 1 },
  speedItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9 },
  speedItemText: { color: colors.text, fontSize: 14 },
  skipHint: {
    position: 'absolute', top: 0, bottom: 0, width: '35%', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipText: { color: '#fff', fontWeight: '800', marginTop: 4 },
  lockOnly: {
    position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.overlay, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
  },
  lockText: { color: '#fff', fontWeight: '600' },
  errorBack: { position: 'absolute', left: 12 },
  errorBox: { backgroundColor: 'rgba(0,0,0,0.92)', gap: 8, padding: 24 },
  errorText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorDetail: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  retry: { marginTop: 6, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: radius.pill },
  retryText: { color: '#fff', fontWeight: '700' },
});
