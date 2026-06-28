import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LevelXPCard from '../LevelXPCard';
import MotivationalTip from '../MotivationalTip';
import { WeeklySchedule } from './WeeklySchedule';
import { TodayWorkoutCard } from './TodayWorkoutCard';
import { ExerciseListCard } from './ExerciseListCard';
import { StatsRow } from './StatsRow';
import { QuickAccessRow } from './QuickAccessRow';
import { RecoveryStatusCard } from './RecoveryStatusCard';
import { HomeHeader } from './HomeHeader';
import { useTheme } from '../../hooks/useTheme';
import { useBilling } from '../../context/BillingContext';
import { AvatarState } from '../../services/AvatarService';
import { getSimplifiedFocus } from '../../utils/workoutUtils';

const NEON_GREEN = '#C4FF1A';

interface WorkTabProps {
    user: any;
    navigation: any;
    avatarState: AvatarState | null;
    todaysWorkout: any;
    isRestDay: boolean;
    nextWorkout: any;
    recoveryStatus: 'good' | 'moderate' | 'poor';
    currentPlan: any;
    selectedDayIndex: number | null;
    scrollViewRef: React.RefObject<any>;
    scheduleLayoutY: React.MutableRefObject<number>;
    onStartExercise: (exercise: any) => void;
    onRecoveryChange: (status: 'good' | 'moderate' | 'poor') => void;
    onDaySelect: (index: number) => void;
    getRecoveryTips: () => string[];
    styles: any;
}

const dayShort = (d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d];

export function WorkTab({
    user,
    navigation,
    avatarState,
    todaysWorkout,
    isRestDay,
    nextWorkout,
    recoveryStatus,
    currentPlan,
    selectedDayIndex,
    scrollViewRef,
    scheduleLayoutY,
    onStartExercise,
    onRecoveryChange,
    onDaySelect,
    styles,
}: WorkTabProps) {
    const { colors } = useTheme();
    const { purchased } = useBilling();

    const todayJsDay = new Date().getDay();
    const todayIdx = todayJsDay === 0 ? 6 : todayJsDay - 1;
    const isViewingToday = selectedDayIndex === null || selectedDayIndex === todayIdx;

    const selectedSession = currentPlan?.sessions && selectedDayIndex !== null
        ? currentPlan.sessions.find((s: any) => s.dayOfWeek === (selectedDayIndex + 1) % 7)
        : null;

    const displayedWorkout = isViewingToday ? todaysWorkout : selectedSession;
    const displayedIsRest = displayedWorkout?.isRestDay || displayedWorkout?.type === 'rest';
    const displayedExercises: any[] = displayedWorkout?.exercises || [];

    const exerciseHeader = isViewingToday
        ? `${dayShort(todayJsDay)} Exercises`
        : `${dayShort((selectedDayIndex! + 1) % 7)} Exercises`;

    return (
        <>
            <HomeHeader user={user} onAvatarPress={() => navigation.navigate('LevelProgress')} isPremium={purchased} />

            <TouchableOpacity
                onPress={() => navigation.navigate('LevelProgress')}
                activeOpacity={0.9}
            >
                <LevelXPCard
                    level={avatarState?.level || user?.progressSystem?.currentLevel || user?.level || 1}
                    xp={avatarState?.xp || user?.progressSystem?.currentXP || user?.xp || 0}
                    totalWorkouts={avatarState?.totalWorkouts || user?.progressSystem?.totalWorkoutsCompleted || user?.totalWorkouts || 0}
                    purchased={purchased}
                />
            </TouchableOpacity>

            <StatsRow
                workouts={avatarState?.totalWorkouts || user?.progressSystem?.totalWorkoutsCompleted || user?.totalWorkouts || 0}
                streakDays={avatarState?.currentStreak || 0}
                totalXP={avatarState?.xp || user?.progressSystem?.currentXP || user?.xp || 0}
            />

            {displayedWorkout && <TodayWorkoutCard todaysWorkout={displayedWorkout} />}

            {/* Exercise list section header */}
            {displayedWorkout && !displayedIsRest && displayedExercises.length > 0 && (
                <View style={localStyles.listHeader}>
                    <Text style={localStyles.listHeaderTitle}>{exerciseHeader}</Text>
                    {currentPlan && (
                        <TouchableOpacity onPress={() => navigation.navigate('ExerciseLibrary')}>
                            <Text style={localStyles.viewAll}>View all →</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {displayedWorkout && !displayedIsRest && (
                <View>
                    {displayedExercises.length > 0 ? (
                        displayedExercises.map((exercise: any, index: number) => (
                            <ExerciseListCard
                                key={`${exercise.exerciseId || exercise.id || exercise.name}-${index}`}
                                index={index}
                                exercise={exercise}
                                onPress={() => onStartExercise(exercise)}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyExercisesCard}>
                            <Text style={styles.emptyExercisesText}>No exercises found for this session.</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Rest Day */}
            {displayedWorkout && displayedIsRest && (
                <View style={{ marginBottom: 16 }}>
                    <Text style={localStyles.restMessage}>
                        {(displayedWorkout.notes || 'Take today to recover and prepare for your next workout.').replace(/\*\*/g, '')}
                    </Text>
                    {nextWorkout && isViewingToday && (
                        <TouchableOpacity
                            style={localStyles.nextPreview}
                            onPress={() => {
                                const targetDayIndex = nextWorkout.dayOfWeek === 0 ? 6 : (nextWorkout.dayOfWeek || 0) - 1;
                                onDaySelect(targetDayIndex);
                                scrollViewRef.current?.scrollTo({ x: 0, y: scheduleLayoutY.current, animated: true });
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={localStyles.nextPreviewLabel}>NEXT WORKOUT</Text>
                                <Text style={localStyles.nextPreviewTitle}>
                                    {getSimplifiedFocus(nextWorkout.focus)} • {dayShort(nextWorkout.dayOfWeek || 0)}
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="arrow-right" size={20} color={NEON_GREEN} />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <View style={{ marginBottom: 24 }}>
                <MotivationalTip />
            </View>

            {currentPlan && (
                <WeeklySchedule
                    currentPlan={currentPlan}
                    selectedDayIndex={selectedDayIndex}
                    onDaySelect={onDaySelect}
                    onLayout={(event) => {
                        const layout = event.nativeEvent.layout;
                        scheduleLayoutY.current = layout.y;
                    }}
                />
            )}

            <QuickAccessRow
                onLibrary={() => navigation.navigate('ExerciseLibrary')}
                onHistory={() => navigation.navigate('History')}
            />

            <RecoveryStatusCard status={recoveryStatus} onChange={onRecoveryChange} />

            <View style={{ height: 40 }} />
        </>
    );
}

const localStyles = {
    listHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 12,
        marginTop: 4,
    },
    listHeaderTitle: {
        fontSize: 22,
        fontWeight: '900' as const,
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    viewAll: {
        color: NEON_GREEN,
        fontSize: 14,
        fontWeight: '700' as const,
    },
    restMessage: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 14,
        paddingHorizontal: 4,
    },
    nextPreview: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: 'rgba(196,255,26,0.08)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(196,255,26,0.2)',
        gap: 12,
    },
    nextPreviewLabel: {
        color: NEON_GREEN,
        fontSize: 11,
        fontWeight: '800' as const,
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    nextPreviewTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700' as const,
    },
};
