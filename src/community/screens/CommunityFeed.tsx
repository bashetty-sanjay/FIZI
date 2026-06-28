import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { loadFeedPosts, loadMoreFeedPosts, likePost } from '../../store/slices/communitySlice';
import { PostCard } from '../components/PostCard';
import { PostOptionsModal } from '../components/PostOptionsModal';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { CommunityPost } from '../types';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Layout } from '../../theme/Theme';

interface CommunityFeedProps {
  navigation: any;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { feedPosts, feedLoading, feedRefreshing, hasMore, lastDocSerialized } = useAppSelector((state) => state.community);

  const [activeOptionsPost, setActiveOptionsPost] = useState<CommunityPost | null>(null);

  useEffect(() => {
    if (user?.uid && feedPosts.length === 0) {
      dispatch(loadFeedPosts({ refresh: false, currentUserId: user.uid }));
    }
  }, [user?.uid, dispatch, feedPosts.length]);

  const onRefresh = useCallback(() => {
    if (user?.uid) {
      dispatch(loadFeedPosts({ refresh: true, currentUserId: user.uid }));
    }
  }, [user?.uid, dispatch]);

  const handleLoadMore = () => {
    if (hasMore && !feedLoading && lastDocSerialized && user?.uid) {
      // Load more logic
    }
  };

  const handleLike = useCallback((postId: string) => {
    if (user?.uid) {
      dispatch(likePost({ postId, userId: user.uid }));
    }
  }, [user?.uid, dispatch]);

  const handleUserPress = (userId: string) => {
    // navigation.navigate('UserProfile', { userId });
  };

  const handleMenuPress = (post: CommunityPost) => {
    setActiveOptionsPost(post);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Community</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('SearchUsers')}>
          <MaterialCommunityIcons name="magnify" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
          <MaterialCommunityIcons name="bell-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('CreatePost')}>
          <MaterialCommunityIcons name="plus-box-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (feedLoading) {
      return (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <SkeletonLoader width={36} height={36} borderRadius={18} />
                <SkeletonLoader width={120} height={20} style={{ marginLeft: 10 }} />
              </View>
              <SkeletonLoader width="100%" height={400} borderRadius={0} />
            </View>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="camera-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts yet.</Text>
        <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Follow users to see their posts here!</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.backgroundLight }]}>
      {renderHeader()}
      
      <FlatList
        data={feedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onUserPress={handleUserPress}
            onMenuPress={handleMenuPress}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={feedRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryStart}
            colors={[colors.primaryStart]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          hasMore && feedPosts.length > 0 ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.primaryStart} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />



      <PostOptionsModal
        visible={!!activeOptionsPost}
        post={activeOptionsPost}
        onClose={() => setActiveOptionsPost(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    paddingTop: Platform.OS === 'ios' ? 50 : 60, // Added padding for status bar
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'System', // Usually you'd use a custom font here for the Instagram vibe
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: Spacing.m,
  },
  listContent: {
    paddingBottom: 100, // Account for bottom nav
  },
  loadingContainer: {
    paddingVertical: Spacing.m,
  },
  skeletonCard: {
    marginBottom: Spacing.xl,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.m,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: Spacing.s,
  },
  footerLoader: {
    marginVertical: Spacing.l,
  },
});
