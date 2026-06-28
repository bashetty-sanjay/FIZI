/**
 * MotivationalTip
 *
 * Rotating motivational quotes and fitness tips.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ThemeColorsType } from '../theme/Theme';

const NEON_GREEN = '#C4FF1A';

const TIPS = [
    'Consistency beats intensity. Show up every day!',
    'Focus on form, not speed. Quality over quantity.',
    'Push yourself. No one else will do it for you.',
    'Rest when you need to, but never quit.',
    'Every rep brings you closer to your goals.',
    'Progress, not perfection. Keep moving forward.',
    'Your only limit is your mind. Break through!',
    'Start strong, finish stronger.',
    'Sweat today, shine tomorrow.',
    'Champions train when others rest.',
];

interface MotivationalTipProps {
    autoRotate?: boolean;
    rotateInterval?: number;
}

export default function MotivationalTip({
    autoRotate = true,
    rotateInterval = 8000,
}: MotivationalTipProps) {
    const { colors, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
    const [currentIndex, setCurrentIndex] = useState(
        Math.floor(Math.random() * TIPS.length)
    );
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!autoRotate) return;
        const interval = setInterval(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setCurrentIndex((prev) => (prev + 1) % TIPS.length);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }, rotateInterval);
        return () => clearInterval(interval);
    }, [autoRotate, rotateInterval, fadeAnim]);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.leftAccent} />
            <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color={NEON_GREEN} />
            </View>
            <Text style={styles.text}>{TIPS[currentIndex]}</Text>
        </Animated.View>
    );
}

const createStyles = (colors: ThemeColorsType, isDark: boolean) => StyleSheet.create({
    container: {
        backgroundColor: isDark ? '#13182A' : '#1A1F2E',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    leftAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: NEON_GREEN,
    },
    iconWrap: {
        marginRight: 12,
    },
    text: {
        flex: 1,
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
    },
});
