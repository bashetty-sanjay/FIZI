import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, ThemeColorsType, ThemeShadowsType } from '../../theme/Theme';
import { useTheme } from '../../hooks/useTheme';
import { WorkoutPlan } from '../../types';
import { getSimplifiedFocus } from '../../utils/workoutUtils';

const NEON_GREEN = '#C4FF1A';

interface WeeklyScheduleProps {
    currentPlan: WorkoutPlan;
    selectedDayIndex: number | null;
    onDaySelect: (index: number) => void;
    onLayout?: (event: any) => void;
}

const focusToTag = (focus?: string): { tag: string; iconName: keyof typeof MaterialCommunityIcons.glyphMap; color: string } => {
    const simplified = getSimplifiedFocus(focus).toLowerCase();
    if (simplified.includes('upper')) {
        return { tag: 'UPPER', iconName: 'arm-flex', color: '#22D3EE' };
    }
    if (simplified.includes('lower')) {
        return { tag: 'LOWER', iconName: 'human-handsdown', color: '#7DD87E' };
    }
    if (simplified.includes('full')) {
        return { tag: 'FULL', iconName: 'star-four-points', color: '#F472B6' };
    }
    if (simplified.includes('cardio')) {
        return { tag: 'CARDIO', iconName: 'run-fast', color: '#FF8A3D' };
    }
    if (simplified.includes('recovery')) {
        return { tag: 'REST', iconName: 'sleep', color: 'rgba(255,255,255,0.5)' };
    }
    return { tag: simplified.toUpperCase().slice(0, 5), iconName: 'dumbbell', color: NEON_GREEN };
};

const formatRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + monOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(monday)} — ${fmt(sunday)}`;
};

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
    currentPlan,
    selectedDayIndex,
    onDaySelect,
    onLayout,
}) => {
    const { colors, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
    const todayJsDay = new Date().getDay();
    const todayIndex = todayJsDay === 0 ? 6 : todayJsDay - 1;

    return (
        <View style={styles.section} onLayout={onLayout}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Weekly Schedule</Text>
                <Text style={styles.dateRange}>{formatRange()}</Text>
            </View>

            <View style={styles.weeklyGrid}>
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, idx) => {
                    const dayOfWeek = (idx + 1) % 7;
                    const session = currentPlan?.sessions?.find(s => s.dayOfWeek === dayOfWeek);
                    const isToday = idx === todayIndex;
                    const isSelected = selectedDayIndex === idx;
                    const meta = focusToTag(session?.focus);

                    return (
                        <TouchableOpacity
                            key={day}
                            onPress={() => onDaySelect(idx)}
                            activeOpacity={0.85}
                            style={[
                                styles.dayCard,
                                isToday && styles.dayCardToday,
                                isSelected && !isToday && styles.dayCardSelected,
                            ]}
                        >
                            <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
                            <MaterialCommunityIcons
                                name={meta.iconName}
                                size={20}
                                color={isToday ? NEON_GREEN : meta.color}
                            />
                            <Text style={[styles.dayTag, isToday && styles.dayTagToday]} numberOfLines={1}>
                                {meta.tag}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.hintRow}>
                <View style={styles.hintDot} />
                <Text style={styles.hint}>Tap any day to view its workout</Text>
            </View>
        </View>
    );
};

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType, isDark: boolean) => StyleSheet.create({
    section: {
        marginBottom: Spacing.l,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: Spacing.m,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    dateRange: {
        fontSize: 13,
        color: NEON_GREEN,
        fontWeight: '700',
    },
    weeklyGrid: {
        flexDirection: 'row',
        gap: 6,
    },
    dayCard: {
        flex: 1,
        aspectRatio: 0.6,
        borderRadius: 14,
        backgroundColor: isDark ? '#13182A' : '#1A1F2E',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    dayCardToday: {
        borderColor: NEON_GREEN,
        backgroundColor: 'rgba(196,255,26,0.06)',
    },
    dayCardSelected: {
        borderColor: 'rgba(255,255,255,0.25)',
    },
    dayLabel: {
        fontSize: 11,
        color: colors.textTertiary,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dayLabelToday: {
        color: NEON_GREEN,
    },
    dayTag: {
        fontSize: 9,
        color: '#FFFFFF',
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    dayTagToday: {
        color: NEON_GREEN,
    },
    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 14,
    },
    hintDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: NEON_GREEN,
    },
    hint: {
        fontSize: 12,
        color: colors.textTertiary,
    },
});
