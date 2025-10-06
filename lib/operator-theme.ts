/**
 * Operator-specific theme configuration
 * This file defines TypeScript types and utilities for operator theme
 */

export type OperatorColorScheme = 'light' | 'dark'

export interface OperatorThemeColors {
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  sidebar: string
  sidebarForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  upcoming: string
  nowShowing: string
  ended: string
  standardSeat: string
  vipSeat: string
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
  border: string
  input: string
  ring: string
  muted: string
  mutedForeground: string
  destructive: string
  destructiveForeground: string
}

export interface OperatorTheme {
  colors: OperatorThemeColors
  radius: string
  fontFamily: {
    sans: string
    mono: string
  }
}

export const operatorLightTheme: OperatorTheme = {
  colors: {
    primary: 'oklch(0.45 0.15 250)', // Modern blue-purple
    primaryForeground: 'oklch(0.98 0 0)',
    secondary: 'oklch(0.95 0.02 250)', // Light blue-purple
    secondaryForeground: 'oklch(0.2 0.1 250)',
    background: 'oklch(0.99 0.005 250)', // Very light blue tint
    foreground: 'oklch(0.15 0.05 250)',
    card: 'oklch(1 0 0)', // Pure white for cards
    cardForeground: 'oklch(0.15 0.05 250)',
    sidebar: 'oklch(0.98 0.01 250)', // Light blue-purple sidebar
    sidebarForeground: 'oklch(0.2 0.1 250)',
    sidebarAccent: 'oklch(0.92 0.03 250)', // Slightly darker accent
    sidebarAccentForeground: 'oklch(0.45 0.15 250)',
    sidebarBorder: 'oklch(0.9 0.02 250)',
    upcoming: 'oklch(0.6 0.18 60)', // Modern orange
    nowShowing: 'oklch(0.55 0.15 200)', // Modern cyan-blue
    ended: 'oklch(0.5 0.05 0)', // Muted gray
    standardSeat: 'oklch(0.5 0.12 220)', // Modern blue
    vipSeat: 'oklch(0.7 0.2 30)', // Modern gold
    chart1: 'oklch(0.6 0.18 60)', // Orange
    chart2: 'oklch(0.55 0.15 200)', // Cyan-blue
    chart3: 'oklch(0.5 0.12 220)', // Blue
    chart4: 'oklch(0.7 0.2 30)', // Gold
    chart5: 'oklch(0.65 0.15 280)', // Purple
    border: 'oklch(0.9 0.02 250)',
    input: 'oklch(0.95 0.01 250)',
    ring: 'oklch(0.45 0.15 250)',
    muted: 'oklch(0.95 0.01 250)',
    mutedForeground: 'oklch(0.5 0.05 250)',
    destructive: 'oklch(0.55 0.2 15)', // Modern red
    destructiveForeground: 'oklch(0.98 0 0)',
  },
  radius: '0.75rem', // Slightly more rounded
  fontFamily: {
    sans: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
}

export const operatorDarkTheme: OperatorTheme = {
  colors: {
    primary: 'oklch(0.7 0.15 250)', // Bright blue-purple for dark mode
    primaryForeground: 'oklch(0.05 0.05 250)',
    secondary: 'oklch(0.15 0.05 250)', // Dark blue-purple
    secondaryForeground: 'oklch(0.9 0.02 250)',
    background: 'oklch(0.08 0.02 250)', // Very dark blue-purple
    foreground: 'oklch(0.95 0.01 250)',
    card: 'oklch(0.12 0.03 250)', // Dark card background
    cardForeground: 'oklch(0.9 0.02 250)',
    sidebar: 'oklch(0.1 0.03 250)', // Dark sidebar
    sidebarForeground: 'oklch(0.9 0.02 250)',
    sidebarAccent: 'oklch(0.18 0.05 250)', // Darker accent
    sidebarAccentForeground: 'oklch(0.7 0.15 250)',
    sidebarBorder: 'oklch(0.2 0.05 250)',
    upcoming: 'oklch(0.7 0.2 60)', // Bright orange for dark mode
    nowShowing: 'oklch(0.65 0.18 200)', // Bright cyan-blue
    ended: 'oklch(0.5 0.05 0)', // Muted gray
    standardSeat: 'oklch(0.6 0.15 220)', // Bright blue
    vipSeat: 'oklch(0.8 0.25 30)', // Bright gold
    chart1: 'oklch(0.7 0.2 60)', // Orange
    chart2: 'oklch(0.65 0.18 200)', // Cyan-blue
    chart3: 'oklch(0.6 0.15 220)', // Blue
    chart4: 'oklch(0.8 0.25 30)', // Gold
    chart5: 'oklch(0.75 0.18 280)', // Purple
    border: 'oklch(0.2 0.05 250)',
    input: 'oklch(0.15 0.03 250)',
    ring: 'oklch(0.7 0.15 250)',
    muted: 'oklch(0.15 0.03 250)',
    mutedForeground: 'oklch(0.6 0.05 250)',
    destructive: 'oklch(0.6 0.25 15)', // Bright red for dark mode
    destructiveForeground: 'oklch(0.05 0.05 250)',
  },
  radius: '0.75rem', // Slightly more rounded
  fontFamily: {
    sans: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
}

export const operatorThemes: Record<OperatorColorScheme, OperatorTheme> = {
  light: operatorLightTheme,
  dark: operatorDarkTheme,
}

/**
 * Utility function to get CSS variable name for operator theme
 */
export function getOperatorCSSVariable(colorKey: keyof OperatorThemeColors): string {
  return `--operator-${colorKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`
}

/**
 * Utility function to apply operator theme to CSS custom properties
 */
export function applyOperatorTheme(theme: OperatorTheme): Record<string, string> {
  const cssVars: Record<string, string> = {}
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    cssVars[getOperatorCSSVariable(key as keyof OperatorThemeColors)] = value
  })
  
  cssVars['--operator-radius'] = theme.radius
  cssVars['--operator-font-sans'] = theme.fontFamily.sans
  cssVars['--operator-font-mono'] = theme.fontFamily.mono
  
  return cssVars
}

/**
 * Hook to get operator theme colors
 */
export function useOperatorTheme(scheme: OperatorColorScheme = 'light'): OperatorTheme {
  return operatorThemes[scheme]
}

/**
 * Utility function to generate operator class names
 */
export function getOperatorClassName(prefix: string, variant?: string): string {
  return variant ? `operator-${prefix}-${variant}` : `operator-${prefix}`
}

/**
 * Operator-specific status types
 */
export type OperatorMovieStatus = 'upcoming' | 'now-showing' | 'ended'
export type OperatorSeatType = 'standard' | 'vip'
export type OperatorShowtimeStatus = 'pending' | 'approved'

/**
 * Utility function to get status color class
 */
export function getOperatorStatusClass(status: OperatorMovieStatus): string {
  const statusMap: Record<OperatorMovieStatus, string> = {
    'upcoming': 'operator-bg-upcoming',
    'now-showing': 'operator-bg-now-showing',
    'ended': 'operator-bg-ended',
  }
  return statusMap[status]
}

/**
 * Utility function to get seat type color class
 */
export function getOperatorSeatClass(type: OperatorSeatType): string {
  const seatMap: Record<OperatorSeatType, string> = {
    'standard': 'operator-bg-standard-seat',
    'vip': 'operator-bg-vip-seat',
  }
  return seatMap[type]
}
