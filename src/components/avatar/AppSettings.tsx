/**
 * AppSettings
 *
 * Settings sections matching FitTrack mockup styling:
 * Preferences (toggle) → Support & Legal → Account
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const MOCK = {
    bgCard: '#1A1D26',
    bgCardHover: '#20242E',
    border: 'rgba(255, 255, 255, 0.06)',
    textPrimary: '#F5F6F8',
    textSecondary: '#9BA0AB',
    textTertiary: '#5C6170',
    accent: '#B8FF3C',
    iconNeutralBg: 'rgba(255,255,255,0.05)',
    danger: '#FF5A5F',
    dangerBg: 'rgba(255, 90, 95, 0.1)',
};

interface AppSettingsProps {
    onChangePassword: () => void;
    onShareApp: () => void;
    onSignOut: () => void;
    navigation: any;
}

export default function AppSettings({
    onChangePassword,
    onSignOut,
    navigation,
}: AppSettingsProps) {
    const { isDark, toggleTheme } = useTheme();

    const SectionHeading = ({ label }: { label: string }) => (
        <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{label}</Text>
        </View>
    );

    const Card = ({ children }: { children: React.ReactNode }) => (
        <View style={styles.menuCard}>{children}</View>
    );

    const Row = ({
        icon,
        label,
        onPress,
        right,
        danger,
        last,
    }: {
        icon: string;
        label: string;
        onPress?: () => void;
        right?: React.ReactNode;
        danger?: boolean;
        last?: boolean;
    }) => (
        <TouchableOpacity
            style={[styles.menuItem, !last && styles.menuItemBorder]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={[styles.menuIcon, danger && { backgroundColor: MOCK.dangerBg }]}>
                <MaterialCommunityIcons
                    name={icon as any}
                    size={18}
                    color={danger ? MOCK.danger : MOCK.textSecondary}
                />
            </View>
            <Text style={[styles.menuTitle, danger && { color: MOCK.danger }]}>
                {label}
            </Text>
            {right ?? (onPress
                ? <MaterialCommunityIcons name="chevron-right" size={18} color={MOCK.textTertiary} />
                : null
            )}
        </TouchableOpacity>
    );

    const Toggle = ({ value, onPress }: { value: boolean; onPress?: () => void }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={[
                styles.toggleTrack,
                { backgroundColor: value ? MOCK.accent : 'rgba(255,255,255,0.1)' },
            ]}
        >
            <View
                style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: value ? 18 : 0 }] },
                ]}
            />
        </TouchableOpacity>
    );

    return (
        <View>
            {/* Preferences */}
            <SectionHeading label="PREFERENCES" />
            <View style={styles.toggleRow}>
                <View style={styles.toggleIcon}>
                    <MaterialCommunityIcons
                        name={isDark ? 'weather-night' : 'white-balance-sunny'}
                        size={18}
                        color={MOCK.textSecondary}
                    />
                </View>
                <Text style={styles.toggleLabel}>Dark Mode</Text>
                <Toggle value={isDark} onPress={toggleTheme} />
            </View>

            {/* Support & Legal */}
            <SectionHeading label="SUPPORT & LEGAL" />
            <Card>
                <Row icon="help-circle-outline" label="FAQ" onPress={() => navigation.navigate('FAQ')} />
                <Row
                    icon="shield-account-outline"
                    label="Privacy Policy"
                    onPress={() => Linking.openURL('https://github.com/fizifitnessgenie/Legal/blob/main/Privacy-Policy.md')}
                />
                <Row
                    icon="file-document-outline"
                    label="Terms of Service"
                    onPress={() => Linking.openURL('https://github.com/fizifitnessgenie/Legal/blob/main/Terms-of-Service.md')}
                />
                <Row icon="information-outline" label="About Us" onPress={() => navigation.navigate('AboutUs')} />
                <Row icon="camera-outline" label="Camera & Data Usage" onPress={() => navigation.navigate('DataUsage')} />
                <Row
                    icon="email-outline"
                    label="Contact Support"
                    onPress={() => Linking.openURL('mailto:fizi.fitnessgenie@gmail.com')}
                    last
                />
            </Card>

            {/* Account */}
            <SectionHeading label="ACCOUNT" />
            <Card>
                <Row icon="lock-outline" label="Change Password" onPress={onChangePassword} />
                <Row icon="logout" label="Sign Out" onPress={onSignOut} />
                <Row
                    icon="trash-can-outline"
                    label="Delete Account"
                    danger
                    onPress={() => Linking.openURL(
                        'mailto:fizi.fitnessgenie@gmail.com?subject=Delete Account Request&body=Please delete my account data associated with this email.'
                    )}
                    last
                />
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionHeading: {
        marginTop: 22,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        color: MOCK.textTertiary,
    },
    menuCard: {
        backgroundColor: MOCK.bgCard,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: MOCK.border,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: MOCK.border,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: MOCK.iconNeutralBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: MOCK.textPrimary,
        letterSpacing: -0.1,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: MOCK.bgCard,
        borderWidth: 1,
        borderColor: MOCK.border,
        borderRadius: 18,
    },
    toggleIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: MOCK.iconNeutralBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: MOCK.textPrimary,
    },
    toggleTrack: {
        width: 42,
        height: 24,
        borderRadius: 100,
        padding: 2,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
    },
});
