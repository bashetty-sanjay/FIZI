import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    useWindowDimensions,
    Alert
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { ScreenType } from '../../App';
import PoseOverlay from '../components/PoseOverlay';
import FormFeedbackOverlay from '../components/FormFeedbackOverlay';
import ExerciseSelector from '../components/ExerciseSelector';
import CountdownOverlay from '../components/CountdownOverlay';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useKeepAwake } from 'expo-keep-awake';
import { Spacing, Shadows, Layout, ThemeColorsType, ThemeShadowsType } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';
import { ExerciseTimer } from '../components/ExerciseTimer';

import AppConfig from '../config/appConfig';
import { Pose, FormValidation } from '../types';
import { getExerciseById } from '../models/exercises';
import { workoutAnalysisService } from '../services/WorkoutAnalysisService';
import { feedbackService } from '../services/FeedbackService';
import { avatarService } from '../services/AvatarService';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { saveWorkout } from '../store/slices/workoutSlice';
import { updateExerciseCompletion } from '../store/slices/workoutPlanSlice';
import { useSmartCamera } from '../hooks/useSmartCamera';


import { CameraScreenParams } from '../../App';

interface CameraScreenProps {
    navigation: {
        navigate: (screen: ScreenType, params?: any) => void;
        params?: CameraScreenParams;
    };
}

// Available exercises for selection
const AVAILABLE_EXERCISES = [
    'push-ups', 'squats', 'plank', 'bicep-curls',
    'lunges', 'jumping-jacks', 'shoulder-press',
    'dumbbell-rows', 'mountain-climbers', 'burpees'
] as const;
type ExerciseId = typeof AVAILABLE_EXERCISES[number];

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundDark,
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },

    // Permission Screen
    permissionContainer: {
        flex: 1,
        backgroundColor: colors.backgroundDark,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: Spacing.m,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 24,
    },
    permissionButton: {
        backgroundColor: colors.primaryStart,
        paddingVertical: Spacing.m,
        paddingHorizontal: Spacing.xl,
        borderRadius: Layout.borderRadius.l,
        marginBottom: Spacing.m,
        ...shadows.glow,
    },
    permissionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        padding: Spacing.m,
    },
    backButtonText: {
        color: colors.primaryStart,
        fontSize: 16,
    },

    // HUD
    hud: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        borderRadius: Layout.borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'transparent',
        ...shadows.glow,
    },
    hudBlur: {
        padding: Spacing.l,
        backgroundColor: 'rgba(10, 10, 15, 0.4)', // Darker, rich glass
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    hudLeftSection: {
        flex: 1,
    },
    hudExercise: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    hudTimer: {
        color: colors.primaryStart,
        fontSize: 16,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    hudRightSection: {
        alignItems: 'flex-end',
    },
    hudReps: {
        color: '#FFFFFF',
        fontSize: 42,
        fontWeight: '900',
        includeFontPadding: false,
        textShadowColor: colors.primaryStart + '60',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 15,
    },
    hudTarget: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    hudSetProgress: {
        color: colors.primaryStart,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },

    // Status Banners
    statusBanner: {
        position: 'absolute',
        top: 60,
        right: 100, // Adjusted to not overlap exercise selector
        backgroundColor: colors.accentWarning,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: Layout.borderRadius.m,
        borderWidth: 1,
        borderColor: colors.accentWarningBorder,
        ...shadows.small,
    },
    statusText: {
        color: '#000000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    mockBanner: {
        position: 'absolute',
        top: 150, // Moved up slightly
        right: 20,
        backgroundColor: colors.accentPurple,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: Layout.borderRadius.m,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...shadows.small,
    },
    mockText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },

    // Control Bar
    controlBar: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        gap: 20,
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        ...shadows.small,
    },
    controlIcon: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    mainButton: {
        width: 180,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primaryStart,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.glow,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    stopButton: {
        backgroundColor: colors.accentError,
        shadowColor: colors.accentError,
        width: 140, // Shrink slightly when it's a stop button
    },
    mainButtonIcon: {
        fontSize: 20,
        color: '#FFFFFF',
        marginRight: 8,
    },
    stopIconAdjustment: {
        marginRight: 8,
    },
    mainButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },

    // Exercise Selection
    exerciseSelectContainer: {
        position: 'absolute',
        bottom: 120, // Sit right above the new control bar
        alignSelf: 'center', // Center it horizontally
    },
    exerciseSelectButton: {
        borderRadius: Layout.borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        ...shadows.glow,
    },
    exerciseSelectBlur: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(10, 10, 15, 0.5)',
        alignItems: 'center', // Center the text within the pill
        flexDirection: 'row',
        gap: 8,
    },
    exerciseSelectLabel: {
        display: 'none', // Hide the old "Selected Exercise" label
    },
    exerciseSelectName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    exerciseSelectHint: {
        color: colors.primaryStart,
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Timer-Only Mode Styles
    timerHeader: {
        padding: Spacing.xl,
        paddingTop: 60,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.glassSurface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    timerHeaderContent: {
        alignItems: 'center',
    },
    timerExerciseName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    timerModeLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    timerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Processing Overlay
    processingOverlay: {
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingContent: {
        alignItems: 'center',
        backgroundColor: 'rgba(20, 20, 25, 0.8)',
        padding: 40,
        borderRadius: Layout.borderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        ...shadows.glow,
    },
    processingIcon: {
        fontSize: 50,
        marginBottom: Spacing.l,
    },
    processingTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: Spacing.s,
    },
    processingSubtitle: {
        color: colors.primaryStart,
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.8,
    },
});

