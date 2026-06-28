import { UserProfile } from '../types';
import {
    NutritionProfile,
    DietPlan,
    MealTiming,
    FoodSuggestion,
    ActivityLevel,
    MACRO_PRESETS,
    NutritionPreferences
} from '../types/nutrition';

class NutritionService {
    /**
     * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
     */
    calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female' | 'other'): number {
        // Mifflin-St Jeor Equation
        // Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
        // Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161

        const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);

        if (gender === 'male') {
            return baseBMR + 5;
        } else {
            return baseBMR - 161;
        }
    }

    /**
     * Determine activity level based on workout frequency
     */
    getActivityLevel(totalWorkouts: number): ActivityLevel {
        const workoutsPerWeek = totalWorkouts > 50 ? 5 : Math.min(totalWorkouts / 4, 7); // Estimate weekly frequency

        if (workoutsPerWeek <= 1) return ActivityLevel.SEDENTARY;
        if (workoutsPerWeek <= 3) return ActivityLevel.LIGHT;
        if (workoutsPerWeek <= 5) return ActivityLevel.MODERATE;
        if (workoutsPerWeek <= 7) return ActivityLevel.ACTIVE;
        return ActivityLevel.VERY_ACTIVE;
    }

    /**
     * Calculate Total Daily Energy Expenditure
     */
    calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
        return Math.round(bmr * activityLevel);
    }

    /**
     * Adjust calories based on fitness goal
     */
    adjustCaloriesForGoal(tdee: number, goal: UserProfile['fitnessGoal']): number {
        switch (goal) {
            case 'weight_loss':
                return Math.round(tdee * 0.85); // 15% deficit
            case 'muscle_gain':
                return Math.round(tdee * 1.12); // 12% surplus
            case 'endurance':
                return Math.round(tdee * 1.05); // 5% surplus
            case 'flexibility':
            default:
                return tdee; // Maintenance
        }
    }

    /**
     * Calculate macronutrient breakdown in grams
     */
    calculateMacros(calories: number, goal: UserProfile['fitnessGoal']): NutritionProfile['macros'] {
        const ratios = MACRO_PRESETS[goal] || MACRO_PRESETS.maintenance;

        // Calculate grams
        // Protein & Carbs: 4 calories/gram
        // Fats: 9 calories/gram
        const protein = Math.round((calories * ratios.protein / 100) / 4);
        const carbs = Math.round((calories * ratios.carbs / 100) / 4);
        const fats = Math.round((calories * ratios.fats / 100) / 9);

        return { protein, carbs, fats };
    }

    /**
     * Generate meal timing schedule based on workout routine
     */
    generateMealTimings(
        mealsPerDay: number,
        totalCalories: number,
        macros: NutritionProfile['macros']
    ): MealTiming[] {
        const timings: MealTiming[] = [];

        if (mealsPerDay === 3) {
            // Breakfast, Lunch, Dinner
            timings.push(
                {
                    id: 'breakfast',
                    name: 'Breakfast',
                    time: '07:30',
                    calories: Math.round(totalCalories * 0.30),
                    macros: {
                        protein: Math.round(macros.protein * 0.25),
                        carbs: Math.round(macros.carbs * 0.30),
                        fats: Math.round(macros.fats * 0.30)
                    }
                },
                {
                    id: 'lunch',
                    name: 'Lunch',
                    time: '13:00',
                    calories: Math.round(totalCalories * 0.35),
                    macros: {
                        protein: Math.round(macros.protein * 0.35),
                        carbs: Math.round(macros.carbs * 0.40),
                        fats: Math.round(macros.fats * 0.35)
                    }
                },
                {
                    id: 'dinner',
                    name: 'Dinner',
                    time: '19:30',
                    calories: Math.round(totalCalories * 0.35),
                    macros: {
                        protein: Math.round(macros.protein * 0.40),
                        carbs: Math.round(macros.carbs * 0.30),
                        fats: Math.round(macros.fats * 0.35)
                    }
                }
            );
        } else if (mealsPerDay === 4) {
            // Breakfast, Lunch, Snack, Dinner
            timings.push(
                {
                    id: 'breakfast',
                    name: 'Breakfast',
                    time: '07:30',
                    calories: Math.round(totalCalories * 0.25),
                    macros: {
                        protein: Math.round(macros.protein * 0.20),
                        carbs: Math.round(macros.carbs * 0.25),
                        fats: Math.round(macros.fats * 0.25)
                    }
                },
                {
                    id: 'lunch',
                    name: 'Lunch',
                    time: '13:00',
                    calories: Math.round(totalCalories * 0.30),
                    macros: {
                        protein: Math.round(macros.protein * 0.30),
                        carbs: Math.round(macros.carbs * 0.35),
                        fats: Math.round(macros.fats * 0.30)
                    }
                },
                {
                    id: 'snack',
                    name: 'Pre-Workout Snack',
                    time: '16:00',
                    calories: Math.round(totalCalories * 0.15),
                    macros: {
                        protein: Math.round(macros.protein * 0.15),
                        carbs: Math.round(macros.carbs * 0.20),
                        fats: Math.round(macros.fats * 0.10)
                    },
                    notes: '30-60 min before workout'
                },
                {
                    id: 'dinner',
                    name: 'Dinner',
                    time: '19:30',
                    calories: Math.round(totalCalories * 0.30),
                    macros: {
                        protein: Math.round(macros.protein * 0.35),
                        carbs: Math.round(macros.carbs * 0.20),
                        fats: Math.round(macros.fats * 0.35)
                    }
                }
            );
        } else {
            // 5-6 meals: Breakfast, Mid-morning, Lunch, Pre-workout, Dinner, Evening
            timings.push(
                {
                    id: 'breakfast',
                    name: 'Breakfast',
                    time: '07:00',
                    calories: Math.round(totalCalories * 0.20),
                    macros: {
                        protein: Math.round(macros.protein * 0.15),
                        carbs: Math.round(macros.carbs * 0.20),
                        fats: Math.round(macros.fats * 0.20)
                    }
                },
                {
                    id: 'midmorning',
                    name: 'Mid-Morning Snack',
                    time: '10:00',
                    calories: Math.round(totalCalories * 0.15),
                    macros: {
                        protein: Math.round(macros.protein * 0.15),
                        carbs: Math.round(macros.carbs * 0.15),
                        fats: Math.round(macros.fats * 0.15)
                    }
                },
                {
                    id: 'lunch',
                    name: 'Lunch',
                    time: '13:00',
                    calories: Math.round(totalCalories * 0.25),
                    macros: {
                        protein: Math.round(macros.protein * 0.25),
                        carbs: Math.round(macros.carbs * 0.30),
                        fats: Math.round(macros.fats * 0.25)
                    }
                },
                {
                    id: 'preworkout',
                    name: 'Pre-Workout',
                    time: '16:00',
                    calories: Math.round(totalCalories * 0.15),
                    macros: {
                        protein: Math.round(macros.protein * 0.15),
                        carbs: Math.round(macros.carbs * 0.20),
                        fats: Math.round(macros.fats * 0.10)
                    },
                    notes: '45-60 min before workout'
                },
                {
                    id: 'dinner',
                    name: 'Dinner',
                    time: '19:30',
                    calories: Math.round(totalCalories * 0.20),
                    macros: {
                        protein: Math.round(macros.protein * 0.25),
                        carbs: Math.round(macros.carbs * 0.10),
                        fats: Math.round(macros.fats * 0.25)
                    }
                }
            );

            if (mealsPerDay === 6) {
                timings.push({
                    id: 'evening',
                    name: 'Evening Snack',
                    time: '21:30',
                    calories: Math.round(totalCalories * 0.05),
                    macros: {
                        protein: Math.round(macros.protein * 0.05),
                        carbs: Math.round(macros.carbs * 0.05),
                        fats: Math.round(macros.fats * 0.05)
                    },
                    notes: 'Light protein snack'
                });
            }
        }

        return timings;
    }

    /**
     * Get food suggestions based on goal
     */
    getFoodSuggestions(goal: UserProfile['fitnessGoal']): DietPlan['foodSuggestions'] {
        const proteinFoods: FoodSuggestion[] = [
            { category: 'protein', name: 'Chicken Breast', servingSize: '100g', calories: 165, protein: 31, carbs: 0, fats: 3.6, dietaryType: 'non-veg', benefits: ['Lean protein', 'Low fat'] },
            { category: 'protein', name: 'Greek Yogurt', servingSize: '150g', calories: 100, protein: 17, carbs: 6, fats: 0.4, dietaryType: 'veg', benefits: ['Probiotics', 'Calcium'] },
            { category: 'protein', name: 'Eggs', servingSize: '2 large', calories: 140, protein: 12, carbs: 1, fats: 10, dietaryType: 'veg', benefits: ['Complete protein', 'Vitamin D'] },
            { category: 'protein', name: 'Salmon', servingSize: '100g', calories: 208, protein: 20, carbs: 0, fats: 13, dietaryType: 'non-veg', benefits: ['Omega-3', 'Vitamin B12'] },
            { category: 'protein', name: 'Tofu', servingSize: '100g', calories: 76, protein: 8, carbs: 2, fats: 4.8, dietaryType: 'veg', benefits: ['Plant-based', 'Iron'] },
            { category: 'protein', name: 'Lentils', servingSize: '100g cooked', calories: 116, protein: 9, carbs: 20, fats: 0.4, dietaryType: 'veg', benefits: ['Fiber', 'Plant protein'] },
            { category: 'protein', name: 'Cottage Cheese', servingSize: '100g', calories: 98, protein: 11, carbs: 3.4, fats: 4.3, dietaryType: 'veg', benefits: ['Casein protein', 'Low carb'] },
            { category: 'protein', name: 'Turkey Breast', servingSize: '100g', calories: 135, protein: 30, carbs: 0, fats: 0.7, dietaryType: 'non-veg', benefits: ['Very lean', 'Low calorie'] }
        ];

        const carbFoods: FoodSuggestion[] = [
            { category: 'carbs', name: 'Brown Rice', servingSize: '100g cooked', calories: 112, protein: 2.6, carbs: 24, fats: 0.9, dietaryType: 'both', benefits: ['Fiber', 'B vitamins'] },
            { category: 'carbs', name: 'Sweet Potato', servingSize: '100g', calories: 86, protein: 1.6, carbs: 20, fats: 0.1, dietaryType: 'both', benefits: ['Vitamin A', 'Fiber'] },
            { category: 'carbs', name: 'Oats', servingSize: '40g dry', calories: 150, protein: 5, carbs: 27, fats: 3, dietaryType: 'both', benefits: ['Beta-glucan', 'Sustained energy'] },
            { category: 'carbs', name: 'Quinoa', servingSize: '100g cooked', calories: 120, protein: 4.4, carbs: 21, fats: 1.9, dietaryType: 'both', benefits: ['Complete protein', 'Gluten-free'] },
            { category: 'carbs', name: 'Whole Wheat Bread', servingSize: '2 slices', calories: 160, protein: 8, carbs: 28, fats: 2, dietaryType: 'both', benefits: ['Fiber', 'B vitamins'] },
            { category: 'carbs', name: 'Banana', servingSize: '1 medium', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, dietaryType: 'both', benefits: ['Potassium', 'Quick energy'] },
            { category: 'carbs', name: 'Pasta', servingSize: '100g cooked', calories: 131, protein: 5, carbs: 25, fats: 1.1, dietaryType: 'both', benefits: ['Energy', 'Easy to digest'] }
        ];

        const fatFoods: FoodSuggestion[] = [
            { category: 'fats', name: 'Avocado', servingSize: '½ medium', calories: 120, protein: 1.5, carbs: 6, fats: 11, dietaryType: 'both', benefits: ['Monounsaturated fats', 'Fiber'] },
            { category: 'fats', name: 'Almonds', servingSize: '28g (23 almonds)', calories: 164, protein: 6, carbs: 6, fats: 14, dietaryType: 'both', benefits: ['Vitamin E', 'Magnesium'] },
            { category: 'fats', name: 'Olive Oil', servingSize: '1 tbsp', calories: 119, protein: 0, carbs: 0, fats: 13.5, dietaryType: 'both', benefits: ['Heart healthy', 'Antioxidants'] },
            { category: 'fats', name: 'Peanut Butter', servingSize: '2 tbsp', calories: 188, protein: 8, carbs: 7, fats: 16, dietaryType: 'both', benefits: ['Protein', 'Satisfying'] },
            { category: 'fats', name: 'Chia Seeds', servingSize: '28g', calories: 138, protein: 4.7, carbs: 12, fats: 8.7, dietaryType: 'both', benefits: ['Omega-3', 'Fiber'] },
            { category: 'fats', name: 'Walnuts', servingSize: '28g', calories: 185, protein: 4.3, carbs: 3.9, fats: 18.5, dietaryType: 'both', benefits: ['Brain health', 'Omega-3'] }
        ];

        const vegetables: FoodSuggestion[] = [
            { category: 'vegetables', name: 'Broccoli', servingSize: '100g', calories: 34, protein: 2.8, carbs: 7, fats: 0.4, dietaryType: 'both', benefits: ['Vitamin C', 'Fiber'] },
            { category: 'vegetables', name: 'Spinach', servingSize: '100g', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, dietaryType: 'both', benefits: ['Iron', 'Vitamin K'] },
            { category: 'vegetables', name: 'Bell Peppers', servingSize: '100g', calories: 31, protein: 1, carbs: 6, fats: 0.3, dietaryType: 'both', benefits: ['Vitamin C', 'Antioxidants'] },
            { category: 'vegetables', name: 'Kale', servingSize: '100g', calories: 35, protein: 2.9, carbs: 4.4, fats: 1.5, dietaryType: 'both', benefits: ['Calcium', 'Vitamin A'] },
            { category: 'vegetables', name: 'Carrots', servingSize: '100g', calories: 41, protein: 0.9, carbs: 10, fats: 0.2, dietaryType: 'both', benefits: ['Vitamin A', 'Beta-carotene'] }
        ];

        const fruits: FoodSuggestion[] = [
            { category: 'fruits', name: 'Apple', servingSize: '1 medium', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, dietaryType: 'both', benefits: ['Fiber', 'Vitamin C'] },
            { category: 'fruits', name: 'Blueberries', servingSize: '100g', calories: 57, protein: 0.7, carbs: 14, fats: 0.3, dietaryType: 'both', benefits: ['Antioxidants', 'Low GI'] },
            { category: 'fruits', name: 'Orange', servingSize: '1 medium', calories: 62, protein: 1.2, carbs: 15, fats: 0.2, dietaryType: 'both', benefits: ['Vitamin C', 'Hydrating'] },
            { category: 'fruits', name: 'Berries Mix', servingSize: '100g', calories: 50, protein: 1, carbs: 12, fats: 0.3, dietaryType: 'both', benefits: ['Antioxidants', 'Low calorie'] }
        ];

        return {
            protein: proteinFoods,
            carbs: carbFoods,
            fats: fatFoods,
            vegetables: vegetables,
            fruits: fruits
        };
    }

    /**
     * Generate complete diet plan for user
     */
    async generateDietPlan(userProfile: UserProfile, preferences?: NutritionPreferences): Promise<DietPlan> {
        // Calculate BMR if not already in profile
        const bmr = userProfile.bodyComposition?.bmr ||
            this.calculateBMR(userProfile.weight, userProfile.height, userProfile.age, userProfile.gender);

        // Determine activity level
        const activityLevel = this.getActivityLevel(userProfile.totalWorkouts);

        // Calculate TDEE
        const tdee = this.calculateTDEE(bmr, activityLevel);

        // Adjust for goal
        const dailyCalories = this.adjustCaloriesForGoal(tdee, userProfile.fitnessGoal);

        // Calculate macros
        const macros = this.calculateMacros(dailyCalories, userProfile.fitnessGoal);
        const ratios = MACRO_PRESETS[userProfile.fitnessGoal] || MACRO_PRESETS.maintenance;

        // Determine meals per day
        const mealsPerDay = preferences?.mealsPerDay || 4; // Default to 4 meals

        // Generate meal timings
        const mealTimings = this.generateMealTimings(mealsPerDay, dailyCalories, macros);

        // Calculate water intake (30-40ml per kg body weight)
        const waterIntake = Math.round((userProfile.weight * 35) / 1000 * 10) / 10; // Liters, rounded to 1 decimal

        // Create nutrition profile
        const nutritionProfile: NutritionProfile = {
            dailyCalories,
            bmr,
            tdee,
            macros,
            macroPercentages: ratios,
            mealPlan: {
                mealsPerDay,
                mealTimings
            },
            waterIntake
        };

        // Get food suggestions
        const foodSuggestions = this.getFoodSuggestions(userProfile.fitnessGoal);

        // Generate guidelines based on goal
        const guidelines = this.generateGuidelines(userProfile.fitnessGoal, dailyCalories, macros);

        // Pre/post workout tips
        const { preworkoutTips, postworkoutTips } = this.getWorkoutNutritionTips(userProfile.fitnessGoal);

        return {
            id: `diet_${userProfile.uid}_${Date.now()}`,
            userId: userProfile.uid,
            goal: userProfile.fitnessGoal,
            nutritionProfile,
            guidelines,
            foodSuggestions,
            preworkoutTips,
            postworkoutTips,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Generate diet guidelines based on goal
     */
    private generateGuidelines(goal: UserProfile['fitnessGoal'], calories: number, macros: NutritionProfile['macros']): string[] {
        const baseGuidelines = [
            `Target: ${calories} calories per day`,
            `Protein: ${macros.protein}g | Carbs: ${macros.carbs}g | Fats: ${macros.fats}g`,
            'Drink water consistently throughout the day',
            'Prioritize whole, unprocessed foods',
            'Eat slowly and mindfully'
        ];

        const goalSpecific: Record<UserProfile['fitnessGoal'], string[]> = {
            weight_loss: [
                'Focus on high-protein, high-fiber foods to stay full',
                'Avoid liquid calories (sodas, juices)',
                'Track portions to stay in calorie deficit',
                'Include vegetables in every meal for volume'
            ],
            muscle_gain: [
                'Eat slightly above maintenance calories',
                'Consume protein with every meal (aim for 20-40g)',
                'Don\'t skip post-workout nutrition',
                'Include healthy calorie-dense foods (nuts, avocado, oils)'
            ],
            endurance: [
                'Prioritize complex carbs for sustained energy',
                'Time carb intake around workouts',
                'Stay well-hydrated, especially during training',
                'Include electrolytes on long workout days'
            ],
            flexibility: [
                'Maintain balanced nutrition',
                'Focus on anti-inflammatory foods',
                'Include adequate protein for recovery',
                'Stay hydrated to support joint health'
            ]
        };

        return [...baseGuidelines, ...goalSpecific[goal]];
    }

    /**
     * Get pre/post workout nutrition tips
     */
    private getWorkoutNutritionTips(goal: UserProfile['fitnessGoal']): { preworkoutTips: string[]; postworkoutTips: string[] } {
        return {
            preworkoutTips: [
                'Eat 1-3 hours before workout',
                'Include easily digestible carbs (banana, oats, toast)',
                'Moderate protein (15-25g)',
                'Keep fats low to avoid digestive issues',
                'Stay hydrated'
            ],
            postworkoutTips: [
                'Eat within 30-60 minutes post-workout',
                goal === 'muscle_gain' ? 'Focus on protein (25-40g) and carbs' : 'Include protein (20-30g) and some carbs',
                'Rehydrate with water or electrolytes',
                'Consider chocolate milk, protein shake, or chicken with rice',
                'Listen to your hunger cues'
            ]
        };
    }
}

export default new NutritionService();
