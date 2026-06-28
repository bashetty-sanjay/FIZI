import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile as firebaseUpdateProfile,
    sendPasswordResetEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    GoogleAuthProvider,
    signInWithCredential,
    linkWithCredential,
    User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from './firebaseConfig';
import { UserProfile } from '../types';

class AuthService {
    /**
     * Sign up a new user with email and password
     */
    async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
        try {
            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            await firebaseUpdateProfile(user, { displayName });

            // Create user profile in Firestore
            const userProfile: UserProfile = {
                uid: user.uid,
                email: email,
                displayName: displayName,
                age: 0,
                gender: 'male',
                weight: 0,
                height: 0,
                fitnessGoal: 'weight_loss',
                fitnessProfile: {
                    equipmentAccess: 'bodyweight',
                    availableEquipment: [],
                    experienceLevel: 'beginner',
                    fitnessGoals: [],
                    healthIssues: [],
                    availableDays: 3
                },
                progressSystem: {
                    currentLevel: 1,
                    currentXP: 0,
                    xpToNextLevel: 1000,
                    totalWorkoutsCompleted: 0,
                    unlockedExercises: ['push-ups', 'squats', 'plank', 'jumping-jacks']
                },
                workoutCapacity: {
                    bodyweight: { sets: 3, reps: 10 },
                    weighted: { sets: 3, reps: 8 }
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                transformationPhotos: [],
                level: 1,
                xp: 0,
                totalWorkouts: 0,
            };

            // Add photoURL only if it exists
            if (user.photoURL) {
                userProfile.photoURL = user.photoURL;
            }

            await setDoc(doc(db, 'users', user.uid), {
                ...userProfile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            return userProfile;
        } catch (error: any) {
            throw new Error(this.handleAuthError(error.code));
        }
    }

    /**
     * Sign in existing user
     */
    async signIn(email: string, password: string): Promise<UserProfile> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch user profile from Firestore
            const userProfile = await this.getUserProfile(user.uid);

            if (!userProfile) {
                throw new Error('User profile not found');
            }

            return userProfile;
        } catch (error: any) {
            throw new Error(this.handleAuthError(error.code));
        }
    }

    /**
     * Sign in (or sign up) with Google.
     *
     * The Google `idToken` is obtained on the UI side via expo-auth-session
     * (Google.useIdTokenAuthRequest). Here we exchange it for a Firebase
     * identity, then ensure a Firestore profile exists.
     *
     * Returns the profile plus an `isNewUser` flag so callers can route a
     * brand-new user through onboarding. (Routing itself is driven by the
     * global onAuthStateChanged stream + profile-completeness check.)
     */
    async signInWithGoogle(idToken: string, accessToken?: string): Promise<{ user: UserProfile; isNewUser: boolean }> {
        try {
            // 1. Exchange the Google credential for a Firebase user (stable uid)
            const credential = GoogleAuthProvider.credential(idToken, accessToken);
            const userCredential = await signInWithCredential(auth, credential);
            const firebaseUser = userCredential.user;

            if (!firebaseUser) {
                throw new Error('Google Sign-In failed');
            }

            // 2. Returning user? A profile in Firestore means they've signed in before.
            const existing = await this.getUserProfile(firebaseUser.uid);
            if (existing) {
                return { user: existing, isNewUser: false };
            }

            // 3. Brand-new user — create a minimal profile so the auth stream
            //    routes them to ProfileSetup instead of bouncing back to Login.
            const userProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                age: 0,
                gender: 'male',
                weight: 0,
                height: 0,
                fitnessGoal: 'weight_loss',
                fitnessProfile: {
                    equipmentAccess: 'bodyweight',
                    availableEquipment: [],
                    experienceLevel: 'beginner',
                    fitnessGoals: [],
                    healthIssues: [],
                    availableDays: 3
                },
                progressSystem: {
                    currentLevel: 1,
                    currentXP: 0,
                    xpToNextLevel: 1000,
                    totalWorkoutsCompleted: 0,
                    unlockedExercises: ['push-ups', 'squats', 'plank', 'jumping-jacks']
                },
                workoutCapacity: {
                    bodyweight: { sets: 3, reps: 10 },
                    weighted: { sets: 3, reps: 8 }
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                transformationPhotos: [],
                level: 1,
                xp: 0,
                totalWorkouts: 0,
            };

            if (firebaseUser.photoURL) {
                userProfile.photoURL = firebaseUser.photoURL;
            }

            await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...userProfile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            return { user: userProfile, isNewUser: true };
        } catch (error: any) {
            // The email is already registered with a different provider
            // (e.g. email/password). Signal the UI to collect the password so
            // we can link Google to that existing account instead of failing.
            if (error.code === 'auth/account-exists-with-different-credential') {
                const linkError: any = new Error('ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL');
                linkError.code = 'account-exists-with-different-credential';
                linkError.email = error.customData?.email || error.email;
                throw linkError;
            }
            throw new Error(this.handleAuthError(error.code));
        }
    }

