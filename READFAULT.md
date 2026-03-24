# 📔 Hồi Ký Kỹ Thuật: Cú "Vấp" Serverless & Bài Học Về Tính Nhất Quán

## 1. Bối Cảnh (The Setup)
Tôi định xây dựng một hệ thống đồng bộ dữ liệu từ GitHub về Server Vercel. Ý tưởng ban đầu là:
* Cho server "thức" để đợi gom thay đổi (Buffering).
* Lưu tạm dữ liệu vào RAM để xử lý nhanh (Optimistic Update).
* Hy vọng các Instance có thể "nói chuyện" hoặc dùng chung tài nguyên với nhau.

## 2. Những "Ảo Tưởng" Kỹ Thuật (The Misconceptions)

### ❌ Ảo tưởng 1: RAM là dùng chung
* **Nghĩ là:** Các Instance của Vercel dùng chung một vùng nhớ RAM, nên Instance A lưu thì Instance B sẽ thấy.
* **Thực tế:** Mỗi Instance là một **Container cô lập hoàn toàn**. RAM của thằng nào thằng nấy giữ. Instance A ghi vào RAM xong, Instance B mở ra vẫn thấy... trống không.

### ❌ Ảo tưởng 2: Serverless là một chiếc máy tính thức 24/7
* **Nghĩ là:** Có thể dùng `setTimeout` hoặc `setInterval` để chờ 5s rồi mới làm việc.
* **Thực tế:** Serverless hoạt động theo cơ chế **Event-driven**. Ngay khi trả về `response` cho khách, Vercel có quyền "cắt điện" (freeze) hàm đó ngay lập tức. Mọi lệnh đợi chờ sau đó đều bị treo giò.

### ❌ Ảo tưởng 3: GitHub là một Database
* **Nghĩ là:** Dùng GitHub để lưu data cho nhanh và tiện.
* **Thực tế:** GitHub có **Write Latency** (độ trễ khi ghi) cực cao vì phải tạo Commit/Push. Đặc biệt, nếu nhiều Instance cùng Push một lúc, GitHub sẽ báo lỗi `Conflict/Rejected` vì lịch sử Git bị lệch.

## 3. Bài Học Rút Ra (The Turning Point)

> **"Trong thế giới Serverless, đừng bao giờ tin vào RAM. Hãy tin vào Database bên ngoài."**

* **Chuyển dịch tư duy:** Từ **Stateful** (Lưu trạng thái tại chỗ) sang **Stateless** (Đẩy trạng thái ra ngoài).
* **Giải pháp thay thế:** * Dùng **MongoDB/Redis** làm "bộ não chung" thay cho RAM.
    * Dùng **Vercel `after()`** để xử lý tác vụ nặng sau khi trả kết quả, thay vì dùng `setTimeout` mù quáng.
    * Dùng **Webhooks** hoặc **Cron Jobs** để kích hoạt đồng bộ thay vì bắt Client phải đợi.

## 4. Hành Động Tiếp Theo (Action Plan)
* [ ] Khởi tạo Cluster trên **MongoDB Atlas**.
* [ ] Cấu hình **Connection Pooling** để tránh tràn kết nối khi Vercel scale-out.
* [ ] Xây dựng logic **Optimistic Update tại Client** (React/SWR) thay vì dựa dẫm vào Server.

