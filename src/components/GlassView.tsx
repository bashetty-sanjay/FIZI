import React from 'react';
import { ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';
import { Layout } from '../theme/Theme';

interface GlassViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
}

export const GlassView: React.FC<GlassViewProps> = ({
    children,
    style,
    intensity = 20,
    tint,
}) => {
    const { colors, isDark } = useTheme();

    return (
        <BlurView
            intensity={intensity}
            tint={tint || (isDark ? 'dark' : 'light')}
            style={[
                styles.container,
                {
                    borderColor: colors.glassBorder,
                },
                style
            ]}
        >
            {children}
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: Layout.borderRadius.l,
        borderWidth: 1,
        overflow: 'hidden',
    }
});
