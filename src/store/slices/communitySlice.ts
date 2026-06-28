// ============================================================
// FIZI Community — Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DocumentSnapshot } from 'firebase/firestore';
import { CommunityPost, CommunityNotification } from '../../community/types';
import {
  fetchFeedPosts,
  toggleLike,
  fetchLikedPostIds,
  fetchUserPosts,
  deletePost,
} from '../../community/services/firestoreCommunity';

// ── State ─────────────────────────────────────────────────────

interface CommunityState {
  // Feed
  feedPosts: CommunityPost[];
  feedLoading: boolean;
  feedRefreshing: boolean;
  feedError: string | null;
  lastDocSerialized: string | null; // JSON-serialized for Redux compat
  hasMore: boolean;

  // User profile posts
  profilePosts: CommunityPost[];
  profilePostsLoading: boolean;

  // Liked post IDs (current user)
  likedPostIds: string[];

  // Notifications
  notifications: CommunityNotification[];
  unreadNotificationCount: number;

  // Create post
  uploadProgress: number;
  createPostLoading: boolean;
}

const initialState: CommunityState = {
  feedPosts: [],
  feedLoading: false,
  feedRefreshing: false,
  feedError: null,
  lastDocSerialized: null,
  hasMore: true,

  profilePosts: [],
  profilePostsLoading: false,

  likedPostIds: [],

  notifications: [],
  unreadNotificationCount: 0,

  uploadProgress: 0,
  createPostLoading: false,
};

// ── Async Thunks ──────────────────────────────────────────────

/** Load initial feed (or refresh) */
export const loadFeedPosts = createAsyncThunk(
  'community/loadFeedPosts',
  async (
    { refresh, currentUserId }: { refresh: boolean; currentUserId: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await fetchFeedPosts(null, 12);
      const likedIds = await fetchLikedPostIds(
        currentUserId,
        result.posts.map((p) => p.id)
      );
      return {
        posts: result.posts.map((p) => ({ ...p, isLiked: likedIds.has(p.id) })),
        hasMore: result.posts.length === 12,
        lastDocSerialized: result.lastDoc ? JSON.stringify({ id: result.lastDoc.id }) : null,
        _lastDoc: result.lastDoc, // not serialized — handled in thunk
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

/** Load more feed posts (pagination) */
export const loadMoreFeedPosts = createAsyncThunk(
  'community/loadMoreFeedPosts',
  async (
    {
      lastDoc,
      currentUserId,
    }: { lastDoc: DocumentSnapshot | null; currentUserId: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await fetchFeedPosts(lastDoc, 12);
      const likedIds = await fetchLikedPostIds(
        currentUserId,
        result.posts.map((p) => p.id)
      );
      return {
        posts: result.posts.map((p) => ({ ...p, isLiked: likedIds.has(p.id) })),
        hasMore: result.posts.length === 12,
        lastDocSerialized: result.lastDoc ? JSON.stringify({ id: result.lastDoc.id }) : null,
        _lastDoc: result.lastDoc,
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

/** Toggle like on a post */
export const likePost = createAsyncThunk(
  'community/likePost',
  async (
    { postId, userId }: { postId: string; userId: string },
    { rejectWithValue }
  ) => {
    try {
      const newLikedState = await toggleLike(postId, userId);
      return { postId, isLiked: newLikedState };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

/** Fetch posts for a user's profile grid */
export const loadUserProfilePosts = createAsyncThunk(
  'community/loadUserProfilePosts',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await fetchUserPosts(userId);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

/** Delete a post from Firebase */
export const deleteCommunityPost = createAsyncThunk(
  'community/deleteCommunityPost',
  async ({ postId, userId }: { postId: string; userId: string }, { rejectWithValue }) => {
    try {
      await deletePost(postId, userId);
      return postId;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<CommunityNotification[]>) => {
      state.notifications = action.payload;
      state.unreadNotificationCount = action.payload.filter((n) => !n.read).length;
    },
    clearFeed: (state) => {
      state.feedPosts = [];
      state.lastDocSerialized = null;
      state.hasMore = true;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    setCreatePostLoading: (state, action: PayloadAction<boolean>) => {
      state.createPostLoading = action.payload;
    },
    addPostToFeed: (state, action: PayloadAction<CommunityPost>) => {
      state.feedPosts.unshift(action.payload);
      state.profilePosts.unshift(action.payload);
    },
    removePostFromFeed: (state, action: PayloadAction<string>) => {
      state.feedPosts = state.feedPosts.filter((p) => p.id !== action.payload);
      state.profilePosts = state.profilePosts.filter((p) => p.id !== action.payload);
    },
    markAllNotificationsRead: (state) => {
      state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
      state.unreadNotificationCount = 0;
    },
  },
  extraReducers: (builder) => {
    // ── loadFeedPosts ──
    builder
      .addCase(loadFeedPosts.pending, (state, action) => {
        if (action.meta.arg.refresh) {
          state.feedRefreshing = true;
        } else {
          state.feedLoading = true;
        }
        state.feedError = null;
      })
      .addCase(loadFeedPosts.fulfilled, (state, action) => {
        state.feedRefreshing = false;
        state.feedLoading = false;
        state.feedPosts = action.payload.posts;
        state.hasMore = action.payload.hasMore;
        state.lastDocSerialized = action.payload.lastDocSerialized;
      })
      .addCase(loadFeedPosts.rejected, (state, action) => {
        state.feedLoading = false;
        state.feedRefreshing = false;
        state.feedError = action.payload as string;
      });

    // ── loadMoreFeedPosts ──
    builder
      .addCase(loadMoreFeedPosts.fulfilled, (state, action) => {
        state.feedPosts = [...state.feedPosts, ...action.payload.posts];
        state.hasMore = action.payload.hasMore;
        state.lastDocSerialized = action.payload.lastDocSerialized;
      });

    // ── likePost ──
    builder.addCase(likePost.fulfilled, (state, action) => {
      const { postId, isLiked } = action.payload;
      const update = (posts: CommunityPost[]) =>
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked,
                likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
              }
            : p
        );
      state.feedPosts = update(state.feedPosts);
      state.profilePosts = update(state.profilePosts);

      if (isLiked) {
        state.likedPostIds = [...new Set([...state.likedPostIds, postId])];
      } else {
        state.likedPostIds = state.likedPostIds.filter((id) => id !== postId);
      }
    });

    // ── loadUserProfilePosts ──
    builder
      .addCase(loadUserProfilePosts.pending, (state) => {
        state.profilePostsLoading = true;
      })
      .addCase(loadUserProfilePosts.fulfilled, (state, action) => {
        state.profilePostsLoading = false;
        state.profilePosts = action.payload;
      })
      .addCase(loadUserProfilePosts.rejected, (state) => {
        state.profilePostsLoading = false;
      });

    // ── deleteCommunityPost ──
    builder.addCase(deleteCommunityPost.fulfilled, (state, action) => {
      const postId = action.payload;
      state.feedPosts = state.feedPosts.filter((p) => p.id !== postId);
      state.profilePosts = state.profilePosts.filter((p) => p.id !== postId);
    });
  },
});

export const {
  setNotifications,
  clearFeed,
  setUploadProgress,
  setCreatePostLoading,
  addPostToFeed,
  removePostFromFeed,
  markAllNotificationsRead,
} = communitySlice.actions;

export default communitySlice.reducer;
