import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Spacing, Layout, ThemeColorsType } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AboutUsScreenProps {
    navigation: any;
}

export default function AboutUsScreen({ navigation }: AboutUsScreenProps) {
    const { colors, gradients, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About Us</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <BlurView intensity={20} tint={isDark ? "light" : "dark"} style={styles.card}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.appName}>FIZI</Text>
                        <Text style={styles.appTagline}>Your Personal AI Fitness Trainer</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Our Mission</Text>
                    <Text style={styles.text}>
                        At FIZI, we believe that everyone deserves access to professional-grade fitness coaching. Our mission is to democratize personal training using advanced AI technology, making it accessible, affordable, and effective for everyone, anywhere.
                    </Text>

                    <Text style={styles.sectionTitle}>How It Works</Text>
                    <Text style={styles.text}>
                        FIZI utilizes state-of-the-art computer vision to analyze your movements in real-time through your phone's camera.
                        {'\n\n'}
                        • <Text style={styles.bold}>Real-time Feedback</Text>: Get instant corrections on your form to prevent injury and maximize results.
                        {'\n'}
                        • <Text style={styles.bold}>Smart Rep Counting</Text>: Never lose count again. We track every rep for you.
                        {'\n'}
                        • <Text style={styles.bold}>Personalized Plans</Text>: Workouts that adapt to your fitness level and goals.
                    </Text>

                    <Text style={styles.sectionTitle}>Privacy First</Text>
                    <Text style={styles.text}>
                        We built FIZI with privacy at its core. All camera processing happens ephemerally. We never record or store video of your workouts. Your personal space remains private.
                    </Text>

                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <Text style={styles.text}>
                        We'd love to hear from you! Whether you have feedback, questions, or just want to say hi.
                        {'\n\n'}
                        Email: <Text style={styles.link}>fizi.fitnessgenie@gmail.com</Text>
                    </Text>

                    <View style={styles.versionContainer}>
                        <Text style={styles.versionText}>Version 1.0.0</Text>
                        <Text style={styles.copyrightText}>© 2025 FIZI Fitness</Text>
                    </View>
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: Spacing.l,
        marginTop: Spacing.s,
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.primaryStart,
        letterSpacing: 2,
    },
    appTagline: {
        color: colors.textSecondary,
        fontSize: 14,
        marginTop: 4,
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
    },
    link: {
        color: colors.primaryStart,
        textDecorationLine: 'underline',
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: Spacing.xl,
        paddingTop: Spacing.l,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    versionText: {
        color: colors.textTertiary,
        fontSize: 12,
        marginBottom: 4,
    },
    copyrightText: {
        color: colors.textTertiary,
        fontSize: 12,
    },
});
