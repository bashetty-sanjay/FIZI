import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { CommunityPost, PostComment } from '../types';
import { subscribeToComments, addComment } from '../services/firestoreCommunity';
import { useAppSelector } from '../../hooks/reduxHooks';
import { Layout, Spacing } from '../../theme/Theme';

interface InlineCommentsProps {
  post: CommunityPost;
}

export const InlineComments: React.FC<InlineCommentsProps> = ({ post }) => {
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      const unsubscribe = subscribeToComments(post.id, (fetchedComments) => {
        setComments(fetchedComments);
      });
      return () => unsubscribe();
    }
  }, [post]);

  const handleSubmit = async () => {
    if (!inputText.trim() || !post || !user) return;
    
    setIsSubmitting(true);
    try {
      await addComment(
        post.id,
        user.uid,
        user.displayName || 'User',
        user.photoURL || '',
        inputText.trim()
      );
      setInputText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (date: any) => {
    if (!date) return '';
    const now = new Date();
    const past = date.toDate ? date.toDate() : new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <View style={styles.container}>
      {/* Comments List */}
      <View style={styles.commentsList}>
        {comments.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No comments yet. Start the conversation!
          </Text>
        ) : (
          comments.map((item) => (
            <View key={item.id} style={styles.commentContainer}>
              {item.profileImage ? (
                <Image source={{ uri: item.profileImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.glassHighlight }]}>
                  <MaterialCommunityIcons name="account" size={14} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.commentContent}>
                <Text style={[styles.commentUsername, { color: colors.textPrimary }]}>
                  {item.username}
                  <Text style={[styles.commentTime, { color: colors.textTertiary }]}>
                    {' '}• {formatTime(item.createdAt)}
                  </Text>
                </Text>
                <Text style={[styles.commentText, { color: colors.textPrimary }]}>{item.text}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Input Area */}
      <View style={[styles.inputContainer, { borderTopColor: colors.glassBorder, backgroundColor: colors.glassSurface }]}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.inputAvatar} />
        ) : (
          <View style={[styles.inputAvatarPlaceholder, { backgroundColor: colors.glassHighlight }]}>
            <MaterialCommunityIcons name="account" size={16} color={colors.textSecondary} />
          </View>
        )}
        <TextInput
          style={[styles.input, { color: colors.textPrimary, backgroundColor: 'rgba(0,0,0,0.2)' }]}
          placeholder="Add a comment..."
          placeholderTextColor={colors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={300}
        />
        <TouchableOpacity 
          style={[styles.postButton, (!inputText.trim() || isSubmitting) && styles.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={!inputText.trim() || isSubmitting}
        >
          <Text style={[styles.postButtonText, { color: inputText.trim() ? colors.primaryStart : colors.textTertiary }]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.s,
    paddingTop: Spacing.s,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  commentsList: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.s,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.m,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: Spacing.s,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: Spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  commentTime: {
    fontWeight: '400',
    fontSize: 11,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: Spacing.s,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderTopWidth: 0.5,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.s,
    marginBottom: 2,
  },
  inputAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.s,
    marginBottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderRadius: 18,
    paddingHorizontal: Spacing.m,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: Spacing.s,
    fontSize: 13,
  },
  postButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
