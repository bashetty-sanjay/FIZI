// ============================================================
// FIZI Community — Firestore Service
// ============================================================

import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  increment,
  runTransaction,
  Unsubscribe,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import {
  CommunityPost,
  PostComment,
  CommunityNotification,
  CommunityUserProfile,
} from '../types';

// ── Collections ──────────────────────────────────────────────
const POSTS = 'community_posts';
const COMMENTS = 'community_comments';
const LIKES = 'community_likes';
const FOLLOWERS = 'community_followers';
const NOTIFICATIONS = 'community_notifications';
const USERS = 'users';

// ── Helpers ───────────────────────────────────────────────────
function docToPost(d: QueryDocumentSnapshot): CommunityPost {
  const data = d.data();
  return {
    id: d.id,
    userId: data.userId,
    username: data.username,
    profileImage: data.profileImage ?? '',
    imageUrl: data.imageUrl,
    caption: data.caption ?? '',
    likesCount: data.likesCount ?? 0,
    commentsCount: data.commentsCount ?? 0,
    createdAt: data.createdAt,
  };
}

// ── Posts ─────────────────────────────────────────────────────

/** Fetch paginated feed (newest first) */
export async function fetchFeedPosts(
  lastDoc: DocumentSnapshot | null = null,
  pageSize = 12
): Promise<{ posts: CommunityPost[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    collection(db, POSTS),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  if (lastDoc) q = query(q, startAfter(lastDoc));

  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => docToPost(d as QueryDocumentSnapshot));
  return {
    posts,
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
  };
}

/** Fetch all posts by a specific user (for profile grid) */
export async function fetchUserPosts(userId: string): Promise<CommunityPost[]> {
  const q = query(
    collection(db, POSTS),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => docToPost(d as QueryDocumentSnapshot));
  
  // Sort manually in JS to prevent Firebase throwing a "Missing Composite Index" error
  return posts.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
}

/** Create a new post document */
export async function createPost(
  post: Omit<CommunityPost, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, POSTS), {
    ...post,
    likesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Delete a post and remove its sub-data */
export async function deletePost(postId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, POSTS, postId));
}

// ── Likes ─────────────────────────────────────────────────────

const likeId = (postId: string, userId: string) => `${postId}_${userId}`;

/** Toggle like on a post — returns new liked state */
export async function toggleLike(
  postId: string,
  userId: string
): Promise<boolean> {
  const likeRef = doc(db, LIKES, likeId(postId, userId));
  const postRef = doc(db, POSTS, postId);

  const likeSnap = await getDoc(likeRef);
  const alreadyLiked = likeSnap.exists();

  await runTransaction(db, async (tx) => {
    if (alreadyLiked) {
      tx.delete(likeRef);
      tx.update(postRef, { likesCount: increment(-1) });
    } else {
      tx.set(likeRef, { postId, userId, createdAt: serverTimestamp() });
      tx.update(postRef, { likesCount: increment(1) });
    }
  });

  return !alreadyLiked; // Return the new liked state
}

/** Check which posts in an array the current user has liked */
export async function fetchLikedPostIds(
  userId: string,
  postIds: string[]
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const likedSet = new Set<string>();
  await Promise.all(
    postIds.map(async (pid) => {
      const snap = await getDoc(doc(db, LIKES, likeId(pid, userId)));
      if (snap.exists()) likedSet.add(pid);
    })
  );
  return likedSet;
}

// ── Comments ──────────────────────────────────────────────────

/** Real-time comments listener for a post */
export function subscribeToComments(
  postId: string,
  callback: (comments: PostComment[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COMMENTS),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const comments: PostComment[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        postId: data.postId,
        userId: data.userId,
        username: data.username,
        profileImage: data.profileImage ?? '',
        text: data.text,
        createdAt: data.createdAt,
      };
    });
    callback(comments);
  });
}

/** Add a comment to a post */
export async function addComment(
  postId: string,
  userId: string,
  username: string,
  profileImage: string,
  text: string
): Promise<void> {
  const postRef = doc(db, POSTS, postId);
  await Promise.all([
    addDoc(collection(db, COMMENTS), {
      postId,
      userId,
      username,
      profileImage,
      text,
      createdAt: serverTimestamp(),
    }),
    updateDoc(postRef, { commentsCount: increment(1) }),
  ]);
}

// ── Followers ─────────────────────────────────────────────────

const followId = (followerId: string, followingId: string) =>
  `${followerId}_${followingId}`;

/** Toggle follow/unfollow — returns new follow state */
export async function toggleFollow(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const ref = doc(db, FOLLOWERS, followId(followerId, followingId));
  const snap = await getDoc(ref);
  const isFollowing = snap.exists();

  if (isFollowing) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { followerId, followingId, createdAt: serverTimestamp() });
  }
  return !isFollowing;
}

/** Check if user A follows user B */
export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const snap = await getDoc(doc(db, FOLLOWERS, followId(followerId, followingId)));
  return snap.exists();
}

// ── Users / Search ────────────────────────────────────────────

/** Search users by username prefix */
export async function searchUsersByUsername(
  searchTerm: string,
  currentUserId: string
): Promise<CommunityUserProfile[]> {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return [];

  // Firestore range query for prefix search
  const q = query(
    collection(db, USERS),
    where('displayName', '>=', term),
    where('displayName', '<=', term + '\uf8ff'),
    limit(20)
  );
  const snap = await getDocs(q);

  return snap.docs
    .filter((d) => d.id !== currentUserId)
    .map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        username: data.displayName ?? data.username ?? '',
        displayName: data.displayName ?? '',
        profileImage: data.photoURL ?? '',
        bio: data.bio ?? '',
        postsCount: data.postsCount ?? 0,
        followersCount: data.followersCount ?? 0,
        followingCount: data.followingCount ?? 0,
      };
    });
}

/** Get a single community user profile */
export async function getCommunityUserProfile(
  uid: string
): Promise<CommunityUserProfile | null> {
  const snap = await getDoc(doc(db, USERS, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    username: data.displayName ?? data.username ?? '',
    displayName: data.displayName ?? '',
    profileImage: data.photoURL ?? '',
    bio: data.bio ?? '',
    postsCount: data.postsCount ?? 0,
    followersCount: data.followersCount ?? 0,
    followingCount: data.followingCount ?? 0,
  };
}

// ── Notifications ─────────────────────────────────────────────

/** Real-time notifications listener */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: CommunityNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, NOTIFICATIONS),
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const notifications: CommunityNotification[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as CommunityNotification[];
    callback(notifications);
  });
}

/** Mark a notification as read */
export async function markNotificationRead(notifId: string): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS, notifId), { read: true });
}

/** Send a notification */
export async function sendNotification(
  notif: Omit<CommunityNotification, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(db, NOTIFICATIONS), {
    ...notif,
    createdAt: serverTimestamp(),
  });
}
