# Debug Firebase Members Query

## Cách kiểm tra:

### 1. Từ Firebase Console:
- Vào Firestore Database
- Chọn collection `family_members`
- Xem có documents không?
- Kiểm tra structure của 1 document:
  ```json
  {
    "id": "...",
    "familyId": "Y5DNTinviAF8kYr-T8MUe",  // Phải khớp với familyId đang test
    "userId": "...",
    "name": "...",
    "role": "owner|admin|member|child",
    "joinedAt": Timestamp,
    ...
  }
  ```

### 2. Kiểm tra Security Rules:
Firestore > Rules

Tìm đoạn:
```firestore
match /family_members/{memberId} {
  allow list: if isSignedIn() && resource.data.familyId != null;
  allow read: if ...;
  ...
}
```

**Nếu chưa có `allow list`**, thêm vào:
```firestore
allow list: if isSignedIn();
```

### 3. Từ Console Logs:
Khi vào FamilyOverviewScreen, kiểm tra logs:
- `🔍 [FamilyMemberService] Querying family_members for familyId: Y5DNTinviAF8kYr-T8MUe`
- `📦 [FamilyMemberService] Query result: { familyId: ..., docCount: 0, docs: [] }`
  - Nếu `docCount: 0` → Không có documents hoặc query bị từ chối
- `❌ [FamilyMemberService] Error fetching family members: Error: ...`
  - Nếu có lỗi → Đó là vấn đề (Rules, index, etc.)

## Giải pháp tạm thời (để test):

### Option 1: Tạm thời mở rộng Rules (CHỈ DỠ DEV):
```firestore
match /family_members/{memberId} {
  allow list, read, write: if true;  // ⚠️ DANGER - Chỉ dùng test!
}
```

### Option 2: Test với mock data:
Thêm vào screen nếu `familyMembers.length === 0`:
```typescript
const mockMembers: FamilyMemberUI[] = [
  {
    userId: 'user1',
    name: 'Bố',
    role: 'owner',
    finance: { income: 50000000, expense: 30000000, saving: 20000000 },
    habits: { completed: 8, total: 10, streak: 15 },
  },
  // ...
];
```

## Dự đoán vấn đề:
1. **Query bị từ chối** vì chưa có `allow list` trong Rules
2. **Dữ liệu chưa được tạo** trong `family_members` collection
3. **Structure dữ liệu sai** (missing `familyId` field)
4. **Firestore index không tồn tại** cho compound query với `where` + `orderBy`
