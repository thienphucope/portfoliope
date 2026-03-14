# Portfolio Project - Ope Watson Case Archives

## ✨ Các tính năng đã triển khai (Implemented Features)

Dựa trên cấu trúc từ nền tảng đến giao diện người dùng trong `src/app/page.js`:

- **🖥️ Màn hình Intro:** Giao diện khởi đầu tối giản với biểu tượng máy in, giúp tối ưu hóa việc tự động phát media và tạo ấn tượng ban đầu.
- **🎥 Background Video:** Lớp nền cơ sở sử dụng YouTube API kết hợp với hiệu ứng làm mờ (`blur`) và lớp phủ tối để tạo chiều sâu cho không gian.
- **❄️ Hệ thống Tuyết rơi (Snowfall):** Lớp trang trí động phía trên nền, tự động tính toán và bao phủ toàn bộ chiều cao của trang web.
- **🎵 Trình phát nhạc (Disk Animation):** Nằm ở góc trái Header, mô phỏng đĩa nhạc quay, hỗ trợ điều khiển nhạc nền và hiển thị tên bài hát chạy chữ.
- **🎨 Hiệu ứng Glitch Canvas:** Tiêu đề "Case Archives" ở giữa Header với hiệu ứng nhiễu kỹ thuật số và thay đổi font chữ liên tục.
- **📝 Story System (Application):** Nằm ở góc phải Header, mở ra giao diện soạn thảo toàn màn hình để gửi yêu cầu đến hệ thống RAG backend.
- **🔦 Spotlight & 🖐️ Fingerprint:** Các lớp tương tác chuột bao gồm hiệu ứng đèn pin soi sáng nội dung và để lại dấu vân tay khi nhấp chuột.
- **🕵️ Nhận diện người dùng:** Hệ thống logic tự động xác định IP và loại thiết bị để cá nhân hóa trải nghiệm.
- **📱 Responsive Design:** Toàn bộ các thành phần trên được tối ưu hóa hiển thị mượt mà từ điện thoại đến máy tính.

### 🗄️ Hệ thống Case Archives (Vault System)

Phần lưu trữ hồ sơ (`/case`) là một ứng dụng quản lý kiến thức chuyên sâu với các quy trình xử lý dữ liệu ngầm (underground) phức tạp:

#### 🔄 Quy trình Khởi tạo & Đồng bộ (Creation & Sync)
- **Tạo mới thông minh:** Khi tạo nốt mới, hệ thống sẽ thực hiện `acquireLock` trên GitHub trước. Nếu tệp đã tồn tại trên remote, nó sẽ tự động tải nội dung về để đồng bộ thay vì ghi đè, đảm bảo tính toàn vẹn dữ liệu.
- **Cơ chế Cache đôi:** Sử dụng `serverRawCache` (Ref) để lưu giữ "sự thật" từ máy chủ và `localStorage` để lưu các bản nháp (draft) cục bộ, giúp khôi phục dữ liệu ngay cả khi trình duyệt bị tắt đột ngột.
- **Xử lý Unload:** Trước khi rời trang, hệ thống so sánh bản nháp với cache server. Nếu có thay đổi chưa lưu, người dùng sẽ nhận được cảnh báo và các bản nháp rác sẽ được dọn dẹp để tối ưu bộ nhớ.

#### 🔐 Cơ chế Khóa & Kiểm soát Hội thoại (Concurrency Control)
- **Session-based Locking:** Mỗi phiên làm việc được cấp một `sessionId` duy nhất. Khi chỉnh sửa, hệ thống sẽ chiếm quyền điều khiển (lock) tệp đó trên server.
- **Heartbeat (Nhịp đập):** Cứ mỗi 20 giây, một tín hiệu "ping" được gửi đi để duy trì quyền chỉnh sửa. Nếu kết nối mất hoặc có người khác chiếm quyền, hệ thống sẽ tự động đá người dùng về chế độ Đọc để tránh xung đột.
- **Xác thực đa tầng:** Mật khẩu chỉnh sửa được lưu tạm trong `sessionStorage` và gửi kèm trong mọi yêu cầu ghi/khóa, đảm bảo chỉ người có thẩm quyền mới có thể can thiệp vào dữ liệu.

#### 🛠️ Quy trình Chỉnh sửa & Lưu trữ (Atomic Saving)
- **Phát hiện xung đột (Conflict Detection):** Trước khi vào chế độ Edit, hệ thống so sánh nội dung remote với bản nháp cục bộ. Nếu phát hiện sự khác biệt, người dùng có quyền chọn ghi đè hoặc giữ lại bản nháp.
- **Lưu trữ nguyên tử (Atomic Update):** Việc lưu tệp yêu cầu phải khớp mã `SHA` của tệp hiện tại. Nếu tệp trên GitHub đã bị thay đổi bởi người khác, hệ thống sẽ từ chối ghi đè để bảo vệ dữ liệu.
- **Hậu xử lý (Post-process):** Sau khi lưu thành công, `serverRawCache` được cập nhật, bản nháp cục bộ được xóa bỏ và cây thư mục (`fileTree`) được làm mới hoàn toàn để phản ánh trạng thái mới nhất.

#### 🎨 Giao diện mặt nổi (Brief UI Features)
- **Spine & Accordion:** Điều hướng tab theo dạng thanh dọc dọc độc đáo.
- **Smooth Navigation:** Hệ thống cuộn ngang/dọc mượt mà tối ưu cho Desktop và Mobile.
- **AI Integration:** Chat trực tiếp với dữ liệu trong Vault thông qua RAG.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
