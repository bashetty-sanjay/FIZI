import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    FlatList,
    ActivityIndicator,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { createCustomPlan, updateCustomPlan } from '../store/slices/workoutPlanSlice';
import { WorkoutPlan, PlannedExercise, WorkoutSession } from '../types';
import { useTheme } from '../hooks/useTheme';
import { Spacing, Layout } from '../theme/Theme';
import { exercises } from '../models/exercises';

// Helper function to create default weekly sessions
const createDefaultSessions = (): WorkoutSession[] => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map((day, index) => ({
        id: `session_${Date.now()}_${index}`,
        day: index + 1,
        dayOfWeek: (index + 1) % 7,
        title: day,
        focus: 'Custom Workout',
        exercises: [],
        duration: 0,
        status: 'scheduled' as const,
        type: 'strength' as const,
        intensity: 'moderate' as const,
        isRestDay: true
    }));
};

interface CustomPlanBuilderScreenProps {
    navigation: any;
    route: any;
}

export default function CustomPlanBuilderScreen({ navigation, route }: CustomPlanBuilderScreenProps) {
    const dispatch = useAppDispatch();
    const { colors, gradients, shadows } = useTheme();
    const { user } = useAppSelector(state => state.auth);
    const { loading } = useAppSelector(state => state.workoutPlan);

    // Plan data - with safety checks
    // Plan data - with safety checks
    const passedPlan = route?.params?.plan as WorkoutPlan | undefined;
    const isClone = route?.params?.isClone ?? false;

    // If we are cloning, we don't treat it as an existing plan for update purposes
    const existingPlan = isClone ? undefined : passedPlan;

    const [planName, setPlanName] = useState(
        passedPlan ? (isClone ? `Customized ${passedPlan.name}` : passedPlan.name) : ''
    );
    const [planDescription, setPlanDescription] = useState(passedPlan?.description || '');
    const [planDuration, setPlanDuration] = useState(passedPlan?.duration || 4);
    const [planDifficulty, setPlanDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
        passedPlan?.difficulty || 'intermediate'
    );
    const [sessions, setSessions] = useState<WorkoutSession[]>(
        passedPlan?.sessions
            ? (isClone ? passedPlan.sessions.slice(0, 7) : passedPlan.sessions)
            : createDefaultSessions()
    );

    // UI state
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [showExerciseEditor, setShowExerciseEditor] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<PlannedExercise | null>(null);
    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number>(-1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>('all');

    // Editor local state
    const [editSets, setEditSets] = useState('');
    const [editReps, setEditReps] = useState('');
    const [editRest, setEditRest] = useState('');

    const handleSavePlan = async () => {
        if (!planName.trim()) {
            Alert.alert('Error', 'Please enter a plan name');
            return;
        }

        if (!user?.uid) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        const planData: Partial<WorkoutPlan> = {
            name: planName,
            description: planDescription,
            duration: planDuration,
            difficulty: planDifficulty,
            sessions,
            frequency: sessions.filter(s => !s.isRestDay && s.exercises.length > 0).length,
            metrics: {
                totalVolume: calculateTotalVolume(),
                averageSessionDuration: calculateAvgDuration(),
                weeklyIntensity: 5,
                totalWorkouts: sessions.filter(s => !s.isRestDay).length,
                estimatedCalories: calculateEstimatedCalories(),
                focusMuscles: getUniqueMuscleGroups(),
                weeklyFrequency: sessions.filter(s => !s.isRestDay && s.exercises.length > 0).length
            }
        };

        try {
            if (existingPlan) {
                await dispatch(updateCustomPlan({ planId: existingPlan.id, updates: planData })).unwrap();
                Alert.alert('Success', 'Plan updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                await dispatch(createCustomPlan({ userId: user.uid, planData })).unwrap();
                Alert.alert('Success', 'Custom plan created!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save plan. Please try again.');
        }
    };

    const handleAddExercise = (exercise: typeof exercises[0]) => {
        if (selectedDay === null) return;

        const newExercise: PlannedExercise = {
            exerciseId: exercise.id,
            id: exercise.id,
            name: exercise.name,
            displayName: exercise.displayName || exercise.name,
            sets: exercise.baseSets,
            reps: exercise.baseReps,
            rest: 60,
            category: exercise.category,
            muscleGroups: exercise.muscleGroups,
            completed: false
        };

        const updatedSessions = sessions.map((session, index) => {
            if (index === selectedDay) {
                return {
                    ...session,
                    exercises: [...session.exercises, newExercise],
                    isRestDay: false,
                    duration: calculateSessionDuration([...session.exercises, newExercise])
                };
            }
            return session;
        });

        setSessions(updatedSessions);
        // Don't close modal to allow adding multiple exercises
    };

    const handleDecrementExercise = (exerciseId: string) => {
        if (selectedDay === null) return;

        const session = sessions[selectedDay];
        // Find the last occurrence of this exercise
        let lastIndex = -1;
        for (let i = session.exercises.length - 1; i >= 0; i--) {
            if (session.exercises[i].exerciseId === exerciseId) {
                lastIndex = i;
                break;
            }
        }

        if (lastIndex !== -1) {
            handleRemoveExercise(selectedDay, lastIndex);
        }
    };

    const handleRemoveExercise = (dayIndex: number, exerciseIndex: number) => {
        const updatedSessions = sessions.map((session, index) => {
            if (index === dayIndex) {
                const newExercises = session.exercises.filter((_, i) => i !== exerciseIndex);
                return {
                    ...session,
                    exercises: newExercises,
                    isRestDay: newExercises.length === 0,
                    duration: newExercises.length === 0 ? 0 : calculateSessionDuration(newExercises)
                };
            }
            return session;
        });

        setSessions(updatedSessions);
    };

    const handleEditExercise = (dayIndex: number, exerciseIndex: number) => {
        const exercise = sessions[dayIndex].exercises[exerciseIndex];
        setSelectedDay(dayIndex);
        setSelectedExercise(exercise);
        setSelectedExerciseIndex(exerciseIndex);

        // Initialize local edit state
        setEditSets(String(exercise.sets));
        setEditReps(String(exercise.reps));
        setEditRest(String(exercise.rest));

        setShowExerciseEditor(true);
    };

    const handleUpdateExercise = () => {
        if (selectedDay === null || selectedExerciseIndex === -1) return;

        const updates = {
            sets: parseInt(editSets) || 1,
            reps: parseInt(editReps) || 1,
            rest: parseInt(editRest) || 30
        };

        const updatedSessions = sessions.map((session, index) => {
            if (index === selectedDay) {
                const updatedExercises = session.exercises.map((ex, i) =>
                    i === selectedExerciseIndex ? { ...ex, ...updates } : ex
                );
                return {
                    ...session,
                    exercises: updatedExercises,
                    duration: calculateSessionDuration(updatedExercises)
                };
            }
            return session;
        });

        setSessions(updatedSessions);
        setShowExerciseEditor(false);
        setSelectedExercise(null);
        setSelectedExerciseIndex(-1);
    };

    const toggleRestDay = (dayIndex: number) => {
        const updatedSessions = sessions.map((session, index) => {
            if (index === dayIndex) {
                const newIsRestDay = !session.isRestDay;
                return {
                    ...session,
                    isRestDay: newIsRestDay,
                    exercises: newIsRestDay ? [] : session.exercises,
                    duration: newIsRestDay ? 0 : session.duration
                };
            }
            return session;
        });
        setSessions(updatedSessions);
    };

    const calculateSessionDuration = (exercises: PlannedExercise[]): number => {
        return exercises.reduce((total, ex) => {
            const sets = ex.sets || 3;
            const reps = typeof ex.reps === 'number' ? ex.reps : 10;
            const rest = ex.rest || 60;
            // Estimate: 3 seconds per rep + rest time between sets
            return total + (sets * reps * 3 + (sets - 1) * rest) / 60;
        }, 0);
    };

    const calculateTotalVolume = (): number => {
        return sessions.reduce((total, session) => {
            return total + session.exercises.reduce((sessionTotal, ex) => {
                const reps = typeof ex.reps === 'number' ? ex.reps : 10;
                return sessionTotal + (ex.sets * reps);
            }, 0);
        }, 0);
    };

    const calculateAvgDuration = (): number => {
        const workoutSessions = sessions.filter(s => !s.isRestDay && s.exercises.length > 0);
        if (workoutSessions.length === 0) return 0;
        return workoutSessions.reduce((sum, s) => sum + s.duration, 0) / workoutSessions.length;
    };

    const calculateEstimatedCalories = (): number => {
        return sessions.reduce((total, session) => {
            if (session.isRestDay) return total;
            // Rough estimate: 5 calories per minute of workout
            return total + (session.duration * 5);
        }, 0);
    };

    const getUniqueMuscleGroups = (): string[] => {
        const muscles = new Set<string>();
        sessions.forEach(session => {
            session.exercises.forEach(ex => {
                if (ex.muscleGroups) {
                    (ex.muscleGroups as string[]).forEach(mg => muscles.add(mg));
                }
            });
        });
        return Array.from(muscles);
    };

    const filteredExercises = exercises.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMuscle = filterMuscleGroup === 'all' ||
            (ex.muscleGroups as string[]).includes(filterMuscleGroup);
        return matchesSearch && matchesMuscle;
    });

    const muscleGroups = ['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core'];

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                        {existingPlan ? 'Edit Plan' : 'Create Custom Plan'}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Plan Info Section */}
                <BlurView intensity={20} tint="dark" style={[styles.card, { borderColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Plan Details</Text>

                    <TextInput
                        style={[styles.input, { color: colors.textPrimary, borderColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}
                        placeholder="Plan Name"
                        placeholderTextColor={colors.textTertiary}
                        value={planName}
                        onChangeText={setPlanName}
                    />

                    <TextInput
                        style={[styles.input, styles.textArea, { color: colors.textPrimary, borderColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}
                        placeholder="Description (optional)"
                        placeholderTextColor={colors.textTertiary}
                        value={planDescription}
                        onChangeText={setPlanDescription}
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfWidth}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Difficulty</Text>
                            <View style={styles.pickerButtons}>
                                {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.pickerButton,
                                            { borderColor: colors.glassBorder, backgroundColor: colors.glassSurface },
                                            planDifficulty === level && { borderColor: colors.accentCyan, backgroundColor: colors.accentCyan + '1A' }
                                        ]}
                                        onPress={() => setPlanDifficulty(level)}
                                    >
                                        <Text style={[
                                            styles.pickerButtonText,
                                            { color: colors.textSecondary },
                                            planDifficulty === level && { color: colors.accentCyan, fontWeight: '700' }
                                        ]}>
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </BlurView>

                {/* Weekly Schedule */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.l }]}>Weekly Schedule</Text>

                {sessions.map((session, index) => {
                    // Only use the explicit flag, don't force rest day if just empty
                    const isRestDay = session.isRestDay;

                    return (
                        <BlurView
                            key={index}
                            intensity={20}
                            tint="dark"
                            style={[styles.dayCard, { borderColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}
                        >
                            <View style={styles.dayHeader}>
                                <TouchableOpacity
                                    style={styles.dayTitleContainer}
                                    onPress={() => toggleRestDay(index)}
                                >
                                    <Text style={[styles.dayTitle, { color: colors.textPrimary }]}>{session.title}</Text>
                                    {isRestDay && (
                                        <View style={[styles.restBadge, { backgroundColor: colors.accentPink + '26', borderColor: colors.accentPink + '4D' }]}>
                                            <Text style={[styles.restBadgeText, { color: colors.accentPink }]}>Rest Day</Text>
                                        </View>
                                    )}
                                    {!isRestDay && session.exercises.length > 0 && (
                                        <Text style={[styles.exerciseCount, { color: colors.textSecondary }]}>
                                            {session.exercises.length} exercises • {Math.round(session.duration)} min
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => toggleRestDay(index)}>
                                    <MaterialCommunityIcons
                                        name={isRestDay ? 'play-circle-outline' : 'pause-circle-outline'}
                                        size={24}
                                        color={isRestDay ? colors.accentSuccess : colors.accentPink}
                                    />
                                </TouchableOpacity>
                            </View>

                            {isRestDay ? (
                                <TouchableOpacity
                                    style={[styles.planWorkoutButton, { borderColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}
                                    onPress={() => {
                                        toggleRestDay(index);
                                        // Optional: immediately open selector if they tap "Plan Workout"
                                        // setSelectedDay(index);
                                        // setShowExerciseSelector(true);
                                    }}
                                >
                                    <MaterialCommunityIcons name="dumbbell" size={20} color={colors.textSecondary} />
                                    <Text style={[styles.planWorkoutText, { color: colors.textSecondary }]}>Tap to add workout</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.exerciseList}>
                                    {session.exercises.map((exercise, exIndex) => (
                                        <View key={exIndex} style={[styles.exerciseItem, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}>
                                            <View style={styles.exerciseItemContent}>
                                                <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
                                                    {exercise.displayName || exercise.name}
                                                </Text>
                                                <Text style={[styles.exerciseDetails, { color: colors.accentCyan }]}>
                                                    {exercise.sets} × {exercise.reps} • {exercise.rest}s rest
                                                </Text>
                                            </View>

                                            <View style={styles.exerciseActions}>
                                                <TouchableOpacity onPress={() => handleEditExercise(index, exIndex)}>
                                                    <MaterialCommunityIcons name="pencil" size={20} color={colors.accentCyan} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleRemoveExercise(index, exIndex)}>
                                                    <MaterialCommunityIcons name="delete" size={20} color={colors.accentPink} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}

                                    <TouchableOpacity
                                        style={[styles.addExerciseButton, { borderColor: colors.glassBorder }]}
                                        onPress={() => {
                                            setSelectedDay(index);
                                            setShowExerciseSelector(true);
                                        }}
                                    >
                                        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.accentCyan} />
                                        <Text style={[styles.addExerciseText, { color: colors.accentCyan }]}>Add Exercise</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </BlurView>
                    );
                })}

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.accentCyan }]}
                    onPress={handleSavePlan}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>
                            {existingPlan ? 'Update Plan' : 'Create Plan'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Exercise Selector Modal */}
            <Modal
                visible={showExerciseSelector}
                animationType="slide"
                transparent
                onRequestClose={() => setShowExerciseSelector(false)}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={80} tint="dark" style={styles.modalContent}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.glassBorder }]}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Exercise</Text>
                            <TouchableOpacity onPress={() => setShowExerciseSelector(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={filteredExercises}
                            keyExtractor={item => item.id}
                            ListHeaderComponent={
                                <>
                                    <TextInput
                                        style={[styles.searchInput, { color: colors.textPrimary, borderColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}
                                        placeholder="Search exercises..."
                                        placeholderTextColor={colors.textTertiary}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />

                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.filterScroll}
                                        contentContainerStyle={styles.filterScrollContent}
                                    >
                                        {muscleGroups.map(muscle => (
                                            <TouchableOpacity
                                                key={muscle}
                                                style={[
                                                    styles.filterChip,
                                                    {
                                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                                    },
                                                    filterMuscleGroup === muscle && {
                                                        borderColor: colors.accentCyan,
                                                        backgroundColor: colors.accentCyan + '26'
                                                    }
                                                ]}
                                                onPress={() => setFilterMuscleGroup(muscle)}
                                            >
                                                <Text style={[
                                                    styles.filterChipText,
                                                    { color: colors.textPrimary },
                                                    filterMuscleGroup === muscle && { color: colors.accentCyan, fontWeight: '700' }
                                                ]}>
                                                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    <View style={{
                                        height: 1,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        marginBottom: Spacing.m,
                                        marginHorizontal: -Spacing.l // Extend to edges
                                    }} />
                                </>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.exerciseSelectItem, { borderColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}
                                    onPress={() => handleAddExercise(item)}
                                >
                                    <View style={{ flex: 1, marginRight: Spacing.m }}>
                                        <Text style={[styles.exerciseSelectName, { color: colors.textPrimary }]} numberOfLines={1}>
                                            {item.displayName || item.name}
                                        </Text>
                                        <Text style={[styles.exerciseSelectCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                                            {item.category} • {(item.muscleGroups as string[]).join(', ')}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {selectedDay !== null && sessions[selectedDay].exercises.filter(e => e.exerciseId === item.id).length > 0 ? (
                                            <View style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: colors.accentCyan + '26',
                                                borderRadius: 20,
                                                borderWidth: 1,
                                                borderColor: colors.accentCyan,
                                                paddingHorizontal: 8,
                                                paddingVertical: 4
                                            }}>
                                                <TouchableOpacity
                                                    onPress={() => handleDecrementExercise(item.id)}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <Text style={{ color: colors.accentCyan, fontSize: 18, fontWeight: '700' }}>−</Text>
                                                </TouchableOpacity>

                                                <Text style={{
                                                    color: colors.textPrimary,
                                                    fontSize: 14,
                                                    fontWeight: '700',
                                                    marginHorizontal: 12,
                                                    minWidth: 16,
                                                    textAlign: 'center'
                                                }}>
                                                    {sessions[selectedDay].exercises.filter(e => e.exerciseId === item.id).length}
                                                </Text>

                                                <TouchableOpacity
                                                    onPress={() => handleAddExercise(item)}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <Text style={{ color: colors.accentCyan, fontSize: 18, fontWeight: '700' }}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity onPress={() => handleAddExercise(item)}>
                                                <MaterialCommunityIcons name="plus-circle" size={32} color={colors.accentCyan} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                            style={styles.exerciseList}
                        />
                    </BlurView>
                </View>
            </Modal>

            {/* Exercise Editor Modal */}
            <Modal
                visible={showExerciseEditor}
                animationType="fade"
                transparent
                onRequestClose={() => setShowExerciseEditor(false)}
            >
                <TouchableOpacity
                    style={[styles.modalContainer, { justifyContent: 'center', padding: Spacing.m }]}
                    activeOpacity={1}
                    onPress={() => setShowExerciseEditor(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ width: '100%' }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={[styles.cardContent, styles.editorModal, { backgroundColor: colors.backgroundDarker, borderColor: colors.glassBorder, borderWidth: 1 }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: colors.glassBorder }]}>
                                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Exercise</Text>
                                <TouchableOpacity onPress={() => setShowExerciseEditor(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.editorContent}>
                                <Text style={[styles.editorExerciseName, { color: colors.textPrimary }]}>
                                    {selectedExercise?.displayName || selectedExercise?.name || 'Edit Exercise'}
                                </Text>

                                <View style={styles.editorRow}>
                                    <View style={styles.editorField}>
                                        <Text style={[styles.editorLabel, { color: colors.textPrimary }]}>Sets</Text>
                                        <View style={[styles.stepperContainer, { borderColor: 'rgba(255,255,255,0.2)' }]}>
                                            <TouchableOpacity
                                                style={styles.stepperButton}
                                                onPress={() => setEditSets(String((parseInt(editSets) || 0) + 1))}
                                            >
                                                <MaterialCommunityIcons name="plus" size={24} color={colors.accentCyan} />
                                            </TouchableOpacity>
                                            <View style={styles.stepperValueContainer}>
                                                <Text style={[styles.stepperValueText, { color: colors.accentCyan }]}>
                                                    {editSets || '0'}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.stepperButton}
                                                onPress={() => setEditSets(String(Math.max(1, (parseInt(editSets) || 0) - 1)))}
                                            >
                                                <MaterialCommunityIcons name="minus" size={24} color={colors.accentCyan} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.editorField}>
                                        <Text style={[styles.editorLabel, { color: colors.textPrimary }]}>Reps</Text>
                                        <View style={[styles.stepperContainer, { borderColor: 'rgba(255,255,255,0.2)' }]}>
                                            <TouchableOpacity
                                                style={styles.stepperButton}
                                                onPress={() => setEditReps(String((parseInt(editReps) || 0) + 1))}
                                            >
                                                <MaterialCommunityIcons name="plus" size={24} color={colors.accentCyan} />
                                            </TouchableOpacity>
                                            <View style={styles.stepperValueContainer}>
                                                <Text style={[styles.stepperValueText, { color: colors.accentCyan }]}>
                                                    {editReps || '0'}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.stepperButton}
                                                onPress={() => setEditReps(String(Math.max(1, (parseInt(editReps) || 0) - 1)))}
                                            >
                                                <MaterialCommunityIcons name="minus" size={24} color={colors.accentCyan} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.editorField}>
                                        <Text style={[styles.editorLabel, { color: colors.textPrimary }]}>Rest (s)</Text>
                                        <View style={[styles.stepperContainer, { borderColor: 'rgba(255,255,255,0.2)' }]}>
                                            <TouchableOpacity
                                                style={styles.stepperButton}
                                                onPress={() => setEditRest(String((parseInt(editRest) || 0) + 5))}
                                            >
                                                <MaterialCommunityIcons name="plus" size={24} color={colors.accentCyan} />
                                            </TouchableOpacity>
                                            <View style={styles.stepperValueContainer}>
                                                <Text style={[styles.stepperValueText, { color: colors.accentCyan }]}>
                                                    {editRest || '0'}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.stepperButton}
                                                onPress={() => setEditRest(String(Math.max(0, (parseInt(editRest) || 0) - 5)))}
                                            >
                                                <MaterialCommunityIcons name="minus" size={24} color={colors.accentCyan} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveEditorButton, { backgroundColor: colors.accentCyan }]}
                                onPress={handleUpdateExercise}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.removeEditorButton, { marginTop: Spacing.s }]}
                                onPress={() => {
                                    if (selectedDay !== null && selectedExerciseIndex !== -1) {
                                        handleRemoveExercise(selectedDay, selectedExerciseIndex);
                                        setShowExerciseEditor(false);
                                    }
                                }}
                            >
                                <Text style={[styles.removeButtonText, { color: colors.accentError }]}>Remove Exercise</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.l,
        paddingTop: 60,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.l,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    card: {
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        borderWidth: 1,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: Spacing.m,
    },
    input: {
        borderWidth: 1,
        borderRadius: Layout.borderRadius.s,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.m,
    },
    halfWidth: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: Spacing.s,
    },
    pickerButtons: {
        flexDirection: 'row',
        gap: Spacing.s,
    },
    pickerButton: {
        flex: 1,
        paddingVertical: Spacing.s,
        paddingHorizontal: Spacing.m,
        borderRadius: Layout.borderRadius.s,
        borderWidth: 1,
        alignItems: 'center',
    },
    pickerButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dayCard: {
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        borderWidth: 1,
        overflow: 'hidden',
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.s,
    },
    dayTitleContainer: {
        flex: 1,
    },
    dayTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    exerciseCount: {
        fontSize: 12,
    },
    restBadge: {
        paddingHorizontal: Spacing.s,
        paddingVertical: 2,
        borderRadius: Layout.borderRadius.round,
        borderWidth: 1,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    restBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    exerciseList: {
        gap: Spacing.s,
    },
    exerciseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.s,
        borderWidth: 1,
        marginBottom: Spacing.s,
    },
    exerciseItemContent: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    exerciseDetails: {
        fontSize: 12,
    },
    exerciseActions: {
        flexDirection: 'row',
        gap: Spacing.m,
    },
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.s,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: Spacing.s,
    },
    addExerciseText: {
        marginLeft: Spacing.s,
        fontSize: 14,
        fontWeight: '600',
    },
    planWorkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.s,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: Spacing.s,
        gap: Spacing.s,
    },
    planWorkoutText: {
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.s,
        alignItems: 'center',
        marginTop: Spacing.l,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Add overlay
    },
    modalContent: {
        height: '80%',
        borderTopLeftRadius: Layout.borderRadius.l,
        borderTopRightRadius: Layout.borderRadius.l,
        padding: Spacing.l,
        overflow: 'hidden',
        backgroundColor: '#1E1E1E', // Fallback background color
    },
    cardContent: {
        padding: Spacing.l,
        borderRadius: Layout.borderRadius.l,
        overflow: 'hidden',
    },
    editorModal: {
        width: '100%',
        height: 'auto',
        minHeight: 400, // Slightly more to be safe
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: Spacing.m,
        marginBottom: Spacing.m,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    searchInput: {
        borderWidth: 1,
        borderRadius: Layout.borderRadius.s,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        fontSize: 16,
    },
    filterScroll: {
        marginBottom: Spacing.m,
        height: 48,
    },
    filterScrollContent: {
        paddingRight: Spacing.l,
        alignItems: 'center',
    },
    filterChip: {
        minWidth: 100,
        height: 38,
        borderRadius: Layout.borderRadius.round,
        borderWidth: 1.5,
        marginRight: Spacing.s,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.s,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        includeFontPadding: false,
    },
    exerciseSelectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.s,
        borderWidth: 1,
        marginBottom: Spacing.s,
    },
    exerciseSelectName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    exerciseSelectCategory: {
        fontSize: 12,
    },
    editorContent: {
        flexGrow: 0,
    },
    editorExerciseName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: Spacing.xl,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    editorRow: {
        flexDirection: 'row',
        gap: Spacing.m,
        marginBottom: Spacing.xl, // Increase gap for visibility
        minHeight: 80, // Ensure it doesn't collapse
    },
    editorField: {
        flex: 1,
    },
    editorLabel: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: Spacing.m,
        textAlign: 'center',
        letterSpacing: 1,
        opacity: 0.9,
    },
    stepperContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 32,
        width: 64,
        height: 140,
        backgroundColor: '#FFFFFF',
        alignSelf: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    stepperButton: {
        width: '100%',
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperValueContainer: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperValueText: {
        fontSize: 26,
        fontWeight: '900',
    },
    editorInput: {
        borderWidth: 1,
        borderRadius: Layout.borderRadius.s,
        padding: Spacing.m,
        fontSize: 16,
    },
    saveEditorButton: {
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.m,
        alignItems: 'center',
        marginTop: Spacing.m,
    },
    removeEditorButton: {
        padding: Spacing.m,
        borderRadius: Layout.borderRadius.m,
        alignItems: 'center',
        marginTop: Spacing.l,
    },
    removeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
