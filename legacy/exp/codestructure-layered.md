# Cấu trúc Theo Lớp Kỹ Thuật (Technical-first / Layered)

*(Phù hợp dự án nhỏ. Nhược điểm: khó bảo trì khi scale vì file bị gom chung theo loại).*

```text
src/
├── components/  # Tất cả UI components (Button, Navbar, Transcript...)
├── hooks/       # Custom hooks (useAuth, useFetch...)
├── services/    # Gọi API (api.js, youtubeService.js)
├── utils/       # Hàm bổ trợ (formatDate.js)
└── pages/       # Các trang của ứng dụng
```