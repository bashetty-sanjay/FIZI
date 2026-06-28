import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { fetchWorkoutHistory } from '../../store/slices/workoutSlice';

const MOCK = {
    bgElevated: '#14161D',
    border: 'rgba(255, 255, 255, 0.06)',
    textTertiary: '#5C6170',
    accent: '#B8FF3C',
};

// Size of each square
const SQUARE_SIZE = 12;
const GAP = 4;

export default function StreakGraph() {
    const { history } = useAppSelector((state) => state.workout);
    const dispatch = useAppDispatch();
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Fetch a large history if empty so the year graph can populate
        if (history.length === 0) {
            dispatch(fetchWorkoutHistory(365));
        }
    }, [dispatch, history.length]);

    // Create a map of YYYY-MM-DD to boolean
    const workoutDays = useMemo(() => {
        const days = new Set<string>();
        history.forEach(session => {
            let d: Date | null = null;
            if (session.createdAt) {
                if (typeof (session.createdAt as any).toDate === 'function') {
                    d = (session.createdAt as any).toDate();
                } else {
                    d = new Date(session.createdAt);
                }
                if (d && !isNaN(d.getTime())) {
                    // Local timezone YYYY-MM-DD
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    days.add(`${year}-${month}-${day}`);
                }
            }
        });
        return days;
    }, [history]);

    // Generate grid (weeks and days) and months labels
    const { grid, months, totalWorkouts } = useMemo(() => {
        const weeks = [];
        const monthsList: { label: string, weekIndex: number }[] = [];
        let currentMonth = -1;
        let activeCount = 0;

        const today = new Date();
        
        // Go back 52 weeks
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (52 * 7));
        
        // Adjust start date to Sunday
        startDate.setDate(startDate.getDate() - startDate.getDay());

        let currentDate = new Date(startDate);
        
        while (currentDate <= today) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                if (currentDate > today) break;
                
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                const isActive = workoutDays.has(dateStr);
                if (isActive) activeCount++;

                week.push({
                    date: dateStr,
                    active: isActive
                });

                // Month logic
                if (currentDate.getDate() === 1 || (weeks.length === 0 && i === 0)) {
                    if (currentMonth !== currentDate.getMonth()) {
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        monthsList.push({ label: monthNames[currentDate.getMonth()], weekIndex: weeks.length });
                        currentMonth = currentDate.getMonth();
                    }
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }
            if (week.length > 0) weeks.push(week);
        }
        return { grid: weeks, months: monthsList, totalWorkouts: activeCount };
    }, [workoutDays]);

    // Auto-scroll to the end when rendered
    useEffect(() => {
        if (scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 100);
        }
    }, [grid]);

    const { width: windowWidth } = useWindowDimensions();
    // width = windowWidth - (12*2 margin) - (12 paddingLeft) - (26 dayLabels + 4 gap) = windowWidth - 66
    const scrollViewWidth = windowWidth - 66;

    return (
        <View style={styles.container}>
            <View style={styles.graphCard}>
                <View style={styles.graphWrapper}>
                    <View style={styles.dayLabels}>
                        {/* +20 offset for the months row height */}
                        <Text style={[styles.dayLabel, { top: 20 + (SQUARE_SIZE + GAP) * 1 }]}>Mon</Text>
                        <Text style={[styles.dayLabel, { top: 20 + (SQUARE_SIZE + GAP) * 3 }]}>Wed</Text>
                        <Text style={[styles.dayLabel, { top: 20 + (SQUARE_SIZE + GAP) * 5 }]}>Fri</Text>
                    </View>
                    <ScrollView 
                        ref={scrollViewRef}
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={{ width: scrollViewWidth }}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={{ flexDirection: 'column', width: grid.length * (SQUARE_SIZE + GAP) }}>
                            {/* Months Row */}
                            <View style={styles.monthsRow}>
                                {months.map((m, i) => (
                                    <Text key={i} style={[styles.monthLabel, { left: m.weekIndex * (SQUARE_SIZE + GAP) }]}>
                                        {m.label}
                                    </Text>
                                ))}
                            </View>

                            {/* Grid Row */}
                            <View style={{ flexDirection: 'row' }}>
                                {grid.map((week, wIndex) => (
                                    <View key={wIndex} style={styles.weekColumn}>
                                        {week.map((day) => (
                                            <View 
                                                key={day.date} 
                                                style={[
                                                    styles.square, 
                                                    day.active ? styles.activeSquare : styles.inactiveSquare
                                                ]} 
                                            />
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Legend */}
                <View style={styles.legendContainer}>
                    <Text style={styles.legendText}>Less</Text>
                    <View style={[styles.square, styles.inactiveSquare]} />
                    <View style={[styles.square, { backgroundColor: 'rgba(184, 255, 60, 0.4)' }]} />
                    <View style={[styles.square, { backgroundColor: 'rgba(184, 255, 60, 0.7)' }]} />
                    <View style={[styles.square, { backgroundColor: '#B8FF3C' }]} />
                    <Text style={styles.legendText}>More</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 24,
    },
    sectionHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitleSm: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    graphCard: {
        backgroundColor: '#1A1D26',
        marginHorizontal: 12,
        paddingVertical: 16,
        paddingLeft: 12,
        paddingRight: 0,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: MOCK.border,
    },
    graphWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dayLabels: {
        width: 26,
        height: 20 + (SQUARE_SIZE * 7) + (GAP * 6),
        marginRight: 4,
        position: 'relative',
    },
    dayLabel: {
        fontSize: 10,
        color: MOCK.textTertiary,
        position: 'absolute',
        lineHeight: SQUARE_SIZE,
        right: 0,
    },
    scrollContent: {
        paddingRight: 20,
    },
    monthsRow: {
        height: 20,
        position: 'relative',
        width: '100%',
    },
    monthLabel: {
        fontSize: 10,
        color: MOCK.textTertiary,
        position: 'absolute',
        bottom: 6,
    },
    weekColumn: {
        flexDirection: 'column',
        marginRight: GAP,
        gap: GAP,
    },
    square: {
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        borderRadius: 2,
    },
    activeSquare: {
        backgroundColor: MOCK.accent,
        shadowColor: MOCK.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    },
    inactiveSquare: {
        backgroundColor: MOCK.bgElevated,
    },
    legendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 20,
        marginTop: 12,
        gap: 4,
    },
    legendText: {
        fontSize: 10,
        color: MOCK.textTertiary,
        marginHorizontal: 4,
    }
});