    /**
     * Link a Google credential to an existing email/password account.
     *
     * Called after signInWithGoogle reports the email already exists. The user
     * proves ownership by entering their password; we sign into that account
     * and attach Google to it, so future Google sign-ins return the same uid.
     */
    async linkGoogleToPasswordAccount(email: string, password: string, idToken: string): Promise<UserProfile> {
        try {
            // 1. Sign into the existing password account.
            await signInWithEmailAndPassword(auth, email, password);

            // 2. Attach the Google credential to it.
            const credential = GoogleAuthProvider.credential(idToken);
            await linkWithCredential(auth.currentUser!, credential);

            // 3. Return the existing profile (unchanged by linking).
            const profile = await this.getUserProfile(auth.currentUser!.uid);
            if (!profile) {
                throw new Error('Account linked but profile not found');
            }
            return profile;
        } catch (error: any) {
            // Surface a clean message (wrong password, etc.).
            throw new Error(this.handleAuthError(error.code));
        }
    }

    /**
     * Sign out current user
     */
    async signOut(): Promise<void> {
        try {
            await firebaseSignOut(auth);
        } catch (error: any) {
            throw new Error('Failed to sign out');
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
            throw new Error(this.handleAuthError(error.code));
        }
    }

    /**
     * Change password for currently logged in user
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        try {
            const user = auth.currentUser;
            if (!user || !user.email) throw new Error('No user logged in');

            // 1. Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 2. Update password
            await updatePassword(user, newPassword);
        } catch (error: any) {
            throw new Error(this.handleAuthError(error.code));
        }
    }

    /**
     * Get user profile from Firestore
     */
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                const profile: UserProfile = {
                    uid: data.uid,
                    email: data.email,
                    displayName: data.displayName,
                    age: data.age || 0,
                    gender: data.gender || 'male',
                    weight: data.weight || 0,
                    height: data.height || 0,
                    fitnessGoal: data.fitnessGoal || 'weight_loss',
                    fitnessProfile: data.fitnessProfile || {
                        equipmentAccess: data.equipmentAccess || data.equipmentAvailable || 'bodyweight',
                        experienceLevel: data.workoutExperience || 'beginner',
                        fitnessGoals: data.fitnessGoals || (data.fitnessGoal ? [data.fitnessGoal] : []),
                        healthIssues: data.healthIssues || data.healthConstraints || [],
                        availableDays: data.availableDays || 3
                    },
                    progressSystem: data.progressSystem || {
                        currentLevel: data.level || 1,
                        currentXP: data.xp || 0,
                        xpToNextLevel: data.xpToNextLevel || 1000,
                        totalWorkoutsCompleted: data.totalWorkouts || 0,
                        unlockedExercises: data.unlockedExercises || []
                    },
                    workoutCapacity: data.workoutCapacity || {
                        bodyweight: { sets: 3, reps: 10 },
                        weighted: { sets: 3, reps: 8 }
                    },
                    workoutPlanId: data.workoutPlanId,
                    transformationPhotos: data.transformationPhotos || [],
                    level: data.level || 1,
                    xp: data.xp || 0,
                    totalWorkouts: data.totalWorkouts || 0,
                    createdAt: (data.createdAt?.toDate ? data.createdAt.toDate() : new Date()).toISOString(),
                    updatedAt: (data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()).toISOString(),
                    premiumExpiryDate: data.premiumExpiryDate?.toDate ? data.premiumExpiryDate.toDate().toISOString() : data.premiumExpiryDate,
                };

                // Add optional photoURL if it exists
                if (data.photoURL) {
                    profile.photoURL = data.photoURL;
                }


                return profile;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Validate a coupon code from Firestore
     */
    async validateCoupon(code: string): Promise<any> {
        try {
            const docRef = doc(db, 'coupons', code.toUpperCase());
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.active) {
                    return data;
                } else {
                    throw new Error('This coupon code is no longer active.');
                }
            } else {
                throw new Error('Invalid coupon code.');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Error validating coupon.');
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No authenticated user');
            }

            // Update Firestore document
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });

            // Fetch updated profile
            const updatedProfile = await this.getUserProfile(user.uid);

            if (!updatedProfile) {
                throw new Error('Failed to fetch updated profile');
            }

            return updatedProfile;
        } catch (error: any) {
            throw new Error('Failed to update profile');
        }
    }

    /**
     * Update user's last active timestamp
     */
    async updateLastActiveAt(): Promise<void> {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, {
                lastActiveAt: serverTimestamp(),
            });

        } catch (error) {
            console.error('Error updating last active timestamp:', error);
        }
    }

    /**
     * Upload profile photo to Firebase Storage
     */
    async uploadProfilePhoto(uri: string): Promise<string> {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user logged in');

            // blob conversion
            const response = await fetch(uri);
            const blob = await response.blob();

            // Create reference: profile_photos/UID
            const storageRef = ref(storage, `profile_photos/${user.uid}`);

            // Upload
            await uploadBytes(storageRef, blob);

            // Get URL
            const downloadURL = await getDownloadURL(storageRef);

            // Update profile
            await this.updateUserProfile({ photoURL: downloadURL });
            await firebaseUpdateProfile(user, { photoURL: downloadURL });

            return downloadURL;
        } catch (error: any) {
            throw new Error('Failed to upload photo: ' + error.message);
        }
    }


    /**
     * Get current Firebase user
     */
    getCurrentUser(): User | null {
        return auth.currentUser;
    }

    /**
     * Handle Firebase Auth errors
     */
    private handleAuthError(errorCode: string): string {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already registered';
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters';
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/invalid-credential':
                // This error means either user doesn't exist OR wrong password
                // For security, Firebase doesn't distinguish between them
                return 'Invalid email or password';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection';
            default:
                return 'An error occurred. Please try again';
        }
    }
}

export const authService = new AuthService();
