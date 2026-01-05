/**
 * Color Palette - Professional & Modern
 * Централизованная цветовая схема для всего приложения
 */

export const COLORS = {
  // Primary Colors
  primary: {
    main: '#00897B',
    light: '#26C6DA',
    dark: '#00695C',
    gradient: ['#00897B', '#26C6DA'],
    background: 'rgba(0, 137, 123, 0.08)',
    hover: 'rgba(0, 137, 123, 0.12)',
  },

  // Success (Income)
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    background: 'rgba(16, 185, 129, 0.12)',
    hover: 'rgba(16, 185, 129, 0.2)',
  },

  // Error (Expense)
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    background: 'rgba(239, 68, 68, 0.12)',
    hover: 'rgba(239, 68, 68, 0.2)',
  },

  // Warning
  warning: {
    main: '#F59E0B',
    light: '#FCD34D',
    dark: '#D97706',
    background: 'rgba(245, 158, 11, 0.12)',
  },

  // Info
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    background: 'rgba(59, 130, 246, 0.12)',
  },

  // Category Colors
  category: {
    food: '#FF6B6B',
    transport: '#4ECDC4',
    shopping: '#FFD93D',
    entertainment: '#95E1D3',
    health: '#FF85C0',
    education: '#B5EAD7',
    utilities: '#FFD6BA',
    internet: '#C7CEEA',
    home: '#E2A76F',
    other: '#6366F1',
  },

  // Neutral Colors
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Transparent Colors
  transparent: {
    white: {
      5: 'rgba(255, 255, 255, 0.05)',
      8: 'rgba(255, 255, 255, 0.08)',
      10: 'rgba(255, 255, 255, 0.10)',
      20: 'rgba(255, 255, 255, 0.20)',
      85: 'rgba(255, 255, 255, 0.85)',
      90: 'rgba(255, 255, 255, 0.90)',
    },
    black: {
      3: 'rgba(0, 0, 0, 0.03)',
      5: 'rgba(0, 0, 0, 0.05)',
      8: 'rgba(0, 0, 0, 0.08)',
      10: 'rgba(0, 0, 0, 0.10)',
      12: 'rgba(0, 0, 0, 0.12)',
    },
  },

  // White
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Typography Constants
 * Стандартные размеры шрифтов и их веса
 */
export const TYPOGRAPHY = {
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
    '5xl': 36,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.3,
    wider: 0.5,
  },
} as const;

/**
 * Spacing Constants
 * Стандартные отступы
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

/**
 * Border Radius Constants
 * Стандартные скругления углов
 */
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

/**
 * Shadow Presets
 * Предустановленные тени для elevation
 */
export const SHADOWS = {
  sm: {
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

/**
 * Utility function to get category color
 */
export const getCategoryColor = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  if (name.includes('ăn') || name.includes('food')) return COLORS.category.food;
  if (name.includes('xe') || name.includes('car') || name.includes('giao thông'))
    return COLORS.category.transport;
  if (name.includes('mua') || name.includes('shop')) return COLORS.category.shopping;
  if (name.includes('giải trí') || name.includes('entertainment'))
    return COLORS.category.entertainment;
  if (name.includes('sức khỏe') || name.includes('health'))
    return COLORS.category.health;
  if (name.includes('học') || name.includes('education'))
    return COLORS.category.education;
  if (name.includes('điện') || name.includes('electric'))
    return COLORS.category.utilities;
  if (name.includes('internet') || name.includes('wifi'))
    return COLORS.category.internet;
  if (name.includes('nhà') || name.includes('home')) return COLORS.category.home;
  return COLORS.category.other;
};
