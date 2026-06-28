/**
 * WorkoutService
 * 
 * Service for managing workout sessions in Firestore.
 * Handles saving, retrieving, and analyzing workout history.
 */

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    runTransaction
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { WorkoutSession, ProgressStats } from '../types';
import { dataRetentionService } from './DataRetentionService';

// Collection names
const WORKOUTS_COLLECTION = 'workouts';
const STATS_COLLECTION = 'stats';

export interface WorkoutSessionData {
    id: string;
    exerciseId: string;
    exerciseName: string;
    duration: number; // seconds
    reps: number;
    averageFormScore: number;
    caloriesBurned: number;
    createdAt: Date;
}

class WorkoutService {
    /**
     * Save a completed workout session
     */
    async saveWorkoutSession(session: {
        exerciseId: string;
        exerciseName: string;
        duration: number;
        reps: number;
        averageFormScore: number;
        caloriesBurned: number;
    }): Promise<string | null> {
        const user = auth.currentUser;
        if (!user) {

            return null;
        }

        try {
            const workoutId = `${user.uid}_${Date.now()}`;
            const workoutRef = doc(db, WORKOUTS_COLLECTION, workoutId);

            await setDoc(workoutRef, {
                userId: user.uid,
                ...session,
                createdAt: serverTimestamp(),
            });



            // Update daily stats
            await this.updateDailyStats(session);

            // Silently clean up records older than 90 days (fire-and-forget)
            dataRetentionService.runCleanup().catch(() => { });

            return workoutId;
        } catch (error) {

            return null;
        }
    }

