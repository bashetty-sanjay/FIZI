// ============================================================
// FIZI Community Module — Types
// ============================================================

import { Timestamp } from 'firebase/firestore';

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Timestamp | Date | string;
  // Client-side flags
  isLiked?: boolean;
  isOwnPost?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  profileImage: string;
  text: string;
  createdAt: Timestamp | Date | string;
}

export interface PostLike {
  postId: string;
  userId: string;
  createdAt: Timestamp | Date | string;
}

export interface FollowerRelation {
  followerId: string;
  followingId: string;
  createdAt: Timestamp | Date | string;
}

export interface CommunityNotification {
  id: string;
  toUserId: string;
  fromUserId: string;
  fromUsername: string;
  fromProfileImage: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  postImageUrl?: string;
  commentText?: string;
  read: boolean;
  createdAt: Timestamp | Date | string;
}

export interface CommunityUserProfile {
  uid: string;
  username: string;
  displayName: string;
  profileImage: string;
  bio: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}
