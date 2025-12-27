# Màn hình & Luồng chính — Assist (Tiếng Việt)

Tài liệu tóm tắt **các màn hình chính** của ứng dụng và **luồng chính** cho mỗi màn hình (phiên bản tiếng Việt). Dùng làm hướng dẫn cho UI/FE, backend và QA.

---

## 1. Home / Dashboard
Luồng chính:
- Xem tổng quan (số dư, hành động nhanh, insights)
  - Các bước: Tải dữ liệu người dùng → lấy ví & insights → hiển thị cards
  - Dịch vụ: `AuthService`, collection `wallets`, `AIBudgetSuggestionService` (insights)
  - Tiêu chí: Dashboard tải nhanh (<1s với dữ liệu cache) và hiển thị số dư cập nhật
- Hành động nhanh (Quét / Thêm giao dịch / Trợ lý)
  - Mở màn hình tương ứng với ngữ cảnh đã được điền sẵn
  - Kiểm thử: hành động nhanh mở màn hình đúng và context chính xác

---

## 2. Transaction Capture (Quét hóa đơn)
Luồng chính:
- Quét & OCR → Tạo giao dịch
  - Các bước: Camera/Gallery → Preview & crop → OCR/parse → Điền form → Submit
  - Dịch vụ: `imagesService`, `AIDataParserService`, `TransactionService`
  - Tiêu chí: Gợi ý OCR điền đúng ≥ 80% trường; cơ chế enqueue offline hoạt động
- Gắn biên lai vào giao dịch hiện có
  - Các bước: Chọn giao dịch → Đính ảnh → Upload
  - Dịch vụ: `imagesService`, Firestore

---

## 3. Create Transaction (Tạo giao dịch)
Luồng chính:
- Tạo thủ công
  - Các bước: Mở form → nhập các trường → thêm attachments/splits/recurrence → validate → submit
  - Dịch vụ: `TransactionService`, `NotificationService`, Firestore transactions
  - Tiêu chí: Cập nhật số dư theo kiểu nguyên tử (atomic), hiển thị validation, lưu nháp khi offline
- Chỉnh sửa giao dịch
  - Các bước: Tải giao dịch → chỉnh sửa → submit → cập nhật documents và số dư

---

## 4. Wallet Detail (Chi tiết ví)
Luồng chính:
- Xem & thao tác ví
  - Các bước: Mở wallet → hiển thị biểu đồ & giao dịch gần đây → filter/search → các hành động (Thêm, Chuyển tiền)
  - Dịch vụ: collection `wallets`, real-time listeners, `TransactionService`
  - Tiêu chí: Biểu đồ cập nhật theo dữ liệu realtime; hành động phản ánh ngay lên ví
- Xuất / chia sẻ
  - Các bước: Export CSV / gửi lời mời → tạo file / gửi invite

---

## 5. Transactions List / Family Feed (Danh sách giao dịch / Feed gia đình)
Luồng chính:
- Duyệt & tìm kiếm
  - Các bước: Mở feed → cuộn vô hạn (cursor-based) → filter & search → mở chi tiết
  - Dịch vụ: collection `transactions`/`posts`, Cloud Functions (queries phức tạp)
  - Tiêu chí: Phân trang ổn định, bộ lọc trả về kết quả đúng
- Yêu cầu & phê duyệt
  - Các bước: Tạo request → thông báo approver → Approve/Reject → nếu approve thì tạo giao dịch thanh toán
  - Dịch vụ: `familyApi`/`sharedWalletApi`, Cloud Functions, notifications

---

## 6. Assistant / Insights (Trợ lý & Nhận định)
Luồng chính:
- Yêu cầu gợi ý hoặc phân tích biên lai
  - Các bước: Mở trợ lý → nhập yêu cầu hoặc upload → nhận gợi ý → áp dụng (tạo budget/transaction)
  - Dịch vụ: `AIBudgetSuggestionService`, `AIRecommendationService`, analytics
  - Tiêu chí: Gợi ý có thể thực hiện được và có cơ chế giới hạn chi phí

---

## 7. Create Post / Community (Tạo bài / Cộng đồng) — nếu có
Luồng chính:
- Tạo & xuất bản bài
  - Các bước: Tạo bài → upload nhiều ảnh → chọn tags → publish/draft → feed cập nhật
  - Dịch vụ: `postsService`, `imagesService`, `reportsService`
  - Tiêu chí: Ảnh upload hoàn tất và bài xuất hiện trên feed; có workflow moderation cho bài cần duyệt
- Báo cáo nội dung
  - Các bước: Người dùng flag → `reportsService.createReport` → admin nhận thông báo

---

## 8. Profile & Settings (Hồ sơ & Cài đặt)
Luồng chính:
- Cập nhật hồ sơ
  - Các bước: Sửa thông tin → validate → submit → update document `users`
  - Dịch vụ: `AuthService`, Firestore
  - Tiêu chí: Hành động nhạy cảm yêu cầu re-auth và có audit
- Quản lý gia đình & phân quyền
  - Các bước: Invite member → phân role → quản lý shared wallets
  - Dịch vụ: `FamilyService`, `PermissionService`

---

## 9. Admin: Reports & Dashboard (Quản trị)
Luồng chính:
- Xử lý báo cáo
  - Các bước: Moderator xem queue → mở report → thực hiện hành động (ẩn/xóa/khóa/đóng) → ghi audit log
  - Dịch vụ: `reportsService`, Cloud Functions, admin dashboard
  - Tiêu chí: Hành động ghi log; gửi thông báo cho người báo khi cần
- Giám sát chỉ số
  - Các bước: Dashboard tổng hợp metric (users, transactions, reports)
  - Dịch vụ: analytics backend, Cloud Functions

---

## Ghi chú chung
- Offline & retry: uploads và tạo transaction phải enqueue & retry khi mạng trở lại.
- Auth & permissions: RBAC được enforced server-side (Cloud Functions / Firestore Rules).
- Observability: tích hợp Sentry / structured logs cho các luồng quan trọng.
- Tests: viết unit, integration (emulator) và E2E cho mỗi luồng chính.

---

Nếu bạn muốn, tôi có thể:
- Chuyển từng mục thành checklist kiểm thử (một file / màn hình),
- Vẽ sequence diagram cho các luồng ưu tiên (Scan→Create, Create Transaction, Request→Approval), hoặc
- Scaffold sample API contracts hoặc components cho `Create Transaction` UI.

Chọn 1/2/3 hoặc yêu cầu khác — tôi sẽ tiếp tục.