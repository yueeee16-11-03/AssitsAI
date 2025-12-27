# SYSTEM FUNCTIONS OVERVIEW - ASSIST

Tệp này tóm tắt toàn bộ **chức năng chính**, **actor**, **mô-đun**, **APIs**, **model dữ liệu**, **giao diện** và **yêu cầu bảo mật/kiểm thử** của hệ thống ASSIST — dùng làm tài liệu tham khảo nhanh cho devs, PMs và QA.

---

## 3.2. Tổng quan các chức năng của hệ thống

Theo cấu trúc bạn yêu cầu, phần này được chia thành các mục con 3.2.1 - 3.2.4 để trình bày ngắn gọn, rõ ràng các chức năng chính.

### 3.2.1. Chức năng đăng ký, đăng nhập, đăng xuất (Authentication)
- **Mô tả**: Quản lý lifecycle của người dùng: đăng ký, đăng nhập, đăng xuất, quên mật khẩu, xác thực 2 bước (MFA), đăng nhập xã hội (Google, Apple), quản lý session/token.
- **Chi tiết**:
  - Đăng ký (email/password), xác nhận email.
  - Đăng nhập (email/password), social login (Google/Apple).
  - Quên mật khẩu / đặt lại mật khẩu.
  - Đăng xuất và thu hồi token.
  - Quản lý profile: cập nhật tên, ảnh, thông tin liên hệ.
- **APIs gợi ý**: POST /auth/register, POST /auth/login, POST /auth/logout, POST /auth/password-reset
- **Bảo mật**: Validate input, rate-limit login attempts, support MFA, lưu audit log cho các thay đổi account.

### 3.2.2. Chức năng dành cho người dùng (User-facing features)
- **Mô tả**: Các chức năng mà Member/Child/Owner sẽ tương tác hàng ngày.
- **Danh sách chức năng chính**:
  - Giao dịch: tạo/sửa/xóa giao dịch, đính kèm ảnh, phân loại danh mục, lịch sử và lọc giao dịch.
  - Yêu cầu & Duyệt: gửi yêu cầu chi (request) và nhận phản hồi từ admin.
  - Hạn mức cá nhân: xem hạn mức, nhận cảnh báo gần/qua hạn.
  - Ngân sách: xem ngân sách gia đình, so sánh thực tế vs kế hoạch.
  - Thói quen: tạo, hoàn thành, nhắc nhở, xem streak.
  - Báo cáo cá nhân: biểu đồ, tổng hợp chi tiêu cá nhân.
  - Chat AI: hỏi/nhận gợi ý tài chính, tóm tắt chi tiêu.
  - Thông báo: nhận push/email/in-app cho sự kiện liên quan.
  - Gia đình: tham gia qua invite, xem danh sách thành viên (read-only), gửi yêu cầu tham gia.
- **APIs gợi ý**: POST /transactions, GET /transactions, POST /requests, GET /habits
- **UX**: Mobile-first, feedback rõ ràng khi thao tác (toast/alert), offline-friendly cơ bản.

### 3.2.3. Chức năng dành cho quản trị viên (Admin / Owner features)
- **Mô tả**: Các chức năng quản lý và giám sát dành cho Owner/Admin.
- **Danh sách chức năng chính**:
  - Quản lý gia đình: tạo, chỉnh sửa thông tin gia đình, chuyển owner.
  - Quản lý thành viên: invite/resend/revoke, thêm/xóa, assign role, xem trạng thái thành viên.
  - Duyệt giao dịch & requests: approve/deny giao dịch chờ.
  - Quản lý hạn mức: đặt/hủy hạn mức cho thành viên, bật/tắt quyền chi.
  - Quản lý ngân sách: tạo/sửa phân bổ, điều chỉnh và quản lý cảnh báo vượt.
  - Audit & logs: xem nhật ký hoạt động, theo dõi thay đổi user/family.
  - Quản lý invite: revoke/resend/expire invites.
- **APIs gợi ý**: POST /families, POST /families/{id}/members, PATCH /families/{id}/members/{id}, PATCH /transactions/{id}/approve
- **Bảo mật & Quy tắc**: RBAC (không giảm role của last admin), xác thực trước các hành động quan trọng, confirm dialogs cho destructive actions.

### 3.2.4. Chức năng tích hợp dịch vụ (Integrations & infra)
- **Mô tả**: Các dịch vụ bên ngoài/kết nối hạ tầng mà hệ thống sử dụng.
- **Danh sách tích hợp chính**:
  - Firebase Auth & Firestore: auth, realtime data, rules.
  - Push notifications: FCM / APNs (via server or cloud functions).
  - Email service: SendGrid / SES (invite, password reset, notifications).
  - AI provider: OpenAI / custom model (chat, suggestions, parsing).
  - Logging & Monitoring: Sentry, metrics, audit logs storage.
  - Optional: Payment providers (Stripe) nếu hỗ trợ trả phí/gói.
