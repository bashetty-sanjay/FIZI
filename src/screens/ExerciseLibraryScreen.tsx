import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getExerciseImage } from '../config/imageMap';
import { RootState } from '../store';
import { setExerciseLibraryScrollOffset } from '../store/slices/uiSlice';
import { exercises } from '../models/exercises';
import { Spacing, ThemeColorsType } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';
import { avatarService } from '../services/AvatarService';

const NEON_GREEN = '#C4FF1A';
const CARD_BG = '#13182A';

interface ExerciseLibraryScreenProps {
    navigation: any;
}

type CategoryId = 'all' | 'chest' | 'legs' | 'back' | 'abs' | 'arms';

const CATEGORIES: { id: CategoryId; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { id: 'all', label: 'All', icon: 'view-grid-outline' },
    { id: 'chest', label: 'Chest', icon: 'arm-flex' },
    { id: 'arms', label: 'Arms', icon: 'dumbbell' },
    { id: 'back', label: 'Back', icon: 'human-handsup' },
    { id: 'legs', label: 'Legs', icon: 'run-fast' },
    { id: 'abs', label: 'Core', icon: 'fire' },
];

const DIFFICULTY_COLOR: Record<string, string> = {
    beginner: '#4ADE80',
    intermediate: '#FACC15',
    advanced: '#F87171',
};

