import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { colors } from '../../theme';

type Props = {
  position: number;
  duration: number;
  buffered: number;
  onScrubStart?: () => void;
  onScrub?: (sec: number) => void;
  onSeek: (sec: number) => void;
};

/** Barra de progreso arrastrable con indicador de búfer. */
export function SeekBar({ position, duration, buffered, onScrubStart, onScrub, onSeek }: Props) {
  const width = useRef(1);
  const [scrub, setScrub] = useState<number | null>(null);

  const toSec = (e: GestureResponderEvent) => {
    const x = Math.max(0, Math.min(e.nativeEvent.locationX, width.current));
    return (x / width.current) * (duration || 0);
  };

  const shown = scrub ?? position;
  const pct = duration > 0 ? Math.min(1, shown / duration) : 0;
  const bufPct = duration > 0 ? Math.min(1, buffered / duration) : 0;

  return (
    <View
      style={styles.hit}
      onLayout={(e) => (width.current = Math.max(1, e.nativeEvent.layout.width))}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        onScrubStart?.();
        const s = toSec(e);
        setScrub(s);
        onScrub?.(s);
      }}
      onResponderMove={(e) => {
        const s = toSec(e);
        setScrub(s);
        onScrub?.(s);
      }}
      onResponderRelease={(e) => {
        onSeek(toSec(e));
        setScrub(null);
      }}
      onResponderTerminate={() => setScrub(null)}
    >
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.buffer, { width: `${bufPct * 100}%` }]} />
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <View pointerEvents="none" style={[styles.thumb, { left: `${pct * 100}%` }, scrub != null && styles.thumbActive]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 28, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  buffer: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: 'rgba(255,255,255,0.45)' },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.primary },
  thumb: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7, marginLeft: -7,
    backgroundColor: colors.primary, borderWidth: 2, borderColor: '#fff',
  },
  thumbActive: { width: 20, height: 20, borderRadius: 10, marginLeft: -10 },
});
