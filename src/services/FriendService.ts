/**
 * FriendService
 *
 * Handles searching for users by email and managing the friend list
 * stored in each user's Firestore document under the `friends` field.
 */

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    getDoc,
    arrayUnion,
    arrayRemove,
    limit,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface FriendProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    addedAt?: string;
    level?: number;
    totalWorkouts?: number;
}

class FriendService {
    /**
     * Search for a FIZI user by their exact email address.
     * Returns null if not found.
     */
    async searchUserByEmail(email: string): Promise<FriendProfile | null> {
        try {
            const usersRef = collection(db, 'users');
            const emailTrimmed = email.trim();
            const emailLower = emailTrimmed.toLowerCase();

            // Try both forms to handle case mismatch in stored email
            const candidates = Array.from(new Set([emailTrimmed, emailLower]));

            for (const candidate of candidates) {
                const q = query(usersRef, where('email', '==', candidate));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data();
                    return {
                        uid: data.uid,
                        displayName: data.displayName || 'FIZI User',
                        email: data.email,
                        photoURL: data.photoURL ?? undefined,
                        level: data.level ?? 1,
                        totalWorkouts: data.totalWorkouts ?? 0,
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('FriendService.searchUserByEmail error:', error);
            return null;
        }
    }

    /**
     * Add a friend to the current user's friend list.
     */
    async addFriend(currentUid: string, friend: FriendProfile): Promise<void> {
        // Build entry without undefined values — Firestore arrayUnion throws on undefined fields
        const friendEntry: Record<string, any> = {
            uid: friend.uid,
            displayName: friend.displayName,
            email: friend.email,
            addedAt: new Date().toISOString(),
            level: friend.level ?? 1,
            totalWorkouts: friend.totalWorkouts ?? 0,
        };
        if (friend.photoURL) {
            friendEntry.photoURL = friend.photoURL;
        }

        const docRef = doc(db, 'users', currentUid);
        await updateDoc(docRef, {
            friends: arrayUnion(friendEntry),
        });
    }

    /**
     * Remove a friend from the current user's friend list.
     * We need to find the matching entry first so arrayRemove can deep-equal it.
     */
    async removeFriend(currentUid: string, friendUid: string): Promise<void> {
        const docRef = doc(db, 'users', currentUid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;

        const data = snap.data();
        const friends: FriendProfile[] = data.friends || [];
        const toRemove = friends.find((f) => f.uid === friendUid);
        if (!toRemove) return;

        await updateDoc(docRef, {
            friends: arrayRemove(toRemove),
        });
    }

    /**
     * Get the current user's friend list from Firestore.
     */
    async getFriends(uid: string): Promise<FriendProfile[]> {
        try {
            const docRef = doc(db, 'users', uid);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return [];
            return snap.data().friends || [];
        } catch (error) {
            console.error('FriendService.getFriends error:', error);
            return [];
        }
    }

    /**
     * Get the current user's profile info formatted as FriendProfile for ranking
     */
    async getCurrentUserProfile(uid: string): Promise<FriendProfile | null> {
        try {
            const docRef = doc(db, 'users', uid);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return null;
            const data = snap.data();
            return {
                uid: data.uid,
                displayName: data.displayName || 'You',
                email: data.email,
                photoURL: data.photoURL ?? undefined,
                level: data.level ?? 1,
                totalWorkouts: data.totalWorkouts ?? 0,
            };
        } catch (error) {
            console.error('FriendService.getCurrentUserProfile error:', error);
            return null;
        }
    }

    /**
     * Get a list of suggested friends (other FIZI users).
     */
    async getSuggestedFriends(currentUid: string, limitCount: number = 20): Promise<FriendProfile[]> {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, limit(limitCount));
            const snapshot = await getDocs(q);
            
            const currentFriends = await this.getFriends(currentUid);
            const friendUids = new Set(currentFriends.map(f => f.uid));
            
            const suggestions: FriendProfile[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.uid && data.uid !== currentUid && !friendUids.has(data.uid)) {
                    suggestions.push({
                        uid: data.uid,
                        displayName: data.displayName || 'FIZI User',
                        email: data.email,
                        photoURL: data.photoURL ?? undefined,
                        level: data.level ?? 1,
                        totalWorkouts: data.totalWorkouts ?? 0,
                    });
                }
            });
            return suggestions;
        } catch (error) {
            console.error('FriendService.getSuggestedFriends error:', error);
            return [];
        }
    }
}

export const friendService = new FriendService();
