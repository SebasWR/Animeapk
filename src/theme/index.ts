export const colors = {
  bg: '#0B0B12',
  surface: '#15151F',
  surfaceAlt: '#1E1E2B',
  border: '#2A2A3A',
  text: '#F4F4F8',
  textMuted: '#A0A0B4',
  textDim: '#6B6B80',
  primary: '#FF4D6D',
  primarySoft: 'rgba(255, 77, 109, 0.16)',
  accent: '#7C5CFF',
  star: '#FFC857',
  overlay: 'rgba(0, 0, 0, 0.55)',
};

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const fonts = {
  title: { fontSize: 26, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 19, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  small: { fontSize: 12, color: colors.textDim },
};
