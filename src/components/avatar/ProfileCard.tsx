/**
 * ProfileCard
 *
 * Profile hero card matching FitTrack mockup:
 * - Lime-ring avatar with gold crown badge
 * - Display name + role/joined date
 * - Level + streak pill badges
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const MOCK = {
    cardBgFrom: '#1F2229',
    cardBgTo: '#16181F',
    cardBgPremiumFrom: '#26211A',
    cardBgPremiumTo: '#1A1612',
    border: 'rgba(255, 255, 255, 0.06)',
    premiumBorder: 'rgba(234, 179, 8, 0.4)',
    textPrimary: '#F5F6F8',
    textSecondary: '#9BA0AB',
    accent: '#B8FF3C',
    accentBright: '#D4FF6E',
    accentDim: 'rgba(184, 255, 60, 0.15)',
    accentGlow: 'rgba(184, 255, 60, 0.35)',
    accentBorder: 'rgba(184, 255, 60, 0.3)',
    // Premium gold tokens — aligned with theme Gradients.gold (#FDE047 → #EAB308)
    gold: '#EAB308',
    goldBright: '#FDE047',
    goldDeep: '#A16207',
    goldDim: 'rgba(234, 179, 8, 0.18)',
    goldBorder: 'rgba(234, 179, 8, 0.45)',
    goldText: '#0A0B0F',
    orange: '#FB923C',
    orangeDim: 'rgba(251, 146, 60, 0.12)',
    orangeBorder: 'rgba(251, 146, 60, 0.3)',
};

interface ProfileCardProps {
    user: any;
    avatarLevelName: string;
    avatarLevel: number;
    avatarCurrentStreak: number;
    authLoading: boolean;
    isPremium: boolean;
    onPickImage: () => void;
}

const getInitials = (name?: string): string => {
    if (!name) return 'FZ';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatJoinedDate = (createdAt?: any): string => {
    try {
        if (!createdAt) return '';
        const d = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } catch {
        return '';
    }
};

export default function ProfileCard({
    user,
    avatarLevelName,
    avatarLevel,
    avatarCurrentStreak,
    authLoading,
    isPremium,
    onPickImage,
}: ProfileCardProps) {
    const { colors } = useTheme();

    const joined = formatJoinedDate(user?.createdAt);
    const role = avatarLevelName || 'Athlete';
    const subtitle = joined ? `${role} · Joined ${joined}` : role;

    const avatarRingColors: [string, string, ...string[]] = isPremium
        ? [MOCK.goldBright, MOCK.gold, MOCK.goldDeep]
        : [MOCK.accentBright, '#6FAB1F'];

    const cardColors: [string, string] = isPremium
        ? [MOCK.cardBgPremiumFrom, MOCK.cardBgPremiumTo]
        : [MOCK.cardBgFrom, MOCK.cardBgTo];

    const glowColors: [string, string] = isPremium
        ? [MOCK.goldDim, 'transparent']
        : [MOCK.accentDim, 'transparent'];

    return (
        <LinearGradient
            colors={cardColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, isPremium && styles.cardPremium]}
        >
            {/* Soft glow accent in corner */}
            <View style={styles.glow} pointerEvents="none">
                <LinearGradient
                    colors={glowColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.glowFill}
                />
            </View>

            <View style={styles.content}>
                {/* Avatar */}
                <TouchableOpacity onPress={onPickImage} activeOpacity={0.85} style={styles.avatarWrap}>
                    <LinearGradient
                        colors={avatarRingColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.avatar, isPremium && styles.avatarPremium]}
                    >
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarInitials}>{getInitials(user?.displayName)}</Text>
                        )}

                        {authLoading && (
                            <View style={styles.uploadingOverlay}>
                                <ActivityIndicator color="#FFF" size="small" />
                            </View>
                        )}
                    </LinearGradient>

                    {isPremium && (
                        <View style={styles.crownBadge}>
                            <MaterialCommunityIcons name="crown" size={12} color="#0A0B0F" />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Info */}
                <View style={styles.info}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>
                            {user?.displayName || 'Champion'}
                        </Text>
                        {isPremium && (
                            <MaterialCommunityIcons
                                name="check-decagram"
                                size={16}
                                color={MOCK.gold}
                                style={styles.verifiedIcon}
                            />
                        )}
                    </View>
                    <Text style={styles.role} numberOfLines={1}>{subtitle}</Text>

                    <View style={styles.badgesRow}>
                        {isPremium && (
                            <LinearGradient
                                colors={[MOCK.goldBright, MOCK.gold]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.badge, styles.premiumBadge]}
                            >
                                <MaterialCommunityIcons name="crown" size={10} color={MOCK.goldText} />
                                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                            </LinearGradient>
                        )}

                        <View style={[styles.badge, styles.levelBadge]}>
                            <MaterialCommunityIcons name="lightning-bolt" size={10} color={MOCK.accent} />
                            <Text style={styles.levelBadgeText}>LEVEL {avatarLevel}</Text>
                        </View>

                        <View style={[styles.badge, styles.streakBadge]}>
                            <MaterialCommunityIcons name="fire" size={10} color={MOCK.orange} />
                            <Text style={styles.streakBadgeText}>
                                {avatarCurrentStreak} DAY STREAK
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: MOCK.border,
        marginBottom: 14,
        overflow: 'hidden',
        position: 'relative',
    },
    cardPremium: {
        borderColor: MOCK.premiumBorder,
        borderWidth: 1.5,
        shadowColor: MOCK.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    glow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    glowFill: {
        flex: 1,
        borderRadius: 100,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatarWrap: {
        width: 64,
        height: 64,
        position: 'relative',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: MOCK.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    avatarPremium: {
        shadowColor: MOCK.gold,
        shadowOpacity: 0.7,
        shadowRadius: 14,
    },
    avatarImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    avatarInitials: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0A0B0F',
        letterSpacing: -0.5,
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 32,
    },
    crownBadge: {
        position: 'absolute',
        top: -4,
        right: -2,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: MOCK.gold,
        borderWidth: 2,
        borderColor: '#0A0B0F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        minWidth: 0,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    name: {
        fontSize: 22,
        fontWeight: '800',
        color: MOCK.textPrimary,
        letterSpacing: -0.5,
        lineHeight: 26,
        flexShrink: 1,
    },
    verifiedIcon: {
        textShadowColor: 'rgba(251, 191, 36, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    role: {
        fontSize: 13,
        color: MOCK.textSecondary,
        marginBottom: 8,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 100,
        borderWidth: 1,
    },
    levelBadge: {
        backgroundColor: MOCK.accentDim,
        borderColor: MOCK.accentBorder,
    },
    levelBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: MOCK.accent,
        letterSpacing: 0.4,
    },
    streakBadge: {
        backgroundColor: MOCK.orangeDim,
        borderColor: MOCK.orangeBorder,
    },
    streakBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: MOCK.orange,
        letterSpacing: 0.4,
    },
    premiumBadge: {
        borderColor: 'rgba(255, 255, 255, 0.25)',
        shadowColor: MOCK.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 4,
    },
    premiumBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: MOCK.goldText,
        letterSpacing: 0.6,
    },
});
