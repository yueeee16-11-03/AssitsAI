/**
 * FamilySettingsService.ts
 * Service để quản lý cài đặt gia đình
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface FamilySettings {
  familyId: string;
  // Notification Settings
  notifications: {
    enabled: boolean;
    transactions: boolean;
    budgetAlerts: boolean;
    monthlyReport: boolean;
    memberActivity: boolean;
  };
  // Privacy & Control
  privacy: {
    approvalRequired: boolean;
    approvalThreshold: number; // Amount threshold for approval
    publicProfile: boolean;
    allowMemberInvites: boolean;
  };
  // Budget Settings
  budget: {
    monthlyBudget: number;
    warningThreshold: number; // Percentage (e.g., 80 for 80%)
    autoReset: boolean;
  };
  // General Settings
  general: {
    currency: string;
    timezone: string;
    language: string;
  };
  updatedAt?: any;
  updatedBy?: string;
}

export interface FamilyInfo {
  id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  memberCount: number;
  createdAt: any;
  totalBalance: number;
  monthlyBudget: number;
}

class FamilySettingsService {
  /**
   * Get family settings reference
   */
  private getSettingsRef(familyId: string) {
    return firestore()
      .collection('families')
      .doc(familyId)
      .collection('settings')
      .doc('general');
  }

  /**
   * Get family info
   */
  async getFamilyInfo(familyId: string): Promise<FamilyInfo | null> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data() as any;

      // Check if user is member
      const isMember =
        familyData.ownerId === currentUser.uid ||
        familyData.memberIds?.includes(currentUser.uid);

      if (!isMember) {
        throw new Error('You are not a member of this family');
      }

      // Get owner info
      let ownerName = 'Unknown';
      if (familyData.members?.[familyData.ownerId]) {
        ownerName = familyData.members[familyData.ownerId].displayName || 'Owner';
      }

      // Calculate total balance from shared wallets
      const walletsSnapshot = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedWallets')
        .get();

      let totalBalance = 0;
      walletsSnapshot.docs.forEach((doc) => {
        const wallet = doc.data();
        totalBalance += wallet.balance || 0;
      });

      const info: FamilyInfo = {
        id: familyDoc.id,
        name: familyData.name || 'Unknown Family',
        ownerId: familyData.ownerId,
        ownerName,
        memberCount: familyData.memberIds?.length || 0,
        createdAt: familyData.createdAt,
        totalBalance,
        monthlyBudget: familyData.monthlyBudget || 0,
      };

      console.log('✅ [FamilySettingsService] Family info fetched:', {
        familyId,
        name: info.name,
        memberCount: info.memberCount,
      });

      return info;
    } catch (error) {
      console.error('❌ [FamilySettingsService] Error fetching family info:', error);
      throw error;
    }
  }

  /**
   * Get family settings
   */
  async getSettings(familyId: string): Promise<FamilySettings> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const settingsDoc = await this.getSettingsRef(familyId).get();

      if (!settingsDoc.exists) {
        // Initialize default settings if not exists
        console.log('⚠️ [FamilySettingsService] Settings not found, using defaults');
        const defaultSettings = this.getDefaultSettings(familyId);
        // Try to initialize but don't block if it fails
        this.initializeDefaultSettings(familyId).catch((err) => {
          console.log('⚠️ [FamilySettingsService] Could not initialize settings:', err.message);
        });
        return defaultSettings;
      }

      const data = settingsDoc.data();
      
      // Ensure data structure is complete
      const settings: FamilySettings = {
        familyId,
        notifications: data?.notifications || {
          enabled: true,
          transactions: true,
          budgetAlerts: true,
          monthlyReport: true,
          memberActivity: true,
        },
        privacy: data?.privacy || {
          approvalRequired: false,
          approvalThreshold: 5000000,
          publicProfile: false,
          allowMemberInvites: true,
        },
        budget: data?.budget || {
          monthlyBudget: 50000000,
          warningThreshold: 80,
          autoReset: true,
        },
        general: data?.general || {
          currency: 'VND',
          timezone: 'Asia/Ho_Chi_Minh',
          language: 'vi',
        },
        updatedAt: data?.updatedAt,
        updatedBy: data?.updatedBy,
      };

      console.log('✅ [FamilySettingsService] Settings fetched:', {
        familyId,
        hasNotifications: !!settings.notifications,
        notificationsEnabled: settings.notifications?.enabled,
      });

      return settings;
    } catch (error: any) {
      console.error('❌ [FamilySettingsService] Error fetching settings:', error);
      
      // If permission denied or any error, return default settings instead of throwing
      if (error.code === 'permission-denied') {
        console.log('⚠️ [FamilySettingsService] Permission denied, using default settings');
        return this.getDefaultSettings(familyId);
      }
      
      // For other errors, still return default to prevent app crash
      console.log('⚠️ [FamilySettingsService] Using default settings due to error');
      return this.getDefaultSettings(familyId);
    }
  }

  /**
   * Update family settings
   */
  async updateSettings(
    familyId: string,
    updates: Partial<FamilySettings>
  ): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check if user is owner
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;

      if (!isOwner) {
        throw new Error('Only family owner can update settings');
      }

      await this.getSettingsRef(familyId).set(
        {
          ...updates,
          familyId,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          updatedBy: currentUser.uid,
        },
        { merge: true }
      );

      console.log('✅ [FamilySettingsService] Settings updated:', {
        familyId,
        updates: Object.keys(updates),
      });
    } catch (error) {
      console.error('❌ [FamilySettingsService] Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Update specific notification setting
   */
  async updateNotificationSetting(
    familyId: string,
    key: keyof FamilySettings['notifications'],
    value: boolean
  ): Promise<void> {
    try {
      await this.updateSettings(familyId, {
        notifications: {
          ...(await this.getSettings(familyId)).notifications,
          [key]: value,
        },
      } as any);

      console.log('✅ [FamilySettingsService] Notification setting updated:', {
        familyId,
        key,
        value,
      });
    } catch (error) {
      console.error('❌ [FamilySettingsService] Error updating notification:', error);
      throw error;
    }
  }

  /**
   * Update specific privacy setting
   */
  async updatePrivacySetting(
    familyId: string,
    key: keyof FamilySettings['privacy'],
    value: boolean | number
  ): Promise<void> {
    try {
      const currentSettings = await this.getSettings(familyId);
      await this.updateSettings(familyId, {
        privacy: {
          ...currentSettings.privacy,
          [key]: value,
        },
      } as any);

      console.log('✅ [FamilySettingsService] Privacy setting updated:', {
        familyId,
        key,
        value,
      });
    } catch (error) {
      console.error('❌ [FamilySettingsService] Error updating privacy:', error);
      throw error;
    }
  }

  /**
   * Update monthly budget
   */
  async updateMonthlyBudget(familyId: string, budget: number): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check if user is owner
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;

      if (!isOwner) {
        throw new Error('Only family owner can update budget');
      }

      // Update family document
      await firestore()
        .collection('families')
        .doc(familyId)
        .update({
          monthlyBudget: budget,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Update settings
      const currentSettings = await this.getSettings(familyId);
      await this.updateSettings(familyId, {
        budget: {
          ...currentSettings.budget,
          monthlyBudget: budget,
        },
      } as any);

      console.log('✅ [FamilySettingsService] Monthly budget updated:', {
        familyId,
        budget,
      });
    } catch (error) {
      console.error('❌ [FamilySettingsService] Error updating budget:', error);
      throw error;
    }
  }

  /**
   * Delete family (only owner)
   */
  async deleteFamily(familyId: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check if user is owner
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;

      if (!isOwner) {
        throw new Error('Only family owner can delete the family');
      }

      // Delete all subcollections
      const batch = firestore().batch();

      // Delete settings
      const settingsRef = this.getSettingsRef(familyId);
      batch.delete(settingsRef);

      // Delete categories
      const categoriesSnapshot = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('categories')
        .get();

      categoriesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete shared wallets and their transactions
      const walletsSnapshot = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedWallets')
        .get();

      for (const walletDoc of walletsSnapshot.docs) {
        // Delete wallet transactions
        const transactionsSnapshot = await walletDoc.ref
          .collection('transactions')
          .get();

        transactionsSnapshot.docs.forEach((txDoc) => {
          batch.delete(txDoc.ref);
        });

        // Delete wallet
        batch.delete(walletDoc.ref);
      }

      // Delete family document
      batch.delete(familyDoc.ref);

      await batch.commit();

      console.log('✅ [FamilySettingsService] Family deleted:', { familyId });
    } catch (error) {
      console.error('❌ [FamilySettingsService] Error deleting family:', error);
      throw error;
    }
  }

  /**
   * Leave family (for members)
   */
  async leaveFamily(familyId: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data() as any;

      // Owner cannot leave, must delete family instead
      if (familyData.ownerId === currentUser.uid) {
        throw new Error('Owner cannot leave family. Delete family instead.');
      }

      // Check if user is member
      if (!familyData.memberIds?.includes(currentUser.uid)) {
        throw new Error('You are not a member of this family');
      }

      // Remove from memberIds
      await firestore()
        .collection('families')
        .doc(familyId)
        .update({
          memberIds: firestore.FieldValue.arrayRemove(currentUser.uid),
          [`members.${currentUser.uid}`]: firestore.FieldValue.delete(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ [FamilySettingsService] User left family:', {
        familyId,
        userId: currentUser.uid,
      });
    } catch (error) {
      console.error('❌ [FamilySettingsService] Error leaving family:', error);
      throw error;
    }
  }

  /**
   * Export family data
   */
  async exportFamilyData(familyId: string): Promise<any> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get family info
      const familyInfo = await this.getFamilyInfo(familyId);
      if (!familyInfo) {
        throw new Error('Family not found');
      }

      // Get settings
      const settings = await this.getSettings(familyId);

      // Get wallets
      const walletsSnapshot = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedWallets')
        .get();

      const wallets = walletsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const exportData = {
        familyInfo,
        settings,
        wallets,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.uid,
      };

      console.log('✅ [FamilySettingsService] Family data exported:', {
        familyId,
        walletsCount: wallets.length,
      });

      return exportData;
    } catch (error) {
      console.error('❌ [FamilySettingsService] Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(familyId: string): FamilySettings {
    return {
      familyId,
      notifications: {
        enabled: true,
        transactions: true,
        budgetAlerts: true,
        monthlyReport: true,
        memberActivity: true,
      },
      privacy: {
        approvalRequired: false,
        approvalThreshold: 5000000, // 5M VND
        publicProfile: false,
        allowMemberInvites: true,
      },
      budget: {
        monthlyBudget: 50000000, // 50M VND
        warningThreshold: 80, // 80%
        autoReset: true,
      },
      general: {
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi',
      },
    };
  }

  /**
   * Initialize default settings for new family
   */
  async initializeDefaultSettings(familyId: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('⚠️ [FamilySettingsService] User not authenticated, skipping initialization');
        return;
      }

      const defaultSettings = this.getDefaultSettings(familyId);
      await this.getSettingsRef(familyId).set({
        ...defaultSettings,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        updatedBy: currentUser.uid,
      });

      console.log('✅ [FamilySettingsService] Default settings initialized:', {
        familyId,
      });
    } catch (error: any) {
      // Don't throw error for permission denied - just log it
      if (error.code === 'permission-denied') {
        console.log('⚠️ [FamilySettingsService] Cannot initialize settings (permission denied)');
        return;
      }
      console.error('❌ [FamilySettingsService] Error initializing settings:', error);
      // Don't throw - allow app to continue with default settings
    }
  }
}

export default new FamilySettingsService();
