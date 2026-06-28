import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, ThemeColorsType, ThemeShadowsType } from '../../theme/Theme';
import { useTheme } from '../../hooks/useTheme';

const NEON_GREEN = '#C4FF1A';

interface ExerciseListCardProps {
    index: number;
    exercise: any;
    onPress: () => void;
}

type CategoryStyle = { bg: string; fg: string };

const categoryStyle = (exercise: any): { label: string; style: CategoryStyle } => {
    const muscle: string = (exercise.targetMuscle || (exercise.muscleGroups?.[0]) || '').toString().toLowerCase();
    const cat: string = (exercise.category || '').toString().toLowerCase();
    const name: string = (exercise.displayName || exercise.name || exercise.exerciseName || '').toString().toLowerCase();

    const has = (k: string) => muscle.includes(k) || cat.includes(k) || name.includes(k);

    if (cat.includes('cardio') || has('cardio') || has('jumping') || has('walking') || has('running')) {
        return { label: 'CARDIO', style: { bg: '#3A2410', fg: '#FF8A3D' } };
    }
    if (cat.includes('flex') || has('recovery') || has('child') || has('pose') || has('stretch') || has('mobility')) {
        return { label: 'RECOVERY', style: { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.7)' } };
    }
    if (has('chest') || has('push-up') || has('push up')) {
        return { label: 'CHEST', style: { bg: 'rgba(196,255,26,0.18)', fg: NEON_GREEN } };
    }
    if (has('back') || has('superman') || has('row')) {
        return { label: 'BACK', style: { bg: 'rgba(76, 175, 80, 0.18)', fg: '#7DD87E' } };
    }
    if (has('core') || has('bird') || has('plank') || has('abs')) {
        return { label: 'CORE', style: { bg: 'rgba(76, 175, 80, 0.18)', fg: '#7DD87E' } };
    }
    if (has('leg') || has('lower') || has('squat') || has('lunge')) {
        return { label: 'LEGS', style: { bg: 'rgba(124, 58, 237, 0.2)', fg: '#C084FC' } };
    }
    if (has('arm') || has('curl') || has('tricep') || has('bicep')) {
        return { label: 'ARMS', style: { bg: 'rgba(34, 211, 238, 0.18)', fg: '#22D3EE' } };
    }
    return { label: (cat || 'STRENGTH').toUpperCase(), style: { bg: 'rgba(196,255,26,0.18)', fg: NEON_GREEN } };
};

export const ExerciseListCard: React.FC<ExerciseListCardProps> = ({ index, exercise, onPress }) => {
    const { colors, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);

    const { label, style } = categoryStyle(exercise);
    const name = exercise.displayName || exercise.name || exercise.exerciseName || 'Exercise';
    const sets = exercise.sets;
    const reps = exercise.reps;

    return (
        <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
            <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{index + 1}</Text>
            </View>

            <View style={styles.middle}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <View style={styles.metaRow}>
                    <View style={[styles.categoryPill, { backgroundColor: style.bg }]}>
                        <Text style={[styles.categoryText, { color: style.fg }]}>{label}</Text>
                    </View>
                    {sets != null && reps != null && (
                        <Text style={styles.setsReps}>{sets} × {reps}</Text>
                    )}
                </View>
            </View>

            <View style={[styles.playButton, exercise.completed && styles.playButtonCompleted]}>
                {exercise.completed ? (
                    <MaterialCommunityIcons name="check" size={20} color="#0A0A0A" />
                ) : (
                    <MaterialCommunityIcons name="play" size={20} color={NEON_GREEN} />
                )}
            </View>
        </TouchableOpacity>
    );
};

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType, isDark: boolean) => StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#13182A' : '#1A1F2E',
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    numberBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    numberText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '700',
    },
    middle: {
        flex: 1,
    },
    name: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
        letterSpacing: -0.2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    categoryPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    setsReps: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    playButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(196, 255, 26, 0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(196, 255, 26, 0.3)',
    },
    playButtonCompleted: {
        backgroundColor: NEON_GREEN,
        borderColor: NEON_GREEN,
    },
});