- **Yêu cầu**: Mỗi tích hợp cần xử lý lỗi & retry/backoff, secure credentials, và có fallback mô tả.

---

Tiếp theo tôi có thể:
- Xuất phần 3.2 này thành slide/markdown riêng `FUNCTIONS_OVERVIEW_3_2.md`, hoặc
- Sinh PlantUML sơ đồ use-case theo từng mục con (vd: một sơ đồ cho user features, một cho admin).

Bạn chọn bước tiếp theo: nào bạn muốn tôi thực hiện?

## 3. Actors & Roles
- **Owner**: Toàn quyền trên gia đình (transfer ownership, manage members)
- **Admin**: Quản trị (approve transactions, manage members, adjust budgets/limits)
- **Member**: Tạo giao dịch, xem báo cáo, quản lý thói quen
- **Child**: Tạo giao dịch có giới hạn, nhận/gửi yêu cầu
- **System**: Jobs, notifications, scheduled checks

---

## 4. Data Model (core collections)
- families { id, name, ownerId, avatar, createdAt, settings }
- family_members { id, familyId, userId, role, spendingLimit, canSpend, permissions, joinedAt }
- users { id, name, email, avatar, profile }
- transactions { id, familyId, userId, amount, category, status, createdAt }
- budgets { id, familyId, period, total, allocations }
- habits { id, familyId, title, assignedTo, schedule, streaks }
- invites { id, familyId, code, email, createdBy, expiresAt, status }
- notifications { id, userId, type, payload, read, createdAt }
- audit_logs { id, actorId, action, metadata, time }

---

## 5. APIs (summary)
- POST /auth/login, POST /auth/register
- POST /families, GET /families/{id}
- POST /families/{id}/invites, POST /invites/{code}/accept
- GET /families/{id}/members, POST/PATCH/DELETE /families/{id}/members/{id}
- POST /transactions, PATCH /transactions/{id}, GET /transactions
- POST /budgets, GET /budgets/{id}
- POST /habits, PATCH /habits/{id}
- POST /notifications, GET /notifications
- POST /ai/chat

Note: Each endpoint phải validate authorization & business rules server-side.

---

## 6. Quy tắc bảo mật & phân quyền (RBAC)
- Role-based permissions: map role -> permissions (canCreateTransaction, canApprove, canManageMembers, canEditFamily, canViewAnalytics,...)
- Firestore rules / backend checks: Only members of a family can read family data; only admins/owners can perform management actions.
- Prevent destructive actions: cannot delete last admin; owner must transfer ownership before leaving.
- Sensitive data protected; follow principle of least privilege.

---

## 7. UI Areas / Screens (high-level)
- Auth: Login, Register, Forgot Password
- Dashboard: Overview, quick stats
- Family: FamilyDetail, Members, Invites
- Transactions: Create, List, Detail, Approval queue
- Budgets: Create, Allocate, Dashboard
- Habits: List, Detail, Edit, Reminders
- Reports: Analytics, Exports
- Chat: AI Assistant, History
- Settings: Profile, Notifications, App Settings

---

## 8. Integration points / External services
- Firebase Auth / Firestore (data + real-time)
- Push Provider (FCM / APNs)
- Email service (SendGrid / SES)
- AI provider (OpenAI / internal model)
- Analytics (Sentry / LogRocket)
- Payment provider if needed (optional)

---

## 9. Monitoring & Observability
- Audit logs for sensitive operations (member management, role changes)
- Error tracking & alerts (Sentry)
- Usage metrics (DAU/MAU, API errors, failed invites)
- Scheduled jobs monitoring (invites expiry, monthly reports)

---

## 10. Testing & QA checklist
- Unit tests for services & permission logic
- Integration tests for API flows (invite accept, transfer ownership)
- E2E tests for key user journeys (create family, invite, transaction exceed limit)
- Security tests for rules and role escalation
- Load tests for analytics and heavy families

---

## 11. Operational notes
- Backups & retention: periodic export of key collections
- Migration path: schema evolution for family_members and transactions
- Feature flags for gradual rollout

---

## 12. Roadmap / Future enhancements
- Spending approval workflows
- Per-member budgets & shared wallets
- Enhanced analytics (predictive budgets)
- Offline-first flows and sync
- Billing & subscription tiers

---

## 13. Where to start (developer quick actions)
1. Review `USE_CASES_DETAILS.md` for use case specifics
2. Implement/verify Firestore rules for `family_members` and `families`
3. Add server-side validations in FamilyService and TransactionService
4. Add tests listed in section 10
5. Deploy rules then test invite/accept & ownership flows

---

*File created: SYSTEM_FUNCTIONS_OVERVIEW.md*