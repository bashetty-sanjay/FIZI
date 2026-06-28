import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Spacing, Layout, ThemeColorsType } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DataUsageScreenProps {
    navigation: any;
}

export default function DataUsageScreen({ navigation }: DataUsageScreenProps) {
    const { colors, gradients, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Camera & Data Usage</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <BlurView intensity={20} tint={isDark ? "light" : "dark"} style={styles.card}>
                    <MaterialCommunityIcons name="shield-check" size={48} color={colors.accentCyan} style={styles.icon} />

                    <Text style={styles.introText}>
                        We value your privacy and believe in full transparency regarding how FIZI uses your device's capabilities and data.
                    </Text>

                    <Text style={styles.sectionTitle}>Camera Usage</Text>
                    <Text style={styles.text}>
                        • <Text style={styles.bold}>Purpose</Text>: The camera is used strictly for real-time workout posture analysis and rep counting.
                        {'\n'}
                        • <Text style={styles.bold}>Processing</Text>: All video frames are processed ephemerally on your device or temporary secure server session.
                        {'\n'}
                        • <Text style={styles.bold}>No Recording</Text>: We DO NOT record, save, or store any video footage of you.
                    </Text>

                    <Text style={styles.sectionTitle}>Data Privacy</Text>
                    <Text style={styles.text}>
                        • <Text style={styles.bold}>No Sharing</Text>: Your personal health and fitness data is never sold or shared with third-party advertisers.
                        {'\n'}
                        • <Text style={styles.bold}>Secure Storage</Text>: Your account details and workout history are stored securely using industry-standard encryption.
                    </Text>

                    <Text style={styles.sectionTitle}>Permissions</Text>
                    <Text style={styles.text}>
                        You can revoke camera permissions at any time in your device settings. However, doing so will disable the AI coaching features.
                    </Text>
                </BlurView>
                <View style={{ height: 40 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const createStyles = (colors: ThemeColorsType) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: Spacing.l,
        paddingBottom: Spacing.m,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: colors.glassSurface,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    scrollContent: {
        padding: Spacing.m,
    },
    card: {
        borderRadius: Layout.borderRadius.l,
        padding: Spacing.l,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    icon: {
        alignSelf: 'center',
        marginBottom: Spacing.l,
    },
    introText: {
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: Spacing.m,
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.accentCyan,
        marginTop: Spacing.l,
        marginBottom: Spacing.s,
    },
    text: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    bold: {
        fontWeight: 'bold',
        color: colors.textPrimary,
    }
});
