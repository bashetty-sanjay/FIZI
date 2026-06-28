import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store, RootState } from './src/store';
import { auth } from './src/services/firebaseConfig';
import { authService } from './src/services/authService';
import { setUser } from './src/store/slices/authSlice';
import { BillingProvider } from './src/context/BillingContext';
import { BackHandler } from 'react-native';
import { useAppDispatch } from './src/hooks/reduxHooks';
import AnimatedSplash from './src/components/AnimatedSplash';
import OfflineBanner from './src/components/OfflineBanner';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import SignupScreen from './src/screens/SignupScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AvatarScreen from './src/screens/AvatarScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ExerciseInstructionsScreen from './src/screens/ExerciseInstructionsScreen';
import LevelProgressScreen from './src/screens/LevelProgressScreen';
import ExerciseLibraryScreen from './src/screens/ExerciseLibraryScreen';
import CustomPlanBuilderScreen from './src/screens/CustomPlanBuilderScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

import DataUsageScreen from './src/screens/DataUsageScreen';
import AboutUsScreen from './src/screens/AboutUsScreen';
import FAQScreen from './src/screens/FAQScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';

// Community Screens
import { CreatePost } from './src/community/screens/CreatePost';
import { UserProfile } from './src/community/screens/UserProfile';
import { SearchUsers } from './src/community/screens/SearchUsers';
import { Notifications } from './src/community/screens/Notifications';
import { PostDetails } from './src/community/screens/PostDetails';

export type ScreenType = 'Login' | 'ForgotPassword' | 'Signup' | 'ProfileSetup' | 'Home' | 'Camera' | 'History' | 'Avatar' | 'Onboarding' | 'ExerciseInstructions' | 'LevelProgress' | 'ExerciseLibrary' | 'AboutUs' | 'DataUsage' | 'CustomPlanBuilder' | 'FAQ' | 'Subscription' | 'Chatbot' | 'CreatePost' | 'UserProfile' | 'SearchUsers' | 'Notifications' | 'PostDetails';

export interface CameraScreenParams {
  exerciseId?: string;
  exerciseName?: string;
  targetSets?: number;
  targetReps?: string;
  fromPlan?: boolean;
}

export interface NavigationParams {
  Camera?: CameraScreenParams;
  ExerciseInstructions?: CameraScreenParams;
  [key: string]: any;
}


import { loadTheme } from './src/store/slices/themeSlice';
import { useTheme } from './src/hooks/useTheme';

