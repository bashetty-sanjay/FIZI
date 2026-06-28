import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Spacing, Layout, Shadows, ThemeColorsType, ThemeShadowsType } from '../../theme/Theme';
import { useTheme } from '../../hooks/useTheme';

interface DailyStatusCardProps {
    isRestDay: boolean;
}

export const DailyStatusCard: React.FC<DailyStatusCardProps> = ({ isRestDay }) => {
    const { colors, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

    return (
        <BlurView intensity={30} tint="dark" style={styles.todayStatusCard}>
            <View style={styles.statusRow}>
                <View>
                    <Text style={styles.statusLabel}>Today's Status</Text>
                    <Text style={styles.statusDate}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </Text>
                </View>
                <View style={styles.statusBadgeContainer}>
                    {isRestDay ? (
                        <View style={styles.statusBadgeRest}>
                            <Text style={styles.statusEmoji}>😌</Text>
                            <Text style={styles.statusBadgeText}>REST DAY</Text>
                        </View>
                    ) : (
                        <View style={styles.statusBadgeWorkout}>
                            <Text style={styles.statusEmoji}>💪</Text>
                            <Text style={styles.statusBadgeText}>WORKOUT</Text>
                        </View>
                    )}
                </View>
            </View>
        </BlurView>
    );
};

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType) => StyleSheet.create({
    todayStatusCard: {
        marginBottom: Spacing.l,
        borderRadius: Layout.borderRadius.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...shadows.card,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.m,
    },
    statusLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    statusDate: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    statusBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadgeWorkout: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accentSuccess + '1A',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: Layout.borderRadius.round,
        borderWidth: 1,
        borderColor: colors.accentSuccess,
    },
    statusBadgeRest: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.textSecondary + '1A',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: Layout.borderRadius.round,
        borderWidth: 1,
        borderColor: colors.textSecondary,
    },
    statusBadgeText: {
        color: colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 6,
        letterSpacing: 0.5,
    },
    statusEmoji: {
        fontSize: 16,
    },
});
