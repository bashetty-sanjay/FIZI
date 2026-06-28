import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { getCommunityUserProfile, toggleFollow, isFollowing } from '../services/firestoreCommunity';
import { loadUserProfilePosts } from '../../store/slices/communitySlice';
import { CommunityUserProfile } from '../types';
import { ImageGrid } from '../components/ImageGrid';
import { Layout, Spacing } from '../../theme/Theme';

export const UserProfile: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { profilePosts, profilePostsLoading } = useAppSelector((state) => state.community);
  
  // If no userId passed, default to current user
  const targetUserId = route?.params?.userId || user?.uid;
  const isCurrentUser = user?.uid === targetUserId;

  const [profile, setProfile] = useState<CommunityUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followingState, setFollowingState] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  useEffect(() => {
    if (targetUserId) {
      loadProfileData();
      dispatch(loadUserProfilePosts(targetUserId));
    }
  }, [targetUserId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const data = await getCommunityUserProfile(targetUserId);
      setProfile(data);
      if (!isCurrentUser && user?.uid) {
        const following = await isFollowing(user.uid, targetUserId);
        setFollowingState(following);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user?.uid || isCurrentUser) return;
    setIsTogglingFollow(true);
    try {
      const newState = await toggleFollow(user.uid, targetUserId);
      setFollowingState(newState);
      if (profile) {
        setProfile({
          ...profile,
          followersCount: newState ? profile.followersCount + 1 : Math.max(0, profile.followersCount - 1),
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const renderHeader = () => {
    if (!profile) return null;
    return (
      <View style={styles.headerContainer}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {!isCurrentUser && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.username, { color: colors.textPrimary, marginLeft: isCurrentUser ? Spacing.m : 0 }]}>
            {profile.username}
          </Text>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          {profile.profileImage ? (
            <Image source={{ uri: profile.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.glassHighlight }]}>
              <MaterialCommunityIcons name="account" size={40} color={colors.textSecondary} />
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{profile.postsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{profile.followersCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{profile.followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioContainer}>
          <Text style={[styles.displayName, { color: colors.textPrimary }]}>{profile.displayName}</Text>
          {!!profile.bio && <Text style={[styles.bio, { color: colors.textPrimary }]}>{profile.bio}</Text>}
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {isCurrentUser ? (
            <TouchableOpacity 
              style={[styles.editButton, { borderColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}
              onPress={() => navigation.navigate('ProfileSetup')}
            >
              <Text style={[styles.editButtonText, { color: colors.textPrimary }]}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.followButton, 
                { backgroundColor: followingState ? colors.glassSurface : colors.primaryStart },
                followingState && { borderWidth: 1, borderColor: colors.glassBorder }
              ]}
              onPress={handleFollowToggle}
              disabled={isTogglingFollow}
            >
              <Text style={[
                styles.followButtonText, 
                { color: followingState ? colors.textPrimary : '#FFF' }
              ]}>
                {followingState ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const onRefresh = React.useCallback(() => {
    if (targetUserId) {
      loadProfileData();
      dispatch(loadUserProfilePosts(targetUserId));
    }
  }, [targetUserId, dispatch]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.backgroundDark }]}>
        <ActivityIndicator color={colors.primaryStart} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDark }]}>
      <ImageGrid
        posts={profilePosts}
        ListHeaderComponent={renderHeader() || undefined}
        onPostPress={(post) => navigation.navigate('PostDetails', { post })}
        refreshing={profilePostsLoading}
        onRefresh={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingBottom: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    paddingTop: 50,
  },
  backButton: {
    marginRight: Spacing.m,
  },
  username: {
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    marginTop: Spacing.s,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: Spacing.m,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
  },
  bioContainer: {
    paddingHorizontal: Spacing.m,
    marginTop: Spacing.m,
  },
  displayName: {
    fontWeight: '700',
    fontSize: 14,
  },
  bio: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: Spacing.m,
    marginTop: Spacing.l,
  },
  editButton: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  editButtonText: {
    fontWeight: '700',
  },
  followButton: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  followButtonText: {
    fontWeight: '700',
  },
});
