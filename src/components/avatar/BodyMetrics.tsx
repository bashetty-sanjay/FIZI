/**
 * BodyMetrics
 *
 * Displays calculated health metrics: BMI, BMR, body fat estimate, TDEE,
 * and recommended daily intake. Extracted from AvatarScreen.tsx.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Layout, Typography } from '../../theme/Theme';

interface BodyMetricsProps {
    user: any;
}

/** Mifflin-St Jeor BMR (kcal/day) */
function calcBMR(weight: number, height: number, age: number, sex: string): number {
    if (!weight || !height || !age) return 0;
    // weight=kg, height=cm
    return sex === 'female'
        ? 10 * weight + 6.25 * height - 5 * age - 161
        : 10 * weight + 6.25 * height - 5 * age + 5;
}

/** BMI from weight (kg) and height (cm) */
function calcBMI(weight: number, height: number): number {
    if (!weight || !height) return 0;
    const m = height / 100;
    return weight / (m * m);
}

/** US Navy body fat estimate */
function calcBodyFat(weight: number, height: number, age: number, sex: string): number | null {
    if (!weight || !height || !age) return null;
    const bmi = calcBMI(weight, height);
    if (!bmi) return null;
    return sex === 'female'
        ? 1.20 * bmi + 0.23 * age - 5.4
        : 1.20 * bmi + 0.23 * age - 16.2;
}

function getBMICategory(bmi: number): { label: string; color: string } {
    if (bmi < 18.5) return { label: 'Underweight', color: '#60A5FA' };
    if (bmi < 25) return { label: 'Normal', color: '#34D399' };
    if (bmi < 30) return { label: 'Overweight', color: '#FBBF24' };
    return { label: 'Obese', color: '#F87171' };
}

interface MetricTileProps {
    icon: string;
    label: string;
    value: string;
    sub?: string;
    iconColor: string;
    accentColor: string;
}

function MetricTile({ icon, label, value, sub, iconColor, accentColor }: MetricTileProps) {
    const { colors, isDark } = useTheme();
    return (
        <LinearGradient
            colors={isDark
                ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']
                : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.4)']}
            style={[styles.tile, { borderColor: accentColor + '30' }]}
        >
            <View style={[styles.tileIconWrap, { backgroundColor: accentColor + '20' }]}>
                <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
            </View>
            <Text style={[styles.tileValue, { color: colors.textPrimary }]}>{value}</Text>
            {sub && <Text style={[styles.tileSub, { color: accentColor }]}>{sub}</Text>}
            <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>{label}</Text>
        </LinearGradient>
    );
}

export default function BodyMetrics({ user }: BodyMetricsProps) {
    const { colors } = useTheme();

    const weight = user?.weight || 0;             // kg
    const height = user?.height || 0;             // cm
    const age = user?.age || 0;
    const sex = user?.sex || user?.gender || 'male';

    const bmi = calcBMI(weight, height);
    const bmr = calcBMR(weight, height, age, sex);
    const bodyFat = calcBodyFat(weight, height, age, sex);
    // TDEE moderate activity (1.55 multiplier)
    const tdee = bmr ? Math.round(bmr * 1.55) : 0;
    const bmiInfo = bmi ? getBMICategory(bmi) : null;

    if (!weight || !height) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Complete your profile (weight & height) to see body metrics.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.heading, { color: colors.textSecondary }]}>BODY METRICS</Text>
            <View style={styles.grid}>
                <MetricTile
                    icon="scale"
                    label="BMI"
                    value={bmi.toFixed(1)}
                    sub={bmiInfo?.label}
                    iconColor={bmiInfo?.color || colors.accentCyan}
                    accentColor={bmiInfo?.color || colors.accentCyan}
                />
                <MetricTile
                    icon="fire"
                    label="BMR"
                    value={`${Math.round(bmr)}`}
                    sub="kcal/day base"
                    iconColor={colors.accentPink}
                    accentColor={colors.accentPink}
                />
                {bodyFat !== null && (
                    <MetricTile
                        icon="human"
                        label="Body Fat"
                        value={`${bodyFat.toFixed(1)}%`}
                        sub="estimated"
                        iconColor="#A78BFA"
                        accentColor="#A78BFA"
                    />
                )}
                <MetricTile
                    icon="lightning-bolt"
                    label="TDEE"
                    value={`${tdee}`}
                    sub="kcal/day active"
                    iconColor={colors.accentYellow}
                    accentColor={colors.accentYellow}
                />
            </View>
            <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
                * Estimates based on standard formula (Mifflin-St Jeor). Consult a professional for accuracy.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.m,
    },
    heading: {
        ...Typography.overline,
        fontSize: 11,
        letterSpacing: 1.5,
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    tile: {
        borderRadius: Layout.borderRadius.l,
        borderWidth: 1,
        padding: 14,
        width: '47%',
        alignItems: 'center',
        gap: 4,
    },
    tileIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    tileValue: {
        fontSize: 22,
        fontWeight: '800',
    },
    tileSub: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    tileLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    disclaimer: {
        fontSize: 10,
        marginTop: 10,
        lineHeight: 14,
        paddingHorizontal: 4,
    },
});
