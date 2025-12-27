Màn hình Scan/Receipt Scan: camera view / gallery -> preview -> OCR/parse -> Create Transaction / Attach Receipt.
[Cần hình: Hình 4.4 - Màn hình Quét hóa đơn & kết quả phân tích]
Màn hình WalletDetail: hồ sơ ví/tài khoản bao gồm số dư, biểu đồ chi tiêu, giao dịch gần đây và các hành động Add Transaction / Transfer.
[Cần hình: Hình 4.5 - Màn hình Wallet Detail]
Transaction Feed / Family Feed: danh sách giao dịch, yêu cầu thanh toán, và hoạt động shared wallet; hỗ trợ cuộn vô hạn, lọc, tìm kiếm và comment.
[Cần hình: Hình 4.6 - Màn hình Family Feed / Transaction Feed]
CreateTransactionScreen: tạo giao dịch (expense/income/transfer) với multi-image attachments (hóa đơn), sử dụng OCR để đề xuất các trường và lưu nháp/đăng.
[Cần hình: Hình 4.7 - Màn hình tạo giao dịch (Create Transaction)]
Giao diện trang đăng nhập
Hình 4.6. Giao diện trang đăng nhập
Giao diện trang đăng nhập hệ thống cho phép đăng nhập bằng email/password hoặc Google Sign-In; sau khi xác thực hệ thống điều hướng theo phân quyền (user/admin).

4.1.3 Mô tả các màn hình chính

4.1.3.1. Màn hình Quét hóa đơn (Transaction Capture)
 - Mục đích: chụp/ chọn hóa đơn để trích xuất dữ liệu (merchant, date, total, items) và hỗ trợ tạo giao dịch nhanh.
 - UI/Flow: camera/gallery → preview & crop → OCR/`AIDataParserService` → kết quả hiển thị với actions: Create Transaction / Attach to Existing / Retry.
 - Kỹ thuật: `imagesService` xử lý resize/ compress/ thumbnail; OCR có thể chạy client-side hoặc server-side tùy privacy/cost; offline queue cho upload/OCR.
 - Hình minh họa: Hình 4.4

4.1.3.2. Màn hình Chi tiết Wallet (Wallet Detail)
 - Mục đích: hiển thị thông tin ví, biểu đồ chi tiêu, recent transactions và thao tác quản lý ví (top-up, transfer, export).
 - UI/Flow: header (name, balance) → chart → recent transaction list (filter, search) → actions (Add, Transfer, Invite).
 - Kỹ thuật: dữ liệu realtime từ Firestore (`wallets`, `transactions`); transactions/ batched writes bảo đảm consistency; listeners cho cập nhật live.
 - Hình minh họa: Hình 4.5

4.1.3.3. Màn hình Family Feed / Shared Ledger
 - Mục đích: tổng hợp hoạt động family/shared wallets, requests (payment/settle) và comment/resolve dispute flow.
 - UI/Flow: feed items (transactions, requests) với infinite scroll; request flow: create → notify approver → approve/reject.
 - Kỹ thuật: `familyApi` / `sharedWalletApi` và Cloud Functions để enforce permissions/ workflows; `reportsService` log disputes.
 - Hình minh họa: Hình 4.6

4.1.3.4. Màn hình tạo giao dịch (Create Transaction)
 - Mục đích: tạo/chỉnh sửa giao dịch với attachments (receipt images), split amounts, recurrence và validation.
 - UI/Flow: form (amount, date, category, wallet, participants, tags, notes) → attachments upload (background) → preview & confirm.
 - Kỹ thuật: `TransactionService.createTransaction` thực hiện validation và atomic updates; draft lưu local khi offline.
 - Hình minh họa: Hình 4.7

