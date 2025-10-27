# 🔍 Chi Tiết: TransactionHistoryService vs TransactionService

## 📌 **Tóm Tắt Nhanh**

| Tiêu Chí | TransactionHistoryService | TransactionService |
|----------|--------------------------|-------------------|
| **Lớp** | Presentation/UI Layer | Business/Data Layer |
| **Mục đích** | Formatting, Grouping, Filtering | CRUD, Firebase, Data Sync |
| **Dữ liệu** | Display data (đã có) | Manipulate data (thêm/sửa/xóa) |
| **Firebase** | ❌ Không gọi | ✅ Gọi trực tiếp |
| **Kết quả** | Formatted strings, Grouped objects | Fresh data từ server |

---

## 🎨 **TransactionHistoryService - UI Logic Layer**

### **Vị trí:** `src/services/TransactionHistoryService.js`

### **Mục đích:** Xử lý logic hiển thị dữ liệu trên màn hình

### **Các hàm và Logic:**

#### 1️⃣ **formatFullDateTime(dateObj)** - Format thời gian đầy đủ
```typescript
// Input: Firestore Timestamp hoặc Date object
// Output: "HH:MM, DD/MM/YYYY"

formatFullDateTime(new Date('2025-10-26T14:30:00'))
→ "14:30, 26/10/2025"

// Dùng ở đâu: TransactionHistoryScreen để hiển thị thời gian chi tiết
```

**Logic:**
- Lấy hours, minutes từ date
- Lấy day, month, year
- Format string theo định dạng: `${hours}:${minutes}, ${day}/${month}/${year}`
- Xử lý error → return '--:--, --/--/----'

---

#### 2️⃣ **formatDate(dateObj)** - Format ngày với "Hôm nay/Hôm qua"
```typescript
// Input: Firestore Timestamp hoặc Date object
// Output: "Hôm nay (DD/MM/YYYY)" hoặc "Hôm qua (DD/MM/YYYY)" hoặc "DD/MM/YYYY"

formatDate(today) → "Hôm nay (27/10/2025)"
formatDate(yesterday) → "Hôm qua (26/10/2025)"
formatDate(lastWeek) → "20/10/2025"

// Dùng ở đâu: groupTransactionsByDate() để tạo date keys
```

**Logic:**
- So sánh với hôm nay → return "Hôm nay (DD/MM/YYYY)"
- So sánh với hôm qua → return "Hôm qua (DD/MM/YYYY)"
- Nếu không → return "DD/MM/YYYY"

---

#### 3️⃣ **formatTime(dateObj)** - Format chỉ giờ phút
```typescript
// Input: Firestore Timestamp hoặc Date object
// Output: "HH:MM"

formatTime(new Date('2025-10-26T14:30:00'))
→ "14:30"

// Dùng ở đâu: Hiển thị giờ trong list
```

**Logic:**
- Lấy hours, minutes
- Format: `${hours}:${minutes}`

---

#### 4️⃣ **groupTransactionsByDate(transactions)** - Nhóm giao dịch theo ngày ⭐ QUAN TRỌNG
```typescript
// Input: Array of transactions
// Output: Object with date keys

const transactions = [
  { id: 1, description: 'Ăn trưa', date: new Date('2025-10-27') },
  { id: 2, description: 'Xăng xe', date: new Date('2025-10-27') },
  { id: 3, description: 'Lương', date: new Date('2025-10-26') },
];

groupTransactionsByDate(transactions)
→ {
  "Hôm nay (27/10/2025)": [
    { id: 1, description: 'Ăn trưa', ... },
    { id: 2, description: 'Xăng xe', ... }
  ],
  "Hôm qua (26/10/2025)": [
    { id: 3, description: 'Lương', ... }
  ]
}

// Dùng ở đâu: TransactionHistoryScreen để render FlatList by date
```

**Logic:**
```
for each transaction:
  get dateKey = formatDate(transaction.date)
  if dateKey not in grouped:
    grouped[dateKey] = []
  grouped[dateKey].push(transaction)
return grouped
```

---

