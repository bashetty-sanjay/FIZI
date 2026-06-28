import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, Layout, ThemeColorsType } from '../theme/Theme';
import { useTheme } from '../hooks/useTheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQScreenProps {
    navigation: any;
}

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

const FAQS: FAQItem[] = [
    {
        id: '1',
        question: 'What is FIZI?',
        answer: 'FIZI is your personal AI fitness trainer. It uses your device\'s camera to provide real-time feedback on your form, count your reps, and create personalized workout plans tailored to your goals.'
    },
    {
        id: '2',
        question: 'Do I need equipment to use FIZI?',
        answer: 'No! FIZI supports bodyweight-only workouts. However, if you have equipment like dumbbells or resistance bands, you can add them to your profile, and FIZI will include exercises that use them.'
    },
    {
        id: '3',
        question: 'Is my data private?',
        answer: 'Absolutely. FIZI processes your movement data locally on your device in real-time. We do not record or store video of your workouts. Your privacy is our top priority.'
    },
    {
        id: '4',
        question: 'Can I use FIZI offline?',
        answer: 'While some features require an internet connection (like generating new AI plans), you can access your downloaded workouts and practice exercises offline.'
    },
    {
        id: '5',
        question: 'How do I change my fitness goal?',
        answer: 'You can update your fitness goal at any time by going to your Profile, tapping "Edit" in the personal details section, and selecting a new Primary Goal.'
    },
    {
        id: '6',
        question: 'Is FIZI free?',
        answer: 'FIZI offers a comprehensive free tier. We are constantly adding new features to help you reach your fitness goals.'
    }
];

export default function FAQScreen({ navigation }: FAQScreenProps) {
    const { colors, gradients, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.introText}>
                    Find answers to common questions about FIZI and how to get the most out of your workouts.
                </Text>

                <View style={styles.listContainer}>
                    {FAQS.map((faq) => {
                        const isExpanded = expandedId === faq.id;
                        return (
                            <BlurView
                                key={faq.id}
                                intensity={isExpanded ? 30 : 20}
                                tint={isDark ? "light" : "dark"}
                                style={[styles.card, isExpanded && styles.cardActive]}
                            >
                                <TouchableOpacity
                                    style={styles.questionHeader}
                                    onPress={() => toggleExpand(faq.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.questionText, isExpanded && { color: colors.primaryStart }]}>{faq.question}</Text>
                                    <MaterialCommunityIcons
                                        name={isExpanded ? "chevron-up" : "chevron-down"}
                                        size={24}
                                        color={isExpanded ? colors.primaryStart : colors.textTertiary}
                                    />
                                </TouchableOpacity>
                                {isExpanded && (
                                    <View style={styles.answerContainer}>
                                        <Text style={styles.answerText}>{faq.answer}</Text>
                                    </View>
                                )}
                            </BlurView>
                        );
                    })}
                </View>

                <View style={styles.contactContainer}>
                    <Text style={styles.contactText}>Still have questions?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('AboutUs')}>
                        <Text style={styles.contactLink}>Contact Support</Text>
                    </TouchableOpacity>
                </View>

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
    introText: {
        color: colors.textSecondary,
        marginBottom: Spacing.l,
        fontSize: 14,
        paddingHorizontal: Spacing.s,
    },
    listContainer: {
        gap: Spacing.m,
    },
    card: {
        borderRadius: Layout.borderRadius.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    cardActive: {
        borderColor: colors.primaryStart + '80', // semi-transparent primary
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.m,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        flex: 1,
        marginRight: Spacing.s,
    },
    answerContainer: {
        paddingHorizontal: Spacing.m,
        paddingBottom: Spacing.m,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: Spacing.s,
    },
    answerText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    contactContainer: {
        marginTop: Spacing.xl,
        alignItems: 'center',
        gap: 8,
    },
    contactText: {
        color: colors.textTertiary,
    },
    contactLink: {
        color: colors.primaryStart,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
