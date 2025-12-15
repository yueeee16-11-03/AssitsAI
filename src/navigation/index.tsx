import React from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";

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
import FamilyOverviewScreen from "../screens/Family/FamilyOverviewScreen";
import MemberDetailScreen from "../screens/Family/MemberDetailScreen";
import SharedGoalScreen from "../screens/Family/SharedGoalScreen";
import FamilyChatScreen from "../screens/Family/FamilyChatScreen";
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
import InviteMemberScreen from "../screens/Family/InviteMemberScreen";
import FamilyPermissionsScreen from "../screens/Family/FamilyPermissionsScreen";
import ReportScreen from "../screens/Finance/ReportScreen";
import CategoryTransactionsScreen from "../screens/Finance/CategoryTransactionsScreen";
import EditTransactionScreen from "../screens/Finance/EditTransactionScreen";
import TransactionHistoryScreen from "../screens/Finance/TransactionHistoryScreen";
import AIProcessingOverlay from "../screens/Finance/AIProcessingOverlay";
import GeminiTestScreen from "../screens/Core/GeminiTestScreen";
import BottomTabs from "./BottomTabs";

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function AppNavigation() {
  const [currentRouteName, setCurrentRouteName] = React.useState<string | undefined>(undefined);

  return (
    <NavigationContainer
      ref={navigationRef}
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
        <Stack.Screen name="FamilyOverview" component={FamilyOverviewScreen} />
        <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
        <Stack.Screen name="SharedGoal" component={SharedGoalScreen} />
        <Stack.Screen name="FamilyChat" component={FamilyChatScreen} />
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
        <Stack.Screen name="InviteMember" component={InviteMemberScreen} />
        <Stack.Screen name="FamilyPermissions" component={FamilyPermissionsScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
        <Stack.Screen name="CategoryTransactions" component={CategoryTransactionsScreen} />
        <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        <Stack.Screen name="AIProcessingOverlay" component={AIProcessingOverlay} />
        <Stack.Screen name="GeminiTest" component={GeminiTestScreen} />
      </Stack.Navigator>
      {/* Global bottom tabs - visible across all stack screens */}
      <BottomTabs navigationRef={navigationRef} currentRouteName={currentRouteName} />
    </NavigationContainer>
  );
}