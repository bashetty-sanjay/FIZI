import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Gradients, Spacing, Layout, Shadows } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';

interface CustomAlertButton {
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel';
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'error' | 'success' | 'warning' | 'info';
    buttons: CustomAlertButton[];
    onDismiss?: () => void;
}

export default function CustomAlert({
    visible,
    title,
    message,
    type = 'info',
    buttons,
    onDismiss,
}: CustomAlertProps) {
    const { colors, gradients, shadows, isDark } = useTheme();
    const styles = React.useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const getIconConfig = () => {
        switch (type) {
            case 'error':
                return { name: 'alert-circle', color: colors.accentError };
            case 'success':
                return { name: 'check-circle', color: colors.accentSuccess };
            case 'warning':
                return { name: 'alert', color: '#FFB800' };
            case 'info':
            default:
                return { name: 'information', color: colors.accentCyan };
        }
    };

    const iconConfig = getIconConfig();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onDismiss}
        >
            <TouchableWithoutFeedback onPress={onDismiss}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.container,
                                {
                                    opacity: opacityAnim,
                                    transform: [{ scale: scaleAnim }],
                                },
                            ]}
                        >
                            <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.alertCard}>
                                {/* Icon */}
                                <View style={styles.iconContainer}>
                                    <MaterialCommunityIcons
                                        name={iconConfig.name as any}
                                        size={56}
                                        color={iconConfig.color}
                                    />
                                </View>

                                {/* Title */}
                                <Text style={styles.title}>{title}</Text>

                                {/* Message */}
                                <Text style={styles.message}>{message}</Text>

                                {/* Buttons */}
                                <View style={styles.buttonContainer}>
                                    {buttons.map((button, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                button.onPress();
                                                onDismiss?.();
                                            }}
                                            activeOpacity={0.8}
                                            style={styles.buttonWrapper}
                                        >
                                            {button.style === 'cancel' ? (
                                                <View style={styles.cancelButton}>
                                                    <Text style={styles.cancelButtonText}>
                                                        {button.text}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <LinearGradient
                                                    colors={gradients.primary}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={styles.primaryButton}
                                                >
                                                    <Text style={styles.primaryButtonText}>
                                                        {button.text}
                                                    </Text>
                                                </LinearGradient>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </BlurView>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const createStyles = (colors: any, shadows: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.l,
    },
    container: {
        width: '100%',
        maxWidth: 400,
    },
    alertCard: {
        borderRadius: Layout.borderRadius.l,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.cardSurface, // Use cardSurface for better contrast
        overflow: 'hidden',
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: Spacing.l,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.s,
    },
    message: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 24,
    },
    buttonContainer: {
        gap: Spacing.m,
    },
    buttonWrapper: {
        width: '100%',
    },
    primaryButton: {
        paddingVertical: 16,
        borderRadius: Layout.borderRadius.m,
        alignItems: 'center',
        ...shadows.glow,
    },
    primaryButtonText: {
        color: '#FFFFFF', // Keep white for primary button usually
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 16,
        borderRadius: Layout.borderRadius.m,
        alignItems: 'center',
        backgroundColor: colors.glassSurface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
});
