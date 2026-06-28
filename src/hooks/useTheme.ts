import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './reduxHooks';
import { saveTheme } from '../store/slices/themeSlice';
import { LightColors, DarkColors, getGradients, getShadows } from '../theme/Theme';

export const useTheme = () => {
    const dispatch = useAppDispatch();
    const { mode } = useAppSelector((state) => state.theme);

    const isDark = mode === 'dark';
    const colors = isDark ? DarkColors : LightColors;
    const gradients = getGradients(colors);
    const shadows = getShadows(colors);

    const toggleTheme = useCallback(() => {
        const newMode = isDark ? 'light' : 'dark';
        dispatch(saveTheme(newMode));
    }, [isDark, dispatch]);

    return {
        mode,
        isDark,
        colors,
        gradients,
        shadows,
        toggleTheme,
    };
};
