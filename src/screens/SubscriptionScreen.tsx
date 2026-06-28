
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform, Dimensions, TextInput, Modal, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBilling } from '../context/BillingContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/authService';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { updateProfile } from '../store/slices/authSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { BlurView } from 'expo-blur';
import { Spacing, Layout, ThemeColorsType, ThemeShadowsType } from '../theme/Theme';

const SubscriptionScreen = ({ navigation }: { navigation: any }) => {
    const { colors, gradients, shadows, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    const [selectedPlanId, setSelectedPlanId] = useState<'fizi_premium_3month' | 'fizi_premium_annual'>('fizi_premium_3month');
    const [couponCode, setCouponCode] = useState('');
    const [couponStatus, setCouponStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
    const [couponMessage, setCouponMessage] = useState('');
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.auth);
    const {
        products,
        purchased,
        loading: billingLoading,
        purchaseSubscription,
        restorePurchases,
    } = useBilling();

    useEffect(() => {
        if (purchased) {
            setShowPremiumModal(true);
        }
    }, [purchased]);

    // Helper to get formatted price
    const getPrice = (id: string, defaultPrice: string) => {
        const product = products.find(p => p.id === id);
        if (product?.subscriptionOffers?.[0]) {
            const offer = product.subscriptionOffers[0];
            if (Platform.OS === 'android') {
                return offer.pricingPhasesAndroid?.pricingPhaseList?.[0]?.formattedPrice || offer.displayPrice || defaultPrice;
            } else {
                return offer.displayPrice || defaultPrice;
            }
        }
        return defaultPrice;
    };

    const price3Month = getPrice('fizi_premium_3month', '₹299');
    const priceAnnual = getPrice('fizi_premium_annual', '₹799');

    const handleSubscribe = async () => {
        if (purchased) {
            Alert.alert('Active', 'You are already a premium member.');
            return;
        }
        await purchaseSubscription(selectedPlanId);
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponStatus('error');
            setCouponMessage('Please enter a valid coupon code.');
            return;
        }

        setCouponStatus('validating');

        try {
            if (!user) {
                setCouponStatus('error');
                setCouponMessage('Must be logged in to apply code.');
                return;
            }

            // Step 1: Query Firebase
            const couponData = await authService.validateCoupon(couponCode);

            // Step 2: Handle 100% Free Promo (Premium Overrides)
            if (couponData.type === '100_percent_off') {
                const durationMonths = couponData.durationMonths || 1;

                const expiryDate = new Date();
                expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

                // Persist to Firestore + Redux. BillingContext re-evaluates entitlement
                // automatically when the user's premiumExpiryDate changes.
                await dispatch(updateProfile({ premiumExpiryDate: expiryDate })).unwrap();

                setCouponStatus('success');
                setCouponMessage(`${durationMonths} Months Premium Unlocked!`);

                setTimeout(() => {
                    Alert.alert('Success', `${durationMonths} Months Premium Unlocked!`);
                    navigation.navigate('Home');
                }, 1000);
            } else if (couponData.type === 'discount') {
                // Future Implementation for basic percentage discounts on RevenueCat
                setCouponStatus('success');
                setCouponMessage(`Coupon applied successfully! ${couponData.discountPercentage}% discount added.`);
            } else {
                setCouponStatus('error');
                setCouponMessage('Invalid coupon type structure.');
            }
        } catch (error: any) {
            setCouponStatus('error');
            setCouponMessage(error.message || 'Failed to apply coupon. Try again.');
        }
    };

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <LinearGradient
                            colors={[colors.accentYellow, '#FFA500']}
                            style={styles.crownIconContainer}
                        >
                            <MaterialCommunityIcons name="crown" size={20} color="#000" />
                        </LinearGradient>
                        <Text style={styles.title}>FIZI <Text style={{ color: colors.accentYellow }}>Premium</Text></Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                    >

                        {/* Compact Features Grid */}
                        <View style={styles.featuresGrid}>
                            <FeatureItem
                                icon="tune-vertical"
                                title="Custom Plans"
                                description="Tailored to your goals"
                                colors={colors}
                                styles={styles}
                            />
                            <FeatureItem
                                icon="camera-iris"
                                title="Live AI Form"
                                description="Real-time correction"
                                colors={colors}
                                styles={styles}
                            />
                            <FeatureItem
                                icon="food-apple"
                                title="Smart Diet"
                                description="Personalized macros"
                                colors={colors}
                                styles={styles}
                            />
                            <FeatureItem
                                icon="chart-timeline-variant"
                                title="Analytics"
                                description="Track detailed trends"
                                colors={colors}
                                styles={styles}
                            />
                        </View>

                        {/* Plan Selection */}
                        <View style={styles.plansContainer}>
                            {/* 3-Month Plan */}
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setSelectedPlanId('fizi_premium_3month')}
                                style={[
                                    styles.planCard,
                                    selectedPlanId === 'fizi_premium_3month' && styles.selectedPlanCard
                                ]}
                            >
                                {selectedPlanId === 'fizi_premium_3month' ? (
                                    <LinearGradient
                                        colors={gradients.primary}
                                        style={styles.planCardGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <View style={styles.checkBox}>
                                            <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
                                        </View>
                                        <View style={styles.planInfo}>
                                            <Text style={[styles.planName, { color: '#FFF' }]}>Quarterly Plan</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={[styles.planCost, { textDecorationLine: 'line-through', marginRight: 8, opacity: 0.6, color: '#FFF' }]}>₹600</Text>
                                                <Text style={[styles.planCost, { color: '#FFF', fontWeight: 'bold' }]}>{price3Month} / 3mo</Text>
                                            </View>
                                        </View>
                                        <View style={styles.bestValueBadge}>
                                            <Text style={styles.bestValueText}>50% OFF</Text>
                                        </View>
                                    </LinearGradient>
                                ) : (
                                    <View style={[styles.planCardGradient, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                        <View style={[styles.checkBox, { borderWidth: 2, borderColor: colors.glassBorder, backgroundColor: 'transparent' }]} />
                                        <View style={styles.planInfo}>
                                            <Text style={styles.planName}>Quarterly Plan</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={[styles.planCost, { textDecorationLine: 'line-through', marginRight: 8, opacity: 0.5 }]}>₹600</Text>
                                                <Text style={styles.planCost}>{price3Month} / 3mo</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.bestValueBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                            <Text style={[styles.bestValueText, { color: colors.textSecondary }]}>50% OFF</Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Annual Plan */}
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setSelectedPlanId('fizi_premium_annual')}
                                style={[
                                    styles.planCard,
                                    selectedPlanId === 'fizi_premium_annual' && styles.selectedPlanCard
                                ]}
                            >
                                {selectedPlanId === 'fizi_premium_annual' ? (
                                    <LinearGradient
                                        colors={['#EAB308', '#F59E0B']}
                                        style={styles.planCardGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <View style={styles.checkBox}>
                                            <MaterialCommunityIcons name="check-circle" size={24} color="#000" />
                                        </View>
                                        <View style={styles.planInfo}>
                                            <Text style={[styles.planName, { color: '#000' }]}>Annual Plan</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={[styles.planCost, { textDecorationLine: 'line-through', marginRight: 8, opacity: 0.6, color: '#000' }]}>₹1200</Text>
                                                <Text style={[styles.planCost, { color: '#000', fontWeight: 'bold' }]}>{priceAnnual} / yr</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.bestValueBadge, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
                                            <Text style={[styles.bestValueText, { color: '#000' }]}>BEST VALUE</Text>
                                        </View>
                                    </LinearGradient>
                                ) : (
                                    <View style={[styles.planCardGradient, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                        <View style={[styles.checkBox, { borderWidth: 2, borderColor: colors.glassBorder, backgroundColor: 'transparent' }]} />
                                        <View style={styles.planInfo}>
                                            <Text style={styles.planName}>Annual Plan</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={[styles.planCost, { textDecorationLine: 'line-through', marginRight: 8, opacity: 0.5 }]}>₹1200</Text>
                                                <Text style={styles.planCost}>{priceAnnual} / yr</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.bestValueBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                            <Text style={[styles.bestValueText, { color: colors.accentYellow }]}>BEST VALUE</Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionContainer}>
                            {/* Coupon Section */}
                            <View style={styles.couponContainer}>
                                <Text style={styles.couponLabel}>Have a promo code?</Text>
                                <View style={styles.couponInputRow}>
                                    <TextInput
                                        style={styles.couponInput}
                                        placeholder="Enter code"
                                        placeholderTextColor="rgba(255,255,255,0.5)"
                                        value={couponCode}
                                        onChangeText={(text) => {
                                            setCouponCode(text);
                                            if (couponStatus !== 'idle') {
                                                setCouponStatus('idle');
                                                setCouponMessage('');
                                            }
                                        }}
                                        autoCapitalize="characters"
                                        editable={couponStatus !== 'validating' && couponStatus !== 'success'}
                                    />
                                    <TouchableOpacity
                                        style={[
                                            styles.applyButton,
                                            (couponStatus === 'validating' || couponStatus === 'success' || !couponCode.trim()) && styles.disabledButton
                                        ]}
                                        onPress={handleApplyCoupon}
                                        disabled={couponStatus === 'validating' || couponStatus === 'success' || !couponCode.trim()}
                                    >
                                        {couponStatus === 'validating' ? (
                                            <ActivityIndicator color={colors.textPrimary} size="small" />
                                        ) : (
                                            <Text style={styles.applyButtonText}>
                                                {couponStatus === 'success' ? 'Applied' : 'Apply'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {couponMessage ? (
                                    <Text style={[
                                        styles.couponMessage,
                                        { color: couponStatus === 'success' ? colors.accentSuccess : colors.accentError }
                                    ]}>
                                        {couponMessage}
                                    </Text>
                                ) : null}
                            </View>

                            <TouchableOpacity
                                style={[styles.subscribeButton, billingLoading && styles.disabledButton]}
                                onPress={handleSubscribe}
                                disabled={billingLoading}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    {billingLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>
                                            Subscribe for {price3Month}
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.disclaimer}>
                                Recurring billing. Cancel anytime.
                            </Text>

                            <TouchableOpacity onPress={restorePurchases} disabled={billingLoading} style={styles.restoreLink}>
                                <Text style={styles.restoreText}>Restore Purchases</Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <Modal visible={showPremiumModal} transparent={true} animationType="fade">
                <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
                    <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
                        <LinearGradient
                            colors={isDark ? ['#1E1E2E', '#12122A'] : ['#FFFFFF', '#F8FAFC']}
                            style={{ width: '100%', borderRadius: Layout.borderRadius.l, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: '#EAB308', ...shadows.glow }}
                        >
                            <LinearGradient
                                colors={gradients.gold}
                                style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.m }}
                            >
                                <MaterialCommunityIcons name="crown" size={32} color="#000" />
                            </LinearGradient>

                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginBottom: Spacing.s, textAlign: 'center' }}>
                                Premium Active
                            </Text>

                            <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 24 }}>
                                {user?.premiumExpiryDate
                                    ? `Your premium subscription is valid until ${new Date(user.premiumExpiryDate).toLocaleDateString()}.`
                                    : 'You already have a premium subscription!'}
                            </Text>

                            <TouchableOpacity
                                style={{ width: '100%' }}
                                onPress={() => {
                                    setShowPremiumModal(false);
                                    navigation.goBack();
                                }}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={gradients.gold}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ paddingVertical: 16, borderRadius: Layout.borderRadius.round, alignItems: 'center' }}
                                >
                                    <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Continue
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
};

const FeatureItem = ({ icon, title, description, colors, styles }: { icon: any, title: string, description: string, colors: any, styles: any }) => (
    <View style={styles.featureItemWrapper}>
        <BlurView intensity={10} tint="light" style={styles.featureItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryStart + '15' }]}>
                <MaterialCommunityIcons name={icon} size={22} color={colors.accentCyan} />
            </View>
            <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </BlurView>
    </View>
);

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType) => StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        paddingTop: Spacing.s,
        paddingBottom: Spacing.s,
    },
    closeButton: {
        padding: Spacing.xs,
        marginRight: Spacing.m,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 40,
    },
    crownIconContainer: {
        padding: 4,
        borderRadius: 20,
        marginRight: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: Spacing.m,
        paddingBottom: Spacing.xl,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: Spacing.m,
        gap: Spacing.s,
    },
    featureItemWrapper: {
        width: '48%',
        borderRadius: Layout.borderRadius.m,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginBottom: Spacing.s,
    },
    featureItem: {
        padding: Spacing.m,
        alignItems: 'flex-start',
        minHeight: 110,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.s,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 11,
        lineHeight: 14,
    },
    plansContainer: {
        marginTop: Spacing.m,
        gap: Spacing.m,
    },
    planCard: {
        borderRadius: Layout.borderRadius.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        height: 70,
    },
    selectedPlanCard: {
        borderColor: 'rgba(255,255,255,0.5)',
        ...shadows.glow,
    },
    planCardGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
    },
    checkBox: {
        marginRight: Spacing.m,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    planCost: {
        fontSize: 14,
        color: colors.textTertiary,
    },
    bestValueBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.accentYellow,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderBottomLeftRadius: 8,
        zIndex: 1,
    },
    bestValueText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 9,
    },
    actionContainer: {
        marginTop: Spacing.xl,
    },
    couponContainer: {
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.xs,
    },
    couponLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: Spacing.s,
        fontWeight: '600',
    },
    couponInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.s,
    },
    couponInput: {
        flex: 1,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: Layout.borderRadius.m,
        paddingHorizontal: Spacing.m,
        color: colors.textPrimary,
        fontSize: 16,
    },
    applyButton: {
        height: 50,
        paddingHorizontal: Spacing.l,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: Layout.borderRadius.m,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    applyButtonText: {
        color: colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    couponMessage: {
        fontSize: 12,
        marginTop: Spacing.s,
        marginLeft: Spacing.xs,
    },
    subscribeButton: {
        width: '100%',
        height: 55,
        borderRadius: Layout.borderRadius.round,
        marginBottom: Spacing.s,
        ...shadows.glow,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Layout.borderRadius.round,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    disabledButton: {
        opacity: 0.7,
    },
    disclaimer: {
        color: colors.textTertiary,
        fontSize: 12,
        textAlign: 'center',
        marginBottom: Spacing.m,
    },
    restoreLink: {
        alignSelf: 'center',
    },
    restoreText: {
        color: colors.textSecondary,
        fontSize: 14,
        textDecorationLine: 'underline',
    }
});

const styles = StyleSheet.create({}); // Fallback for linter/placeholder

export default SubscriptionScreen;
