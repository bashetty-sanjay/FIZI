import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { createPost } from '../services/firestoreCommunity';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { addPostToFeed } from '../../store/slices/communitySlice';
import { Layout, Spacing } from '../../theme/Theme';

export const CreatePost: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square images like Instagram
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleShare = async () => {
    if (!imageUri || !user) return;
    
    setIsUploading(true);
    try {
      // 1. Upload to Cloudinary
      const uploadedUrl = await uploadImageToCloudinary(imageUri);
      
      // 2. Create post document in Firestore
      const newPostData = {
        userId: user.uid,
        username: user.displayName || 'User',
        profileImage: user.photoURL || '',
        imageUrl: uploadedUrl,
        caption: caption.trim(),
      };
      
      const postId = await createPost(newPostData);
      
      // 3. Update Redux state immediately for snappy UX
      dispatch(addPostToFeed({
        id: postId,
        ...newPostData,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        isOwnPost: true,
      }));

      // 4. Navigate back
      navigation.goBack();
      
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to share post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.backgroundDark }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isUploading}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Post</Text>
        <TouchableOpacity onPress={handleShare} disabled={!imageUri || isUploading}>
          {isUploading ? (
            <ActivityIndicator color={colors.primaryStart} size="small" />
          ) : (
            <Text style={[styles.shareButton, { color: imageUri ? colors.primaryStart : colors.textTertiary }]}>
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Image Selection */}
        <TouchableOpacity 
          style={[styles.imageContainer, { backgroundColor: colors.glassSurface }]} 
          onPress={pickImage}
          disabled={isUploading}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="camera-plus-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <TextInput
            style={[styles.captionInput, { color: colors.textPrimary }]}
            placeholder="Write a caption..."
            placeholderTextColor={colors.textTertiary}
            multiline
            value={caption}
            onChangeText={setCaption}
            editable={!isUploading}
            maxLength={2200}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.m,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareButton: {
    fontSize: 16,
    fontWeight: '700',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: Spacing.s,
    fontSize: 16,
    fontWeight: '500',
  },
  captionContainer: {
    padding: Spacing.m,
  },
  captionInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
