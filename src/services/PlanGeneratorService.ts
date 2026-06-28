import {
    UserProfile,
    WorkoutPlan,
    WorkoutSession,
    PlannedExercise,
    Exercise,
    PlanMetrics,
    MuscleGroup
} from '../types';
import { exercises, getExercisesByCategory } from '../models/exercises';
import RECOVERY_EXERCISES from '../models/recovery_exercises';
import RecoveryService from './RecoveryService';

type SessionFocus = 'upper' | 'lower' | 'fullbody' | 'cardio' | 'recovery' | 'hybrid';

export class PlanGeneratorService {
    /**
     * Generates a personalized workout plan based on the user's profile
     */
    static generatePlan(userId: string, profile: UserProfile): WorkoutPlan {
        // Robustness: Ensure profile has necessary nested objects
        const safeProfile: UserProfile = {
            ...profile,
            progressSystem: profile.progressSystem || {
                currentLevel: (profile as any).level || 1,
                currentXP: (profile as any).xp || 0,
                xpToNextLevel: 1000,
                totalWorkoutsCompleted: (profile as any).totalWorkouts || 0,
                unlockedExercises: []
            },
            fitnessProfile: profile.fitnessProfile || {
                equipmentAccess: 'bodyweight',
                availableEquipment: [],
                experienceLevel: 'beginner',
                fitnessGoals: ['Weight Loss'],
                healthIssues: [],
                availableDays: 6
            }
        };



        const availableExercises = this.filterExercises(safeProfile);
        const sessions = this.createSessions(safeProfile, availableExercises);
        const metrics = this.calculateMetrics(sessions, safeProfile);

        return {
            id: `plan_${Date.now()}`,
            userId,
            name: `${profile.fitnessProfile.fitnessGoals[0] || 'Fitness'} Plan`,
            description: `A customized ${profile.fitnessProfile.experienceLevel} plan focusing on ${profile.fitnessProfile.fitnessGoals.join(', ')}.`,
            sessions,
            metrics,
            difficulty: profile.fitnessProfile.experienceLevel,
            frequency: profile.fitnessProfile.availableDays,
            duration: 4, // 4 weeks
            startDate: new Date(),
            endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks
            status: 'active',
            isActive: true,
            levelRequirement: profile.progressSystem.currentLevel
        };
    }

    /**
     * Filters exercises based on user's equipment and level
     */
    private static filterExercises(profile: UserProfile): Exercise[] {
        const { equipmentAccess } = profile.fitnessProfile;
        const availableEquipment = profile.fitnessProfile.availableEquipment || [];
        const { currentLevel } = profile.progressSystem;

        const filtered = exercises.filter(ex => {
            // 1. Level check - STRICT
            const isUnlocked = ex.unlockLevel <= currentLevel;
            if (!isUnlocked) return false;

            // 2. Equipment access check - STRICT ENFORCEMENT
            // Bodyweight profile MUST NOT see weighted exercises
            if (equipmentAccess === 'bodyweight' && ex.equipmentRequired !== 'bodyweight') {
                return false;
            }

            // Home profile can see bodyweight and home exercises
            if (equipmentAccess === 'home' && ex.equipmentRequired === 'gym') {
                return false;
            }

            // 3. Granular Equipment check (for specific tools like dumbbells)
            if (ex.requiredEquipment && ex.requiredEquipment.length > 0 && ex.requiredEquipment[0] !== 'none') {
                const hasRequiredItems = ex.requiredEquipment.every(req =>
                    availableEquipment.includes(req as any)
                );
                if (!hasRequiredItems && equipmentAccess !== 'gym') return false;
            }

            return true;
        });

        // Safety Fallback: If no exercises found (e.g. data mismatch), 
        // return at least basic bodyweight exercises
        if (filtered.length === 0) {
            console.warn('[PlanGenerator] No exercises matched filters. Using bodyweight fallback.');
            return exercises.filter(ex => ex.equipmentRequired === 'bodyweight' && ex.unlockLevel <= currentLevel);
        }

        return filtered;
    }

    private static checkEquipmentMatch(userAccess: 'bodyweight' | 'home' | 'gym', exerciseReq: 'bodyweight' | 'home' | 'gym'): boolean {
        if (userAccess === 'gym') return true; // Gym access includes everything
        if (userAccess === 'home') return exerciseReq !== 'gym'; // Home access includes bodyweight and home
        return exerciseReq === 'bodyweight'; // Bodyweight only
    }

