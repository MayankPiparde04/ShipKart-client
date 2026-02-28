import { useColorScheme } from '@/hooks/useColorScheme';

export interface AppTheme {
  // Core
  bg: string;
  cardBg: string;
  border: string;
  overlay: string;
  
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverted: string;
  
  // Status backgrounds
  successBg: string;
  successText: string;
  warningBg: string;
  warningText: string;
  errorBg: string;
  errorText: string;
  infoBg: string;
  infoText: string;
  accentBg: string;
  accentText: string;
  
  // Legacy support (for existing code)
  success: string;
  error: string;
  accent: string;
  
  // Interactive
  input: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonSuccess: string;
  buttonError: string;
  buttonAccent: string;
  
  // Tabs
  tabActive: string;
  tabInactive: string;
  tabTextActive: string;
  tabTextInactive: string;
  
  // Modal
  modalBg: string;
  modalOverlay: string;
}

const lightTheme: AppTheme = {
  // Core
  bg: 'bg-light-background',
  cardBg: 'bg-light-card',
  border: 'border-light-border',
  overlay: 'bg-gray-900/50',
  
  // Text
  text: 'text-light-text-primary',
  textSecondary: 'text-light-text-secondary',
  textMuted: 'text-light-text-muted',
  textInverted: 'text-light-text-inverted',
  
  // Status
  successBg: 'bg-light-bg-success',
  successText: 'text-light-textStatus-success',
  warningBg: 'bg-light-bg-warning',
  warningText: 'text-light-textStatus-warning',
  errorBg: 'bg-light-bg-error',
  errorText: 'text-light-textStatus-error',
  infoBg: 'bg-light-bg-info',
  infoText: 'text-light-textStatus-info',
  accentBg: 'bg-light-bg-accent',
  accentText: 'text-light-textStatus-accent',
  
  // Legacy support
  success: 'bg-green-600',
  error: 'bg-red-100',
  accent: 'bg-blue-600',
  
  // Interactive
  input: 'bg-light-bg-input border-light-border text-light-text-primary',
  buttonPrimary: 'bg-light-primary text-light-text-inverted',
  buttonSecondary: 'bg-light-secondary text-white',
  buttonSuccess: 'bg-light-status-success text-white',
  buttonError: 'bg-light-status-error text-white',
  buttonAccent: 'bg-light-accent text-white',
  
  // Tabs
  tabActive: 'bg-blue-100',
  tabInactive: 'bg-gray-100',
  tabTextActive: 'text-blue-700',
  tabTextInactive: 'text-gray-500',
  
  // Modal
  modalBg: 'bg-light-card',
  modalOverlay: 'bg-gray-900/50',
};

const darkTheme: AppTheme = {
  // Core
  bg: 'bg-dark-background',
  cardBg: 'bg-dark-card',
  border: 'border-dark-border',
  overlay: 'bg-black/60',
  
  // Text
  text: 'text-dark-text-primary',
  textSecondary: 'text-dark-text-secondary',
  textMuted: 'text-dark-text-muted',
  textInverted: 'text-dark-text-inverted',
  
  // Status
  successBg: 'bg-dark-bg-success',
  successText: 'text-dark-textStatus-success',
  warningBg: 'bg-dark-bg-warning',
  warningText: 'text-dark-textStatus-warning',
  errorBg: 'bg-dark-bg-error',
  errorText: 'text-dark-textStatus-error',
  infoBg: 'bg-dark-bg-info',
  infoText: 'text-dark-textStatus-info',
  accentBg: 'bg-dark-bg-accent',
  accentText: 'text-dark-textStatus-accent',
  
  // Legacy support
  success: 'bg-green-600',
  error: 'bg-red-900/30',
  accent: 'bg-blue-600',
  
  // Interactive
  input: 'bg-dark-bg-input border-dark-border text-dark-text-primary',
  buttonPrimary: 'bg-dark-primary text-dark-text-inverted',
  buttonSecondary: 'bg-dark-secondary text-white',
  buttonSuccess: 'bg-dark-status-success text-white',
  buttonError: 'bg-dark-status-error text-white',
  buttonAccent: 'bg-dark-accent text-white',
  
  // Tabs
  tabActive: 'bg-zinc-800',
  tabInactive: 'bg-zinc-900',
  tabTextActive: 'text-white',
  tabTextInactive: 'text-zinc-400',
  
  // Modal
  modalBg: 'bg-dark-card',
  modalOverlay: 'bg-black/60',
};

export function useAppTheme(): AppTheme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return isDark ? darkTheme : lightTheme;
}