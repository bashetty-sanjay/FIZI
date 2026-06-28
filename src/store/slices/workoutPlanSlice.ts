import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WorkoutPlan, DailyWorkout, UserProfile } from '../../types';
import { workoutPlanService } from '../../services/WorkoutPlanService';
import CustomPlanService from '../../services/CustomPlanService';
import { db } from '../../services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

interface WorkoutPlanState {
    currentPlan: WorkoutPlan | null;
    customPlans: WorkoutPlan[];
    todaysWorkout: DailyWorkout | null;
    recoveryStatus: 'good' | 'moderate' | 'poor';
    loading: boolean;
    error: string | null;
}

const initialState: WorkoutPlanState = {
    currentPlan: null,
    customPlans: [],
    todaysWorkout: null,
    recoveryStatus: 'good',
    loading: false,
    error: null,
};

/**
 * Fetch user's workout plan from Firestore
 */
export const fetchWorkoutPlan = createAsyncThunk(
    'workoutPlan/fetch',
    async (userId: string, { rejectWithValue }) => {
        try {
            const plan = await workoutPlanService.getUserWorkoutPlan(userId);
            if (!plan) {
                return rejectWithValue('No workout plan found');
            }
            return plan;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch workout plan');
        }
    }
);

/**
 * Update exercise completion status
 */
export const updateExerciseCompletion = createAsyncThunk<
    { dayOfWeek: number; exerciseId: string; completed: boolean },
    { planId: string; dayOfWeek: number; exerciseId: string; completed: boolean; lastCompletedAt?: Date },
    { rejectValue: string }
>(
    'workoutPlan/updateExercise',
    async (
        {
            planId,
            dayOfWeek,
            exerciseId,
            completed,
            lastCompletedAt,
        },
        { rejectWithValue }
    ) => {
        try {
            const success = await workoutPlanService.updateExerciseCompletion(
                planId,
                dayOfWeek,
                exerciseId,
                completed,
                lastCompletedAt
            );
            if (!success) {
                return rejectWithValue('Failed to update exercise');
            }
            return { dayOfWeek, exerciseId, completed };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update exercise');
        }
    }
);

/**
 * Update plan level and regenerate
 */
export const updatePlanLevel = createAsyncThunk(
    'workoutPlan/updateLevel',
    async (
        { userId, level }: { userId: string; level: number },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as { workoutPlan: WorkoutPlanState };
            const profile = state.workoutPlan.currentPlan?.userProfile;
            if (!profile) return rejectWithValue('No user profile found');

            const newPlan = workoutPlanService.generateWorkoutPlan(profile, level);
            await workoutPlanService.saveWorkoutPlan(newPlan);
            return newPlan;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update plan level');
        }
    }
);

/**
 * Force regenerate plan with latest profile
 */
export const regenerateUserPlan = createAsyncThunk(
    'workoutPlan/regenerate',
    async (profile: UserProfile, { rejectWithValue }) => {
        try {

            const newPlan = workoutPlanService.generateWorkoutPlan(profile);

            const planId = await workoutPlanService.saveWorkoutPlan(newPlan);

            // Update user profile with new plan ID in Firestore
            if (profile.uid) {
                const userRef = doc(db, 'users', profile.uid);
                await updateDoc(userRef, { workoutPlanId: planId });
            }

            return { ...newPlan, id: planId };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to regenerate plan');
        }
    }
);

/**
 * Fetch user's custom plans
 */
export const fetchCustomPlans = createAsyncThunk(
    'workoutPlan/fetchCustomPlans',
    async (userId: string, { rejectWithValue }) => {
        try {
            const plans = await CustomPlanService.getUserCustomPlans(userId);
            return plans;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch custom plans');
        }
    }
);

/**
 * Create a new custom plan
 */
export const createCustomPlan = createAsyncThunk(
    'workoutPlan/createCustom',
    async (
        { userId, planData }: { userId: string; planData: Partial<WorkoutPlan> },
        { rejectWithValue }
    ) => {
        try {
            const planId = await CustomPlanService.createCustomPlan(userId, planData);

            // Fetch the created plan
            const plans = await CustomPlanService.getUserCustomPlans(userId);
            const createdPlan = plans.find(p => p.id === planId);

            if (!createdPlan) {
                return rejectWithValue('Failed to retrieve created plan');
            }

            return createdPlan;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create custom plan');
        }
    }
);

/**
 * Update an existing custom plan
 */
