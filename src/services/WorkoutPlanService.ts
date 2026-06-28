import {
    UserProfile,
    WorkoutPlan,
    WorkoutSession,
    PlannedExercise,
    PlanMetrics,
    UserProgress,
    PerformancePrediction,
    Exercise,
    ExerciseInstructions
} from '../types';
import { PlanGeneratorService } from './PlanGeneratorService';
import { db } from './firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    query,
    where,
    getDocs,
    writeBatch,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';

class WorkoutPlanService {
    /**
     * Calculates initial level based on experience and assessment scores
     */
    public calculateInitialLevel(profile: UserProfile): number {
        // Use the new progress system level if available
        if (profile.progressSystem?.currentLevel) {
            return profile.progressSystem.currentLevel;
        }

        let baseLevel = 1;

        // Experience contribution
        const experience = profile.fitnessProfile?.experienceLevel || profile.workoutExperience || 'beginner';
        switch (experience) {
            case 'beginner': baseLevel = 1; break;
            case 'intermediate': baseLevel = 3; break;
            case 'advanced': baseLevel = 5; break;
        }

        return baseLevel;
    }

    public generateWorkoutPlan(userProfile: UserProfile, forcedLevel?: number): WorkoutPlan {
        // Ensure profile is consistent with new structure
        return PlanGeneratorService.generatePlan(userProfile.uid, userProfile);
    }

    async saveWorkoutPlan(plan: WorkoutPlan): Promise<string> {
        try {
            // Deactivate all existing plans for this user first
            const plansRef = collection(db, 'workout_plans');
            const q = query(plansRef, where('userId', '==', plan.userId), where('isActive', '==', true));
            const querySnapshot = await getDocs(q);

            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { isActive: false });
            });
            await batch.commit();

            const planRef = doc(collection(db, 'workout_plans'));
            const planWithId = {
                ...plan,
                id: planRef.id,
                isActive: true,
                updatedAt: new Date()
            };
            const plainPlan = JSON.parse(JSON.stringify(planWithId));
            await setDoc(planRef, plainPlan);
            return planRef.id;
        } catch (error) {

            throw error;
        }
    }

    async getUserWorkoutPlan(userId: string): Promise<WorkoutPlan | null> {
        try {
            const plansRef = collection(db, 'workout_plans');
            const q = query(plansRef, where('userId', '==', userId), where('isActive', '==', true));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return null;
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            return {
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
            } as WorkoutPlan;
        } catch (error) {
            console.error('Error getting user workout plan:', error);
            return null;
        }
    }

    /**
     * Get the latest AI-generated plan (active or inactive)
     */
    async getLatestAIPlan(userId: string): Promise<WorkoutPlan | null> {
        try {
            const plansRef = collection(db, 'workout_plans');
            // We query for plans where planType is NOT 'custom'.
            // Note: Firestore doesn't support != queries well mixed with others sometimes,
            // but we can query for where planType is 'ai-generated' OR try to order by createdAt.
            // Since we might have legacy plans without planType, we might just fetch recent plans and filter in code if needed,
            // but assuming new plans have 'ai-generated'.
            // Let's rely on sorting by createdAt.

            // Correction: Simplest valid query is just get recent plans for user and find first non-custom one.
            const q = query(
                plansRef,
                where('userId', '==', userId),
                // orderBy('createdAt', 'desc') // Requires composite index usually
            );

            // To avoid index issues for now if not created, let's fetch active/recent ones.
            // Actually, let's just try to find where planType == 'ai-generated' if possible, or filtered.
            // Safer to just get all plans for user (if not too many) or rely on a known field.

            // Better approach: Query for planType == 'ai-generated' specifically if indexed, 
            // OR just fetch all and sort client side if volume is low. 
            // Given likely low volume of plans per user, client side sort is safe.
            const qAll = query(plansRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(qAll);

            const plans = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                } as WorkoutPlan;
            });

            // Filter for AI plans (explicit 'ai-generated' OR missing planType which implies legacy AI)
            // AND exclude 'custom'
            const aiPlans = plans.filter(p => p.planType === 'ai-generated' || !p.planType || p.planType !== 'custom');

            // Sort by createdAt desc
            aiPlans.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                return dateB - dateA;
            });

            return aiPlans.length > 0 ? aiPlans[0] : null;

        } catch (error) {
            console.error('Error getting latest AI plan:', error);
            return null;
        }
    }

    async updateExerciseCompletion(planId: string, dayOfWeek: number, exerciseId: string, completed: boolean, lastCompletedAt?: Date): Promise<boolean> {
        try {
            const planRef = doc(db, 'workout_plans', planId);
            const planSnap = await getDoc(planRef);
            if (!planSnap.exists()) return false;
            const plan = planSnap.data() as WorkoutPlan;
            const session = plan.sessions.find((s: WorkoutSession) => s.dayOfWeek === dayOfWeek);
            if (session) {
                const exercise = session.exercises.find((e: PlannedExercise) => e.exerciseId === exerciseId);
                if (exercise) {
                    exercise.completed = completed;
                    if (lastCompletedAt) {
                        exercise.lastCompletedAt = lastCompletedAt;
                    }
                    await updateDoc(planRef, { sessions: plan.sessions });
                    return true;
                }
            }
            return false;
        } catch (error) {

            return false;
        }
    }

    /**
     * Get exercise instructions from Firestore
     */
    async getExerciseInstructions(exerciseId: string): Promise<ExerciseInstructions | null> {
        try {
            const docRef = doc(db, 'exercise_instructions', exerciseId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as ExerciseInstructions;
            }
            return null;
        } catch (error) {

            return null;
        }
    }

    /**
     * Seeds initial instructions (Bulk write)
     */
    async seedInstructions(instructionsList: ExerciseInstructions[]): Promise<void> {
        try {
            const batch = writeBatch(db);
            instructionsList.forEach(instruction => {
                const ref = doc(db, 'exercise_instructions', instruction.exerciseId);
                batch.set(ref, {
                    ...instruction,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            });
            await batch.commit();
        } catch (error) {

            throw error;
        }
    }
}

export const workoutPlanService = new WorkoutPlanService();
