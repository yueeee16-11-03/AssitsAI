import React, { useEffect } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Linking } from "react-native";
import type { RootStackParamList } from "./types";
import InviteService from "../services/InviteService";

import SplashScreen from "../screens/Core/SplashScreen";
import OnboardingScreen from "../screens/Auth/OnboardingScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import SetupProfileScreen from "../screens/Auth/SetupProfileScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import AIChatScreen from "../screens/Home/AIChatScreen";
import AIInsightScreen from "../screens/Home/AIInsightScreen";
import AIRecommendationScreen from "../screens/Home/AIRecommendationScreen";
import AISettingScreen from "../screens/Setting/AISettingScreen";
import FinanceDashboardScreen from "../screens/Finance/FinanceDashboardScreen";
import AddTransactionScreen from "../screens/Finance/AddTransactionScreen";
import AddIncomeScreen from "../screens/Finance/AddIncomeScreen";
import BudgetPlannerScreen from "../screens/Finance/BudgetPlannerScreen";
import GoalTrackingScreen from "../screens/Finance/GoalTrackingScreen";
import GoalDetailScreen from "../screens/Finance/GoalDetailScreen";
import HabitDashboardScreen from "../screens/Habbit/HabitDashboardScreen";
import AddHabitScreen from "../screens/Habbit/AddHabitScreen";
import EditHabitScreen from "../screens/Habbit/EditHabitScreen";
import DailyCheckInScreen from "../screens/Habbit/DailyCheckInScreen";
import AIHabitCoachScreen from "../screens/Habbit/AIHabitCoachScreen";
import HabitReportScreen from "../screens/Habbit/HabitReportScreen";
import ProfileScreen from "../screens/Setting/ProfileScreen";
import SettingsScreen from "../screens/Setting/SettingsScreen";
import NotificationScreen from "../screens/Setting/NotificationScreen";
import HelpCenterScreen from "../screens/Setting/HelpCenterScreen";
import AboutScreen from "../screens/Setting/AboutScreen";
import WalletManagementScreen from "../screens/Finance/WalletManagementScreen";
import CategoryManagementScreen from "../screens/Finance/CategoryManagementScreen";
import RecurringTransactionsScreen from "../screens/Finance/RecurringTransactionsScreen";
import SecuritySettingsScreen from "../screens/Setting/SecuritySettingsScreen";
import SetupPinScreen from "../screens/Setting/SetupPinScreen";
import UnlockAppScreen from "../screens/Core/UnlockAppScreen";
import ReportScreen from "../screens/Finance/ReportScreen";
import CategoryTransactionsScreen from "../screens/Finance/CategoryTransactionsScreen";
import EditTransactionScreen from "../screens/Finance/EditTransactionScreen";
import TransactionHistoryScreen from "../screens/Finance/TransactionHistoryScreen";
import AIProcessingOverlay from "../screens/Finance/AIProcessingOverlay";
import FamilyOnboardingScreen from "../screens/Family/FamilyOnboardingScreen";
import FamilyOverviewScreen from "../screens/Family/FamilyOverviewScreen";
import CreateFamilyScreen from "../screens/Family/CreateFamilyScreen";
import FamilyChatScreen from "../screens/Family/FamilyChatScreen";
import FamilyPermissionsScreen from "../screens/Family/FamilyPermissionsScreen";
import MemberDetailScreen from "../screens/Family/MemberDetailScreen";
import SharedGoalScreen from "../screens/Family/SharedGoalScreen";
import InviteMemberScreen from "../screens/Family/InviteMemberScreen";
import JoinFamilyScreen from "../screens/Family/JoinFamilyScreen";

import BottomTabs from "./BottomTabs";

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function AppNavigation() {
  const [currentRouteName, setCurrentRouteName] = React.useState<string | undefined>(undefined);
  const theme = require('react-native-paper').useTheme();

  // Handle deep links for family invitations
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        const inviteCode = InviteService.parseInviteCodeFromURL(url);
        if (inviteCode) {
          navigationRef.navigate('JoinFamily', { code: inviteCode });
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    // Handle initial URL when app is launched from deep link
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url != null) {
        handleDeepLink(url);
      }
    };

    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    getInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const navTheme = {
    dark: theme.dark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      notification: theme.colors.primary,
    },
    // Ensure fonts exist for react-navigation header code (fallback to system if missing)
    fonts: {
      regular: (theme as any).fonts?.regular ?? { fontFamily: 'System' },
      medium: (theme as any).fonts?.medium ?? { fontFamily: 'System' },
      bold: (theme as any).fonts?.bold ?? { fontFamily: 'System' },
      heavy: (theme as any).fonts?.heavy ?? (theme as any).fonts?.medium ?? { fontFamily: 'System' },
      light: (theme as any).fonts?.light ?? { fontFamily: 'System' },
      thin: (theme as any).fonts?.thin ?? { fontFamily: 'System' },
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => setCurrentRouteName(navigationRef.getCurrentRoute()?.name)}
      onStateChange={(state) => setCurrentRouteName(state?.routes[state.index]?.name)}
    >
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="SetupProfile" component={SetupProfileScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AIChat" component={AIChatScreen} />
        <Stack.Screen name="AIInsight" component={AIInsightScreen} />
        <Stack.Screen name="AIRecommendation" component={AIRecommendationScreen} />
        <Stack.Screen name="AISetting" component={AISettingScreen} />
        <Stack.Screen name="FinanceDashboard" component={FinanceDashboardScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <Stack.Screen name="AddIncome" component={AddIncomeScreen} />
        <Stack.Screen name="BudgetPlanner" component={BudgetPlannerScreen} />
        <Stack.Screen name="GoalTracking" component={GoalTrackingScreen} />
        <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
        <Stack.Screen name="HabitDashboard" component={HabitDashboardScreen} />
        <Stack.Screen name="AddHabit" component={AddHabitScreen} />
        <Stack.Screen name="EditHabit" component={EditHabitScreen} />
        <Stack.Screen name="DailyCheckIn" component={DailyCheckInScreen} />
        <Stack.Screen name="AIHabitCoach" component={AIHabitCoachScreen} />
        <Stack.Screen name="HabitReport" component={HabitReportScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="WalletManagement" component={WalletManagementScreen} />
        <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
        <Stack.Screen name="RecurringTransactions" component={RecurringTransactionsScreen} />
        <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
        <Stack.Screen name="SetupPin" component={SetupPinScreen} />
        <Stack.Screen name="UnlockApp" component={UnlockAppScreen} />

        <Stack.Screen name="Report" component={ReportScreen} />
        <Stack.Screen name="CategoryTransactions" component={CategoryTransactionsScreen} />
        <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        <Stack.Screen name="AIProcessingOverlay" component={AIProcessingOverlay} />
        <Stack.Screen name="FamilyOnboarding" component={FamilyOnboardingScreen} />
        <Stack.Screen name="FamilyOverview" component={FamilyOverviewScreen} />
        <Stack.Screen name="CreateFamily" component={CreateFamilyScreen} />
        <Stack.Screen name="FamilyChat" component={FamilyChatScreen} />
        <Stack.Screen name="FamilyPermissions" component={FamilyPermissionsScreen} />
        <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
        <Stack.Screen name="SharedGoal" component={SharedGoalScreen} />
        <Stack.Screen name="InviteMember" component={InviteMemberScreen} />
        <Stack.Screen name="JoinFamily" component={JoinFamilyScreen} />
      </Stack.Navigator>
      {/* Global bottom tabs - visible across all stack screens */}
      <BottomTabs navigationRef={navigationRef} currentRouteName={currentRouteName} />
    </NavigationContainer>
  );
}