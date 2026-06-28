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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { signIn, clearError } from '../store/slices/authSlice';
import { Colors, Gradients, Spacing, Layout, Shadows } from '../theme/Theme';
import CustomAlert from '../components/CustomAlert';
import GoogleSignInButton from '../components/GoogleSignInButton';

interface LoginScreenProps {
    navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        type: 'error' | 'success' | 'warning' | 'info';
        buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' }>;
    } | null>(null);
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    React.useEffect(() => {
        if (error) {
            // Debug: Log the actual error to console


            // Check if it's a "user not found" or "invalid credential" error
            // auth/invalid-credential means either user doesn't exist OR wrong password (Firebase doesn't distinguish for security)
            if (error.includes('No account found') ||
                error.includes('user-not-found') ||
                error.includes('Invalid email or password')) {
                setAlertConfig({
                    title: 'Login Failed',
                    message: "Invalid email or password. Don't have an account yet?",
                    type: 'error',
                    buttons: [
                        { text: 'Try Again', onPress: () => { }, style: 'cancel' },
                        { text: 'Sign Up', onPress: () => navigation.navigate('Signup', { prefillEmail: email }) }
                    ]
                });
                setAlertVisible(true);
            } else {
                // Show the specific error message from Firebase
                setAlertConfig({
                    title: 'Login Error',
                    message: error,
                    type: 'error',
                    buttons: [
                        { text: 'OK', onPress: () => { }, style: 'default' }
                    ]
                });
                setAlertVisible(true);
            }
            dispatch(clearError());
        }
    }, [error, email, navigation, dispatch]);

    const handleLogin = async () => {
        if (!email || !password) {
            setAlertConfig({
                title: 'Error',
                message: 'Please fill in all fields',
                type: 'warning',
                buttons: [
                    { text: 'OK', onPress: () => { }, style: 'default' }
                ]
            });
            setAlertVisible(true);
            return;
        }

        try {
            await dispatch(signIn({ email, password })).unwrap();
        } catch (err) {
            // Error is handled in useEffect
        }
    };

    return (
        <LinearGradient colors={Gradients.background} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue your fitness journey</Text>
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

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name={showPassword ? "eye-off" : "eye"}
                                    size={24}
                                    color={Colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('ForgotPassword')}
                        style={styles.forgotPasswordContainer}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={Gradients.primary}
                            style={[styles.button, loading && styles.buttonDisabled]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <GoogleSignInButton />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.linkText}>Sign Up</Text>
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
        height: 73, // Increased for a more spacious feel
        paddingHorizontal: Spacing.m,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.glassSurface,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        borderRadius: Layout.borderRadius.m,
        height: 73, // Increased for a more spacious feel
        overflow: 'hidden',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: Spacing.m,
        height: '100%',
        fontSize: 16,
        color: Colors.textPrimary,
        backgroundColor: 'transparent',
    },
    eyeIcon: {
        paddingHorizontal: Spacing.s, // Balanced with input padding (12px)
        height: '100%',
        justifyContent: 'center',
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
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.s,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.glassBorder,
    },
    dividerText: {
        color: Colors.textTertiary,
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.l,
    },
    footerText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    linkText: {
        color: Colors.primaryStart,
        fontSize: 14,
        fontWeight: '600',
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginTop: -12, // Pull closer to password field
        marginBottom: 8,
    },
    forgotPasswordText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
});