function AppContent() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { isDark } = useTheme();
  const dispatch = useAppDispatch();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('Login');
  const navigationParamsRef = useRef<NavigationParams>({});
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Track activity on login
  useEffect(() => {
    if (isAuthenticated && user) {
      authService.updateLastActiveAt();
    }
  }, [isAuthenticated, user?.uid]);

  // Load saved theme on mount
  useEffect(() => {
    dispatch(loadTheme());
  }, []);

  // Check onboarding status on mount
  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem('@onboarding_complete');
      if (value !== 'true') {
        setCurrentScreen('Onboarding');
      }
    } catch (e) {
      console.error('Error checking onboarding:', e);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_complete', 'true');
      setCurrentScreen('Login');
    } catch (e) {
      console.error('Error saving onboarding status:', e);
    }
  };

  // Auth state listener
  useEffect(() => {
    // Safety net: if Firebase persistence is slow/broken, never block the splash forever.
    // Without this, a cold-start where onAuthStateChanged never fires would hang the app
    // and the OS may kill it as unresponsive — surfacing as an "open crash" to the user.
    const safetyTimeout = setTimeout(() => {
      setCheckingAuth(false);
    }, 6000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userProfile = await authService.getUserProfile(firebaseUser.uid);
          store.dispatch(setUser(userProfile));
        } else {
          store.dispatch(setUser(null));
        }
      } catch (error) {
        console.error('Error in auth state listener:', error);
      } finally {
        clearTimeout(safetyTimeout);
        setCheckingAuth(false);
      }
    });
    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  // Navigation Logic - Only run for auth/onboarding, don't override other screens
  useEffect(() => {
    if (checkingOnboarding || checkingAuth) return;
    if (currentScreen === 'Onboarding') return;

    // 1. Unauthenticated State - Force Login
    if (!isAuthenticated || !user) {
      if (currentScreen !== 'Login' && currentScreen !== 'Signup') {
        setCurrentScreen('Login');
      }
      return;
    }

    // 2. Authenticated State - Manual Navigation Check
    // Don't override these screens - user navigated there manually
    if (currentScreen === 'Camera' || currentScreen === 'History' || currentScreen === 'Avatar' || currentScreen === 'ExerciseInstructions' || currentScreen === 'LevelProgress' || currentScreen === 'ExerciseLibrary' || currentScreen === 'AboutUs' || currentScreen === 'DataUsage' || currentScreen === 'CustomPlanBuilder' || currentScreen === 'Subscription' || currentScreen === 'FAQ' || currentScreen === 'Chatbot' || currentScreen === 'CreatePost' || currentScreen === 'UserProfile' || currentScreen === 'SearchUsers' || currentScreen === 'Notifications' || currentScreen === 'PostDetails') {
      return;
    }

    // 3. Authenticated State - Profile Completion Check
    // Check if profile is complete
    if (user.age > 0 && user.weight > 0 && user.height > 0 && user.workoutPlanId) {
      // Profile is complete - only auto-navigate from auth screens
      if (currentScreen === 'Login' || currentScreen === 'Signup' || currentScreen === 'ProfileSetup') {
        setCurrentScreen('Home');
      }
    } else {
      // Profile not complete
      if (currentScreen !== 'ProfileSetup') {
        setCurrentScreen('ProfileSetup');
      }
    }
  }, [isAuthenticated, user, checkingOnboarding, checkingAuth]);

  const [history, setHistory] = useState<ScreenType[]>([]);

  // Hardware Back Button Handler
  useEffect(() => {
    const onBackPress = () => {
      if (history.length > 0) {
        // Go back in history
        const previousScreen = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setCurrentScreen(previousScreen);
        return true; // Stop event propagation
      }
      return false; // Let default behavior happen (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, [history]);

  // Navigation functions to pass to screens
  const navigation = {
    navigate: (screen: ScreenType, params?: any) => {
      if (params) {
        navigationParamsRef.current = { ...navigationParamsRef.current, [screen]: params };
      }
      setHistory(prev => [...prev, currentScreen]);
      setCurrentScreen(screen);
    },
    goBack: () => {
      if (history.length > 0) {
        const previousScreen = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setCurrentScreen(previousScreen);
      } else {
        // Fallback if no history (e.g. direct deep link or reset)
        setCurrentScreen('Home');
      }
    },
    get params() {
      return navigationParamsRef.current[currentScreen as keyof NavigationParams];
    },
  };

  // Render current screen
  const renderScreen = () => {
    if (checkingOnboarding || checkingAuth) {
      return (
        <AnimatedSplash onFinish={() => {
          // Splash finishes but we still wait for auth; keep showing until auth resolves
        }} />
      );
    }

    switch (currentScreen) {
      case 'Login':
        return <LoginScreen navigation={navigation} />;
      case 'ForgotPassword':
        return <ForgotPasswordScreen navigation={navigation} />;
      case 'Signup':
        return <SignupScreen navigation={navigation} />;
      case 'ProfileSetup':
        return <ProfileSetupScreen navigation={navigation} />;
      case 'Home':
        return <HomeScreen navigation={navigation} />;
      case 'Camera':
        return <CameraScreen navigation={navigation} />;
      case 'History':
        return <HistoryScreen navigation={navigation} />;
      case 'Avatar':
        return <AvatarScreen navigation={navigation} />;
      case 'Onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
      case 'ExerciseInstructions':
        return <ExerciseInstructionsScreen navigation={navigation} />;
      case 'LevelProgress':
        return <LevelProgressScreen navigation={navigation} />;
      case 'ExerciseLibrary':
        return <ExerciseLibraryScreen navigation={navigation} />;
      case 'AboutUs':
        return <AboutUsScreen navigation={navigation} />;
      case 'DataUsage':
        return <DataUsageScreen navigation={navigation} />;
      case 'CustomPlanBuilder':
        return <CustomPlanBuilderScreen navigation={navigation} route={{ params: navigation.params }} />;
      case 'FAQ':
        return <FAQScreen navigation={navigation} />;
      case 'Subscription':
        return <SubscriptionScreen navigation={navigation} />;
      case 'Chatbot':
        return <ChatbotScreen navigation={navigation} />;
      case 'CreatePost':
        return <CreatePost navigation={navigation} />;
      case 'UserProfile':
        return <UserProfile navigation={navigation} route={{ params: navigation.params }} />;
      case 'SearchUsers':
        return <SearchUsers navigation={navigation} />;
      case 'Notifications':
        return <Notifications navigation={navigation} />;
      case 'PostDetails':
        return <PostDetails navigation={navigation} route={{ params: navigation.params }} />;

      default:
        return <LoginScreen navigation={navigation} />;
    }
  };

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {renderScreen()}
      <OfflineBanner />
    </>
  );
}

// Import components
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ToastProvider } from './src/context/ToastContext';

export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <BillingProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </BillingProvider>
      </ErrorBoundary>
    </Provider>
  );
}
