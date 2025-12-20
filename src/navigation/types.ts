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
  AddTransaction: { 
    defaultType?: 'income' | 'expense';
    openCamera?: boolean;
    processedData?: {
      rawOCRText?: string;
      processedText?: string;
      note?: string;
      processingTime?: number;
      // 🟢 AI extracted fields
      totalAmount?: number;
      items?: any[];
      category?: string;
      description?: string;
    };
  };
  AddIncome: { 
    openCamera?: boolean;
    processedData?: {
      rawOCRText?: string;
      processedText?: string;
      note?: string;
      processingTime?: number;
      // 🟢 AI extracted fields
      totalAmount?: number;
      items?: any[];
      category?: string;
      description?: string;
    };
  };
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
  Profile: undefined;
  Settings: undefined;
  Notification: undefined;
  HelpCenter: undefined;
  About: undefined;
  
  // New Finance Management Screens
  WalletManagement: undefined;
  CategoryManagement: undefined;
  RecurringTransactions: undefined;
  
  // New Security Screens
  SecuritySettings: undefined;
  SetupPin: undefined;
  UnlockApp: undefined;
  TwoFactorAuth: undefined;
  LoginHistory: undefined;
  
  // Daily Goals
  GoalDetail: { goal?: any; onSave?: (updatedGoal: any) => void };
  
  // Finance Reports
  Report: undefined;
  CategoryTransactions: { category: string; startDate?: string; endDate?: string };
  
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
    textNote?: string;
    handwritingText?: string;
    transactionType?: 'income' | 'expense'; // 🟢 NĐ loại giao dịch
  };
  
  // AI Processing Results Screen
  AIProcessingResults: {
    imageUri?: string;
    processedData: any;
    editedData: any;
    selectedItems: number[];
    transactionType?: 'income' | 'expense'; // 🟢 NĐ loại giao dịch
  };
  
  // Family Module Screens
  FamilyOnboarding: undefined;
  FamilyOverview: undefined;
  CreateFamily: undefined;
  FamilyChat: undefined;
  FamilyPermissions: undefined;
  MemberDetail: undefined;
  SharedGoal: undefined;
  InviteMember: { familyId: string; inviteCode: string };
  JoinFamily: { code?: string };

};