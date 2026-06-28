import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Image,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { ThemeColorsType, ThemeShadowsType, Spacing } from '../../theme/Theme';
import NutritionService from '../../services/NutritionService';
import { DietPlan } from '../../types/nutrition';
import { RingProgress } from './RingProgress';

const NEON_GREEN = '#C4FF1A';
const CARD_BG = '#13182A';
const TILE_BG = 'rgba(255,255,255,0.04)';

const PROTEIN_COLOR = '#F472B6';
const CARBS_COLOR = '#60A5FA';
const FATS_COLOR = '#FBBF24';

interface DietTabProps {
    user: any;
}

const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function DietTab({ user }: DietTabProps) {
    const { colors, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
    const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [eatenMealIds, setEatenMealIds] = useState<string[]>([]);
    const [takenSupplementIds, setTakenSupplementIds] = useState<string[]>([]);
    const [dietaryPreference, setDietaryPreference] = useState<'veg' | 'non-veg'>('non-veg');
    const [foodCategory, setFoodCategory] = useState<'protein' | 'carbs' | 'fats'>('protein');
    const [workoutNutritionTab, setWorkoutNutritionTab] = useState<'pre' | 'post'>('pre');
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

    const weeklyRecipes = useMemo(() => [
        {
            title: 'Avocado & Quinoa Power Bowl',
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
            calories: 450, time: '15 min', difficulty: 'Easy', dietaryType: 'veg',
            ingredients: ['1 cup cooked Quinoa', '1/2 Avocado, sliced', '1/2 cup Chickpeas, rinsed', '1/4 Cucumber, diced', '1 tbsp Olive Oil', 'Lemon juice to taste', 'Salt & Pepper'],
            instructions: ['In a bowl, combine the cooked quinoa, chickpeas, and cucumber.', 'Top with fresh avocado slices.', 'Drizzle with olive oil and lemon juice.', 'Season with salt and pepper to taste.'],
            macros: { protein: 12, carbs: 45, fats: 18 }
        },
        {
            title: 'Grilled Salmon with Asparagus',
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80',
            calories: 520, time: '25 min', difficulty: 'Medium', dietaryType: 'non-veg',
            ingredients: ['1 Salmon Fillet (6oz)', '1 bunch Asparagus, trimmed', '1 tbsp Olive Oil', '1 clove Garlic, minced', 'Lemon slices', 'Fresh dill'],
            instructions: ['Season salmon fillet with salt, pepper, and minced garlic.', 'Toss asparagus with olive oil and season.', 'Grill or pan-sear salmon for 4-5 mins per side.', 'Grill asparagus until tender (approx 5 mins).', 'Serve with lemon wedges and fresh dill.'],
            macros: { protein: 42, carbs: 5, fats: 28 }
        },
        {
            title: 'Mediterranean Chickpea Bowl',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
            calories: 380, time: '20 min', difficulty: 'Easy', dietaryType: 'veg',
            ingredients: ['1 cup Chickpeas', '1/2 cup Cherry Tomatoes, halved', '1/4 cup Cucumber, diced', '2 tbsp Feta Cheese (optional)', '1 tbsp Olive Oil', 'Dried Oregano'],
            instructions: ['Rinse and drain chickpeas.', 'In a bowl, mix chickpeas, tomatoes, and cucumber.', 'Crumble toppings over the salad.', 'Drizzle with olive oil and sprinkle oregano.', 'Toss gently to combine.'],
            macros: { protein: 14, carbs: 40, fats: 15 }
        },
        {
            title: 'Chicken Teriyaki with Broccoli',
            image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&q=80',
            calories: 480, time: '30 min', difficulty: 'Medium', dietaryType: 'non-veg',
            ingredients: ['1 Chicken Breast, cubed', '1 cup Broccoli florets', '2 tbsp Teriyaki Sauce', '1/2 cup Brown Rice, cooked', '1 tsp Sesame Seeds', 'Green onions for garnish'],
            instructions: ['Sauté chicken cubes in a pan until golden.', 'Add broccoli and a splash of water, cover to steam for 3 mins.', 'Pour in teriyaki sauce and toss to coat.', 'Serve over brown rice.', 'Garnish with sesame seeds and green onions.'],
            macros: { protein: 35, carbs: 55, fats: 10 }
        },
        {
            title: 'Thai Peanut Tofu Stir-Fry',
            image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80',
            calories: 420, time: '20 min', difficulty: 'Easy', dietaryType: 'veg',
            ingredients: ['1 block Firm Tofu, cubed', '1 cup Mixed Veggies', '2 tbsp Peanut Butter', '1 tbsp Soy Sauce', '1 tsp Sriracha', '1/2 Lime'],
            instructions: ['Pan-fry tofu cubes until crispy.', 'Stir-fry mixed vegetables until tender-crisp.', 'Whisk peanut butter, soy sauce, sriracha, and lime juice.', 'Combine and serve warm.'],
            macros: { protein: 22, carbs: 30, fats: 24 }
        },
        {
            title: 'Honey Garlic Shrimp & Veggies',
            image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&q=80',
            calories: 390, time: '18 min', difficulty: 'Easy', dietaryType: 'non-veg',
            ingredients: ['1/2 lb Shrimp, peeled', '1 Zucchini, sliced', '1 tbsp Honey', '1 tbsp Soy Sauce', '1 clove Garlic, minced', 'Red pepper flakes'],
            instructions: ['Whisk honey, soy sauce, and garlic.', 'Sauté zucchini for 3 mins.', 'Add shrimp and cook until pink.', 'Pour sauce and simmer.', 'Serve immediately.'],
            macros: { protein: 30, carbs: 25, fats: 12 }
        },
        {
            title: 'Roasted Veggie Buddha Bowl',
            image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=500&q=80',
            calories: 410, time: '35 min', difficulty: 'Medium', dietaryType: 'veg',
            ingredients: ['1 cup Sweet Potato, cubed', '1 cup Kale, chopped', '1/2 cup Chickpeas', '1 tbsp Tahini', 'Lemon juice', '1 tbsp Pumpkin Seeds'],
            instructions: ['Roast sweet potato at 400°F for 25 mins.', 'Massage kale with olive oil.', 'Assemble bowl.', 'Whisk tahini dressing.', 'Drizzle and top with seeds.'],
            macros: { protein: 12, carbs: 55, fats: 16 }
        },
    ], []);

    const defaultSupplements = useMemo(() => [
        { id: 'supp_1', name: 'Whey Protein', icon: 'cup-water', schedule: 'POST-WORKOUT', calories: 120 },
        { id: 'supp_2', name: 'Creatine Monohydrate', icon: 'atom', schedule: 'DAILY · 5G', calories: 0 },
        { id: 'supp_3', name: 'Omega-3 (Fish Oil)', icon: 'fish', schedule: 'WITH MEALS', calories: 20 },
        { id: 'supp_4', name: 'Multivitamin', icon: 'pill', schedule: 'MORNING', calories: 0 }
    ], []);

    useEffect(() => {
        loadDietPlan();
    }, []);

    const loadDietPlan = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const plan = await NutritionService.generateDietPlan(user);
            setDietPlan(plan);
        } catch (error) {
            console.error('Error loading diet plan:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSuggestions = useMemo(() => {
        if (!dietPlan?.foodSuggestions) return null;
        const filterFn = (food: any) => {
            if (dietaryPreference === 'veg') return food.dietaryType !== 'non-veg';
            return true;
        };
        return {
            protein: dietPlan.foodSuggestions.protein.filter(filterFn),
            carbs: dietPlan.foodSuggestions.carbs.filter(filterFn),
            fats: dietPlan.foodSuggestions.fats.filter(filterFn),
        };
    }, [dietPlan, dietaryPreference]);

    const dailyRecipe = useMemo(() => {
        const day = new Date().getDay();
        const adjustedIndex = day === 0 ? 6 : day - 1;
        return weeklyRecipes[adjustedIndex];
    }, [weeklyRecipes]);

    const consumedCalories = useMemo(() => {
        if (!dietPlan) return 0;
        const mealCals = dietPlan.nutritionProfile.mealPlan.mealTimings
            .filter(m => eatenMealIds.includes(m.id))
            .reduce((sum, m) => sum + m.calories, 0);
        const suppCals = defaultSupplements
            .filter(s => takenSupplementIds.includes(s.id))
            .reduce((sum, s) => sum + s.calories, 0);
        return mealCals + suppCals;
    }, [eatenMealIds, takenSupplementIds, dietPlan, defaultSupplements]);

    const consumedMacros = useMemo(() => {
        if (!dietPlan) return { protein: 0, carbs: 0, fats: 0 };
        return dietPlan.nutritionProfile.mealPlan.mealTimings
            .filter(m => eatenMealIds.includes(m.id))
            .reduce((acc, m) => ({
                protein: acc.protein + m.macros.protein,
                carbs: acc.carbs + m.macros.carbs,
                fats: acc.fats + m.macros.fats,
            }), { protein: 0, carbs: 0, fats: 0 });
    }, [eatenMealIds, dietPlan]);

    if (loading || !dietPlan) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={NEON_GREEN} />
                <Text style={styles.loadingText}>Calculating your personalized nutrition plan...</Text>
            </View>
        );
    }

    const { nutritionProfile, preworkoutTips, postworkoutTips, guidelines } = dietPlan;
    const calorieProgress = Math.min(consumedCalories / nutritionProfile.dailyCalories, 1);
    const caloriesRemaining = Math.max(nutritionProfile.dailyCalories - consumedCalories, 0);
    const totalMacros = nutritionProfile.macros.protein + nutritionProfile.macros.carbs + nutritionProfile.macros.fats;
    const consumedMacrosTotal = consumedMacros.protein + consumedMacros.carbs + consumedMacros.fats;

    const goalLabel = (user?.fitnessGoal || 'maintenance')
        .replace(/_/g, ' ')
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const initials = getInitials(user?.displayName);

    const toggleMeal = (id: string) =>
        setEatenMealIds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]);

    const toggleSupplement = (id: string) =>
        setTakenSupplementIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);

    const getSuggestionItems = (meal: any) => {
        const cals = meal.calories;
        if (meal.id === 'breakfast') {
            if (dietaryPreference === 'veg') return [
                { icon: 'barley', text: `Oats (${Math.round(cals / 4)}g) + Milk` },
                { icon: 'sprout', text: '1 Banana + Almonds' }
            ];
            return [
                { icon: 'egg-outline', text: `${Math.round(cals / 70)} Eggs + Toast` },
                { icon: 'cup', text: 'Greek Yogurt + Berries' }
            ];
        }
        if (meal.id === 'lunch' || meal.id === 'dinner') {
            if (dietaryPreference === 'veg') return [
                { icon: 'cheese', text: `Tofu/Paneer (${Math.round(cals / 2.5)}g)` },
                { icon: 'bowl-mix', text: 'Rice/Quinoa + Veggies' }
            ];
            return [
                { icon: 'food-drumstick-outline', text: `Chicken Breast (${Math.round(cals / 1.5)}g)` },
                { icon: 'bowl-mix', text: 'Rice + Veggies' }
            ];
        }
        if (meal.id === 'snack' || meal.id === 'preworkout') {
            return [
                { icon: 'food-apple-outline', text: '1 Apple + Peanut Butter' },
                { icon: 'cup-water', text: 'Whey Protein Shake' }
            ];
        }
        return [
            { icon: 'cup', text: 'Protein Shake' },
            { icon: 'peanut', text: 'Handful of Nuts' }
        ];
    };

    const macroData = [
        { name: 'Protein', current: consumedMacros.protein, target: nutritionProfile.macros.protein, pct: nutritionProfile.macroPercentages.protein, color: PROTEIN_COLOR },
        { name: 'Carbs', current: consumedMacros.carbs, target: nutritionProfile.macros.carbs, pct: nutritionProfile.macroPercentages.carbs, color: CARBS_COLOR },
        { name: 'Fats', current: consumedMacros.fats, target: nutritionProfile.macros.fats, pct: nutritionProfile.macroPercentages.fats, color: FATS_COLOR },
    ];

    const activeFoodList = filteredSuggestions
        ? (foodCategory === 'protein' ? filteredSuggestions.protein
            : foodCategory === 'carbs' ? filteredSuggestions.carbs
                : filteredSuggestions.fats)
        : [];

    return (
        <>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerLabel}>Today's Nutrition</Text>
                    <Text style={styles.headerTitle} numberOfLines={1}>{dateLabel}</Text>
                </View>
                <View style={styles.avatarCircle}>
                    {user?.photoURL ? (
                        <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{initials}</Text>
                    )}
                </View>
            </View>

            {/* Goal + Veg/Non-Veg toggle */}
            <View style={styles.goalCard}>
                <View style={styles.goalAccent} />
                <View style={styles.goalIconWrap}>
                    <MaterialCommunityIcons name="dumbbell" size={20} color={NEON_GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.goalLabel}>GOAL</Text>
                    <Text style={styles.goalValue} numberOfLines={1}>{goalLabel}</Text>
                </View>
                <View style={styles.prefToggle}>
                    <TouchableOpacity
                        style={[styles.prefOption, dietaryPreference === 'veg' && styles.prefOptionActive]}
                        onPress={() => setDietaryPreference('veg')}
                    >
                        <MaterialCommunityIcons name="leaf" size={14} color={dietaryPreference === 'veg' ? '#0A0A0A' : '#FFFFFF'} />
                        <Text style={[styles.prefText, dietaryPreference === 'veg' && styles.prefTextActive]}>Veg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.prefOption, dietaryPreference === 'non-veg' && styles.prefOptionActive]}
                        onPress={() => setDietaryPreference('non-veg')}
                    >
                        <MaterialCommunityIcons name="food-drumstick" size={14} color={dietaryPreference === 'non-veg' ? '#0A0A0A' : '#FFFFFF'} />
                        <Text style={[styles.prefText, dietaryPreference === 'non-veg' && styles.prefTextActive]}>Non-Veg</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Daily Fuel */}
            <View style={styles.fuelCard}>
                <View style={styles.fuelHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>Daily Fuel</Text>
                        <Text style={styles.cardSubtitle}>Target: {nutritionProfile.dailyCalories.toLocaleString()} kcal</Text>
                    </View>
                    <View style={styles.fuelHeaderPill}>
                        <MaterialCommunityIcons name="lightning-bolt" size={12} color={NEON_GREEN} />
                        <Text style={styles.fuelHeaderPillText}>{consumedCalories} / {nutritionProfile.dailyCalories}</Text>
                    </View>
                </View>

                <View style={styles.fuelBody}>
                    <RingProgress
                        size={150}
                        strokeWidth={10}
                        progress={calorieProgress}
                        color={NEON_GREEN}
                        showHeadDot
                    >
                        <View style={styles.ringInner}>
                            <Text style={styles.ringValue}>{caloriesRemaining.toLocaleString()}</Text>
                            <Text style={styles.ringLabel}>REMAINING</Text>
                            <Text style={styles.ringFootnote}>
                                {Math.round(calorieProgress * 100)}% <Text style={styles.ringFootnoteAccent}>· {nutritionProfile.mealPlan.mealsPerDay} meals</Text>
                            </Text>
                        </View>
                    </RingProgress>

                    <View style={styles.fuelMetrics}>
                        <View style={styles.fuelMetric}>
                            <View style={styles.fuelMetricIcon}>
                                <MaterialCommunityIcons name="heart-outline" size={16} color="#FFFFFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fuelMetricLabel}>BMR</Text>
                                <Text style={styles.fuelMetricValue}>
                                    {Math.round(nutritionProfile.bmr).toLocaleString()} <Text style={styles.fuelMetricUnit}>kcal</Text>
                                </Text>
                            </View>
                        </View>
                        <View style={styles.fuelMetric}>
                            <View style={styles.fuelMetricIcon}>
                                <MaterialCommunityIcons name="code-tags" size={16} color="#FFFFFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fuelMetricLabel}>TDEE</Text>
                                <Text style={styles.fuelMetricValue}>
                                    {Math.round(nutritionProfile.tdee).toLocaleString()} <Text style={styles.fuelMetricUnit}>kcal</Text>
                                </Text>
                            </View>
                        </View>
                        <View style={styles.fuelMetric}>
                            <View style={styles.fuelMetricIcon}>
                                <MaterialCommunityIcons name="water-outline" size={16} color="#22D3EE" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fuelMetricLabel}>WATER</Text>
                                <Text style={styles.fuelMetricValue}>
                                    {nutritionProfile.waterIntake} <Text style={styles.fuelMetricUnit}>L target</Text>
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Daily Macros */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleH2}>Daily Macros</Text>
                <Text style={styles.sectionMeta}>{consumedMacrosTotal} of {totalMacros}g logged</Text>
            </View>
            <View style={styles.macrosRow}>
                {macroData.map(m => {
                    const pct = m.target > 0 ? Math.min(m.current / m.target, 1) : 0;
                    return (
                        <View key={m.name} style={styles.macroGaugeCard}>
                            <RingProgress
                                size={110}
                                strokeWidth={9}
                                progress={pct}
                                color={m.color}
                            >
                                <View style={{ alignItems: 'center', paddingHorizontal: 4 }}>
                                    <Text style={styles.macroGaugeName}>{m.name}</Text>
                                    <Text style={styles.macroGaugeValue} numberOfLines={1}>
                                        {m.current} / {m.target}g
                                    </Text>
                                    <Text style={[styles.macroGaugePct, { color: m.color }]}>{m.pct}%</Text>
                                </View>
                            </RingProgress>
                        </View>
                    );
                })}
            </View>

            {/* Meal Schedule */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleH2}>Meal Schedule</Text>
                <Text style={styles.sectionMeta}>{nutritionProfile.mealPlan.mealsPerDay} meals today</Text>
            </View>
            {nutritionProfile.mealPlan.mealTimings.map((meal: any) => {
                const isEaten = eatenMealIds.includes(meal.id);
                return (
                    <View key={meal.id} style={styles.mealCard}>
                        <View style={styles.mealTopRow}>
                            <TouchableOpacity
                                style={[styles.mealCheck, isEaten && styles.mealCheckActive]}
                                onPress={() => toggleMeal(meal.id)}
                                activeOpacity={0.7}
                            >
                                {isEaten && <MaterialCommunityIcons name="check" size={16} color="#0A0A0A" />}
                            </TouchableOpacity>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={[styles.mealName, isEaten && styles.mealNameEaten]} numberOfLines={1}>{meal.name}</Text>
                                <View style={styles.mealTimePill}>
                                    <MaterialCommunityIcons name="clock-outline" size={11} color={colors.textSecondary} />
                                    <Text style={styles.mealTimeText}>{meal.time}</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.mealKcal}>{meal.calories}</Text>
                                <Text style={styles.mealKcalLabel}>KCAL</Text>
                            </View>
                        </View>

                        {meal.macros && (
                            <View style={styles.mealMacroRow}>
                                <View style={styles.mealMacroPill}>
                                    <Text style={[styles.mealMacroValue, { color: PROTEIN_COLOR }]}>{meal.macros.protein}g</Text>
                                    <Text style={styles.mealMacroLabel}>PROTEIN</Text>
                                </View>
                                <View style={styles.mealMacroPill}>
                                    <Text style={[styles.mealMacroValue, { color: CARBS_COLOR }]}>{meal.macros.carbs}g</Text>
                                    <Text style={styles.mealMacroLabel}>CARBS</Text>
                                </View>
                                <View style={styles.mealMacroPill}>
                                    <Text style={[styles.mealMacroValue, { color: FATS_COLOR }]}>{meal.macros.fats}g</Text>
                                    <Text style={styles.mealMacroLabel}>FATS</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.mealDivider} />
                        <Text style={styles.suggestedLabel}>SUGGESTED</Text>
                        {getSuggestionItems(meal).map((item, idx) => (
                            <View key={idx} style={styles.suggestionRow}>
                                <MaterialCommunityIcons name={item.icon as any} size={14} color={colors.textSecondary} />
                                <Text style={styles.suggestionText}>{item.text}</Text>
                            </View>
                        ))}
                    </View>
                );
            })}

            {/* Daily Supplements */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleH2}>Daily Supplements</Text>
                <Text style={styles.sectionMeta}>{defaultSupplements.length} items</Text>
            </View>
            <View style={styles.supplementsGrid}>
                {defaultSupplements.map((supp) => {
                    const isTaken = takenSupplementIds.includes(supp.id);
                    return (
                        <TouchableOpacity
                            key={supp.id}
                            activeOpacity={0.85}
                            style={styles.suppCard}
                            onPress={() => toggleSupplement(supp.id)}
                        >
                            <View style={[styles.suppIconWrap, isTaken && { backgroundColor: NEON_GREEN }]}>
                                <MaterialCommunityIcons
                                    name={supp.icon as any}
                                    size={22}
                                    color={isTaken ? '#0A0A0A' : NEON_GREEN}
                                />
                            </View>
                            <Text style={styles.suppName} numberOfLines={2}>{supp.name}</Text>
                            <Text style={styles.suppSchedule}>{supp.schedule}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Smart Food Choices */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleH2}>Smart Food Choices</Text>
            </View>
            <View style={styles.foodTabs}>
                {([
                    { key: 'protein', label: 'Proteins' },
                    { key: 'carbs', label: 'Carbs' },
                    { key: 'fats', label: 'Healthy Fats' },
                ] as const).map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setFoodCategory(tab.key)}
                        style={[styles.foodTab, foodCategory === tab.key && styles.foodTabActive]}
                    >
                        <Text style={[styles.foodTabText, foodCategory === tab.key && styles.foodTabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: Spacing.m }}
                style={{ marginBottom: Spacing.l }}
            >
                {activeFoodList.slice(0, 8).map((food: any, idx: number) => {
                    const macroLabel = foodCategory === 'protein' ? `${food.protein}g protein`
                        : foodCategory === 'carbs' ? `${food.carbs}g carbs`
                            : `${food.fats}g fats`;
                    const macroColor = foodCategory === 'protein' ? PROTEIN_COLOR
                        : foodCategory === 'carbs' ? CARBS_COLOR : FATS_COLOR;
                    const insight = foodCategory === 'protein' ? 'HIGH BIOAVAILABILITY'
                        : foodCategory === 'carbs' ? 'FIBER RICH' : 'HEART HEALTHY';
                    return (
                        <View key={idx} style={styles.foodCard}>
                            <Text style={styles.foodName}>{food.name}</Text>
                            <Text style={styles.foodServing}>{food.servingSize}</Text>
                            <Text style={styles.foodCalories}>{food.calories} kcal</Text>
                            <Text style={[styles.foodMacro, { color: macroColor }]}>{macroLabel}</Text>
                            <View style={styles.foodInsightPill}>
                                <Text style={styles.foodInsightText}>{insight}</Text>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Recipe of the Day */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleH2}>Recipe of the Day</Text>
            </View>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setSelectedRecipe(dailyRecipe)}
                style={styles.recipeCard}
            >
                <Image source={{ uri: dailyRecipe.image }} style={styles.recipeImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.recipeFeaturedPill}>
                    <MaterialCommunityIcons name="star" size={11} color="#0A0A0A" />
                    <Text style={styles.recipeFeaturedText}>FEATURED</Text>
                </View>
                <View style={styles.recipeBody}>
                    <Text style={styles.recipeTitle}>{dailyRecipe.title}</Text>
                    <View style={styles.recipeMeta}>
                        <View style={styles.recipeMetaItem}>
                            <MaterialCommunityIcons name="lightning-bolt" size={14} color={NEON_GREEN} />
                            <Text style={styles.recipeMetaText}>{dailyRecipe.calories} kcal</Text>
                        </View>
                        <View style={styles.recipeMetaItem}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.recipeMetaText}>{dailyRecipe.time}</Text>
                        </View>
                        <View style={styles.recipeMetaItem}>
                            <MaterialCommunityIcons name="rhombus-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.recipeMetaText}>{dailyRecipe.difficulty}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Nutrition Guidelines */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleH2}>Nutrition Guidelines</Text>
            </View>
            <View style={styles.guidelinesCard}>
                {guidelines.map((guideline: string, index: number) => (
                    <View key={index}>
                        <View style={styles.guidelineRow}>
                            <View style={styles.guidelineCheckCircle}>
                                <MaterialCommunityIcons name="check" size={14} color={NEON_GREEN} />
                            </View>
                            <Text style={styles.guidelineText}>{guideline}</Text>
                        </View>
                        {index < guidelines.length - 1 && <View style={styles.guidelineDivider} />}
                    </View>
                ))}
            </View>

            {/* Workout Nutrition */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleH2}>Workout Nutrition</Text>
            </View>
            <View style={styles.workoutNutritionCard}>
                <View style={styles.wnTabs}>
                    <TouchableOpacity
                        style={[styles.wnTab, workoutNutritionTab === 'pre' && styles.wnTabActive]}
                        onPress={() => setWorkoutNutritionTab('pre')}
                    >
                        <MaterialCommunityIcons name="lightning-bolt" size={14} color={workoutNutritionTab === 'pre' ? '#0A0A0A' : '#FFFFFF'} />
                        <Text style={[styles.wnTabText, workoutNutritionTab === 'pre' && styles.wnTabTextActive]}>Pre-Workout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.wnTab, workoutNutritionTab === 'post' && styles.wnTabActive]}
                        onPress={() => setWorkoutNutritionTab('post')}
                    >
                        <MaterialCommunityIcons name="heart-outline" size={14} color={workoutNutritionTab === 'post' ? '#0A0A0A' : '#FFFFFF'} />
                        <Text style={[styles.wnTabText, workoutNutritionTab === 'post' && styles.wnTabTextActive]}>Post-Workout</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ marginTop: 14 }}>
                    {(workoutNutritionTab === 'pre' ? preworkoutTips : postworkoutTips).map((tip: string, idx: number) => (
                        <View key={idx} style={styles.wnTipRow}>
                            <MaterialCommunityIcons name="lightning-bolt" size={14} color={NEON_GREEN} />
                            <Text style={styles.wnTipText}>{tip}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={{ height: 60 }} />

            {/* Recipe Modal (kept) */}
            <Modal
                visible={!!selectedRecipe}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedRecipe(null)}
            >
                <BlurView intensity={100} tint="dark" style={styles.modalContainer}>
                    {selectedRecipe && (
                        <View style={{ flex: 1 }}>
                            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                                <View>
                                    <Image source={{ uri: selectedRecipe.image }} style={styles.modalImage} />
                                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.modalImageGradient} />
                                    <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedRecipe(null)}>
                                        <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <View style={styles.modalTitleContainer}>
                                        <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                                    </View>
                                </View>

                                <View style={styles.modalContent}>
                                    <View style={styles.modalMetaRow}>
                                        <View style={styles.modalMetaBadge}>
                                            <MaterialCommunityIcons name="lightning-bolt" size={14} color={NEON_GREEN} />
                                            <Text style={styles.modalMetaText}>{selectedRecipe.calories} kcal</Text>
                                        </View>
                                        <View style={styles.modalMetaBadge}>
                                            <MaterialCommunityIcons name="clock-outline" size={14} color="#FFFFFF" />
                                            <Text style={styles.modalMetaText}>{selectedRecipe.time}</Text>
                                        </View>
                                        <View style={styles.modalMetaBadge}>
                                            <MaterialCommunityIcons name="rhombus-outline" size={14} color="#FFFFFF" />
                                            <Text style={styles.modalMetaText}>{selectedRecipe.difficulty}</Text>
                                        </View>
                                    </View>

                                    {selectedRecipe.macros && (
                                        <View style={styles.modalMacros}>
                                            <View style={styles.macroBadgeItem}>
                                                <Text style={[styles.macroBadgeLabel, { color: PROTEIN_COLOR }]}>Protein</Text>
                                                <Text style={styles.macroBadgeValue}>{selectedRecipe.macros.protein}g</Text>
                                            </View>
                                            <View style={styles.verticalDivider} />
                                            <View style={styles.macroBadgeItem}>
                                                <Text style={[styles.macroBadgeLabel, { color: CARBS_COLOR }]}>Carbs</Text>
                                                <Text style={styles.macroBadgeValue}>{selectedRecipe.macros.carbs}g</Text>
                                            </View>
                                            <View style={styles.verticalDivider} />
                                            <View style={styles.macroBadgeItem}>
                                                <Text style={[styles.macroBadgeLabel, { color: FATS_COLOR }]}>Fats</Text>
                                                <Text style={styles.macroBadgeValue}>{selectedRecipe.macros.fats}g</Text>
                                            </View>
                                        </View>
                                    )}

                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Ingredients</Text>
                                        {selectedRecipe.ingredients?.map((ing: string, i: number) => (
                                            <View key={i} style={styles.ingredientRow}>
                                                <View style={styles.guidelineCheckCircle}>
                                                    <MaterialCommunityIcons name="check" size={12} color={NEON_GREEN} />
                                                </View>
                                                <Text style={styles.ingredientText}>{ing}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Instructions</Text>
                                        {selectedRecipe.instructions?.map((inst: string, i: number) => (
                                            <View key={i} style={styles.instructionCard}>
                                                <View style={styles.instructionNumberContainer}>
                                                    <Text style={styles.instructionNumber}>{i + 1}</Text>
                                                </View>
                                                <Text style={styles.instructionText}>{inst}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </BlurView>
            </Modal>
        </>
    );
}

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType, isDark: boolean) => StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        color: colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.m,
        paddingHorizontal: 4,
    },
    headerLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.4,
    },
    avatarCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(196,255,26,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(196,255,26,0.4)',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 52,
        height: 52,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: NEON_GREEN,
        letterSpacing: 0.5,
    },

    // Goal card
    goalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 14,
        paddingLeft: 18,
        marginBottom: Spacing.m,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 12,
        overflow: 'hidden',
    },
    goalAccent: {
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 4,
        backgroundColor: NEON_GREEN,
        borderRadius: 4,
    },
    goalIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(196,255,26,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalLabel: {
        color: colors.textTertiary,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    goalValue: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: -0.2,
    },
    prefToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 999,
        padding: 3,
    },
    prefOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    prefOptionActive: {
        backgroundColor: NEON_GREEN,
    },
    prefText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    prefTextActive: {
        color: '#0A0A0A',
        fontWeight: '900',
    },

    // Daily Fuel
    fuelCard: {
        backgroundColor: CARD_BG,
        borderRadius: 22,
        padding: Spacing.m,
        marginBottom: Spacing.l,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    fuelHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.m,
    },
    fuelHeaderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    fuelHeaderPillText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    fuelBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ringInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringValue: {
        fontSize: 30,
        fontWeight: '900',
        color: NEON_GREEN,
        letterSpacing: -0.8,
        lineHeight: 32,
    },
    ringLabel: {
        fontSize: 10,
        color: colors.textTertiary,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    ringFootnote: {
        fontSize: 11,
        color: '#FFFFFF',
        marginTop: 4,
        fontWeight: '500',
    },
    ringFootnoteAccent: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    fuelMetrics: {
        flex: 1,
        gap: 8,
    },
    fuelMetric: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: TILE_BG,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        gap: 10,
    },
    fuelMetricIcon: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fuelMetricLabel: {
        fontSize: 10,
        color: colors.textTertiary,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    fuelMetricValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '900',
    },
    fuelMetricUnit: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '500',
    },

    // Cards / common
    cardTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    cardSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: Spacing.s,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitleH2: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    sectionMeta: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },

    // Macros gauges
    macrosRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: Spacing.l,
    },
    macroGaugeCard: {
        flex: 1,
        backgroundColor: CARD_BG,
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    macroGaugeName: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '700',
        marginBottom: 2,
    },
    macroGaugeValue: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '900',
    },
    macroGaugePct: {
        fontSize: 12,
        fontWeight: '900',
        marginTop: 2,
    },

    // Meals
    mealCard: {
        backgroundColor: CARD_BG,
        borderRadius: 22,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    mealTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealCheck: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mealCheckActive: {
        backgroundColor: NEON_GREEN,
        borderColor: NEON_GREEN,
    },
    mealName: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    mealNameEaten: {
        textDecorationLine: 'line-through',
        color: colors.textTertiary,
    },
    mealTimePill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        marginTop: 4,
        gap: 4,
    },
    mealTimeText: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    mealKcal: {
        fontSize: 24,
        fontWeight: '900',
        color: NEON_GREEN,
        letterSpacing: -0.5,
        lineHeight: 26,
    },
    mealKcalLabel: {
        fontSize: 10,
        color: colors.textTertiary,
        fontWeight: '700',
        letterSpacing: 1,
    },
    mealMacroRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },
    mealMacroPill: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        paddingVertical: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    mealMacroValue: {
        fontSize: 15,
        fontWeight: '900',
    },
    mealMacroLabel: {
        fontSize: 9,
        color: colors.textTertiary,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginTop: 2,
    },
    mealDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginVertical: 12,
    },
    suggestedLabel: {
        fontSize: 11,
        color: NEON_GREEN,
        fontWeight: '900',
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    suggestionText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '500',
    },

    // Supplements
    supplementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: Spacing.l,
    },
    suppCard: {
        width: (Dimensions.get('window').width - Spacing.s * 2 - 10 - 4) / 2,
        backgroundColor: CARD_BG,
        borderRadius: 18,
        paddingVertical: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    suppIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(196,255,26,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    suppName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    suppSchedule: {
        fontSize: 11,
        color: colors.textTertiary,
        fontWeight: '700',
        letterSpacing: 1,
    },

    // Food Choices
    foodTabs: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    foodTab: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    foodTabActive: {
        backgroundColor: NEON_GREEN,
        borderColor: NEON_GREEN,
    },
    foodTabText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    foodTabTextActive: {
        color: '#0A0A0A',
        fontWeight: '900',
    },
    foodCard: {
        width: 170,
        backgroundColor: CARD_BG,
        borderRadius: 18,
        padding: 14,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    foodName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.2,
    },
    foodServing: {
        fontSize: 11,
        color: colors.textTertiary,
        marginTop: 2,
        marginBottom: 10,
    },
    foodCalories: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    foodMacro: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 10,
    },
    foodInsightPill: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    foodInsightText: {
        fontSize: 9,
        color: colors.textSecondary,
        fontWeight: '900',
        letterSpacing: 0.6,
    },

    // Recipe of the day
    recipeCard: {
        height: 200,
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: Spacing.l,
        borderWidth: 1,
        borderColor: 'rgba(196,255,26,0.15)',
    },
    recipeImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    recipeFeaturedPill: {
        position: 'absolute',
        top: 14,
        left: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: NEON_GREEN,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    recipeFeaturedText: {
        color: '#0A0A0A',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    recipeBody: {
        position: 'absolute',
        bottom: 14,
        left: 14,
        right: 14,
    },
    recipeTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    recipeMeta: {
        flexDirection: 'row',
        gap: 14,
    },
    recipeMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    recipeMetaText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },

    // Guidelines
    guidelinesCard: {
        backgroundColor: CARD_BG,
        borderRadius: 22,
        paddingVertical: 6,
        paddingHorizontal: 16,
        marginBottom: Spacing.l,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    guidelineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
    },
    guidelineCheckCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(196,255,26,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(196,255,26,0.3)',
    },
    guidelineDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    guidelineText: {
        flex: 1,
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 20,
        fontWeight: '500',
    },

    // Workout Nutrition
    workoutNutritionCard: {
        backgroundColor: CARD_BG,
        borderRadius: 22,
        padding: 16,
        marginBottom: Spacing.l,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    wnTabs: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 999,
        padding: 4,
    },
    wnTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 9,
        borderRadius: 999,
    },
    wnTabActive: {
        backgroundColor: NEON_GREEN,
    },
    wnTabText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    wnTabTextActive: {
        color: '#0A0A0A',
        fontWeight: '900',
    },
    wnTipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    wnTipText: {
        flex: 1,
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 20,
        fontWeight: '500',
    },

    // Recipe Modal
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    modalImage: {
        width: '100%',
        height: 300,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    modalContent: {
        flex: 1,
        marginTop: -30,
        backgroundColor: '#0A0F1A',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: Spacing.m,
        paddingBottom: 40,
        minHeight: Dimensions.get('window').height - 250,
    },
    modalImageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    modalTitleContainer: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    modalMetaRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: Spacing.s,
        marginBottom: Spacing.m,
        flexWrap: 'wrap',
    },
    modalMetaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    modalMetaText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    modalMacros: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: Spacing.l,
    },
    macroBadgeItem: {
        alignItems: 'center',
        flex: 1,
    },
    macroBadgeLabel: {
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    macroBadgeValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    verticalDivider: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    modalSection: {
        marginBottom: Spacing.l,
    },
    modalSectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 12,
        letterSpacing: -0.2,
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    ingredientText: {
        flex: 1,
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 20,
        fontWeight: '500',
    },
    instructionCard: {
        flexDirection: 'row',
        padding: 14,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    instructionNumberContainer: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: NEON_GREEN,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    instructionNumber: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0A0A0A',
    },
    instructionText: {
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 20,
        flex: 1,
        fontWeight: '500',
    },
});
