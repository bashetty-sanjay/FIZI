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
    Alert,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { signUp, clearError } from '../store/slices/authSlice';
import { Colors, Gradients, Spacing, Layout, Shadows } from '../theme/Theme';
import GoogleSignInButton from '../components/GoogleSignInButton';

interface SignupScreenProps {
    navigation: any;
}

export default function SignupScreen({ navigation }: SignupScreenProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const passwordInputRef = React.useRef<TextInput>(null);
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    // Pre-fill email if coming from login screen
    React.useEffect(() => {
        const prefillEmail = navigation.params?.prefillEmail;
        if (prefillEmail) {
            setEmail(prefillEmail);
            // Focus on password field after a short delay
            setTimeout(() => {
                passwordInputRef.current?.focus();
            }, 100);
        }
    }, [navigation.params]);

    React.useEffect(() => {
        if (error) {
            Alert.alert('Signup Error', error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        try {
            await dispatch(signUp({ email, password, displayName: name })).unwrap();
            // Navigation to profile setup will be handled automatically
        } catch (err: any) {
            // Show detailed error for debugging
            const errorMessage = err?.message || err?.toString() || 'Unknown error occurred';
            Alert.alert('Signup Error - Details', errorMessage);
            console.error('Signup error details:', err);
        }
    };

    return (
        <LinearGradient colors={Gradients.background} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Start your fitness transformation today</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your name"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={name}
                                    onChangeText={setName}
                                    editable={!loading}
                                />
                            </View>

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
                                        ref={passwordInputRef}
                                        style={styles.passwordInput}
                                        placeholder="Create a password"
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

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Confirm your password"
                                        placeholderTextColor={Colors.textTertiary}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        editable={!loading}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons
                                            name={showConfirmPassword ? "eye-off" : "eye"}
                                            size={24}
                                            color={Colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleSignup}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={Gradients.primary}
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>Create Account</Text>
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
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.linkText}>Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.l,
        paddingVertical: 48,
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
        height: 72, // Increased for a more spacious feel
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
        height: 72, // Increased for a more spacious feel
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
});