    /**
     * Creates sessions based on available days and goals with intelligent periodization
     */
    private static createSessions(profile: UserProfile, availableExercises: Exercise[]): WorkoutSession[] {
        const sessions: WorkoutSession[] = [];
        const availableDays = 7; // Fixed to 7 days for unified split

        // Determine session split pattern based on frequency
        const targetSplit = this.determineSplitPattern(availableDays, profile.fitnessProfile.experienceLevel);

        let patternIndex = 0;

        // Simple 28-day schedule based on frequency
        for (let i = 0; i < 28; i++) {
            const dayOfWeek = i % 7;
            const weekNumber = Math.floor(i / 7);
            const isDeloadWeek = weekNumber === 3; // Week 4 is deload

            const isWorkoutDay = true; // Every day is a workout day now

            if (isWorkoutDay) {
                const focus = targetSplit[dayOfWeek];
                const sessionType = this.getSessionType(focus);

                sessions.push({
                    id: `session_${i}`,
                    day: i + 1,
                    dayOfWeek: i % 7,
                    title: this.getSessionTitle(focus, i + 1),
                    focus: this.getFocusDescription(focus),
                    exercises: this.selectExercisesForSession(
                        profile,
                        availableExercises,
                        focus,
                        isDeloadWeek
                    ),
                    status: 'scheduled',
                    type: sessionType,
                    duration: this.estimateSessionDuration(focus, isDeloadWeek),
                    isRestDay: false,
                    intensity: isDeloadWeek ? 'low' : this.getIntensity(profile.fitnessProfile.experienceLevel),
                    warmup: this.getWarmupRecommendation(focus),
                    cooldown: this.getCooldownRecommendation(focus)
                });

                patternIndex++;
            }
        }

        return sessions;
    }

    /**
     * Determine optimal split pattern based on weekly frequency
     */
    private static determineSplitPattern(frequency: number, experienceLevel: string = 'intermediate'): SessionFocus[] {

        // Return consistent 7-day split sequence for all users
        // 0=Sun (Full), 1=Mon (Upper), 2=Tue (Upper), 3=Wed (Lower), 4=Thu (Upper), 5=Fri (Upper), 6=Sat (Lower)
        return ['fullbody', 'upper', 'upper', 'lower', 'upper', 'upper', 'lower'];
    }

    private static getSessionType(focus: SessionFocus): WorkoutSession['type'] {
        if (focus === 'cardio') return 'cardio';
        if (focus === 'recovery') return 'flexibility';
        if (focus === 'hybrid') return 'strength'; // Hybrid is primarily strength with cardio
        return 'strength';
    }

    private static getSessionTitle(focus: SessionFocus, day: number): string {
        const titles: Record<SessionFocus, string> = {
            upper: 'Upper Body',
            lower: 'Lower Body',
            fullbody: 'Full Body',
            cardio: 'Cardio',
            recovery: 'Recovery',
            hybrid: 'Full Body'
        };
        return `${titles[focus]} - Day ${day}`;
    }

    private static getFocusDescription(focus: SessionFocus): string {
        const descriptions: Record<SessionFocus, string> = {
            upper: 'Upper Body',
            lower: 'Lower Body',
            fullbody: 'Full Body',
            cardio: 'Cardio',
            recovery: 'Recovery',
            hybrid: 'Full Body'
        };
        return descriptions[focus];
    }

    private static getWarmupRecommendation(focus: SessionFocus): string {
        if (focus === 'cardio') {
            return '5 min light cardio: Running in place, jumping jacks';
        } else if (focus === 'recovery') {
            return 'Gentle breathing and light stretching';
        } else if (focus === 'upper') {
            return 'Arm circles, shoulder rolls, 5 min light cardio';
        } else if (focus === 'lower') {
            return 'Leg swings, bodyweight squats, light cardio';
        } else if (focus === 'hybrid') {
            return '5-10 min dynamic full body warm-up';
        } else {
            return '5-10 min dynamic stretching and light cardio';
        }
    }

    private static getCooldownRecommendation(focus: SessionFocus): string {
        if (focus === 'cardio' || focus === 'recovery') {
            return 'Light stretching, deep breathing (5-10 min)';
        }
        return 'Static stretching of worked muscles (10-15 min)';
    }

    private static estimateSessionDuration(focus: SessionFocus, isDeload: boolean): number {
        const baseDurations: Record<SessionFocus, number> = {
            upper: 50,
            lower: 50,
            fullbody: 60,
            cardio: 30,
            recovery: 25,
            hybrid: 55
        };
        return isDeload ? Math.floor(baseDurations[focus] * 0.7) : baseDurations[focus];
    }

