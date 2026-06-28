import {
    WorkoutPlan,
    WorkoutSession,
    PlannedExercise,
    UserProfile,
    PlanMetrics
} from '../types';
import { db } from './firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
    writeBatch,
    runTransaction
} from 'firebase/firestore';

/**
 * Service for managing custom workout plans
 */
export class CustomPlanService {
    private static PLANS_COLLECTION = 'workout_plans';
    private static USERS_COLLECTION = 'users';

    /**
     * Create a new custom workout plan
     */
    static async createCustomPlan(
        userId: string,
        planData: Partial<WorkoutPlan>
    ): Promise<string> {
        try {
            const planRef = doc(collection(db, this.PLANS_COLLECTION));
            const planId = planRef.id;

            const newPlan: WorkoutPlan = {
                id: planId,
                userId,
                name: planData.name || 'My Custom Plan',
                description: planData.description || '',
                frequency: planData.frequency || 7,
                duration: planData.duration || 4,
                sessions: planData.sessions || this.createDefaultSessions(),
                metrics: planData.metrics || this.createDefaultMetrics(),
                difficulty: planData.difficulty || 'intermediate',
                startDate: new Date(),
                endDate: new Date(Date.now() + (planData.duration || 4) * 7 * 24 * 60 * 60 * 1000),
                status: 'active',
                planType: 'custom',
                customizationMetadata: {
                    createdFrom: planData.customizationMetadata?.createdFrom || null,
                    lastModified: new Date(),
                    customExerciseCount: 0
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: false
            };

            await setDoc(planRef, this.removeUndefined({
                ...newPlan,
                startDate: Timestamp.fromDate(newPlan.startDate || new Date()),
                endDate: Timestamp.fromDate(newPlan.endDate || new Date()),
                createdAt: Timestamp.fromDate(newPlan.createdAt || new Date()),
                updatedAt: Timestamp.fromDate(newPlan.updatedAt || new Date()),
                customizationMetadata: newPlan.customizationMetadata ? {
                    ...newPlan.customizationMetadata,
                    lastModified: Timestamp.fromDate(newPlan.customizationMetadata.lastModified)
                } : undefined
            }));

            return planId;
        } catch (error) {
            console.error('[CustomPlanService] Error creating custom plan:', error);
            throw error;
        }
    }

    /**
     * Get all custom plans for a user
     */
    static async getUserCustomPlans(userId: string): Promise<WorkoutPlan[]> {
        try {
            const plansQuery = query(
                collection(db, this.PLANS_COLLECTION),
                where('userId', '==', userId),
                where('planType', '==', 'custom')
            );

            const snapshot = await getDocs(plansQuery);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    startDate: data.startDate?.toDate() || new Date(),
                    endDate: data.endDate?.toDate() || new Date(),
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                    customizationMetadata: data.customizationMetadata ? {
                        ...data.customizationMetadata,
                        lastModified: data.customizationMetadata.lastModified?.toDate() || new Date()
                    } : undefined
                } as WorkoutPlan;
            });
        } catch (error) {
            console.error('[CustomPlanService] Error fetching custom plans:', error);
            return [];
        }
    }

    /**
     * Update an existing custom plan
     */
    static async updateCustomPlan(
        planId: string,
        updates: Partial<WorkoutPlan>
    ): Promise<boolean> {
        try {
            const planRef = doc(db, this.PLANS_COLLECTION, planId);

            const updateData: any = {
                ...updates,
                updatedAt: Timestamp.fromDate(new Date())
            };

            if (updates.customizationMetadata) {
                updateData.customizationMetadata = {
                    ...updates.customizationMetadata,
                    lastModified: Timestamp.fromDate(new Date())
                };
            }

            if (updates.startDate) {
                updateData.startDate = Timestamp.fromDate(updates.startDate);
            }

            if (updates.endDate) {
                updateData.endDate = Timestamp.fromDate(updates.endDate);
            }

            await updateDoc(planRef, this.removeUndefined(updateData));
            return true;
        } catch (error) {
            console.error('[CustomPlanService] Error updating custom plan:', error);
            return false;
        }
    }

    /**
     * Delete a custom plan
     */
    static async deleteCustomPlan(planId: string): Promise<boolean> {
        try {
            const planRef = doc(db, this.PLANS_COLLECTION, planId);
            await deleteDoc(planRef);
            return true;
        } catch (error) {
            console.error('[CustomPlanService] Error deleting custom plan:', error);
            return false;
        }
    }

    /**
     * Duplicate an existing plan (AI or custom) to create a new custom plan
     */
    static async duplicatePlan(
        sourcePlan: WorkoutPlan,
        userId: string,
        newName?: string
    ): Promise<string> {
        try {
            const duplicatedPlan: Partial<WorkoutPlan> = {
                name: newName || `Custom - ${sourcePlan.name}`,
                description: sourcePlan.description,
                frequency: sourcePlan.frequency,
                duration: sourcePlan.duration,
                difficulty: sourcePlan.difficulty,
                sessions: JSON.parse(JSON.stringify(sourcePlan.sessions)), // Deep clone
                metrics: sourcePlan.metrics,
                customizationMetadata: {
                    createdFrom: sourcePlan.id,
                    lastModified: new Date(),
                    customExerciseCount: this.countCustomExercises(sourcePlan.sessions)
                }
            };

            return await this.createCustomPlan(userId, duplicatedPlan);
        } catch (error) {
            console.error('[CustomPlanService] Error duplicating plan:', error);
            throw error;
        }
    }

    /**
     * Add exercise to a specific day in the plan
     */
    static async addExerciseToDay(
        planId: string,
        dayOfWeek: number,
        exercise: PlannedExercise
    ): Promise<boolean> {
        try {
            const planRef = doc(db, this.PLANS_COLLECTION, planId);

            await runTransaction(db, async (transaction) => {
                const planDoc = await transaction.get(planRef);

                if (!planDoc.exists()) {
                    throw new Error('Plan not found');
                }

                const plan = planDoc.data() as WorkoutPlan;
                const sessions = plan.sessions;

                // Find session for the specified day
                const sessionIndex = sessions.findIndex(s => s.dayOfWeek === dayOfWeek);

                if (sessionIndex === -1) {
                    // Create new session for this day
                    const newSession: WorkoutSession = this.createSessionForDay(dayOfWeek);
                    newSession.exercises.push(exercise);
                    sessions.push(newSession);
                } else {
                    sessions[sessionIndex].exercises.push(exercise);
                    sessions[sessionIndex].isRestDay = false;
                }

                transaction.update(planRef, this.removeUndefined({
                    sessions,
                    customizationMetadata: {
                        ...plan.customizationMetadata,
                        lastModified: Timestamp.fromDate(new Date()),
                        customExerciseCount: this.countCustomExercises(sessions)
                    },
                    updatedAt: Timestamp.fromDate(new Date())
                }));
            });

            return true;
        } catch (error) {
            console.error('[CustomPlanService] Error adding exercise:', error);
            return false;
        }
    }

    /**
     * Remove exercise from a specific day
     */
    static async removeExerciseFromDay(
        planId: string,
        dayOfWeek: number,
        exerciseIndex: number
    ): Promise<boolean> {
        try {
            const planRef = doc(db, this.PLANS_COLLECTION, planId);
            let success = false;

            await runTransaction(db, async (transaction) => {
                const planDoc = await transaction.get(planRef);

                if (!planDoc.exists()) {
                    throw new Error('Plan not found');
                }

                const plan = planDoc.data() as WorkoutPlan;
                const sessions = plan.sessions;
                const sessionIndex = sessions.findIndex(s => s.dayOfWeek === dayOfWeek);

                if (sessionIndex !== -1 && sessions[sessionIndex].exercises[exerciseIndex]) {
                    sessions[sessionIndex].exercises.splice(exerciseIndex, 1);

                    // Mark as rest day if no exercises left
                    if (sessions[sessionIndex].exercises.length === 0) {
                        sessions[sessionIndex].isRestDay = true;
                    }

                    transaction.update(planRef, this.removeUndefined({
                        sessions,
                        customizationMetadata: {
                            ...plan.customizationMetadata,
                            lastModified: Timestamp.fromDate(new Date()),
                            customExerciseCount: this.countCustomExercises(sessions)
                        },
                        updatedAt: Timestamp.fromDate(new Date())
                    }));
                    success = true;
                }
            });

            return success;
        } catch (error) {
            console.error('[CustomPlanService] Error removing exercise:', error);
            return false;
        }
    }

    /**
     * Update exercise details in a plan
     */
    static async updateExerciseInPlan(
        planId: string,
        dayOfWeek: number,
        exerciseIndex: number,
        updates: Partial<PlannedExercise>
    ): Promise<boolean> {
        try {
            const planRef = doc(db, this.PLANS_COLLECTION, planId);
            let success = false;

            await runTransaction(db, async (transaction) => {
                const planDoc = await transaction.get(planRef);

                if (!planDoc.exists()) {
                    throw new Error('Plan not found');
                }

                const plan = planDoc.data() as WorkoutPlan;
                const sessions = plan.sessions;
                const sessionIndex = sessions.findIndex(s => s.dayOfWeek === dayOfWeek);

                if (sessionIndex !== -1 && sessions[sessionIndex].exercises[exerciseIndex]) {
                    sessions[sessionIndex].exercises[exerciseIndex] = {
                        ...sessions[sessionIndex].exercises[exerciseIndex],
                        ...updates
                    };

                    transaction.update(planRef, this.removeUndefined({
                        sessions,
                        customizationMetadata: {
                            ...plan.customizationMetadata,
                            lastModified: Timestamp.fromDate(new Date()),
                            customExerciseCount: this.countCustomExercises(sessions)
                        },
                        updatedAt: Timestamp.fromDate(new Date())
                    }));
                    success = true;
                }
            });

            return success;
        } catch (error) {
            console.error('[CustomPlanService] Error updating exercise:', error);
            return false;
        }
    }

    /**
     * Set active custom plan for user
     */
    /**
     * Set active custom plan for user
     */
    static async setActivePlan(userId: string, planId: string): Promise<boolean> {
        try {
            const batch = writeBatch(db);

            // 1. Deactivate ALL active plans for this user
            const plansRef = collection(db, this.PLANS_COLLECTION);
            const q = query(plansRef, where('userId', '==', userId), where('isActive', '==', true));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { isActive: false });
            });

            // 2. Activate the target plan
            const targetPlanRef = doc(db, this.PLANS_COLLECTION, planId);
            batch.update(targetPlanRef, {
                isActive: true,
                updatedAt: Timestamp.fromDate(new Date())
            });

            // 3. Update User Profile
            const userRef = doc(db, this.USERS_COLLECTION, userId);
            batch.update(userRef, {
                workoutPlanId: planId,
                activeCustomPlanId: planId,
                updatedAt: Timestamp.fromDate(new Date())
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('[CustomPlanService] Error setting active plan:', error);
            return false;
        }
    }

    /**
     * Validate plan structure
     */
    static validatePlanStructure(plan: Partial<WorkoutPlan>): boolean {
        if (!plan.name || plan.name.trim() === '') {
            return false;
        }

        if (!plan.sessions || plan.sessions.length === 0) {
            return false;
        }

        return true;
    }

    // Helper Methods

    private static createDefaultSessions(): WorkoutSession[] {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days.map((day, index) => ({
            id: `session_${index}`,
            day: index + 1,
            dayOfWeek: index,
            title: day,
            focus: 'Custom Workout',
            exercises: [],
            duration: 0,
            status: 'scheduled' as const,
            type: 'strength' as const,
            intensity: 'moderate' as const,
            isRestDay: true
        }));
    }

    private static createSessionForDay(dayOfWeek: number): WorkoutSession {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return {
            id: `session_${dayOfWeek}`,
            day: dayOfWeek + 1,
            dayOfWeek,
            title: days[dayOfWeek],
            focus: 'Custom Workout',
            exercises: [],
            duration: 0,
            status: 'scheduled',
            type: 'strength',
            intensity: 'moderate',
            isRestDay: false
        };
    }

    private static createDefaultMetrics(): PlanMetrics {
        return {
            totalVolume: 0,
            averageSessionDuration: 0,
            weeklyIntensity: 5,
            totalWorkouts: 0,
            estimatedCalories: 0,
            focusMuscles: [],
            weeklyFrequency: 0
        };
    }

    private static countCustomExercises(sessions: WorkoutSession[]): number {
        return sessions.reduce((total, session) => total + session.exercises.length, 0);
    }

    /**
     * Remove undefined values from object recursively for Firestore compatibility
     */
    private static removeUndefined(obj: any): any {
        if (obj === null || obj === undefined) return null;
        if (obj instanceof Date || obj instanceof Timestamp) return obj;
        if (Array.isArray(obj)) return obj.map(v => this.removeUndefined(v));
        if (typeof obj === 'object') {
            return Object.entries(obj).reduce((acc: any, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = this.removeUndefined(value);
                }
                return acc;
            }, {});
        }
        return obj;
    }
}

export default CustomPlanService;
