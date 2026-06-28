import { useState, useCallback, useRef, useEffect } from 'react';
import { CameraView } from 'expo-camera';
import { poseDetectionService, BackendAnalysisResult } from '../services/PoseDetectionService';
import { Pose } from '../types';
import AppConfig from '../config/appConfig';

interface SmartCameraResult {
    poses: Pose[];
    isDetecting: boolean;
    // Backend Stats
    repCount: number;
    stage: string | null;
    feedback: string[];
    formScore: number;
    resetStats: () => Promise<void>;
    finishWorkoutSession: () => Promise<BackendAnalysisResult | null>;
    isProcessingResults: boolean;
}

export const useSmartCamera = (
    isActive: boolean,
    cameraRef: React.RefObject<any>,
    exerciseId: string = 'push-ups'
): SmartCameraResult => {
    // State
    const [poses, setPoses] = useState<Pose[]>([]); // Will remain empty in streaming mode
    const [isDetecting, setIsDetecting] = useState(false);
    const [isProcessingResults, setIsProcessingResults] = useState(false);

    // Backend Stats State
    const [repCount, setRepCount] = useState(0);
    const [stage, setStage] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string[]>([]);
    const [formScore, setFormScore] = useState(0);

    // Refs for loop control (avoid state updates during capture)
    const isProcessingRef = useRef(false);
    const loopTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Use a ref so the loop ALWAYS reads the latest active state, even mid-capture
    const isActiveRef = useRef(false);
    // Unique ID for the current workout session
    const sessionIdRef = useRef<string>(Date.now().toString());

    // Keep isActiveRef in sync with the isActive prop
    useEffect(() => {
        isActiveRef.current = isActive;
        if (isActive) {
            sessionIdRef.current = Date.now().toString();
        }
    }, [isActive]);


    const runDetectionLoop = useCallback(async () => {
        // Use ref (not closure) so we always read the LATEST isActive value
        if (!isActiveRef.current || !cameraRef.current || isProcessingRef.current) {
            if (isActiveRef.current) {
                loopTimerRef.current = setTimeout(runDetectionLoop, 100);
            }
            return;
        }

        isProcessingRef.current = true;
        const startTime = Date.now();
        try {
            // 1. Capture Frame - Optimized for server upload speed
            const photo = await cameraRef.current.takePictureAsync({
                quality: AppConfig.poseDetection.imageQuality,
                base64: true,
                shutterSound: false,
                skipProcessing: true,
            });

            if (!photo || !photo.base64) return;

            // 2. Stream Frame to Backend Server (Fire and Forget)
            // Check ref again AFTER the async capture — workout may have stopped mid-capture
            if (AppConfig.features.enablePoseDetection && isActiveRef.current) {
                const base64 = photo.base64;
                poseDetectionService.streamFrame(base64, exerciseId, sessionIdRef.current, startTime);
            }
        } catch (err) {
            // Silently catch camera fast-capture errors
        } finally {
            isProcessingRef.current = false;
            // Only schedule next frame if still active
            if (isActiveRef.current) {
                // Calculate delay based on target FPS, accounting for processing time
                const targetInterval = 1000 / AppConfig.poseDetection.detectionFPS;
                const processingTime = Date.now() - startTime;
                const nextDelay = Math.max(10, targetInterval - processingTime);
                
                loopTimerRef.current = setTimeout(runDetectionLoop, nextDelay);
            }
        }
    }, [cameraRef, exerciseId]); // No longer depends on isActive — uses ref instead

    useEffect(() => {
        if (isActive) {
            setIsDetecting(true);
            setRepCount(0);
            setFeedback([]);
            setFormScore(0);

            // Initialize pose detection service
            poseDetectionService.initialize().then(() => {
                runDetectionLoop();
            });
        } else {
            setIsDetecting(false);
            // Clear any pending timer immediately
            if (loopTimerRef.current) {
                clearTimeout(loopTimerRef.current);
                loopTimerRef.current = null;
            }
        }

        return () => {
            if (loopTimerRef.current) {
                clearTimeout(loopTimerRef.current);
                loopTimerRef.current = null;
            }
        };
    }, [isActive, runDetectionLoop]);

    const finishWorkoutSession = useCallback(async () => {
        setIsProcessingResults(true);
        try {
            // Cooldown delay: Let the last streamed frames arrive at the server
            // before we ask for the final analytical summary.
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const result = await poseDetectionService.finishWorkout(sessionIdRef.current);
            setRepCount(result.rep_count);
            setFeedback(result.feedback);
            setFormScore(result.form_score);
            return result; // return the result so the caller gets fresh data
        } catch (e) {
            console.warn("Failed to finish workout session", e);
            setFeedback(["Failed to get results from server."]);
            return null;
        } finally {
            setIsProcessingResults(false);
        }
    }, [exerciseId]);

    const resetStats = useCallback(async () => {
        setRepCount(0);
        setStage(null);
        setFeedback([]);
        setFormScore(0);
        await poseDetectionService.resetStats(exerciseId);
    }, [exerciseId]);

    return {
        poses,
        isDetecting,
        repCount,
        stage,
        feedback,
        formScore,
        resetStats,
        finishWorkoutSession,
        isProcessingResults
    };
};
