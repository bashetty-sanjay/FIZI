import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Colors, Spacing, Layout, Shadows } from '../theme/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={styles.container}>
                    <LinearGradient
                        colors={['#0F172A', '#000000']}
                        style={styles.gradient}
                    >
                        <View style={styles.content}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name="alert-octagon" size={80} color={Colors.accentError || '#EF4444'} />
                            </View>

                            <Text style={styles.title}>Something went wrong</Text>
                            <Text style={styles.message}>
                                We've encountered an unexpected error. Don't worry, your progress is safe.
                            </Text>

                            {__DEV__ && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{this.state.error?.message}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.buttonContainer}
                                onPress={this.handleReset}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#4F46E5', '#7C3AED']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.button}
                                >
                                    <MaterialCommunityIcons name="refresh" size={24} color="white" />
                                    <Text style={styles.buttonText}>Try Again</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.footerText}>
                                If the problem persists, please contact support.
                            </Text>
                        </View>
                    </LinearGradient>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: Spacing.xl,
        padding: Spacing.l,
        borderRadius: 50,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.textPrimary,
        marginBottom: Spacing.m,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: Spacing.xl,
    },
    errorBox: {
        width: '100%',
        padding: Spacing.m,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: Layout.borderRadius.m,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    errorText: {
        color: '#FCA5A5',
        fontFamily: 'monospace',
        fontSize: 12,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 300,
        ...Shadows.glow,
    },
    button: {
        height: 56,
        borderRadius: Layout.borderRadius.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.s,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerText: {
        marginTop: Spacing.xl,
        color: Colors.textTertiary || '#64748B',
        fontSize: 13,
    },
});
