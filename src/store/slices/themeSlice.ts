import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
    mode: ThemeMode;
    loading: boolean;
}

const initialState: ThemeState = {
    mode: 'dark', // Default to dark mode
    loading: true,
};

export const loadTheme = createAsyncThunk(
    'theme/loadTheme',
    async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme_mode');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                return savedTheme;
            }
            return 'dark'; // Default fallback
        } catch (error) {
            console.error('Failed to load theme:', error);
            return 'dark';
        }
    }
);

export const saveTheme = createAsyncThunk(
    'theme/saveTheme',
    async (mode: ThemeMode) => {
        try {
            await AsyncStorage.setItem('theme_mode', mode);
            return mode;
        } catch (error) {
            console.error('Failed to save theme:', error);
            throw error;
        }
    }
);

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<ThemeMode>) => {
            state.mode = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadTheme.fulfilled, (state, action) => {
            state.mode = action.payload;
            state.loading = false;
        });
        builder.addCase(saveTheme.fulfilled, (state, action) => {
            state.mode = action.payload;
        });
    },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
