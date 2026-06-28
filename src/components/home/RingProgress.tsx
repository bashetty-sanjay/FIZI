import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface RingProgressProps {
    size: number;
    strokeWidth: number;
    progress: number; // 0-1
    color: string;
    trackColor?: string;
    children?: React.ReactNode;
    /** Render a small dot at the head of the progress arc (like the home screen ring). */
    showHeadDot?: boolean;
    headDotColor?: string;
}

export const RingProgress: React.FC<RingProgressProps> = ({
    size,
    strokeWidth,
    progress,
    color,
    trackColor = 'rgba(255,255,255,0.06)',
    children,
    showHeadDot = false,
    headDotColor,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(1, progress));
    const dashOffset = circumference * (1 - clamped);
    const cx = size / 2;
    const cy = size / 2;

    let dotX: number | null = null;
    let dotY: number | null = null;
    if (showHeadDot) {
        const angle = -Math.PI / 2 + clamped * 2 * Math.PI;
        dotX = cx + radius * Math.cos(angle);
        dotY = cy + radius * Math.sin(angle);
    }

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                <Circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${cx} ${cy})`}
                />
                {showHeadDot && dotX !== null && dotY !== null && (
                    <Circle
                        cx={dotX}
                        cy={dotY}
                        r={strokeWidth * 0.7}
                        fill={headDotColor || color}
                    />
                )}
            </Svg>
            {children}
        </View>
    );
};