#### 5️⃣ **calculateDailySummary(transactions)** - Tính tổng chi/thu mỗi ngày
```typescript
// Input: Array of transactions (một ngày)
// Output: { expenses: number, income: number }

const dayTransactions = [
  { type: 'expense', amount: 100000 },
  { type: 'expense', amount: 50000 },
  { type: 'income', amount: 500000 },
];

calculateDailySummary(dayTransactions)
→ {
  expenses: 150000,
  income: 500000
}

// Dùng ở đâu: TransactionHistoryScreen hiển thị "💸 ₫150,000 💰 ₫500,000"
```

**Logic:**
```
expenses = sum all transactions where type === 'expense'
income = sum all transactions where type === 'income'
return { expenses, income }
```

---

#### 6️⃣ **getCategoryEmoji(categoryId)** - Lấy emoji từ category ID
```typescript
// Input: categoryId (string)
// Output: Emoji character

getCategoryEmoji('1') → "🍔"  // Ăn uống
getCategoryEmoji('2') → "🚗"  // Di chuyển
getCategoryEmoji('3') → "🛍️"  // Mua sắm
getCategoryEmoji('7') → "🏠"  // Nhà cửa
getCategoryEmoji('9') → "💼"  // Lương
getCategoryEmoji('99') → "💳" // Default

// Dùng ở đâu: Render transaction item với emoji
```

**Logic:**
```
const emojiMap = {
  '1': '🍔', '2': '🚗', '3': '🛍️', ..., '12': '💰'
}
return emojiMap[categoryId] || '💳'
```

---

#### 7️⃣ **filterByType(transactions, type)** - Lọc expense/income
```typescript
// Input: Array transactions, type ('expense' or 'income')
// Output: Filtered array

filterByType(transactions, 'expense')
→ [ {...}, {...} ] // chỉ expense

// Dùng ở đâu: Search/filter feature
```

---

#### 8️⃣ **filterByCategory(transactions, categoryId)** - Lọc theo danh mục
```typescript
// Input: Array transactions, categoryId
// Output: Filtered array chỉ có categoryId đó

filterByCategory(transactions, '1')
→ [ {...}, {...} ] // chỉ danh mục Ăn uống

// Dùng ở đâu: Filter by category feature
```

---

#### 9️⃣ **searchTransactions(transactions, keyword)** - Tìm kiếm
```typescript
// Input: Array transactions, keyword (string)
// Output: Transactions match description hoặc category

searchTransactions(transactions, 'ăn')
→ [
  { description: 'Ăn trưa', ... },
  { description: 'Ăn tối', ... }
]

// Dùng ở đâu: Search feature
```

---

#### 🔟 **getStatistics(transactions)** - Lấy thống kê
```typescript
// Input: Array transactions
// Output: Stats object

getStatistics(transactions)
→ {
  totalTransactions: 25,
  totalExpenses: 1500000,
  totalIncome: 5000000,
  netAmount: 3500000,
  averageTransaction: 260000,
  expenseCount: 20,
  incomeCount: 5
}

// Dùng ở đâu: Dashboard analytics
```

---

#### 1️⃣1️⃣ **sortByAmountDesc(transactions)** - Sắp xếp theo số tiền
```typescript
// Input: Array transactions
// Output: Sorted array (cao → thấp)

// Dùng ở đâu: Sort feature
```

---

#### 1️⃣2️⃣ **sortByDateDesc(transactions)** - Sắp xếp theo ngày
```typescript
// Input: Array transactions
// Output: Sorted array (mới → cũ)

// Dùng ở đâu: Sort feature
```

---

### **🎯 Tóm tắt TransactionHistoryService:**

| Hàm | Input | Output | Mục đích |
|-----|-------|--------|---------|
| formatFullDateTime | Timestamp | "14:30, 26/10/2025" | Hiển thị thời gian |
| formatDate | Timestamp | "Hôm nay (27/10/2025)" | Hiển thị header ngày |
| formatTime | Timestamp | "14:30" | Hiển thị giờ |
| **groupTransactionsByDate** ⭐ | transactions[] | `{dateKey: []}` | **Nhóm by ngày** |
| calculateDailySummary | transactions[] | `{expenses, income}` | Tính tổng per day |
| getCategoryEmoji | categoryId | "🍔" | Hiển thị icon |
| filterByType | transactions[], type | transactions[] | Lọc |
| filterByCategory | transactions[], catId | transactions[] | Lọc |
| searchTransactions | transactions[], keyword | transactions[] | Tìm |
| getStatistics | transactions[] | stats object | Thống kê |
| sortByAmountDesc | transactions[] | transactions[] | Sắp xếp |
| sortByDateDesc | transactions[] | transactions[] | Sắp xếp |

