/**
 * TeamSection
 *
 * Renders a full screen Modal when triggered, showing "Added Friends" and "App Friends" tabs.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Image,
    Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { friendService, FriendProfile } from '../../services/FriendService';
import { useToast } from '../../context/ToastContext';

interface TeamSectionProps {
    userId?: string;
    visible?: boolean;
    onClose?: () => void;
}

export default function TeamSection({ userId, visible = false, onClose }: TeamSectionProps) {
    const { colors, isDark } = useTheme();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'added' | 'app'>('added');
    
    // Friends list state
    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [currentUser, setCurrentUser] = useState<FriendProfile | null>(null);
    const [loadingFriends, setLoadingFriends] = useState(false);

    // Friend Profile view (when tapping on a friend in 'added' tab)
    const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);

    // App Friends state (suggestions & search)
    const [suggestedFriends, setSuggestedFriends] = useState<FriendProfile[]>([]);
    const [loadingSuggested, setLoadingSuggested] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundUser, setFoundUser] = useState<FriendProfile | null>(null);
    const [searchError, setSearchError] = useState('');
    const [adding, setAdding] = useState(false);

    const loadFriends = useCallback(async () => {
        if (!userId) return;
        setLoadingFriends(true);
        
        // Fetch current user and their friends list in parallel
        const [me, list] = await Promise.all([
            friendService.getCurrentUserProfile(userId),
            friendService.getFriends(userId)
        ]);
        
        setCurrentUser(me);
        setFriends(list);
        setLoadingFriends(false);
    }, [userId]);

    const loadSuggested = useCallback(async () => {
        if (!userId) return;
        setLoadingSuggested(true);
        const list = await friendService.getSuggestedFriends(userId, 20);
        setSuggestedFriends(list);
        setLoadingSuggested(false);
    }, [userId]);

    useEffect(() => {
        if (visible) {
            loadFriends();
            setActiveTab('added');
            setSelectedFriend(null);
            setFoundUser(null);
            setSearchEmail('');
            setSearchError('');
        }
    }, [visible, loadFriends]);

    useEffect(() => {
        if (visible && activeTab === 'app' && suggestedFriends.length === 0) {
            loadSuggested();
        }
    }, [activeTab, visible, suggestedFriends.length, loadSuggested]);

    const handleSearch = async () => {
        if (!searchEmail.trim()) {
            setSearchError('Please enter an email address.');
            return;
        }
        setSearching(true);
        setFoundUser(null);
        setSearchError('');

        const result = await friendService.searchUserByEmail(searchEmail.trim());

        if (!result) {
            setSearchError('No FIZI account found with that email.');
        } else if (result.uid === userId) {
            setSearchError("That's your own account!");
        } else if (friends.some((f) => f.uid === result.uid)) {
            setSearchError('This person is already in your team.');
        } else {
            setFoundUser(result);
        }
        setSearching(false);
    };

    const handleAddFriend = async (userToAdd: FriendProfile) => {
        if (!userId || !userToAdd) return;
        setAdding(true);
        try {
            await friendService.addFriend(userId, userToAdd);
            showToast(`${userToAdd.displayName} added to your team! 🎉`, 'success');
            await loadFriends();
            
            // Remove from suggested if it was there
            setSuggestedFriends(prev => prev.filter(f => f.uid !== userToAdd.uid));
            setFoundUser(null);
            setSearchEmail('');
            
            // Switch back to added friends tab
            setActiveTab('added');
        } catch {
            showToast('Failed to add friend. Please try again.', 'error');
        }
        setAdding(false);
    };

    const handleRemoveFriend = async (friend: FriendProfile) => {
        if (!userId) return;
        try {
            await friendService.removeFriend(userId, friend.uid);
            showToast(`${friend.displayName} removed from your team.`, 'info');
            setFriends((prev) => prev.filter((f) => f.uid !== friend.uid));
            setSelectedFriend(null);
            
            // Reload suggested to potentially include them again
            loadSuggested();
        } catch {
            showToast('Failed to remove friend.', 'error');
        }
    };

    const handleClose = () => {
        if (onClose) onClose();
    };

    const styles = createStyles(colors, isDark);

    if (!visible) return null;

    // Sub-renderers
    const renderAddedFriends = () => {
        // Merge current user into the participants list
        const allParticipants: (FriendProfile & { isMe?: boolean })[] = currentUser
            ? [
                  ...friends.filter(f => f.uid !== currentUser.uid),
                  { ...currentUser, isMe: true },
              ]
            : [...friends];

        if (loadingFriends) {
            return (
                <View style={styles.tabContent}>
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="small" color={colors.primaryStart} />
                    </View>
                </View>
            );
        }

        if (allParticipants.length === 0) {
            return (
                <View style={styles.tabContent}>
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.textTertiary} />
                        <Text style={styles.emptyTitle}>No teammates yet</Text>
                        <Text style={styles.emptySubtitle}>Find your friends in the App Friends tab and stay motivated together!</Text>
                    </View>
                </View>
            );
        }

        const sorted = [...allParticipants].sort((a, b) => {
            const workoutDiff = (b.totalWorkouts ?? 0) - (a.totalWorkouts ?? 0);
            if (workoutDiff !== 0) return workoutDiff;
            return (b.level ?? 1) - (a.level ?? 1);
        });

        const renderAvatar = (
            person: FriendProfile & { isMe?: boolean },
            size: number,
            accentColor?: string
        ) => {
            const radius = size / 2;
            if (person.photoURL) {
                return <Image source={{ uri: person.photoURL }} style={{ width: size, height: size, borderRadius: radius }} />;
            }
            return (
                <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: (accentColor ?? colors.primaryStart) + '40', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: accentColor ?? colors.primaryStart, fontWeight: '800', fontSize: size * 0.38 }}>
                        {(person.displayName || '?')[0].toUpperCase()}
                    </Text>
                </View>
            );
        };

        const renderPodiumCard = (
            person: FriendProfile & { isMe?: boolean },
            medal: string,
            cardStyle: object,
            accentColor: string,
            isFirst: boolean
        ) => (
            <TouchableOpacity
                key={person.uid}
                style={[styles.podiumCard, cardStyle, person.isMe && styles.podiumCardMe]}
                onPress={() => !person.isMe && setSelectedFriend(person)}
                activeOpacity={person.isMe ? 1 : 0.8}
            >
                <Text style={[styles.podiumMedal, isFirst && { fontSize: 30 }]}>{medal}</Text>
                {renderAvatar(person, isFirst ? 58 : 46, accentColor)}
                {person.isMe && (
                    <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                    </View>
                )}
                <Text style={[styles.podiumName, isFirst && { color: accentColor, fontSize: 15 }]} numberOfLines={1}>
                    {person.displayName}
                </Text>
                <Text style={styles.podiumWorkouts}>{person.totalWorkouts ?? 0} workouts</Text>
                <Text style={styles.podiumLevel}>Lv.{person.level ?? 1}</Text>
            </TouchableOpacity>
        );

        return (
            <View style={styles.tabContent}>
                {/* Leaderboard header */}
                <View style={styles.rankHeader}>
                    <Text style={styles.rankHeaderText}>🏆 Leaderboard</Text>
                    <Text style={styles.rankHeaderSub}>{allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''}</Text>
                </View>

                {/* Podium — top 3 */}
                <View style={styles.podiumRow}>
                    {/* 2nd place left */}
                    {sorted[1]
                        ? renderPodiumCard(sorted[1], '🥈', styles.podiumCardSilver, '#C0C0C0', false)
                        : <View style={{ flex: 1 }} />}
                    {/* 1st place center */}
                    {renderPodiumCard(sorted[0], '🥇', styles.podiumCardGold, '#FFD700', true)}
                    {/* 3rd place right */}
                    {sorted[2]
                        ? renderPodiumCard(sorted[2], '🥉', styles.podiumCardBronze, '#CD7F32', false)
                        : <View style={{ flex: 1 }} />}
                </View>

                {/* Ranks 4+ */}
                {sorted.length > 3 && (
                    <View style={styles.rankList}>
                        {sorted.slice(3).map((person, i) => (
                            <TouchableOpacity
                                key={person.uid}
                                style={[
                                    styles.rankRow,
                                    i < sorted.length - 4 && styles.rankRowBorder,
                                    person.isMe && styles.rankRowMe,
                                ]}
                                onPress={() => !person.isMe && setSelectedFriend(person)}
                                activeOpacity={person.isMe ? 1 : 0.75}
                            >
                                <Text style={styles.rankNumber}>#{i + 4}</Text>
                                {renderAvatar(person, 44)}
                                <View style={styles.friendInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.friendName} numberOfLines={1}>{person.displayName}</Text>
                                        {person.isMe && (
                                            <View style={styles.youBadge}>
                                                <Text style={styles.youBadgeText}>YOU</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.friendMeta}>Lv.{person.level ?? 1} · {person.totalWorkouts ?? 0} workouts</Text>
                                </View>
                                {!person.isMe && <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderAppFriends = () => (
        <View style={styles.tabContent}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={colors.textTertiary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="friend@email.com"
                        placeholderTextColor={colors.textTertiary}
                        value={searchEmail}
                        onChangeText={(t) => {
                            setSearchEmail(t);
                            setSearchError('');
                            setFoundUser(null);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                    />
                    {searchEmail.length > 0 && (
                        <TouchableOpacity onPress={handleSearch} disabled={searching} style={{ padding: 4 }}>
                            {searching ? <ActivityIndicator size="small" color={colors.primaryStart} /> : <MaterialCommunityIcons name="magnify" size={24} color={colors.primaryStart} />}
                        </TouchableOpacity>
                    )}
                </View>
                {!!searchError && (
                    <View style={styles.errorBanner}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.accentError} />
                        <Text style={[styles.errorText, { color: colors.accentError }]}>{searchError}</Text>
                    </View>
                )}
            </View>

            {/* Found User / Suggestions */}
            {foundUser ? (
                <View style={styles.foundUserCard}>
                    {foundUser.photoURL ? (
                        <Image source={{ uri: foundUser.photoURL }} style={styles.foundAvatar} />
                    ) : (
                        <View style={[styles.foundAvatar, styles.avatarPlaceholder]}>
                            <Text style={[styles.avatarInitial, { fontSize: 20 }]}>{(foundUser.displayName || '?')[0].toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.foundUserName}>{foundUser.displayName}</Text>
                        <Text style={styles.foundUserMeta}>{foundUser.email}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addBtnSmall}
                        onPress={() => handleAddFriend(foundUser)}
                        disabled={adding}
                    >
                        {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnSmallText}>Add</Text>}
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.suggestionsContainer}>
                    <Text style={styles.sectionHeading}>Suggested FIZI Users</Text>
                    {loadingSuggested ? (
                        <ActivityIndicator style={{ marginTop: 20 }} size="small" color={colors.primaryStart} />
                    ) : suggestedFriends.length === 0 ? (
                        <Text style={styles.noSuggestionsText}>No suggestions available at the moment.</Text>
                    ) : (
                        <View style={styles.friendsList}>
                            {suggestedFriends.map((friend, index) => (
                                <View key={friend.uid} style={[styles.friendRow, index < suggestedFriends.length - 1 && styles.friendRowBorder]}>
                                    {friend.photoURL ? (
                                        <Image source={{ uri: friend.photoURL }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                            <Text style={styles.avatarInitial}>{(friend.displayName || '?')[0].toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <View style={styles.friendInfo}>
                                        <Text style={styles.friendName} numberOfLines={1}>{friend.displayName}</Text>
                                        <Text style={styles.friendMeta}>Lv.{friend.level ?? 1} · {friend.totalWorkouts ?? 0} workouts</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.addBtnIcon}
                                        onPress={() => handleAddFriend(friend)}
                                        disabled={adding}
                                    >
                                        <MaterialCommunityIcons name="account-plus-outline" size={18} color={colors.primaryStart} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    const renderSelectedFriend = () => {
        if (!selectedFriend) return null;
        return (
            <View style={styles.profileView}>
                <TouchableOpacity style={styles.backToTeamBtn} onPress={() => setSelectedFriend(null)}>
                    <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textSecondary} />
                    <Text style={styles.backToTeamText}>Back to Team</Text>
                </TouchableOpacity>

                <View style={styles.profileHero}>
                    {selectedFriend.photoURL ? (
                        <Image source={{ uri: selectedFriend.photoURL }} style={styles.profileAvatar} />
                    ) : (
                        <LinearGradient colors={[colors.primaryStart + '50', colors.primaryEnd + '30']} style={styles.profileAvatar}>
                            <Text style={styles.profileInitial}>{(selectedFriend.displayName || '?')[0].toUpperCase()}</Text>
                        </LinearGradient>
                    )}
                    <Text style={styles.profileName}>{selectedFriend.displayName}</Text>
                    <Text style={styles.profileEmail}>{selectedFriend.email}</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <LinearGradient colors={[colors.primaryStart + '28', colors.primaryStart + '08']} style={styles.statBoxInner}>
                            <MaterialCommunityIcons name="shield-star-outline" size={22} color={colors.primaryStart} />
                            <Text style={[styles.statValue, { color: colors.primaryStart }]}>{selectedFriend.level ?? 1}</Text>
                            <Text style={styles.statLabel}>Level</Text>
                        </LinearGradient>
                    </View>
                    <View style={styles.statBox}>
                        <LinearGradient colors={[colors.accentCyan + '28', colors.accentCyan + '08']} style={styles.statBoxInner}>
                            <MaterialCommunityIcons name="dumbbell" size={22} color={colors.accentCyan} />
                            <Text style={[styles.statValue, { color: colors.accentCyan }]}>{selectedFriend.totalWorkouts ?? 0}</Text>
                            <Text style={styles.statLabel}>Workouts</Text>
                        </LinearGradient>
                    </View>
                    <View style={styles.statBox}>
                        <LinearGradient colors={[colors.accentSuccess + '28', colors.accentSuccess + '08']} style={styles.statBoxInner}>
                            <MaterialCommunityIcons name="fire" size={22} color={colors.accentSuccess} />
                            <Text style={[styles.statValue, { color: colors.accentSuccess }]}>FIZI</Text>
                            <Text style={styles.statLabel}>Member</Text>
                        </LinearGradient>
                    </View>
                </View>

                {selectedFriend.addedAt && (
                    <Text style={styles.addedOn}>
                        Teammates since {new Date(selectedFriend.addedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                )}

                <TouchableOpacity style={styles.removeFromTeamBtn} onPress={() => handleRemoveFriend(selectedFriend)} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="account-remove-outline" size={18} color={colors.accentError} />
                    <Text style={[styles.removeFromTeamText, { color: colors.accentError }]}>Remove from Team</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>My Team</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                            <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {selectedFriend ? (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {renderSelectedFriend()}
                        </ScrollView>
                    ) : (
                        <>
                            {/* Segmented Control / Tabs */}
                            <View style={styles.tabBar}>
                                <TouchableOpacity 
                                    style={[styles.tab, activeTab === 'added' && styles.activeTab]} 
                                    onPress={() => setActiveTab('added')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.tabText, activeTab === 'added' && styles.activeTabText]}>Added Friends</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.tab, activeTab === 'app' && styles.activeTab]} 
                                    onPress={() => setActiveTab('app')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.tabText, activeTab === 'app' && styles.activeTabText]}>App Friends</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {activeTab === 'added' ? renderAddedFriends() : renderAppFriends()}
                                <View style={{height: 40}} />
                            </ScrollView>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 24,
        paddingHorizontal: 20,
        height: '88%',
        overflow: 'hidden',
        backgroundColor: colors.backgroundDark,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: {
        color: colors.textPrimary,
        fontSize: 22,
        fontWeight: '800',
    },
    closeBtn: {
        padding: 4,
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        borderRadius: 20,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textTertiary,
    },
    activeTabText: {
        color: colors.textPrimary,
        fontWeight: '700',
    },
    tabContent: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        color: colors.textSecondary,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        color: colors.textTertiary,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    friendsList: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    friendRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        backgroundColor: colors.primaryStart + '30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: colors.primaryStart,
        fontWeight: '800',
        fontSize: 18,
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        color: colors.textPrimary,
        fontWeight: '700',
        fontSize: 15,
    },
    friendMeta: {
        color: colors.textTertiary,
        fontSize: 13,
        marginTop: 2,
    },
    rankHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    rankHeaderText: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    rankHeaderSub: {
        color: colors.textTertiary,
        fontSize: 13,
        fontWeight: '500',
    },
    podiumRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 20,
    },
    podiumCard: {
        flex: 1,
        alignItems: 'center',
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 8,
        gap: 6,
    },
    podiumCardGold: {
        backgroundColor: isDark ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 215, 0, 0.15)',
        borderWidth: 1,
        borderColor: '#FFD700' + '50',
        paddingVertical: 22,
    },
    podiumCardSilver: {
        backgroundColor: isDark ? 'rgba(192, 192, 192, 0.1)' : 'rgba(192, 192, 192, 0.15)',
        borderWidth: 1,
        borderColor: '#C0C0C0' + '50',
    },
    podiumCardBronze: {
        backgroundColor: isDark ? 'rgba(205, 127, 50, 0.1)' : 'rgba(205, 127, 50, 0.15)',
        borderWidth: 1,
        borderColor: '#CD7F32' + '50',
    },
    podiumMedal: {
        fontSize: 22,
    },
    podiumAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
    },
    podiumAvatarLarge: {
        width: 58,
        height: 58,
        borderRadius: 29,
    },
    podiumInitial: {
        fontWeight: '800',
        fontSize: 18,
    },
    podiumName: {
        color: colors.textPrimary,
        fontWeight: '700',
        fontSize: 13,
        textAlign: 'center',
    },
    podiumWorkouts: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    podiumLevel: {
        color: colors.textTertiary,
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    rankList: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 8,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    rankRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    },
    rankRowMe: {
        backgroundColor: colors.primaryStart + '15',
        borderRadius: 12,
    },
    podiumCardMe: {
        borderColor: colors.primaryStart + '80',
        borderWidth: 2,
    },
    rankNumber: {
        color: colors.textTertiary,
        fontWeight: '700',
        fontSize: 14,
        width: 28,
        textAlign: 'center',
    },
    searchContainer: {
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    input: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 15,
        paddingVertical: 12,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    errorText: {
        fontSize: 13,
        fontWeight: '500',
    },
    foundUserCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.primaryStart + '15',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.primaryStart + '40',
    },
    foundAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    foundUserName: {
        color: colors.textPrimary,
        fontWeight: '800',
        fontSize: 16,
    },
    foundUserMeta: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    addBtnSmall: {
        backgroundColor: colors.primaryStart,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    addBtnSmallText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    suggestionsContainer: {
        marginTop: 10,
    },
    sectionHeading: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    noSuggestionsText: {
        color: colors.textTertiary,
        fontSize: 14,
        fontStyle: 'italic',
        marginLeft: 4,
    },
    addBtnIcon: {
        padding: 8,
        backgroundColor: colors.primaryStart + '15',
        borderRadius: 12,
    },
    profileView: {
        paddingBottom: 40,
    },
    backToTeamBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
        paddingVertical: 4,
    },
    backToTeamText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    profileHero: {
        alignItems: 'center',
        paddingVertical: 10,
        gap: 8,
    },
    profileAvatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    profileInitial: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 36,
    },
    profileName: {
        color: colors.textPrimary,
        fontWeight: '800',
        fontSize: 24,
    },
    profileEmail: {
        color: colors.textTertiary,
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 24,
    },
    statBox: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    statBoxInner: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        gap: 6,
    },
    statValue: {
        fontWeight: '800',
        fontSize: 20,
    },
    statLabel: {
        color: colors.textTertiary,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addedOn: {
        color: colors.textTertiary,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        fontStyle: 'italic',
    },
    removeFromTeamBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.accentError + '40',
        backgroundColor: colors.accentError + '10',
    },
    removeFromTeamText: {
        fontWeight: '700',
        fontSize: 15,
    },
    youBadge: {
        backgroundColor: colors.primaryStart + '25',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    youBadgeText: {
        color: colors.primaryStart,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
