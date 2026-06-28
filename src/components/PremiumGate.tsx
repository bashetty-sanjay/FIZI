import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ImageSourcePropType } from 'react-native';
import { useBilling } from '../context/BillingContext';
import { useAppSelector } from '../hooks/reduxHooks';
import { useTheme } from '../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Layout } from '../theme/Theme';

interface PremiumGateProps {
    children: ReactNode;
    featureName?: string;
    description?: string;
    navigation: any;
    lockType?: 'overlay' | 'replacement'; // 'overlay' blurs content, 'replacement' completely hides it
    variant?: 'default' | 'compact' | 'icon';
    backgroundImage?: ImageSourcePropType;
}

export const PremiumGate = ({
    children,
    featureName = 'Premium Feature',
    description,
    navigation,
    lockType = 'replacement',
    variant = 'default',
    backgroundImage
}: PremiumGateProps) => {
    const { purchased } = useBilling();
    const premiumExpiryDate = useAppSelector(state => state.auth.user?.premiumExpiryDate);
    const { colors, gradients, isDark } = useTheme();

    // Fall back to the server-side coupon expiry while BillingContext is still
    // initializing or RNIap is unavailable, so a freshly redeemed coupon doesn't
    // briefly show locked content.
    const couponActive = premiumExpiryDate
        ? new Date(premiumExpiryDate).getTime() > Date.now()
        : false;

    if (purchased || couponActive) {
        return <>{children}</>;
    }

    if (lockType === 'overlay') {
        return (
            <View style={{ flex: 1, position: 'relative' }}>
                <View style={{ opacity: 0.1, pointerEvents: 'none' }}>
                    {children}
                </View>
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 10 }]}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                    <LockContent
                        featureName={featureName}
                        navigation={navigation}
                        colors={colors}
                        gradients={gradients}
                        variant={variant}
                    />
                </View>
            </View>
        );
    }

    // Default 'replacement' mode
    if (variant === 'compact') {
        return (
            <LockContent
                featureName={featureName}
                navigation={navigation}
                colors={colors}
                gradients={gradients}
                variant={variant}
            />
        );
    }

    const containerStyle = variant === 'icon'
        ? { backgroundColor: 'transparent', padding: 0 }
        : [styles.container, { backgroundColor: colors.backgroundDark }];

    return (
        <View style={containerStyle}>
            {backgroundImage ? (
                <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} resizeMode="cover">
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <LockContent
                        featureName={featureName}
                        description={description}
                        navigation={navigation}
                        colors={colors}
                        gradients={gradients}
                        variant={variant}
                    />
                </ImageBackground>
            ) : (
                <LockContent
                    featureName={featureName}
                    description={description}
                    navigation={navigation}
                    colors={colors}
                    gradients={gradients}
                    variant={variant}
                />
            )}
        </View>
    );
};

const LockContent = ({ featureName, description, navigation, colors, gradients, variant }: any) => {
    if (variant === 'icon') {
        return (
            <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('Subscription')}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="lock" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
        );
    }

    if (variant === 'compact') {
        return (
            <TouchableOpacity
                style={styles.compactButton}
                onPress={() => navigation.navigate('Subscription')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={gradients.gold}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.compactGradient}
                >
                    <MaterialCommunityIcons name="lock" size={18} color="#000" />
                    <Text style={styles.compactText}>Unlock {featureName}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.lockContent}>
            <LinearGradient
                colors={[colors.accentYellow + '40', colors.accentYellow + '10']}
                style={styles.iconContainer}
            >
                <MaterialCommunityIcons name="lock" size={32} color={colors.accentYellow} />
            </LinearGradient>

            <Text style={[styles.title, { color: colors.textPrimary }]}>{featureName}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {description || "Unlock this feature with FIZI Premium"}
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Subscription')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={gradients.gold}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                >
                    <Text style={styles.buttonText}>Unlock Now</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color="#000" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    lockContent: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.l,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: Spacing.s,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        opacity: 0.8,
    },
    button: {
        width: 200,
        height: 48,
        borderRadius: Layout.borderRadius.round,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Layout.borderRadius.round,
        gap: 8,
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Compact styles
    compactContainer: {
        padding: Spacing.s,
    },
    compactButton: {
        borderRadius: Layout.borderRadius.l,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        width: '100%',
        marginTop: 10,  // Add some spacing if needed, though replacement usually consumes space
    },
    compactGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center content
        paddingHorizontal: Spacing.l,
        height: 64, // Match standard button height
        borderRadius: Layout.borderRadius.l,
        gap: 8,
    },
    compactText: {
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
    iconButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
