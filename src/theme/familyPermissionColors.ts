import { MD3Theme } from 'react-native-paper';

// Returns a palette tailored for FamilyPermissions screen based on the active MD3 theme
export const getFamilyPermissionColors = (theme: MD3Theme) => ({
  background: theme.dark ? '#000000' : '#E0F2F1',
  brand: theme.dark ? '#4DB6AC' : '#00796B',
  primary: theme.colors.primary,
  secondary: theme.colors.secondary,
  secondarySoft: `${theme.colors.secondary}33`,
  accent: theme.dark ? '#FF72B8' : '#EC4899',
  danger: theme.dark ? '#FF7B7B' : '#EF4444',
  dangerStrong: theme.dark ? 'rgba(255,123,123,0.9)' : 'rgba(239,68,68,0.9)',
  dangerSoft: theme.dark ? 'rgba(255,123,123,0.12)' : 'rgba(239, 68, 68, 0.1)',
  success: theme.dark ? '#48E0A0' : '#10B981',
  successSoft: theme.dark ? 'rgba(72,224,160,0.12)' : 'rgba(16,185,129,0.12)',
  surface: theme.colors.surface,
  surfaceLight: theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
  surfaceSoft: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
  surfaceBorder: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)',
  surfaceDivider: theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.05)',
  textPrimary: theme.dark ? '#FFFFFF' : '#111827',
  textSecondary: theme.dark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)',
  textMuted: theme.dark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.6)',
  textAlt: theme.dark ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.7)',
  disabledBg: theme.dark ? 'rgba(26,32,44,0.06)' : 'rgba(203,213,225,0.06)',
  tabTextActive: theme.dark ? '#0FF9E0' : '#FFFFFF',
  tabTextMuted: theme.dark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.6)',
  levelOptionBg: theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
  levelOptionBorder: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
  thumbOn: theme.dark ? '#00C9A7' : '#00897B',
  thumbOff: '#9CA3AF',
  switchTrackOff: theme.dark ? '#1F2937' : '#374151',
});

export type FamilyPermissionColors = ReturnType<typeof getFamilyPermissionColors>;
