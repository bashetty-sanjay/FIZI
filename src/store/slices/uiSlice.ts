import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    activeHomeTab: 'profile' | 'work' | 'diet' | 'social';
    avatarScrollOffset: number;
    workScrollOffset: number;
    dietScrollOffset: number;
    exerciseLibraryScrollOffset: number;
    historyScrollOffset: number;
}

const initialState: UIState = {
    activeHomeTab: 'work',
    avatarScrollOffset: 0,
    workScrollOffset: 0,
    dietScrollOffset: 0,
    exerciseLibraryScrollOffset: 0,
    historyScrollOffset: 0,
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setActiveHomeTab: (state, action: PayloadAction<'profile' | 'work' | 'diet' | 'social'>) => {
            state.activeHomeTab = action.payload;
        },
        setAvatarScrollOffset: (state, action: PayloadAction<number>) => {
            state.avatarScrollOffset = action.payload;
        },
        setWorkScrollOffset: (state, action: PayloadAction<number>) => {
            state.workScrollOffset = action.payload;
        },
        setDietScrollOffset: (state, action: PayloadAction<number>) => {
            state.dietScrollOffset = action.payload;
        },
        setExerciseLibraryScrollOffset: (state, action: PayloadAction<number>) => {
            state.exerciseLibraryScrollOffset = action.payload;
        },
        setHistoryScrollOffset: (state, action: PayloadAction<number>) => {
            state.historyScrollOffset = action.payload;
        },
        resetUIState: (state) => {
            // Optional: reset all when user logs out or major nav change
            return initialState;
        }
    },
});

export const {
    setActiveHomeTab,
    setAvatarScrollOffset,
    setWorkScrollOffset,
    setDietScrollOffset,
    setExerciseLibraryScrollOffset,
    setHistoryScrollOffset,
    resetUIState
} = uiSlice.actions;

export default uiSlice.reducer;
