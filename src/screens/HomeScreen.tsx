import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Image, NativeSyntheticEvent, NativeScrollEvent, Animated } from 'react-native';
import AvatarScreen from './AvatarScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { fetchWorkoutStats } from '../store/slices/workoutSlice';
import { fetchWorkoutPlan, fetchCustomPlans } from '../store/slices/workoutPlanSlice';
import { setActiveHomeTab, setWorkScrollOffset, setDietScrollOffset } from '../store/slices/uiSlice';
import MotivationalTip from '../components/MotivationalTip';
import { Spacing, Shadows, Layout, ThemeColorsType, ThemeShadowsType } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';
import { seedAllInstructions } from '../store/slices/exerciseSlice';
import { ExerciseInstructions, WorkoutSession } from '../types';
import { setRecoveryStatus, updatePlanLevel, regenerateUserPlan } from '../store/slices/workoutPlanSlice';
import { useBilling } from '../context/BillingContext';
import { avatarService, AvatarState, AVATAR_LEVELS } from '../services/AvatarService';
import LevelXPCard from '../components/LevelXPCard';
import { HomeHeader } from '../components/home/HomeHeader';
import { DailyStatusCard } from '../components/home/DailyStatusCard';
import { WeeklySchedule } from '../components/home/WeeklySchedule';
import { getSimplifiedFocus } from '../utils/workoutUtils';
import { WorkTab } from '../components/home/WorkTab';
import { DietTab } from '../components/home/DietTab';
import { PremiumGate } from '../components/PremiumGate';
import { CommunityFeed } from '../community/screens/CommunityFeed';