---

## 🔧 **TransactionService - Business Logic Layer**

### **Vị trí:** `src/services/TransactionService.js`

### **Mục đích:** Xử lý CRUD operation + Firebase + Data synchronization

### **Các hàm và Logic:**

#### 1️⃣ **getAllTransactions()** - Lấy tất cả giao dịch từ Firebase
```typescript
// Input: (none)
// Output: Array of all transactions

const transactions = await TransactionService.getAllTransactions();

// Dùng ở đâu: Store.fetchTransactions() gọi hàm này
```

**Logic:**
```typescript
// CRITICAL: source: 'server' buộc đọc từ server
// Bypass cache → Luôn lấy dữ liệu mới nhất
const snapshot = await firestore()
  .collection('users')
  .doc(currentUser.uid)
  .collection('transactions')
  .orderBy('createdAt', 'desc')
  .get({ source: 'server' });  // ← KEY: bypass cache

const transactions = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
}));

return transactions;
```

---

#### 2️⃣ **addTransaction(transactionData)** - Thêm giao dịch mới
```typescript
// Input: { type, amount, description, category, categoryId, ... }
// Output: { success: true, newTransactionId, freshData }

const result = await TransactionService.addTransaction({
  type: 'expense',
  amount: 50000,
  description: 'Ăn trưa',
  categoryId: '1',
  category: 'Ăn uống'
});

result:
→ {
  success: true,
  newTransactionId: 'abc123',
  freshData: [
    { id: 'abc123', type: 'expense', amount: 50000, ... },
    { id: 'xyz789', type: 'income', amount: 500000, ... },
    ...
  ]
}

// Dùng ở đâu: Store.addTransaction() gọi hàm này
```

**Logic:**
```typescript
// Step 1: Validate input
validateTransactionData(transactionData)

// Step 2: Prepare data
const dataToSave = {
  ...transactionData,
  userId: currentUser.uid,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

// Step 3: Add to Firebase
const docRef = await firestore()
  .collection('users')
  .doc(currentUser.uid)
  .collection('transactions')
  .add(dataToSave);

// Step 4: ⭐ CRITICAL - Fetch fresh data từ server
const freshTransactions = await getAllTransactions(); // source: 'server'

// Step 5: Return freshData
return {
  success: true,
  newTransactionId: docRef.id,
  freshData: freshTransactions
};
```

**Tại sao fetch fresh?**
- ✅ Đảm bảo Store nhận dữ liệu mới nhất từ server
- ✅ Tránh cache issues
- ✅ Đồng bộ tất cả screens

---

#### 3️⃣ **updateTransaction(transactionId, updateData)** - Sửa giao dịch
```typescript
// Input: transactionId, { type, amount, description, ... }
// Output: { success: true, updatedId, freshData }

const result = await TransactionService.updateTransaction('abc123', {
  type: 'expense',
  amount: 75000,  // Changed from 50000
  description: 'Ăn tối',  // Changed from 'Ăn trưa'
  category: 'Ăn uống',
  categoryId: '1'
});

result:
→ {
  success: true,
  updatedId: 'abc123',
  freshData: [
    { id: 'abc123', type: 'expense', amount: 75000, description: 'Ăn tối', ... },
    { id: 'xyz789', type: 'income', amount: 500000, ... },
    ...
  ]
}

// Dùng ở đâu: Store.updateTransaction() gọi hàm này
```

**Logic:**
```typescript
// Step 1: Validate
validateTransactionData(updateData, true) // true = partial update

// Step 2: Prepare update data
const dataToUpdate = {
  ...updateData,
  updatedAt: serverTimestamp(),
};

// Step 3: Update Firebase
await firestore()
  .collection('users')
  .doc(currentUser.uid)
  .collection('transactions')
  .doc(transactionId)
  .update(dataToUpdate);

// Step 4: ⭐ CRITICAL - Fetch fresh data
const freshTransactions = await getAllTransactions();

// Step 5: Return freshData
return {
  success: true,
  updatedId: transactionId,
  freshData: freshTransactions
};
```

