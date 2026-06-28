import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CommunityPost } from '../types';
import { LikeButton } from './LikeButton';
import { InlineComments } from './InlineComments';
import { useTheme } from '../../hooks/useTheme';
import { Layout, Spacing, Shadows } from '../../theme/Theme';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onUserPress: (userId: string) => void;
  onMenuPress?: (post: CommunityPost) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onUserPress, onMenuPress }) => {
  const { colors } = useTheme();
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const lastTap = React.useRef(0);
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const translateXValue = React.useRef(new Animated.Value(0)).current;
  const translateYValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  // Format date
  const formatTimeAgo = (date: any) => {
    if (!date) return '';
    const now = new Date();
    const past = (date as any).toDate ? (date as any).toDate() : new Date(date);
    const diffMs = now.getTime() - past.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 400; 
    
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {

      // Trigger actual like immediately so count updates right away
      if (!post.isLiked) {
        onLike(post.id);
      }

      // Reset animation values
      scaleValue.setValue(0);
      translateXValue.setValue(0);
      translateYValue.setValue(0);
      opacityValue.setValue(1);

      // Calculate target positions (Like button is roughly at bottom left)
      // width/2 is the center of the image.
      const targetX = 35 - (width / 2); // 35px from left edge
      const targetY = (width / 2) + 24; // 24px below the image container
      const targetScale = 0.24; // Shrink from size 100 down to roughly 24

      // 1. Pop up in center
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start(() => {
        // 2. Hold for a tiny moment, then swoosh down to the like button
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(translateXValue, {
              toValue: targetX,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(translateYValue, {
              toValue: targetY,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: targetScale,
              duration: 350,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // 3. Hide the animated heart
            opacityValue.setValue(0);
          });
        }, 200);
      });
    } else {
      lastTap.current = now;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={() => onUserPress(post.userId)}>
          {post.profileImage ? (
            <Image source={{ uri: post.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.glassHighlight }]}>
              <MaterialCommunityIcons name="account" size={20} color={colors.textSecondary} />
            </View>
          )}
          <Text style={[styles.username, { color: colors.textPrimary }]}>{post.username}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onMenuPress && onMenuPress(post)}>
          <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
        <View style={[styles.imageContainer, { backgroundColor: colors.backgroundDark }]}>
          {!imageLoaded && (
            <View style={styles.imageLoader}>
              <ActivityIndicator color={colors.primaryStart} />
            </View>
          )}
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.image}
            onLoad={() => setImageLoaded(true)}
            resizeMode="cover"
          />
          <Animated.View style={[styles.heartOverlay, { 
            opacity: opacityValue,
            transform: [
              { translateX: translateXValue },
              { translateY: translateYValue },
              { scale: scaleValue }
            ] 
          }]}>
            <MaterialCommunityIcons name="heart" size={120} color={colors.accentError} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <LikeButton isLiked={!!post.isLiked} onPress={() => onLike(post.id)} />
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(!showComments)}>
            <MaterialCommunityIcons name="comment-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.likesCount, { color: colors.textPrimary }]}>
          {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
        </Text>
        
        {post.caption ? (
          <Text style={[styles.caption, { color: colors.textPrimary }]}>
            <Text style={styles.captionUsername}>{post.username} </Text>
            {post.caption}
          </Text>
        ) : null}

        {post.commentsCount > 0 && (
          <TouchableOpacity onPress={() => setShowComments(!showComments)}>
            <Text style={[styles.viewComments, { color: colors.textSecondary }]}>
              {showComments ? 'Hide comments' : `View all ${post.commentsCount} comments`}
            </Text>
          </TouchableOpacity>
        )}
        
        <Text style={[styles.timeAgo, { color: colors.textTertiary }]}>
          {formatTimeAgo(post.createdAt)}
        </Text>
      </View>

      {/* Inline Comments Section */}
      {showComments && <InlineComments post={post} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.m,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.s,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontWeight: '700',
    fontSize: 14,
  },
  imageContainer: {
    width: width,
    height: width, // Square aspect ratio
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoader: {
    position: 'absolute',
    zIndex: 1,
  },
  heartOverlay: {
    position: 'absolute',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.s,
    paddingHorizontal: Spacing.m,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: Spacing.m,
  },
  footer: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
  },
  likesCount: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  captionUsername: {
    fontWeight: '700',
  },
  viewComments: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 12,
    marginTop: 2,
  },
});
