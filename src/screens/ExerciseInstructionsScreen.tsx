import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, Animated, ActivityIndicator } from 'react-native';

import { getExerciseImage } from '../config/imageMap';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Spacing, Shadows, Layout, ThemeColorsType } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';
import { PremiumGate } from '../components/PremiumGate';
import { GlassView } from '../components/GlassView';
import { getExerciseById } from '../models/exercises';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { saveWorkout } from '../store/slices/workoutSlice';
import { updateExerciseCompletion } from '../store/slices/workoutPlanSlice';
import { avatarService } from '../services/AvatarService';
import { useToast } from '../context/ToastContext';

interface ExerciseInstructionsScreenProps {
    navigation: any;
}

const { width, height } = Dimensions.get('window');

export default function ExerciseInstructionsScreen({ navigation }: ExerciseInstructionsScreenProps) {
    const { colors, gradients, isDark } = useTheme();
    const { showToast } = useToast();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const dispatch = useAppDispatch();
    const { currentPlan } = useAppSelector((state) => state.workoutPlan);
    const params = navigation.params || {};
    const exerciseId = params.exerciseId || 'push-ups';
    const exercise = getExerciseById(exerciseId);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [completionStats, setCompletionStats] = useState({ totalReps: 0, calories: 0 });
    const [isLoading, setIsLoading] = useState(false);

    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    if (!exercise) {
        return (
            <LinearGradient colors={gradients.background} style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>Exercise data not found.</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    const handleStart = () => {
        navigation.navigate('Camera', {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            targetSets: params.targetSets,
            targetReps: params.targetReps,
            fromPlan: params.fromPlan
        });
    };

    const handleSkipDetection = async () => {
        setIsLoading(true);

        const isTimerBased = exercise.trackingMode === 'timer_only';
        const targetSets = params.targetSets || 3;

        let totalReps: number;
        let estimatedDuration: number;
        let caloriesBurned: number;

        if (isTimerBased) {
            // For timer-based exercises, targetReps holds the hold-time in seconds (e.g. 30, 60)
            // Treat 0 reps and log duration correctly from the planned time.
            const holdSeconds =
                typeof params.targetReps === 'number'
                    ? params.targetReps
                    : typeof params.targetReps === 'string'
                        ? parseInt(params.targetReps) || 30
                        : 30;

            totalReps = 0; // Timed exercises don't have reps
            // Duration = hold time × sets + rest between sets (20s each)
            estimatedDuration = holdSeconds * targetSets + (targetSets - 1) * 20;
            // Calories: use MET ≈ 4 for low-intensity isometric holds
            caloriesBurned = Math.round(4 * 70 * (estimatedDuration / 3600));
        } else {
            // Rep-based exercise: parse "10-15" → take lower bound
            let targetReps = 10;
            if (typeof params.targetReps === 'number') {
                targetReps = params.targetReps;
            } else if (typeof params.targetReps === 'string') {
                targetReps = parseInt(params.targetReps.split('-')[0]) || 10;
            }

            totalReps = targetReps * targetSets;
            // Estimate ~3s per rep + 30s rest per set
            estimatedDuration = totalReps * 3 + (targetSets - 1) * 30;
            // Calories: simple rep × time estimate
            caloriesBurned = Math.round(totalReps * 0.5 + estimatedDuration * 0.1);
        }

        try {
            // Save to Redux/Firestore
            await dispatch(saveWorkout({
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                duration: estimatedDuration,
                reps: totalReps,
                averageFormScore: 80, // Penalised slightly for skipping
                caloriesBurned,
            })).unwrap();

            // Update Avatar
            await avatarService.updateAfterWorkout({
                exerciseId: exerciseId,
                reps: totalReps,
                duration: estimatedDuration,
                formScore: 80,
                isSkipped: true
            });

            // Mark exercise as completed in workout plan
            if (currentPlan && params.fromPlan) {
                const today = new Date().getDay();
                await dispatch(updateExerciseCompletion({
                    planId: currentPlan.id,
                    dayOfWeek: today,
                    exerciseId: exercise.id,
                    completed: true,
                    lastCompletedAt: new Date()
                })).unwrap();
            }

            setCompletionStats({ totalReps, calories: caloriesBurned });
            setShowSuccessModal(true);

        } catch (error) {
            console.error('Failed to log skipped workout:', error);
            showToast('Failed to save workout progress.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {/* Back Button */}
                    <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.headerBackButton}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color={colors.textPrimary} />
                    </TouchableOpacity>

                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <MaterialCommunityIcons
                            name="dumbbell"
                            size={80}
                            color={colors.primaryStart}
                            style={styles.heroIcon}
                        />
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{exercise.category.toUpperCase()}</Text>
                        </View>

                        {/* Tracking Mode Badge */}
                        <View style={[
                            styles.trackingModeBadge,
                            exercise.trackingMode === 'ai_reps' && styles.trackingModeAI,
                            exercise.trackingMode === 'ai_timer' && styles.trackingModeAITimer,
                            exercise.trackingMode === 'timer_only' && styles.trackingModeTimer
                        ]}>
                            <MaterialCommunityIcons
                                name={
                                    exercise.trackingMode === 'timer_only' ? 'timer-outline' :
                                        exercise.trackingMode === 'ai_timer' ? 'timer-check-outline' :
                                            'camera-enhance-outline'
                                }
                                size={16}
                                color={
                                    exercise.trackingMode === 'timer_only' ? colors.accentWarning :
                                        colors.accentCyan
                                }
                            />
                            <Text style={[
                                styles.trackingModeText,
                                exercise.trackingMode === 'timer_only' && styles.trackingModeTextTimer
                            ]}>
                                {exercise.trackingMode === 'ai_reps' && 'AI Rep Counting'}
                                {exercise.trackingMode === 'ai_timer' && 'AI Form Check + Timer'}
                                {exercise.trackingMode === 'timer_only' && 'Timer Based'}
                            </Text>
                        </View>
                    </View>

                    {/* Form Reference Image */}
                    {getExerciseImage(exerciseId) && (
                        <GlassView style={styles.referenceImageCard}>
                            <View style={styles.referenceImageHeader}>
                                <MaterialCommunityIcons name="image-outline" size={24} color={colors.accentCyan} />
                                <Text style={styles.cardTitle}>Form Reference</Text>
                            </View>
                            <View style={styles.imageContainer}>
                                <Image
                                    source={getExerciseImage(exerciseId)}
                                    style={styles.referenceImage}
                                    resizeMode="contain"
                                />
                                {/* Logo Watermark */}
                                <Image
                                    source={getExerciseImage('app-logo')}
                                    style={styles.logoWatermark}
                                    resizeMode="contain"
                                />
                            </View>
                        </GlassView>
                    )}

                    {/* Description */}
                    <GlassView style={styles.card}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="information-outline" size={24} color={colors.accentCyan} />
                            <Text style={styles.cardTitle}>About Exercise</Text>
                        </View>
                        <Text style={styles.descriptionText}>{exercise.description || "Perfect your form with AI-powered correction."}</Text>
                    </GlassView>

                    {/* Steps */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Execution Steps</Text>
                        <View style={styles.stepsTextContainer}>
                            {(exercise.instructions || exercise.steps)?.map((step: string, index: number) => (
                                <View key={index} style={styles.bulletPointRow}>
                                    <Text style={styles.bulletPoint}>•</Text>
                                    <Text style={styles.stepTextSimple}>{step}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Tips */}
                    {exercise.tips && exercise.tips.length > 0 && (
                        <View style={styles.section}>
                            <GlassView tint={isDark ? "light" : "dark"} style={styles.tipsCard}>
                                <View style={styles.cardHeader}>
                                    <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={colors.accentYellow} />
                                    <Text style={styles.cardTitle}>Pro Tips</Text>
                                </View>
                                <View style={styles.tipsList}>
                                    {exercise.tips.map((tip, index) => (
                                        <View key={index} style={styles.tipRow}>
                                            <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.accentSuccess} style={{ marginTop: 2 }} />
                                            <Text style={styles.tipText}>{tip}</Text>
                                        </View>
                                    ))}
                                </View>
                            </GlassView>
                        </View>
                    )}

                    <View style={{ height: 160 }} />
                </Animated.View>
            </ScrollView>

            {/* Footer with Actions */}
            <View style={styles.footer}>
                {exercise.trackingMode === 'ai_reps' || exercise.trackingMode === 'ai_timer' ? (
                    <PremiumGate
                        featureName="AI Form Tracking"
                        navigation={navigation}
                        variant="compact"
                    >
                        <TouchableOpacity
                            onPress={handleStart}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={gradients.primary}
                                style={styles.startButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <MaterialCommunityIcons
                                    name="play-circle-outline"
                                    size={28}
                                    color="white"
                                />
                                <Text style={styles.startButtonText}>Start Exercise</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </PremiumGate>
                ) : (
                    <TouchableOpacity
                        onPress={handleStart}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={gradients.primary}
                            style={styles.startButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons
                                name="timer-play-outline"
                                size={28}
                                color="white"
                            />
                            <Text style={styles.startButtonText}>Start Timer</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}


                {/* Skip button for all exercises */}
                <TouchableOpacity
                    onPress={handleSkipDetection}
                    activeOpacity={0.8}
                    style={styles.skipButtonContainer}
                    disabled={isLoading}
                >
                    <LinearGradient
                        colors={isDark ? ['#FFFFFF', '#F5F5F7'] : [colors.backgroundDark, colors.backgroundDarker]}
                        style={styles.skipButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {isLoading ? (
                                <ActivityIndicator color={colors.primaryStart} size="small" />
                            ) : (
                                <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primaryStart} />
                            )}
                            <Text style={[styles.skipButtonText, !isDark && { color: colors.textPrimary }]}>
                                {isLoading ? 'Processing...' : (exercise.trackingMode === 'timer_only' ? 'Mark Complete' : 'Skip Live Detection')}
                            </Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Success Modal */}
            {showSuccessModal && (
                <BlurView intensity={80} tint={isDark ? "light" : "dark"} style={styles.modalOverlay}>
                    <View style={styles.successModal}>
                        <View style={styles.successIconContainer}>
                            <Text style={styles.successIcon}>💪</Text>
                        </View>
                        <Text style={styles.successTitle}>Workout Logged!</Text>
                        <Text style={styles.successMessage}>
                            Marked {completionStats.totalReps} reps of {exercise.name} as complete.
                        </Text>
                        <Text style={styles.successStats}>
                            🔥 Earned {completionStats.calories} cal!
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.navigate('Home');
                            }}
                            style={{ width: '100%', marginTop: 24 }}
                        >
                            <LinearGradient
                                colors={gradients.primary}
                                style={styles.successButton}
                            >
                                <Text style={styles.successButtonText}>Great!</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            )}
        </LinearGradient>
    );
}

function getIconForExercise(id: string): any {
    // Temporarily using dumbbell for all exercises
    return 'dumbbell';
}

const createStyles = (colors: ThemeColorsType) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.l,
        paddingTop: 50,
    },
    headerBackButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.glassSurface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        marginTop: Spacing.m,
    },
    heroIcon: {
        marginBottom: Spacing.m,
        ...Shadows.glow,
        shadowColor: colors.primaryStart,
    },
    exerciseName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.s,
    },
    categoryBadge: {
        backgroundColor: colors.accentCyan + '33', // 20% opacity
        paddingHorizontal: Spacing.m,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius.round,
        borderWidth: 1,
        borderColor: colors.accentCyan,
    },
    categoryText: {
        color: colors.accentCyan,
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Tracking Mode Badge
    trackingModeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.m,
        paddingVertical: 6,
        borderRadius: Layout.borderRadius.m,
        marginTop: Spacing.s,
        borderWidth: 1,
    },
    trackingModeAI: {
        backgroundColor: colors.accentCyan + '22',
        borderColor: colors.accentCyan,
    },
    trackingModeAITimer: {
        backgroundColor: colors.accentCyan + '22',
        borderColor: colors.accentCyan,
    },
    trackingModeTimer: {
        backgroundColor: colors.accentWarning + '22',
        borderColor: colors.accentWarning,
    },
    trackingModeText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.accentCyan,
    },
    trackingModeTextTimer: {
        color: colors.accentWarning,
    },
    card: {
        padding: Spacing.l,
        marginBottom: Spacing.xl,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.m,
        gap: Spacing.s,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    descriptionText: {
        fontSize: 16,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: Spacing.m,
    },
    stepsTextContainer: {
        gap: Spacing.s,
    },
    bulletPointRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.s,
    },
    bulletPoint: {
        color: colors.primaryStart,
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: Spacing.m,
        lineHeight: 22,
    },
    stepTextSimple: {
        flex: 1,
        fontSize: 16,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    stepCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        marginBottom: Spacing.m,
    },
    stepNumberContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primaryStart,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.m,
    },
    stepNumber: {
        color: colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    stepText: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
        lineHeight: 22,
    },
    tipsCard: {
        padding: Spacing.l,
    },
    tipsList: {
        gap: Spacing.m,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.s,
    },
    tipText: {
        fontSize: 15,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 22,
    },

    // Reference Image Card
    referenceImageCard: {
        padding: Spacing.l,
        marginBottom: Spacing.xl,
        alignItems: 'center',
    },
    referenceImageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.s,
        gap: Spacing.s,
        alignSelf: 'flex-start',
    },
    referenceImage: {
        width: '100%',
        height: 300,
        borderRadius: Layout.borderRadius.m,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
    },
    logoWatermark: {
        position: 'absolute',
        bottom: 34,
        right: 1,
        width: 20,
        height: 20,
        borderRadius: 8,
        opacity: 0.9,
        ...Shadows.small,
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.l,
        paddingBottom: 40,
        backgroundColor: 'transparent',
    },
    startButton: {
        height: 64,
        borderRadius: Layout.borderRadius.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.m,
        ...Shadows.glow,
        shadowColor: colors.primaryStart,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: colors.textPrimary,
        fontSize: 18,
        marginBottom: Spacing.m,
    },
    backButton: {
        padding: Spacing.m,
        backgroundColor: colors.primaryStart,
        borderRadius: Layout.borderRadius.m,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    // Skip Button Styles
    skipButtonContainer: {
        marginTop: Spacing.m,
        borderRadius: Layout.borderRadius.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...Shadows.small,
    },
    skipButtonGradient: {
        paddingVertical: Spacing.m,
        paddingHorizontal: Spacing.l,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipButtonText: {
        color: colors.primaryStart,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    // Success Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successModal: {
        backgroundColor: colors.backgroundLight,
        borderRadius: 24,
        padding: 32,
        width: '90%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        alignItems: 'center',
        ...Shadows.card,
    },
    successIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryStart + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successIcon: {
        fontSize: 48,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    successStats: {
        fontSize: 18,
        color: colors.primaryStart,
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '700',
    },
    successButton: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        ...Shadows.small,
    },
    successButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