interface HomeScreenProps {
    navigation: any;
}

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const dispatch = useAppDispatch();
    const { colors, gradients, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
    const { user } = useAppSelector((state) => state.auth);
    const { purchased } = useBilling();
    const { stats } = useAppSelector((state) => state.workout);
    const { currentPlan, customPlans, todaysWorkout, recoveryStatus, loading: planLoading } = useAppSelector((state) => state.workoutPlan);
    const { activeHomeTab, workScrollOffset, dietScrollOffset } = useAppSelector((state) => state.ui);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const scheduleLayoutY = React.useRef<number>(0);
    const [avatarState, setAvatarState] = useState<AvatarState | null>(null);

    // Derived selectedTab from Redux
    const selectedTab = activeHomeTab;
    const setSelectedTab = (tab: 'profile' | 'work' | 'diet' | 'social') => dispatch(setActiveHomeTab(tab));

    const horizontalScrollRef = React.useRef<ScrollView>(null);
    const screenWidth = Dimensions.get('window').width;

    // Animated value for bottom bar visibility
    const bottomBarAnim = React.useRef(new Animated.Value(0)).current; // 0 = visible, 100 = hidden
    const lastScrollY = React.useRef(0);
    const isBottomBarHidden = React.useRef(false);

    const handleVerticalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const delta = currentScrollY - lastScrollY.current;

        // Threshold to avoid jitter
        if (Math.abs(delta) < 10) return;

        if (delta > 0 && currentScrollY > 50 && !isBottomBarHidden.current) {
            // Scrolling down - hide
            isBottomBarHidden.current = true;
            Animated.timing(bottomBarAnim, {
                toValue: 100,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else if (delta < 0 && isBottomBarHidden.current) {
            // Scrolling up - show
            isBottomBarHidden.current = false;
            Animated.timing(bottomBarAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }

        lastScrollY.current = currentScrollY;
    };

    useEffect(() => {
        let isMounted = true;

        const loadAvatarState = async () => {
            const state = await avatarService.getAvatarState();
            if (isMounted) {
                setAvatarState(state);
            }
        };

        loadAvatarState();
        dispatch(fetchWorkoutStats('week'));
        if (user?.uid) {
            dispatch(fetchWorkoutPlan(user.uid));
            dispatch(fetchCustomPlans(user.uid));
        }

        const today = new Date().getDay();
        // Mon=1 -> 0, Tue=2 -> 1, ..., Sat=6 -> 5, Sun=0 -> 6
        if (today === 0) {
            setSelectedDayIndex(6);
        } else {
            setSelectedDayIndex(today - 1);
        }

        return () => {
            isMounted = false;
        };
    }, [dispatch, user?.uid]);

    // Set initial scroll position based on persisted tab
    useEffect(() => {
        const tabs: ('profile' | 'work' | 'diet' | 'social')[] = ['profile', 'work', 'diet', 'social'];
        const index = tabs.indexOf(activeHomeTab);
        const timer = setTimeout(() => {
            horizontalScrollRef.current?.scrollTo({ x: index * screenWidth, animated: false });
        }, 100);
        return () => clearTimeout(timer);
    }, []); // Only run on mount, relies on persisted activeHomeTab

    // Restore Work Tab Scroll Position
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (selectedTab === 'work' && workScrollOffset > 0) {
            timer = setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: workScrollOffset, animated: false });
            }, 100);
        }
        return () => { if (timer) clearTimeout(timer); };
    }, [selectedTab]);

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / screenWidth);
        const tabs: ('profile' | 'work' | 'diet' | 'social')[] = ['profile', 'work', 'diet', 'social'];
        if (tabs[index] && tabs[index] !== selectedTab) {
            setSelectedTab(tabs[index]);
        }
    };

    const handleTabPress = (tab: 'profile' | 'work' | 'diet' | 'social') => {
        const tabs: ('profile' | 'work' | 'diet' | 'social')[] = ['profile', 'work', 'diet', 'social'];
        const index = tabs.indexOf(tab);
        horizontalScrollRef.current?.scrollTo({ x: index * screenWidth, animated: true });
        setSelectedTab(tab);
    };

    // Auto-Enforce 7-Day Active Split (AI Plans Only)
    // Only regenerate if the plan is older than 7 days to prevent expensive calls on every mount
    useEffect(() => {
        if (currentPlan && user && !planLoading) {
            // Skip auto-regeneration for custom plans - users control their own schedule
            if (currentPlan.planType === 'custom') {
                return;
            }

            // Check if plan was created more than 7 days ago before regenerating
            const planCreatedAt = currentPlan.createdAt;
            if (planCreatedAt) {
                const planDate = (planCreatedAt as any)?.toDate ? (planCreatedAt as any).toDate() : new Date(planCreatedAt as any);
                const daysSincePlanCreated = (Date.now() - planDate.getTime()) / (1000 * 60 * 60 * 24);
                // Only auto-regenerate if plan is more than 7 days old
                if (daysSincePlanCreated < 7) return;
            }

            const sessions = currentPlan.sessions ?? [];
            const uniqueDays = new Set(sessions.map(s => s.dayOfWeek));
            const hasRestOrRecovery = sessions.some(
                s => s.type === 'rest' ||
                    s.isRestDay === true ||
                    s.focus?.toLowerCase().includes('rest') ||
                    s.focus?.toLowerCase().includes('recovery')
            );

            const isIncomplete = uniqueDays.size < 7;

            if (hasRestOrRecovery || isIncomplete) {
                const forcedProfile = JSON.parse(JSON.stringify(user));
                if (!forcedProfile.fitnessProfile) {
                    forcedProfile.fitnessProfile = { availableDays: 7 };
                } else {
                    forcedProfile.fitnessProfile.availableDays = 7;
                }
                dispatch(regenerateUserPlan(forcedProfile));
            }
        }
    }, [currentPlan?.id, user?.uid, planLoading]);




    const handleStartExercise = (exercise: any) => {
        // Handle multiple possible ID property names
        const exerciseId = exercise.exerciseId || exercise.id || exercise.name?.toLowerCase().replace(/\s+/g, '-');

        navigation.navigate('ExerciseInstructions', {
            exerciseId: exerciseId,
            exerciseName: exercise.name || exercise.exerciseName,
            targetSets: exercise.sets,
            targetReps: exercise.reps,
            fromPlan: true
        });
    };

    const getRecoveryTips = () => {
        const tips = {
            good: [
                '✓ Sleep 8-9 hours tonight',
                '✓ Hydrate well (3-4L water)',
                '✓ Eat protein + carbs within 1 hr',
                '✓ Light stretching or mobility'
            ],
            moderate: [
                '⚠ Get adequate sleep (8+ hrs)',
                '⚠ Increase water intake (4L+)',
                '⚠ Active recovery: 15 min walk',
                '⚠ Foam rolling for sore muscles'
            ],
            poor: [
                '🔴 MANDATORY REST - No training',
                '🔴 Focus on sleep (9-10 hrs)',
                '🔴 Ice/heat therapy for sore areas',
                '🔴 Extra protein + carbs today'
            ]
        };
        return tips[recoveryStatus] || tips.good;
    };

    const isRestDay = todaysWorkout?.isRestDay || !todaysWorkout;

    const getNextWorkout = () => {
        const sessions = currentPlan?.sessions;
        if (!sessions || sessions.length === 0) return null;
        const today = new Date().getDay();
        // Look for the next workout day in the next 7 days
        for (let i = 1; i <= 7; i++) {
            const checkDay = (today + i) % 7;
            const session = sessions.find(s => s.dayOfWeek === checkDay && !s.isRestDay && s.type !== 'rest');
            if (session && (session.exercises?.length ?? 0) > 0) return session;
        }
        return null;
    };

    const nextWorkout = isRestDay ? getNextWorkout() : null;

    const handleRecoveryChange = (status: 'good' | 'moderate' | 'poor') => {
        dispatch(setRecoveryStatus(status));
    };

    return (
        <LinearGradient
            colors={gradients.background}
            style={styles.container}
        >
            {/* Swipeable Content Area */}
            <ScrollView
                ref={horizontalScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                style={styles.horizontalScroll}
                contentContainerStyle={{ width: screenWidth * 4 }}
                directionalLockEnabled={true}
            >
                {/* 1. Profile Tab (Left) */}
                <View style={{ width: screenWidth }}>
                    <AvatarScreen navigation={navigation} isTab={true} onScroll={handleVerticalScroll} />
                </View>

                {/* 2. Work Tab (Middle) */}
                <View style={{ width: screenWidth }}>
                    <ScrollView
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        onScroll={(e) => {
                            handleVerticalScroll(e);
                            // Debounce or just save on momentum end could be better for perf, but simple set for now
                        }}
                        onMomentumScrollEnd={(e) => {
                            dispatch(setWorkScrollOffset(e.nativeEvent.contentOffset.y));
                        }}
                        onScrollEndDrag={(e) => {
                            dispatch(setWorkScrollOffset(e.nativeEvent.contentOffset.y));
                        }}
                        scrollEventThrottle={16}
                        directionalLockEnabled={true}
                    >
                        <View style={styles.topSpacing} />
                        <WorkTab
                            user={user}
                            navigation={navigation}
                            avatarState={avatarState}
                            todaysWorkout={todaysWorkout}
                            isRestDay={todaysWorkout?.isRestDay || !todaysWorkout}
                            nextWorkout={getNextWorkout()}
                            recoveryStatus={recoveryStatus}
                            currentPlan={currentPlan}
                            selectedDayIndex={selectedDayIndex}
                            scrollViewRef={scrollViewRef}
                            scheduleLayoutY={scheduleLayoutY}
                            onStartExercise={handleStartExercise}
                            onRecoveryChange={handleRecoveryChange}
                            onDaySelect={setSelectedDayIndex}
                            getRecoveryTips={getRecoveryTips}
                            styles={styles}
                        />
                    </ScrollView>
                </View>

                {/* 3. Diet Tab (Right) */}
                <View style={{ width: screenWidth, flex: 1 }}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.dietScrollContent}
                        onScroll={(e) => {
                            handleVerticalScroll(e);
                        }}
                        onMomentumScrollEnd={(e) => {
                            dispatch(setDietScrollOffset(e.nativeEvent.contentOffset.y));
                        }}
                        onScrollEndDrag={(e) => {
                            dispatch(setDietScrollOffset(e.nativeEvent.contentOffset.y));
                        }}
                        // Initial scroll is tricky for non-ref'd views or conditional rendering
                        // For DietTab specifically, we might need a ref if we want to restore its position too
                        // For now adding listener
                        scrollEventThrottle={16}
                        directionalLockEnabled={true}
                    >
                        <View style={styles.topSpacing} />
                        <PremiumGate
                            featureName="Smart Diet"
                            navigation={navigation}
                            description="Personalized meal plans and macro tracking to fuel your fitness journey."
                            backgroundImage={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000&auto=format&fit=crop' }}
                        >
                            <DietTab user={user} />
                        </PremiumGate>
                    </ScrollView>
                </View>

                {/* 4. Social Tab (Rightmost) */}
                <View style={{ width: screenWidth, flex: 1 }}>
                    <CommunityFeed navigation={navigation} />
                </View>
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <Animated.View style={[
                styles.bottomNavBarContainer,
                { transform: [{ translateY: bottomBarAnim }] }
            ]}>
                <BlurView intensity={isDark ? 70 : 80} tint={isDark ? "dark" : "light"} style={styles.bottomNavBar}>
                    {/* Profile Tab */}
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => handleTabPress('profile')}
                        activeOpacity={0.6}
                    >
                        <MaterialCommunityIcons
                            name={selectedTab === 'profile' ? "account" : "account-outline"}
                            size={26}
                            color={selectedTab === 'profile' ? '#C4FF1A' : colors.textTertiary}
                        />
                        <Text style={[styles.navText, selectedTab === 'profile' && styles.navTextActive]}>PROFILE</Text>
                        {selectedTab === 'profile' && <View style={styles.navActiveDot} />}
                    </TouchableOpacity>

                    {/* Workout Tab */}
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => handleTabPress('work')}
                        activeOpacity={0.6}
                    >
                        <MaterialCommunityIcons
                            name="dumbbell"
                            size={26}
                            color={selectedTab === 'work' ? '#C4FF1A' : colors.textTertiary}
                        />
                        <Text style={[styles.navText, selectedTab === 'work' && styles.navTextActive]}>WORKOUT</Text>
                        {selectedTab === 'work' && <View style={styles.navActiveDot} />}
                    </TouchableOpacity>

                    {/* Diet Tab */}
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => handleTabPress('diet')}
                        activeOpacity={0.6}
                    >
                        <MaterialCommunityIcons
                            name={selectedTab === 'diet' ? "heart-plus" : "heart-plus-outline"}
                            size={26}
                            color={selectedTab === 'diet' ? '#C4FF1A' : colors.textTertiary}
                        />
                        <Text style={[styles.navText, selectedTab === 'diet' && styles.navTextActive]}>DIET</Text>
                        {selectedTab === 'diet' && <View style={styles.navActiveDot} />}
                    </TouchableOpacity>
                    
                    {/* Social Tab */}
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => handleTabPress('social')}
                        activeOpacity={0.6}
                    >
                        <MaterialCommunityIcons
                            name={selectedTab === 'social' ? "account-group" : "account-group-outline"}
                            size={26}
                            color={selectedTab === 'social' ? '#C4FF1A' : colors.textTertiary}
                        />
                        <Text style={[styles.navText, selectedTab === 'social' && styles.navTextActive]}>SOCIAL</Text>
                        {selectedTab === 'social' && <View style={styles.navActiveDot} />}
                    </TouchableOpacity>
                </BlurView>
            </Animated.View>

        </LinearGradient >
    );
}

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.m,
        paddingTop: 10,
        paddingBottom: 100,
    },
    dietScrollContent: {
        paddingHorizontal: Spacing.s,
        paddingTop: 10,
        paddingBottom: 100,
        flexGrow: 1,
    },
    topSpacing: {
        height: 50,
    },
    horizontalScroll: {
        flex: 1,
    },

    // Instagram-Style Bottom Navigation
    bottomNavBarContainer: {
        position: 'absolute' as 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    bottomNavBar: {
        flexDirection: 'row' as 'row',
        backgroundColor: isDark ? 'rgba(10,12,20,0.95)' : 'rgba(255,255,255,0.95)',
        paddingBottom: 14,
        paddingTop: 12,
        borderTopWidth: 0.5,
        borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)',
        justifyContent: 'space-around' as 'space-around',
        alignItems: 'center' as 'center',
    },
    navItem: {
        alignItems: 'center' as 'center',
        justifyContent: 'center' as 'center',
        paddingVertical: 2,
        minWidth: 70,
    },
    navText: {
        fontSize: 11,
        fontWeight: '700' as '700',
        color: colors.textTertiary,
        marginTop: 4,
        letterSpacing: 0.6,
    },
    navTextActive: {
        color: '#C4FF1A',
    },
    navActiveDot: {
        marginTop: 4,
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#C4FF1A',
    },

    greeting: {
        fontSize: 12,
        fontWeight: '800' as '800',
        color: colors.textSecondary,
        letterSpacing: 2,
        marginBottom: Spacing.m,
        opacity: 0.8,
    },

    header: {
        marginBottom: Spacing.l,
    },
    section: {
        marginBottom: Spacing.l,
    },

    // Workout Card
    todayWorkoutCard: {
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        overflow: 'hidden',
        marginBottom: Spacing.l,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
        ...shadows.card,
    },
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.m,
    },
    workoutTitle: {
        fontSize: 10,
        color: colors.accentPink,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    restDayBadge: {
        backgroundColor: colors.accentPink + '26',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: Layout.borderRadius.round,
        alignSelf: 'flex-start',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.accentPink + '4D',
    },
    workoutFocus: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    viewLibraryLink: {
        backgroundColor: colors.glassSurface,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: Layout.borderRadius.round,
    },
    viewLibraryText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    workoutDuration: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    workoutMetaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressBadge: {
        backgroundColor: colors.accentSuccess + '26',
        paddingHorizontal: Spacing.m,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius.round,
        borderWidth: 1,
        borderColor: colors.accentSuccess + '4D',
    },
    progressText: {
        fontSize: 12,
        color: colors.accentSuccess,
        fontWeight: '700',
    },

    // Exercise List
    exercisesList: {
        gap: Spacing.m,
        marginBottom: Spacing.l,
    },
    exerciseCard: {
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
        ...shadows.small,
    },
    exerciseCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    exerciseInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.m,
    },
    exerciseNumberBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.glassSurface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    exerciseNumber: {
        color: colors.textSecondary,
        fontWeight: '700',
        fontSize: 14,
    },
    exerciseCardName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    exerciseCardTarget: {
        fontSize: 13,
        color: colors.accentCyan,
        fontWeight: '600',
    },
    completedBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.accentSuccess,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.glow,
        shadowColor: colors.accentSuccess,
    },
    completedIcon: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    startExerciseButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: Layout.borderRadius.s,
        backgroundColor: colors.glassSurface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    startExerciseButtonCompleted: {
        backgroundColor: colors.accentSuccess + '1A',
        borderColor: colors.accentSuccess,
    },
    startExerciseButtonText: {
        color: colors.textPrimary,
        fontWeight: '600',
        fontSize: 14,
    },
    emptyExercisesCard: {
        padding: Spacing.l,
        borderRadius: Layout.borderRadius.m,
        alignItems: 'center',
        backgroundColor: colors.glassSurface,
        ...shadows.card,
    },
    emptyExercisesText: {
        color: colors.textSecondary,
        textAlign: 'center',
    },

    // Next Workout Preview
    nextWorkoutContainer: {
        marginTop: Spacing.l,
    },
    nextWorkoutLabel: {
        fontSize: 14,
        color: colors.textTertiary,
        marginBottom: Spacing.s,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    nextWorkoutCard: {
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.m,
        backgroundColor: colors.glassSurface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        overflow: 'hidden',
        ...shadows.card,
    },
    nextWorkoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.s,
    },
    nextWorkoutTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    nextWorkoutDay: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    nextExercisesPreview: {
        marginBottom: Spacing.m,
    },
    nextExerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    nextExerciseBullet: {
        color: colors.accentCyan,
        marginRight: 8,
        fontSize: 16,
    },
    nextExerciseName: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    moreExercisesText: {
        color: colors.textTertiary,
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 4,
    },
    viewPlanButton: {
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    viewPlanButtonText: {
        color: colors.accentCyan,
        fontWeight: '600',
        fontSize: 13,
    },

    // Start Button (Main)
    startButtonContainer: {
        marginBottom: Spacing.l,
        ...shadows.glow,
        shadowColor: colors.primaryStart,
    },
    startButton: {
        borderRadius: Layout.borderRadius.l,
        padding: Spacing.l,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    startButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.m,
    },
    startButtonIcon: {
        fontSize: 32,
    },
    startButtonText: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.textPrimary,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    startButtonSubtext: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
        letterSpacing: 1,
    },

    // Section Titles
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: Spacing.m,
        paddingLeft: Spacing.xs,
        borderLeftWidth: 3,
        borderLeftColor: colors.accentCyan,
    },

    // Recovery Grid
    recoveryGrid: {
        flexDirection: 'row',
        gap: Spacing.s,
    },
    recoveryButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: Layout.borderRadius.m,
        backgroundColor: colors.glassSurface,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    recoveryButtonGood: {
        backgroundColor: colors.accentSuccess + '1A',
        borderColor: colors.accentSuccess,
    },
    recoveryButtonModerate: {
        backgroundColor: colors.accentYellow + '1A',
        borderColor: colors.accentYellow,
    },
    recoveryButtonPoor: {
        backgroundColor: colors.accentError + '1A',
        borderColor: colors.accentError,
    },
    recoveryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    recoveryButtonTextActive: {
        color: colors.textPrimary,
        fontWeight: '800',
    },

    // Details Card
    detailsCard: {
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.m,
        backgroundColor: colors.glassSurface,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...shadows.card,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
        width: '100%',
    },
    detailsTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.s,
        flex: 1,
        marginRight: Spacing.s,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        flex: 1,
    },
    detailsDurationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.glassSurface,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: Layout.borderRadius.round,
    },
    detailsDurationText: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    detailsNotes: {
        backgroundColor: colors.glassSurface,
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.s,
        marginBottom: Spacing.m,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    detailsNotesText: {
        color: colors.textSecondary,
        fontStyle: 'italic',
        fontSize: 14,
        lineHeight: 20,
    },
    restDayDetailContainer: {
        width: '100%',
    },
    exercisesTitle: {
        fontSize: 14,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.s,
        fontWeight: '600',
    },
    detailsExercises: {
        width: '100%',
        gap: 8,
    },
    detailExerciseItem: {
        flexDirection: 'row',
        gap: Spacing.s,
        paddingVertical: 8,
    },
    detailExerciseNumber: {
        color: colors.accentCyan,
        fontWeight: 'bold',
        width: 24,
    },
    detailExerciseText: {
        color: colors.textPrimary,
        fontSize: 14,
        flex: 1,
    },

    // Tips Card
    tipsCard: {
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.m,
        overflow: 'hidden',
        backgroundColor: colors.glassSurface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...shadows.card,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: Spacing.m,
    },
    tipsList: {
        gap: 8,
    },
    tipItem: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    tipText: {
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },

    // Rest Day Details
    restDayMessage: {
        color: colors.textSecondary,
        fontSize: 16,
        lineHeight: 24,
        marginBottom: Spacing.m,
    },

    // Actions
    actionsContainer: {
        marginBottom: Spacing.l,
    },
    historyButton: {
        borderRadius: Layout.borderRadius.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...shadows.card,
    },
    historyButtonGradient: {
        padding: Spacing.m,
    },
    historyContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.accentCyan + '26',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.m,
        borderWidth: 1,
        borderColor: colors.accentCyan + '4D',
    },
    historyTextContainer: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    historySubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },

    // Logout
    logoutButton: {
        alignItems: 'center',
        paddingVertical: Spacing.m,
    },
    logoutText: {
        color: colors.textTertiary,
        fontSize: 14,
        fontWeight: '600',
    },

    // Training Split
    splitList: {
        gap: 8,
    },
    splitItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
    },
    splitDay: {
        color: colors.accentCyan,
        fontWeight: '600',
        width: 80,
    },
    splitFocus: {
        color: colors.textSecondary,
        flex: 1,
    },
    splitItemRest: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
        opacity: 0.7,
    },
    splitDayRest: {
        color: colors.accentPink,
        fontWeight: '600',
        width: 80,
    },
    splitFocusRest: {
        color: colors.textTertiary,
        flex: 1,
        fontStyle: 'italic',
    },

});
