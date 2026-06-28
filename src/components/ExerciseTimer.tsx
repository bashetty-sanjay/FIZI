import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface ExerciseTimerProps {
    duration: number; // in seconds
    onComplete?: () => void;
    showControls?: boolean;
    style?: any;
}

export const ExerciseTimer: React.FC<ExerciseTimerProps> = ({
    duration,
    onComplete,
    showControls = true,
    style
}) => {
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    const timeRemaining = duration - timeElapsed;
    const progress = (timeElapsed / duration) * 100;

    // Load completion sound (optional)
    useEffect(() => {
        const loadSound = async () => {
            try {
            } catch (error) {
                // Sound file not found - continue without audio feedback
            }
        };
        loadSound();

        return () => {
            soundRef.current?.unloadAsync();
        };
    }, []);

    useEffect(() => {
        if (isRunning && timeElapsed < duration) {
            intervalRef.current = setInterval(() => {
                setTimeElapsed(prev => {
                    const newTime = prev + 1;

                    // Haptic feedback at 10, 5, 3, 2, 1 seconds
                    if ([10, 5, 3, 2, 1].includes(duration - newTime)) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }

                    if (newTime >= duration) {
                        setIsRunning(false);

                        // Completion feedback
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Vibration.vibrate([0, 200, 100, 200]); // Pattern: wait, vibrate, wait, vibrate

                        // Play completion sound
                        soundRef.current?.replayAsync();

                        onComplete?.();
                        return duration;
                    }
                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeElapsed, duration, onComplete]);

    const handleStartPause = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsRunning(!isRunning);
    };

    const handleReset = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsRunning(false);
        setTimeElapsed(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Determine color based on time remaining
    const getProgressColor = (): [string, string] => {
        const percentRemaining = (timeRemaining / duration) * 100;
        if (percentRemaining <= 20) return ['#FF4444', '#FF8888'] as [string, string]; // Red gradient
        if (percentRemaining <= 50) return ['#FFB84D', '#FFD580'] as [string, string]; // Orange gradient
        return ['#00D9FF', '#00FFCC'] as [string, string]; // Cyan-teal gradient
    };

    return (
        <View style={[styles.container, style]}>
            {/* Circular Progress */}
            <View style={styles.timerCircle}>
                {/* Outer glow effect */}
                <LinearGradient
                    colors={['rgba(0, 217, 255, 0.3)', 'transparent']}
                    style={styles.glowOuter}
                />

                {/* Progress ring background */}
                <View style={styles.progressRing} />

                {/* Animated progress fill */}
                <View
                    style={[
                        styles.progressFill,
                        {
                            transform: [{ rotate: `${(progress / 100) * 360}deg` }]
                        }
                    ]}
                />

                {/* Timer content */}
                <View style={styles.timerContent}>
                    <Text style={[
                        styles.timeText,
                        timeRemaining <= 10 && styles.timeTextUrgent
                    ]}>
                        {formatTime(timeRemaining)}
                    </Text>
                    <Text style={styles.labelText}>remaining</Text>
                </View>
            </View>

            {/* Controls */}
            {showControls && (
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.controlButtonContainer}
                        onPress={handleStartPause}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={getProgressColor()}
                            style={styles.controlButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons
                                name={isRunning ? 'pause' : 'play'}
                                size={32}
                                color="#fff"
                            />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlButtonContainer}
                        onPress={handleReset}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#555', '#777']}
                            style={styles.controlButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="refresh" size={28} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Progress Bar Alternative (for overlay mode) */}
            {!showControls && (
                <View style={styles.progressBar}>
                    <LinearGradient
                        colors={getProgressColor()}
                        style={[styles.progressBarFill, { width: `${progress}%` }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerCircle: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    glowOuter: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        top: -10,
        left: -10,
    },
    progressRing: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 10,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    progressFill: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 10,
        borderColor: '#00D9FF',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    timerContent: {
        alignItems: 'center',
    },
    timeText: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
    },
    timeTextUrgent: {
        color: '#FF4444',
    },
    labelText: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
        letterSpacing: 1,
    },
    controls: {
        flexDirection: 'row',
        marginTop: 40,
        gap: 20,
    },
    controlButtonContainer: {
        borderRadius: 36,
        overflow: 'hidden',
    },
    controlButton: {
        width: 72,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00D9FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 20,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
});
