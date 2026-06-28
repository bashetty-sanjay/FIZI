/**
 * OfflineBanner
 *
 * A slim animated banner that slides down when the device loses internet
 * connectivity. Uses a periodic fetch-ping approach — no extra dependencies.
 *
 * Drop it inside your root component (e.g., in App.tsx return JSX).
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    View,
    AppState,
    AppStateStatus,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CHECK_URL = 'https://www.google.com';
const CHECK_INTERVAL = 5000; // ms between checks when potentially offline

async function isOnline(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(CHECK_URL, {
            method: 'HEAD',
            cache: 'no-cache',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok;
    } catch {
        return false;
    }
}

export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const slideAnim = useRef(new Animated.Value(-60)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isOfflineRef = useRef(false);

    const showBanner = () => {
        if (isOfflineRef.current) return;
        isOfflineRef.current = true;
        setIsOffline(true);
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const hideBanner = () => {
        if (!isOfflineRef.current) return;
        isOfflineRef.current = false;
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: -60,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => setIsOffline(false));
    };

    const checkConnectivity = async () => {
        const online = await isOnline();
        if (!online) {
            showBanner();
        } else {
            hideBanner();
        }
    };

    const startChecking = () => {
        checkConnectivity();
        intervalRef.current = setInterval(checkConnectivity, CHECK_INTERVAL);
    };

    const stopChecking = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        startChecking();

        // Pause checks when app goes to background, resume on foreground
        const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                startChecking();
            } else {
                stopChecking();
            }
        });

        return () => {
            stopChecking();
            subscription.remove();
        };
    }, []);

    if (!isOffline) return null;

    return (
        <Animated.View
            style={[
                styles.bannerContainer,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                },
            ]}
            pointerEvents="none"
        >
            <View style={styles.banner}>
                <MaterialCommunityIcons
                    name="wifi-off"
                    size={16}
                    color="#FFFFFF"
                />
                <Text style={styles.text}>No internet connection</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    bannerContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 44 : 24,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        gap: 8,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