    private static getIntensity(level: string): 'low' | 'moderate' | 'high' {
        if (level === 'beginner') return 'moderate';
        if (level === 'intermediate') return 'moderate';
        return 'high';
    }

    private static isWorkoutDay(day: number, frequency: number): boolean {
        // Every day is a workout day
        return true;
    }

    /**
     * Intelligently selects exercises for a session with muscle group balancing
     */
    private static selectExercisesForSession(
        profile: UserProfile,
        pool: Exercise[],
        focus: SessionFocus,
        isDeload: boolean
    ): PlannedExercise[] {
        const { currentLevel } = profile.progressSystem;
        const selected: Exercise[] = [];

        // Always start with warmup exercises
        const warmupExercises = this.selectWarmupExercises(pool, 1);
        selected.push(...warmupExercises);

        // Select main exercises based on focus and level
        const mainCount = this.getMainExerciseCount(profile.fitnessProfile.experienceLevel);
        const mainExercises = this.selectMainExercises(pool, focus, mainCount);
        selected.push(...mainExercises);

        // Add cooldown exercises
        const cooldownExercises = this.selectCooldownExercises(pool, 1);
        selected.push(...cooldownExercises);

        // Convert to PlannedExercise with progressive overload and goal-based scaling
        return selected.map(ex => {
            const levelBonus = currentLevel - ex.unlockLevel;
            let reps = ex.baseReps;
            let sets = ex.baseSets;

            // 1. Goal-based Scaling
            if (profile.fitnessGoal === 'weight_loss' || profile.fitnessGoal === 'endurance') {
                reps = Math.floor(reps * 1.2); // Higher volume for calorie burn / endurance
            } else if (profile.fitnessGoal === 'muscle_gain') {
                sets = sets + 1; // More sets for hypertrophy
                reps = Math.min(reps, 12); // Focus on hypertrophy range
            }

            // 2. Age-based moderation (joint safety for older users)
            if (profile.age && profile.age > 50) {
                if (ex.category === 'plyometric') {
                    sets = Math.max(1, sets - 1);
                }
            }

            // 3. Weight-based scaling (for bodyweight exercises)
            if (ex.equipmentRequired === 'bodyweight' && profile.weight && profile.weight > 100) {
                reps = Math.max(5, Math.floor(reps * 0.8)); // Harder to move more mass
            }

            // Apply Level Bonus & Deload
            const deloadFactor = isDeload ? 0.7 : 1.0;
            const finalReps = Math.max(1, Math.floor((reps + (levelBonus * ex.repIncrement)) * deloadFactor));
            const finalSets = Math.max(1, Math.floor((sets + Math.floor(levelBonus / 5) * ex.setIncrement) * deloadFactor));

            return {
                ...ex,
                exerciseId: ex.id,
                reps: finalReps,
                sets: finalSets,
                rest: this.calculateRestTime(ex.category, profile.fitnessProfile.experienceLevel, profile.age || 30),
                completed: false
            };
        });
    }

    /**
     * Select warmup exercises (cardio or flexibility)
     */
    private static selectWarmupExercises(pool: Exercise[], count: number): Exercise[] {
        const warmupPool = pool.filter(ex =>
            ex.category === 'cardio' &&
            (ex.id === 'running-in-place' || ex.id === 'jumping-jacks' || ex.id === 'high-knees')
        );
        return this.randomSelect(warmupPool, Math.min(count, warmupPool.length));
    }

    /**
     * Select cooldown exercises (flexibility)
     */
    private static selectCooldownExercises(pool: Exercise[], count: number): Exercise[] {
        const cooldownPool = pool.filter(ex => ex.category === 'flexibility');
        return this.randomSelect(cooldownPool, Math.min(count, cooldownPool.length));
    }

