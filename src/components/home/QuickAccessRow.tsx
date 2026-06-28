import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, ThemeColorsType, ThemeShadowsType } from '../../theme/Theme';
import { useTheme } from '../../hooks/useTheme';

const NEON_GREEN = '#C4FF1A';

interface QuickAccessRowProps {
    onLibrary: () => void;
    onHistory: () => void;
}

export const QuickAccessRow: React.FC<QuickAccessRowProps> = ({ onLibrary, onHistory }) => {
    const { colors, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);

    return (
        <View style={styles.section}>
            <Text style={styles.title}>Quick Access</Text>
            <View style={styles.row}>
                <TouchableOpacity activeOpacity={0.85} onPress={onLibrary} style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={[styles.iconWrap, { backgroundColor: 'rgba(196,255,26,0.15)' }]}>
                            <MaterialCommunityIcons name="dumbbell" size={22} color={NEON_GREEN} />
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                    </View>
                    <Text style={styles.cardTitle}>Exercise Library</Text>
                    <Text style={styles.cardSubtitle}>Browse all exercises & instructions</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.85} onPress={onHistory} style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={[styles.iconWrap, { backgroundColor: 'rgba(192, 132, 252, 0.18)' }]}>
                            <MaterialCommunityIcons name="history" size={22} color="#C084FC" />
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                    </View>
                    <Text style={styles.cardTitle}>Workout History</Text>
                    <Text style={styles.cardSubtitle}>View past sessions & detailed stats</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType, isDark: boolean) => StyleSheet.create({
    section: {
        marginBottom: Spacing.l,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.3,
        marginBottom: Spacing.m,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    card: {
        flex: 1,
        backgroundColor: isDark ? '#13182A' : '#1A1F2E',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        minHeight: 130,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    cardSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 17,
    },
});
