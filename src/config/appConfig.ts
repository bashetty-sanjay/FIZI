/**
 * Application Configuration
 * 
 * Central place for feature flags and app settings
 */

export const AppConfig = {
    /**
     * Feature Flags
     */
    features: {
        /**
         * Enable real pose detection using TensorFlow.js
         * 
         * Set to true ONLY when running in a native development build.
         * This will NOT work in Expo Go.
         * 
         * To enable:
         * 1. Run: npx expo install expo-dev-client
         * 2. Run: npx expo prebuild
         * 3. Build: npx expo run:android (or run:ios)
         * 4. Set this to true
         */
        enablePoseDetection: true,

        /**
         * Use local on-device pose detection instead of server
         * 
         * When true: Uses MediaPipe on the device (requires native build)
         * When false: Uses Python backend server (slower but works in Expo Go)
         */
        useLocalPoseDetection: false, // @thinksys library API mismatch - needs investigation

        /**
         * Show mock pose overlay for UI testing
         * Works without native build (for development/testing)
         */
        enableMockPoseOverlay: false,

        /**
         * Enable audio feedback during workouts
         */
        enableAudioFeedback: true,

        /**
         * Enable haptic/vibration feedback
         */
        enableHapticFeedback: false,

        /**
         * Enable AI-powered feedback using Groq
         */
        enableAIFeedback: false,
    },

    /**
     * Pose Detection Settings
     */
    poseDetection: {
        /**
         * Minimum confidence score for keypoint detection (0-1)
         */
        minKeypointScore: 0.3,

        /**
         * Frame rate for pose detection (lower = better performance)
         */
        detectionFPS: 15,

        /**
         * Image quality for camera capture (0-1)
         */
        imageQuality: 0.5,
    },

    /**
     * Workout Settings
     */
    workout: {
        /**
         * Default rest time between sets (seconds)
         */
        defaultRestTime: 60,

        /**
         * Minimum form score to count a valid rep (0-100)
         */
        minFormScoreForValidRep: 70,
    },

    /**
     * Feedback Settings
     */
    feedback: {
        /**
         * Minimum time between audio feedback (milliseconds)
         */
        audioThrottleMs: 3000,

        /**
         * Minimum time between haptic feedback (milliseconds)
         */
        hapticThrottleMs: 500,

        /**
         * Speech rate (0.5 = slow, 1.0 = normal, 1.5 = fast)
         */
        speechRate: 1.1,

        /**
         * Announce rep count every N reps (0 to disable)
         */
        announceEveryNReps: 5,
    },

    /**
     * API Settings
     */
    api: {
        /**
         * Backend URL
         * 
         * Production: "https://fizi-backend.onrender.com"
         * Local: "http://<YOUR_IP>:5001"
         */
        baseURL: "https://fizi-backend.onrender.com",
        // baseURL: "http://10.94.30.21:5001",
    },
};

export default AppConfig;
