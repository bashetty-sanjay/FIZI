/**
 * PoseDetectionService
 * 
 * Handles pose detection by sending frames to the Python backend (MediaPipe).
 * This replaces the on-device TensorFlow.js implementation.
 */

import { Alert } from 'react-native';
import { Pose, Keypoint } from '../types';
import AppConfig from '../config/appConfig';

// PRODUCTION: Using deployed backend on Render
// For local development, change to: "http://YOUR_LOCAL_IP:5001"
const POSE_API_URL = AppConfig.api.baseURL;

export interface BackendAnalysisResult {
    poses: Pose[];
    rep_count: number;
    stage: string | null;
    feedback: string[];
    form_score: number;
    isReady: boolean;
    error: string | null;
}

class PoseDetectionService {
    private isInitialized: boolean = false;
    private initializationError: string | null = null;

    /**
     * Check if the service is ready
     */
    get isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Get any initialization error
     */
    get error(): string | null {
        return this.initializationError;
    }

    /**
     * Initialize connection to backend (simple ping)
     */
    async initialize(): Promise<boolean> {
        try {

            const response = await fetch(`${POSE_API_URL}/health`);
            if (response.ok) {

                this.isInitialized = true;
                this.initializationError = null;
                return true;
            } else {
                console.warn('[PoseDetection] ❌ Backend returned error:', response.status);
                Alert.alert('Connection Error', `Cannot connect to AI Server at ${POSE_API_URL}\nStatus: ${response.status}`);
                throw new Error('Backend responded with error');
            }
        } catch (error: any) {
            console.warn(`[PoseDetection] ❌ Connection failed to ${POSE_API_URL}:`, error.message);
            Alert.alert('Connection Failed', `Cannot reach ${POSE_API_URL}\n\nCheck:\n1. Same WiFi?\n2. Server running?\n3. Firewall off?`);
            this.isInitialized = true; // Still allow detection attempts in case it's a transient ping failure
            return true;
        }
    }

    /**
     * Helper to fetch with exponential backoff
     */
    private async fetchWithRetry(url: string, options: any, retries: number = 2, delay: number = 500): Promise<Response> {
        try {
            const response = await fetch(url, options);
            if (!response.ok && retries > 0) {
                console.warn(`[PoseDetection] Request failed with status ${response.status}. Retrying in ${delay}ms... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retries - 1, delay * 2);
            }
            return response;
        } catch (error: any) {
            if (retries > 0) {
                console.warn(`[PoseDetection] Request failed: ${error.message}. Retrying in ${delay}ms... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retries - 1, delay * 2);
            }
            throw error;
        }
    }

    /**
     * Stream a frame to the backend without waiting for the full ML response.
     * @param base64Image - Base64 encoded image frame
     * @param exerciseId - The ID of the exercise being performed
     * @param sessionId - Unique id for this workout session
     * @param timestamp - The precise time the frame was captured
     * @returns boolean true if successfully queued
     */
    async streamFrame(base64Image: string, exerciseId: string, sessionId: string, timestamp: number): Promise<boolean> {
        if (!this.isInitialized) return false;

        try {
            // Fire and forget (don't use fetchWithRetry to keep it fast and non-blocking)
            fetch(`${POSE_API_URL}/stream-frame`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'development_key_123'
                },
                body: JSON.stringify({
                    image: base64Image,
                    exerciseId: exerciseId,
                    sessionId: sessionId,
                    timestamp: timestamp
                }),
            }).catch(e => console.warn('[PoseDetection] Failed to queue frame:', e.message));

            return true;

        } catch (error: any) {
            console.warn('[PoseDetection] streamFrame failed:', error.message);
            return false;
        }
    }

    /**
     * Finish the workout session and get the final results from the backend.
     * @param sessionId - Unique id for this workout session
     * @returns BackendAnalysisResult containing final workout stats
     */
    async finishWorkout(sessionId: string): Promise<BackendAnalysisResult> {
        // Default empty result
        const emptyResult: BackendAnalysisResult = {
            poses: [],
            rep_count: 0,
            stage: null,
            feedback: [],
            form_score: 0,
            isReady: this.isInitialized,
            error: null
        };

        if (!this.isInitialized) return emptyResult;

        try {
            const response = await this.fetchWithRetry(`${POSE_API_URL}/finish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'development_key_123'
                },
                body: JSON.stringify({
                    sessionId: sessionId
                }),
            }, 4, 2000); // 4 retries, start with 2s delay because high FPS processing takes more time

            if (!response.ok) return emptyResult;

            const data = await response.json();

            if (data.error) {
                return { ...emptyResult, error: data.error };
            }

            return {
                poses: [], // No poses returned in streaming mode
                rep_count: data.rep_count || 0,
                stage: null,
                feedback: data.feedback || [],
                form_score: data.form_score || 0,
                isReady: true,
                error: null
            };

        } catch (error: any) {
            console.warn('[PoseDetection] finishWorkout failed:', error.message);
            return emptyResult;
        }
    }


    /**
     * Reset stats for a specific exercise on the backend
     */
    async resetStats(exerciseId: string): Promise<boolean> {
        if (!this.isInitialized) return false;

        try {
            await fetch(`${POSE_API_URL}/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exerciseId }),
            });

            return true;
        } catch (error) {
            console.warn('[PoseDetection] Reset failed:', error);
            return false;
        }
    }

    /**
     * Clean up
     */
    async dispose(): Promise<void> {
        this.isInitialized = false;
    }
}

export const poseDetectionService = new PoseDetectionService();
