import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { likePost } from '../../store/slices/communitySlice';
import { PostCard } from '../components/PostCard';
import { PostOptionsModal } from '../components/PostOptionsModal';
import { CommunityPost } from '../types';
import { Spacing } from '../../theme/Theme';

export const PostDetails: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { feedPosts, profilePosts } = useAppSelector((state) => state.community);
  
  const [activeOptionsPost, setActiveOptionsPost] = useState<CommunityPost | null>(null);

  // Find the full post object from Redux state (either feed or profile posts)
  const initialPost = route?.params?.post;
  const post = feedPosts.find(p => p.id === initialPost?.id) 
            || profilePosts.find(p => p.id === initialPost?.id) 
            || initialPost;

  const handleLike = (postId: string) => {
    if (user?.uid) {
      dispatch(likePost({ postId, userId: user.uid }));
    }
  };

  const handleMenuPress = (selectedPost: CommunityPost) => {
    setActiveOptionsPost(selectedPost);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDark }]}>
      <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Post</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {post ? (
          <PostCard
            post={post}
            onLike={handleLike}
            onUserPress={(userId) => navigation.navigate('UserProfile', { userId })}
            onMenuPress={handleMenuPress}
          />
        ) : (
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Post not found.</Text>
        )}
      </ScrollView>


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
    padding: Spacing.m,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: 16,
  },
});
