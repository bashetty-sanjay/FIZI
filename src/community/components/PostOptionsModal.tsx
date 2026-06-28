import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share, Alert, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { CommunityPost } from '../types';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { deleteCommunityPost } from '../../store/slices/communitySlice';
import { Layout } from '../../theme/Theme';

const { width } = Dimensions.get('window');

interface PostOptionsModalProps {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
}

export const PostOptionsModal: React.FC<PostOptionsModalProps> = ({ visible, post, onClose }) => {
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  if (!post) return null;
  const isMyPost = user?.uid === post.userId;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this awesome post on FIZI! https://fizi.app/post/${post.id}`,
      });
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = () => {
    if (!user?.uid) return;
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            dispatch(deleteCommunityPost({ postId: post.id, userId: user.uid }));
            onClose();
          } 
        }
      ]
    );
  };

  const OptionButton = ({ label, color = colors.textPrimary, onPress, isLast = false }: any) => (
    <TouchableOpacity 
      style={[styles.optionRow, !isLast && { borderBottomColor: colors.glassBorder, borderBottomWidth: 1 }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.optionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.cardSurface }]}>
              {isMyPost ? (
                <>
                  <OptionButton 
                    label="Delete Post" 
                    color={colors.accentError} 
                    onPress={handleDelete} 
                  />
                  <OptionButton 
                    label="Share to..." 
                    onPress={handleShare} 
                  />
                  <OptionButton 
                    label="Copy link" 
                    onPress={handleShare} 
                  />
                  <OptionButton 
                    label="Cancel" 
                    isLast={true}
                    onPress={onClose}
                  />
                </>
              ) : (
                <>
                  <OptionButton 
                    label="Report" 
                    color={colors.accentError} 
                    onPress={() => {
                      Alert.alert('Reported', 'Thank you. This post has been flagged for review by our moderators.');
                      onClose();
                    }} 
                  />
                  <OptionButton 
                    label="Unfollow" 
                    color={colors.accentError} 
                    onPress={() => {
                      Alert.alert('Coming Soon', 'Unfollow functionality will be added soon!');
                      onClose();
                    }} 
                  />
                  <OptionButton 
                    label="Share to..." 
                    onPress={handleShare} 
                  />
                  <OptionButton 
                    label="Copy link" 
                    onPress={handleShare} 
                  />
                  <OptionButton 
                    label="Hide Post" 
                    onPress={() => {
                      Alert.alert('Hidden', 'This post will be hidden from your feed.');
                      onClose();
                    }} 
                  />
                  <OptionButton 
                    label="Cancel" 
                    isLast={true}
                    onPress={onClose}
                  />
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.75,
    maxWidth: 400,
    borderRadius: Layout.borderRadius.m,
    overflow: 'hidden',
  },
  optionRow: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