4.1.3.5. Màn hình Trợ lý AI & Insights (Assistant)
 - Mục đích: cung cấp gợi ý ngân sách, phân tích chi tiêu, cảnh báo bất thường và tương tác dạng chat cho thao tác tự động.
 - UI/Flow: insights cards + chat assistant (quick actions: "Suggest budget", "Categorize receipts", "Create reminder").
 - Kỹ thuật: `AIBudgetSuggestionService`, `AIRecommendationService` + `useAIProcessing`; apply rate-limiting, caching và opt-in controls cho privacy.
 - Hình minh họa: Hình 4.8

4.1.3.6. Màn hình Hồ sơ & Cài đặt người dùng (Profile & Settings)
 - Mục đích: quản lý profile, family, permissions, app settings và hành động nhạy cảm (change password, delete account).
 - UI/Flow: profile header → account settings → family management → app settings → sign out.
 - Kỹ thuật: `AuthService` quản lý profile updates và re-auth; `FamilyService` và `PermissionService` đảm bảo RBAC.
 - Hình minh họa: Hình 4.9

4.1.4. Giao diện quản trị & giám sát
Admin có quyền xem danh sách reports (Reports screen trong Admin Panel), duyệt/ẩn bài viết, xử lý báo cáo, quản lý người dùng và dashboard vận hành.
[Cần hình: Hình 4.10 - Admin Dashboard (reports & moderation)]

4.1.4.1. Màn hình báo cáo (Report Screen)
 - Mục đích: quản lý hàng đợi báo cáo với filter by status (new/processing/closed), xem nội dung chi tiết và thực hiện hành động (hide/delete/ban/close) kèm audit logs.
 - Kỹ thuật: `reportsService` lưu reports, Cloud Functions để notify moderators.

4.1.4.2. Màn hình Dashboard & công cụ kiểm duyệt (Dashboard & Moderation Tools)
 - Mục đích: cung cấp metric (active users, transactions, reports) và batch moderation tools để xử lý nhanh các reports và nội dung vi phạm.

4.2. Triển khai, CI/CD và vận hành — Dự án Assist
Tổng quan: Hệ thống Assist là một ứng dụng mobile-first (React Native) với backend serverless (Firebase Functions) và một số dịch vụ containerized (Image Upload Server). Dưới đây là **nội dung CI/CD và vận hành đã được hiệu chỉnh dựa trên repo hiện tại** (scripts trong `package.json`, `functions/` folder, v.v.).

4.2.1. Xây dựng & CI (cụ thể cho repo)
 - Hiện trạng repo:
   - Root `package.json` có các scripts: `lint`, `test`, `android`, `ios`, `start`.
   - `functions/package.json` có scripts: `lint`, `build`, `serve`, `deploy`.
   - Chưa có workflow CI trong `.github/workflows/` (cần thêm).
 - Khuyến nghị pipeline GitHub Actions (PR + main):
   - jobs:
     - `ci`: runs-on: ubuntu-latest
       - steps: checkout → setup-node@v4 (node >=20) → cache npm → npm ci → npm run lint → npm test → npm run ios/android build step (optional)
     - `integration`: (optional) start firebase emulators (functions) → run integration tests against emulator
     - `release`: on push to `main` or tag → build Android AAB (Gradle) & iOS archive (fastlane) → publish to internal tracks (Google Play internal / TestFlight)
 - Thêm scripts gợi ý vào root `package.json` để thuận tiện CI:
   - `ci`: "npm ci && npm run lint && npm test"
   - `build:android`: script để trigger Gradle assemble (or fastlane lane)
   - `build:ios`: fastlane lane wrapper
 - Signing & secrets: lưu `ANDROID_KEYSTORE`, `KEYSTORE_PASSWORD`, `FASTLANE_MATCH_PASSWORD`, `FIREBASE_DEPLOY_TOKEN` trong GitHub Secrets / Secret Manager.
 - Note: `functions/package.json` đang ghi engine `node:16` — khuyến nghị nâng lên Node 18+ (tương thích Firebase SDK mới) trước khi deploy từ CI.

