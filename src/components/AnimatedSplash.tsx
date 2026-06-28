/**
 * AnimatedSplash
 *
 * Premium branded splash screen shown during app initialisation.
 * Clean vertical layout: logo icon → app name → tagline → loading dots.
 * No overlapping elements.
 */

import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');

interface AnimatedSplashProps {
    onFinish: () => void;
}

/** Three pulsing dots that act as a loading indicator */
function LoadingDots() {
    const dots = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        const animations = dots.map((dot, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 160),
                    Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                    Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                    Animated.delay((2 - i) * 160),
                ])
            )
        );
        Animated.parallel(animations).start();
    }, []);

    return (
        <View style={styles.dotsRow}>
            {dots.map((dot, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                            transform: [{
                                scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] }),
                            }],
                        },
                    ]}
                />
            ))}
        </View>
    );
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
    // Master animation values
    const logoAnim = useRef(new Animated.Value(0)).current;  // 0→1 scale + opacity
    const nameAnim = useRef(new Animated.Value(0)).current;  // opacity
    const tagAnim = useRef(new Animated.Value(0)).current;  // opacity
    const dotsAnim = useRef(new Animated.Value(0)).current;  // opacity
    const exitAnim = useRef(new Animated.Value(1)).current;  // 1→0 whole screen

    useEffect(() => {
        Animated.sequence([
            // 1. Logo pops in
            Animated.spring(logoAnim, {
                toValue: 1,
                tension: 65,
                friction: 7,
                useNativeDriver: true,
            }),
            // 2. App name
            Animated.timing(nameAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }),
            // 3. Tagline
            Animated.timing(tagAnim, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }),
            // 4. Dots appear
            Animated.timing(dotsAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            // 5. Hold for a moment so the user actually sees it
            Animated.delay(900),
            // 6. Fade the whole screen out
            Animated.timing(exitAnim, {
                toValue: 0,
                duration: 450,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
            }),
        ]).start(() => onFinish());
    }, []);

    return (
        <Animated.View style={[styles.root, { opacity: exitAnim }]}>
            <LinearGradient
                colors={['#0D0D1E', '#130C2F', '#0A1535']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
            />

            {/* Subtle top glow blob */}
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            {/* ── Logo icon ──────────────────────────────── */}
            <Animated.View
                style={[
                    styles.logoWrap,
                    {
                        opacity: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                        transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
                    },
                ]}
            >
                <Image
                    source={require('../../assets/app-icon.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                {/* subtle glow shadow ring around icon */}
                <View style={styles.iconGlow} />
            </Animated.View>

            {/* ── App name ───────────────────────────────── */}
            <Animated.Text
                style={[styles.appName, { opacity: nameAnim }]}
            >
                FIZI
            </Animated.Text>

            {/* ── Tagline ────────────────────────────────── */}
            <Animated.Text style={[styles.tagline, { opacity: tagAnim }]}>
                Your AI Fitness Trainer
            </Animated.Text>

            {/* ── Thin divider ───────────────────────────── */}
            <Animated.View style={[styles.divider, { opacity: tagAnim }]}>
                <LinearGradient
                    colors={['transparent', '#5B6BF8', '#38B2F4', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, height: '100%', borderRadius: 1 }}
                />
            </Animated.View>

            {/* ── Loading dots ───────────────────────────── */}
            <Animated.View style={{ opacity: dotsAnim }}>
                <LoadingDots />
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    glowTop: {
        position: 'absolute',
        top: -80,
        left: W * 0.1,
        width: W * 0.8,
        height: 350,
        borderRadius: 200,
        backgroundColor: 'rgba(91, 107, 248, 0.18)',
        transform: [{ scaleX: 1.4 }],
    },
    glowBottom: {
        position: 'absolute',
        bottom: -120,
        right: W * 0.05,
        width: W * 0.7,
        height: 300,
        borderRadius: 200,
        backgroundColor: 'rgba(56, 178, 244, 0.10)',
        transform: [{ scaleX: 1.2 }],
    },

    /* logo */
    logoWrap: {
        marginBottom: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: 110,
        height: 110,
        borderRadius: 26,
        shadowColor: '#5B6BF8',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.55,
        shadowRadius: 24,
        elevation: 20,
    },
    iconGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(91, 107, 248, 0.15)',
        zIndex: -1,
    },

    /* text */
    appName: {
        fontSize: 62,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 12,
        marginBottom: 8,
        textShadowColor: 'rgba(91, 107, 248, 0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 16,
    },
    tagline: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.45)',
        fontWeight: '500',
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        marginBottom: 32,
    },

    /* divider */
    divider: {
        width: W * 0.35,
        height: 2,
        marginBottom: 36,
        borderRadius: 1,
        overflow: 'hidden',
    },

    /* dots */
    dotsRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#5B6BF8',
    },
});
