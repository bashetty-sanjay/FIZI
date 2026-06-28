/**
 * Premium Design System
 */
import { Platform } from 'react-native';

export const DarkColors = {
    // Backgrounds
    backgroundDark: '#000000', // Pitch Black
    backgroundDarker: '#050510',
    backgroundLight: '#12122A',

    // Primary Brand Gradients
    primaryStart: '#4F46E5', // Indigo
    primaryEnd: '#7C3AED', // Violet

    // Accents
    accentCyan: '#22D3EE', // Cyan Neone
    accentPink: '#F472B6', // Pink Neon
    accentYellow: '#FACC15',
    accentSuccess: '#4ADE80',
    accentError: '#F87171',
    accentWarning: '#FACC15',
    accentWarningBorder: 'rgba(250, 204, 21, 0.3)',
    accentPurple: '#C084FC',
    accentErrorBorder: 'rgba(248, 113, 113, 0.3)',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.75)',
    textTertiary: 'rgba(255, 255, 255, 0.45)',
    textDark: '#000000',

    // Glassmorphism
    glassSurface: 'rgba(255, 255, 255, 0.12)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassHighlight: 'rgba(255, 255, 255, 0.20)',
    cardSurface: '#1E1E2E', // Dark card background for non-glass elements
};

export const LightColors = {
    // Backgrounds
    backgroundDark: '#F8FAFC', // Soft Off-White (Cool tone)
    backgroundDarker: '#F1F5F9', // Slightly darker blue-gray
    backgroundLight: '#FFFFFF', // Pure White for cards/surfaces

    // Primary Brand Gradients (Vibrant Indigo-Violet)
    primaryStart: '#6366F1', // Indigo 500
    primaryEnd: '#8B5CF6', // Violet 500

    // Accents (Legible and Vibrant)
    accentCyan: '#0EA5E9', // Sky 500
    accentPink: '#EC4899', // Pink 500
    accentYellow: '#F59E0B', // Amber 500
    accentSuccess: '#10B981', // Emerald 500
    accentError: '#EF4444', // Red 500
    accentWarning: '#F59E0B',
    accentWarningBorder: 'rgba(245, 158, 11, 0.2)',
    accentPurple: '#A855F7', // Purple 500
    accentErrorBorder: 'rgba(239, 68, 68, 0.2)',

    // Text (Clear Hierarchy)
    textPrimary: '#0F172A', // Slate 900
    textSecondary: '#475569', // Slate 600
    textTertiary: '#94A3B8', // Slate 400
    textDark: '#000000',

    // Glassmorphism (Frosted Glass for Light Mode)
    glassSurface: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(148, 163, 184, 0.15)',
    glassHighlight: 'rgba(255, 255, 255, 0.9)',
    cardSurface: '#FFFFFF', // Light card background
};

// Default export for backward compatibility
export const Colors = DarkColors;

export type ThemeColorsType = typeof DarkColors;

export const Gradients = {
    background: [DarkColors.backgroundDark, '#0F172A'] as const,
    primary: [DarkColors.primaryStart, DarkColors.primaryEnd] as const,
    gold: ['#FDE047', '#EAB308'] as const,
    purple: ['#C084FC', '#7E22CE'] as const,
    ocean: ['#22D3EE', '#0EA5E9'] as const,
    fire: ['#F87171', '#EF4444'] as const,
    darkOverlay: ['transparent', 'rgba(0,0,0,0.8)'] as const,
};

// Helper for dynamic gradients based on theme
export const getGradients = (colors: ThemeColorsType) => ({
    background: colors === DarkColors
        ? [colors.backgroundDark, '#0F172A'] as const
        : [colors.backgroundDark, colors.backgroundDarker] as const,
    primary: [colors.primaryStart, colors.primaryEnd] as const,
    gold: ['#FDE047', '#EAB308'] as const,
    purple: ['#C084FC', '#7E22CE'] as const,
    ocean: colors === DarkColors
        ? ['#22D3EE', '#0EA5E9'] as const
        : ['#38BDF8', '#0EA5E9'] as const,
    fire: colors === DarkColors
        ? ['#F87171', '#EF4444'] as const
        : ['#FCA5A5', '#EF4444'] as const,
    darkOverlay: colors === DarkColors
        ? ['transparent', 'rgba(0,0,0,0.8)'] as const
        : ['transparent', 'rgba(15, 23, 42, 0.1)'] as const,
});

export const Spacing = {
    xs: 6,
    s: 12,
    m: 20,
    l: 32,
    xl: 48,
    xxl: 64,
};

export const getShadows = (colors: ThemeColorsType) => ({
    glow: {
        shadowColor: colors.primaryStart,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: colors === DarkColors ? 0.6 : 0.3,
        shadowRadius: 24,
        elevation: 12,
    },
    card: {
        shadowColor: colors === DarkColors ? '#000' : 'rgba(15, 23, 42, 0.12)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: colors === DarkColors ? 0.5 : 1,
        shadowRadius: 20,
        elevation: 10,
    },
    small: {
        shadowColor: colors === DarkColors ? '#000' : 'rgba(15, 23, 42, 0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: colors === DarkColors ? 0.3 : 1,
        shadowRadius: 8,
        elevation: 4,
    }
});

export type ThemeShadowsType = ReturnType<typeof getShadows>;

export const Shadows = {
    glow: {
        shadowColor: Colors.primaryStart,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 12,
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    }
};

export const Layout = {
    borderRadius: {
        s: 12,
        m: 24,
        l: 32,
        xl: 48,
        round: 9999,
    }
};

export const Typography = {
    fontFamily: {
        serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
        sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
    },
    h1: {
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
        fontSize: 32,
        fontWeight: '700' as const,
        letterSpacing: 0.5,
    },
    h2: {
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
        fontSize: 24,
        fontWeight: '600' as const,
        letterSpacing: 0.25,
    },
    h3: {
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
        fontSize: 20,
        fontWeight: '600' as const,
        letterSpacing: 0,
    },
    body: {
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    caption: {
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
        fontSize: 12,
        fontWeight: '400' as const,
        color: 'rgba(255,255,255,0.6)',
    },
    overline: {
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
        fontSize: 11,
        fontWeight: '700' as const,
        letterSpacing: 1.5, // Wide tracking for "classic" feel
        textTransform: 'uppercase' as const,
    }
};