    /**
     * Get user's workout history
     */
    async getWorkoutHistory(limitCount: number = 20): Promise<WorkoutSessionData[]> {
        const user = auth.currentUser;
        if (!user) {

            return [];
        }

        try {


            // Try with orderBy first (requires composite index)
            let workoutsQuery = query(
                collection(db, WORKOUTS_COLLECTION),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            let snapshot;
            try {
                snapshot = await getDocs(workoutsQuery);

            } catch (indexError: any) {
                // If compound query fails (missing index), try without orderBy
                console.warn('[WorkoutService] Compound query failed, trying fallback:', indexError.message);
                workoutsQuery = query(
                    collection(db, WORKOUTS_COLLECTION),
                    where('userId', '==', user.uid),
                    limit(limitCount)
                );
                snapshot = await getDocs(workoutsQuery);

            }

            const workouts: WorkoutSessionData[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                try {
                    const workout = {
                        id: doc.id,
                        exerciseId: data.exerciseId || 'unknown',
                        exerciseName: data.exerciseName || 'Unknown Exercise',
                        duration: data.duration || 0,
                        reps: data.reps || 0,
                        averageFormScore: data.averageFormScore || 0,
                        caloriesBurned: data.caloriesBurned || 0,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
                    };
                    workouts.push(workout);
                } catch (docError) {
                    console.error('[WorkoutService] Error parsing workout doc:', doc.id, docError);
                }
            });

            // Sort by date client-side (in case we used fallback query)
            workouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());


            return workouts;
        } catch (error: any) {


            return [];
        }
    }

    /**
     * Get workout statistics for a period
     */
    async getStats(period: 'week' | 'month' | 'all' = 'week'): Promise<{
        totalWorkouts: number;
        totalReps: number;
        totalDuration: number;
        totalCalories: number;
        averageFormScore: number;
        exerciseBreakdown: Record<string, { count: number; reps: number }>;
    }> {
        const user = auth.currentUser;
        if (!user) {

            return {
                totalWorkouts: 0,
                totalReps: 0,
                totalDuration: 0,
                totalCalories: 0,
                averageFormScore: 0,
                exerciseBreakdown: {},
            };
        }

        try {


            // Calculate date range
            const now = new Date();
            let startDate = new Date();

            if (period === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (period === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            } else {
                startDate = new Date(0); // All time
            }



            let snapshot;
            try {
                // Try compound query first
                const workoutsQuery = query(
                    collection(db, WORKOUTS_COLLECTION),
                    where('userId', '==', user.uid),
                    where('createdAt', '>=', Timestamp.fromDate(startDate)),
                    orderBy('createdAt', 'desc')
                );
                snapshot = await getDocs(workoutsQuery);

            } catch (indexError: any) {
                // Fallback: get all user workouts and filter client-side
                console.warn('[WorkoutService] Compound stats query failed, using fallback:', indexError.message);
                const fallbackQuery = query(
                    collection(db, WORKOUTS_COLLECTION),
                    where('userId', '==', user.uid)
                );
                snapshot = await getDocs(fallbackQuery);

            }

            let totalWorkouts = 0;
            let totalReps = 0;
            let totalDuration = 0;
            let totalCalories = 0;
            let totalFormScore = 0;
            const exerciseBreakdown: Record<string, { count: number; reps: number }> = {};

            const startTimestamp = startDate.getTime();

            snapshot.forEach((doc) => {
                const data = doc.data();

                // Client-side date filtering for fallback query
                const docDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                if (period !== 'all' && docDate.getTime() < startTimestamp) {
                    return; // Skip documents outside date range
                }

                totalWorkouts++;
                totalReps += data.reps || 0;
                totalDuration += data.duration || 0;
                totalCalories += data.caloriesBurned || 0;
                totalFormScore += data.averageFormScore || 0;

                // Track by exercise
                const exId = data.exerciseId || 'unknown';
                if (!exerciseBreakdown[exId]) {
                    exerciseBreakdown[exId] = { count: 0, reps: 0 };
                }
                exerciseBreakdown[exId].count++;
                exerciseBreakdown[exId].reps += data.reps || 0;
            });

            // console.log('[WorkoutService] Stats calculated:', {
            //     totalWorkouts,
            //     totalReps,
            //     totalDuration,
            //     avgScore: totalWorkouts > 0 ? Math.round(totalFormScore / totalWorkouts) : 0
            // });

            return {
                totalWorkouts,
                totalReps,
                totalDuration,
                totalCalories,
                averageFormScore: totalWorkouts > 0
                    ? Math.round(totalFormScore / totalWorkouts)
                    : 0,
                exerciseBreakdown,
            };
        } catch (error: any) {


            return {
                totalWorkouts: 0,
                totalReps: 0,
                totalDuration: 0,
                totalCalories: 0,
                averageFormScore: 0,
                exerciseBreakdown: {},
            };
        }
    }

    /**
     * Get weekly stats for graph
     */
    async getWeeklyStats(): Promise<{ date: string; calories: number; duration: number }[]> {
        const user = auth.currentUser;
        if (!user) return [];

        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 6); // Last 7 days including today

            // Query last 7 days
            const workoutsQuery = query(
                collection(db, WORKOUTS_COLLECTION),
                where('userId', '==', user.uid),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                orderBy('createdAt', 'asc')
            );

            let snapshot;
            try {
                snapshot = await getDocs(workoutsQuery);
            } catch (e) {
                // Fallback if index missing
                const fallbackQuery = query(
                    collection(db, WORKOUTS_COLLECTION),
                    where('userId', '==', user.uid)
                );
                snapshot = await getDocs(fallbackQuery);
            }

            // Initialize map with empty days
            const dailyMap = new Map<string, { calories: number; duration: number }>();
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                // Format: Mon, Tue, etc.
                const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
                dailyMap.set(dayLabel, { calories: 0, duration: 0 });
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);

                // Filter if using fallback
                if (date >= startDate && date <= new Date(endDate.getTime() + 86400000)) {
                    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

                    if (dailyMap.has(dayLabel)) {
                        const current = dailyMap.get(dayLabel)!;
                        dailyMap.set(dayLabel, {
                            calories: current.calories + (data.caloriesBurned || 0),
                            duration: current.duration + (data.duration || 0)
                        });
                    }
                }
            });

            return Array.from(dailyMap.entries()).map(([date, stats]) => ({
                date,
                calories: stats.calories,
                duration: Math.round(stats.duration / 60) // Convert to minutes
            }));

        } catch (error) {
            console.error('[WorkoutService] Error getting weekly graph stats:', error);
            return [];
        }
    }

    /**
     * Get monthly stats for graph (30 days)
     */
    async getMonthlyStats(): Promise<{ date: string; calories: number; duration: number }[]> {
        const user = auth.currentUser;
        if (!user) return [];

        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 29); // Last 30 days including today

            const workoutsQuery = query(
                collection(db, WORKOUTS_COLLECTION),
                where('userId', '==', user.uid),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                orderBy('createdAt', 'asc')
            );

            let snapshot;
            try {
                snapshot = await getDocs(workoutsQuery);
            } catch (e) {
                const fallbackQuery = query(
                    collection(db, WORKOUTS_COLLECTION),
                    where('userId', '==', user.uid)
                );
                snapshot = await getDocs(fallbackQuery);
            }

            // Initialize map with empty days (show every 5th day for readability)
            const dailyMap = new Map<string, { calories: number; duration: number }>();
            for (let i = 0; i < 30; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const dayNum = d.getDate();
                dailyMap.set(dayNum.toString(), { calories: 0, duration: 0 });
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);

                if (date >= startDate && date <= new Date(endDate.getTime() + 86400000)) {
                    const dayNum = date.getDate().toString();

                    if (dailyMap.has(dayNum)) {
                        const current = dailyMap.get(dayNum)!;
                        dailyMap.set(dayNum, {
                            calories: current.calories + (data.caloriesBurned || 0),
                            duration: current.duration + (data.duration || 0)
                        });
                    }
                }
            });

            // Return every 5th day for cleaner X-axis
            const allDays = Array.from(dailyMap.entries());
            return allDays.filter((_, index) => index % 5 === 0 || index === allDays.length - 1).map(([date, stats]) => ({
                date,
                calories: stats.calories,
                duration: Math.round(stats.duration / 60)
            }));

        } catch (error) {
            console.error('[WorkoutService] Error getting monthly graph stats:', error);
            return [];
        }
    }

    /**
     * Get all-time stats for graph (smart grouping)
     */
    async getAllTimeStats(): Promise<{ date: string; calories: number; duration: number }[]> {
        const user = auth.currentUser;
        if (!user) return [];

        try {
            const workoutsQuery = query(
                collection(db, WORKOUTS_COLLECTION),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'asc')
            );

            let snapshot;
            try {
                snapshot = await getDocs(workoutsQuery);
            } catch (e) {
                const fallbackQuery = query(
                    collection(db, WORKOUTS_COLLECTION),
                    where('userId', '==', user.uid)
                );
                snapshot = await getDocs(fallbackQuery);
            }

            if (snapshot.empty) return [];

            const workouts: Array<{ date: Date; calories: number; duration: number }> = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                workouts.push({
                    date,
                    calories: data.caloriesBurned || 0,
                    duration: data.duration || 0
                });
            });

            if (workouts.length === 0) return [];

            // For All Time, always group by month
            return this.groupByMonth(workouts, 12);

        } catch (error) {
            console.error('[WorkoutService] Error getting all-time graph stats:', error);
            return [];
        }
    }

    private groupByDay(workouts: Array<{ date: Date; calories: number; duration: number }>, lastNDays: number) {
        const grouped = new Map<string, { calories: number; duration: number }>();

        // For All Time with few days, show all days without filtering
        workouts.forEach(w => {
            const key = w.date.toLocaleDateString('en-US', { weekday: 'short' });
            const existing = grouped.get(key) || { calories: 0, duration: 0 };
            grouped.set(key, {
                calories: existing.calories + w.calories,
                duration: existing.duration + w.duration
            });
        });

        return Array.from(grouped.entries()).map(([date, stats]) => ({
            date,
            calories: stats.calories,
            duration: Math.round(stats.duration / 60)
        }));
    }

    private groupByWeek(workouts: Array<{ date: Date; calories: number; duration: number }>, lastNWeeks: number) {
        const grouped = new Map<string, { calories: number; duration: number }>();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (lastNWeeks * 7));

        workouts.forEach(w => {
            if (w.date >= cutoffDate) {
                const weekNum = Math.floor((w.date.getTime() - cutoffDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                const key = `W${weekNum + 1}`;
                const existing = grouped.get(key) || { calories: 0, duration: 0 };
                grouped.set(key, {
                    calories: existing.calories + w.calories,
                    duration: existing.duration + w.duration
                });
            }
        });

        return Array.from(grouped.entries()).map(([date, stats]) => ({
            date,
            calories: stats.calories,
            duration: Math.round(stats.duration / 60)
        }));
    }

    private groupByMonth(workouts: Array<{ date: Date; calories: number; duration: number }>, lastNMonths: number) {
        const grouped = new Map<string, { calories: number; duration: number }>();
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - lastNMonths);

        workouts.forEach(w => {
            if (w.date >= cutoffDate) {
                const key = w.date.toLocaleDateString('en-US', { month: 'short' });
                const existing = grouped.get(key) || { calories: 0, duration: 0 };
                grouped.set(key, {
                    calories: existing.calories + w.calories,
                    duration: existing.duration + w.duration
                });
            }
        });

        return Array.from(grouped.entries()).map(([date, stats]) => ({
            date,
            calories: stats.calories,
            duration: Math.round(stats.duration / 60)
        }));
    }

    /**
     * Update daily stats (for quick access)
     */
    private async updateDailyStats(session: {
        reps: number;
        duration: number;
        averageFormScore: number;
        caloriesBurned: number;
    }): Promise<void> {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const statsRef = doc(db, STATS_COLLECTION, `${user.uid}_${today}`);

            await runTransaction(db, async (transaction) => {
                const statsDoc = await transaction.get(statsRef);

                if (statsDoc.exists()) {
                    const existing = statsDoc.data();
                    transaction.set(statsRef, {
                        ...existing,
                        workoutCount: (existing.workoutCount || 0) + 1,
                        totalReps: (existing.totalReps || 0) + session.reps,
                        totalDuration: (existing.totalDuration || 0) + session.duration,
                        totalCalories: (existing.totalCalories || 0) + session.caloriesBurned,
                        averageFormScore: Math.round(
                            ((existing.averageFormScore || 0) * (existing.workoutCount || 0) + session.averageFormScore) /
                            ((existing.workoutCount || 0) + 1)
                        ),
                        updatedAt: serverTimestamp(),
                    }, { merge: true });
                } else {
                    transaction.set(statsRef, {
                        userId: user.uid,
                        date: today,
                        workoutCount: 1,
                        totalReps: session.reps,
                        totalDuration: session.duration,
                        totalCalories: session.caloriesBurned,
                        averageFormScore: session.averageFormScore,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                }
            });
        } catch (error) {

        }
    }

    /**
     * Get personal bests
     */
    async getPersonalBests(): Promise<{
        maxReps: { value: number; exercise: string; date: Date } | null;
        longestWorkout: { value: number; exercise: string; date: Date } | null;
        bestFormScore: { value: number; exercise: string; date: Date } | null;
    }> {
        const user = auth.currentUser;
        if (!user) {
            return { maxReps: null, longestWorkout: null, bestFormScore: null };
        }

        try {
            const workouts = await this.getWorkoutHistory(100);

            let maxReps: { value: number; exercise: string; date: Date } | null = null;
            let longestWorkout: { value: number; exercise: string; date: Date } | null = null;
            let bestFormScore: { value: number; exercise: string; date: Date } | null = null;

            workouts.forEach((w) => {
                if (!maxReps || w.reps > maxReps.value) {
                    maxReps = { value: w.reps, exercise: w.exerciseName, date: w.createdAt };
                }
                if (!longestWorkout || w.duration > longestWorkout.value) {
                    longestWorkout = { value: w.duration, exercise: w.exerciseName, date: w.createdAt };
                }
                if (!bestFormScore || w.averageFormScore > bestFormScore.value) {
                    bestFormScore = { value: w.averageFormScore, exercise: w.exerciseName, date: w.createdAt };
                }
            });

            return { maxReps, longestWorkout, bestFormScore };
        } catch (error) {

            return { maxReps: null, longestWorkout: null, bestFormScore: null };
        }
    }
}

// Export singleton
export const workoutService = new WorkoutService();
