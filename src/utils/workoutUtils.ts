/**
 * Normalizes workout focus/title strings for the UI
 */
export const getSimplifiedFocus = (focus: string | undefined): string => {
    if (!focus) return 'Workout';


    const f = focus.toLowerCase();

    // Map old/detailed strings to new categories
    if (f.includes('chest') || f.includes('upper')) {
        return 'Upper Body';
    }
    if (f.includes('legs') || f.includes('lower')) {
        return 'Lower Body';
    }
    if (f.includes('total body') || f.includes('fullbody') || f.includes('full body')) {
        // Check if it's a hybrid/mix
        if (f.includes('cardio') || f.includes('mix') || f.includes('50%')) {
            return 'Full Body';
        }

        return 'Full Body';
    }
    if (f.includes('cardio')) {
        return 'Cardio';
    }
    if (f.includes('flexibility') || f.includes('recovery') || f.includes('mobility')) {
        return 'Recovery';
    }

    if (f.includes('custom')) {
        return 'Custom';
    }

    return focus; // Fallback to original if no match
};