export const updateCustomPlan = createAsyncThunk(
    'workoutPlan/updateCustom',
    async (
        { planId, updates }: { planId: string; updates: Partial<WorkoutPlan> },
        { rejectWithValue, getState }
    ) => {
        try {
            const success = await CustomPlanService.updateCustomPlan(planId, updates);

            if (!success) {
                return rejectWithValue('Failed to update custom plan');
            }

            return { planId, updates };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update custom plan');
        }
    }
);

/**
 * Delete a custom plan
 */
export const deleteCustomPlan = createAsyncThunk(
    'workoutPlan/deleteCustom',
    async (planId: string, { rejectWithValue }) => {
        try {
            const success = await CustomPlanService.deleteCustomPlan(planId);

            if (!success) {
                return rejectWithValue('Failed to delete custom plan');
            }

            return planId;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete custom plan');
        }
    }
);

/**
 * Duplicate a plan (AI or custom) to create a new custom plan
 */
export const duplicatePlan = createAsyncThunk(
    'workoutPlan/duplicate',
    async (
        { sourcePlan, userId, newName }: { sourcePlan: WorkoutPlan; userId: string; newName?: string },
        { rejectWithValue }
    ) => {
        try {
            const planId = await CustomPlanService.duplicatePlan(sourcePlan, userId, newName);

            // Fetch the duplicated plan
            const plans = await CustomPlanService.getUserCustomPlans(userId);
            const duplicatedPlan = plans.find(p => p.id === planId);

            if (!duplicatedPlan) {
                return rejectWithValue('Failed to retrieve duplicated plan');
            }

            return duplicatedPlan;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to duplicate plan');
        }
    }
);



/**
 * Switch to AI Plan
 */
export const switchToAIPlan = createAsyncThunk(
    'workoutPlan/switchToAI',
    async (userId: string, { rejectWithValue, dispatch }) => {
        try {
            // 1. Get latest AI plan
            const aiPlan = await workoutPlanService.getLatestAIPlan(userId);

            if (!aiPlan) {
                // If no AI plan exists, we might want to regenerate or throw error
                // For now, let's treat it as an error so UI can handle (e.g., prompt to generate)
                return rejectWithValue('No AI-generated plan found. Please create a new one.');
            }

            // 2. Set it as active using CustomPlanService (handles logic for all plan types)
            await CustomPlanService.setActivePlan(userId, aiPlan.id);

            // 3. Return the plan
            return aiPlan;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to switch to AI plan');
        }
    }
);

/**
 * Switch the active plan
 */
export const switchActivePlan = createAsyncThunk(
    'workoutPlan/switchActive',
    async (
        { userId, planId, planType }: { userId: string; planId: string; planType?: 'ai-generated' | 'custom' },
        { rejectWithValue, getState }
    ) => {
        try {
            const state = getState() as { workoutPlan: WorkoutPlanState };
            const allPlans = [state.workoutPlan.currentPlan, ...state.workoutPlan.customPlans].filter(Boolean) as WorkoutPlan[];

            const targetPlan = allPlans.find(p => p.id === planId);

            if (!targetPlan) {
                return rejectWithValue('Plan not found');
            }

            // Update user's active plan in Firestore
            if (targetPlan.planType === 'custom') {
                await CustomPlanService.setActivePlan(userId, planId);
            } else {
                // Legacy support - but we should prefer using CustomPlanService.setActivePlan for consistency
                // as it handles marking isActive=false for others.
                await CustomPlanService.setActivePlan(userId, planId);
            }

            return targetPlan;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to switch plan');
        }
    }
);

