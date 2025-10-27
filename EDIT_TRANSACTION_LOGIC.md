# 📝 EditTransactionScreen: Sửa & Xóa Logic

## 🎯 **Overview**

File `EditTransactionScreen.tsx` xử lý **2 tác vụ chính:**
1. **✏️ Sửa giao dịch** (Update)
2. **🗑️ Xóa giao dịch** (Delete)

---

## 🔄 **Data Flow Architecture**

```
EditTransactionScreen (UI)
    ↓
handleSave() / handleDelete()
    ↓
Store.updateTransaction() / Store.deleteTransaction()
    ↓
TransactionService (Business Logic)
    ↓
Firebase (Firestore)
    ↓
return freshData
    ↓
Store.state.transactions updated
    ↓
All subscribed screens auto-update ✅
```

---

## ✏️ **LOGIC SỬA (handleSave)**

### Flow Chi Tiết:

```typescript
const handleSave = async () => {
  // 1️⃣ VALIDATION - Kiểm tra dữ liệu
  if (!amount.trim()) {
    Alert.alert("Lỗi", "Vui lòng nhập số tiền");
    return;
  }

  // 2️⃣ GET CATEGORY NAME - Lấy tên danh mục từ ID
  const selectedCategoryObj = allCategories.find(
    (cat) => cat.id === selectedCategory
  );
  const categoryName = selectedCategoryObj?.name || "Khác";

  // 3️⃣ PREPARE UPDATE DATA - Chuẩn bị dữ liệu cập nhật
  const updateData = {
    type,           // "expense" or "income"
    amount: parseInt(amount, 10),
    description: note,
    category: categoryName,
    categoryId: selectedCategory,
  };

  // 4️⃣ CALL STORE - Gọi Store (không phải API)
  await useTransactionStore.getState().updateTransaction(transaction.id, updateData);
  
  // 5️⃣ BACK TO HISTORY - Quay lại danh sách giao dịch
  navigation.goBack();
};
```

### Cơ chế hoạt động:

| Step | Action | Result |
|------|--------|--------|
| 1 | `useTransactionStore.getState().updateTransaction(id, data)` | Store action triggered |
| 2 | `TransactionService.updateTransaction(id, data)` | Service receive từ Store |
| 3 | `Firebase.update()` | Firestore updated |
| 4 | `TransactionService.getAllTransactions()` | Fetch fresh từ server |
| 5 | `Store.state.transactions = freshData` | Store updated |
| 6 | Screens re-render | **TransactionHistoryScreen tự động update** |

### Kết quả:
- ✅ Firestore: Document updated
- ✅ Store: state.transactions synced
- ✅ TransactionHistoryScreen: Giao dịch được cập nhật
- ✅ FinanceDashboardScreen: Recent transactions updated

---

## 🗑️ **LOGIC XÓA (handleDelete)**

### Flow Chi Tiết:

```typescript
const handleDelete = () => {
  // 1️⃣ CONFIRMATION DIALOG - Xác nhận xóa
  Alert.alert(
    "Xác nhận xóa",
    "Bạn có chắc muốn xóa giao dịch này?",
    [
      {
        text: "Hủy",
        onPress: () => {}, // User cancel
        style: "cancel",
      },
      {
        text: "Xóa",
        onPress: async () => {
          // 2️⃣ SET LOADING - Hiển thị loading state
          setIsLoading(true);
          
          try {
            // 3️⃣ CALL STORE DELETE - Gọi Store để xóa
            await useTransactionStore.getState().deleteTransaction(transaction.id);
            
            // 4️⃣ SHOW SUCCESS - Hiển thị thành công
            Alert.alert("Thành công", "Đã xóa giao dịch", [
              {
                text: "OK",
                onPress: () => {
                  // 5️⃣ BACK TO HISTORY - Quay lại
                  navigation.goBack();
                },
              },
            ]);
          } catch (error) {
            // 6️⃣ ERROR HANDLING - Xử lý lỗi
            Alert.alert("Lỗi", "Không thể xóa giao dịch: " + errorMsg);
            setIsLoading(false);
          }
        },
        style: "destructive",
      },
    ]
  );
};
```

### Cơ chế hoạt động:

| Step | Action | Result |
|------|--------|--------|
| 1 | User bấm Delete button | `handleDelete()` triggered |
| 2 | Alert confirmation dialog | User chọn "Xóa" hoặc "Hủy" |
| 3 | User chọn "Xóa" | Callback trigger |
| 4 | `Store.deleteTransaction(id)` | Store action triggered |
| 5 | `TransactionService.deleteTransaction(id)` | Service delete từ Firebase |
| 6 | `Firebase.delete()` | Document xóa khỏi Firestore |
| 7 | `TransactionService.getAllTransactions()` | Fetch fresh (remaining) |
| 8 | `Store.state.transactions = freshData` | Store updated (without deleted) |
| 9 | Screens re-render | **TransactionHistoryScreen & FinanceDashboard update** |
| 10 | `navigation.goBack()` | Quay lại TransactionHistoryScreen |

### Kết quả:
- ✅ Firestore: Document deleted
- ✅ Store: state.transactions synced (giao dịch removed)
- ✅ TransactionHistoryScreen: Giao dịch disappear
- ✅ FinanceDashboardScreen: Recent transactions updated
- ✅ App: Quay lại danh sách giao dịch

