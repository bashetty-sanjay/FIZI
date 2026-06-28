import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, ThemeColorsType, ThemeShadowsType } from '../../theme/Theme';
import { useTheme } from '../../hooks/useTheme';
import { getSimplifiedFocus } from '../../utils/workoutUtils';

const NEON_GREEN = '#C4FF1A';

interface TodayWorkoutCardProps {
    todaysWorkout: any;
}

const estimateCalories = (durationMin: number, exerciseCount: number) => {
    const base = Math.round(durationMin * 5.5 + exerciseCount * 12);
    return Math.max(120, Math.round(base / 10) * 10);
};

export const TodayWorkoutCard: React.FC<TodayWorkoutCardProps> = ({ todaysWorkout }) => {
    const { colors, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);

    if (!todaysWorkout) return null;

    const isRestDay = todaysWorkout.isRestDay || todaysWorkout.type === 'rest';
    const focus = getSimplifiedFocus(todaysWorkout.focus);
    const duration = todaysWorkout.duration || 0;
    const exerciseCount = todaysWorkout.exercises?.length || 0;
    const completed = todaysWorkout.exercises?.filter((e: any) => e.completed).length || 0;
    const kcal = estimateCalories(duration, exerciseCount);
    const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return (
        <View style={styles.card}>
            <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>
                    {isRestDay ? "TODAY'S REST" : "TODAY'S WORKOUT"}
                </Text>
            </View>

            <Text style={styles.title}>{isRestDay ? 'Rest & Recovery' : focus}</Text>
            <Text style={styles.dateText}>{dateLabel}</Text>

            {!isRestDay && (
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{duration} min</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="dumbbell" size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{exerciseCount} exercises</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>~{kcal} kcal</Text>
                    </View>
                </View>
            )}

            {!isRestDay && exerciseCount > 0 && (
                <>
                    <View style={styles.divider} />
                    <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>PROGRESS</Text>
                        <Text style={styles.progressValue}>
                            {completed} / {exerciseCount}
                        </Text>
                    </View>
                </>
            )}
        </View>
    );
};

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType, isDark: boolean) => StyleSheet.create({
    card: {
        backgroundColor: isDark ? '#13182A' : '#1A1F2E',
        borderRadius: 24,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        borderWidth: 1,
        borderColor: 'rgba(196, 255, 26, 0.1)',
        ...shadows.card,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: NEON_GREEN + '20',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 14,
        gap: 6,
    },
    badgeDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: NEON_GREEN,
    },
    badgeText: {
        color: NEON_GREEN,
        fontWeight: '800',
        fontSize: 11,
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    dateText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 14,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 4,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginTop: 14,
        marginBottom: 12,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressLabel: {
        fontSize: 12,
        color: colors.textTertiary,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    progressValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
