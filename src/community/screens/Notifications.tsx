import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { markAllNotificationsRead, setNotifications } from '../../store/slices/communitySlice';
import { subscribeToNotifications, markNotificationRead } from '../services/firestoreCommunity';
import { CommunityNotification } from '../types';
import { Spacing, Layout } from '../../theme/Theme';

export const Notifications: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { notifications } = useAppSelector((state) => state.community);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToNotifications(user.uid, (notifs) => {
        dispatch(setNotifications(notifs));
      });
      return () => unsubscribe();
    }
  }, [user?.uid, dispatch]);

  useEffect(() => {
    // Mark all as read when leaving screen
    return () => {
      if (user?.uid) {
        dispatch(markAllNotificationsRead());
        notifications.forEach((n) => {
          if (!n.read) markNotificationRead(n.id);
        });
      }
    };
  }, []);

  const handleNotificationPress = (notif: CommunityNotification) => {
    if (!notif.read) {
      markNotificationRead(notif.id);
    }
    
    if (notif.type === 'follow') {
      navigation.navigate('UserProfile', { userId: notif.fromUserId });
    } else if (notif.postId) {
      // Pass minimal post object to fetch full details in PostDetails
      navigation.navigate('PostDetails', { post: { id: notif.postId } });
    }
  };

  const getNotificationText = (notif: CommunityNotification) => {
    switch (notif.type) {
      case 'like':
        return 'liked your post.';
      case 'comment':
        return `commented: "${notif.commentText}"`;
      case 'follow':
        return 'started following you.';
      default:
        return 'interacted with you.';
    }
  };

  const renderItem = ({ item }: { item: CommunityNotification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && { backgroundColor: colors.glassSurface }]}
      onPress={() => handleNotificationPress(item)}
    >
      <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: item.fromUserId })}>
        {item.fromProfileImage ? (
          <Image source={{ uri: item.fromProfileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.glassHighlight }]}>
            <MaterialCommunityIcons name="account" size={20} color={colors.textSecondary} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.text, { color: colors.textPrimary }]}>
          <Text style={styles.username}>{item.fromUsername} </Text>
          {getNotificationText(item)}
        </Text>
      </View>

      {item.type !== 'follow' && item.postImageUrl && (
        <Image source={{ uri: item.postImageUrl }} style={styles.postThumbnail} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDark }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No notifications yet.</Text>
          </View>
        }
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
  listContent: {
    paddingBottom: Spacing.xl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.m,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  username: {
    fontWeight: '700',
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginLeft: Spacing.m,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.m,
  },
});