---

## 📊 **File/Service Responsibility Mapping**

### EditTransactionScreen.tsx
```typescript
// Xử lý logic:
✅ Validation (kiểm tra input)
✅ User interaction (handleSave, handleDelete)
✅ UI rendering (form, buttons, alerts)
✅ Navigation (goBack)

// Gọi Store (không gọi Service/API trực tiếp):
✅ Store.updateTransaction()
✅ Store.deleteTransaction()
```

### Store (transactionStore.js)
```typescript
// Xử lý logic:
✅ Receive action từ Screen
✅ Call TransactionService
✅ Update state.transactions với freshData
✅ Trigger subscribers (TransactionHistoryScreen, FinanceDashboardScreen)
```

### TransactionService.js
```typescript
// Xử lý logic:
✅ updateTransaction() → Firebase.update() + getAllTransactions()
✅ deleteTransaction() → Firebase.delete() + getAllTransactions()
✅ Return { success, id, freshData }
```

### Firebase (Firestore)
```typescript
// Xử lý logic:
✅ Thực tế lưu/xóa document
✅ Trả về dữ liệu cho Service
```

---

## 🔗 **Complete Flow Diagram**

### Sửa giao dịch:
```
EditScreen
  ↓ (handleSave)
Store.updateTransaction(id, data)
  ↓
TransactionService.updateTransaction(id, data)
  ↓
Firebase.update()
  ↓
TransactionService.getAllTransactions() ← fetch fresh
  ↓
Store.state.transactions = freshData
  ↓ (Subscribers triggered)
TransactionHistoryScreen re-render ✅
FinanceDashboardScreen re-render ✅
  ↓
EditScreen navigation.goBack()
```

### Xóa giao dịch:
```
EditScreen
  ↓ (User confirms delete)
handleDelete() → Alert dialog
  ↓ (User clicks "Xóa")
Store.deleteTransaction(id)
  ↓
TransactionService.deleteTransaction(id)
  ↓
Firebase.delete()
  ↓
TransactionService.getAllTransactions() ← fetch fresh (no deleted item)
  ↓
Store.state.transactions = freshData
  ↓ (Subscribers triggered)
TransactionHistoryScreen re-render (item disappears) ✅
FinanceDashboardScreen re-render (item disappears) ✅
  ↓
Alert "Thành công"
  ↓
EditScreen navigation.goBack()
```

---

## ⚡ **Key Features**

### 1. Confirmation Dialog
- User phải xác nhận trước khi xóa
- Tránh xóa nhầm

### 2. Loading State
- `isLoading` state để prevent double-click
- Disable buttons khi đang xử lý

### 3. Error Handling
- Try-catch để catch errors
- Show error alert nếu thất bại

### 4. Auto-update (via Store Subscription)
- TransactionHistoryScreen auto-update
- FinanceDashboardScreen auto-update
- Không cần fetch manual

### 5. Navigation
- Quay lại TransactionHistoryScreen sau sửa/xóa
- Back button để cancel

---

## 📝 **Summary Table**

| Aspect | Sửa (Update) | Xóa (Delete) |
|--------|---------|--------|
| **Trigger** | Bấm "Lưu thay đổi" | Bấm "Xóa giao dịch" |
| **Validation** | Kiểm tra input | Confirm dialog |
| **Store call** | `updateTransaction()` | `deleteTransaction()` |
| **Service call** | `updateTransaction()` | `deleteTransaction()` |
| **Firebase** | `.update()` | `.delete()` |
| **Result** | Document updated | Document deleted |
| **Fresh data** | Fetch + return | Fetch + return |
| **Screen update** | Auto via subscription | Auto via subscription |
| **Navigation** | goBack() | goBack() |

---

## 🎯 **Testing Checklist**

### Test Sửa:
```
1. ✅ Mở EditTransactionScreen
2. ✅ Sửa amount/description/category
3. ✅ Bấm "Lưu thay đổi"
4. ✅ Quay lại TransactionHistoryScreen
5. ✅ Giao dịch được update (tiền, mô tả, danh mục mới)
6. ✅ FinanceDashboardScreen update
7. ✅ Firebase được update
```

### Test Xóa:
```
1. ✅ Mở EditTransactionScreen
2. ✅ Bấm "Xóa giao dịch"
3. ✅ Alert confirm dialog hiện
4. ✅ Bấm "Xóa"
5. ✅ Alert "Thành công" hiện
6. ✅ Quay lại TransactionHistoryScreen
7. ✅ Giao dịch biến mất
8. ✅ FinanceDashboardScreen update (recent transactions)
9. ✅ Firebase document deleted
```

---

## 🔐 **Security & Best Practices**

✅ **Validation:** Kiểm tra input trước send
✅ **Confirmation:** Dialog xác nhận trước xóa
✅ **Error handling:** Try-catch + Alert
✅ **Loading state:** Prevent double-click
✅ **No direct API:** Sử dụng Store (không transactionApi)
✅ **Fresh data:** Luôn fetch từ server sau CUD
✅ **Auto-sync:** Store subscription handles sync
