export interface NutritionProfile {
    // Caloric Targets
    dailyCalories: number;
    bmr: number; // Basal Metabolic Rate
    tdee: number; // Total Daily Energy Expenditure

    // Macronutrient Breakdown (grams per day)
    macros: {
        protein: number;
        carbs: number;
        fats: number;
    };

    // Percentage breakdown
    macroPercentages: {
        protein: number;
        carbs: number;
        fats: number;
    };

    // Meal Distribution
    mealPlan: {
        mealsPerDay: number; // 3-6 meals
        mealTimings: MealTiming[];
    };

    // Hydration
    waterIntake: number; // Liters per day
}

export interface MealTiming {
    id: string;
    name: string; // "Breakfast", "Pre-Workout Snack", "Lunch", etc.
    time: string; // "07:00"
    calories: number;
    macros: {
        protein: number;
        carbs: number;
        fats: number;
    };
    notes?: string; // e.g., "30-60 min before workout"
}

export interface FoodSuggestion {
    category: 'protein' | 'carbs' | 'fats' | 'vegetables' | 'fruits';
    name: string;
    servingSize: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    dietaryType: 'veg' | 'non-veg' | 'both';
    benefits?: string[];
}

export interface DietPlan {
    id: string;
    userId: string;
    goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance' | 'flexibility';
    nutritionProfile: NutritionProfile;

    // Guidelines and tips
    guidelines: string[];

    // Food suggestions organized by category
    foodSuggestions: {
        protein: FoodSuggestion[];
        carbs: FoodSuggestion[];
        fats: FoodSuggestion[];
        vegetables: FoodSuggestion[];
        fruits: FoodSuggestion[];
    };

    // Timing recommendations
    preworkoutTips: string[];
    postworkoutTips: string[];

    createdAt: Date;
    updatedAt: Date;
}

export interface NutritionPreferences {
    // Dietary restrictions
    dietType?: 'veg' | 'non-veg';
    restrictions: string[]; // "gluten-free", "dairy-free", "nut-free", etc.
    allergies: string[];

    // Meal preferences
    mealsPerDay: number; // 3-6
    preferredMealTimes: string[]; // ["07:00", "12:00", "19:00"]

    // Dislikes
    dislikedFoods: string[];
}

// Activity level multipliers for TDEE
export enum ActivityLevel {
    SEDENTARY = 1.2,         // 0-1 workouts/week
    LIGHT = 1.375,           // 1-3 workouts/week
    MODERATE = 1.55,         // 3-5 workouts/week
    ACTIVE = 1.725,          // 6-7 workouts/week
    VERY_ACTIVE = 1.9        // 2x per day
}

// Macro distribution presets
export interface MacroRatio {
    protein: number; // percentage
    carbs: number;   // percentage
    fats: number;    // percentage
}

export const MACRO_PRESETS: Record<string, MacroRatio> = {
    weight_loss: { protein: 35, carbs: 35, fats: 30 },
    muscle_gain: { protein: 30, carbs: 45, fats: 25 },
    endurance: { protein: 20, carbs: 55, fats: 25 },
    maintenance: { protein: 25, carbs: 45, fats: 30 },
    flexibility: { protein: 25, carbs: 45, fats: 30 }
};
