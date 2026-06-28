/**
 * AvatarService
 * 
 * Service for managing user avatar state, achievements, and body transformation tracking.
 */

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

// Avatar levels based on XP and workout progress
export const AVATAR_LEVELS = [
    { level: 1, name: 'Beginner', minWorkouts: 0, minReps: 0, minXP: 0, icon: '🌱' },
    { level: 2, name: 'Starter', minWorkouts: 5, minReps: 50, minXP: 500, icon: '🏃' },
    { level: 3, name: 'Regular', minWorkouts: 15, minReps: 200, minXP: 2000, icon: '💪' },
    { level: 4, name: 'Dedicated', minWorkouts: 30, minReps: 500, minXP: 5000, icon: '🔥' },
    { level: 5, name: 'Athlete', minWorkouts: 50, minReps: 1000, minXP: 10000, icon: '⚡' },
    { level: 6, name: 'Champion', minWorkouts: 100, minReps: 2500, minXP: 25000, icon: '🏆' },
    { level: 7, name: 'Legend', minWorkouts: 200, minReps: 5000, minXP: 50000, icon: '👑' },
];

export const ACHIEVEMENTS = [
    { id: 'first_workout', name: 'First Steps', description: 'Complete your first workout', icon: '🎯', requirement: { workouts: 1 } },
    { id: 'week_streak', name: 'Week Warrior', description: 'Work out 7 days in a row', icon: '📅', requirement: { streak: 7 } },
    { id: 'perfect_form', name: 'Perfect Form', description: 'Get 100% form score', icon: '⭐', requirement: { formScore: 100 } },
    { id: 'hundred_reps', name: 'Century Club', description: 'Complete 100 reps total', icon: '💯', requirement: { totalReps: 100 } },
    { id: 'five_hundred_reps', name: 'Rep Machine', description: 'Complete 500 reps total', icon: '🏋️', requirement: { totalReps: 500 } },
    { id: 'thousand_reps', name: 'Iron Will', description: 'Complete 1000 reps total', icon: '🦾', requirement: { totalReps: 1000 } },
    { id: 'all_exercises', name: 'Well Rounded', description: 'Try all 4 exercises', icon: '🎨', requirement: { exercisesTried: 4 } },
    { id: 'hour_workout', name: 'Marathon', description: 'Work out for 60+ minutes total', icon: '⏱️', requirement: { totalMinutes: 60 } },
    { id: 'ten_workouts', name: 'Consistent', description: 'Complete 10 workouts', icon: '🔄', requirement: { workouts: 10 } },
    { id: 'fifty_workouts', name: 'Dedicated', description: 'Complete 50 workouts', icon: '🎖️', requirement: { workouts: 50 } },
];

export interface AvatarState {
    level: number;
    levelName: string;
    xp: number; // Added XP
    totalWorkouts: number;
    totalReps: number;
    totalMinutes: number;
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: string | null;
    achievements: string[];
    exercisesTried: string[];
    bestFormScore: number;
    bodyMetrics: {
        startWeight?: number;
        currentWeight?: number;
        goalWeight?: number;
        startDate?: string;
    };
}

const AVATAR_COLLECTION = 'avatars';

class AvatarService {
    /**
     * Get user's avatar state
     */
    async getAvatarState(): Promise<AvatarState | null> {
        const user = auth.currentUser;
        if (!user) return null;

        try {
            const avatarRef = doc(db, AVATAR_COLLECTION, user.uid);
            const avatarDoc = await getDoc(avatarRef);

            if (avatarDoc.exists()) {
                const data = avatarDoc.data() as AvatarState;
                // Backfill XP if missing
                if (data.xp === undefined) {
                    data.xp = this.calculateBackfillXP(data);
                }
                return data;
            }

            // Create default avatar state
            const defaultState = this.getDefaultState();
            await setDoc(avatarRef, {
                ...defaultState,
                createdAt: serverTimestamp(),
            });
            return defaultState;
        } catch (error) {
            console.error('[AvatarService] Failed to get avatar:', error);
            return null;
        }
    }

