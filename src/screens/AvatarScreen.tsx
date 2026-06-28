/**
 * AvatarScreen
 * 
 * Displays user's fitness avatar with transformation progress,
 * achievements, and level progression.
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Image,
    Platform,
    Linking,
    Share,
    Modal,
    Switch,
    Animated,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { useBilling } from '../context/BillingContext';
import { useToast } from '../context/ToastContext';
import { RootState } from '../store'; // Added RootState import
import { uploadPhoto, signOut, updateProfile, changePassword } from '../store/slices/authSlice';
import { setAvatarScrollOffset } from '../store/slices/uiSlice';
import { regenerateUserPlan, fetchCustomPlans, deleteCustomPlan, duplicatePlan, switchActivePlan, switchToAIPlan } from '../store/slices/workoutPlanSlice';
import { UserProfile } from '../types';
import {
    avatarService,
    AvatarState,
    AVATAR_LEVELS,
    ACHIEVEMENTS
} from '../services/AvatarService';
import { feetToCm, metersToCm, cmToFeet, cmToMeters, formatHeight } from '../utils/unitConversion';
import { exercises } from '../models/exercises'; // Import exercises data
import { Spacing, Layout, Shadows, ThemeColorsType, ThemeShadowsType, Typography } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PremiumGate } from '../components/PremiumGate';
import CustomAlert from '../components/CustomAlert';
// Sub-components (extracted for maintainability)
import ProfileCard from '../components/avatar/ProfileCard';
import AppSettings from '../components/avatar/AppSettings';
import BodyMetrics from '../components/avatar/BodyMetrics';
import TeamSection from '../components/avatar/TeamSection';
import StreakGraph from '../components/avatar/StreakGraph';

const COMMON_HEALTH_ISSUES = [
    'knee_pain', 'lower_back_pain', 'shoulder_injury', 'wrist_pain',
    'ankle_injury', 'hip_injury', 'neck_pain', 'heart_condition'
];

// Mockup palette (FitTrack profile)
const MOCK = {
    bgBase: '#0A0B0F',
    bgElevated: '#14161D',
    bgCard: '#1A1D26',
    bgCardHover: '#20242E',
    border: 'rgba(255, 255, 255, 0.06)',
    borderStrong: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#F5F6F8',
    textSecondary: '#9BA0AB',
    textTertiary: '#5C6170',
    accent: '#B8FF3C',
    accentBright: '#D4FF6E',
    accentDim: 'rgba(184, 255, 60, 0.15)',
    accentGlow: 'rgba(184, 255, 60, 0.35)',
    accentBorder: 'rgba(184, 255, 60, 0.3)',
    gold: '#FBBF24',
    goldDim: 'rgba(251, 191, 36, 0.12)',
    goldBorder: 'rgba(251, 191, 36, 0.2)',
    purple: '#A78BFA',
    purpleDim: 'rgba(167, 139, 250, 0.12)',
    purpleBorder: 'rgba(167, 139, 250, 0.15)',
    pink: '#F472B6',
    pinkDim: 'rgba(244, 114, 182, 0.12)',
    orange: '#FB923C',
    orangeDim: 'rgba(251, 146, 60, 0.12)',
    blue: '#60A5FA',
    blueDim: 'rgba(96, 165, 250, 0.12)',
    danger: '#FF5A5F',
    dangerDim: 'rgba(255, 90, 95, 0.1)',
};

const EQUIPMENT_OPTIONS = [
    { id: 'dumbbells', label: 'Dumbbells' },
    { id: 'resistance_bands', label: 'Resistance Bands' },
    { id: 'pull_up_bar', label: 'Pull-up Bar' },
    { id: 'yoga_mat', label: 'Yoga Mat' },
    { id: 'bench', label: 'Bench' },
    { id: 'kettlebells', label: 'Kettlebells' },
];

// Achievements grid: 5 columns × 2 rows (10 achievements). Width is computed
// from the screen so we don't fight % + pixel-gap rounding on narrower devices.
const ACHIEVEMENT_COLS = 5;
const ACHIEVEMENT_GAP = 6;
const ACHIEVEMENT_TILE_WIDTH = Math.floor(
    (Dimensions.get('window').width - 40 /* Spacing.m * 2 */ - ACHIEVEMENT_GAP * (ACHIEVEMENT_COLS - 1)) / ACHIEVEMENT_COLS
);

