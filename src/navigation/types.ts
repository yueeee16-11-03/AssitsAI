// src/navigation/types.ts
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  SetupProfile: undefined;
  Home: undefined;
  AIChat: undefined;
  AIInsight: undefined;
  AIRecommendation: undefined;
  AISetting: undefined;
  FinanceDashboard: undefined;
  AddTransaction: { defaultType?: 'income' | 'expense' };
  EditTransaction: { transaction: any };
  TransactionHistory: { newTransaction?: any };
  BudgetPlanner: undefined;
  GoalTracking: undefined;
  HabitDashboard: undefined;
  AddHabit: undefined;
  EditHabit: { habitId: string };
  DailyCheckIn: undefined;
  AIHabitCoach: undefined;
  HabitReport: undefined;
  FamilyOverview: undefined;
  MemberDetail: undefined;
  SharedGoal: undefined;
  FamilyChat: undefined;
  Profile: undefined;
  Settings: undefined;
  Notification: undefined;
  HelpCenter: undefined;
  About: undefined;
  
  // New Finance Management Screens
  WalletManagement: undefined;
  CategoryManagement: undefined;
  RecurringTransactions: undefined;
  
  // New Family Screens
  CreateFamily: undefined;
  InviteMember: undefined;
  JoinFamily: undefined;
  FamilyPermissions: undefined;
  FamilyRoles: undefined;
  
  // New Security Screens
  SecuritySettings: undefined;
  SetupPin: undefined;
  UnlockApp: undefined;
  TwoFactorAuth: undefined;
  LoginHistory: undefined;
  
  // Daily Goals
  DailyGoalsDetail: undefined;
  
  // Finance Reports
  Report: undefined;
  
  // Transaction Attachments
  TransactionAttachment: {
    transactionId: string;
    transactionDesc: string;
  };
  
  // Smart Note
  SmartNote: {
    onSave: (content: string) => void;
  };
  
  // AI Processing Overlay
  AIProcessingOverlay: {
    imageUri?: string;
    handwritingText?: string;
    onConfirm?: (data: any) => void;
  };
  
  // AI Processing Results Screen
  AIProcessingResults: {
    imageUri?: string;
    processedData: any;
    editedData: any;
    selectedItems: number[];
    onConfirm?: (data: any) => void;
  };
};