const workoutPlanSlice = createSlice({
    name: 'workoutPlan',
    initialState,
    reducers: {
        setTodaysWorkout: (state, action: PayloadAction<DailyWorkout | null>) => {
            state.todaysWorkout = action.payload;
        },
        setRecoveryStatus: (state, action: PayloadAction<'good' | 'moderate' | 'poor'>) => {
            state.recoveryStatus = action.payload;
        },
        clearWorkoutPlan: (state) => {
            state.currentPlan = null;
            state.todaysWorkout = null;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch workout plan
            .addCase(fetchWorkoutPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkoutPlan.fulfilled, (state, action) => {
                state.loading = false;
                // Ensure sessions is always an array — corrupted/legacy Firestore docs may omit it
                const sessions = action.payload?.sessions ?? [];
                state.currentPlan = { ...action.payload, sessions };

                // Process exercises to check if they were completed TODAY
                sessions.forEach(session => {
                    if (session.exercises) {
                        session.exercises.forEach(exercise => {
                            if (exercise.completed && exercise.lastCompletedAt) {
                                const lastCompleted = (exercise.lastCompletedAt as any).toDate ? (exercise.lastCompletedAt as any).toDate() : new Date(exercise.lastCompletedAt as any);
                                const now = new Date();
                                const isToday = lastCompleted.getDate() === now.getDate() &&
                                    lastCompleted.getMonth() === now.getMonth() &&
                                    lastCompleted.getFullYear() === now.getFullYear();

                                if (!isToday) {
                                    exercise.completed = false; // Reset if not completed today
                                }
                            } else if (exercise.completed && !exercise.lastCompletedAt) {
                                // Legacy: If completed but no timestamp, we assume it's old and reset it (or keep it if we want to be safe, but fixing the bug requires reset)
                                // For now, let's reset it to ensure the fix works immediately for old plans too.
                                exercise.completed = false;
                            }
                        });
                    }
                });

                // Set today's workout
                const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

                // For multi-week plans, we want to find a session that matches the current day of the week
                // and ideally the current week. For now, we'll find any session with matching dayOfWeek.
                const todaysWorkout = sessions.find(
                    (s) => s.dayOfWeek === today
                );

                if (todaysWorkout) {
                    // Ensure isRestDay is set based on type if missing
                    state.todaysWorkout = {
                        ...todaysWorkout,
                        isRestDay: todaysWorkout.isRestDay ?? todaysWorkout.type === 'rest'
                    };
                } else {
                    // Create a rest day object
                    state.todaysWorkout = {
                        id: `rest_fallback_${today}`,
                        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today],
                        dayOfWeek: today,
                        focus: 'Rest & Recovery',
                        exercises: [],
                        duration: 0,
                        status: 'completed',
                        type: 'rest',
                        intensity: 'low',
                        isRestDay: true,
                        notes: 'Take today to recover and prepare for your next workout.'
                    } as any;
                }
            })
            .addCase(fetchWorkoutPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Update exercise completion
            .addCase(updateExerciseCompletion.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateExerciseCompletion.fulfilled, (state, action) => {
                state.loading = false;
                const { dayOfWeek, exerciseId, completed } = action.payload;

                // Update in current plan
                if (state.currentPlan) {
                    const session = state.currentPlan.sessions.find(
                        (s) => s.dayOfWeek === dayOfWeek
                    );
                    if (session) {
                        const exercise = session.exercises.find(
                            (e) => e.exerciseId === exerciseId
                        );
                        if (exercise) {
                            exercise.completed = completed;
                        }
                    }
                }

                // Update in today's workout
                if (state.todaysWorkout && state.todaysWorkout.dayOfWeek === dayOfWeek) {
                    const exercise = state.todaysWorkout.exercises.find(
                        (e) => e.exerciseId === exerciseId
                    );
                    if (exercise) {
                        exercise.completed = completed;
                    }
                }
            })
            .addCase(updateExerciseCompletion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Update plan level
            .addCase(updatePlanLevel.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePlanLevel.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload;

                // Set today's workout
                const today = new Date().getDay();
                const todaysWorkout = (action.payload.sessions as any[]).find(
                    (s) => s.dayOfWeek === today
                );

                if (todaysWorkout) {
                    state.todaysWorkout = {
                        ...todaysWorkout,
                        isRestDay: todaysWorkout.isRestDay ?? todaysWorkout.type === 'rest'
                    };
                } else {
                    state.todaysWorkout = {
                        id: `rest_level_fallback_${today}`,
                        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today],
                        dayOfWeek: today,
                        focus: 'Rest & Recovery',
                        exercises: [],
                        duration: 0,
                        status: 'completed',
                        type: 'rest',
                        intensity: 'low',
                        isRestDay: true,
                        notes: 'Take today to recover and prepare for your next workout.'
                    } as any;
                }
            })
            .addCase(updatePlanLevel.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Regenerate Plan
            .addCase(regenerateUserPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(regenerateUserPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload;

                // Set today's workout
                const today = new Date().getDay();
                const todaysWorkout = (action.payload.sessions as any[]).find(
                    (s) => s.dayOfWeek === today
                );

                if (todaysWorkout) {
                    state.todaysWorkout = {
                        ...todaysWorkout,
                        isRestDay: todaysWorkout.isRestDay ?? todaysWorkout.type === 'rest'
                    };
                } else {
                    state.todaysWorkout = {
                        id: `rest_regen_fallback_${today}`,
                        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today],
                        dayOfWeek: today,
                        focus: 'Rest & Recovery',
                        exercises: [],
                        duration: 0,
                        status: 'completed',
                        type: 'rest',
                        intensity: 'low',
                        isRestDay: true,
                        notes: 'Plan regenerated. Take today to prep!'
                    } as any;
                }
            })
            .addCase(regenerateUserPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch custom plans
            .addCase(fetchCustomPlans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCustomPlans.fulfilled, (state, action) => {
                state.loading = false;
                state.customPlans = action.payload;
            })
            .addCase(fetchCustomPlans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Create custom plan
            .addCase(createCustomPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCustomPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.customPlans.push(action.payload);
                state.currentPlan = action.payload;

                // Set today's workout
                const today = new Date().getDay();
                const todaysWorkout = action.payload.sessions.find(s => s.dayOfWeek === today);
                if (todaysWorkout) {
                    state.todaysWorkout = todaysWorkout;
                }
            })
            .addCase(createCustomPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Update custom plan
            .addCase(updateCustomPlan.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateCustomPlan.fulfilled, (state, action) => {
                state.loading = false;
                const { planId, updates } = action.payload;

                // Update in customPlans array
                const planIndex = state.customPlans.findIndex(p => p.id === planId);
                if (planIndex !== -1) {
                    state.customPlans[planIndex] = {
                        ...state.customPlans[planIndex],
                        ...updates
                    };
                }

                // Update current plan if it's the one being edited
                if (state.currentPlan?.id === planId) {
                    state.currentPlan = {
                        ...state.currentPlan,
                        ...updates
                    };

                    // Update today's workout if sessions changed
                    if (updates.sessions) {
                        const today = new Date().getDay();
                        const todaysWorkout = updates.sessions.find(s => s.dayOfWeek === today);
                        if (todaysWorkout) {
                            state.todaysWorkout = todaysWorkout;
                        }
                    }
                }
            })
            .addCase(updateCustomPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Delete custom plan
            .addCase(deleteCustomPlan.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteCustomPlan.fulfilled, (state, action) => {
                state.loading = false;
                const planId = action.payload;

                // Remove from customPlans array
                state.customPlans = state.customPlans.filter(p => p.id !== planId);

                // Clear current plan if it was deleted
                if (state.currentPlan?.id === planId) {
                    state.currentPlan = null;
                    state.todaysWorkout = null;
                }
            })
            .addCase(deleteCustomPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Duplicate plan
            .addCase(duplicatePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(duplicatePlan.fulfilled, (state, action) => {
                state.loading = false;
                state.customPlans.push(action.payload);
            })
            .addCase(duplicatePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Switch active plan
            .addCase(switchActivePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(switchActivePlan.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload;

                // Set today's workout
                const today = new Date().getDay();
                const todaysWorkout = action.payload.sessions.find(s => s.dayOfWeek === today);
                if (todaysWorkout) {
                    state.todaysWorkout = {
                        ...todaysWorkout,
                        isRestDay: todaysWorkout.isRestDay ?? todaysWorkout.type === 'rest'
                    };
                } else {
                    state.todaysWorkout = null;
                }
            })
            .addCase(switchActivePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Switch to AI Plan
            .addCase(switchToAIPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(switchToAIPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload;

                // Set today's workout
                const today = new Date().getDay();
                const todaysWorkout = action.payload.sessions.find(s => s.dayOfWeek === today);
                if (todaysWorkout) {
                    state.todaysWorkout = {
                        ...todaysWorkout,
                        isRestDay: todaysWorkout.isRestDay ?? todaysWorkout.type === 'rest'
                    };
                } else {
                    // Fallback workout logic
                    state.todaysWorkout = {
                        id: `rest_ai_switch_fallback_${today}`,
                        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today],
                        dayOfWeek: today,
                        focus: 'Rest & Recovery',
                        exercises: [],
                        duration: 0,
                        status: 'completed',
                        type: 'rest',
                        intensity: 'low',
                        isRestDay: true,
                        notes: 'Welcome back to AI Plan! Prepare for your next session.'
                    } as any;
                }
            })
            .addCase(switchToAIPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setTodaysWorkout, setRecoveryStatus, clearWorkoutPlan, clearError } = workoutPlanSlice.actions;
export default workoutPlanSlice.reducer;