    /**
     * Select main exercises based on session focus with muscle group balancing
     */
    private static selectMainExercises(pool: Exercise[], focus: SessionFocus, count: number): Exercise[] {
        let targetMuscles: string[] = [];
        let targetCategories: Exercise['category'][] = ['strength'];

        if (focus === 'upper') {
            targetMuscles = ['chest', 'back', 'shoulders', 'arms'];
            // Upper body days now include 1 cardio exercise at the end
            const cardioCount = 1;
            const strengthCount = Math.max(1, count - cardioCount);

            const strengthPool = pool.filter(ex =>
                ex.category === 'strength' &&
                (ex.muscleGroups as string[]).some(mg => targetMuscles.includes(mg))
            );
            const strengthExercises = this.balanceMuscleGroups(strengthPool, targetMuscles, strengthCount);

            const cardioPool = pool.filter(ex => {
                const matchesCategory = ex.category === 'cardio' || ex.category === 'plyometric';
                const isWarmupCooldown = ex.id === 'running-in-place' || ex.id === 'jumping-jacks' || ex.id === 'high-knees';
                return matchesCategory && !isWarmupCooldown;
            });
            const cardioExercises = this.randomSelect(cardioPool, cardioCount);

            return [...strengthExercises, ...cardioExercises];
        } else if (focus === 'lower') {
            targetMuscles = ['legs', 'core'];
        } else if (focus === 'fullbody') {
            targetMuscles = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
        } else if (focus === 'cardio') {
            targetCategories = ['cardio', 'plyometric'];
        } else if (focus === 'recovery') {
            targetCategories = ['flexibility'];
        } else if (focus === 'hybrid') {
            // Hybrid: 50% Strength + 50% Cardio
            const halfCount = Math.ceil(count / 2);

            // Get strength exercises (full body focus)
            const strengthMuscles = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
            const strengthPool = pool.filter(ex => {
                const matchesCategory = ex.category === 'strength';
                const matchesMuscle = (ex.muscleGroups as string[]).some(mg => strengthMuscles.includes(mg));
                const isWarmupCooldown = ex.id === 'running-in-place' || ex.id === 'jumping-jacks' ||
                    ex.id === 'high-knees' || ex.category === 'flexibility';
                return matchesCategory && matchesMuscle && !isWarmupCooldown;
            });
            const strengthExercises = this.balanceMuscleGroups(strengthPool, strengthMuscles, halfCount);

            // Get cardio exercises
            const cardioPool = pool.filter(ex => {
                const matchesCategory = ex.category === 'cardio' || ex.category === 'plyometric';
                const isWarmupCooldown = ex.id === 'running-in-place' || ex.id === 'jumping-jacks' ||
                    ex.id === 'high-knees' || ex.category === 'flexibility';
                return matchesCategory && !isWarmupCooldown;
            });
            const cardioExercises = this.randomSelect(cardioPool, Math.min(count - halfCount, cardioPool.length));

            // Combine and return
            return [...strengthExercises, ...cardioExercises];
        }

        // Filter pool by focus
        const focusedPool = pool.filter(ex => {
            const matchesCategory = targetCategories.includes(ex.category);
            const matchesMuscle = targetMuscles.length === 0 ||
                (ex.muscleGroups as string[]).some(mg => targetMuscles.includes(mg));

            // Exclude warmup/cooldown specific exercises from main workout
            const isWarmupCooldown = ex.id === 'running-in-place' || ex.id === 'jumping-jacks' ||
                ex.id === 'high-knees' || ex.category === 'flexibility';

            return (matchesCategory || matchesMuscle) && !isWarmupCooldown;
        });

        // Balance muscle groups
        const balanced = this.balanceMuscleGroups(focusedPool, targetMuscles, count);
        return balanced;
    }

    /**
     * Balance exercises to cover different muscle groups
     */
    private static balanceMuscleGroups(pool: Exercise[], targetMuscles: string[], count: number): Exercise[] {
        if (pool.length === 0) return [];

        const selected: Exercise[] = [];
        const usedMuscles = new Set<string>();

        // First pass: try to get one exercise per muscle group
        for (const muscle of targetMuscles) {
            if (selected.length >= count) break;

            const candidates = pool.filter(ex =>
                (ex.muscleGroups as string[]).includes(muscle) &&
                !selected.includes(ex)
            );

            if (candidates.length > 0) {
                const exercise = candidates[Math.floor(Math.random() * candidates.length)];
                selected.push(exercise);
                (exercise.muscleGroups as string[]).forEach(mg => usedMuscles.add(mg));
            }
        }

        // Second pass: fill remaining slots with variety
        const remaining = pool.filter(ex => !selected.includes(ex));
        const additionalCount = count - selected.length;
        const additional = this.randomSelect(remaining, Math.min(additionalCount, remaining.length));

        return [...selected, ...additional];
    }

