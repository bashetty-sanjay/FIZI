import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import {
    fetchWorkoutHistory,
    fetchWorkoutStats,
    fetchPersonalBests
} from '../store/slices/workoutSlice';
import { setHistoryScrollOffset } from '../store/slices/uiSlice';
import { workoutService } from '../services/WorkoutService';
import { Spacing, ThemeColorsType, ThemeShadowsType } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';

const NEON_GREEN = '#C4FF1A';
const CARD_BG = '#13182A';

interface HistoryScreenProps {
    navigation: any;
}

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
    const { colors, gradients, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
    const dispatch = useAppDispatch();
    const { history, stats, personalBests, loading, error } = useAppSelector(
        (state) => state.workout
    );
    const { historyScrollOffset } = useAppSelector((state) => state.ui);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
    const [weeklyStats, setWeeklyStats] = useState<{ date: string; calories: number; duration: number }[]>([]);
    const [graphMetric, setGraphMetric] = useState<'calories' | 'duration'>('calories');
    const [graphPeriod, setGraphPeriod] = useState<'week' | 'month' | 'all'>('week');

    useEffect(() => {
        if (historyScrollOffset > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: historyScrollOffset, animated: false });
            }, 100);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [graphPeriod, selectedPeriod]);

    const loadData = async () => {
        try {
            await Promise.all([
                dispatch(fetchWorkoutHistory(20)),
                dispatch(fetchWorkoutStats(selectedPeriod)),
                dispatch(fetchPersonalBests())
            ]);

            let graphData;
            if (graphPeriod === 'week') {
                graphData = await workoutService.getWeeklyStats();
            } else if (graphPeriod === 'month') {
                graphData = await workoutService.getMonthlyStats();
            } else {
                graphData = await workoutService.getAllTimeStats();
            }
            setWeeklyStats(graphData);
        } catch (err) {
            console.error('[HistoryScreen] Error loading data:', err);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const formatDate = (date: any): string => {
        const d = date?.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return d.toLocaleDateString();
    };

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerLabel}>YOUR PROGRESS</Text>
                    <Text style={styles.title}>Workout History</Text>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON_GREEN} />
                }
                onMomentumScrollEnd={(e) => {
                    dispatch(setHistoryScrollOffset(e.nativeEvent.contentOffset.y));
                }}
                onScrollEndDrag={(e) => {
                    dispatch(setHistoryScrollOffset(e.nativeEvent.contentOffset.y));
                }}
                scrollEventThrottle={16}
            >
                {/* Activity Trends */}
                <View style={styles.card}>
                    <View style={styles.graphHeader}>
                        <Text style={styles.sectionTitle}>Activity Trends</Text>
                        <View style={styles.graphToggle}>
                            <TouchableOpacity
                                style={[styles.toggleButton, graphMetric === 'calories' && styles.toggleButtonActive]}
                                onPress={() => setGraphMetric('calories')}
                            >
                                <Text style={[styles.toggleText, graphMetric === 'calories' && styles.toggleTextActive]}>Calories</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleButton, graphMetric === 'duration' && styles.toggleButtonActive]}
                                onPress={() => setGraphMetric('duration')}
                            >
                                <Text style={[styles.toggleText, graphMetric === 'duration' && styles.toggleTextActive]}>Duration</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.periodSelector}>
                        {(['week', 'month', 'all'] as const).map((period) => (
                            <TouchableOpacity
                                key={period}
                                style={[
                                    styles.periodButton,
                                    graphPeriod === period && styles.periodButtonActive,
                                ]}
                                onPress={() => setGraphPeriod(period)}
                            >
                                <Text
                                    style={[
                                        styles.periodButtonText,
                                        graphPeriod === period && styles.periodButtonTextActive,
                                    ]}
                                >
                                    {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {weeklyStats.length > 0 ? (
                        <View style={styles.chartWrap}>
                            <LineChart
                                data={{
                                    labels: weeklyStats.map(d => d.date),
                                    datasets: [{
                                        data: weeklyStats.map(d => graphMetric === 'calories' ? d.calories : d.duration),
                                        color: (opacity = 1) => `rgba(196, 255, 26, ${opacity})`,
                                        strokeWidth: 3
                                    }]
                                }}
                                width={Dimensions.get('window').width - 56}
                                height={200}
                                segments={4}
                                yAxisSuffix={graphMetric === 'calories' ? '' : 'm'}
                                yAxisInterval={1}
                                fromZero
                                withInnerLines={true}
                                withOuterLines={false}
                                withVerticalLines={false}
                                withHorizontalLines={true}
                                withShadow={true}
                                withDots={true}
                                chartConfig={{
                                    backgroundColor: 'transparent',
                                    backgroundGradientFrom: CARD_BG,
                                    backgroundGradientFromOpacity: 0,
                                    backgroundGradientTo: CARD_BG,
                                    backgroundGradientToOpacity: 0,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(196, 255, 26, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.6})`,
                                    style: { borderRadius: 16 },
                                    propsForLabels: {
                                        fontSize: 11,
                                        fontWeight: '600',
                                    },
                                    propsForDots: {
                                        r: '5',
                                        strokeWidth: '2',
                                        stroke: NEON_GREEN,
                                        fill: '#0A0A0A',
                                    },
                                    propsForBackgroundLines: {
                                        strokeDasharray: '',
                                        stroke: 'rgba(255,255,255,0.06)',
                                        strokeWidth: 1
                                    },
                                    fillShadowGradient: NEON_GREEN,
                                    fillShadowGradientOpacity: 0.22,
                                    fillShadowGradientFrom: NEON_GREEN,
                                    fillShadowGradientFromOpacity: 0.28,
                                    fillShadowGradientTo: NEON_GREEN,
                                    fillShadowGradientToOpacity: 0,
                                }}
                                bezier
                                style={styles.chart}
                            />
                        </View>
                    ) : (
                        <View style={styles.noGraphData}>
                            <Text style={styles.noGraphText}>No activity data for this period</Text>
                        </View>
                    )}
                </View>

                {/* Performance Overview */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Performance Overview</Text>

                    <View style={styles.periodSelector}>
                        {(['week', 'month', 'all'] as const).map((period) => (
                            <TouchableOpacity
                                key={period}
                                style={[
                                    styles.periodButton,
                                    selectedPeriod === period && styles.periodButtonActive,
                                ]}
                                onPress={() => setSelectedPeriod(period)}
                            >
                                <Text
                                    style={[
                                        styles.periodButtonText,
                                        selectedPeriod === period && styles.periodButtonTextActive,
                                    ]}
                                >
                                    {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, styles.statAccent]}>{stats.totalWorkouts}</Text>
                            <Text style={styles.statLabel}>Sessions</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.totalReps}</Text>
                            <Text style={styles.statLabel}>Total Reps</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
                            <Text style={styles.statLabel}>Training Time</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.totalCalories}</Text>
                            <Text style={styles.statLabel}>Calories</Text>
                        </View>
                    </View>

                    <View style={styles.avgScoreContainer}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.avgScoreLabel}>AVERAGE FORM ACCURACY</Text>
                        </View>
                        <Text style={[
                            styles.avgScoreValue,
                            stats.averageFormScore >= 80 ? styles.scoreGood :
                                stats.averageFormScore >= 60 ? styles.scoreWarning : styles.scoreBad
                        ]}>
                            {stats.averageFormScore}%
                        </Text>
                    </View>
                </View>

                {/* Personal Bests */}
                {(personalBests.maxReps || personalBests.longestWorkout || personalBests.bestFormScore) && (
                    <View style={styles.card}>
                        <View style={styles.bestsHeader}>
                            <View style={styles.bestsBadge}>
                                <MaterialCommunityIcons name="trophy" size={14} color="#0A0A0A" />
                            </View>
                            <Text style={styles.sectionTitleNoMargin}>Personal Bests</Text>
                        </View>

                        {personalBests.maxReps && (
                            <View style={styles.bestItem}>
                                <View style={[styles.bestIconContainer, { backgroundColor: 'rgba(196,255,26,0.15)' }]}>
                                    <MaterialCommunityIcons name="arm-flex" size={20} color={NEON_GREEN} />
                                </View>
                                <View style={styles.bestInfo}>
                                    <Text style={styles.bestValue}>{personalBests.maxReps.value} reps</Text>
                                    <Text style={styles.bestLabel}>{personalBests.maxReps.exercise}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                            </View>
                        )}

                        {personalBests.longestWorkout && (
                            <View style={styles.bestItem}>
                                <View style={[styles.bestIconContainer, { backgroundColor: 'rgba(34,211,238,0.15)' }]}>
                                    <MaterialCommunityIcons name="clock-outline" size={20} color="#22D3EE" />
                                </View>
                                <View style={styles.bestInfo}>
                                    <Text style={styles.bestValue}>{formatDuration(personalBests.longestWorkout.value)}</Text>
                                    <Text style={styles.bestLabel}>Longest Session</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                            </View>
                        )}

                        {personalBests.bestFormScore && (
                            <View style={[styles.bestItem, { marginBottom: 0 }]}>
                                <View style={[styles.bestIconContainer, { backgroundColor: 'rgba(192,132,252,0.18)' }]}>
                                    <MaterialCommunityIcons name="star" size={20} color="#C084FC" />
                                </View>
                                <View style={styles.bestInfo}>
                                    <Text style={styles.bestValue}>{personalBests.bestFormScore.value}%</Text>
                                    <Text style={styles.bestLabel}>Highest Form Score</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                            </View>
                        )}
                    </View>
                )}

                {/* Recent Activities */}
                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>Recent Activities</Text>

                    {error && (
                        <View style={styles.errorState}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={42} color={colors.accentError} />
                            <Text style={styles.errorText}>Failed to load history</Text>
                            <Text style={styles.errorSubtext}>{error}</Text>
                            <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!error && loading && history.length === 0 ? (
                        <ActivityIndicator color={NEON_GREEN} size="large" style={{ marginTop: 20 }} />
                    ) : !error && history.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrap}>
                                <MaterialCommunityIcons name="dumbbell" size={36} color={NEON_GREEN} />
                            </View>
                            <Text style={styles.emptyText}>No workouts yet</Text>
                            <Text style={styles.emptySubtext}>Complete a workout to see it here</Text>
                        </View>
                    ) : !error && (
                        history.map((workout, idx) => (
                            <View key={workout.id} style={styles.workoutItem}>
                                <View style={styles.workoutNumberBadge}>
                                    <Text style={styles.workoutNumberText}>{idx + 1}</Text>
                                </View>
                                <View style={styles.workoutBody}>
                                    <View style={styles.workoutHeaderRow}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={styles.workoutExercise} numberOfLines={1}>{workout.exerciseName}</Text>
                                            <Text style={styles.workoutDate}>{formatDate(workout.createdAt)}</Text>
                                        </View>
                                        <View style={[
                                            styles.scoreBadge,
                                            workout.averageFormScore >= 80 ? styles.scoreBadgeGood :
                                                workout.averageFormScore >= 60 ? styles.scoreBadgeWarning : styles.scoreBadgeBad
                                        ]}>
                                            <Text style={[
                                                styles.scoreBadgeText,
                                                workout.averageFormScore >= 80 ? { color: NEON_GREEN } :
                                                    workout.averageFormScore >= 60 ? { color: '#FACC15' } : { color: '#F87171' }
                                            ]}>
                                                {workout.averageFormScore}%
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.workoutDetails}>
                                        <View style={styles.detailPill}>
                                            <MaterialCommunityIcons name="repeat" size={12} color={colors.textSecondary} />
                                            <Text style={styles.workoutStat}>{workout.reps} reps</Text>
                                        </View>
                                        <View style={styles.detailPill}>
                                            <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textSecondary} />
                                            <Text style={styles.workoutStat}>{formatDuration(workout.duration)}</Text>
                                        </View>
                                        <View style={styles.detailPill}>
                                            <MaterialCommunityIcons name="lightning-bolt" size={12} color={colors.textSecondary} />
                                            <Text style={styles.workoutStat}>{workout.caloriesBurned || 0} kcal</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: Spacing.m,
        paddingBottom: 18,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    headerLabel: {
        fontSize: 11,
        color: NEON_GREEN,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.4,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.m,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 14,
        letterSpacing: -0.2,
    },
    sectionTitleNoMargin: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.2,
    },

    // Generic dark card
    card: {
        backgroundColor: isDark ? CARD_BG : '#1A1F2E',
        borderRadius: 22,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        ...shadows.card,
    },

    // Graph
    graphHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    graphToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        padding: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    toggleButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 7,
    },
    toggleButtonActive: {
        backgroundColor: NEON_GREEN,
    },
    toggleText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '700',
    },
    toggleTextActive: {
        color: '#0A0A0A',
        fontWeight: '900',
    },
    chartWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: -8,
        marginTop: 4,
        marginBottom: 4,
    },
    chart: {
        borderRadius: 16,
        paddingRight: 0,
    },
    noGraphData: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noGraphText: {
        color: colors.textTertiary,
        fontSize: 14,
    },

    // Period Selector
    periodSelector: {
        flexDirection: 'row',
        marginBottom: 14,
        gap: 8,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: NEON_GREEN,
        borderColor: NEON_GREEN,
    },
    periodButtonText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '700',
    },
    periodButtonTextActive: {
        color: '#0A0A0A',
        fontWeight: '900',
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statItem: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    statAccent: {
        color: NEON_GREEN,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },

    // Avg Score
    avgScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    avgScoreLabel: {
        color: colors.textTertiary,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    avgScoreValue: {
        fontSize: 30,
        fontWeight: '900',
    },
    scoreGood: { color: NEON_GREEN },
    scoreWarning: { color: '#FACC15' },
    scoreBad: { color: '#F87171' },

    // Personal Bests
    bestsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    bestsBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: NEON_GREEN,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    bestIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    bestInfo: {
        flex: 1,
    },
    bestValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.2,
    },
    bestLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },

    // History
    historySection: {
        marginBottom: 20,
    },
    workoutItem: {
        flexDirection: 'row',
        backgroundColor: isDark ? CARD_BG : '#1A1F2E',
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
    },
    workoutNumberBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    workoutNumberText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '700',
    },
    workoutBody: {
        flex: 1,
    },
    workoutHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    workoutExercise: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.2,
    },
    workoutDate: {
        fontSize: 12,
        color: colors.textTertiary,
        marginTop: 2,
    },
    scoreBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    scoreBadgeGood: { backgroundColor: 'rgba(196,255,26,0.15)' },
    scoreBadgeWarning: { backgroundColor: 'rgba(250,204,21,0.18)' },
    scoreBadgeBad: { backgroundColor: 'rgba(248,113,113,0.15)' },
    scoreBadgeText: {
        fontSize: 12,
        fontWeight: '900',
    },
    workoutDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    detailPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    workoutStat: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        paddingVertical: 50,
        borderRadius: 22,
        backgroundColor: isDark ? CARD_BG : '#1A1F2E',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(196,255,26,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(196,255,26,0.2)',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    emptySubtext: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 6,
        textAlign: 'center',
        paddingHorizontal: 40,
    },

    // Error
    errorState: {
        alignItems: 'center',
        paddingVertical: 36,
        paddingHorizontal: 20,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(248,113,113,0.3)',
        backgroundColor: 'rgba(248,113,113,0.08)',
    },
    errorText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.accentError,
        marginTop: 10,
        marginBottom: 4,
    },
    errorSubtext: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 14,
    },
    retryButton: {
        backgroundColor: NEON_GREEN,
        paddingHorizontal: 22,
        paddingVertical: 9,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#0A0A0A',
        fontSize: 13,
        fontWeight: '900',
    },
});