---

#### 4️⃣ **deleteTransaction(transactionId)** - Xóa giao dịch ⭐ QUAN TRỌNG
```typescript
// Input: transactionId
// Output: { success: true, deletedId, freshData }

const result = await TransactionService.deleteTransaction('abc123');

result:
→ {
  success: true,
  deletedId: 'abc123',
  freshData: [
    { id: 'xyz789', type: 'income', amount: 500000, ... },
    { id: 'def456', type: 'expense', amount: 100000, ... },
    ...
    // ❌ 'abc123' ĐÃ BIẾN MẤT
  ]
}

// Dùng ở đâu: Store.deleteTransaction() gọi hàm này
```

**Logic:**
```typescript
// Step 1: Delete from Firebase
await firestore()
  .collection('users')
  .doc(currentUser.uid)
  .collection('transactions')
  .doc(transactionId)
  .delete();

// Step 2: ⭐ CRITICAL - Wait a bit (ensure delete propagates)
await delay(500); // Wait 500ms

// Step 3: ⭐ CRITICAL - Fetch fresh data from server
const freshTransactions = await getAllTransactions(); // source: 'server'

// Step 4: Return freshData (without deleted transaction)
return {
  success: true,
  deletedId: transactionId,
  freshData: freshTransactions // ← Giao dịch xóa đã biến mất
};
```

**Tại sao wait + fetch fresh?**
- ⏳ **Wait 500ms:** Đảm bảo Firebase đã xóa thực sự
- 🔄 **Fetch fresh:** Lấy dữ liệu mới nhất không có transaction xóa
- ✅ **Đồng bộ:** Store nhận dữ liệu chính xác

---

### **🎯 Tóm tắt TransactionService:**

| Hàm | Input | Output | Mục đích |
|-----|-------|--------|---------|
| getAllTransactions | (none) | transactions[] | Lấy từ Firebase |
| **addTransaction** ⭐ | transactionData | `{success, id, freshData}` | **Thêm + return fresh** |
| **updateTransaction** ⭐ | id, data | `{success, id, freshData}` | **Sửa + return fresh** |
| **deleteTransaction** ⭐ | id | `{success, id, freshData}` | **Xóa + return fresh** |

---

## 📊 **So Sánh Chi Tiết**

```
┌─────────────────────────────────────────────────────────────────┐
│ TransactionHistoryService (UI Logic)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Input: transactions[] (đã có dữ liệu)                          │
│                                                                 │
│ formatFullDateTime() → "14:30, 26/10/2025"                     │
│ formatDate() → "Hôm nay (27/10/2025)"                          │
│ groupTransactionsByDate() → {dateKey: [...]}  ⭐               │
│ calculateDailySummary() → {expenses, income}                   │
│ getCategoryEmoji() → "🍔"                                       │
│ filterByType() → filtered[]                                     │
│ searchTransactions() → filtered[]                               │
│ getStatistics() → stats                                         │
│ sortByAmountDesc() → sorted[]                                  │
│ sortByDateDesc() → sorted[]                                    │
│                                                                 │
│ Output: Formatted/Grouped/Filtered strings & objects            │
│                                                                 │
│ Firebase: ❌ Không gọi                                          │
│ State: ❌ Không modify                                          │
│ Side effect: ❌ Không có                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TransactionService (Business Logic)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Input: transactionData hoặc ID                                  │
│                                                                 │
│ getAllTransactions()                                            │
│   → Firebase.get({ source: 'server' })                         │
│   → return transactions[]                                       │
│                                                                 │
│ addTransaction(data)                                            │
│   → Firebase.add(data)                                          │
│   → getAllTransactions() ⭐ fetch fresh                         │
│   → return {success, id, freshData}                             │
│                                                                 │
│ updateTransaction(id, data)                                     │
│   → Firebase.update(data)                                       │
│   → getAllTransactions() ⭐ fetch fresh                         │
│   → return {success, id, freshData}                             │
│                                                                 │
│ deleteTransaction(id)                                           │
│   → Firebase.delete()                                           │
│   → wait 500ms                                                  │
│   → getAllTransactions() ⭐ fetch fresh                         │
│   → return {success, id, freshData}                             │
│                                                                 │
│ Output: Fresh data từ server + operation status                 │
│                                                                 │
│ Firebase: ✅ Gọi trực tiếp                                      │
│ State: ✅ Modify (create/update/delete)                         │
│ Side effect: ✅ Has (Firestore changed)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **Ví Dụ Thực Tế**

### **Scenario: Xóa giao dịch**

```
┌─────────────────────────────────────────┐
│ EditTransactionScreen                   │
│ User click "Xóa" button                 │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ handleDelete()                          │
│ useTransactionStore.deleteTransaction() │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ Store.deleteTransaction(id)             │
│ Call Service                            │
└────────────────┬────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────┐
│ TransactionService.deleteTransaction(id)        │
│ Step 1: Firebase.delete(id)                     │
│ Step 2: wait(500ms)                             │
│ Step 3: getAllTransactions() ⭐ fetch fresh     │
│ ← Lấy tất cả giao dịch từ server                 │
│ ← Giao dịch xóa không có trong dữ liệu           │
│ Step 4: return { freshData: [...] }             │
│ ← freshData không có giao dịch vừa xóa           │
└────────────────┬───────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ Store.state.transactions = freshData    │
│ ← Update state                          │
└────────────────┬────────────────────────┘
                 ↓
        ✅ All subscribers triggered
                 ↓
