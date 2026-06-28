import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    Modal,
    TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { signInWithGoogle, linkGoogleAccount } from '../store/slices/authSlice';
import { Colors, Layout, Spacing } from '../theme/Theme';

// Configure once at module load. webClientId is the OAuth *web* client — it is
// the audience Firebase validates the idToken against (NOT the Android client).
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

/**
 * "Continue with Google" button.
 *
 * Obtains a Google idToken natively and hands it to the auth slice. If the
 * email already has a password account, prompts for the password once and links
 * Google to it. Navigation is driven by the global onAuthStateChanged stream.
 */
export default function GoogleSignInButton() {
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.auth);
    const [busy, setBusy] = React.useState(false);

    // Account-linking modal state.
    const [linkVisible, setLinkVisible] = React.useState(false);
    const [linkEmail, setLinkEmail] = React.useState('');
    const [linkPassword, setLinkPassword] = React.useState('');
    const [linkError, setLinkError] = React.useState<string | null>(null);
    const [linking, setLinking] = React.useState(false);
    const pendingIdToken = React.useRef<string | null>(null);

    const handlePress = async () => {
        try {
            setBusy(true);
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            // Force the account chooser every time so users can switch accounts.
            await GoogleSignin.signOut();
            const response = await GoogleSignin.signIn();

            if (response.type !== 'success') return; // cancelled
            const idToken = response.data?.idToken;
            if (!idToken) return;

            pendingIdToken.current = idToken;
            try {
                await dispatch(signInWithGoogle({ idToken })).unwrap();
                // Success → onAuthStateChanged drives navigation.
            } catch (rejected: any) {
                // Email already has a password account → prompt to link.
                if (rejected?.code === 'account-exists') {
                    setLinkEmail(rejected.email || '');
                    setLinkPassword('');
                    setLinkError(null);
                    setLinkVisible(true);
                }
                // Other errors surface via the screen's `error` alert handler.
            }
        } catch (error: any) {
            if (
                error?.code !== statusCodes.SIGN_IN_CANCELLED &&
                error?.code !== statusCodes.IN_PROGRESS
            ) {
                console.error('Google Sign-In error:', error);
            }
        } finally {
            setBusy(false);
        }
    };

    const handleLink = async () => {
        if (!linkPassword) {
            setLinkError('Please enter your password');
            return;
        }
        if (!pendingIdToken.current) {
            setLinkError('Please try signing in with Google again');
            return;
        }
        try {
            setLinking(true);
            setLinkError(null);
            await dispatch(
                linkGoogleAccount({
                    email: linkEmail,
                    password: linkPassword,
                    idToken: pendingIdToken.current,
                }),
            ).unwrap();
            // Linked + signed in → close modal; auth stream handles navigation.
            setLinkVisible(false);
        } catch (err: any) {
            setLinkError(typeof err === 'string' ? err : 'Could not link account');
        } finally {
            setLinking(false);
        }
    };

    const disabled = busy || loading;

    return (
        <>
            <TouchableOpacity
                style={[styles.button, disabled && styles.buttonDisabled]}
                activeOpacity={0.8}
                disabled={disabled}
                onPress={handlePress}
            >
                {disabled ? (
                    <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                    <View style={styles.content}>
                        <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
                        <Text style={styles.label}>Continue with Google</Text>
                    </View>
                )}
            </TouchableOpacity>

            <Modal
                visible={linkVisible}
                transparent
                animationType="fade"
                onRequestClose={() => !linking && setLinkVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Link your account</Text>
                        <Text style={styles.modalBody}>
                            {linkEmail} already has an account. Enter your password to connect
                            Google to it.
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Password"
                            placeholderTextColor={Colors.textTertiary}
                            secureTextEntry
                            value={linkPassword}
                            onChangeText={setLinkPassword}
                            editable={!linking}
                            autoFocus
                        />
                        {linkError && <Text style={styles.modalError}>{linkError}</Text>}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setLinkVisible(false)}
                                disabled={linking}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirm}
                                onPress={handleLink}
                                disabled={linking}
                            >
                                {linking ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalConfirmText}>Link & Continue</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: Colors.glassSurface,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        borderRadius: Layout.borderRadius.m,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.s,
    },
    label: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        paddingHorizontal: Spacing.l,
    },
    modalCard: {
        backgroundColor: Colors.cardSurface,
        borderRadius: Layout.borderRadius.l,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        padding: Spacing.l,
        gap: Spacing.m,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    modalBody: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    modalInput: {
        backgroundColor: Colors.glassSurface,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        borderRadius: Layout.borderRadius.m,
        height: 52,
        paddingHorizontal: Spacing.m,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    modalError: {
        color: '#EA4335',
        fontSize: 13,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: Spacing.m,
        marginTop: Spacing.s,
    },
    modalCancel: {
        paddingVertical: Spacing.s,
        paddingHorizontal: Spacing.m,
    },
    modalCancelText: {
        color: Colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    modalConfirm: {
        backgroundColor: Colors.primaryStart,
        borderRadius: Layout.borderRadius.m,
        paddingVertical: Spacing.s,
        paddingHorizontal: Spacing.l,
        minWidth: 130,
        alignItems: 'center',
    },
    modalConfirmText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
