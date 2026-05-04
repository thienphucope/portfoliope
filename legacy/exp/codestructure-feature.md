# Cấu trúc Theo Tính Năng (Feature-based / Domain-driven)

*(Tiêu chuẩn cho dự án lớn. Nhóm code theo "Nghiệp vụ". Rất giống dự án Portfoliope hiện tại).*

Đây là sơ đồ tổng quát và chi tiết nhất:

```text
src/
├── app/                        # Next.js App Router (Điều phối các trang, layout chính)
│   ├── api/                    # API Endpoints (Backend logic của Next.js)
│   │   └── [route_name]/
│   │       └── route.js
│   ├── [slug]/                 # Dynamic Routes (Route động, VD: /blog/bai-viet-1, /user/123)
│   │   └── page.js
│   ├── layout.js
│   ├── page.js
│   └── (routes)...
│
├── features/                   # Chứa các tính năng độc lập, có logic riêng (Có "não")
│   ├── video-transcript/       # Module xử lý Transcript
│   │   ├── components/         # UI chỉ dùng riêng cho Transcript
│   │   ├── hooks/              # Custom hooks riêng của Transcript
│   │   ├── services/           # API calls riêng
│   │   ├── utils/              # Utils riêng
│   │   └── index.js            # Nơi xuất (export) public API của feature này
│   ├── auth/                   # Module xử lý Đăng nhập
│   └── ...
│
├── components/                 # Nơi chứa UI dùng chung, "Ngu" (Dumb components), không chứa logic nghiệp vụ đặc thù
│   ├── ui/                     # UI components cơ bản, nhỏ nhất (Atomic)
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── Modal.js
│   │   ├── Badge.js
│   │   └── Card.js
│   │
│   ├── layout/                 # Khung xương của toàn bộ app
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   ├── Sidebar.js
│   │   └── Navigation.js
│   │
│   ├── sections/               # Các khối giao diện lớn, tĩnh, tổ hợp từ nhiều UI nhỏ
│   │   ├── HeroSection.js      # Phần đầu trang
│   │   ├── AboutSection.js     # Phần giới thiệu
│   │   ├── FeatureList.js      # Danh sách tính năng
│   │   ├── PricingTable.js     # Bảng giá
│   │   └── Testimonials.js     # Đánh giá khách hàng
│   │
│   ├── forms/                  # Các Form dùng chung
│   │   ├── ContactForm.js
│   │   └── SearchBar.js
│   │
│   ├── feedback/               # Các thành phần thông báo, phản hồi
│   │   ├── LoadingSpinner.js
│   │   ├── ErrorMessage.js
│   │   ├── Toast.js
│   │   └── Skeleton.js
│   │
│   └── icons/                  # SVG hoặc Icon wrapper
│       └── CustomIcons.js
│
├── hooks/                      # Custom hooks dùng chung toàn app (useWindowSize, useLocalStorage...)
├── services/                   # Dịch vụ toàn app (axios instance, auth provider...)
├── utils/                      # Utils dùng chung (formatDate, helpers...)
├── lib/                        # Cấu hình thư viện bên thứ 3 (prisma, supabase, firebase...)
└── styles/                     # CSS Global, Tailwind config
```