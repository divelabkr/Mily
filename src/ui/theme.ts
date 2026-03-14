export const theme = {
  colors: {
    primary: '#4A6FA5',
    secondary: '#7EB5A6',
    accent: '#F4A261',
    background: '#FAFAF8',
    surface: '#FFFFFF',
    textPrimary: '#2D3436',
    textSecondary: '#636E72',
    success: '#6ABF69',
    warning: '#F4A261',
    border: '#E8E8E8',
  },
  spacing: [0, 4, 8, 12, 16, 24, 32, 48] as const,
  borderRadius: { card: 16, button: 12, input: 8 },
} as const;

export type Theme = typeof theme;
