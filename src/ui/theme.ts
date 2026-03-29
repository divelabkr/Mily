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
  spacing: [0, 4, 8, 12, 16, 24, 32, 48, 64, 80, 96] as const,
  borderRadius: { card: 16, button: 12, input: 8 },
  milyColors: {
    cream: '#FAF7F2',
    coral: '#E8503A',
    coralLight: '#F2856F',
    gold: '#C9A96E',
    brownDark: '#4A3728',
    brownMid: '#7D6B60',
    brownLight: '#B5A096',
    surface2: '#F0EBE3',
    mint: '#4CAF8C',
    mintBg: '#E8F5EF',
  },
} as const;

export type Theme = typeof theme;