export default function ExerciseLibraryScreen({ navigation }: ExerciseLibraryScreenProps) {
    const { colors, gradients, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
    const { exerciseLibraryScrollOffset } = useSelector((state: RootState) => state.ui);
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');
    const scrollViewRef = React.useRef<ScrollView>(null);
    const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
    const [userLevel, setUserLevel] = useState(1);

    React.useEffect(() => {
        let isMounted = true;
        const loadLevel = async () => {
            const state = await avatarService.getAvatarState();
            if (state && isMounted) {
                setUserLevel(state.level);
            }
        };
        loadLevel();
        return () => { isMounted = false; };
    }, []);

    const filteredExercises = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return exercises
            .filter(ex => {
                const primaryMuscle = ex.muscleGroups[0]?.toLowerCase() ?? '';
                const matchesSearch = !query
                    || ex.name.toLowerCase().includes(query)
                    || (ex.displayName?.toLowerCase().includes(query) ?? false)
                    || primaryMuscle.includes(query);
                const matchesCategory = selectedCategory === 'all'
                    || primaryMuscle.includes(selectedCategory);
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => a.unlockLevel - b.unlockLevel);
    }, [searchQuery, selectedCategory]);

    const unlockedCount = useMemo(
        () => filteredExercises.filter(ex => ex.unlockLevel <= userLevel).length,
        [filteredExercises, userLevel]
    );

    React.useEffect(() => {
        if (exerciseLibraryScrollOffset > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: exerciseLibraryScrollOffset, animated: false });
            }, 100);
        }
    }, []);

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerLabel}>TRAIN SMARTER</Text>
                    <Text style={styles.title}>Exercise Library</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search exercises or muscle..."
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Category Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryScrollContent}
            >
                {CATEGORIES.map(cat => {
                    const active = selectedCategory === cat.id;
                    return (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            style={[styles.categoryItem, active && styles.categoryItemActive]}
                            activeOpacity={0.85}
                        >
                            <MaterialCommunityIcons
                                name={cat.icon}
                                size={15}
                                color={active ? '#0A0A0A' : '#FFFFFF'}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Result count */}
            <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                    <Text style={styles.metaCount}>{filteredExercises.length}</Text> exercises
                </Text>
                <View style={styles.metaDivider} />
                <Text style={styles.metaText}>
                    <Text style={[styles.metaCount, { color: NEON_GREEN }]}>{unlockedCount}</Text> unlocked
                </Text>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    dispatch(setExerciseLibraryScrollOffset(e.nativeEvent.contentOffset.y));
                }}
                onScrollEndDrag={(e) => {
                    dispatch(setExerciseLibraryScrollOffset(e.nativeEvent.contentOffset.y));
                }}
                scrollEventThrottle={16}
            >
                {filteredExercises.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrap}>
                            <MaterialCommunityIcons name="magnify-close" size={36} color={NEON_GREEN} />
                        </View>
                        <Text style={styles.emptyText}>No exercises found</Text>
                        <Text style={styles.emptySubtext}>Try a different category or search term</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {filteredExercises.map(ex => {
                            const isUnlocked = ex.unlockLevel <= userLevel;
                            const difficultyColor = DIFFICULTY_COLOR[ex.difficulty] || colors.textSecondary;
                            const displayName = ex.displayName || ex.name;
                            const image = getExerciseImage(ex.id);

                            return (
                                <TouchableOpacity
                                    key={ex.id}
                                    style={[styles.exerciseCard, !isUnlocked && styles.exerciseCardLocked]}
                                    onPress={() => navigation.navigate('ExerciseInstructions', { exerciseId: ex.id, fromLibrary: true })}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.imageWrap}>
                                        {image ? (
                                            <Image source={image} style={styles.exerciseImage} resizeMode="cover" />
                                        ) : (
                                            <View style={styles.imageFallback}>
                                                <MaterialCommunityIcons name="dumbbell" size={32} color={NEON_GREEN} />
                                            </View>
                                        )}
                                        <LinearGradient
                                            colors={['transparent', 'rgba(10,12,20,0.85)']}
                                            style={styles.imageGradient}
                                        />

                                        {/* Difficulty badge top-left */}
                                        <View style={[styles.diffBadge, { backgroundColor: difficultyColor + '22', borderColor: difficultyColor + '55' }]}>
                                            <View style={[styles.diffDot, { backgroundColor: difficultyColor }]} />
                                            <Text style={[styles.diffText, { color: difficultyColor }]}>
                                                {ex.difficulty}
                                            </Text>
                                        </View>

                                        {!isUnlocked && (
                                            <View style={styles.lockOverlay}>
                                                <View style={styles.lockBadge}>
                                                    <MaterialCommunityIcons name="lock" size={18} color="#FFFFFF" />
                                                </View>
                                                <View style={styles.unlockPill}>
                                                    <MaterialCommunityIcons name="star-four-points" size={11} color="#0A0A0A" />
                                                    <Text style={styles.unlockLevelText}>LVL {ex.unlockLevel}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.cardInfo}>
                                        <Text style={styles.exerciseName} numberOfLines={1}>{displayName}</Text>
                                        <View style={styles.muscleRow}>
                                            <MaterialCommunityIcons name="target" size={11} color={colors.textTertiary} />
                                            <Text style={styles.exerciseMuscle} numberOfLines={1}>
                                                {ex.muscleGroups.slice(0, 2).join(' • ')}
                                            </Text>
                                        </View>

                                        <View style={styles.tagRow}>
                                            <View style={styles.tag}>
                                                <MaterialCommunityIcons
                                                    name={ex.equipmentRequired === 'bodyweight' ? 'human' : 'weight-lifter'}
                                                    size={10}
                                                    color={colors.textSecondary}
                                                />
                                                <Text style={styles.tagText} numberOfLines={1}>
                                                    {ex.equipmentRequired === 'bodyweight' ? 'No gear' : ex.equipmentRequired}
                                                </Text>
                                            </View>
                                            {isUnlocked && (
                                                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textTertiary} />
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const createStyles = (colors: ThemeColorsType, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: Spacing.m,
        paddingBottom: 14,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    headerLabel: {
        fontSize: 11,
        color: NEON_GREEN,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.4,
    },

    // Search
    searchContainer: {
        paddingHorizontal: Spacing.m,
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 46,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        paddingVertical: 0,
    },

    // Categories
    categoryScroll: {
        flexGrow: 0,
        marginBottom: 10,
    },
    categoryScrollContent: {
        paddingHorizontal: Spacing.m,
        gap: 8,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    categoryItemActive: {
        backgroundColor: NEON_GREEN,
        borderColor: NEON_GREEN,
    },
    categoryLabel: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    categoryLabelActive: {
        color: '#0A0A0A',
        fontWeight: '900',
    },

    // Meta row
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        marginBottom: 10,
    },
    metaText: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    metaCount: {
        color: '#FFFFFF',
        fontWeight: '900',
    },
    metaDivider: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: colors.textTertiary,
        marginHorizontal: 8,
    },

    content: {
        flex: 1,
        paddingHorizontal: Spacing.m,
    },

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    exerciseCard: {
        width: '48.5%',
        backgroundColor: isDark ? CARD_BG : '#1A1F2E',
        borderRadius: 18,
        marginBottom: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    exerciseCardLocked: {
        opacity: 0.85,
    },

    // Image
    imageWrap: {
        height: 130,
        backgroundColor: '#0A0F1C',
        position: 'relative',
        overflow: 'hidden',
    },
    exerciseImage: {
        width: '100%',
        height: '100%',
    },
    imageFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(196,255,26,0.06)',
    },
    imageGradient: {
        ...StyleSheet.absoluteFillObject,
    },

    // Difficulty badge
    diffBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
    },
    diffDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        marginRight: 5,
    },
    diffText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },

    // Lock
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10,15,28,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockBadge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    unlockPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: NEON_GREEN,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 3,
    },
    unlockLevelText: {
        color: '#0A0A0A',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },

    // Card info
    cardInfo: {
        padding: 12,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: -0.2,
        marginBottom: 4,
    },
    muscleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    exerciseMuscle: {
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
        flex: 1,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 7,
        gap: 4,
        flexShrink: 1,
    },
    tagText: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '600',
        textTransform: 'capitalize',
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        marginTop: 20,
        borderRadius: 22,
        backgroundColor: isDark ? CARD_BG : '#1A1F2E',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(196,255,26,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(196,255,26,0.2)',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    emptySubtext: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 6,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
