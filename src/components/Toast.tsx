import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Spacing, Layout, Shadows } from '../theme/Theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    visible: boolean;
    onHide: () => void;
    duration?: number;
}

const { width } = Dimensions.get('window');

export const Toast: React.FC<ToastProps> = ({
    message,
    type,
    visible,
    onHide,
    duration = 3000
}) => {
    const { colors, isDark } = useTheme();
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Animate In
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 10
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();

            // Auto Hide
            const timer = setTimeout(() => {
                hide();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hide();
        }
    }, [visible]);

    const hide = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 250,
                useNativeDriver: true
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            })
        ]).start(() => onHide());
    };

    const getIconName = (): keyof typeof MaterialCommunityIcons.glyphMap => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'alert-circle';
            case 'warning': return 'alert';
            case 'info': return 'information';
            default: return 'information';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return colors.accentSuccess;
            case 'error': return colors.accentError;
            case 'warning': return colors.accentWarning;
            case 'info': return colors.accentCyan;
            default: return colors.primaryStart;
        }
    };

    if (!visible) return null;

    return (
        <Animated.View style={[
            styles.container,
            {
                transform: [{ translateY }],
                opacity,
                shadowColor: getColor(),
            }
        ]}>
            <BlurView intensity={isDark ? 80 : 90} tint={isDark ? "dark" : "light"} style={styles.blurContainer}>
                <View style={[styles.borderStrip, { backgroundColor: getColor() }]} />
                <View style={styles.contentContainer}>
                    <View style={[styles.iconContainer, { backgroundColor: getColor() + '20' }]}>
                        <MaterialCommunityIcons name={getIconName()} size={24} color={getColor()} />
                    </View>
                    <Text style={[styles.message, { color: colors.textPrimary }]}>
                        {message}
                    </Text>
                    <TouchableOpacity onPress={hide} style={styles.closeButton}>
                        <MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </BlurView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        zIndex: 9999,
        borderRadius: Layout.borderRadius.m,
        overflow: 'hidden',
        ...Shadows.card,
        elevation: 10,
    },
    blurContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: 60,
    },
    borderStrip: {
        width: 4,
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.s,
        paddingRight: Spacing.m,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.s,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    }
});
