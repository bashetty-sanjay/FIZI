/**
 * DataRetentionService
 *
 * Implements a rolling 90-day data retention policy for raw workout and
 * daily stats documents. Lifetime aggregates (avatars, users, plans) are
 * unaffected and kept forever.
 *
 * Cleanup is triggered silently in the background after each workout save.
 */

import {
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    Timestamp,
    doc,
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

const WORKOUTS_COLLECTION = 'workouts';
const STATS_COLLECTION = 'stats';

// Rolling window in days
const RETENTION_DAYS = 90;

// Firestore writeBatch limit is 500 operations per batch
const BATCH_SIZE = 450;

class DataRetentionService {
    /**
     * Delete all workout and stats documents older than RETENTION_DAYS for
     * the currently logged-in user. Safe to call fire-and-forget.
     */
    async runCleanup(): Promise<void> {
        const user = auth.currentUser;
        if (!user) return;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        try {
            await Promise.all([
                this.deleteOldDocuments(WORKOUTS_COLLECTION, user.uid, cutoffTimestamp),
                this.deleteOldDocuments(STATS_COLLECTION, user.uid, cutoffTimestamp),
            ]);
        } catch (error) {
            // Silently fail — retention cleanup should never break the app
            console.warn('[DataRetentionService] Cleanup failed silently:', error);
        }
    }

    /**
     * Query a collection for documents belonging to this user that are older
     * than the cutoff timestamp, then delete them in batches.
     */
    private async deleteOldDocuments(
        collectionName: string,
        userId: string,
        cutoffTimestamp: Timestamp
    ): Promise<void> {
        const q = query(
            collection(db, collectionName),
            where('userId', '==', userId),
            where('createdAt', '<', cutoffTimestamp)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        const docs = snapshot.docs;
        console.log(
            `[DataRetentionService] Deleting ${docs.length} old documents from "${collectionName}"`
        );

        // Split into chunks of BATCH_SIZE to respect Firestore limits
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
            const chunk = docs.slice(i, i + BATCH_SIZE);
            const batch = writeBatch(db);
            chunk.forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }
    }
}

export const dataRetentionService = new DataRetentionService();
