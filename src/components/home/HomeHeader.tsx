import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, ThemeColorsType, ThemeShadowsType } from '../../theme/Theme';
import { useTheme } from '../../hooks/useTheme';

const NEON_GREEN = '#C4FF1A';

interface HomeHeaderProps {
    user: any;
    onAvatarPress: () => void;
    isPremium?: boolean;
}

const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const HomeHeader: React.FC<HomeHeaderProps> = ({ user, onAvatarPress, isPremium = false }) => {
    const { colors, gradients, shadows } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    const initials = getInitials(user?.displayName);

    const renderAvatarBody = () => (
        user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
        ) : (
            <Text style={[styles.avatarText, isPremium && styles.avatarTextPremium]}>{initials}</Text>
        )
    );

    return (
        <View style={styles.header}>
            <View style={{ flex: 1, marginRight: Spacing.m }}>
                <Text style={styles.greeting}>Welcome back</Text>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {user?.displayName || 'Champion'} <Text style={styles.wave}>👋</Text>
                    </Text>
                    {isPremium && (
                        <LinearGradient
                            colors={gradients.gold}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.premiumPill}
                        >
                            <MaterialCommunityIcons name="crown" size={10} color={colors.textDark} />
                            <Text style={styles.premiumPillText}>PRO</Text>
                        </LinearGradient>
                    )}
                </View>
            </View>
            <TouchableOpacity
                onPress={onAvatarPress}
                activeOpacity={0.8}
                style={styles.avatarWrap}
            >
                {isPremium ? (
                    <LinearGradient
                        colors={gradients.gold}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.avatarCircle, styles.avatarCirclePremium]}
                    >
                        {renderAvatarBody()}
                    </LinearGradient>
                ) : (
                    <View style={styles.avatarCircle}>{renderAvatarBody()}</View>
                )}
                {isPremium && (
                    <View style={styles.crownBadge}>
                        <MaterialCommunityIcons name="crown" size={10} color={colors.textDark} />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (colors: ThemeColorsType, shadows: ThemeShadowsType) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    greeting: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
        marginBottom: 2,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.s,
        flexWrap: 'wrap',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.textPrimary,
        letterSpacing: -0.3,
        flexShrink: 1,
    },
    wave: {
        fontSize: 24,
    },
    premiumPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 100,
        shadowColor: colors.accentYellow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },
    premiumPillText: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.textDark,
        letterSpacing: 0.6,
    },
    avatarWrap: {
        position: 'relative',
    },
    avatarCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: NEON_GREEN + '26',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: NEON_GREEN + '66',
        overflow: 'hidden',
    },
    avatarCirclePremium: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadowColor: colors.accentYellow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 8,
    },
    avatarImage: {
        width: 52,
        height: 52,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: NEON_GREEN,
        letterSpacing: 0.5,
    },
    avatarTextPremium: {
        color: colors.textDark,
    },
    crownBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.accentYellow,
        borderWidth: 1.5,
        borderColor: colors.backgroundDark,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
