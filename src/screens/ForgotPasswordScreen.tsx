import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Spacing, Layout, Shadows } from '../theme/Theme';
import { authService } from '../services/authService';
import CustomAlert from '../components/CustomAlert';

interface ForgotPasswordScreenProps {
    navigation: any;
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        type: 'error' | 'success' | 'warning' | 'info';
        buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' }>;
    } | null>(null);

    const handleResetPassword = async () => {
        if (!email) {
            setAlertConfig({
                title: 'Error',
                message: 'Please enter your email address',
                type: 'warning',
                buttons: [
                    { text: 'OK', onPress: () => { }, style: 'default' }
                ]
            });
            setAlertVisible(true);
            return;
        }

        setLoading(true);
        try {
            await authService.sendPasswordResetEmail(email);
            setAlertConfig({
                title: 'Success',
                message: 'Password reset email sent. Please check your inbox.',
                type: 'success',
                buttons: [
                    {
                        text: 'Back to Login',
                        onPress: () => navigation.goBack(),
                        style: 'default'
                    }
                ]
            });
            setAlertVisible(true);
        } catch (error: any) {
            let errorMessage = 'Failed to send reset email.';
            if (error.message.includes('user-not-found')) {
                errorMessage = 'No account found with this email.';
            } else if (error.message.includes('invalid-email')) {
                errorMessage = 'Please enter a valid email address.';
            }

            setAlertConfig({
                title: 'Error',
                message: errorMessage,
                type: 'error',
                buttons: [
                    { text: 'OK', onPress: () => { }, style: 'default' }
                ]
            });
            setAlertVisible(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={Gradients.background} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor={Colors.textTertiary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={Gradients.primary}
                            style={[styles.button, loading && styles.buttonDisabled]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Send Reset Link</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.linkText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {alertConfig && (
                <CustomAlert
                    visible={alertVisible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    buttons={alertConfig.buttons}
                    onDismiss={() => setAlertVisible(false)}
                />
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.l,
        justifyContent: 'center',
    },
    header: {
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    input: {
        backgroundColor: Colors.glassSurface,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        borderRadius: Layout.borderRadius.m,
        height: 73,
        paddingHorizontal: Spacing.m,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    button: {
        borderRadius: Layout.borderRadius.m,
        padding: Spacing.m,
        alignItems: 'center',
        marginTop: 12,
        ...Shadows.glow,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.l,
    },
    linkText: {
        color: Colors.primaryStart,
        fontSize: 14,
        fontWeight: '600',
    },
});