    private calculateBackfillXP(data: AvatarState): number {
        // Rough estimate for existing users
        return (data.totalWorkouts * 100) + (data.totalReps * 2) + (data.totalMinutes * 5);
    }

    /**
     * Update avatar after workout
     */
    async updateAfterWorkout(workoutData: {
        exerciseId: string;
        reps: number;
        duration: number;
        formScore: number;
        isSkipped?: boolean; // New param
    }): Promise<AvatarState | null> {
        const user = auth.currentUser;
        if (!user) return null;

        try {
            const currentState = await this.getAvatarState();
            if (!currentState) return null;

            const today = new Date().toISOString().split('T')[0];
            const lastDate = currentState.lastWorkoutDate;

            // Update streak
            let newStreak = currentState.currentStreak;
            if (lastDate) {
                const lastDateObj = new Date(lastDate);
                const todayObj = new Date(today);
                const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    newStreak += 1;
                } else if (diffDays > 1) {
                    newStreak = 1;
                }
                // If same day, keep streak
            } else {
                newStreak = 1;
            }

            // Update exercises tried
            const exercisesTried = [...currentState.exercisesTried];
            if (!exercisesTried.includes(workoutData.exerciseId)) {
                exercisesTried.push(workoutData.exerciseId);
            }

            // Calculate XP Gained
            // Base: 50
            // Reps: 2 XP per rep
            // Time: 5 XP per min
            // Live Bonus: 150 XP (if not skipped)
            // Form Bonus: score * 1
            const baseXP = 50;
            const repXP = workoutData.reps * 2;
            const timeXP = Math.round(workoutData.duration / 60) * 5;
            const liveBonus = workoutData.isSkipped ? 0 : 150;
            const formBonus = Math.round(workoutData.formScore);

            const isFirstTime = !currentState.exercisesTried.includes(workoutData.exerciseId);
            const firstTimeBonus = isFirstTime ? 50 : 0; // Bonus for trying new exercises
            const xpGained = baseXP + repXP + timeXP + liveBonus + formBonus + firstTimeBonus;

            // Calculate new totals
            const newTotalWorkouts = currentState.totalWorkouts + 1;
            const newTotalReps = currentState.totalReps + workoutData.reps;
            const newTotalMinutes = currentState.totalMinutes + Math.round(workoutData.duration / 60);
            const newBestForm = Math.max(currentState.bestFormScore, workoutData.formScore);
            const newLongestStreak = Math.max(currentState.longestStreak, newStreak);
            const newXP = (currentState.xp || 0) + xpGained;

            // Calculate new level
            const newLevel = this.calculateLevel(newTotalWorkouts, newTotalReps, newXP);

            // Check for new achievements
            const newAchievements = this.checkAchievements({
                totalWorkouts: newTotalWorkouts,
                totalReps: newTotalReps,
                totalMinutes: newTotalMinutes,
                currentStreak: newStreak,
                bestFormScore: newBestForm,
                exercisesTried,
            }, currentState.achievements);

            const updatedState: AvatarState = {
                ...currentState,
                level: newLevel.level,
                levelName: newLevel.name,
                xp: newXP,
                totalWorkouts: newTotalWorkouts,
                totalReps: newTotalReps,
                totalMinutes: newTotalMinutes,
                currentStreak: newStreak,
                longestStreak: newLongestStreak,
                lastWorkoutDate: today,
                achievements: [...currentState.achievements, ...newAchievements],
                exercisesTried,
                bestFormScore: newBestForm,
            };

            const avatarRef = doc(db, AVATAR_COLLECTION, user.uid);
            await updateDoc(avatarRef, {
                ...updatedState,
                updatedAt: serverTimestamp(),
            });

            // Sync the level back to the users collection so Redux and plan generators use the right level
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                'progressSystem.currentLevel': newLevel.level,
                'progressSystem.currentXP': newXP,
                updatedAt: serverTimestamp(),
            });

            return updatedState;
        } catch (error) {
            console.error('[AvatarService] Failed to update avatar:', error);
            return null;
        }
    }

    /**
     * Update body metrics
     */
    async updateBodyMetrics(metrics: {
        currentWeight?: number;
        goalWeight?: number;
    }): Promise<void> {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const avatarRef = doc(db, AVATAR_COLLECTION, user.uid);
            const currentState = await this.getAvatarState();

            if (!currentState) return;

            const bodyMetrics = {
                ...currentState.bodyMetrics,
                ...metrics,
                startWeight: currentState.bodyMetrics.startWeight || metrics.currentWeight,
                startDate: currentState.bodyMetrics.startDate || new Date().toISOString().split('T')[0],
            };

            await updateDoc(avatarRef, {
                bodyMetrics,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('[AvatarService] Failed to update metrics:', error);
        }
    }

    /**
     * Calculate level based on progress (XP is now the primary driver)
     */
    private calculateLevel(workouts: number, reps: number, xp: number): { level: number; name: string } {
        let currentLevel = AVATAR_LEVELS[0];

        for (const level of AVATAR_LEVELS) {
            // Check if user meets ALL requirements for this level hierarchy? 
            // Or just XP? Let's use XP as primary, but they shouldn't just spam fake workouts.
            // Let's require XP AND Workouts for higher levels.
            if (xp >= level.minXP) {
                currentLevel = level;
            }
        }

        return { level: currentLevel.level, name: currentLevel.name };
    }

    /**
     * Check for new achievements
     */
    private checkAchievements(
        stats: {
            totalWorkouts: number;
            totalReps: number;
            totalMinutes: number;
            currentStreak: number;
            bestFormScore: number;
            exercisesTried: string[];
        },
        existingAchievements: string[]
    ): string[] {
        const newAchievements: string[] = [];

        for (const achievement of ACHIEVEMENTS) {
            if (existingAchievements.includes(achievement.id)) continue;

            const req = achievement.requirement;
            let earned = false;

            if (req.workouts && stats.totalWorkouts >= req.workouts) earned = true;
            if (req.totalReps && stats.totalReps >= req.totalReps) earned = true;
            if (req.totalMinutes && stats.totalMinutes >= req.totalMinutes) earned = true;
            if (req.streak && stats.currentStreak >= req.streak) earned = true;
            if (req.formScore && stats.bestFormScore >= req.formScore) earned = true;
            if (req.exercisesTried && stats.exercisesTried.length >= req.exercisesTried) earned = true;

            if (earned) {
                newAchievements.push(achievement.id);
            }
        }

        return newAchievements;
    }

    /**
     * Get default avatar state
     */
    private getDefaultState(): AvatarState {
        return {
            level: 1,
            levelName: 'Beginner',
            xp: 0,
            totalWorkouts: 0,
            totalReps: 0,
            totalMinutes: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastWorkoutDate: null,
            achievements: [],
            exercisesTried: [],
            bestFormScore: 0,
            bodyMetrics: {},
        };
    }

    /**
     * Get achievement details by ID
     */
    getAchievementById(id: string) {
        return ACHIEVEMENTS.find(a => a.id === id);
    }

    /**
     * Get level details
     */
    getLevelDetails(level: number) {
        return AVATAR_LEVELS.find(l => l.level === level);
    }

    /**
     * Get next level requirements
     */
    getNextLevelRequirements(currentLevel: number): { workouts: number; reps: number; xp: number } | null {
        const nextLevel = AVATAR_LEVELS.find(l => l.level === currentLevel + 1);
        if (!nextLevel) return null;
        return { workouts: nextLevel.minWorkouts, reps: nextLevel.minReps, xp: nextLevel.minXP };
    }
}

export const avatarService = new AvatarService();
