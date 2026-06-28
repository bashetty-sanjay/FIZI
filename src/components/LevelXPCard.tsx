import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, Layout, ThemeColorsType, ThemeShadowsType } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';
import { AVATAR_LEVELS } from '../services/AvatarService';

const NEON_GREEN = '#C4FF1A';

interface LevelXPCardProps {
    level: number;
    xp: number;
    totalWorkouts: number;
    purchased?: boolean;
}

const formatValue = (val: number) => {
    if (val >= 10000) return (val / 1000).toFixed(1) + 'k';
    return val.toLocaleString();
};

export default function LevelXPCard({ level, xp, purchased = false }: LevelXPCardProps) {
    const { colors, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);

    const currentLevelInfo = AVATAR_LEVELS.find(l => l.level === level) || AVATAR_LEVELS[0];
    const nextLevelInfo = AVATAR_LEVELS.find(l => l.level === level + 1);

    const currentLevelXP = currentLevelInfo.minXP || 0;
    const nextLevelXP = nextLevelInfo?.minXP ?? currentLevelXP;
    const totalNeeded = Math.max(1, nextLevelXP - currentLevelXP);
    const progressPct = Math.min(100, Math.max(0, ((xp - currentLevelXP) / totalNeeded) * 100));
    const xpRemaining = Math.max(0, nextLevelXP - xp);

    return (
        <View style={styles.cardContainer}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Current Rank</Text>
                        <View style={styles.levelNameContainer}>
                            <Text style={styles.levelName} numberOfLines={1}>{currentLevelInfo.name}</Text>
                            <View style={styles.levelPill}>
                                <Text style={styles.levelPillText}>LVL {level}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.iconContainer}>
                        <View style={styles.iconGlow} />
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="lightning-bolt" size={26} color="#0A0A0A" />
                        </View>
                    </View>
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.xpLabel}>XP Progress</Text>
                        <Text style={styles.xpValue}>
                            {formatValue(xp)} / {formatValue(nextLevelXP)}
                        </Text>
                    </View>
                    <View style={styles.barBg}>
                        <LinearGradient
                            colors={[NEON_GREEN, '#A8E600']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.barFill, { width: `${progressPct}%` }]}
                        />
                    </View>
                </View>

                {nextLevelInfo && (
                    <View style={styles.footerRow}>
                        <MaterialCommunityIcons name="arrow-right" size={14} color={colors.textTertiary} />
                        <Text style={styles.footerText}>
                            {formatValue(xpRemaining)} XP to <Text style={styles.footerHighlight}>{nextLevelInfo.name}</Text>
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType, isDark: boolean) => StyleSheet.create({
    cardContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: Spacing.s,
        backgroundColor: isDark ? '#13182A' : '#1A1F2E',
        borderWidth: 1,
        borderColor: 'rgba(196, 255, 26, 0.08)',
        ...shadows.card,
    },
    content: {
        padding: Spacing.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.m,
    },
    label: {
        fontSize: 11,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontWeight: '700',
        marginBottom: 6,
    },
    levelNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    levelName: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.8,
        marginRight: 10,
    },
    levelPill: {
        backgroundColor: NEON_GREEN,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    levelPillText: {
        color: '#0A0A0A',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    iconContainer: {
        position: 'relative',
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconGlow: {
        position: 'absolute',
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: NEON_GREEN,
        opacity: 0.18,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: NEON_GREEN,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressSection: {
        marginBottom: 12,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    xpLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    xpValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '800',
    },
    barBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 13,
        color: colors.textTertiary,
        fontWeight: '500',
    },
    footerHighlight: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
});
