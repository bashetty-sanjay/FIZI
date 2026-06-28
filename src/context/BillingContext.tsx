import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import type {
    Purchase,
    PurchaseError,
    Product,
    ProductSubscription,
} from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const SUBSCRIPTION_IDS = ['fizi_premium_3month', 'fizi_premium_annual'];

let RNIap: any;
try {
    RNIap = require('react-native-iap');
} catch (e) {
    // react-native-iap is not available (e.g. Expo Go) — billing falls back to coupon-only mode.
}

type EntitlementSource = 'iap' | 'coupon';

interface CachedEntitlement {
    source: EntitlementSource;
    expiresAt?: string; // ISO date; absent for IAP (we revalidate via store)
}

const cacheKey = (uid: string) => `is_premium_${uid}`;

const readCache = async (uid: string): Promise<CachedEntitlement | null> => {
    try {
        const raw = await AsyncStorage.getItem(cacheKey(uid));
        if (!raw) return null;
        // Backwards compatibility with the legacy 'true' flag
        if (raw === 'true') return { source: 'coupon' };
        return JSON.parse(raw) as CachedEntitlement;
    } catch {
        return null;
    }
};

const writeCache = async (uid: string, value: CachedEntitlement | null) => {
    try {
        if (value === null) {
            await AsyncStorage.removeItem(cacheKey(uid));
        } else {
            await AsyncStorage.setItem(cacheKey(uid), JSON.stringify(value));
        }
    } catch {
        // ignore — cache is best-effort
    }
};

const isCachedEntitlementActive = (entry: CachedEntitlement | null): boolean => {
    if (!entry) return false;
    if (!entry.expiresAt) return true; // IAP entries trust the store; treated as active until refuted
    return new Date(entry.expiresAt).getTime() > Date.now();
};