const formatPremiumExpiry = (date: any): string => {
    try {
        const d = date?.toDate ? date.toDate() : new Date(date);
        if (isNaN(d.getTime())) return '';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${dd} / ${mm} / ${d.getFullYear()}`;
    } catch {
        return '';
    }
};

interface AvatarScreenProps {
    navigation: any;
    isTab?: boolean;
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export default function AvatarScreen({ navigation, isTab, onScroll }: AvatarScreenProps) {
    const dispatch = useAppDispatch();
    const { colors, gradients, shadows, isDark, toggleTheme } = useTheme();
    const { purchased } = useBilling();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    const { user, loading: authLoading } = useAppSelector((state: RootState) => state.auth); // Modified to use RootState
    const { currentPlan, customPlans } = useAppSelector((state) => state.workoutPlan);
    const { avatarScrollOffset } = useAppSelector((state) => state.ui);
    const scrollViewRef = React.useRef<ScrollView>(null);

    // AI Coach FAB Animation logic
    const fabAnim = React.useRef(new Animated.Value(0)).current; // 0 = visible, 100 = hidden
    const lastScrollY = React.useRef(0);
    const isFabHidden = React.useRef(false);

    const handleFabScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const delta = currentScrollY - lastScrollY.current;

        // Threshold to avoid jitter
        if (Math.abs(delta) < 10) return;

        if (delta > 0 && currentScrollY > 50 && !isFabHidden.current) {
            // Scrolling down - hide
            isFabHidden.current = true;
            Animated.timing(fabAnim, {
                toValue: 300, // Increased displacement for full hide
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else if (delta < 0 && isFabHidden.current) {
            // Scrolling up - show
            isFabHidden.current = false;
            Animated.timing(fabAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }

        lastScrollY.current = currentScrollY;
    };
    const [avatarState, setAvatarState] = useState<AvatarState | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [showMetricsModal, setShowMetricsModal] = useState(false);
    const [showUserInfoModal, setShowUserInfoModal] = useState(false);
    const [currentWeight, setCurrentWeight] = useState('');
    const [goalWeight, setGoalWeight] = useState('');
    const [showAllLevels, setShowAllLevels] = useState(false);

    // Edit Profile State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAge, setEditAge] = useState('');
    const [editWeight, setEditWeight] = useState('');
    const [editHeight, setEditHeight] = useState('');
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft' | 'm'>('cm');
    const [editGender, setEditGender] = useState('');
    const [editFitnessGoal, setEditFitnessGoal] = useState<UserProfile['fitnessGoal']>('muscle_gain');
    const [editExperienceLevel, setEditExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [editEquipmentAccess, setEditEquipmentAccess] = useState<'bodyweight' | 'home' | 'gym'>('bodyweight');
    const [editHealthIssues, setEditHealthIssues] = useState<string[]>([]);
    const [editAvailableEquipment, setEditAvailableEquipment] = useState<string[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successType, setSuccessType] = useState<'profile' | 'metrics'>('profile');
    const [showTeamModal, setShowTeamModal] = useState(false);

    // Change Password State
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showRoadmapModal, setShowRoadmapModal] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showSignOutAlert, setShowSignOutAlert] = useState(false);
    const [showDeletePlanAlert, setShowDeletePlanAlert] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<any>(null);
    const [showPermissionAlert, setShowPermissionAlert] = useState(false);

    useEffect(() => {
        loadAvatarState();
        if (user?.uid) {
            dispatch(fetchCustomPlans(user.uid));
        }
    }, [user?.uid]);

    // Restore scroll position when loading finishes
    useEffect(() => {
        if (!loading && avatarScrollOffset > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: avatarScrollOffset, animated: false });
            }, 50); // Reduced delay for snappier feel
        }
    }, [loading]);

    const loadAvatarState = async () => {
        setLoading(true);
        const state = await avatarService.getAvatarState();
        setAvatarState(state);
        if (state?.bodyMetrics.currentWeight) {
            setCurrentWeight(state.bodyMetrics.currentWeight.toString());
        }
        if (state?.bodyMetrics.goalWeight) {
            setGoalWeight(state.bodyMetrics.goalWeight.toString());
        }
        setLoading(false);
    };

    const handlePickImage = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                setShowPermissionAlert(true);
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                showToast('Uploading photo...', 'info');
                await dispatch(uploadPhoto(uri)).unwrap();
                showToast('Profile photo updated!', 'success');
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to update photo', 'error');
        }
    };

    const handleUpdateMetrics = async () => {
        const weight = parseFloat(currentWeight);
        const goal = parseFloat(goalWeight);

        if (isNaN(weight) || weight <= 0) {
            showToast('Please enter a valid weight', 'warning');
            return;
        }

        await avatarService.updateBodyMetrics({
            currentWeight: weight,
            goalWeight: isNaN(goal) ? undefined : goal,
        });

        setShowMetricsModal(false);
        loadAvatarState();
        setSuccessType('metrics');
        setShowSuccessModal(true);
    };

    const handleShareApp = async () => {
        try {
            await Share.share({
                message: "Join me on FIZI! It's an AI-powered personal trainer that adapts to your progress. Download here: https://play.google.com/store/apps/details?id=com.maheshchalla.fizi&pcampaignid=web_share",
            });
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleSignOut = () => {
        setShowSignOutAlert(true);
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill in all fields', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'warning');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'warning');
            return;
        }

        try {
            await dispatch(changePassword({ current: currentPassword, new: newPassword })).unwrap();
            showToast('Password changed successfully', 'success');
            setShowChangePasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            let message = error.message || 'Failed to change password';
            if (message.includes('wrong-password') || message.includes('auth/invalid-credential')) {
                message = 'Incorrect current password';
            } else if (message.includes('weak-password')) {
                message = 'Password must be at least 6 characters';
            } else if (message.includes('requires-recent-login')) {
                message = 'Please sign out and sign in again to change your password';
            }
            showToast(message, 'error');
        }
    };

    const startEditingProfile = () => {
        setEditName(user?.displayName || '');
        setEditWeight(user?.weight?.toString() || '');
        // Initial set based on current unit (default cm)
        setEditHeight(user?.height?.toString() || '');
        // Note: For now we default to cm when opening, but we could persist preference if needed
        setEditAge(user?.age?.toString() || '');
        setEditFitnessGoal(user?.fitnessGoal || 'muscle_gain');
        setEditExperienceLevel(user?.workoutExperience || (user?.fitnessProfile?.experienceLevel as any) || 'beginner');
        setEditEquipmentAccess(user?.fitnessProfile?.equipmentAccess || 'bodyweight');
        setEditHealthIssues(user?.fitnessProfile?.healthIssues || []);
        setEditAvailableEquipment(user?.fitnessProfile?.availableEquipment || []);
        setIsEditingProfile(true);
    };

    const handleSaveProfile = async () => {
        try {
            const updates: Partial<UserProfile> = {
                displayName: editName,
                weight: parseFloat(editWeight) || 0,
                height: heightUnit === 'cm'
                    ? parseFloat(editHeight)
                    : heightUnit === 'ft'
                        ? feetToCm(editHeight)
                        : metersToCm(parseFloat(editHeight)),
                age: parseInt(editAge) || 0,
                fitnessGoal: editFitnessGoal,
                workoutExperience: editExperienceLevel,
                fitnessProfile: {
                    ...(user?.fitnessProfile || {
                        availableDays: 7,
                        fitnessGoals: [editFitnessGoal || 'weight_loss'],
                        healthIssues: [],
                        availableEquipment: [],
                        experienceLevel: editExperienceLevel || 'beginner',
                        equipmentAccess: editEquipmentAccess || 'bodyweight'
                    }),
                    experienceLevel: editExperienceLevel,
                    equipmentAccess: editEquipmentAccess,
                    healthIssues: editHealthIssues,
                    availableEquipment: editAvailableEquipment as any[],
                    availableDays: 7, // Enforce 7-day split
                    fitnessGoals: [editFitnessGoal], // Sync inner goal
                }
            };

            const updatedProfile = await dispatch(updateProfile(updates)).unwrap();

            // 2. Trigger Plan Regeneration with updated profile
            await dispatch(regenerateUserPlan(updatedProfile)).unwrap();

            setIsEditingProfile(false);
            setShowUserInfoModal(false);
            setSuccessType('profile');
            setShowSuccessModal(true);
        } catch (error: any) {
            showToast(error.message || 'Failed to update profile', 'error');
        }
    };

    const toggleEditHealthIssue = (issue: string) => {
        setEditHealthIssues(prev =>
            prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
        );
    };

    const toggleEditEquipment = (equipment: string) => {
        setEditAvailableEquipment(prev =>
            prev.includes(equipment) ? prev.filter(e => e !== equipment) : [...prev, equipment]
        );
    };


    const getAvatarEmoji = (level: number): string => {
        const levelData = AVATAR_LEVELS.find(l => l.level === level);
        return levelData?.icon || '🏃';
    };

    const getProgressToNextLevel = (): { workouts: number; reps: number } | null => {
        if (!avatarState) return null;
        return avatarService.getNextLevelRequirements(avatarState.level);
    };

    const calculateProgress = (current: number, required: number): number => {
        return Math.min(100, Math.round((current / required) * 100));
    };

    if (loading) {
        return (
            <LinearGradient colors={gradients.background} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryStart} />
            </LinearGradient>
        );
    }

    if (!avatarState) {
        return (
            <LinearGradient colors={gradients.background} style={styles.container}>
                <Text style={styles.errorText}>Failed to load avatar</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.backLink}>Go Back</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    const nextLevel = getProgressToNextLevel();

    // Calculate missing body composition metrics on-the-fly if not present
    const getBodyComposition = () => {
        if (!user) return undefined;

        // If bodyComposition exists and has all data, return it
        if (user.bodyComposition?.bmi && user.bodyComposition?.bodyFat && user.bodyComposition?.bmr) {
            return user.bodyComposition;
        }

        // Calculate missing metrics
        const w = user.weight;
        const h = user.height;
        const a = user.age;
        const gender = user.gender || 'male';

        if (!w || !h || !a) return user?.bodyComposition;

        // BMI
        const bmi = w / Math.pow(h / 100, 2);

        // BMR (Mifflin-St Jeor)
        const bmr = gender === 'male'
            ? (10 * w) + (6.25 * h) - (5 * a) + 5
            : (10 * w) + (6.25 * h) - (5 * a) - 161;

        // Body Fat % (Deurenberg)
        const bfPercent = (1.20 * bmi) + (0.23 * a) - (gender === 'male' ? 16.2 : 5.4);
        const bodyFatKg = w * (Math.max(5, Math.min(50, bfPercent)) / 100);

        // Skeletal Muscle
        const lbm = w * (1 - bfPercent / 100);
        const skeletalMuscleKg = lbm * 0.45;

        // Visceral Fat
        const visceralFatRatio = 0.10 + Math.max(0, (bmi - 22) * 0.01);
        const visceralFatKg = bodyFatKg * Math.min(0.30, visceralFatRatio);
        const visceralFatPercent = (visceralFatKg / w) * 100;

        // Trunk Subcutaneous Fat
        const trunkFatKg = bodyFatKg * 0.5;
        const trunkSubcutaneousFatKg = trunkFatKg * 0.85;

        // Body Age
        const baseBMR20 = gender === 'male'
            ? (10 * w) + (6.25 * h) - (5 * 20) + 5
            : (10 * w) + (6.25 * h) - (5 * 20) - 161;
        const decadesAfter20 = Math.max(0, (a - 20) / 10);
        const expectedBMR = baseBMR20 * Math.pow(0.98, decadesAfter20);
        const bmrDeviation = bmr - expectedBMR;
        const bmrDeclinePerYear = baseBMR20 * 0.002;
        const ageAdjustment = bmrDeviation / bmrDeclinePerYear;
        const metabolicAge = Math.round(a - ageAdjustment);

        return {
            bmi: parseFloat(bmi.toFixed(1)),
            bmr: Math.round(bmr),
            bodyFat: parseFloat(bodyFatKg.toFixed(1)),
            visceralFat: parseFloat(Math.max(1, Math.min(15, visceralFatPercent)).toFixed(1)),
            trunkSubcutaneousFat: parseFloat(Math.max(1, Math.min(30, trunkSubcutaneousFatKg)).toFixed(1)),
            bodyAge: Math.max(15, Math.min(100, metabolicAge)),
            skeletalMuscle: parseFloat(Math.max(10, Math.min(50, skeletalMuscleKg)).toFixed(1)),
        };
    };

    const getMetricStatusColor = (type: string, value: number) => {
        if (!user || value === undefined) return colors.textPrimary;
        const gender = user.gender || 'male';
        const age = user.age || 30;

        switch (type) {
            case 'bmi':
                if (value >= 18.5 && value < 25) return colors.accentSuccess;
                if ((value >= 25 && value < 30) || (value < 18.5)) return colors.accentYellow;
                return colors.accentError;
            case 'bodyFat':
                // thresholds in kg, need to convert to % for meaningful comparison with general ranges if possible,
                // but thresholds in my plan were for %, and bodyComp returns kg.
                // Let's recalculate % for the check.
                const bfPercent = (value / (user.weight || 70)) * 100;
                if (gender === 'male') {
                    if (bfPercent >= 10 && bfPercent <= 20) return colors.accentSuccess;
                    if (bfPercent > 20 && bfPercent <= 25) return colors.accentYellow;
                    return colors.accentError;
                } else {
                    if (bfPercent >= 18 && bfPercent <= 28) return colors.accentSuccess;
                    if (bfPercent > 28 && bfPercent <= 33) return colors.accentYellow;
                    return colors.accentError;
                }
            case 'visceralFat':
                if (value < 10) return colors.accentSuccess;
                if (value >= 10 && value < 15) return colors.accentYellow;
                return colors.accentError;
            case 'skeletalMuscle':
                // value is in kg. Calculate % of body weight.
                const smPercent = (value / (user.weight || 70)) * 100;
                if (gender === 'male') {
                    if (smPercent > 40) return colors.accentSuccess;
                    if (smPercent >= 33 && smPercent <= 40) return colors.accentYellow;
                    return colors.accentError;
                } else {
                    if (smPercent > 30) return colors.accentSuccess;
                    if (smPercent >= 24 && smPercent <= 30) return colors.accentYellow;
                    return colors.accentError;
                }
            case 'bodyAge':
                if (value <= age) return colors.accentSuccess;
                if (value <= age + 5) return colors.accentYellow;
                return colors.accentError;
            default:
                return colors.textPrimary;
        }
    };

    const bodyComp = getBodyComposition();

    const ContentWrapper = isTab ? View : LinearGradient;
    const wrapperProps = isTab
        ? { style: [styles.container, { backgroundColor: MOCK.bgBase }] }
        : { colors: gradients.background, style: styles.container };

    return (
        <ContentWrapper {...wrapperProps as any}>
            {!isTab && (
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButtonGeneric}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Hero Journey</Text>
                </View>
            )}

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={isTab ? { paddingTop: 60, paddingBottom: 120 } : undefined}
                onScroll={(e) => {
                    onScroll && onScroll(e);
                    handleFabScroll(e);
                }}
                onMomentumScrollEnd={(e) => {
                    dispatch(setAvatarScrollOffset(e.nativeEvent.contentOffset.y));
                }}
                onScrollEndDrag={(e) => {
                    dispatch(setAvatarScrollOffset(e.nativeEvent.contentOffset.y));
                }}
                scrollEventThrottle={16}
                directionalLockEnabled={true}
            >
                {/* Page Title */}
                {isTab && (
                    <View style={styles.pageTitleRow}>
                        <Text style={styles.pageTitle}>Profile</Text>
                    </View>
                )}

                {/* Profile Hero Card */}
                <ProfileCard
                    user={user}
                    avatarLevelName={avatarState.levelName}
                    avatarLevel={avatarState.level}
                    avatarCurrentStreak={avatarState.currentStreak}
                    authLoading={authLoading}
                    isPremium={purchased}
                    onPickImage={handlePickImage}
                />



                {/* Premium Subscription Card */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('Subscription')}
                    activeOpacity={0.85}
                    style={styles.premiumCard}
                >
                    <View style={styles.premiumLeftBar} />
                    <View style={styles.premiumIcon}>
                        <MaterialCommunityIcons name="crown" size={20} color={MOCK.gold} />
                    </View>
                    <View style={styles.premiumInfo}>
                        <Text style={styles.premiumName}>
                            {purchased ? 'Premium Member' : 'Go Premium'}
                        </Text>
                        <Text style={styles.premiumExpiry}>
                            {purchased
                                ? (user?.premiumExpiryDate
                                    ? `Valid until ${formatPremiumExpiry(user.premiumExpiryDate)}`
                                    : 'Manage Subscription')
                                : 'Unlock AI Analysis & More'}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={MOCK.gold} />
                </TouchableOpacity>

                {/* Quick Links */}
                <View style={styles.mockMenuCard}>
                    <TouchableOpacity
                        onPress={() => setShowUserInfoModal(true)}
                        activeOpacity={0.7}
                        style={[styles.mockMenuItem, styles.mockMenuItemBorder]}
                    >
                        <View style={[styles.mockMenuIcon, styles.mockMenuIconAccent]}>
                            <MaterialCommunityIcons name="account-outline" size={18} color={MOCK.accent} />
                        </View>
                        <View style={styles.mockMenuContent}>
                            <Text style={styles.mockMenuTitle}>User Profile</Text>
                            <Text style={styles.mockMenuDesc}>Personal details & settings</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={MOCK.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('ExerciseLibrary')}
                        activeOpacity={0.7}
                        style={[styles.mockMenuItem, styles.mockMenuItemBorder]}
                    >
                        <View style={[styles.mockMenuIcon, styles.mockMenuIconAccent]}>
                            <MaterialCommunityIcons name="dumbbell" size={18} color={MOCK.accent} />
                        </View>
                        <View style={styles.mockMenuContent}>
                            <Text style={styles.mockMenuTitle}>Exercise Library</Text>
                            <Text style={styles.mockMenuDesc}>Browse all 300+ exercises</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={MOCK.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('UserProfile', { userId: user?.uid })}
                        activeOpacity={0.7}
                        style={styles.mockMenuItem}
                    >
                        <View style={[styles.mockMenuIcon, styles.mockMenuIconAccent]}>
                            <MaterialCommunityIcons name="image-multiple" size={18} color={MOCK.accent} />
                        </View>
                        <View style={styles.mockMenuContent}>
                            <Text style={styles.mockMenuTitle}>My Posts</Text>
                            <Text style={styles.mockMenuDesc}>View your community posts</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={MOCK.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Activity Streak */}
                <StreakGraph />

                {/* AI / Custom Plan Active Card */}
                <View style={styles.aiPlanCard}>
                    <View style={styles.aiPlanGlow} pointerEvents="none">
                        <LinearGradient
                            colors={[MOCK.purpleDim, 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ flex: 1, borderRadius: 80 }}
                        />
                    </View>

                    <View style={styles.aiPlanHeader}>
                        <View style={styles.aiBot}>
                            <MaterialCommunityIcons
                                name={currentPlan?.planType === 'custom' ? 'clipboard-edit' : 'robot'}
                                size={22}
                                color="#FFFFFF"
                            />
                        </View>
                        <View style={styles.aiPlanInfo}>
                            <Text style={styles.aiPlanLabel}>CURRENT STRATEGY</Text>
                            <Text style={styles.aiPlanName}>
                                {currentPlan?.planType === 'custom' ? 'Custom Plan Active' : 'AI Plan Active'}
                            </Text>
                            <Text style={styles.aiPlanMeta}>
                                {currentPlan?.frequency || 7} days/week · {currentPlan?.sessions.filter(s => !s.isRestDay).length || 0} sessions
                            </Text>
                        </View>
                    </View>

                    {currentPlan?.planType !== 'custom' && (
                        <View style={styles.aiPlanTip}>
                            <MaterialCommunityIcons name="creation" size={14} color={MOCK.purple} />
                            <Text style={styles.aiPlanTipText}>Adapts to your progress automatically</Text>
                        </View>
                    )}

                    {currentPlan?.planType === 'custom' ? (
                        <TouchableOpacity
                            style={styles.aiPlanSwitchBtn}
                            activeOpacity={0.85}
                            onPress={async () => {
                                if (user?.uid) {
                                    try {
                                        await dispatch(switchToAIPlan(user.uid)).unwrap();
                                    } catch (err) {
                                        Alert.alert(
                                            'Could not switch to AI plan',
                                            'Please try again in a moment.'
                                        );
                                    }
                                }
                            }}
                        >
                            <MaterialCommunityIcons name="robot" size={14} color={MOCK.textPrimary} />
                            <Text style={styles.aiPlanSwitchText}>SWITCH TO AI STRATEGY</Text>
                        </TouchableOpacity>
                    ) : customPlans.length > 0 ? (
                        <TouchableOpacity
                            style={styles.aiPlanCreateBtn}
                            activeOpacity={0.85}
                            onPress={() => {
                                if (user?.uid) {
                                    const latestPlan = customPlans[0];
                                    dispatch(switchActivePlan({
                                        userId: user.uid,
                                        planId: latestPlan.id,
                                        planType: 'custom'
                                    }));
                                }
                            }}
                        >
                            <MaterialCommunityIcons name="swap-horizontal" size={14} color={MOCK.textPrimary} />
                            <Text style={styles.aiPlanCreateText}>SWITCH TO CUSTOM PLAN</Text>
                        </TouchableOpacity>
                    ) : (
                        <PremiumGate featureName="Custom Plans" navigation={navigation} variant="compact">
                            <TouchableOpacity
                                style={styles.aiPlanCreateBtn}
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate('CustomPlanBuilder')}
                            >
                                <MaterialCommunityIcons name="plus-circle-outline" size={14} color={MOCK.textPrimary} />
                                <Text style={styles.aiPlanCreateText}>CREATE NEW FROM SCRATCH</Text>
                            </TouchableOpacity>
                        </PremiumGate>
                    )}
                </View>

                {/* Saved Plans */}
                <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitleLg}>Saved Plans</Text>
                    <PremiumGate featureName="Custom Plans" navigation={navigation} variant="icon">
                        <TouchableOpacity
                            style={styles.addBtn}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('CustomPlanBuilder')}
                        >
                            <MaterialCommunityIcons name="plus" size={14} color="#0A0B0F" />
                        </TouchableOpacity>
                    </PremiumGate>
                </View>

                {customPlans.length > 0 ? (
                    <View style={{ gap: 12 }}>
                        {customPlans.map((plan) => (
                            <View key={plan.id} style={styles.savedPlanCard}>
                                <View style={{ flex: 1, marginRight: 12 }}>
                                    <Text style={styles.savedPlanName} numberOfLines={1}>{plan.name}</Text>
                                    <Text style={styles.savedPlanMeta} numberOfLines={1}>
                                        {plan.frequency} d/w · {plan.sessions.filter(s => !s.isRestDay).length} sess
                                    </Text>
                                    {currentPlan?.id === plan.id && (
                                        <View style={styles.activePillBadge}>
                                            <Text style={styles.activePillText}>Active</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('CustomPlanBuilder', { plan })}
                                    >
                                        <MaterialCommunityIcons name="pencil" size={18} color={MOCK.accent} />
                                    </TouchableOpacity>
                                    {currentPlan?.id !== plan.id && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (user?.uid) {
                                                    dispatch(switchActivePlan({
                                                        userId: user.uid,
                                                        planId: plan.id,
                                                        planType: 'custom'
                                                    }));
                                                }
                                            }}
                                        >
                                            <MaterialCommunityIcons name="play-circle-outline" size={18} color="#4ADE80" />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        onPress={async () => {
                                            if (user?.uid) {
                                                await dispatch(duplicatePlan({ sourcePlan: plan, userId: user.uid }));
                                            }
                                        }}
                                    >
                                        <MaterialCommunityIcons name="content-copy" size={18} color={MOCK.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setPlanToDelete(plan);
                                            setShowDeletePlanAlert(true);
                                        }}
                                    >
                                        <MaterialCommunityIcons name="delete-outline" size={18} color={MOCK.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={MOCK.textTertiary} />
                        </View>
                        <Text style={styles.emptyTitle}>No custom plans yet</Text>
                        <Text style={styles.emptyDesc}>Create your first custom workout plan</Text>
                    </View>
                )}

                {/* Progress to Next Level */}
                {nextLevel && (
                    <>
                        <View style={styles.sectionHeading}>
                            <Text style={styles.sectionTitleSm}>Next Level Progress</Text>
                            <Text style={styles.sectionMeta}>
                                Lvl {avatarState.level} → {avatarState.level + 1}
                            </Text>
                        </View>

                        <View style={styles.mockProgressCard}>
                            <View style={styles.mockProgressRow}>
                                <View style={styles.mockProgressHeader}>
                                    <Text style={styles.mockProgressLabel}>Workouts</Text>
                                    <Text style={styles.mockProgressValue}>
                                        {avatarState.totalWorkouts} / {nextLevel.workouts}
                                    </Text>
                                </View>
                                <View style={styles.mockProgressBar}>
                                    <LinearGradient
                                        colors={[MOCK.accent, MOCK.accentBright]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[
                                            styles.mockProgressFill,
                                            { width: `${calculateProgress(avatarState.totalWorkouts, nextLevel.workouts)}%` }
                                        ]}
                                    />
                                </View>
                            </View>

                            <View style={[styles.mockProgressRow, { marginBottom: 0 }]}>
                                <View style={styles.mockProgressHeader}>
                                    <Text style={styles.mockProgressLabel}>Total Reps</Text>
                                    <Text style={styles.mockProgressValue}>
                                        {avatarState.totalReps} / {nextLevel.reps}
                                    </Text>
                                </View>
                                <View style={styles.mockProgressBar}>
                                    <LinearGradient
                                        colors={[MOCK.accent, MOCK.accentBright]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[
                                            styles.mockProgressFill,
                                            { width: `${calculateProgress(avatarState.totalReps, nextLevel.reps)}%` }
                                        ]}
                                    />
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Lifetime Stats */}
                <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitleSm}>Lifetime Stats</Text>
                </View>
                <View style={styles.statsGridMock}>
                    {[
                        { label: 'Workouts', value: avatarState.totalWorkouts, icon: 'dumbbell', color: MOCK.accent, bg: MOCK.accentDim },
                        { label: 'Reps', value: avatarState.totalReps, icon: 'repeat', color: MOCK.accent, bg: MOCK.accentDim },
                        { label: 'Time', value: `${avatarState.totalMinutes}m`, icon: 'clock-outline', color: MOCK.accent, bg: MOCK.accentDim },
                        { label: 'Best Streak', value: avatarState.longestStreak, icon: 'fire', color: MOCK.orange, bg: MOCK.orangeDim },
                    ].map((stat, i) => (
                        <View key={i} style={styles.statTile}>
                            <View style={[styles.statTileIcon, { backgroundColor: stat.bg }]}>
                                <MaterialCommunityIcons name={stat.icon as any} size={14} color={stat.color} />
                            </View>
                            <Text style={styles.statTileValue}>{stat.value}</Text>
                            <Text style={styles.statTileLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Body Metrics */}
                <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitleSm}>Body Metrics</Text>
                    <TouchableOpacity onPress={() => setShowMetricsModal(true)}>
                        <Text style={styles.sectionLink}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {avatarState.bodyMetrics.startWeight ? (
                    <View style={styles.bodyMetricsCardFilled}>
                        <View style={styles.bodyMetricItem}>
                            <Text style={styles.bodyMetricLabel}>Start</Text>
                            <Text style={styles.bodyMetricValue}>
                                {avatarState.bodyMetrics.startWeight}<Text style={styles.bodyMetricUnit}>kg</Text>
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="arrow-right" size={16} color={MOCK.textTertiary} />
                        <View style={styles.bodyMetricItem}>
                            <Text style={styles.bodyMetricLabel}>Current</Text>
                            <Text style={styles.bodyMetricValue}>
                                {avatarState.bodyMetrics.currentWeight || '--'}<Text style={styles.bodyMetricUnit}>kg</Text>
                            </Text>
                        </View>
                        {avatarState.bodyMetrics.goalWeight && (
                            <>
                                <MaterialCommunityIcons name="arrow-right" size={16} color={MOCK.textTertiary} />
                                <View style={styles.bodyMetricItem}>
                                    <Text style={styles.bodyMetricLabel}>Goal</Text>
                                    <Text style={[styles.bodyMetricValue, { color: MOCK.accent }]}>
                                        {avatarState.bodyMetrics.goalWeight}<Text style={[styles.bodyMetricUnit, { color: MOCK.accent }]}>kg</Text>
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.bodyMetricsCard}
                        activeOpacity={0.85}
                        onPress={() => setShowMetricsModal(true)}
                    >
                        <View style={styles.bodyMetricsIcon}>
                            <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={MOCK.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bodyMetricsTitle}>Track your progress</Text>
                            <Text style={styles.bodyMetricsDesc}>Add weight, height, body fat & more</Text>
                        </View>
                        <Text style={styles.bodyMetricsAdd}>+ ADD</Text>
                    </TouchableOpacity>
                )}

                {/* Achievements */}
                <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitleLg}>Achievements</Text>
                    <Text style={styles.sectionMeta}>
                        {avatarState.achievements.length} / {ACHIEVEMENTS.length} unlocked
                    </Text>
                </View>
                <View style={styles.achievementsGridMock}>
                    {ACHIEVEMENTS.map((achievement) => {
                        const isEarned = avatarState.achievements.includes(achievement.id);
                        return (
                            <View
                                key={achievement.id}
                                style={[
                                    styles.achievementMock,
                                    !isEarned && styles.achievementMockLocked,
                                ]}
                            >
                                <View style={[
                                    styles.achievementMockIcon,
                                    isEarned && { backgroundColor: MOCK.accentDim },
                                ]}>
                                    <Text style={[
                                        { fontSize: 18 },
                                        !isEarned && { opacity: 0.35 },
                                    ]}>
                                        {achievement.icon}
                                    </Text>
                                </View>
                                {!isEarned && (
                                    <View style={styles.achievementLockBadge}>
                                        <MaterialCommunityIcons name="lock" size={8} color={MOCK.textTertiary} />
                                    </View>
                                )}
                                <Text
                                    style={[
                                        styles.achievementMockName,
                                        !isEarned && { color: MOCK.textTertiary },
                                    ]}
                                    numberOfLines={2}
                                >
                                    {achievement.name}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Community */}
                <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitleSm}>Community</Text>
                </View>
                <View style={styles.mockMenuCard}>
                    <TouchableOpacity
                        onPress={() => setShowTeamModal(true)}
                        activeOpacity={0.7}
                        style={[styles.mockMenuItem, styles.mockMenuItemBorder]}
                    >
                        <View style={[styles.mockMenuIcon, { backgroundColor: MOCK.pinkDim }]}>
                            <MaterialCommunityIcons name="account-group-outline" size={18} color={MOCK.pink} />
                        </View>
                        <View style={styles.mockMenuContent}>
                            <Text style={styles.mockMenuTitle}>My Team</Text>
                            <Text style={styles.mockMenuDesc}>Connect with friends & stay motivated</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={MOCK.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleShareApp}
                        activeOpacity={0.7}
                        style={[styles.mockMenuItem, styles.mockMenuItemBorder]}
                    >
                        <View style={[styles.mockMenuIcon, styles.mockMenuIconNeutral]}>
                            <MaterialCommunityIcons name="share-variant-outline" size={18} color={MOCK.textSecondary} />
                        </View>
                        <View style={styles.mockMenuContent}>
                            <Text style={styles.mockMenuTitle}>Refer a Friend</Text>
                            <Text style={styles.mockMenuDesc}>Share FIZI & earn rewards</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={MOCK.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => Linking.openURL(
                            Platform.OS === 'android'
                                ? 'https://play.google.com/store/apps/details?id=com.maheshchalla.fizi'
                                : 'https://apps.apple.com/app/idYOUR_APP_ID'
                        )}
                        activeOpacity={0.7}
                        style={styles.mockMenuItem}
                    >
                        <View style={[styles.mockMenuIcon, { backgroundColor: MOCK.goldDim }]}>
                            <MaterialCommunityIcons name="star-outline" size={18} color={MOCK.gold} />
                        </View>
                        <View style={styles.mockMenuContent}>
                            <Text style={styles.mockMenuTitle}>Rate Our App</Text>
                            <Text style={styles.mockMenuDesc}>Tell us what you think</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={MOCK.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Progression */}
                <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitleSm}>Progression</Text>
                </View>
                <View style={styles.mockMenuCard}>
                    <TouchableOpacity
                        style={styles.mockMenuItem}
                        onPress={() => setShowRoadmapModal(true)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.mockMenuIcon, styles.mockMenuIconAccent]}>
                            <MaterialCommunityIcons name="map-marker-path" size={18} color={MOCK.accent} />
                        </View>
                        <View style={styles.mockMenuContent}>
                            <Text style={styles.mockMenuTitle}>Level Map & Unlocks</Text>
                            <Text style={styles.mockMenuDesc}>See your journey ahead</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={MOCK.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Settings — now in AppSettings sub-component */}
                <AppSettings
                    onChangePassword={() => setShowChangePasswordModal(true)}
                    onShareApp={handleShareApp}
                    onSignOut={() => setShowSignOutAlert(true)}
                    navigation={navigation}
                />

                {/* Health Disclaimer */}
                <View style={styles.disclaimerContainer}>
                    <Text style={styles.disclaimerText}>
                        Disclaimer: This app provides general fitness guidance only. It is not a medical application. Consult a qualified professional before starting any workout program.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Team Section Modal */}
            <TeamSection 
                userId={user?.uid} 
                visible={showTeamModal} 
                onClose={() => setShowTeamModal(false)}
            />

            {/* User Info Modal */}
            {
                showUserInfoModal && (
                    <BlurView intensity={80} tint={isDark ? "light" : "dark"} style={styles.modalOverlay}>
                        <View style={[styles.modal, { maxHeight: '80%' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Registration Details</Text>
                                <TouchableOpacity
                                    style={styles.closeModalButton}
                                    onPress={() => setShowUserInfoModal(false)}
                                >
                                    <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Personal Details */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={styles.modalSectionTitle}>Personal Details</Text>
                                    <TouchableOpacity onPress={isEditingProfile ? handleSaveProfile : startEditingProfile}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <MaterialCommunityIcons
                                                name={isEditingProfile ? "check" : "pencil"}
                                                size={16}
                                                color={colors.primaryStart}
                                            />
                                            <Text style={{ color: colors.primaryStart, fontWeight: '600' }}>
                                                {isEditingProfile ? 'Save' : 'Edit'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Name</Text>
                                    {isEditingProfile ? (
                                        <TextInput
                                            style={styles.editInput}
                                            value={editName}
                                            onChangeText={setEditName}
                                            placeholder="Name"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{user?.displayName || '--'}</Text>
                                    )}
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Age</Text>
                                    {isEditingProfile ? (
                                        <TextInput
                                            style={styles.editInput}
                                            value={editAge}
                                            onChangeText={setEditAge}
                                            keyboardType="number-pad"
                                            placeholder="Age"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{user?.age || '--'} years</Text>
                                    )}
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Gender</Text>
                                    {isEditingProfile ? (
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <TouchableOpacity onPress={() => setEditGender('male')}>
                                                <Text style={[styles.infoValue, editGender === 'male' && { color: colors.primaryStart }]}>Male</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.infoValue}>|</Text>
                                            <TouchableOpacity onPress={() => setEditGender('female')}>
                                                <Text style={[styles.infoValue, editGender === 'female' && { color: colors.primaryStart }]}>Female</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>{user?.gender || '--'}</Text>
                                    )}
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Weight</Text>
                                    {isEditingProfile ? (
                                        <TextInput
                                            style={styles.editInput}
                                            value={editWeight}
                                            onChangeText={setEditWeight}
                                            keyboardType="decimal-pad"
                                            placeholder="kg"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{user?.weight || '--'} kg</Text>
                                    )}
                                </View>
                                <View style={styles.infoRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Text style={[styles.infoLabel, { flex: 0, marginRight: 8 }]}>Height</Text>

                                        {isEditingProfile && (
                                            <View style={styles.unitSelector}>
                                                {(['cm', 'ft', 'm'] as const).map((unit) => (
                                                    <TouchableOpacity
                                                        key={unit}
                                                        style={[styles.unitButton, heightUnit === unit && styles.unitButtonActive]}
                                                        onPress={() => {
                                                            // Convert current value to new unit when switching
                                                            let newHeight = editHeight;
                                                            // First convert to cm
                                                            let cmVal = 0;
                                                            if (heightUnit === 'cm') cmVal = parseFloat(editHeight) || 0;
                                                            else if (heightUnit === 'ft') cmVal = feetToCm(editHeight);
                                                            else cmVal = metersToCm(parseFloat(editHeight));

                                                            setHeightUnit(unit);

                                                            // Then convert to new unit
                                                            if (unit === 'cm') newHeight = cmVal.toString();
                                                            else if (unit === 'ft') newHeight = cmToFeet(cmVal);
                                                            else newHeight = cmToMeters(cmVal).toString();

                                                            setEditHeight(newHeight);
                                                        }}
                                                    >
                                                        <Text style={[styles.unitText, heightUnit === unit && styles.unitTextActive]}>{unit}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    {isEditingProfile ? (
                                        <TextInput
                                            style={styles.editInput}
                                            value={editHeight}
                                            onChangeText={setEditHeight}
                                            keyboardType={heightUnit === 'ft' ? 'default' : 'numeric'}
                                            placeholder={heightUnit}
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{formatHeight(user?.height || 0, heightUnit)}</Text>
                                    )}
                                </View>

                                {/* Body Composition */}
                                <Text style={styles.modalSectionTitle}>Body Composition</Text>
                                <Text style={[styles.summaryInfo, { fontSize: 11, marginBottom: 8, fontStyle: 'italic' }]}>
                                    Your Current vs. Healthy Range
                                </Text>

                                <View style={styles.infoRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>Current BMI</Text>
                                        <Text style={[styles.infoValue, { color: getMetricStatusColor('bmi', bodyComp?.bmi || 0) }]}>{bodyComp?.bmi?.toFixed(1) || '--'}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text style={[styles.infoLabel, { fontSize: 11 }]}>Healthy Range</Text>
                                        <Text style={[styles.infoValue, { fontSize: 12, color: colors.accentSuccess }]}>18.5 - 24.9</Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>Body Fat</Text>
                                        <Text style={[styles.infoValue, { color: getMetricStatusColor('bodyFat', bodyComp?.bodyFat || 0) }]}>{bodyComp?.bodyFat || '--'} kg</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text style={[styles.infoLabel, { fontSize: 11 }]}>Healthy Range</Text>
                                        <Text style={[styles.infoValue, { fontSize: 12, color: colors.accentSuccess }]}>
                                            {user?.gender === 'male' ? '10-20%' : '18-28%'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>BMR</Text>
                                        <Text style={styles.infoValue}>{bodyComp?.bmr || '--'} kcal</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text style={[styles.infoLabel, { fontSize: 11 }]}>Daily Calories</Text>
                                        <Text style={[styles.infoValue, { fontSize: 12, color: colors.textSecondary }]}>Base metabolism</Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>Visceral Fat</Text>
                                        <Text style={[styles.infoValue, { color: getMetricStatusColor('visceralFat', bodyComp?.visceralFat || 0) }]}>{bodyComp?.visceralFat || '--'}%</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text style={[styles.infoLabel, { fontSize: 11 }]}>Healthy Range</Text>
                                        <Text style={[styles.infoValue, { fontSize: 12, color: colors.accentSuccess }]}>{'<10%'}</Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>Skeletal Muscle</Text>
                                        <Text style={[styles.infoValue, { color: getMetricStatusColor('skeletalMuscle', bodyComp?.skeletalMuscle || 0) }]}>{bodyComp?.skeletalMuscle || '--'} kg</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text style={[styles.infoLabel, { fontSize: 11 }]}>Healthy Range</Text>
                                        <Text style={[styles.infoValue, { fontSize: 12, color: colors.accentSuccess }]}>
                                            {user?.gender === 'male' ? '>40% body wt' : '>30% body wt'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>Body Age</Text>
                                        <Text style={[styles.infoValue, { color: getMetricStatusColor('bodyAge', bodyComp?.bodyAge || 0) }]}>{bodyComp?.bodyAge || '--'} years</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text style={[styles.infoLabel, { fontSize: 11 }]}>Target</Text>
                                        <Text style={[styles.infoValue, { fontSize: 12, color: colors.accentSuccess }]}>
                                            Equal to age ({user?.age || '--'})
                                        </Text>
                                    </View>
                                </View>

                                {/* Fitness Profile */}
                                <Text style={styles.modalSectionTitle}>Fitness Profile</Text>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Primary Goal</Text>
                                    {isEditingProfile ? (
                                        <View style={styles.editOptionsContainer}>
                                            {[
                                                { value: 'weight_loss', label: 'Loss' },
                                                { value: 'muscle_gain', label: 'Gain' },
                                                { value: 'endurance', label: 'Endure' },
                                                { value: 'flexibility', label: 'Flex' },
                                            ].map(goal => (
                                                <TouchableOpacity
                                                    key={goal.value}
                                                    onPress={() => setEditFitnessGoal(goal.value as any)}
                                                    style={[styles.editOptionChip, editFitnessGoal === goal.value && styles.editOptionChipActive]}
                                                >
                                                    <Text style={[styles.editOptionText, editFitnessGoal === goal.value && styles.editOptionTextActive]}>{goal.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                                            {user?.fitnessGoal?.replace('_', ' ') || '--'}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Experience</Text>
                                    {isEditingProfile ? (
                                        <View style={styles.editOptionsContainer}>
                                            {['beginner', 'intermediate', 'advanced'].map(exp => (
                                                <TouchableOpacity
                                                    key={exp}
                                                    onPress={() => setEditExperienceLevel(exp as any)}
                                                    style={[styles.editOptionChip, editExperienceLevel === exp && styles.editOptionChipActive]}
                                                >
                                                    <Text style={[styles.editOptionText, editExperienceLevel === exp && styles.editOptionTextActive]}>{exp.charAt(0).toUpperCase() + exp.slice(1, 3)}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                                            {user?.fitnessProfile?.experienceLevel || user?.workoutExperience || '--'}
                                        </Text>
                                    )}
                                </View>

                                {/* Equipment & Health */}
                                <Text style={styles.modalSectionTitle}>Environment & Health</Text>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Location</Text>
                                    {isEditingProfile ? (
                                        <View style={styles.editOptionsContainer}>
                                            {[
                                                { value: 'bodyweight', label: 'Home' },
                                                { value: 'home', label: 'Equip' },
                                                { value: 'gym', label: 'Gym' },
                                            ].map(loc => (
                                                <TouchableOpacity
                                                    key={loc.value}
                                                    onPress={() => setEditEquipmentAccess(loc.value as any)}
                                                    style={[styles.editOptionChip, editEquipmentAccess === loc.value && styles.editOptionChipActive]}
                                                >
                                                    <Text style={[styles.editOptionText, editEquipmentAccess === loc.value && styles.editOptionTextActive]}>{loc.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                                            {user?.fitnessProfile?.equipmentAccess || '--'}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Health Issues</Text>
                                    {isEditingProfile ? (
                                        <View style={styles.tagContainer}>
                                            {COMMON_HEALTH_ISSUES.map((issue) => (
                                                <TouchableOpacity
                                                    key={issue}
                                                    style={[
                                                        styles.infoTag,
                                                        editHealthIssues.includes(issue) && { backgroundColor: colors.accentError + '33' }
                                                    ]}
                                                    onPress={() => toggleEditHealthIssue(issue)}
                                                >
                                                    <Text style={[
                                                        styles.tagText,
                                                        editHealthIssues.includes(issue) && { color: colors.accentError }
                                                    ]}>
                                                        {issue.replace('_', ' ')}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <View style={styles.tagContainer}>
                                            {user?.fitnessProfile?.healthIssues && user.fitnessProfile.healthIssues.length > 0 ? (
                                                user.fitnessProfile.healthIssues.map((issue, idx) => (
                                                    <View key={idx} style={styles.infoTag}>
                                                        <Text style={styles.tagText}>{issue.replace('_', ' ')}</Text>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.infoValue}>None declared</Text>
                                            )}
                                        </View>
                                    )}
                                </View>
                                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                                    <Text style={styles.infoLabel}>Equipment</Text>
                                    {isEditingProfile ? (
                                        <View style={styles.tagContainer}>
                                            {EQUIPMENT_OPTIONS.map((eq) => (
                                                <TouchableOpacity
                                                    key={eq.id}
                                                    style={[
                                                        styles.infoTag,
                                                        editAvailableEquipment.includes(eq.id) && { backgroundColor: colors.accentCyan + '33' }
                                                    ]}
                                                    onPress={() => toggleEditEquipment(eq.id)}
                                                >
                                                    <Text style={[
                                                        styles.tagText,
                                                        editAvailableEquipment.includes(eq.id) && { color: colors.accentCyan }
                                                    ]}>
                                                        {eq.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <View style={styles.tagContainer}>
                                            {user?.fitnessProfile?.availableEquipment && user.fitnessProfile.availableEquipment.length > 0 ? (
                                                user.fitnessProfile.availableEquipment.map((eq, idx) => (
                                                    <View key={idx} style={[styles.infoTag, { backgroundColor: 'rgba(7, 185, 231, 0.1)' }]}>
                                                        <Text style={[styles.tagText, { color: colors.accentCyan }]}>{eq.replace('_', ' ')}</Text>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.infoValue}>Bodyweight only</Text>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </ScrollView>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    if (isEditingProfile) {
                                        handleSaveProfile();
                                    } else {
                                        setShowUserInfoModal(false);
                                    }
                                }}
                                style={{ marginTop: 20 }}
                            >
                                <LinearGradient
                                    colors={gradients.primary}
                                    style={styles.saveButton}
                                >
                                    <Text style={styles.saveButtonText}>
                                        {isEditingProfile ? 'Save & Return to Profile' : 'Back to Profile'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                )
            }

            {/* Metrics Modal */}
            {
                showMetricsModal && (
                    <BlurView intensity={50} tint={isDark ? "light" : "dark"} style={styles.modalOverlay}>
                        <View style={styles.modal}>
                            <Text style={styles.modalTitle}>Update Body Metrics</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Current Weight (kg)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={currentWeight}
                                    onChangeText={setCurrentWeight}
                                    keyboardType="numeric"
                                    placeholder="e.g., 75"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Goal Weight (kg) - Optional</Text>
                                <TextInput
                                    style={styles.input}
                                    value={goalWeight}
                                    onChangeText={setGoalWeight}
                                    keyboardType="numeric"
                                    placeholder="e.g., 70"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setShowMetricsModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handleUpdateMetrics}
                                    style={{ flex: 1 }}
                                >
                                    <LinearGradient
                                        colors={gradients.primary}
                                        style={styles.saveButton}
                                    >
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                )
            }

            {/* Change Password Modal */}
            {
                showChangePasswordModal && (
                    <BlurView intensity={50} tint={isDark ? "light" : "dark"} style={styles.modalOverlay}>
                        <View style={styles.modal}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Change Password</Text>
                                <TouchableOpacity
                                    style={styles.closeModalButton}
                                    onPress={() => setShowChangePasswordModal(false)}
                                >
                                    <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Current Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry
                                    placeholder="Enter current password"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>New Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                    placeholder="Enter new password (min 6 chars)"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Confirm New Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    placeholder="Confirm new password"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handleChangePassword}
                                    style={{ flex: 1 }}
                                >
                                    <LinearGradient
                                        colors={gradients.primary}
                                        style={styles.saveButton}
                                    >
                                        <Text style={styles.saveButtonText}>Update Password</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                )
            }

            {/* Roadmap Modal */}
            {
                showRoadmapModal && (
                    <BlurView intensity={80} tint={isDark ? "light" : "dark"} style={styles.modalOverlay}>
                        <View style={[styles.modal, { maxHeight: '80%' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Level Roadmap</Text>
                                <TouchableOpacity
                                    style={styles.closeModalButton}
                                    onPress={() => setShowRoadmapModal(false)}
                                >
                                    <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {
                                    AVATAR_LEVELS.map((level) => {
                                        const levelExercises = exercises.filter(e => e.unlockLevel === level.level);
                                        return (
                                            <View
                                                key={level.level}
                                                style={[
                                                    styles.roadmapItem,
                                                    avatarState.level >= level.level && styles.roadmapItemActive,
                                                    avatarState.level === level.level && styles.roadmapItemCurrent
                                                ]}
                                            >
                                                <Text style={styles.roadmapIcon}>{level.icon}</Text>
                                                <View style={styles.roadmapInfo}>
                                                    <Text style={[
                                                        styles.roadmapName,
                                                        avatarState.level >= level.level && styles.roadmapNameActive
                                                    ]}>
                                                        Lv.{level.level} - {level.name}
                                                    </Text>
                                                    <Text style={styles.roadmapReq}>
                                                        {level.minWorkouts} workouts • {level.minReps} reps
                                                    </Text>

                                                    {/* Unlocked Exercises List */}
                                                    {levelExercises.length > 0 && (
                                                        <View style={styles.unlockedExercisesContainer}>
                                                            <Text style={styles.unlockedLabel}>Unlocks:</Text>
                                                            <View style={styles.unlockedList}>
                                                                {levelExercises.map((ex: any) => (
                                                                    <Text key={ex.id} style={styles.unlockedItem}>• {ex.displayName}</Text>
                                                                ))}
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                                {avatarState.level >= level.level && (
                                                    <Text style={styles.roadmapCheck}>✓</Text>
                                                )}
                                            </View>
                                        );
                                    })
                                }
                            </ScrollView>
                        </View>
                    </BlurView>
                )
            }

            {/* Success Modal */}
            {
                showSuccessModal && (
                    <BlurView intensity={80} tint={isDark ? "light" : "dark"} style={styles.modalOverlay}>
                        <View style={styles.successModal}>
                            <View style={styles.successIconContainer}>
                                <Text style={styles.successIcon}>✨</Text>
                            </View>
                            <Text style={styles.successTitle}>
                                {successType === 'profile' ? 'Profile Updated!' : 'Metrics Updated!'}
                            </Text>
                            <Text style={styles.successMessage}>
                                {successType === 'profile'
                                    ? 'Your profile and workout plan have been updated successfully.'
                                    : 'Your body stats have been logged successfully. Keep up the good work!'}
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setShowSuccessModal(false)}
                                style={{ width: '100%', marginTop: 24 }}
                            >
                                <LinearGradient
                                    colors={gradients.primary}
                                    style={styles.successButton}
                                >
                                    <Text style={styles.successButtonText}>Awesome!</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                )
            }

            {/* Branded Alerts */}
            <CustomAlert
                visible={showSignOutAlert}
                title="Sign Out"
                message="Are you sure you want to sign out of your account?"
                type="warning"
                onDismiss={() => setShowSignOutAlert(false)}
                buttons={[
                    { text: 'Cancel', style: 'cancel', onPress: () => setShowSignOutAlert(false) },
                    {
                        text: 'Sign Out',
                        onPress: async () => {
                            try {
                                await dispatch(signOut()).unwrap();
                                showToast('Signed out successfully', 'success');
                            } catch (error: any) {
                                showToast(error.message || 'Failed to sign out', 'error');
                            }
                        }
                    }
                ]}
            />

            <CustomAlert
                visible={showDeletePlanAlert}
                title="Delete Plan"
                message={`Are you sure you want to delete "${planToDelete?.name}"? This action cannot be undone.`}
                type="warning"
                onDismiss={() => {
                    setShowDeletePlanAlert(false);
                    setPlanToDelete(null);
                }}
                buttons={[
                    {
                        text: 'Cancel', style: 'cancel', onPress: () => {
                            setShowDeletePlanAlert(false);
                            setPlanToDelete(null);
                        }
                    },
                    {
                        text: 'Delete',
                        onPress: () => {
                            if (planToDelete) {
                                dispatch(deleteCustomPlan(planToDelete.id));
                            }
                        }
                    }
                ]}
            />

            <CustomAlert
                visible={showPermissionAlert}
                title="Permission Required"
                message="Please allow access to your photos in settings to upload a profile picture."
                type="info"
                onDismiss={() => setShowPermissionAlert(false)}
                buttons={[
                    { text: 'Got it', onPress: () => setShowPermissionAlert(false) }
                ]}
            />

            {/* AI Coach FAB */}
            <Animated.View style={[
                styles.fab,
                {
                    shadowColor: colors.primaryStart,
                    transform: [{ translateY: fabAnim }]
                }
            ]}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Chatbot')}
                    activeOpacity={0.8}
                    style={{ width: '100%', height: '100%' }}
                >
                    <LinearGradient
                        colors={[colors.primaryStart, colors.primaryEnd]}
                        style={styles.fabGradient}
                    >
                        <MaterialCommunityIcons name="robot" size={28} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </ContentWrapper >
    );
}

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType) => StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: colors.accentError,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 100,
    },
    backLink: {
        color: colors.primaryStart,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: Spacing.m,
        paddingBottom: Spacing.m,
    },
    backButtonGeneric: {
        marginRight: Spacing.m,
    },
    backButton: {
        color: colors.accentCyan,
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.textPrimary,
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.m,
    },

    // -------- Mockup styles (FitTrack profile) --------
    pageTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
        paddingHorizontal: 4,
        marginTop: 8,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: MOCK.textPrimary,
        letterSpacing: -0.6,
    },

    // Premium card
    premiumCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: 'rgba(251, 191, 36, 0.06)',
        borderWidth: 1,
        borderColor: MOCK.goldBorder,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 22,
        position: 'relative',
        overflow: 'hidden',
    },
    premiumLeftBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 3,
        height: '100%',
        backgroundColor: MOCK.gold,
    },
    premiumIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: MOCK.goldDim,
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumInfo: { flex: 1 },
    premiumName: {
        fontSize: 15,
        fontWeight: '700',
        color: MOCK.textPrimary,
        marginBottom: 1,
        letterSpacing: -0.1,
    },
    premiumExpiry: {
        fontSize: 11,
        color: MOCK.textSecondary,
    },

    // Generic mock menu cards (rows of items)
    mockMenuCard: {
        backgroundColor: MOCK.bgCard,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: MOCK.border,
        overflow: 'hidden',
    },
    mockMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    mockMenuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: MOCK.border,
    },
    mockMenuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mockMenuIconAccent: {
        backgroundColor: MOCK.accentDim,
    },
    mockMenuIconNeutral: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    mockMenuContent: { flex: 1, minWidth: 0 },
    mockMenuTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: MOCK.textPrimary,
        marginBottom: 1,
        letterSpacing: -0.1,
    },
    mockMenuDesc: {
        fontSize: 11,
        color: MOCK.textSecondary,
    },

    // AI Plan Card
    aiPlanCard: {
        backgroundColor: MOCK.bgCard,
        borderWidth: 1,
        borderColor: MOCK.purpleBorder,
        borderRadius: 22,
        padding: 18,
        marginTop: 14,
        position: 'relative',
        overflow: 'hidden',
    },
    aiPlanGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
    },
    aiPlanHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        marginBottom: 14,
    },
    aiBot: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: MOCK.purple,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: MOCK.purple,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    aiPlanInfo: { flex: 1 },
    aiPlanLabel: {
        fontSize: 10,
        color: MOCK.textTertiary,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 2,
    },
    aiPlanName: {
        fontSize: 19,
        fontWeight: '800',
        color: MOCK.textPrimary,
        letterSpacing: -0.4,
        lineHeight: 22,
        marginBottom: 4,
    },
    aiPlanMeta: {
        fontSize: 12,
        color: MOCK.textSecondary,
    },
    aiPlanTip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(167, 139, 250, 0.08)',
        borderWidth: 1,
        borderColor: MOCK.purpleBorder,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    aiPlanTipText: {
        fontSize: 12,
        color: MOCK.textSecondary,
        flex: 1,
    },
    aiPlanCreateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: MOCK.borderStrong,
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 12,
        width: '100%',
    },
    aiPlanCreateText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.6,
        color: MOCK.textPrimary,
    },
    aiPlanSwitchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: MOCK.pinkDim,
        borderWidth: 1,
        borderColor: 'rgba(244, 114, 182, 0.3)',
        borderRadius: 12,
        paddingVertical: 12,
        width: '100%',
    },
    aiPlanSwitchText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.6,
        color: MOCK.textPrimary,
    },

    // Section headings
    sectionHeading: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 22,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitleSm: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        color: MOCK.textTertiary,
    },
    sectionTitleLg: {
        fontSize: 18,
        fontWeight: '700',
        color: MOCK.textPrimary,
        letterSpacing: -0.4,
    },
    sectionMeta: {
        fontSize: 11,
        color: MOCK.textSecondary,
    },
    sectionLink: {
        fontSize: 12,
        color: MOCK.accent,
        fontWeight: '600',
    },
    addBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: MOCK.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: MOCK.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },

    // Saved plan card (when present)
    savedPlanCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: MOCK.bgCard,
        borderWidth: 1,
        borderColor: MOCK.border,
        borderRadius: 18,
        padding: 16,
    },
    savedPlanName: {
        fontSize: 16,
        fontWeight: '700',
        color: MOCK.textPrimary,
        letterSpacing: -0.2,
        marginBottom: 4,
    },
    savedPlanMeta: {
        fontSize: 12,
        color: MOCK.textSecondary,
    },
    activePillBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 100,
        backgroundColor: 'rgba(74, 222, 128, 0.15)',
        marginTop: 6,
    },
    activePillText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4ADE80',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },

    // Empty state (saved plans)
    emptyState: {
        backgroundColor: MOCK.bgCard,
        borderWidth: 1,
        borderColor: MOCK.borderStrong,
        borderStyle: 'dashed',
        borderRadius: 16,
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    emptyIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: MOCK.textPrimary,
        marginBottom: 4,
    },
    emptyDesc: {
        fontSize: 12,
        color: MOCK.textSecondary,
        textAlign: 'center',
    },

    // Progress card (mock)
    mockProgressCard: {
        backgroundColor: MOCK.bgCard,
        borderWidth: 1,
        borderColor: MOCK.border,
        borderRadius: 18,
        padding: 18,
    },
    mockProgressRow: {
        marginBottom: 14,
    },
    mockProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6,
    },
    mockProgressLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: MOCK.textPrimary,
    },
    mockProgressValue: {
        fontSize: 13,
        fontWeight: '700',
        color: MOCK.accent,
        fontVariant: ['tabular-nums'],
    },
    mockProgressBar: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 100,
        overflow: 'hidden',
    },
    mockProgressFill: {
        height: 6,
        borderRadius: 100,
    },

    // Stats grid (4 cols)
    statsGridMock: {
        flexDirection: 'row',
        gap: 8,
    },
    statTile: {
        flex: 1,
        backgroundColor: MOCK.bgCard,
        borderWidth: 1,
        borderColor: MOCK.border,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    statTileIcon: {
        width: 26,
        height: 26,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statTileValue: {
        fontSize: 18,
        fontWeight: '800',
        color: MOCK.textPrimary,
        letterSpacing: -0.4,
        lineHeight: 20,
    },
    statTileLabel: {
        fontSize: 10,
        color: MOCK.textSecondary,
        marginTop: 3,
    },

    // Body metrics card (empty)
    bodyMetricsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: MOCK.bgCard,
        borderWidth: 1,
        borderColor: MOCK.border,
        borderRadius: 18,
        padding: 16,
    },
    bodyMetricsCardFilled: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: MOCK.bgCard,
        borderWidth: 1,
        borderColor: MOCK.border,
        borderRadius: 18,
        padding: 16,
    },
    bodyMetricsIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: MOCK.accentDim,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bodyMetricsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: MOCK.textPrimary,
        marginBottom: 1,
    },
    bodyMetricsDesc: {
        fontSize: 11,
        color: MOCK.textSecondary,
    },
    bodyMetricsAdd: {
        fontSize: 12,
        fontWeight: '700',
        color: MOCK.accent,
        letterSpacing: 0.4,
    },
    bodyMetricItem: {
        alignItems: 'center',
    },
    bodyMetricLabel: {
        fontSize: 11,
        color: MOCK.textSecondary,
        marginBottom: 2,
    },
    bodyMetricValue: {
        fontSize: 18,
        fontWeight: '800',
        color: MOCK.textPrimary,
        letterSpacing: -0.4,
    },
    bodyMetricUnit: {
        fontSize: 11,
        fontWeight: '500',
        color: MOCK.textSecondary,
    },

    // Achievements grid (5 cols × 2 rows)
    achievementsGridMock: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: ACHIEVEMENT_GAP,
        rowGap: 10,
    },
    achievementMock: {
        width: ACHIEVEMENT_TILE_WIDTH,
        aspectRatio: 0.85,
        backgroundColor: MOCK.bgCard,
        borderWidth: 1,
        borderColor: MOCK.border,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        gap: 6,
    },
    achievementMockLocked: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.04)',
    },
    achievementLockBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 14,
        height: 14,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    achievementMockIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    achievementMockName: {
        fontSize: 9,
        fontWeight: '700',
        color: MOCK.textPrimary,
        textAlign: 'center',
        lineHeight: 11,
        letterSpacing: -0.1,
        paddingHorizontal: 2,
    },
    // -------- end mockup styles --------

    // deleted sectionTitle

    // Avatar Card Styles
    avatarCardWrapper: {
        marginBottom: Spacing.m,
        borderRadius: Layout.borderRadius.xl,
        ...shadows.glow, // Outer glow
        shadowColor: colors.primaryStart,
        shadowOpacity: 0.25,
        shadowRadius: 16,
    },
    avatarCard: {
        marginBottom: Spacing.m,
        borderRadius: Layout.borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    avatarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    avatarContainer: {
        marginRight: 20,
    },
    avatarRing: {
        width: 74,
        height: 74,
        borderRadius: 37,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3, // Ring thickness
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 34,
        borderWidth: 2,
        borderColor: colors.backgroundDark, // Separate image from ring
    },
    defaultAvatarContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 34,
        backgroundColor: colors.glassSurface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.backgroundDark,
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 34,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.accentCyan,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.backgroundDark,
        ...shadows.small,
    },
    editIconText: {
        fontSize: 14,
    },
    userInfoSection: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 22,
        fontWeight: '900', // Ultrabold
        color: colors.textPrimary,
        marginBottom: 2,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    userTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    levelBadgeContainer: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20, // Pill shape
        borderWidth: 1,
        borderColor: colors.accentCyan + '50',
    },
    levelBadgeText: {
        fontSize: 12,
        color: colors.accentCyan,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    streakBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20, // Pill shape
        borderWidth: 1,
        borderColor: 'rgba(255, 120, 100, 0.4)',
        gap: 6,
    },
    streakEmoji: {
        fontSize: 12,
    },
    streakBadgeText: {
        color: '#FF7864',
        fontSize: 13,
        fontWeight: '800',
    },

    // Progress Card
    progressCard: {
        borderRadius: Layout.borderRadius.l,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
        ...shadows.card,
    },
    progressItem: {
        marginBottom: Spacing.m,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'center',
    },
    progressLabel: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: '700',
    },
    progressValue: {
        color: colors.accentCyan,
        fontSize: 15,
        fontWeight: '800',
    },
    progressBarBg: {
        height: 14,
        backgroundColor: colors.glassSurface,
        borderRadius: 7,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    progressFill: {
        height: '100%',
        borderRadius: 7,
    },

    // Stats Card
    statsCard: {
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        overflow: 'hidden',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statItem: {
        width: '47%',
        backgroundColor: colors.glassSurface,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        ...shadows.small,
    },
    statIconContainer: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: colors.accentCyan + '15',
        borderRadius: 20,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },

    // Metrics Card
    metricsCard: {
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        overflow: 'hidden',
    },
    metricsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    editButton: {
        color: colors.primaryStart,
        fontSize: 14,
        fontWeight: '600',
    },
    metricsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricItem: {
        alignItems: 'center',
    },
    metricLabel: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    metricValue: {
        color: colors.textPrimary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    unit: {
        fontSize: 14,
        color: colors.textTertiary,
        fontWeight: 'normal',
    },
    goalValue: {
        color: colors.accentSuccess,
    },
    metricArrow: {
        marginHorizontal: 16,
    },
    arrowText: {
        color: colors.glassBorder,
        fontSize: 24,
    },
    addMetricsButton: {
        padding: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 12,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    addMetricsText: {
        color: colors.primaryStart,
        fontSize: 14,
    },

    // Achievements Card
    achievementsCard: {
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.s, // Reduced padding
        marginBottom: Spacing.m,
        overflow: 'hidden',
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8, // Reduced gap
    },
    achievementItem: {
        width: '22%', // Fit 4 per row
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: 8, // Reduced padding
        alignItems: 'center',
    },
    achievementLocked: {
        opacity: 0.5,
    },
    achievementIcon: {
        fontSize: 24, // Reduced icon size
        marginBottom: 2,
    },
    achievementName: {
        color: colors.textPrimary,
        fontSize: 9, // Reduced font size
        textAlign: 'center',
    },
    achievementNameLocked: {
        color: colors.textTertiary,
    },

    // Roadmap Card
    roadmapCard: {
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.s, // Reduced padding
        marginBottom: Spacing.m,
        overflow: 'hidden',
    },
    roadmapItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8, // Reduced vertical padding
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
        opacity: 0.5,
    },
    roadmapItemActive: {
        opacity: 0.8,
    },
    roadmapItemCurrent: {
        opacity: 1,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 8,
        marginHorizontal: -8,
    },
    roadmapIcon: {
        fontSize: 24, // Increased back for readability
        marginRight: 10,
        marginTop: 2,
    },
    roadmapInfo: {
        flex: 1,
    },
    roadmapName: {
        color: colors.textSecondary,
        fontSize: 16, // Increased back
        fontWeight: '600',
    },
    roadmapNameActive: {
        color: colors.textPrimary,
    },
    roadmapReq: {
        color: colors.textTertiary,
        fontSize: 12, // Increased back
        marginTop: 2,
    },
    roadmapCheck: {
        color: colors.accentSuccess,
        fontSize: 18, // Increased back
        fontWeight: 'bold',
        marginLeft: 8,
    },

    // Sign Out Button
    signOutButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    signOutButtonText: {
        color: colors.textPrimary,
        fontSize: 16, // Increased back
        fontWeight: '600',
    },



    // Unlocked Exercises Styles
    unlockedExercisesContainer: {
        marginTop: 4, // Reduced margin
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
        padding: 6, // Reduced padding
    },
    unlockedLabel: {
        color: colors.accentCyan,
        fontSize: 12, // Increased back
        fontWeight: 'bold',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    unlockedList: {
        flexDirection: 'column',
    },
    unlockedItem: {
        color: colors.textSecondary,
        fontSize: 12, // Increased back
        marginBottom: 1,
    },

    // Unit Selector Styles
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

    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        paddingBottom: 4,
        gap: 4,
    },
    showMoreText: {
        color: colors.primaryStart,
        fontSize: 12,
        fontWeight: '600',
    },

    // Modal
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
    modal: {
        backgroundColor: colors.backgroundLight,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...shadows.card,
    },

    modalTitle: {
        ...Typography.h3,
        color: colors.textPrimary,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        ...Typography.caption,
        color: colors.textSecondary,
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        ...Typography.body,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 12,
        padding: 16,
        color: colors.textPrimary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        ...Typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
        fontSize: 16,
    },

    // Disclaimer
    disclaimerContainer: {
        marginTop: 20,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    disclaimerText: {
        ...Typography.caption,
        color: MOCK.textTertiary,
        fontSize: 11,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 17,
    },

    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        ...Typography.body,
        color: 'white',
        fontSize: 16,
        ...shadows.glow,
        fontWeight: 'bold',
    },

    // Menu Styles
    menuCard: {
        borderRadius: Layout.borderRadius.l,
        marginBottom: Spacing.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    menuIcon: {
        marginRight: 16,
    },
    menuItemText: {
        ...Typography.body,
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    sectionTitle: {
        ...Typography.overline,
        color: colors.textSecondary,
        marginBottom: 8,
        marginTop: 16,
    },

    // User Info Styles
    userInfoCard: {
        borderRadius: Layout.borderRadius.l,
        marginBottom: Spacing.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
    },
    userInfoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    userInfoTextContainer: {
        flex: 1,
    },
    userInfoTitle: {
        ...Typography.body,
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    userInfoSubtitle: {
        ...Typography.caption,
        color: colors.textTertiary,
        fontSize: 12,
        marginTop: 2,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.glassSurface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },

    // Modal Specific Styles
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeModalButton: {
        padding: 4,
    },
    modalSectionTitle: {
        ...Typography.overline,
        color: colors.textSecondary,
        marginTop: 16,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    infoLabel: {
        ...Typography.body,
        fontSize: 14,
        color: colors.textSecondary,
        flex: 1,
    },
    infoValue: {
        ...Typography.body,
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1.5,
    },
    editInput: {
        ...Typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
        borderBottomWidth: 1,
        borderBottomColor: colors.primaryStart,
        paddingVertical: 2,
        minWidth: 60,
        textAlign: 'right',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        flex: 2,
        gap: 6,
    },
    infoTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    summaryInfo: {
        color: colors.textTertiary,
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    editOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'flex-end',
        flex: 2,
    },
    editOptionChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    editOptionChipActive: {
        backgroundColor: colors.primaryStart,
        borderColor: colors.primaryStart,
    },
    editOptionText: {
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    editOptionTextActive: {
        color: colors.textPrimary,
    },
    // Success Modal Styles
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

    // Custom Plans
    customPlansSection: {
        marginBottom: Spacing.l,
    },
    customPlansHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
        paddingHorizontal: 4,
    },
    customPlansSubtitle: {
        fontSize: 13,
        color: colors.textTertiary,
        marginTop: 2,
        marginLeft: 16,
        fontWeight: '500',
    },
    createPlanButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.accentCyan,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.glow,
    },
    customPlansList: {
        gap: Spacing.m,
    },
    customPlanCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: Layout.borderRadius.l,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    customPlanInfo: {
        flex: 1,
        marginRight: 16,
    },
    customPlanName: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    customPlanMeta: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
        marginBottom: 8,
    },
    activePlanBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(46, 204, 113, 0.2)', // Green tint
    },
    activePlanText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#2ecc71', // Standard green
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    customPlanActions: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
    },
    emptyCustomPlansCard: {
        borderRadius: Layout.borderRadius.l,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
    },
    emptyCustomPlansContent: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyCustomPlansText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: Spacing.m,
    },
    emptyCustomPlansSubtext: {
        fontSize: 12,
        color: colors.textTertiary,
        marginTop: Spacing.xs,
    },

    // AI Coach FAB
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 90, // Above the bottom nav bar
        width: 56,
        height: 56,
        borderRadius: 28,
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        zIndex: 9999, // Ensure it's above everything
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
});
