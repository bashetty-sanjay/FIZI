import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, ThemeColorsType, ThemeShadowsType } from '../../theme/Theme';
import { useTheme } from '../../hooks/useTheme';

const NEON_GREEN = '#C4FF1A';

interface RecoveryStatusCardProps {
    status: 'good' | 'moderate' | 'poor';
    onChange: (status: 'good' | 'moderate' | 'poor') => void;
}

const META: Record<'good' | 'moderate' | 'poor', { title: string; subtitle: string; color: string }> = {
    good: { title: 'Good', subtitle: 'Ready to train', color: NEON_GREEN },
    moderate: { title: 'Moderate', subtitle: 'Take it easy today', color: '#FACC15' },
    poor: { title: 'Poor', subtitle: 'Rest is recommended', color: '#F87171' },
};

export const RecoveryStatusCard: React.FC<RecoveryStatusCardProps> = ({ status, onChange }) => {
    const { colors, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
    const [editing, setEditing] = useState(false);
    const meta = META[status];

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name="heart-outline" size={22} color={meta.color} />
                </View>
                <View style={styles.textBlock}>
                    <Text style={styles.label}>RECOVERY STATUS</Text>
                    <Text style={[styles.statusText, { color: meta.color }]}>
                        {meta.title} <Text style={styles.dot}>·</Text> <Text style={styles.subtitle}>{meta.subtitle}</Text>
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditing(v => !v)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.editText}>{editing ? 'Done' : 'Edit'}</Text>
                </TouchableOpacity>
            </View>

            {editing && (
                <View style={styles.editRow}>
                    {(['good', 'moderate', 'poor'] as const).map(s => {
                        const isActive = status === s;
                        const m = META[s];
                        return (
                            <TouchableOpacity
                                key={s}
                                style={[
                                    styles.option,
                                    isActive && { borderColor: m.color, backgroundColor: m.color + '1A' },
                                ]}
                                onPress={() => onChange(s)}
                            >
                                <Text style={[styles.optionText, isActive && { color: m.color, fontWeight: '800' }]}>
                                    {m.title}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType, isDark: boolean) => StyleSheet.create({
    card: {
        backgroundColor: isDark ? '#13182A' : '#1A1F2E',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: Spacing.l,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(196,255,26,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textBlock: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        color: colors.textTertiary,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '800',
    },
    dot: {
        color: colors.textTertiary,
        fontWeight: '400',
    },
    subtitle: {
        color: colors.textSecondary,
        fontWeight: '500',
        fontSize: 14,
    },
    editButton: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    editText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    editRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },
    option: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    optionText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
});