    /**
     * Randomly select exercises from pool
     */
    private static randomSelect(pool: Exercise[], count: number): Exercise[] {
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Calculate rest time based on exercise type, user level, and age
     */
    private static calculateRestTime(category: Exercise['category'], level: string, age: number): number {
        const baseTimes: Record<Exercise['category'], number> = {
            strength: 90,
            cardio: 45,
            flexibility: 15,
            plyometric: 60
        };

        const levelMultipliers: Record<string, number> = {
            beginner: 1.2,
            intermediate: 1.0,
            advanced: 0.8
        };

        // Age factor: slightly longer rest for older adults
        const ageMultiplier = age > 50 ? 1.2 : 1.0;

        return Math.floor(baseTimes[category] * (levelMultipliers[level] || 1.0) * ageMultiplier);
    }

    /**
     * Calculate accurate metrics based on actual workout data
     */
    private static calculateMetrics(sessions: WorkoutSession[], profile: UserProfile): PlanMetrics {
        const workoutSessions = sessions.filter(s => s.type !== 'rest');

        // Calculate total volume (sets × reps)
        let totalVolume = 0;
        const muscleGroupCoverage = new Set<string>();

        workoutSessions.forEach(session => {
            session.exercises.forEach(ex => {
                const reps = typeof ex.reps === 'number' ? ex.reps : 10;
                totalVolume += ex.sets * reps;

                if (ex.muscleGroups) {
                    (ex.muscleGroups as string[]).forEach(mg => muscleGroupCoverage.add(mg));
                }
            });
        });

        // Calculate estimated calories (using MET values and user weight)
        let estimatedCalories = 0;
        const userWeight = profile.weight || 70;

        workoutSessions.forEach(session => {
            // Estimate duration in hours (avg 45 mins per session if not specified)
            const durationHours = (session.duration || 45) / 60;

            // Average MET for various workout types
            let avgMET = 5.0; // Moderate resistance
            if (session.focus === 'fullbody') avgMET = 6.0;
            if (session.type === 'cardio') avgMET = 8.0;

            // Calories = MET * weight(kg) * duration(hr)
            estimatedCalories += avgMET * userWeight * durationHours;
        });

        return {
            totalVolume,
            averageSessionDuration: workoutSessions.reduce((sum, s) => sum + s.duration, 0) / workoutSessions.length,
            weeklyIntensity: this.calculateIntensityScore(profile.fitnessProfile.experienceLevel),
            totalWorkouts: workoutSessions.length,
            estimatedCalories: Math.round(estimatedCalories),
            focusMuscles: Array.from(muscleGroupCoverage),
            weeklyFrequency: Math.round(workoutSessions.length / 4)
        };
    }

    private static calculateIntensityScore(level: string): number {
        const scores: Record<string, number> = {
            beginner: 4,
            intermediate: 6,
            advanced: 8
        };
        return scores[level] || 5;
    }

    /**
     * Get number of consecutive workout days before current day
     */
    private static getConsecutiveWorkoutDays(sessions: WorkoutSession[], currentDay: number): number {
        let count = 0;
        for (let i = currentDay - 1; i >= 0; i--) {
            if (sessions[i] && !sessions[i].isRestDay && sessions[i].type !== 'rest') {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    /**
     * Select exercises for active recovery session
     */
    private static selectActiveRecoveryExercises(profile: UserProfile): PlannedExercise[] {
        // Select 4-5 recovery exercises
        const recoveryPool = RECOVERY_EXERCISES.filter(ex => {
            // Filter by equipment availability
            if (profile.fitnessProfile.equipmentAccess === 'bodyweight') {
                return ex.equipmentRequired === 'bodyweight';
            }
            return true;
        });

        const selected = this.randomSelect(recoveryPool, Math.min(4, recoveryPool.length));

        return selected.map(ex => ({
            ...ex,
            exerciseId: ex.id,
            reps: ex.baseReps,
            sets: ex.baseSets,
            rest: 30, // Short rest for recovery
            completed: false
        }));
    }

    /**
     * Generate detailed rest day notes with guidance
     */
    private static generateRestDayNotes(guidance: any): string {
        return `**Complete Rest Day - Focus on Recovery**

Your body needs this rest to adapt and grow stronger. Use this day wisely!

**Nutrition Focus:**
${guidance.nutritionFocus.slice(0, 3).map((tip: string) => `• ${tip}`).join('\n')}

**Sleep Recommendations:**
${guidance.sleepRecommendations.slice(0, 2).map((tip: string) => `• ${tip}`).join('\n')}

**Optional Light Activities:**
${guidance.recoveryActivities.slice(0, 3).map((activity: string) => `• ${activity}`).join('\n')}

**Mental Recovery:**
${guidance.mentalRecovery.slice(0, 2).map((activity: string) => `• ${activity}`).join('\n')}

**Hydration Goal:** ${guidance.hydrationGoal}

Remember: Rest days are when your muscles actually grow and adapt. They're just as important as workout days!`;
    }
    /**
     * Get number of main exercises based on user level
     */
    private static getMainExerciseCount(level: string): number {
        switch (level) {
            case 'beginner': return 2;
            case 'intermediate': return 3;
            case 'advanced': return 4;
            default: return 3;
        }
    }
}

