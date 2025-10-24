import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1B5E20', // Deep Green
    primaryContainer: '#A5D6A7',
    secondary: '#FF8F00', // Amber
    secondaryContainer: '#FFE0B2',
    tertiary: '#1565C0', // Blue
    tertiaryContainer: '#BBDEFB',
    surface: '#FFFFFF',
    surfaceVariant: '#F8F9FA',
    background: '#FAFBFC',
    error: '#D32F2F',
    errorContainer: '#FFCDD2',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#6B7280',
    onBackground: '#1A1A1A',
    onError: '#FFFFFF',
    outline: '#D1D5DB',
    outlineVariant: '#E5E7EB',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#2D2D2D',
    inverseOnSurface: '#F8F9FA',
    inversePrimary: '#81C784',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
    surfaceDisabled: 'rgba(0, 0, 0, 0.12)',
    onSurfaceDisabled: 'rgba(0, 0, 0, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100' as const,
    },
  },
  roundness: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
};

export const colors = {
  // Carbon footprint colors
  excellent: '#4CAF50', // Green
  good: '#8BC34A', // Light Green
  average: '#FFC107', // Amber
  poor: '#FF9800', // Orange
  critical: '#F44336', // Red
  
  // Category colors
  energy: '#FF6F00',
  water: '#2196F3',
  waste: '#9C27B0',
  transportation: '#FF5722',
  materials: '#795548',
  equipment: '#607D8B',
  maintenance: '#9E9E9E',
  other: '#757575',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Chart colors
  chart1: '#2E7D32',
  chart2: '#FF6F00',
  chart3: '#1976D2',
  chart4: '#7B1FA2',
  chart5: '#D32F2F',
  chart6: '#F57C00',
  chart7: '#388E3C',
  chart8: '#5D4037',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h5: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  h6: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 16,
    textTransform: 'uppercase' as const,
  },
};