┌─────────────────────────────────────────┐
│ TransactionHistoryScreen                │
│ useTransactionService                   │
│   .groupTransactionsByDate(...)         │
│ ← Nhóm giao dịch theo ngày               │
│ ← Giao dịch xóa không xuất hiện          │
│ Re-render UI                            │
│ ✅ Giao dịch biến mất                   │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ FinanceDashboardScreen                  │
│ useEffect([transactions]) triggered     │
│ ← recentTransactions updated             │
│ Re-render UI                            │
│ ✅ Giao dịch biến mất                   │
└─────────────────────────────────────────┘
```

---

## 📝 **Summary**

### **TransactionHistoryService:**
- 🎨 UI Logic (Format, Group, Filter, Sort)
- 📊 Xử lý dữ liệu đã có
- ❌ Không gọi Firebase
- ✅ Pure functions (input → output)
- 📍 Nơi dùng: TransactionHistoryScreen render

### **TransactionService:**
- 🔧 Business Logic (CRUD operations)
- 💾 Firebase operations
- ✅ Gọi Firebase trực tiếp
- ⭐ Luôn fetch fresh data sau CUD
- 📍 Nơi dùng: Store operations

---

## 🔗 **Architecture Pattern**

```
┌─────────────────────────────────────────┐
│ Screen (UI)                             │
│ TransactionHistoryScreen                │
└────────────────┬────────────────────────┘
                 │ (Subscribe Store)
                 │ (Call TransactionHistoryService for formatting)
┌────────────────▼────────────────────────┐
│ Store (State Management)                │
│ useTransactionStore                     │
└────────────────┬────────────────────────┘
                 │ (CRUD operations)
┌────────────────▼────────────────────────┐
│ Services (Business Logic)               │
│ ┌──────────────────────────────────┐   │
│ │ TransactionHistoryService        │   │
│ │ (Formatting, Grouping, Filtering)│   │ ← Pure UI logic
│ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────┐   │
│ │ TransactionService               │   │
│ │ (CRUD, Firebase, Sync)           │   │ ← Business logic
│ └──────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ Firebase (Data Persistence)             │
│ Firestore Database                      │
└─────────────────────────────────────────┘
```

---

## ✅ **Key Takeaway**

| Aspect | TransactionHistoryService | TransactionService |
|--------|--------------------------|-------------------|
| **Làm gì** | Format/Group/Filter data | CRUD/Sync data |
| **Dữ liệu** | Input: có sẵn | Input: muốn thay đổi |
| **Firebase** | ❌ | ✅ |
| **Pure** | ✅ | ❌ (has side effects) |
| **Khi dùng** | Always after get data | Before Store update |
