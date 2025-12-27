/**
 * familyMemberApi.ts
 * API layer cho family_members collection
 */

import FamilyMemberService, {
  FamilyMember,
  FamilyRole,
  SpendingLimit,
  FamilyMemberStats,
} from '../services/FamilyMemberService';

// --- Get operations ---

export async function getFamilyMember(
  familyId: string,
  userId: string
): Promise<FamilyMember> {
  return FamilyMemberService.getFamilyMember(familyId, userId);
}

export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  return FamilyMemberService.getFamilyMembers(familyId);
}

export async function getFamilyMemberStats(familyId: string): Promise<FamilyMemberStats> {
  return FamilyMemberService.getFamilyMemberStats(familyId);
}

export async function getUserRoleInFamily(
  familyId: string,
  userId: string
): Promise<FamilyRole | null> {
  return FamilyMemberService.getUserRoleInFamily(familyId, userId);
}

// --- Create operations ---

export async function createFamilyMember(
  familyId: string,
  userId: string,
  role?: FamilyRole,
  spendingLimit?: SpendingLimit,
  isChild?: boolean
): Promise<FamilyMember> {
  return FamilyMemberService.createFamilyMember(
    familyId,
    userId,
    role || 'member',
    spendingLimit,
    isChild
  );
}

// --- Update operations ---

export async function updateMemberRole(
  familyId: string,
  targetUserId: string,
  newRole: FamilyRole
): Promise<void> {
  return FamilyMemberService.updateMemberRole(familyId, targetUserId, newRole);
}

export async function updateSpendingLimit(
  familyId: string,
  targetUserId: string,
  spendingLimit: SpendingLimit | null
): Promise<void> {
  return FamilyMemberService.updateSpendingLimit(
    familyId,
    targetUserId,
    spendingLimit
  );
}

export async function setChildStatus(
  familyId: string,
  targetUserId: string,
  isChild: boolean
): Promise<void> {
  return FamilyMemberService.setChildStatus(familyId, targetUserId, isChild);
}

export async function transferOwnership(
  familyId: string,
  newOwnerId: string
): Promise<void> {
  return FamilyMemberService.transferOwnership(familyId, newOwnerId);
}

// --- Delete operations ---

export async function removeMember(
  familyId: string,
  targetUserId: string
): Promise<void> {
  return FamilyMemberService.removeMember(familyId, targetUserId);
}

// --- Permission checks ---

export async function isUserAuthorizedInFamily(
  familyId: string,
  userId: string,
  requiredRoles: FamilyRole[]
): Promise<boolean> {
  return FamilyMemberService.isUserAuthorizedInFamily(
    familyId,
    userId,
    requiredRoles
  );
}

export async function isUserOwnerOfFamily(
  familyId: string,
  userId: string
): Promise<boolean> {
  return FamilyMemberService.isUserOwnerOfFamily(familyId, userId);
}
