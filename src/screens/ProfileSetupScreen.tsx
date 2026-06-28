import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    BackHandler,
    Animated, // Added Animated
} from 'react-native';
import Slider from '@react-native-community/slider';
const TypedSlider = Slider as any;
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { updateProfile, signOut } from '../store/slices/authSlice';
import { regenerateUserPlan } from '../store/slices/workoutPlanSlice';
import { UserProfile } from '../types';
import { Spacing, Layout, Shadows, ThemeColorsType, ThemeShadowsType } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { feetToCm, metersToCm, cmToFeet, cmToMeters } from '../utils/unitConversion';

interface ProfileSetupScreenProps {
    navigation: any;
}

const COMMON_HEALTH_ISSUES = [
    'none', 'knee_pain', 'lower_back_pain', 'shoulder_injury', 'wrist_pain',
    'ankle_injury', 'hip_injury', 'neck_pain', 'heart_condition'
];

const EQUIPMENT_OPTIONS = [
    { id: 'dumbbells', label: 'Dumbbells' },
    { id: 'resistance_bands', label: 'Resistance Bands' },
    { id: 'pull_up_bar', label: 'Pull-up Bar' },
    { id: 'yoga_mat', label: 'Yoga Mat' },
    { id: 'bench', label: 'Bench' },
    { id: 'kettlebells', label: 'Kettlebells' },
];

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundDark,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.l,
        paddingVertical: Spacing.xxl,
    },
    header: {
        marginBottom: Spacing.l,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: Spacing.s,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.s,
        marginBottom: Spacing.xl,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.glassBorder,
    },
    progressDotActive: {
        backgroundColor: colors.primaryStart,
        width: 24,
    },
    progressDotCompleted: {
        backgroundColor: colors.accentSuccess,
    },
    stepContainer: {
        marginBottom: Spacing.xl,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: Spacing.s,
    },
    stepSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: Spacing.l,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: Spacing.s,
    },
    input: {
        backgroundColor: colors.glassSurface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        fontSize: 16,
        color: colors.textPrimary,
    },
    optionsContainer: {
        gap: Spacing.s,
    },
    optionButton: {
        backgroundColor: colors.glassSurface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.small,
    },
    optionButtonActive: {
        backgroundColor: colors.primaryStart,
        borderColor: colors.primaryStart,
    },
    optionEmoji: {
        fontSize: 24,
        marginRight: Spacing.s,
    },
    optionButtonText: {
        color: colors.textSecondary,
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    optionButtonTextActive: {
        color: '#FFFFFF',
    },
    optionDesc: {
        color: colors.textTertiary,
        fontSize: 12,
    },
    sliderSection: {
        marginBottom: Spacing.l,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.s,
    },
    sliderValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primaryStart,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    healthIssuesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.s,
    },
    healthIssueChip: {
        backgroundColor: colors.glassSurface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: Layout.borderRadius.round,
        paddingVertical: Spacing.s,
        paddingHorizontal: Spacing.m,
    },
    healthIssueChipActive: {
        backgroundColor: colors.primaryStart,
        borderColor: colors.primaryStart,
    },
    healthIssueText: {
        color: colors.textSecondary,
        fontSize: 14,
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    healthIssueTextActive: {
        color: '#FFFFFF',
    },
    summaryCard: {
        backgroundColor: colors.glassSurface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        ...shadows.card,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: Spacing.m,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.s,
    },
    summaryLabel: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    summaryValue: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.glassSurface,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...shadows.small,
    },
    genderButtonActive: {
        backgroundColor: colors.primaryStart,
        borderColor: colors.primaryStart,
    },
    genderText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    genderTextActive: {
        color: '#FFF',
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    bmiDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingVertical: 8,
    },
    bmiLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 4,
    },
    bmiValue: {
        color: colors.textPrimary,
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
    },
    bmiStatus: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: colors.glassBorder,
    },
    summaryInfo: {
        color: colors.textTertiary,
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    planInfo: {
        color: colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: Spacing.s,
        marginTop: 'auto',
    },
    backButton: {
        flex: 1,
        backgroundColor: colors.glassSurface,
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    backButtonText: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    nextButtonContainer: {
        flex: 2,
    },
    nextButton: {
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        alignItems: 'center',
        ...shadows.small,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    sliderButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.glassSurface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...shadows.small,
    },
    unitSelector: {
        flexDirection: 'row',
        backgroundColor: colors.glassSurface,
        borderRadius: 8,
        padding: 2,
        marginLeft: 12,
        marginRight: 'auto',
    },
    unitButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    unitButtonActive: {
        backgroundColor: colors.primaryStart,
    },
    unitText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    unitTextActive: {
        color: '#FFFFFF',
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
        ...shadows.card,
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
    successButton: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        ...shadows.small,
    },
    successButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

import { useToast } from '../context/ToastContext';

export default function ProfileSetupScreen({ navigation }: ProfileSetupScreenProps) {
    const { colors, gradients, shadows, isDark } = useTheme();
    const { showToast } = useToast();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    const dispatch = useAppDispatch();

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

    const { user, loading } = useAppSelector((state) => state.auth);

    // Multi-step state
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 7;

    // Step 1: Basic Info
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft' | 'm'>('cm');

    // Step 2: Advanced Body Metrics
    const [bodyFat, setBodyFat] = useState('');
    const [visceralFat, setVisceralFat] = useState('');
    const [trunkFat, setTrunkFat] = useState('');
    const [bodyAge, setBodyAge] = useState('');
    const [skeletalMuscle, setSkeletalMuscle] = useState('');

    // Step 2: Goals
    const [fitnessGoal, setFitnessGoal] = useState<UserProfile['fitnessGoal']>('muscle_gain');

    // Step 3: Experience
    const [workoutExperience, setWorkoutExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

    // Step 4: Fitness Assessment (Sliders)
    const [pushups, setPushups] = useState(10);
    const [squats, setSquats] = useState(20);
    const [plankMinutes, setPlankMinutes] = useState(0.5);

    // Step 5: Health Issues
    const [selectedHealthIssues, setSelectedHealthIssues] = useState<string[]>([]);
    const [customHealthIssue, setCustomHealthIssue] = useState('');

    // Step 6: Equipment & Location
    const [equipmentAccess, setEquipmentAccess] = useState<'bodyweight' | 'home' | 'gym'>('bodyweight');
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

    // Step 7: Plan preview
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const toggleHealthIssue = (issue: string) => {
        setSelectedHealthIssues(prev => {
            if (issue === 'none') {
                return prev.includes('none') ? [] : ['none'];
            } else {
                const next = prev.includes(issue)
                    ? prev.filter(i => i !== issue)
                    : [...prev, issue];
                return next.filter(i => i !== 'none');
            }
        });
    };

    const toggleEquipment = (equipment: string) => {
        setSelectedEquipment(prev =>
            prev.includes(equipment) ? prev.filter(e => e !== equipment) : [...prev, equipment]
        );
    };

    const getHeightInCm = (): number => {
        if (!height) return 0;
        if (heightUnit === 'cm') return parseFloat(height) || 0;
        if (heightUnit === 'ft') return feetToCm(height);
        return metersToCm(parseFloat(height));
    };

    const handleNext = () => {
        // Validation for each step
        if (currentStep === 1) {
            if (!age || !weight || !height) {
                showToast('Please fill in all fields', 'warning');
                return;
            }
            const ageNum = parseInt(age);
            const weightNum = parseFloat(weight);
            const heightNum = getHeightInCm(); // Use converted value
            if (ageNum <= 0 || weightNum <= 0 || heightNum <= 0) {
                showToast('Please enter valid numbers', 'warning');
                return;
            }

            // Auto-calculate advanced metrics when going from Step 1 to Step 2
            estimateMetrics();
        }

        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const calculateBMI = () => {
        const w = parseFloat(weight);
        const h = getHeightInCm() / 100; // Use converted value
        if (!w || !h) return 0;
        return w / (h * h);
    };

    // Handle Android hardware back button
    React.useEffect(() => {
        const onBackPress = () => {
            if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
            } else {
                // First step: leave Profile Setup by signing out → Login.
                dispatch(signOut());
            }
            return true; // We handle back ourselves on every step.
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            onBackPress
        );

        return () => backHandler.remove();
    }, [currentStep]);

    const calculateBMR = () => {
        const w = parseFloat(weight);
        const h = getHeightInCm(); // Use converted value
        const a = parseInt(age);
        if (!w || !h || !a) return 0;

        // Mifflin-St Jeor Equation
        if (gender === 'male') {
            return (10 * w) + (6.25 * h) - (5 * a) + 5;
        } else {
            return (10 * w) + (6.25 * h) - (5 * a) - 161;
        }
    };

    const getBMIStatus = (bmi: number) => {
        if (bmi < 18.5) return { label: 'Underweight', color: '#3498db' };
        if (bmi < 25) return { label: 'Healthy', color: colors.accentSuccess };
        if (bmi < 30) return { label: 'Overweight', color: '#f1c40f' };
        return { label: 'Obese', color: colors.accentError };
    };

    const estimateMetrics = () => {
        const bmi = calculateBMI();
        const bmr = calculateBMR();
        const a = parseInt(age);
        const w = parseFloat(weight);
        const h = getHeightInCm(); // Use converted value

        if (!bmi || !a || !w || !h) return;

        // 1. Body Fat Mass (kg) - Simplified estimation (Deurenberg Formula)
        // Men: Body Fat % = (1.20 × BMI) + (0.23 × age) - 16.2
        // Women: Body Fat % = (1.20 × BMI) + (0.23 × age) - 5.4
        const bfPercent = (1.20 * bmi) + (0.23 * a) - (gender === 'male' ? 16.2 : 5.4);
        const bodyFatKg = w * (Math.max(5, Math.min(50, bfPercent)) / 100);
        setBodyFat(bodyFatKg.toFixed(1)); // Store as kg

        // 2. Skeletal Muscle Mass (kg)
        // Lean Body Mass (LBM) = weight × (1 - body_fat_percentage/100)
        // Skeletal Muscle Mass ≈ LBM × 0.45 (45% of lean mass)
        const lbm = w * (1 - bfPercent / 100);
        const skeletalMuscleKg = lbm * 0.45;
        setSkeletalMuscle(Math.max(10, Math.min(50, skeletalMuscleKg)).toFixed(1)); // Store as kg, clamp 10-50kg

        // 3. Visceral Fat Percentage
        // Visceral fat is typically 10-20% of total body fat
        // Higher BMI correlates with higher visceral fat ratio
        const visceralFatRatio = 0.10 + Math.max(0, (bmi - 22) * 0.01); // 10% base, increases with BMI
        const visceralFatKg = bodyFatKg * Math.min(0.30, visceralFatRatio); // Cap at 30% of total fat
        const visceralFatPercent = (visceralFatKg / w) * 100;
        setVisceralFat(Math.max(1, Math.min(15, visceralFatPercent)).toFixed(1)); // Store as %, clamp 1-15%

        // 4. Trunk Subcutaneous Fat Mass (kg)
        // Trunk Fat Mass = Total Body Fat Mass × 0.5 (50% of total fat is in trunk)
        // Subcutaneous component ≈ Trunk Fat × 0.85 (85% of trunk fat is subcutaneous)
        const trunkFatKg = bodyFatKg * 0.5;
        const trunkSubcutaneousFatKg = trunkFatKg * 0.85;
        setTrunkFat(Math.max(1, Math.min(30, trunkSubcutaneousFatKg)).toFixed(1)); // Store as kg, clamp 1-30kg

        // 5. Body Age (Metabolic Age)
        // Expected BMR decline ≈ 2% per decade after age 20
        // Base BMR at age 20 for comparison
        const baseBMRMale20 = (10 * w) + (6.25 * h) - (5 * 20) + 5;
        const baseBMRFemale20 = (10 * w) + (6.25 * h) - (5 * 20) - 161;
        const baseBMR20 = gender === 'male' ? baseBMRMale20 : baseBMRFemale20;

        // Calculate expected BMR for current age (2% decline per decade after 20)
        const decadesAfter20 = Math.max(0, (a - 20) / 10);
        const expectedBMR = baseBMR20 * Math.pow(0.98, decadesAfter20);

        // Calculate body age based on BMR deviation
        // If BMR is higher than expected → younger body age
        // If BMR is lower than expected → older body age
        const bmrDeviation = bmr - expectedBMR;
        const bmrDeclinePerYear = baseBMR20 * 0.002; // 0.2% per year
        const ageAdjustment = bmrDeviation / bmrDeclinePerYear;
        const metabolicAge = Math.round(a - ageAdjustment);

        setBodyAge(Math.max(15, Math.min(100, metabolicAge)).toString()); // Clamp 15-100
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            // On the first step there's no previous step — leaving Profile Setup
            // means signing out, which returns the user to the Login screen.
            dispatch(signOut());
        }
    };

    const handleComplete = async () => {
        if (!user) return;

        try {
            setGeneratingPlan(true);

            // Compile all health issues
            const allHealthIssues = [...selectedHealthIssues];
            if (customHealthIssue.trim()) {
                allHealthIssues.push(customHealthIssue.trim());
            }

            // Create updated profile data
            const profileUpdate: Partial<UserProfile> = {
                gender,
                age: parseInt(age),
                weight: parseFloat(weight),
                height: getHeightInCm(), // Use converted value
                fitnessGoal,
                workoutExperience,
                bodyComposition: {
                    bmi: calculateBMI(),
                    bmr: calculateBMR(),
                    bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
                    visceralFat: visceralFat ? parseFloat(visceralFat) : undefined,
                    trunkSubcutaneousFat: trunkFat ? parseFloat(trunkFat) : undefined,
                    bodyAge: bodyAge ? parseInt(bodyAge) : undefined,
                    skeletalMuscle: skeletalMuscle ? parseFloat(skeletalMuscle) : undefined,
                },
                fitnessProfile: {
                    equipmentAccess,
                    availableEquipment: selectedEquipment as any[],
                    experienceLevel: workoutExperience,
                    fitnessGoals: [fitnessGoal],
                    healthIssues: allHealthIssues.filter(i => i !== 'none'),
                    availableDays: 7
                },
                progressSystem: {
                    currentLevel: 1,
                    currentXP: 0,
                    xpToNextLevel: 1000,
                    totalWorkoutsCompleted: 0,
                    unlockedExercises: []
                },
                workoutCapacity: {
                    bodyweight: { sets: 3, reps: 10 },
                    weighted: { sets: 3, reps: 8 }
                }
            };

            // compiled full profile for regeneration
            const fullProfile: UserProfile = {
                ...user,
                ...profileUpdate,
                uid: user.uid,
                createdAt: user.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                transformationPhotos: user.transformationPhotos || [],
            };

            // 1. Update Profile in Firestore & Local State
            await dispatch(updateProfile(profileUpdate)).unwrap();

            // 2. Centralized Plan Generation & Saving
            await dispatch(regenerateUserPlan(fullProfile)).unwrap();

            setGeneratingPlan(false);
            setShowSuccessModal(true); // Keeping modal for success as it's a major milestone
        } catch (error: any) {
            setGeneratingPlan(false);
            showToast(error.message || 'Failed to complete setup', 'error');
        }
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            {Array.from({ length: totalSteps }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.progressDot,
                        index + 1 === currentStep && styles.progressDotActive,
                        index + 1 < currentStep && styles.progressDotCompleted,
                    ]}
                />
            ))}
        </View>
    );

    const renderSliderSection = (
        label: string,
        value: number,
        setValue: (val: number) => void,
        min: number,
        max: number,
        step: number,
        formatValue: (val: number) => string
    ) => {
        const handleIncrement = () => {
            const newValue = Math.min(max, value + step);
            setValue(newValue);
        };

        const handleDecrement = () => {
            const newValue = Math.max(min, value - step);
            setValue(newValue);
        };

        return (
            <View style={styles.sliderSection}>
                <View style={styles.sliderHeader}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.sliderValue}>{formatValue(value)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={styles.sliderButton}
                        onPress={handleDecrement}
                    >
                        <MaterialCommunityIcons name="minus" size={24} color={colors.primaryStart} />
                    </TouchableOpacity>

                    <TypedSlider
                        style={{ flex: 1, marginHorizontal: 10 }}
                        minimumValue={min}
                        maximumValue={max}
                        step={step}
                        value={value}
                        onValueChange={setValue}
                        minimumTrackTintColor={colors.primaryStart}
                        maximumTrackTintColor={colors.glassBorder}
                        thumbTintColor={colors.primaryStart}
                    />

                    <TouchableOpacity
                        style={styles.sliderButton}
                        onPress={handleIncrement}
                    >
                        <MaterialCommunityIcons name="plus" size={24} color={colors.primaryStart} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Basic Information</Text>
                        <Text style={styles.stepSubtitle}>Let's start with your basics</Text>

                        {/* Gender Selection */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.genderContainer}>
                                <TouchableOpacity
                                    style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                                    onPress={() => setGender('male')}
                                >
                                    <MaterialCommunityIcons name="gender-male" size={24} color={gender === 'male' ? '#FFF' : colors.textSecondary} />
                                    <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                                    onPress={() => setGender('female')}
                                >
                                    <MaterialCommunityIcons name="gender-female" size={24} color={gender === 'female' ? '#FFF' : colors.textSecondary} />
                                    <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Age</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your age"
                                placeholderTextColor={colors.textTertiary}
                                value={age}
                                onChangeText={setAge}
                                keyboardType="number-pad"
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Weight (kg)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your weight"
                                placeholderTextColor={colors.textTertiary}
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="decimal-pad"
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={[styles.label, { marginBottom: 0, marginRight: 8 }]}>Height</Text>
                                <View style={styles.unitSelector}>
                                    {(['cm', 'ft', 'm'] as const).map((unit) => (
                                        <TouchableOpacity
                                            key={unit}
                                            style={[styles.unitButton, heightUnit === unit && styles.unitButtonActive]}
                                            onPress={() => {
                                                let newHeight = height;
                                                let cmVal = 0;
                                                if (heightUnit === 'cm') cmVal = parseFloat(height) || 0;
                                                else if (heightUnit === 'ft') cmVal = feetToCm(height);
                                                else cmVal = metersToCm(parseFloat(height));

                                                setHeightUnit(unit);

                                                if (unit === 'cm') newHeight = cmVal.toString();
                                                else if (unit === 'ft') newHeight = cmToFeet(cmVal);
                                                else newHeight = cmToMeters(cmVal).toString();

                                                setHeight(newHeight);
                                            }}
                                        >
                                            <Text style={[styles.unitText, heightUnit === unit && styles.unitTextActive]}>{unit}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder={`Enter your height (${heightUnit})`}
                                placeholderTextColor={colors.textTertiary}
                                value={height}
                                onChangeText={setHeight}
                                keyboardType={heightUnit === 'ft' ? 'default' : 'numeric'}
                                editable={!loading}
                            />
                        </View>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Fitness Goals</Text>
                        <Text style={styles.stepSubtitle}>What are you working towards?</Text>

                        <View style={styles.optionsContainer}>
                            {[
                                { value: 'weight_loss', label: 'Weight Loss (Cutting)', emoji: '🔥' },
                                { value: 'muscle_gain', label: 'Muscle Gain (Bulking)', emoji: '💪' },
                                { value: 'endurance', label: 'Stamina & Endurance', emoji: '🏃' },
                                { value: 'flexibility', label: 'Flexibility', emoji: '🧘' },
                            ].map((goal) => (
                                <TouchableOpacity
                                    key={goal.value}
                                    style={[
                                        styles.optionButton,
                                        fitnessGoal === goal.value && styles.optionButtonActive,
                                    ]}
                                    onPress={() => setFitnessGoal(goal.value as UserProfile['fitnessGoal'])}
                                >
                                    <Text style={styles.optionEmoji}>{goal.emoji}</Text>
                                    <Text
                                        style={[
                                            styles.optionButtonText,
                                            fitnessGoal === goal.value && styles.optionButtonTextActive,
                                        ]}
                                    >
                                        {goal.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Workout Experience</Text>
                        <Text style={styles.stepSubtitle}>How long have you been training?</Text>

                        <View style={styles.optionsContainer}>
                            {[
                                { value: 'beginner', label: 'Beginner', desc: '0-1 year' },
                                { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
                                { value: 'advanced', label: 'Advanced', desc: '3+ years' },
                            ].map((exp) => (
                                <TouchableOpacity
                                    key={exp.value}
                                    style={[
                                        styles.optionButton,
                                        workoutExperience === exp.value && styles.optionButtonActive,
                                    ]}
                                    onPress={() => setWorkoutExperience(exp.value as typeof workoutExperience)}
                                >
                                    <View>
                                        <Text
                                            style={[
                                                styles.optionButtonText,
                                                workoutExperience === exp.value && styles.optionButtonTextActive,
                                            ]}
                                        >
                                            {exp.label}
                                        </Text>
                                        <Text style={styles.optionDesc}>{exp.desc}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 4:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Fitness Assessment</Text>
                        <Text style={styles.stepSubtitle}>Use the sliders to indicate your current strength</Text>

                        <View style={styles.sliderSection}>
                            {renderSliderSection(
                                'Max Push-ups',
                                pushups,
                                setPushups,
                                0,
                                100,
                                1,
                                (val) => Math.round(val).toString()
                            )}
                        </View>

                        <View style={styles.sliderSection}>
                            {renderSliderSection(
                                'Max Squats',
                                squats,
                                setSquats,
                                0,
                                100,
                                1,
                                (val) => Math.round(val).toString()
                            )}
                        </View>

                        <View style={styles.sliderSection}>
                            {renderSliderSection(
                                'Plank Duration (min)',
                                Math.round(plankMinutes * 60), // Convert min to sec for slider
                                (val) => setPlankMinutes(val / 60), // Convert sec to min for state
                                0,
                                300, // 5 mins max (in seconds)
                                1,   // 1 second step
                                (val) => {
                                    const m = Math.floor(val / 60);
                                    const s = val % 60;
                                    return `${m}.${s.toString().padStart(2, '0')} min`;
                                }
                            )}
                        </View>
                    </View>
                );

            case 5:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Health & Limitations</Text>
                        <Text style={styles.stepSubtitle}>Any injuries or conditions we should know about?</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Common Issues (Select all that apply)</Text>
                            <View style={styles.healthIssuesGrid}>
                                {COMMON_HEALTH_ISSUES.map((issue) => (
                                    <TouchableOpacity
                                        key={issue}
                                        style={[
                                            styles.healthIssueChip,
                                            selectedHealthIssues.includes(issue) && styles.healthIssueChipActive,
                                        ]}
                                        onPress={() => toggleHealthIssue(issue)}
                                    >
                                        <Text
                                            style={[
                                                styles.healthIssueText,
                                                selectedHealthIssues.includes(issue) && styles.healthIssueTextActive,
                                            ]}
                                        >
                                            {issue.replace('_', ' ')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Other Health Issues (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., asthma, diabetes, etc."
                                placeholderTextColor={colors.textTertiary}
                                value={customHealthIssue}
                                onChangeText={setCustomHealthIssue}
                                multiline
                                editable={!loading}
                            />
                        </View>
                    </View>
                );

            case 6:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Equipment & Location</Text>
                        <Text style={styles.stepSubtitle}>Where will you be working out?</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Workout Location</Text>
                            <View style={styles.optionsContainer}>
                                {[
                                    { value: 'bodyweight', label: 'Home (Bodyweight Only)', emoji: '🏠' },
                                    { value: 'home', label: 'Home (With Equipment)', emoji: '🏋️' },
                                    { value: 'gym', label: 'Gym Access', emoji: '🏢' },
                                ].map((location) => (
                                    <TouchableOpacity
                                        key={location.value}
                                        style={[
                                            styles.optionButton,
                                            equipmentAccess === location.value && styles.optionButtonActive,
                                        ]}
                                        onPress={() => setEquipmentAccess(location.value as any)}
                                    >
                                        <Text style={styles.optionEmoji}>{location.emoji}</Text>
                                        <Text
                                            style={[
                                                styles.optionButtonText,
                                                equipmentAccess === location.value && styles.optionButtonTextActive,
                                            ]}
                                        >
                                            {location.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {equipmentAccess === 'home' && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Available Equipment</Text>
                                <View style={styles.healthIssuesGrid}>
                                    {EQUIPMENT_OPTIONS.map((eq) => (
                                        <TouchableOpacity
                                            key={eq.id}
                                            style={[
                                                styles.healthIssueChip,
                                                selectedEquipment.includes(eq.id) && styles.healthIssueChipActive,
                                            ]}
                                            onPress={() => toggleEquipment(eq.id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.healthIssueText,
                                                    selectedEquipment.includes(eq.id) && styles.healthIssueTextActive,
                                                ]}
                                            >
                                                {eq.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                );

            case 7:
                const bmi = calculateBMI();
                const bmr = calculateBMR();
                const bmiStatus = getBMIStatus(bmi);

                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Ready to Start! 🎉</Text>
                        <Text style={styles.stepSubtitle}>Your personalized plan is being generated...</Text>

                        {/* BMI Section */}
                        <View style={[styles.summaryCard, { borderColor: bmiStatus.color }]}>
                            <Text style={styles.summaryTitle}>Body Composition Analysis</Text>
                            <View style={styles.bmiDisplay}>
                                <View>
                                    <Text style={styles.bmiLabel}>Current BMI</Text>
                                    <Text style={[styles.bmiValue, { color: bmiStatus.color }]}>{bmi.toFixed(1)}</Text>
                                    <Text style={[styles.bmiStatus, { color: bmiStatus.color }]}>{bmiStatus.label}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View>
                                    <Text style={styles.bmiLabel}>Estimated BMR</Text>
                                    <Text style={styles.bmiValue}>{Math.round(bmr)}</Text>
                                    <Text style={styles.bmiStatus}>kcal / day</Text>
                                </View>
                            </View>
                            <Text style={styles.summaryInfo}>
                                Healthy BMI range: <Text style={{ fontWeight: 'bold' }}>18.5 - 24.9</Text>
                            </Text>
                        </View>

                        {/* Advanced Metrics with Healthy Ranges */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Advanced Body Metrics</Text>
                            <Text style={styles.summaryInfo}>Your Current vs. Healthy Range</Text>

                            <View style={[styles.summaryRow, { marginTop: 12 }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.summaryLabel}>Body Fat</Text>
                                    <Text style={styles.summaryValue}>{bodyFat || '--'} kg</Text>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={[styles.summaryLabel, { fontSize: 11 }]}>Healthy Range</Text>
                                    <Text style={[styles.summaryValue, { fontSize: 12, color: colors.accentSuccess }]}>
                                        {gender === 'male' ? '10-20%' : '18-28%'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.summaryRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.summaryLabel}>Visceral Fat</Text>
                                    <Text style={styles.summaryValue}>{visceralFat || '--'}%</Text>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={[styles.summaryLabel, { fontSize: 11 }]}>Healthy Range</Text>
                                    <Text style={[styles.summaryValue, { fontSize: 12, color: colors.accentSuccess }]}>
                                        {'<10%'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.summaryRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.summaryLabel}>Trunk Subcutaneous Fat</Text>
                                    <Text style={styles.summaryValue}>{trunkFat || '--'} kg</Text>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={[styles.summaryLabel, { fontSize: 11 }]}>Healthy Range</Text>
                                    <Text style={[styles.summaryValue, { fontSize: 12, color: colors.accentSuccess }]}>
                                        Varies by weight
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.summaryRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.summaryLabel}>Skeletal Muscle</Text>
                                    <Text style={styles.summaryValue}>{skeletalMuscle || '--'} kg</Text>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={[styles.summaryLabel, { fontSize: 11 }]}>Healthy Range</Text>
                                    <Text style={[styles.summaryValue, { fontSize: 12, color: colors.accentSuccess }]}>
                                        {gender === 'male' ? '>40% body wt' : '>30% body wt'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.summaryRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.summaryLabel}>Body Age</Text>
                                    <Text style={styles.summaryValue}>{bodyAge || '--'} years</Text>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={[styles.summaryLabel, { fontSize: 11 }]}>Target</Text>
                                    <Text style={[styles.summaryValue, { fontSize: 12, color: colors.accentSuccess }]}>
                                        Equal to age ({age})
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Your Profile Summary</Text>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Gender / Age:</Text>
                                <Text style={styles.summaryValue}>{gender.toUpperCase()} / {age}y</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Weight / Height:</Text>
                                <Text style={styles.summaryValue}>{weight}kg / {height} {heightUnit}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Goal:</Text>
                                <Text style={styles.summaryValue}>
                                    {fitnessGoal.replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Experience:</Text>
                                <Text style={styles.summaryValue}>{workoutExperience.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Complete Your Profile</Text>
                            <Text style={styles.subtitle}>
                                Step {currentStep} of {totalSteps}
                            </Text>
                        </View>

                        {renderProgressBar()}
                        {renderStep()}

                        {/* Navigation Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBack}
                                disabled={loading || generatingPlan}
                            >
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.nextButtonContainer, (loading || generatingPlan) && styles.buttonDisabled]}
                                onPress={currentStep < totalSteps ? handleNext : handleComplete}
                                disabled={loading || generatingPlan}
                            >
                                <LinearGradient
                                    colors={gradients.primary}
                                    style={styles.nextButton}
                                >
                                    {generatingPlan ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.nextButtonText}>
                                            {currentStep < totalSteps ? 'Next' : 'Complete Setup'}
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            {showSuccessModal && (
                <BlurView intensity={80} tint={isDark ? "light" : "dark"} style={styles.modalOverlay}>
                    <View style={styles.successModal}>
                        <View style={styles.successIconContainer}>
                            <Text style={styles.successIcon}>🎉</Text>
                        </View>
                        <Text style={styles.successTitle}>Success!</Text>
                        <Text style={styles.successMessage}>
                            Your personalized workout plan is ready!
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
                                <Text style={styles.successButtonText}>Start Training</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            )}
        </View>
    );
}


