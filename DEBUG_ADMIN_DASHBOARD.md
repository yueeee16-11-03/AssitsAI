# Debug Guide: Family Admin Dashboard

## 🐛 Vấn đề
Màn hình Admin Dashboard không hiển thị dữ liệu

## 🔍 Nguyên nhân có thể
1. **Không có transactions trong tháng hiện tại** (tháng 01/2026)
2. Không có quyền admin
3. Không có members trong gia đình
4. Lỗi khi lấy dữ liệu từ Firestore

## ✅ Cải tiến đã thực hiện

### 1. Thêm Debug Logs chi tiết
**File: FamilyAdminDashboardScreen.tsx**
- ✅ Log currentFamily khi vào màn hình
- ✅ Log kết quả hasAdminAccess
- ✅ Log dashboard data nhận được
- ✅ Log errors chi tiết (message, code, stack)

**File: FamilyAdminService.ts**
- ✅ Log số lượng members tìm thấy
- ✅ Log tất cả transactions trước khi filter
- ✅ Log từng transaction được filter (trong/ngoài tháng)
- ✅ Log số transactions sau filter
- ✅ Warning khi không có transactions

### 2. Thêm chế độ Debug
**Toggle xem tất cả transactions:**
- Thêm button 📅 ở header để chuyển đổi giữa:
  - 🗓️ **Tháng hiện tại** (mặc định)
  - 📅 **Tất cả giao dịch** (debug mode)
  
Điều này giúp kiểm tra xem có transactions hay không, bất kể tháng nào.

### 3. Fix Service Logic
- ✅ Thêm parameter `filterByCurrentMonth` vào `getDashboardData()`
- ✅ Chỉ filter theo tháng khi `filterByCurrentMonth = true`
- ✅ Ghi rõ số transactions bị loại bỏ do filter
- ✅ Thêm warning khi không có transactions

## 📋 Cách Debug

### Bước 1: Kiểm tra Logs
Chạy app và mở React Native Debugger hoặc Metro bundler console, tìm các logs:

```
🔍 [AdminDashboard] Starting fetchData...
📋 [AdminDashboard] currentFamily: {...}
🔑 [AdminDashboard] Checking admin access...
✅ [AdminDashboard] Admin access result: true/false
📊 [FamilyAdminService] Fetching transactions...
👥 [FamilyAdminService] Found members: X
💰 [FamilyAdminService] Total transactions found (before filter): X
✅ Transaction in current month: {...}
🚫 Transaction outside current month: {...}
💰 [FamilyAdminService] Transactions after month filter: X
📋 [FamilyAdminService] Filter removed X transactions
```

### Bước 2: Kiểm tra từng phần

#### ❌ Nếu không có admin access
```
✅ [AdminDashboard] Admin access result: false
```
**Giải pháp:** Đảm bảo user là owner hoặc có role `admin`

#### ❌ Nếu không có members
```
👥 [FamilyAdminService] Found members: 0
⚠️ No members found in family_members collection
```
**Giải pháp:** Kiểm tra collection `family_members` trong Firestore

#### ❌ Nếu không có transactions
```
💰 [FamilyAdminService] Total transactions found (before filter): 0
```
**Giải pháp:** User chưa có transactions, thêm một số transactions test

#### ❌ Nếu có transactions nhưng không trong tháng hiện tại
```
💰 [FamilyAdminService] Total transactions found (before filter): 10
💰 [FamilyAdminService] Transactions after month filter: 0
📋 [FamilyAdminService] Filter removed 10 transactions
```
**Giải pháp:** 
- Nhấn button 📅 trong header để xem **tất cả giao dịch**
- Hoặc thêm transactions trong tháng 01/2026

### Bước 3: Sử dụng Debug Mode
1. Mở màn hình Admin Dashboard
2. Nhấn button **📅** (calendar-clock icon) ở header
3. Sẽ hiện alert "Đã chuyển sang xem tất cả giao dịch"
4. Màn hình sẽ reload và hiển thị ALL transactions (không filter tháng)

## 🧪 Test Cases

### Test 1: Có transactions trong tháng hiện tại
```typescript
// Thêm transaction test trong tháng 01/2026
const testTransaction = {
  amount: 50000,
  type: 'expense',
  category: 'food',
  date: new Date('2026-01-15'),
  createdBy: currentUserId,
};
```

### Test 2: Có transactions nhưng ở tháng khác
```typescript
// Transaction ở tháng 12/2025
const oldTransaction = {
  amount: 100000,
  type: 'expense',
  category: 'shopping',
  date: new Date('2025-12-25'),
  createdBy: currentUserId,
};
```

### Test 3: Không có transactions
- Kiểm tra xem có empty state không
- Log phải hiện: "No transactions found"

## 🔧 Nơi kiểm tra trong Firestore

### 1. Collection `families/{familyId}`
```json
{
  "name": "Gia đình A",
  "ownerId": "userId123",
  "members": {
    "userId123": {
      "role": "admin",
      "displayName": "User A",
      "avatar": "..."
    }
  }
}
```

### 2. Collection `family_members`
```json
{
  "familyId": "familyId123",
  "userId": "userId123",
  "name": "User A",
  "role": "admin"
}
```

### 3. Collection `users/{userId}/transactions`
```json
{
  "amount": 50000,
  "type": "expense",
  "category": "food",
  "date": Timestamp(2026-01-15),
  "createdBy": "userId123"
}
```

## 💡 Tips Debug nhanh

1. **Kiểm tra currentFamily:**
   ```javascript
   console.log('Current Family:', currentFamily);
   ```

2. **Kiểm tra admin access:**
   ```javascript
   const access = await FamilyAdminService.hasAdminAccess(familyId);
   console.log('Has Access:', access);
   ```

3. **Lấy tất cả transactions không filter:**
   ```javascript
   const data = await FamilyAdminService.getDashboardData(familyId, false);
   ```

4. **Test với data giả:**
   ```javascript
   // Trong service, return mock data để test UI
   return {
     stats: {
       totalIncome: 5000000,
       totalExpense: 3000000,
       totalSaving: 2000000,
       savingRate: 40,
       averageTransactionValue: 150000,
       highestSpender: 'Test User',
       spendingTrend: '+5%',
       transactionCount: 20,
       budgetUsage: 60,
     },
     members: [...],
     categories: [...],
     lastUpdated: new Date(),
   };
   ```

## 📝 Checklist Troubleshooting

- [ ] Có currentFamily không?
- [ ] User có quyền admin không?
- [ ] Có members trong family_members collection không?
- [ ] Có transactions trong users/{userId}/transactions không?
- [ ] Transactions có date field không?
- [ ] Date của transactions có trong tháng hiện tại không?
- [ ] Thử dùng debug mode (xem tất cả transactions)
- [ ] Kiểm tra console logs có errors không?
- [ ] Thử refresh lại (pull to refresh)

## 🎯 Kết quả mong đợi

Sau khi debug, màn hình sẽ:
1. ✅ Hiển thị stats (thu nhập, chi tiêu, tiết kiệm)
2. ✅ Hiển thị danh sách members với chi tiêu của từng người
3. ✅ Hiển thị top categories
4. ✅ Hiển thị người chi nhiều nhất
5. ✅ Có thể toggle giữa tháng hiện tại / tất cả giao dịch