export default function CameraScreen({ navigation }: CameraScreenProps) {
    const { colors, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    useKeepAwake(); // Keep screen awake while this screen is active
    const dispatch = useAppDispatch();
    const currentPlan = useAppSelector(state => state.workoutPlan.currentPlan);

    // Camera state
    const [facing, setFacing] = useState<CameraType>('front');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    // Pose detection state
    // const [poses, setPoses] = useState<Pose[]>([]); // Replaced by hook
    const [mockPoses, setMockPoses] = useState<Pose[]>([]);
    const mockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // const [isPoseModelReady, setIsPoseModelReady] = useState(false); // Replaced by hook
    const [poseError, setPoseError] = useState<string | null>(null);

    // UI state
    const [showOverlay, setShowOverlay] = useState(false);
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [showCountdown, setShowCountdown] = useState(false);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [isProcessingToggle, setIsProcessingToggle] = useState(false);

    // Workout state
    const [exerciseId, setExerciseId] = useState<ExerciseId>((navigation.params?.exerciseId as ExerciseId) || 'push-ups');

    // Update exercise when params change
    useEffect(() => {
        if (navigation.params?.exerciseId) {
            setExerciseId(navigation.params.exerciseId as ExerciseId);
            workoutAnalysisService.reset(navigation.params.exerciseId);
        }
    }, [navigation.params?.exerciseId]);

    // Get current exercise to check tracking mode - MUST be after all useState calls
    const currentExercise = useMemo(() => getExerciseById(exerciseId), [exerciseId]);
    const trackingMode = currentExercise?.trackingMode || 'ai_reps';
    const [repCount, setRepCount] = useState(0);
    const [currentStage, setCurrentStage] = useState('');
    const [formScore, setFormScore] = useState(100);
    const [formValidation, setFormValidation] = useState<FormValidation>({
        isValid: true,
        score: 100,
        errors: []
    });

    // Timer state
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // Stores exact start time so elapsed is always a real-wall-clock delta.
    // setInterval can drift/pause when the app is backgrounded, so we never
    // rely on incrementing a counter — instead we diff against this ref.
    const workoutStartTimeRef = useRef<number | null>(null);

    // Workout mode state (plan mode vs free mode)
    const planMode = navigation.params?.fromPlan || false;
    const targetSetsParam = navigation.params?.targetSets || 3;
    const targetRepsParam = navigation.params?.targetReps || '10-12';
    const [currentSet, setCurrentSet] = useState(1);
    const [totalSets] = useState(targetSetsParam);
    const [showSetComplete, setShowSetComplete] = useState(false);

    // Stats tracking
    const [totalFormScore, setTotalFormScore] = useState(0);
    const [formScoreCount, setFormScoreCount] = useState(0);
    const prevRepCount = useRef(0);

    const { width, height } = useWindowDimensions();

    // Initialize pose detection logic removed (handled by hook)

    /**
     * Generate mock pose data for UI testing
     */
    /**
     * Generate mock pose data for UI testing
     * animate: 0 (down) to 1 (up)
     */
    const generateMockPose = useCallback((animationValue: number = 0): Pose => {
        const cx = width / 2;
        const cy = height / 2;

        const kp = (x: number, y: number, name: string = '') => ({
            x, y, score: 0.9, name
        });

        // Interpolate between down (bent elbows) and up (straight arms)
        // Pushup: Down = elbows bent ~90deg, Up = elbows straight ~180deg

        // Elbow Y position (relative to shoulder)
        // Shoulder at cy - 20
        // Down: Elbow at cy + 30 (checking original code) -> Angle ~90
        // Up: Elbow at cy - 20 (aligned with shoulder) -> Angle ~180 (actually straight arm)

        // Let's make it simple:
        // Shoulder: (cx +/- 50, cy - 100)
        // Elbow: 
        //   Down: (cx +/- 80, cy) -> ~90 deg bend
        //   Up: (cx +/- 60, cy - 50) -> extended
        // Wrist:
        //   Down: (cx +/- 50, cy + 50)
        //   Up: (cx +/- 50, cy + 50) (hands fixed)

        const shoulderY = cy - 100;
        const wristY = cy + 50;

        // Elbow interpolation
        // Down state (0)
        const elbowX_down = 90;
        const elbowY_down = cy;

        // Up state (1)
        const elbowX_up = 60; // Closer to body
        const elbowY_up = cy - 40; // Higher up

        const t = animationValue;
        const elbowX = elbowX_down * (1 - t) + elbowX_up * t;
        const elbowY = elbowY_down * (1 - t) + elbowY_up * t;

        return {
            keypoints: [
                kp(cx, cy - 150, 'nose'),
                kp(cx - 20, cy - 160, 'left_eye'),
                kp(cx + 20, cy - 160, 'right_eye'),
                kp(cx - 40, cy - 150, 'left_ear'),
                kp(cx + 40, cy - 150, 'right_ear'),
                kp(cx - 50, shoulderY, 'left_shoulder'),
                kp(cx + 50, shoulderY, 'right_shoulder'),
                kp(cx - elbowX, elbowY, 'left_elbow'),
                kp(cx + elbowX, elbowY, 'right_elbow'),
                kp(cx - 50, wristY, 'left_wrist'),
                kp(cx + 50, wristY, 'right_wrist'),
                kp(cx - 30, cy + 60, 'left_hip'),
                kp(cx + 30, cy + 60, 'right_hip'),
                kp(cx - 35, cy + 140, 'left_knee'),
                kp(cx + 35, cy + 140, 'right_knee'),
                kp(cx - 40, cy + 220, 'left_ankle'),
                kp(cx + 40, cy + 220, 'right_ankle'),
            ],
            score: 0.9,
        } as Pose;
    }, [width, height]);


    /**
     * Body Pose Detection (Python Backend)
     */
    /**
     * Unified Vision System (Gestures + Body Pose)
     */
    const {
        poses: rawPoses,
        isDetecting: isVisionActive,
        repCount: backendRepCount,
        stage: backendStage,
        feedback: backendFeedback,
        formScore: backendFormScore,
        resetStats,
        finishWorkoutSession,
        isProcessingResults
    } = useSmartCamera(
        isWorkoutActive && AppConfig.features.enablePoseDetection,
        cameraRef,
        exerciseId
    );

    // Scale normalized poses to screen dimensions for DISPLAY
    const poses = React.useMemo(() => {
        // Priority to real poses
        if (rawPoses && rawPoses.length > 0) {
            const isMirrored = facing === 'front';
            return rawPoses.map(pose => ({
                ...pose,
                keypoints: pose.keypoints.map(kp => ({
                    ...kp,
                    // Mirroring logic (assuming backend sends normalized 0-1)
                    // If backend sends normalized x,y (0-1), we scale by width/height
                    x: isMirrored ? (1 - kp.x) * width : kp.x * width,
                    y: kp.y * height
                }))
            }));
        }

        // Fallback to mock poses if enabled and no real poses
        if (AppConfig.features.enableMockPoseOverlay && mockPoses.length > 0) {
            return mockPoses;
        }

        return [];
    }, [rawPoses, mockPoses, width, height, facing]);

    const isPoseModelReady = true; // Always considered ready with backend approach

    /**
     * Workout timer
     * Uses a real-wall-clock delta (Date.now() - startTime) instead of
     * incrementing a counter so the timer stays accurate even if the user
     * backgrounds the app during a workout.
     */
    useEffect(() => {
        if (isWorkoutActive) {
            // Record the exact moment the workout started.
            workoutStartTimeRef.current = Date.now();
            setElapsedTime(0);

            timerRef.current = setInterval(() => {
                if (workoutStartTimeRef.current !== null) {
                    const real = Math.floor((Date.now() - workoutStartTimeRef.current) / 1000);
                    setElapsedTime(real);
                }
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            workoutStartTimeRef.current = null;
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (mockTimerRef.current) {
                clearInterval(mockTimerRef.current);
                mockTimerRef.current = null;
            }
        };
    }, [isWorkoutActive]);


    /**
     * Handle pose updates and analyze workout
     * Replaced local workoutAnalysisService with Backend Data
     */
    useEffect(() => {
        if (!isWorkoutActive) return;

        // Use backend data directly
        setRepCount(backendRepCount);
        setCurrentStage(backendStage || '');
        setFormScore(backendFormScore);

        // Convert string feedback to FormValidation format
        const validation: FormValidation = {
            isValid: backendFeedback.length === 0,
            score: backendFormScore,
            errors: backendFeedback.map(msg => ({
                severity: 'warning',
                message: msg,
                visualCue: 'Fix Form',
                audioCue: msg
            }))
        };
        setFormValidation(validation);

        // Track stats locally for summary
        if (backendRepCount > 0) {
            setTotalFormScore(prev => prev + backendFormScore); // This might over-sample, but simpler for now
            setFormScoreCount(prev => prev + 1);
        }

        // Process feedback (audio)
        // Debounce or check for new feedback only? 
        // FeedbackService handles debouncing usually
        if (validation.errors.length > 0) {
            feedbackService.processFormValidation(validation);
        }

        // Announce rep completion
        if (backendRepCount > prevRepCount.current) {
            feedbackService.announceRep(backendRepCount, backendFormScore);
            prevRepCount.current = backendRepCount;
        }

        // Auto-complete set if target reached in Plan Mode
        if (planMode && backendRepCount > 0) {
            // targetRepsParam might be a string like "10-12" or "10". We'll try to parse a number out of it.
            // If it's a range, we'll aim for the lower bound to be safe, or just parseInt the first number.
            const targetNumber = parseInt(targetRepsParam.toString().split('-')[0], 10);

            if (!isNaN(targetNumber) && backendRepCount >= targetNumber) {
                // We reached the target! Stop the workout automatically.
                toggleWorkout();
            }
        }

    }, [backendRepCount, backendStage, backendFeedback, backendFormScore, isWorkoutActive, planMode, targetRepsParam]);



    /**
     * Toggle workout session
     */
    const toggleWorkout = async () => {
        if (isProcessingToggle) return;
        setIsProcessingToggle(true);

        try {
            if (isWorkoutActive) {
                // End workout recording phase
                setIsWorkoutActive(false);
                setShowOverlay(false);
                setMockPoses([]); // Clear mock poses
                if (mockTimerRef.current) {
                    clearInterval(mockTimerRef.current);
                    mockTimerRef.current = null;
                }

                let finalReps = 0;
                let finalScore = 100;
                let finalFeedback: string[] = [];

                // If we were using the backend, we need to finalize the session
                if (AppConfig.features.enablePoseDetection) {
                    // The finishWorkoutSession handles the IsProcessingResults state
                    const result = await finishWorkoutSession();

                    if (result) {
                        finalReps = result.rep_count;
                        finalScore = result.form_score;
                        finalFeedback = result.feedback || [];
                    }
                } else {
                    // Calculate average form score from local mock stats
                    finalScore = formScoreCount > 0
                        ? Math.round(totalFormScore / formScoreCount)
                        : 100;
                    finalReps = 0; // fallback if tracking local mock
                }

                // Announce completion (AI version)
                feedbackService.announceWorkoutEndAI({
                    reps: finalReps,
                    time: formatTime(elapsedTime),
                    formScore: finalScore,
                    exerciseName: getExerciseById(exerciseId)?.name || exerciseId,
                    feedback: finalFeedback
                });
                
                const feedbackString = finalFeedback.length > 0 
                    ? `\n\nFeedback:\n• ${finalFeedback.join('\n• ')}` 
                    : '';

                // Show workout summary
                Alert.alert(
                    '🎉 Workout Complete!',
                    `Exercise: ${exerciseId}\n` +
                    `Time: ${formatTime(elapsedTime)}\n` +
                    `Reps: ${finalReps}\n` +
                    `Average Form: ${finalScore}%${feedbackString}`,
                    [{ text: 'OK' }]
                );

                // Save workout to Firestore
                const exercise = getExerciseById(exerciseId);
                const caloriesBurned = Math.round(finalReps * 3 + elapsedTime * 0.1); // Simple estimate
                dispatch(saveWorkout({
                    exerciseId,
                    exerciseName: exercise?.name || exerciseId,
                    duration: elapsedTime,
                    reps: finalReps,
                    averageFormScore: finalScore,
                    caloriesBurned,
                }));

                // Update avatar progress
                avatarService.updateAfterWorkout({
                    exerciseId,
                    reps: finalReps,
                    duration: elapsedTime,
                    formScore: finalScore,
                });

                // Mark exercise as completed in workout plan if target reps reached
                if (planMode && currentPlan?.id) {
                    const targetNumber = parseInt(targetRepsParam.toString().split('-')[0], 10);
                    if (!isNaN(targetNumber) && finalReps >= targetNumber) {
                        const dayOfWeek = new Date().getDay();
                        dispatch(updateExerciseCompletion({
                            planId: currentPlan.id,
                            dayOfWeek,
                            exerciseId,
                            completed: true,
                            lastCompletedAt: new Date(),
                        }));
                    }
                }

                // Reset for next workout
                workoutAnalysisService.reset(exerciseId);
                setRepCount(0);
                setCurrentStage('');
                setElapsedTime(0);
                setTotalFormScore(0);
                setFormScoreCount(0);
                prevRepCount.current = 0;
            } else {
                // Start countdown first
                setShowCountdown(true);
            }
        } finally {
            setIsProcessingToggle(false);
        }
    };

    const handleCountdownComplete = () => {
        setShowCountdown(false);
        resetStats(); // Reset backend stats
        setIsWorkoutActive(true);
        setShowOverlay(true);

        // Announce start
        const exercise = getExerciseById(exerciseId);
        feedbackService.announceWorkoutStart(exercise?.name || exerciseId);

        // Mock Animation Loop
        if (AppConfig.features.enableMockPoseOverlay && !AppConfig.features.enablePoseDetection) {
            let frame = 0;
            if (mockTimerRef.current) clearInterval(mockTimerRef.current);

            mockTimerRef.current = setInterval(() => {
                // Cycle: Up -> Down -> Up every 4 seconds (approx)
                // 30fps simulation
                frame++;
                const t = (Math.sin(frame / 20) + 1) / 2; // 0 to 1 smooth
                setMockPoses([generateMockPose(t)]);
            }, 50);
        }
    };


    /**
     * Toggle camera facing
     */
    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    /**
     * Cycle through available exercises (legacy, still works during workout)
     */
    const cycleExercise = () => {
        const currentIndex = AVAILABLE_EXERCISES.indexOf(exerciseId);
        const nextIndex = (currentIndex + 1) % AVAILABLE_EXERCISES.length;
        const newExercise = AVAILABLE_EXERCISES[nextIndex];

        setExerciseId(newExercise);
        resetStats(); // Reset backend stats for new exercise
        setRepCount(0);
        prevRepCount.current = 0;
    };

    /**
     * Handle exercise selection from modal
     */
    const handleExerciseSelect = (id: string) => {
        setExerciseId(id as ExerciseId);
        resetStats(); // Reset backend stats
        setRepCount(0);
        prevRepCount.current = 0;
    };

    /**
     * Format seconds to MM:SS
     */
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Handle permission states
    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>📸 Camera Access Required</Text>
                <Text style={styles.permissionText}>
                    We need camera access to analyze your workout form in real-time.
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // TIMER-ONLY MODE (No Camera)
    if (trackingMode === 'timer_only') {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[colors.backgroundDark, colors.backgroundDark]}
                    style={{ flex: 1 }}
                >
                    {/* Header */}
                    <View style={styles.timerHeader}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.controlIcon}>✕</Text>
                        </TouchableOpacity>
                        <View style={styles.timerHeaderContent}>
                            <Text style={styles.timerExerciseName}>
                                {currentExercise?.displayName || currentExercise?.name}
                            </Text>
                            <Text style={styles.timerModeLabel}>Timer Mode</Text>
                        </View>
                    </View>

                    {/* Timer */}
                    <View style={styles.timerContent}>
                        <ExerciseTimer
                            duration={currentExercise?.timerDuration || 60}
                            onComplete={() => {
                                // Save workout with proper structure
                                const workout = {
                                    exerciseId,
                                    exerciseName: currentExercise?.displayName || currentExercise?.name || exerciseId,
                                    duration: currentExercise?.timerDuration || 60,
                                    reps: 1,
                                    averageFormScore: 100,
                                    caloriesBurned: Math.round((currentExercise?.caloriesPerRep || 0.3) * (currentExercise?.timerDuration || 60))
                                };
                                dispatch(saveWorkout(workout as any));
                                avatarService.updateAfterWorkout({
                                    exerciseId,
                                    reps: 1,
                                    duration: currentExercise?.timerDuration || 60,
                                    formScore: 100,
                                });
                            }}
                        />
                    </View>
                </LinearGradient>
            </View>
        );
    }

    // CAMERA MODE (ai_reps or ai_timer)
    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                ref={cameraRef}
            />
            <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                {/* Pose Skeleton Overlay - DISABLED per user request */}
                {/* {poses.length > 0 && (
                    <PoseOverlay
                        poses={poses}
                        width={width}
                        height={height}
                        formScore={formScore}
                    />
                )} */}

                {/* Form Feedback Overlay - DISABLED for Streaming Architecture (no real-time feedback) */}
                {/* <FormFeedbackOverlay
                    validation={formValidation}
                    currentStage={currentStage}
                    isVisible={isWorkoutActive}
                /> */}

                {/* HUD - Exercise Info */}
                {isWorkoutActive && (
                    <View style={styles.hud}>
                        <BlurView intensity={30} tint={isDark ? "light" : "dark"} style={styles.hudBlur}>
                            {/* Left Side: Exercise & Timer */}
                            <View style={styles.hudLeftSection}>
                                <TouchableOpacity onPress={cycleExercise} activeOpacity={0.7}>
                                    <Text style={styles.hudExercise}>
                                        {navigation.params?.exerciseName || getExerciseById(exerciseId)?.name || exerciseId}
                                    </Text>
                                </TouchableOpacity>

                                {planMode && (
                                    <Text style={styles.hudSetProgress}>
                                        Set {currentSet}/{totalSets}
                                    </Text>
                                )}

                                <Text style={styles.hudTimer}>{formatTime(elapsedTime)}</Text>
                            </View>

                            {/* Right Side: Target Reps (shown only in plan mode) */}
                            {planMode && (
                                <View style={styles.hudRightSection}>
                                    <Text style={styles.hudReps}>{targetRepsParam}</Text>
                                    <Text style={styles.hudTarget}>TARGET</Text>
                                </View>
                            )}
                        </BlurView>
                    </View>
                )}

                {/* Status Indicators */}
                {AppConfig.features.enablePoseDetection && !isPoseModelReady && (
                    <View style={styles.statusBanner}>
                        <Text style={styles.statusText}>
                            {poseError ? `⚠️ ${poseError}` : '⏳ Loading AI...'}
                        </Text>
                    </View>
                )}

                {AppConfig.features.enableMockPoseOverlay &&
                    !AppConfig.features.enablePoseDetection && isWorkoutActive && (
                        <View style={styles.mockBanner}>
                            <Text style={styles.mockText}>📍 Demo Mode (Animating)</Text>
                        </View>
                    )}

                {/* Control Buttons */}
                <View style={styles.controlBar}>
                    <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
                        <Text style={styles.controlIcon}>🔄</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.mainButton,
                            isWorkoutActive && styles.stopButton,
                            isProcessingToggle && { opacity: 0.5 }
                        ]}
                        onPress={toggleWorkout}
                        activeOpacity={0.8}
                        disabled={isProcessingToggle}
                    >
                        <Text style={[styles.mainButtonIcon, isWorkoutActive && styles.stopIconAdjustment]}>
                            {isWorkoutActive ? '⏹' : '▶'}
                        </Text>
                        <Text style={styles.mainButtonText}>
                            {isWorkoutActive ? 'STOP' : 'START WORKOUT'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.controlIcon}>✕</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Exercise Selector Modal */}
            <ExerciseSelector
                visible={showExerciseSelector}
                selectedExerciseId={exerciseId}
                onSelect={handleExerciseSelect}
                onClose={() => setShowExerciseSelector(false)}
            />

            {/* Exercise Selection Button (when not in workout) */}
            {!isWorkoutActive && !isProcessingResults && (
                <View style={styles.exerciseSelectContainer}>
                    <TouchableOpacity
                        style={styles.exerciseSelectButton}
                        onPress={() => setShowExerciseSelector(true)}
                        activeOpacity={0.8}
                    >
                        <BlurView intensity={30} tint={isDark ? "light" : "dark"} style={styles.exerciseSelectBlur}>
                            <Text style={styles.exerciseSelectHint}>⚙️</Text>
                            <Text style={styles.exerciseSelectName}>
                                {getExerciseById(exerciseId)?.name || exerciseId}
                            </Text>
                        </BlurView>
                    </TouchableOpacity>
                </View>
            )}

            {/* Countdown Overlay */}
            {showCountdown && (
                <CountdownOverlay onComplete={handleCountdownComplete} />
            )}

            {/* Processing Overlay */}
            {isProcessingResults && (
                <BlurView intensity={80} tint={isDark ? "dark" : "dark"} style={[StyleSheet.absoluteFill, styles.processingOverlay]}>
                    <View style={styles.processingContent}>
                        <Text style={styles.processingIcon}>⏳</Text>
                        <Text style={styles.processingTitle}>ANALYZING WORKOUT</Text>
                        <Text style={styles.processingSubtitle}>Running AI Bio-mechanics...</Text>
                    </View>
                </BlurView>
            )}
        </View>
    );
}



