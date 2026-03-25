# Project Restructuring Tasks (Direct & Modular)

Mục tiêu: Tổ chức lại code theo đúng vị trí của từng trang/tính năng cho dễ quản lý.

## 1. Khởi tạo cấu trúc Module-based
- [x] Tạo thư mục `src/features/home` cho trang chủ.
- [x] Tạo thư mục `src/features/privacy` cho trang bảo mật.
- [ ] Tạo thư mục `src/features/cases` cho module hồ sơ vụ án.
- [ ] Tạo thư mục `src/components/common` cho các thành phần dùng chung (như Chat).
- [ ] Tạo thư mục `src/lib` cho các logic xử lý dữ liệu (GitHub, AI).

## 2. Module Home (Trang chủ)
- [x] Di chuyển logic UI -> `src/features/home/HomeClient.js`.
- [x] Tách `CaseArchivesCanvas.js` ra khỏi HomeClient cho SOLID.
- [x] Gom các component phụ vào `src/features/home/components/` (Hero, About).
- [x] Cập nhật import trong `src/app/page.js`.

## 3. Module Privacy
- [x] Di chuyển `PrivacyClient.js` -> `src/features/privacy/PrivacyClient.js`.
- [x] Cập nhật import trong `src/app/privacy/page.js`.

## 4. Module Case Archives (Sẽ làm tiếp theo)
- [ ] Di chuyển `src/app/case/[[...slug]]/CaseClient.js` -> `src/features/cases/CaseClient.js`.
- [ ] Gom component riêng vào `src/features/cases/components/`.
- [ ] Tách `Chat.js` ra thư mục dùng chung `src/components/common/`.
- [ ] Cập nhật import trong Layout và Page của Case.

## 5. Lib Layer & API Refactor
- [ ] Tách logic GitHub/AI ra các file trong `src/lib/`.
- [ ] Refactor `api/cases/route.js`.
