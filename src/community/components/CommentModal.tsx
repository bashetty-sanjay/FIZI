import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { CommunityPost, PostComment } from '../types';
import { subscribeToComments, addComment } from '../services/firestoreCommunity';
import { useAppSelector } from '../../hooks/reduxHooks';
import { Layout, Spacing } from '../../theme/Theme';

interface CommentModalProps {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ visible, post, onClose }) => {
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && post) {
      const unsubscribe = subscribeToComments(post.id, (fetchedComments) => {
        setComments(fetchedComments);
      });
      return () => unsubscribe();
    }
  }, [visible, post]);

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

  const renderComment = ({ item }: { item: PostComment }) => (
    <View style={styles.commentContainer}>
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.glassHighlight }]}>
          <MaterialCommunityIcons name="account" size={16} color={colors.textSecondary} />
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
  );

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

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalContent, { backgroundColor: colors.backgroundDark }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
            <View style={{ width: 24 }} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No comments yet. Start the conversation!
              </Text>
            }
          />

          {/* Input Area */}
          <View style={[styles.inputContainer, { borderTopColor: colors.glassBorder, backgroundColor: colors.backgroundDarker }]}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.inputAvatar} />
            ) : (
              <View style={[styles.inputAvatarPlaceholder, { backgroundColor: colors.glassHighlight }]}>
                <MaterialCommunityIcons name="account" size={18} color={colors.textSecondary} />
              </View>
            )}
            <TextInput
              style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.glassSurface }]}
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    height: '70%',
    borderTopLeftRadius: Layout.borderRadius.l,
    borderTopRightRadius: Layout.borderRadius.l,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.m,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.m,
    flexGrow: 1,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.l,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.s,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  commentTime: {
    fontWeight: '400',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.m,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.m,
  },
  inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.s,
  },
  inputAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.s,
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
    fontSize: 14,
  },
  postButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
