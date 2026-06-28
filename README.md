<div align="center">
  <img src="https://res.cloudinary.com/ddtslpjdf/image/upload/v1767885071/ChatGPT_Image_Jan_1_2026_02_00_59_PM_gqwae7.png" width="400" alt="FIZI Banner"/>
  
  # 🏋️ FIZI - AI Fitness Trainer
  
  **The ultimate AI-driven personal trainer in your pocket.**
  
  ![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue?style=for-the-badge&logo=react)
  ![Stack](https://img.shields.io/badge/Stack-React%20Native%20%7C%20Expo-black?style=for-the-badge&logo=expo)
  ![Data Backend](https://img.shields.io/badge/Data_Backend-Firebase-orange?style=for-the-badge&logo=firebase)
  ![Vision Backend](https://img.shields.io/badge/Vision_Backend-Python--Flask-yellow?style=for-the-badge&logo=python)
  ![State Management](https://img.shields.io/badge/State-Redux%20Toolkit-purple?style=for-the-badge&logo=redux)
</div>

---

**FIZI** is a cutting-edge cross-platform mobile application that leverages device cameras to provide real-time exercise feedback, powered by Google's MediaPipe and a customized Python streaming backend. It combines workout tracking, personalized diet planning, advanced gamification, custom workout plan building, and robust body metrics analytics to deliver a complete fitness ecosystem.

---

## ✨ Features

### 🦾 AI Vision Engine & Form Analysis
- **Dual-Mode Architecture**: Supports both on-device pose detection and a high-performance Python streaming backend for robust form analysis.
- **Real-Time Pose Tracking**: Utilizes `@mediapipe/pose` to track body landmarks in real-time.
- **Intelligent Form Correction**: Custom Python backend (`angle_calculator` & `form_validator`) analyzes movement patterns and provides actionable form feedback (e.g., squat depth, back straightness).
- **Automated Rep Counting**: Accurately counts repetitions when strict mathematical criteria for proper form are met.
- **Voice Feedback**: Gives audible cues via `expo-speech` to guide the user mid-set.

### 📅 Workout Planning & Customization
- **AI Strategy vs Custom Plans**: Switch between an auto-adjusting AI plan and fully bespoke custom plans.
- **Custom Plan Builder**: Deeply intuitive interface to formulate weekly routines, select from a 300+ Exercise Library, and tweak sets, reps, and rest timers.
- **Library Filtering**: Search exercises efficiently by muscle group or category.

### 📊 Advanced Analytics & Tracking (Body Metrics)
- **Hero Journey (Avatar)**: Track your body composition including BMI, BMR, Body Fat %, Visceral Fat, and Body Age.
- **Comprehensive Dashboard**: Beautiful charts powered by `react-native-chart-kit` visualizing workout volume, frequency, and adherence.
- **Daily Fuel**: A beautifully designed progress bar tracking daily caloric intake vs targets with BMR and TDEE reference points.
- **Workout History**: Detailed logs of past exercises, sets, reps, and performance metrics saved securely via Firebase Firestore.

### 🥗 Smart Nutrition 
- **Personalized Meal Plans**: Generates structured diet plans tailored to goals (Muscle Gain, Weight Loss, Maintenance) with Veg/Non-Veg preferences.
- **Macro Breakdowns**: Visualizes daily intake of Proteins, Carbs, and Fats.
- **Supplement Tracking**: Dedicated area for tracking daily supplements like Whey, Creatine, and Vitamins.

### 🎮 Gamification & Progression
- **RPG Elements**: Users level up their avatar from Beginner to Legend by earning XP through consistent workouts.
- **Streaks & Achievements**: Tracks daily consecutive workouts to foster consistency with engaging UI notifications.

### 💎 Premium Experience Integration
- **In-App Purchases**: Seamless implementation using `react-native-iap` to unlock exclusive premium features, custom plan building, and deep analytics.
- **Premium Gates**: Strategic paywalls protecting advanced insights while maintaining a core free tier.

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    User([Athlete]) <--> MobileApp[Mobile App - React Native/Expo]
    
    subgraph "State & Local Storage"
        Redux[Redux Toolkit Store]
        AuthSlice[Auth Slice]
        UISlice[UI Slice - Scroll Positions]
        PlanSlice[Workout Plan Slice]
        AsyncStorage[Local Persistence]
    end

    subgraph "Hardware Integration"
        ExpoCamera[Expo Camera]
        Sensors[Haptics / MediaPipe]
        Audio[Expo Speech / AV]
    end

    subgraph "Vision ML Backend (Python)"
        PythonServer[Flask Streaming Server]
        MediaPipe[MediaPipe Pose Model]
        RepCounter[Rep Counter & Form Validator]
    end

    subgraph "Cloud Data Backend"
        FirebaseAuth[Firebase Authentication]
        Firestore[Firestore DB - Workouts, Users, Plans]
    end
    
    subgraph "Native Services"
         PlayStore[Google Play Billing - IAP]
         FCM[Expo Notifications]
    end

    %% Internal Subgraph Connections
    Redux -.-> AuthSlice
    Redux -.-> UISlice
    Redux -.-> PlanSlice
    PythonServer <--> MediaPipe
    PythonServer <--> RepCounter

    %% App Connections
    MobileApp <--> Redux
    MobileApp <--> AsyncStorage
    MobileApp <--> ExpoCamera
    MobileApp <--> Sensors
    MobileApp <--> Audio
    MobileApp -- Base64 Frames --> PythonServer
    MobileApp <--> FirebaseAuth
    MobileApp <--> Firestore
    MobileApp <--> PlayStore
    MobileApp <--> FCM
```

---

## 🛠️ Technology Stack & Dependencies

### Frontend & Core App
- **React Native** (`0.76.x` via Expo SDK 52)
- **Expo** (`~52.0.28`) - Managed workflow with Custom Dev Clients
- **TypeScript** - Strict typing across the codebase

### State Management & Navigation
- **Redux Toolkit** (`@reduxjs/toolkit`) & `react-redux`
- **React Navigation** (`v7`) - Stack and Bottom Tabs integration

### Key Integrations
- **AI/Vision Frontend**: `@mediapipe/pose`, `expo-camera`
- **Data Backend**: `firebase` (Auth, Firestore)
- **Monetization**: `react-native-iap`
- **Sensors/Feedback**: `expo-speech`, `expo-haptics`, `expo-av`
- **UI/Visuals**: `expo-linear-gradient`, `expo-blur`, `react-native-svg`, `react-native-chart-kit`
- **Storage**: `@react-native-async-storage/async-storage`

### Computer Vision Server (python_server)
- **Flask**: Lightweight high-concurrency API server handling mobile frame streams.
- **OpenCV (`cv2`)**: Extremely fast frame decoding and manipulation.
- **Python MediaPipe**: ML models strictly for server-side form inference.
- **NumPy**: Matrix math for real-time rep angle computation.

---

## 📂 Project Structure

```
FIZI/
├── src/
│   ├── components/       # Reusable UI components (Buttons, Cards, Modals, etc.)
│   ├── config/           # Firebase & App configurations
│   ├── context/          # React Context providers (Billing, Toast)
│   ├── hooks/            # Custom React Hooks (`useTheme`, `useSmartCamera`)
│   ├── models/           # Typescript interfaces, Exercise database
│   ├── screens/          # Primary Navigation screens (Home, Profile, Work, CustomPlanBuilder, etc.)
│   ├── services/         # API wrappers (NutritionService, avatarService, etc.)
│   ├── store/            # Redux setup, slices, and selectors
│   ├── theme/            # Theme definitions (Colors, Shadows, Layouts, Typography)
│   ├── types/            # Global TypeScript definitions
│   └── utils/            # Helper functions and Math conversions
├── python_server/        # Python Flask backend for Server-Side ML Inference
│   ├── main.py           # Streaming API Endpoints
│   ├── angle_calculator.py
│   ├── form_validator.py
│   └── rep_counter.py
├── package.json          # Mobile App dependencies
└── README.md             # Project documentation
```

---

## 👨‍💻 Developer
**Mahesh Challa**  
GitHub: [@MaheshChalla2701](https://github.com/MaheshChalla2701)  
Email: maheshchalla2701@gmail.com

---
<div align="center">
**Built for the future of decentralized AI fitness.**
</div>