interface BillingContextType {
    connected: boolean;
    products: (Product | ProductSubscription)[];
    purchased: boolean;
    loading: boolean;
    purchaseSubscription: (productId: string) => Promise<void>;
    restorePurchases: () => Promise<void>;
    checkSubscriptionStatus: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

const MOCK_PRODUCTS: any[] = [
    {
        id: 'fizi_premium_3month',
        productId: 'fizi_premium_3month',
        title: 'FIZI Premium (Quarterly)',
        description: '3 Month Plan (Mock)',
        price: '₹299',
        currency: 'INR',
        subscriptionOffers: [{
            offerTokenAndroid: 'mock_token_3m',
            displayPrice: '₹299',
            pricingPhasesAndroid: { pricingPhaseList: [{ formattedPrice: '₹299' }] },
        }],
    },
];

export const BillingProvider = ({ children }: { children: ReactNode }) => {
    const [connected, setConnected] = useState(false);
    const [products, setProducts] = useState<(Product | ProductSubscription)[]>([]);
    const [purchased, setPurchased] = useState(false);
    const [loading, setLoading] = useState(false);

    const user = useSelector((state: RootState) => state.auth.user);
    const uid = user?.uid;
    const premiumExpiryDate = user?.premiumExpiryDate;
    const connectedRef = useRef(connected);
    useEffect(() => { connectedRef.current = connected; }, [connected]);

    const getAvailablePurchases = useCallback(async () => {
        if (!RNIap) return null;
        try {
            return await RNIap.getAvailablePurchases();
        } catch (error) {
            console.warn('getAvailablePurchases error', error);
            return null;
        }
    }, []);

    const evaluateEntitlement = useCallback(async (currentUid: string, expiry: any) => {
        // 1) Server-issued coupon premium (Firestore truth)
        if (expiry) {
            const expiryDate = new Date(expiry);
            if (!isNaN(expiryDate.getTime()) && expiryDate.getTime() > Date.now()) {
                setPurchased(true);
                await writeCache(currentUid, {
                    source: 'coupon',
                    expiresAt: expiryDate.toISOString(),
                });
                return;
            }
        }

        // 2) Store entitlement (IAP)
        const purchases = await getAvailablePurchases();
        if (purchases !== null) {
            const hasPremium = purchases.some((p: any) => SUBSCRIPTION_IDS.includes(p.productId));
            if (hasPremium) {
                setPurchased(true);
                await writeCache(currentUid, { source: 'iap' });
                return;
            }
            // Store query succeeded and reported no active entitlement → revoke
            setPurchased(false);
            await writeCache(currentUid, null);
            return;
        }

        // 3) Offline / RNIap unavailable → fall back to cached entitlement
        const cached = await readCache(currentUid);
        if (isCachedEntitlementActive(cached)) {
            setPurchased(true);
        } else {
            setPurchased(false);
            if (cached) await writeCache(currentUid, null);
        }
    }, [getAvailablePurchases]);

    // Init RNIap connection + product fetch (one-time)
    useEffect(() => {
        let purchaseUpdateSubscription: any;
        let purchaseErrorSubscription: any;

        const initializeBilling = async () => {
            if (!RNIap) {
                setProducts(MOCK_PRODUCTS);
                return;
            }
            try {
                const result = await RNIap.initConnection();
                setConnected(result);
                if (result) {
                    const fetched = await RNIap.fetchProducts({ skus: SUBSCRIPTION_IDS, type: 'subs' });
                    if (Array.isArray(fetched)) setProducts(fetched);
                }
            } catch (err) {
                console.warn('IAP Init Error', err);
            }
        };

        initializeBilling();

        if (RNIap) {
            purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase: Purchase) => {
                if (!purchase) return;
                try {
                    await RNIap.finishTransaction({ purchase, isConsumable: false });
                    setPurchased(true);
                    setLoading(false);
                    if (uid) await writeCache(uid, { source: 'iap' });
                    Alert.alert('Success', 'Subscription active! Premium features unlocked.');
                } catch (ackErr) {
                    console.warn('ackErr', ackErr);
                }
            });

            purchaseErrorSubscription = RNIap.purchaseErrorListener((error: PurchaseError) => {
                setLoading(false);
                console.warn('Purchase error:', error);
                const code = 'responseCode' in error ? (error as any).responseCode : null;
                if (code !== 6) Alert.alert('Purchase Failed', error.message);
            });
        }

        return () => {
            if (purchaseUpdateSubscription) purchaseUpdateSubscription.remove();
            if (purchaseErrorSubscription) purchaseErrorSubscription.remove();
            if (RNIap) RNIap.endConnection();
        };
    }, []);

    // Re-evaluate entitlement whenever the Redux user changes.
    // Single source of truth: this is the only place that flips `purchased` (besides the live purchase listener).
    useEffect(() => {
        if (!uid) {
            setPurchased(false);
            return;
        }

        let cancelled = false;
        (async () => {
            // Optimistic: surface the cached value first so premium UIs don't flicker locked.
            const cached = await readCache(uid);
            if (!cancelled && isCachedEntitlementActive(cached)) {
                setPurchased(true);
            }
            // Then reconcile with the authoritative sources.
            if (!cancelled) await evaluateEntitlement(uid, premiumExpiryDate);
        })();

        return () => { cancelled = true; };
    }, [uid, premiumExpiryDate, evaluateEntitlement]);

    const purchaseSubscription = async (productId: string) => {
        if (!RNIap) {
            Alert.alert('Expo Go', 'In-App Purchases are not supported in Expo Go. Use a development build on a physical device.');
            return;
        }
        if (!connected) {
            Alert.alert('Error', 'Billing service not connected');
            return;
        }

        setLoading(true);
        try {
            const sub = products.find(p => p.id === productId) as ProductSubscription | undefined;
            if (!sub) {
                Alert.alert('Error', 'Subscription product not found');
                setLoading(false);
                return;
            }

            const offerToken = sub.subscriptionOffers?.[0]?.offerTokenAndroid;
            if (!offerToken && Platform.OS === 'android') {
                Alert.alert('Error', 'Offer token not found for subscription');
                setLoading(false);
                return;
            }

            const requestParams: any = { type: 'subs' };
            if (Platform.OS === 'android') {
                requestParams.request = {
                    google: {
                        skus: [sub.id],
                        subscriptionOffers: [{ sku: sub.id, offerToken }],
                    },
                };
            } else {
                requestParams.request = { apple: { sku: sub.id } };
            }

            await RNIap.requestPurchase(requestParams);
        } catch (err: any) {
            setLoading(false);
            console.warn('Request subscription failed', err);
        }
    };

    const restorePurchases = async () => {
        if (!uid) {
            Alert.alert('Error', 'You must be logged in to restore purchases.');
            return;
        }

        setLoading(true);
        try {
            const purchases = await getAvailablePurchases();
            if (purchases === null) {
                Alert.alert('Error', 'Could not fetch purchases. Please try again later.');
                return;
            }
            const hasPremium = purchases.some((p: any) => SUBSCRIPTION_IDS.includes(p.productId));
            if (hasPremium) {
                setPurchased(true);
                await writeCache(uid, { source: 'iap' });
                Alert.alert('Restore Successful', 'Your subscription has been restored.');
            } else {
                Alert.alert('Restore', 'No active subscription found.');
            }
        } catch (err) {
            console.warn('Restore failed', err);
            Alert.alert('Error', 'Failed to restore purchases');
        } finally {
            setLoading(false);
        }
    };

    const checkSubscriptionStatus = useCallback(async () => {
        if (!uid) {
            setPurchased(false);
            return;
        }
        await evaluateEntitlement(uid, premiumExpiryDate);
    }, [uid, premiumExpiryDate, evaluateEntitlement]);

    return (
        <BillingContext.Provider
            value={{
                connected,
                products,
                purchased,
                loading,
                purchaseSubscription,
                restorePurchases,
                checkSubscriptionStatus,
            }}
        >
            {children}
        </BillingContext.Provider>
    );
};

export const useBilling = () => {
    const context = useContext(BillingContext);
    if (!context) {
        throw new Error('useBilling must be used within a BillingProvider');
    }
    return context;
};
