import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing, ThemeColorsType, ThemeShadowsType } from '../../theme/Theme';
import { useTheme } from '../../hooks/useTheme';

const NEON_GREEN = '#C4FF1A';

interface StatsRowProps {
    workouts: number;
    streakDays: number;
    totalXP: number;
}

const formatXP = (val: number) => {
    if (val >= 10000) return (val / 1000).toFixed(1) + 'k';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toLocaleString();
};

export const StatsRow: React.FC<StatsRowProps> = ({ workouts, streakDays, totalXP }) => {
    const { colors, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);

    const xpFormatted = formatXP(totalXP);
    const xpHasUnit = xpFormatted.endsWith('k');
    const xpNumber = xpHasUnit ? xpFormatted.slice(0, -1) : xpFormatted;

    return (
        <View style={styles.row}>
            <View style={styles.card}>
                <Text style={styles.value}>{workouts}</Text>
                <Text style={styles.label}>Workouts</Text>
            </View>
            <View style={styles.card}>
                <View style={styles.valueRow}>
                    <Text style={styles.value}>{streakDays}</Text>
                    <Text style={styles.unit}>d</Text>
                </View>
                <Text style={styles.label}>Streak</Text>
            </View>
            <View style={styles.card}>
                <View style={styles.valueRow}>
                    <Text style={[styles.value, styles.valueAccent]}>{xpNumber}</Text>
                    {xpHasUnit && <Text style={[styles.unit, styles.unitAccent]}>k</Text>}
                </View>
                <Text style={styles.label}>Total XP</Text>
            </View>
        </View>
    );
};

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType, isDark: boolean) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: Spacing.s,
        marginBottom: Spacing.m,
    },
    card: {
        flex: 1,
        backgroundColor: isDark ? '#13182A' : '#1A1F2E',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    value: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        lineHeight: 32,
    },
    valueAccent: {
        color: NEON_GREEN,
    },
    unit: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textSecondary,
        marginLeft: 2,
        marginBottom: 4,
    },
    unitAccent: {
        color: NEON_GREEN,
    },
    label: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
        marginTop: 2,
    },
});