4.2.2. Triển khai backend & services (repo-specific)
 - Cloud Functions:
   - Build: `npm run build` trong `functions/` (tsc) → compile TS → deploy bằng `firebase deploy --only functions` (sử dụng `FIREBASE_TOKEN` trong CI)
   - Test: dùng `firebase emulators:start --only functions` trong job `integration` để chạy test integration.
 - Image Upload Server:
   - Repo hiện có `image-upload-server` (kiểm tra folder). Nếu deploy, đóng gói Docker image và push sang registry (GHCR/GCR/ECR) → deploy Cloud Run / ECS / App Service.
   - Client `imagesService` cần health check endpoints và retry/queue logic (đã có trong codebase).
 - Storage & CDN: sử dụng Firebase Storage, kết hợp Cloud CDN hoặc signed URLs từ Cloud Storage cho phân phối; cấu hình lifecycle rules để tối ưu chi phí.
 - Infra as Code: lưu các cấu hình (Cloud Run, Pub/Sub, Cloud Tasks, IAM) trong Terraform / deployment templates trong `infra/` (nếu chưa có, khuyến nghị tạo).

4.2.3. Logging, Monitoring & Backup (cụ thể)
 - Mobile crashes: sử dụng Firebase Crashlytics (cài sẵn qua RN Firebase packages). Đăng ký release mapping (proguard, dSYM) trong pipeline.
 - Traces & Errors: Sentry cho frontend/backend; configure release tags from CI build number.
 - Metrics & Alerts: Google Cloud Monitoring + Alerting; hoặc Prometheus/Grafana nếu dùng self-hosted metrics for backend workers.
 - Firestore backups: schedule exports to GCS (daily), test restore runbook in `docs/OPERATIONS.md`.
 - Image backup & lifecycle: configure object lifecycle (cold storage) for older artifacts.

4.2.4. Security & Data Privacy (cụ thể)
 - Firestore Rules: keep rules versioned (store in `firestore.rules`) and validate in CI (lint rules + security tests using emulator).
 - Secrets & Key rotation: keep secrets in GitHub Secrets + recommend Google Secret Manager for runtime secrets; rotate keys periodically.
 - Presigned URLs: use short-lived signed URLs for image upload/download; strip PII and store minimal metadata only.
 - Node engine & dependencies: update `functions/package.json` node engine from 16 → 18/20; run `npm audit` in CI and enable Dependabot for dependency updates.
 - Vulnerability scanning: add image scanning (Trivy) for container images and `npm audit` step in CI.

4.2.5. Khuyến nghị vận hành & runbooks
 - Canary / phased rollout: use percentage rollout (Play Store) and fastlane for staged releases; use feature flags for risky features.
 - Runbooks & incidents: create `docs/OPERATIONS.md` with runbooks (deploy rollback, restore firestore, handle upload server outage).
 - On-call: define escalation policy, integrate pager/Slack alerts for critical alerts.
 - Cost control: add budgets/alerts for Cloud Functions invocations & Cloud Run CPU/memory.

4.2.6. QA automation
 - Emulators: run Firebase Emulator Suite in CI for integration tests; use `functions/serve` and test fixtures.
 - E2E: add Detox workflows for Android/iOS in CI (optional, nightly runs recommended).
 - Contract tests: add contract tests for `src/api/*` (verify expected response shapes with backend emulators).

---

Ghi chú: tôi đã làm cho mục 4.2 rõ ràng hơn theo trạng thái repository hiện tại (`package.json`, `functions/`), và thêm khuyến nghị hành động (nâng node engine, thêm CI workflows, secrets). Tôi có thể tiếp theo: 1) tạo mẫu GitHub Actions workflow (`.github/workflows/ci.yml`) và `fastlane/Fastfile` scaffold; 2) tạo `docs/OPERATIONS.md` runbooks; 3) thêm security tests cho Firestore rules vào CI. Chọn 1/2/3 hoặc yêu cầu khác.
