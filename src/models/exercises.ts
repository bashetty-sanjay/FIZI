import { Exercise, EquipmentItem, MuscleGroup } from '../types';
import CARDIO_EXERCISES from './cardio_exercises';
import FLEXIBILITY_EXERCISES from './flexibility_exercises';
import PLYOMETRIC_EXERCISES from './plyometric_exercises';
import RECOVERY_EXERCISES from './recovery_exercises';

// =================================================================
// BODYWEIGHT ONLY EXERCISES (No Equipment Required)
// =================================================================

export const BODYWEIGHT_EXERCISES: Exercise[] = [
    {
        id: 'push-ups',
        name: 'pushup',
        displayName: 'Standard Push-up',
        category: 'strength',
        muscleGroups: ['chest', 'shoulders', 'arms' as any, 'core' as any],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        optionalEquipment: ['yoga_mat'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [5, 6, 7, 8, 11, 12, 13, 14, 15, 16],
        formThresholds: { minAngle: 70, maxAngle: 90 },
        description: 'A fundamental upper body exercise targeting chest, shoulders, and triceps.',
        instructions: [
            'Start in a high plank position with hands slightly wider than shoulders',
            'Keep your body in a straight line from head to heels',
            'Lower your body until chest nearly touches floor',
            'Push back up to starting position'
        ],
        tips: [
            'Keep neck neutral',
            'Engage glutes',
            'Breathe out on the push'
        ],
        commonMistakes: ['Sagging hips', 'Flaring elbows too wide', 'Not going deep enough'],
        caloriesPerRep: 0.5,
        progressionPath: ['bw-pushup-wide', 'bw-pushup-diamond'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/pushups-thumb.jpg',
        demonstrationVideo: 'https://videos.fizi.ai/exercises/pushups.mp4',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 60, max: 90, optimal: 75 }, { joint: 'right_elbow', min: 60, max: 90, optimal: 75 }] },
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: [
            {
                name: 'body_alignment',
                description: 'Keep body straight from shoulders to ankles',
                severity: 'error',
                checkFunction: (pose: any) => true,
                feedback: { visual: 'Keep your body straight', audio: 'Straighten your back and core' }
            }
        ]
    },
    {
        id: 'squats',
        name: 'squat',
        displayName: 'Bodyweight Squat',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 15,
        baseSets: 3,
        repIncrement: 3,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26],
        formThresholds: { minAngle: 80, maxAngle: 100 },
        description: 'Fundamental lower body movement building leg and glute strength.',
        instructions: [
            'Stand with feet shoulder-width apart',
            'Lower by bending knees and hips',
            'Keep chest up and back straight',
            'Go down until thighs parallel to ground',
            'Push through heels to retornar'
        ],
        commonMistakes: ['Knees caving inward', 'Heels lifting', 'Leaning far forward'],
        tips: ['Keep weight on heels', 'Push knees out', 'Look straight ahead'],
        caloriesPerRep: 0.4,
        thumbnailUrl: 'https://images.fizi.ai/exercises/squats-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_knee', min: 60, max: 90, optimal: 80 }, { joint: 'right_knee', min: 60, max: 90, optimal: 80 }] },
            { name: 'up', angleRanges: [{ joint: 'left_knee', min: 160, max: 180, optimal: 170 }, { joint: 'right_knee', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'plank',
        name: 'plank',
        displayName: 'Forearm Plank',
        category: 'strength',
        muscleGroups: ['core'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        optionalEquipment: ['yoga_mat'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 30,
        baseSets: 3,
        repIncrement: 10,
        setIncrement: 1,
        keypoints: [5, 6, 11, 12, 15, 16],
        formThresholds: {},
        description: 'Core stability exercise',
        instructions: [
            'Rest on forearms and toes',
            'Keep body in straight line from head to heels',
            'Engage core and glutes',
            'Hold position without sagging'
        ],
        commonMistakes: ['Hips sagging', 'Hips too high', 'Not engaging core'],
        tips: ['Squeeze glutes', 'Keep neck neutral', 'Breathe steadily'],
        caloriesPerRep: 0.1,
        thumbnailUrl: 'https://images.fizi.ai/exercises/plank-thumb.jpg',
        trackingMode: 'ai_timer',
        timerDuration: 30,
        stages: [{ name: 'hold', angleRanges: [{ joint: 'left_shoulder', min: 80, max: 100, optimal: 90 }], duration: 30 }],
        formChecks: []
    },
    {
        id: 'lunges',
        name: 'lunge',
        displayName: 'Forward Lunge',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26],
        formThresholds: { targetAngle: 90 },
        description: 'Unilateral leg strength builder',
        instructions: [
            'Step forward with one leg',
            'Lower hips until both knees at 90 degrees',
            'Front knee should be over ankle',
            'Push back to starting position'
        ],
        commonMistakes: ['Front knee past toes', 'Leaning forward', 'Not deep enough'],
        tips: ['Keep torso upright', 'Step far enough forward', 'Control the descent'],
        caloriesPerRep: 0.5,
        thumbnailUrl: 'https://images.fizi.ai/exercises/lunges-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_knee', min: 80, max: 100, optimal: 90 }, { joint: 'right_knee', min: 80, max: 100, optimal: 90 }] },
            { name: 'up', angleRanges: [{ joint: 'left_knee', min: 160, max: 180, optimal: 170 }, { joint: 'right_knee', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'glute-bridges',
        name: 'glute_bridge',
        displayName: 'Glute Bridge',
        category: 'strength',
        muscleGroups: ['legs', 'core'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        optionalEquipment: ['yoga_mat'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 15,
        baseSets: 3,
        repIncrement: 3,
        setIncrement: 1,
        keypoints: [11, 12, 23, 24, 25, 26],
        formThresholds: {},
        description: 'Hip extension exercise targeting glutes and hamstrings.',
        instructions: [
            'Lie on back with knees bent, feet flat on floor',
            'Push through heels to lift hips up',
            'Squeeze glutes at top',
            'Lower hips back down with control'
        ],
        tips: ['Keep core engaged', 'Don\'t arch lower back excessively', 'Squeeze glutes hard at top'],
        commonMistakes: ['Pushing through toes instead of heels', 'Overarching lower back', 'Not fully extending hips'],
        caloriesPerRep: 0.3,
        thumbnailUrl: 'https://images.fizi.ai/exercises/glute-bridge-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_hip', min: 40, max: 70, optimal: 55 }] },
            { name: 'up', angleRanges: [{ joint: 'left_hip', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'side-plank',
        name: 'side_plank',
        displayName: 'Side Plank',
        category: 'strength',
        muscleGroups: ['core'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        optionalEquipment: ['yoga_mat'],
        unlockLevel: 2,
        difficulty: 'intermediate',
        baseReps: 30,
        baseSets: 2,
        repIncrement: 10,
        setIncrement: 1,
        keypoints: [5, 6, 11, 12, 23, 24],
        formThresholds: {},
        description: 'Lateral core stability exercise.',
        instructions: [
            'Lie on side, prop up on forearm',
            'Lift hips off ground, forming straight line',
            'Hold position',
            'Keep hips stacked and body straight'
        ],
        tips: ['Don\'t let hips sag', 'Engage obliques', 'Keep neck neutral'],
        commonMistakes: ['Hips sagging', 'Rotating torso', 'Not keeping body straight'],
        caloriesPerRep: 0.12,
        thumbnailUrl: 'https://images.fizi.ai/exercises/side-plank-thumb.jpg',
        trackingMode: 'ai_timer',
        timerDuration: 30,
        stages: [{ name: 'hold', angleRanges: [{ joint: 'left_hip', min: 160, max: 200, optimal: 180 }], duration: 30 }],
        formChecks: []
    },
    {
        id: 'wall-sit',
        name: 'wall_sit',
        displayName: 'Wall Sit',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 30,
        baseSets: 3,
        repIncrement: 15,
        setIncrement: 1,
        keypoints: [11, 12, 23, 24, 25, 26],
        formThresholds: { targetAngle: 90 },
        description: 'Isometric leg strength exercise.',
        instructions: [
            'Stand with back against wall',
            'Slide down until knees at 90 degrees',
            'Hold position, back flat against wall',
            'Keep knees over ankles'
        ],
        tips: ['Keep back flat on wall', 'Distribute weight evenly', 'Breathe steadily'],
        commonMistakes: ['Knees too far forward', 'Not going deep enough', 'Arching back'],
        caloriesPerRep: 0.08,
        thumbnailUrl: 'https://images.fizi.ai/exercises/wall-sit-thumb.jpg',
        trackingMode: 'ai_timer',
        timerDuration: 30,
        stages: [{ name: 'hold', angleRanges: [{ joint: 'left_knee', min: 80, max: 100, optimal: 90 }], duration: 30 }],
        formChecks: []
    },
    {
        id: 'tricep-dips',
        name: 'tricep_dips',
        displayName: 'Tricep Dips (Bench/Chair)',
        category: 'strength',
        muscleGroups: ['arms', 'shoulders'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        unlockLevel: 2,
        difficulty: 'intermediate',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14, 15, 16],
        formThresholds: { minAngle: 80, maxAngle: 100 },
        description: 'Bodyweight tricep exercise using bench or chair.',
        instructions: [
            'Hands on bench behind you, fingers forward',
            'Extend legs forward, heels on ground',
            'Lower body by bending elbows to 90 degrees',
            'Push back up to starting position'
        ],
        tips: ['Keep elbows pointing back', 'Don\'t flare elbows out', 'Control the descent'],
        commonMistakes: ['Elbows flaring out', 'Going too deep', 'Using shoulders instead of triceps'],
        caloriesPerRep: 0.4,
        thumbnailUrl: 'https://images.fizi.ai/exercises/tricep-dips-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 80, max: 100, optimal: 90 }] },
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'bird-dog',
        name: 'bird_dog',
        displayName: 'Bird Dog',
        category: 'strength',
        muscleGroups: ['core', 'back'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        optionalEquipment: ['yoga_mat'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14, 23, 24, 25, 26],
        formThresholds: {},
        description: 'Core stability and balance exercise.',
        instructions: [
            'Start on hands and knees',
            'Extend right arm forward and left leg back',
            'Keep back flat and core engaged',
            'Hold briefly, then switch sides'
        ],
        tips: ['Keep hips level', 'Don\'t arch back', 'Move slowly with control'],
        commonMistakes: ['Rotating hips', 'Arching back', 'Moving too fast'],
        caloriesPerRep: 0.25,
        thumbnailUrl: 'https://images.fizi.ai/exercises/bird-dog-thumb.jpg',
        trackingMode: 'ai_timer',
        timerDuration: 30,
        stages: [
            { name: 'hold', angleRanges: [{ joint: 'left_shoulder', min: 140, max: 180, optimal: 160 }], duration: 5 }
        ],
        formChecks: []
    },
    {
        id: 'calf-raises',
        name: 'calf_raise',
        displayName: 'Standing Calf Raises',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 20,
        baseSets: 3,
        repIncrement: 5,
        setIncrement: 1,
        keypoints: [23, 24, 25, 26],
        formThresholds: {},
        description: 'Calf muscle isolation exercise.',
        instructions: [
            'Stand with feet hip-width apart',
            'Rise up onto balls of feet',
            'Squeeze calves at top',
            'Lower heels back down'
        ],
        tips: ['Full range of motion', 'Pause at top', 'Control the descent'],
        commonMistakes: ['Not going high enough', 'Bouncing', 'Rushing reps'],
        caloriesPerRep: 0.15,
        thumbnailUrl: 'https://images.fizi.ai/exercises/calf-raises-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_knee', min: 170, max: 200, optimal: 180 }] },
            { name: 'up', angleRanges: [{ joint: 'left_knee', min: 170, max: 200, optimal: 180 }] }
        ],
        formChecks: []
    },
    {
        id: 'superman',
        name: 'superman',
        displayName: 'Superman Hold',
        category: 'strength',
        muscleGroups: ['back', 'core'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        optionalEquipment: ['yoga_mat'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 30,
        baseSets: 3,
        repIncrement: 10,
        setIncrement: 1,
        keypoints: [5, 6, 11, 12, 23, 24, 25, 26],
        formThresholds: {},
        description: 'Lower back and posterior chain strengthening.',
        instructions: [
            'Lie face down on floor',
            'Extend arms overhead',
            'Simultaneously lift arms, chest, and legs off ground',
            'Hold for specified duration'
        ],
        tips: ['Keep neck neutral', 'Squeeze glutes', 'Don\'t strain neck'],
        commonMistakes: ['Lifting head too high', 'Not engaging glutes', 'Holding breath'],
        caloriesPerRep: 0.1,
        thumbnailUrl: 'https://images.fizi.ai/exercises/superman-thumb.jpg',
        trackingMode: 'ai_timer',
        timerDuration: 20,
        stages: [{ name: 'hold', angleRanges: [{ joint: 'left_hip', min: 160, max: 200, optimal: 180 }], duration: 10 }],
        formChecks: []
    },
    {
        id: 'bicycle-crunches',
        name: 'bicycle_crunch',
        displayName: 'Bicycle Crunches',
        category: 'strength',
        muscleGroups: ['core'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        optionalEquipment: ['yoga_mat'],
        unlockLevel: 2,
        difficulty: 'intermediate',
        baseReps: 20,
        baseSets: 3,
        repIncrement: 5,
        setIncrement: 1,
        keypoints: [5, 6, 11, 12, 23, 24, 25, 26],
        formThresholds: {},
        description: 'Dynamic ab exercise targeting obliques.',
        instructions: [
            'Lie on back, hands behind head',
            'Lift shoulders and legs off ground',
            'Bring right elbow to left knee while extending right leg',
            'Alternate sides in cycling motion'
        ],
        tips: ['Keep lower back pressed to floor', 'Twist from torso, not neck', 'Controlled movement'],
        commonMistakes: ['Pulling on neck', 'Rushing through reps', 'Not twisting fully'],
        caloriesPerRep: 0.2,
        thumbnailUrl: 'https://images.fizi.ai/exercises/bicycle-crunches-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'right', angleRanges: [{ joint: 'right_knee', min: 60, max: 90, optimal: 75 }] },
            { name: 'left', angleRanges: [{ joint: 'left_knee', min: 60, max: 90, optimal: 75 }] }
        ],
        formChecks: []
    },
    {
        id: 'reverse-lunges',
        name: 'reverse_lunge',
        displayName: 'Reverse Lunge',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 12,
        baseSets: 3,
        repIncrement: 3,
        setIncrement: 1,
        keypoints: [11, 12, 23, 24, 25, 26],
        formThresholds: { targetAngle: 90 },
        description: 'Lunge variation stepping backward for more control.',
        instructions: [
            'Stand with feet hip-width apart',
            'Step backward with one leg',
            'Lower until both knees at 90 degrees',
            'Push through front heel to return'
        ],
        tips: ['Keep torso upright', 'Front knee stays over ankle', 'Control the descent'],
        commonMistakes: ['Leaning forward', 'Front knee collapsing inward', 'Not stepping back far enough'],
        caloriesPerRep: 0.45,
        thumbnailUrl: 'https://images.fizi.ai/exercises/reverse-lunge-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_knee', min: 80, max: 100, optimal: 90 }] },
            { name: 'up', angleRanges: [{ joint: 'left_knee', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'pike-pushups',
        name: 'pike_pushup',
        displayName: 'Pike Push-ups',
        category: 'strength',
        muscleGroups: ['shoulders', 'arms'],
        equipmentRequired: 'bodyweight',
        requiredEquipment: [],
        optionalEquipment: ['yoga_mat'],
        unlockLevel: 3,
        difficulty: 'intermediate',
        baseReps: 8,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [5, 6, 11, 12, 13, 14, 15, 16],
        formThresholds: { minAngle: 70, maxAngle: 90 },
        description: 'Shoulder-focused push-up variation.',
        instructions: [
            'Start in downward dog position (hips high)',
            'Bend elbows to lower head toward floor',
            'Keep hips high throughout',
            'Push back up to starting position'
        ],
        tips: ['Keep body in inverted V shape', 'Lower head between hands', 'Don\'t let hips drop'],
        commonMistakes: ['Hips dropping', 'Not going deep enough', 'Moving forward instead of down'],
        caloriesPerRep: 0.6,
        thumbnailUrl: 'https://images.fizi.ai/exercises/pike-pushups-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 70, max: 90, optimal: 80 }] },
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    }
];

// =================================================================
// DUMBBELL EXERCISES
// =================================================================

export const DUMBBELL_EXERCISES: Exercise[] = [
    {
        id: 'bicep-curls',
        name: 'bicep_curl',
        displayName: 'Dumbbell Bicep Curl',
        category: 'strength',
        muscleGroups: ['arms'],
        equipmentRequired: 'home',
        requiredEquipment: ['dumbbells'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 12,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [13, 14, 15, 16],
        formThresholds: { targetAngle: 45 },
        description: 'Isolated bicep builder',
        instructions: [
            'Stand with dumbbells at sides',
            'Keep elbows stationary at sides',
            'Curl weights up to shoulders',
            'Squeeze at top, lower with control'
        ],
        commonMistakes: ['Swinging weights', 'Moving elbows', 'Using momentum'],
        tips: ['Keep elbows pinned', 'Focus on squeeze', 'Control eccentric'],
        caloriesPerRep: 0.4,
        thumbnailUrl: 'https://images.fizi.ai/exercises/bicep-curls-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 30, max: 50, optimal: 40 }, { joint: 'right_elbow', min: 30, max: 50, optimal: 40 }] },
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'db_shoulder_press',
        name: 'shoulder_press',
        displayName: 'Dumbbell Shoulder Press',
        category: 'strength',
        muscleGroups: ['shoulders', 'arms'],
        equipmentRequired: 'home',
        requiredEquipment: ['dumbbells'],
        optionalEquipment: ['bench'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14, 15, 16],
        formThresholds: {},
        description: 'Overhead pressing for shoulders',
        instructions: [
            'Start with dumbbells at shoulder height',
            'Press weights overhead until arms extended',
            'Lower with control back to shoulders'
        ],
        commonMistakes: ['Arching back', 'Not full extension', 'Using legs'],
        tips: ['Keep core tight', 'Press slightly back', 'Full lockout'],
        caloriesPerRep: 0.6,
        thumbnailUrl: 'https://images.fizi.ai/exercises/db-press-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [{ name: 'press', angleRanges: [{ joint: 'left_shoulder', min: 160, max: 180, optimal: 170 }] }],
        formChecks: []
    },
    {
        id: 'db_hammer_curl',
        name: 'hammer_curl',
        displayName: 'Dumbbell Hammer Curl',
        category: 'strength',
        muscleGroups: ['arms'],
        equipmentRequired: 'home',
        requiredEquipment: ['dumbbells'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 12,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [13, 14, 15, 16],
        description: 'Neutral grip bicep and forearm builder',
        instructions: [
            'Stand with dumbbells at sides, palms facing inward',
            'Keep elbows pinned at sides',
            'Curl weights up maintaining neutral grip',
            'Squeeze at top, lower with control'
        ],
        tips: ['Keep wrists neutral', 'Don\'t swing', 'Focus on forearms and biceps'],
        commonMistakes: ['Rotating wrists', 'Using momentum', 'Moving elbows'],
        caloriesPerRep: 0.4,
        thumbnailUrl: 'https://images.fizi.ai/exercises/hammer-curls-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 30, max: 50, optimal: 40 }, { joint: 'right_elbow', min: 30, max: 50, optimal: 40 }] },
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'db_tricep_extension',
        name: 'tricep_extension',
        displayName: 'Dumbbell Overhead Tricep Extension',
        category: 'strength',
        muscleGroups: ['arms'],
        equipmentRequired: 'home',
        requiredEquipment: ['dumbbells'],
        unlockLevel: 2,
        difficulty: 'beginner',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [13, 14, 15, 16],
        description: 'Overhead tricep isolation',
        instructions: [
            'Hold dumbbell overhead with both hands',
            'Keep elbows close to head',
            'Lower weight behind head',
            'Extend back to lockout'
        ],
        tips: ['Keep elbows in', 'Full stretch at bottom', 'Control the weight'],
        commonMistakes: ['Elbows flaring out', 'Arching back', 'Using too much weight'],
        caloriesPerRep: 0.4,
        thumbnailUrl: 'https://images.fizi.ai/exercises/db-tricep-extension-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 60, max: 90, optimal: 75 }, { joint: 'right_elbow', min: 60, max: 90, optimal: 75 }] },
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    }
];

// =================================================================
// RESISTANCE BAND EXERCISES
// =================================================================

export const RESISTANCE_BAND_EXERCISES: Exercise[] = [
    {
        id: 'rb_row',
        name: 'row',
        displayName: 'Resistance Band Row',
        category: 'strength',
        muscleGroups: ['back'],
        equipmentRequired: 'home',
        requiredEquipment: ['resistance_bands'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 15,
        baseSets: 3,
        repIncrement: 3,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14],
        description: 'Back thickness with constant tension',
        instructions: [
            'Anchor band at chest height',
            'Pull handles to sides of torso',
            'Squeeze shoulder blades together',
            'Control return maintaining tension'
        ],
        tips: ['Think elbows back', 'Pause at contraction', 'Keep chest up'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/rb-row-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'pulled', angleRanges: [{ joint: 'left_elbow', min: 70, max: 100, optimal: 85 }, { joint: 'right_elbow', min: 70, max: 100, optimal: 85 }] },
            { name: 'extended', angleRanges: [{ joint: 'left_elbow', min: 150, max: 180, optimal: 165 }, { joint: 'right_elbow', min: 150, max: 180, optimal: 165 }] }
        ],
        formChecks: []
    },
    {
        id: 'rb_chest_press',
        name: 'chest_press',
        displayName: 'Resistance Band Chest Press',
        category: 'strength',
        muscleGroups: ['chest', 'arms'],
        equipmentRequired: 'home',
        requiredEquipment: ['resistance_bands'],
        unlockLevel: 2,
        difficulty: 'beginner',
        baseReps: 12,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14],
        description: 'Chest pressing with bands',
        instructions: [
            'Anchor band behind back',
            'Press handles forward',
            'Fully extend arms',
            'Control return'
        ],
        tips: ['Keep tension throughout', 'Squeeze chest', 'Control eccentric'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/rb-press-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'retracted', angleRanges: [{ joint: 'left_elbow', min: 70, max: 100, optimal: 85 }, { joint: 'right_elbow', min: 70, max: 100, optimal: 85 }] },
            { name: 'extended', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    }
];

// =================================================================
// PULL-UP BAR EXERCISES
// =================================================================

export const PULLUP_BAR_EXERCISES: Exercise[] = [
    {
        id: 'pb_pullup_standard',
        name: 'pullup',
        displayName: 'Standard Pull-up',
        category: 'strength',
        muscleGroups: ['back', 'arms'],
        equipmentRequired: 'home',
        requiredEquipment: ['pull_up_bar'],
        unlockLevel: 4,
        difficulty: 'intermediate',
        baseReps: 6,
        baseSets: 3,
        repIncrement: 1,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14],
        description: 'Classic back builder',
        instructions: [
            'Hang from bar, hands shoulder-width',
            'Pull up until chin over bar',
            'Lower with control to full hang'
        ],
        tips: ['Dead hang at bottom', 'Lead with chest', 'Squeeze lats'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/pullups-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [],
        formChecks: []
    }
];

// =================================================================
// KETTLEBELL EXERCISES
// =================================================================

export const KETTLEBELL_EXERCISES: Exercise[] = [
    {
        id: 'kb_swing',
        name: 'swing',
        displayName: 'Kettlebell Swing',
        category: 'strength',
        muscleGroups: ['legs', 'back', 'core'],
        equipmentRequired: 'home',
        requiredEquipment: ['kettlebells'],
        unlockLevel: 2,
        difficulty: 'intermediate',
        baseReps: 15,
        baseSets: 3,
        repIncrement: 3,
        setIncrement: 1,
        keypoints: [23, 24, 11, 12],
        description: 'Explosive hip hinge movement',
        instructions: [
            'Hinge at hips with kettlebell',
            'Explosive hip drive swings bell up',
            'Let momentum carry to chest height',
            'Control descent into next rep'
        ],
        tips: ['Hip snap is key', 'Arms are ropes', 'Plank at top'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/kb-swing-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_hip', min: 30, max: 70, optimal: 50 }, { joint: 'right_hip', min: 30, max: 70, optimal: 50 }] },
            { name: 'up', angleRanges: [{ joint: 'left_hip', min: 160, max: 180, optimal: 170 }, { joint: 'right_hip', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'kb_snatch',
        name: 'snatch',
        displayName: 'Kettlebell Snatch',
        category: 'strength',
        muscleGroups: ['fullbody', 'shoulders'],
        equipmentRequired: 'home',
        requiredEquipment: ['kettlebells'],
        unlockLevel: 6,
        difficulty: 'advanced',
        baseReps: 8,
        baseSets: 3,
        repIncrement: 1,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14, 23, 24],
        description: 'Explosive overhead movement',
        instructions: [
            'Start like swing',
            'Explosive hip drive',
            'Pull bell overhead in one motion',
            'Punch through at top'
        ],
        tips: ['Hip power', 'Fast under bell', 'Soft catch overhead'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/kb-snatch-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_hip', min: 30, max: 70, optimal: 50 }] },
            { name: 'overhead', angleRanges: [{ joint: 'left_shoulder', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    }
];

// =================================================================
// BARBELL EXERCISES
// =================================================================

export const BARBELL_EXERCISES: Exercise[] = [
    {
        id: 'bb_squat',
        name: 'squat',
        displayName: 'Barbell Back Squat',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'gym',
        requiredEquipment: ['barbell', 'squat_rack'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 8,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [23, 24, 25, 26, 11, 12],
        description: 'King of leg exercises',
        instructions: [
            'Bar on upper back/traps',
            'Unrack and step back',
            'Squat to parallel or below',
            'Drive through heels to stand'
        ],
        tips: ['Break at knees and hips together', 'Big breath and brace', 'Push knees out'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/bb-squat-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_knee', min: 60, max: 100, optimal: 80 }, { joint: 'right_knee', min: 60, max: 100, optimal: 80 }] },
            { name: 'up', angleRanges: [{ joint: 'left_knee', min: 160, max: 180, optimal: 170 }, { joint: 'right_knee', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'bb_bench_press',
        name: 'bench_press',
        displayName: 'Barbell Bench Press',
        category: 'strength',
        muscleGroups: ['chest', 'shoulders', 'arms'],
        equipmentRequired: 'gym',
        requiredEquipment: ['barbell', 'bench'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 8,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14, 15, 16],
        description: 'Primary chest developer',
        instructions: [
            'Lie on bench, feet flat',
            'Grip slightly wider than shoulders',
            'Lower bar to mid-chest',
            'Press to lockout'
        ],
        tips: ['Leg drive', 'Touch and press', 'Control eccentric'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/bb-bench-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 70, max: 100, optimal: 85 }, { joint: 'right_elbow', min: 70, max: 100, optimal: 85 }] },
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'bb_deadlift',
        name: 'deadlift',
        displayName: 'Barbell Deadlift',
        category: 'strength',
        muscleGroups: ['back', 'legs', 'core'],
        equipmentRequired: 'gym',
        requiredEquipment: ['barbell'],
        unlockLevel: 3,
        difficulty: 'intermediate',
        baseReps: 6,
        baseSets: 3,
        repIncrement: 1,
        setIncrement: 1,
        keypoints: [11, 12, 23, 24, 25, 26],
        description: 'King of posterior chain exercises',
        instructions: [
            'Feet hip-width, bar over mid-foot',
            'Bend and grip bar outside knees',
            'Chest up, back flat, brace core',
            'Drive through floor to stand tall',
            'Lower with control, keep bar close'
        ],
        tips: ['Bar stays close to body', 'Push floor away', 'Brace hard', 'Neutral spine'],
        commonMistakes: ['Rounded back', 'Bar too far forward', 'Not using legs', 'Hyperextending at top'],
        caloriesPerRep: 1.2,
        thumbnailUrl: 'https://images.fizi.ai/exercises/bb-deadlift-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_knee', min: 60, max: 100, optimal: 80 }, { joint: 'right_knee', min: 60, max: 100, optimal: 80 }] },
            { name: 'up', angleRanges: [{ joint: 'left_knee', min: 160, max: 180, optimal: 175 }, { joint: 'right_knee', min: 160, max: 180, optimal: 175 }] }
        ],
        formChecks: []
    },
    {
        id: 'bb_bicep_curl',
        name: 'bicep_curl',
        displayName: 'Barbell Bicep Curl',
        category: 'strength',
        muscleGroups: ['arms'],
        equipmentRequired: 'gym',
        requiredEquipment: ['barbell'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [13, 14, 15, 16],
        description: 'Barbell bicep mass builder',
        instructions: [
            'Stand with barbell, hands shoulder-width',
            'Elbows pinned at sides',
            'Curl bar up to shoulders',
            'Squeeze biceps at top',
            'Lower with control'
        ],
        tips: ['No swinging', 'Keep elbows stationary', 'Full range of motion'],
        commonMistakes: ['Using momentum', 'Elbows moving forward', 'Partial reps'],
        caloriesPerRep: 0.5,
        thumbnailUrl: 'https://images.fizi.ai/exercises/bb-curl-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 30, max: 50, optimal: 40 }, { joint: 'right_elbow', min: 30, max: 50, optimal: 40 }] },
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'bb_behind_back_curl',
        name: 'behind_back_curl',
        displayName: 'Behind the Back Barbell Curl',
        category: 'strength',
        muscleGroups: ['arms'],
        equipmentRequired: 'gym',
        requiredEquipment: ['barbell'],
        unlockLevel: 4,
        difficulty: 'intermediate',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [13, 14, 15, 16],
        description: 'Bicep exercise with constant tension',
        instructions: [
            'Hold barbell behind back, palms facing away',
            'Stand upright with bar resting on glutes',
            'Curl bar up as high as possible',
            'Squeeze biceps hard',
            'Lower with control'
        ],
        tips: ['Use lighter weight', 'Focus on peak contraction', 'Keep body stable'],
        commonMistakes: ['Using too much weight', 'Leaning forward', 'Incomplete range'],
        caloriesPerRep: 0.4,
        thumbnailUrl: 'https://images.fizi.ai/exercises/bb-behind-curl-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 40, max: 70, optimal: 55 }, { joint: 'right_elbow', min: 40, max: 70, optimal: 55 }] },
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'bb_t_bar_row',
        name: 't_bar_row',
        displayName: 'T-Bar Row',
        category: 'strength',
        muscleGroups: ['back', 'arms'],
        equipmentRequired: 'gym',
        requiredEquipment: ['barbell'],
        unlockLevel: 3,
        difficulty: 'intermediate',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14],
        description: 'Thick back builder with barbell',
        instructions: [
            'Straddle barbell, bend at hips',
            'Grip bar or V-handle attachment',
            'Pull bar to chest keeping back flat',
            'Squeeze shoulder blades together',
            'Lower with control'
        ],
        tips: ['Keep back flat', 'Pull with elbows', 'Drive elbows back'],
        commonMistakes: ['Rounding back', 'Using too much leg drive', 'Not full range'],
        caloriesPerRep: 0.7,
        thumbnailUrl: 'https://images.fizi.ai/exercises/t-bar-row-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'extended', angleRanges: [{ joint: 'left_elbow', min: 150, max: 180, optimal: 165 }, { joint: 'right_elbow', min: 150, max: 180, optimal: 165 }] },
            { name: 'pulled', angleRanges: [{ joint: 'left_elbow', min: 60, max: 90, optimal: 75 }, { joint: 'right_elbow', min: 60, max: 90, optimal: 75 }] }
        ],
        formChecks: []
    }
];

// =================================================================
// CABLE MACHINE EXERCISES
// =================================================================

export const CABLE_EXERCISES: Exercise[] = [
    {
        id: 'cable_lat_pulldown',
        name: 'pulldown',
        displayName: 'Lat Pulldown',
        category: 'strength',
        muscleGroups: ['back', 'arms'],
        equipmentRequired: 'gym',
        requiredEquipment: ['cable_machine'],
        unlockLevel: 2,
        difficulty: 'beginner',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14],
        description: 'Vertical pulling for lats',
        instructions: [
            'Wide grip on bar',
            'Pull down to upper chest',
            'Squeeze shoulder blades down',
            'Control return'
        ],
        tips: ['Lead with elbows', 'Chest up', 'Slow eccentric'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/cable-pulldown-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'extended', angleRanges: [{ joint: 'left_elbow', min: 150, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 150, max: 180, optimal: 170 }] },
            { name: 'pulled', angleRanges: [{ joint: 'left_elbow', min: 70, max: 100, optimal: 85 }, { joint: 'right_elbow', min: 70, max: 100, optimal: 85 }] }
        ],
        formChecks: []
    },
    {
        id: 'cable_tricep_pushdown_rope',
        name: 'tricep_pushdown',
        displayName: 'Cable Tricep Rope Pushdown',
        category: 'strength',
        muscleGroups: ['arms'],
        equipmentRequired: 'gym',
        requiredEquipment: ['cable_machine'],
        unlockLevel: 2,
        difficulty: 'beginner',
        baseReps: 12,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [13, 14, 15, 16],
        description: 'Tricep isolation with rope for better range',
        instructions: [
            'Stand facing cable machine with rope attachment',
            'Elbows pinned at sides',
            'Push rope down to full extension',
            'Split rope at bottom for peak contraction',
            'Control return'
        ],
        tips: ['Keep elbows stationary', 'Full extension', 'Squeeze triceps', 'Split rope at bottom'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/cable-tricep-rope-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 80, max: 110, optimal: 95 }, { joint: 'right_elbow', min: 80, max: 110, optimal: 95 }] },
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'cable_tricep_overhead',
        name: 'tricep_overhead',
        displayName: 'Cable Rope Overhead Extension',
        category: 'strength',
        muscleGroups: ['arms'],
        equipmentRequired: 'gym',
        requiredEquipment: ['cable_machine'],
        unlockLevel: 3,
        difficulty: 'intermediate',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [13, 14, 15, 16],
        description: 'Overhead tricep extension with rope',
        instructions: [
            'Face away from cable machine',
            'Hold rope overhead with both hands',
            'Keep elbows pointed forward',
            'Extend arms fully overhead',
            'Lower rope behind head with control'
        ],
        tips: ['Keep elbows stable', 'Full stretch at bottom', 'Squeeze at top'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/cable-overhead-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 60, max: 90, optimal: 75 }, { joint: 'right_elbow', min: 60, max: 90, optimal: 75 }] },
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'cable_seated_row',
        name: 'seated_row',
        displayName: 'Cable Seated Row',
        category: 'strength',
        muscleGroups: ['back', 'arms'],
        equipmentRequired: 'gym',
        requiredEquipment: ['cable_machine'],
        unlockLevel: 2,
        difficulty: 'beginner',
        baseReps: 12,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14],
        description: 'Horizontal pulling for back thickness',
        instructions: [
            'Sit on bench facing cable machine',
            'Feet on platform, knees slightly bent',
            'Pull handle to lower chest/abdomen',
            'Squeeze shoulder blades together',
            'Control return keeping tension'
        ],
        tips: ['Keep back straight', 'Pull elbows back', 'Don\'t lean back excessively'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/cable-seated-row-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'extended', angleRanges: [{ joint: 'left_elbow', min: 150, max: 180, optimal: 165 }, { joint: 'right_elbow', min: 150, max: 180, optimal: 165 }] },
            { name: 'pulled', angleRanges: [{ joint: 'left_elbow', min: 70, max: 100, optimal: 85 }, { joint: 'right_elbow', min: 70, max: 100, optimal: 85 }] }
        ],
        formChecks: []
    },
    {
        id: 'cable_lat_pulldown_short_bar',
        name: 'pulldown_short',
        displayName: 'Lat Pulldown (Close Grip)',
        category: 'strength',
        muscleGroups: ['back', 'arms'],
        equipmentRequired: 'gym',
        requiredEquipment: ['cable_machine'],
        unlockLevel: 2,
        difficulty: 'beginner',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [11, 12, 13, 14],
        description: 'Close grip pulldown targeting lower lats',
        instructions: [
            'Use close grip bar attachment',
            'Pull down to upper chest',
            'Squeeze lower lats',
            'Control return with full stretch'
        ],
        tips: ['Lead with elbows', 'Focus on lower lat squeeze', 'Slow eccentric'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/cable-pulldown-close-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'extended', angleRanges: [{ joint: 'left_elbow', min: 150, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 150, max: 180, optimal: 170 }] },
            { name: 'pulled', angleRanges: [{ joint: 'left_elbow', min: 70, max: 100, optimal: 85 }, { joint: 'right_elbow', min: 70, max: 100, optimal: 85 }] }
        ],
        formChecks: []
    }
];

// =================================================================
// LEG PRESS MACHINE EXERCISES
// =================================================================

export const LEG_MACHINE_EXERCISES: Exercise[] = [
    {
        id: 'machine_leg_press',
        name: 'leg_press',
        displayName: 'Leg Press',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'gym',
        requiredEquipment: ['leg_press_machine'],
        unlockLevel: 2,
        difficulty: 'beginner',
        baseReps: 12,
        baseSets: 3,
        repIncrement: 3,
        setIncrement: 1,
        keypoints: [23, 24, 25, 26],
        description: 'Quad-focused leg builder',
        instructions: [
            'Place feet shoulder-width on platform',
            'Lower weight with control',
            'Stop before lower back lifts',
            'Press through full foot'
        ],
        tips: ['Keep lower back down', 'Full range', 'Control the weight'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/leg-press-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [],
        formChecks: []
    },
    {
        id: 'machine_leg_extension',
        name: 'leg_extension',
        displayName: 'Leg Extension',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'gym',
        requiredEquipment: ['leg_extension_machine'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 12,
        baseSets: 3,
        repIncrement: 3,
        setIncrement: 1,
        keypoints: [23, 24, 25, 26],
        description: 'Quad isolation exercise',
        instructions: [
            'Sit on machine, adjust pad to ankles',
            'Hold handles for stability',
            'Extend legs to full lockout',
            'Squeeze quads at top',
            'Lower with control'
        ],
        tips: ['Full extension', 'Pause at top', 'Control the negative'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/leg-extension-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_knee', min: 80, max: 100, optimal: 90 }, { joint: 'right_knee', min: 80, max: 100, optimal: 90 }] },
            { name: 'up', angleRanges: [{ joint: 'left_knee', min: 160, max: 180, optimal: 175 }, { joint: 'right_knee', min: 160, max: 180, optimal: 175 }] }
        ],
        formChecks: []
    },
    {
        id: 'machine_hack_squat',
        name: 'hack_squat',
        displayName: 'Hack Squat',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'gym',
        requiredEquipment: ['hack_squat_machine'],
        unlockLevel: 3,
        difficulty: 'intermediate',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [23, 24, 25, 26],
        description: 'Quad-focused squat variation',
        instructions: [
            'Stand on platform with back against pad',
            'Feet shoulder-width, slightly forward',
            'Release safety and squat down',
            'Go deep while keeping heels down',
            'Drive through feet to stand'
        ],
        tips: ['Keep back against pad', 'Push through whole foot', 'Control descent'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/hack-squat-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'down', angleRanges: [{ joint: 'left_knee', min: 60, max: 90, optimal: 75 }, { joint: 'right_knee', min: 60, max: 90, optimal: 75 }] },
            { name: 'up', angleRanges: [{ joint: 'left_knee', min: 160, max: 180, optimal: 170 }, { joint: 'right_knee', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    },
    {
        id: 'machine_tricep_press',
        name: 'tricep_press',
        displayName: 'Tricep Press Machine',
        category: 'strength',
        muscleGroups: ['arms'],
        equipmentRequired: 'gym',
        requiredEquipment: ['tricep_machine'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 12,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [13, 14, 15, 16],
        description: 'Machine-guided tricep extension',
        instructions: [
            'Sit on machine, adjust seat height',
            'Grip handles at shoulder height',
            'Press down to full extension',
            'Control return to start'
        ],
        tips: ['Keep elbows stable', 'Full lockout', 'Slow eccentric'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/tricep-machine-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [
            { name: 'up', angleRanges: [{ joint: 'left_elbow', min: 80, max: 110, optimal: 95 }, { joint: 'right_elbow', min: 80, max: 110, optimal: 95 }] },
            { name: 'down', angleRanges: [{ joint: 'left_elbow', min: 160, max: 180, optimal: 170 }, { joint: 'right_elbow', min: 160, max: 180, optimal: 170 }] }
        ],
        formChecks: []
    }
];

// =================================================================
// SMITH MACHINE EXERCISES
// =================================================================

export const SMITH_MACHINE_EXERCISES: Exercise[] = [
    {
        id: 'smith_squat',
        name: 'squat',
        displayName: 'Smith Machine Squat',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'gym',
        requiredEquipment: ['smith_machine'],
        unlockLevel: 1,
        difficulty: 'beginner',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [23, 24, 25, 26],
        description: 'Guided squat movement',
        instructions: [
            'Bar on upper back',
            'Feet slightly forward',
            'Squat down guided by rails',
            'Drive up to start'
        ],
        tips: ['Feet forward for balance', 'Use safety catches', 'Control movement'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/smith-squat-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [],
        formChecks: []
    }
];

// =================================================================
// BENCH EXERCISES
// =================================================================

export const BENCH_EXERCISES: Exercise[] = [
    {
        id: 'bench_bulgarian_split_squat',
        name: 'split_squat',
        displayName: 'Bulgarian Split Squat',
        category: 'strength',
        muscleGroups: ['legs'],
        equipmentRequired: 'home',
        requiredEquipment: ['bench'],
        optionalEquipment: ['dumbbells'],
        unlockLevel: 4,
        difficulty: 'intermediate',
        baseReps: 10,
        baseSets: 3,
        repIncrement: 2,
        setIncrement: 1,
        keypoints: [23, 24, 25, 26],
        description: 'Single-leg strength builder',
        instructions: [
            'Place rear foot on bench',
            'Lower into split squat',
            'Front knee tracks over toes',
            'Drive through front heel'
        ],
        tips: ['Long stance', 'Torso upright', 'Control descent'],
        thumbnailUrl: 'https://images.fizi.ai/exercises/bulgarian-split-thumb.jpg',
        trackingMode: 'ai_reps',
        stages: [],
        formChecks: []
    }
];

// Combine all for main exports
export const exercises: Exercise[] = [
    ...BODYWEIGHT_EXERCISES,
    ...DUMBBELL_EXERCISES,
    ...RESISTANCE_BAND_EXERCISES,
    ...PULLUP_BAR_EXERCISES,
    ...KETTLEBELL_EXERCISES,
    ...BARBELL_EXERCISES,
    ...CABLE_EXERCISES,
    ...LEG_MACHINE_EXERCISES,
    ...SMITH_MACHINE_EXERCISES,
    ...BENCH_EXERCISES,
    ...CARDIO_EXERCISES,
    ...FLEXIBILITY_EXERCISES,
    ...PLYOMETRIC_EXERCISES,
    ...RECOVERY_EXERCISES
];

export function getExerciseById(id: string): Exercise | undefined {
    return exercises.find(ex => ex.id === id);
}

export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
    return exercises.filter(ex => (ex.muscleGroups as string[]).includes(muscleGroup));
}

export function getExercisesByCategory(category: Exercise['category']): Exercise[] {
    return exercises.filter(ex => ex.category === category);
}

export default exercises;
