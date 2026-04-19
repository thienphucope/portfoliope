# Kinh Nghiệm Tổ Chức Cấu Trúc Thư Mục Dự Án

Việc nhóm các phần code có cùng chức năng là một phương pháp cực kỳ phổ biến và hữu ích để giữ cho dự án sạch sẽ, dễ bảo trì và mở rộng. Dưới đây là những nhóm phổ biến nhất:

### 1. Hooks (`/hooks`)
Nơi chứa các custom hooks để tái sử dụng logic có trạng thái (stateful logic) giữa các component.
*   **Ví dụ:** `useWindowSize`, `useDebounce`, `useFetch`.
*   **Lợi ích:** Tách biệt logic phức tạp khỏi UI, giúp component ngắn gọn và tập trung vào việc hiển thị.

### 2. Components (`/components` hoặc `/ui`)
Đây là thứ phổ biến nhất. Bạn sẽ gom các thành phần giao diện (UI) có thể tái sử dụng.
*   **Ví dụ:** `Button.js`, `Modal.js`, `Input.js`, `Card.js`.
*   **Lợi ích:** Dễ dàng tìm, sử dụng lại và đảm bảo giao diện nhất quán trên toàn bộ trang web.

### 3. Utilities / Helpers (`/utils` hoặc `/lib`)
Nơi chứa các hàm tiện ích, là những hàm thuần túy (pure functions) có thể dùng ở bất cứ đâu.
*   **Ví dụ:**
    *   `formatDate(date)`: Hàm định dạng ngày tháng.
    *   `calculateDiscount(price, percent)`: Hàm tính toán.
    *   `cn(...)`: Hàm nối các class CSS lại với nhau (rất phổ biến).
*   **Lợi ích:** Tách biệt logic xử lý dữ liệu khỏi UI, dễ dàng kiểm thử (test) và tái sử dụng.

### 4. API Services (`/services` hoặc `/app/api`)
Các hàm chịu trách nhiệm giao tiếp với server hoặc các API bên ngoài.
*   **Ví dụ:**
    *   `getUserProfile(userId)`: Hàm gọi API để lấy thông tin người dùng.
    *   `postArticle(articleData)`: Hàm gửi bài viết mới lên server.
*   **Lợi ích:** Tập trung toàn bộ logic gọi API vào một chỗ. Nếu địa chỉ API thay đổi, bạn chỉ cần sửa ở một nơi.

### 5. Constants (`/constants`)
Chứa các giá trị không đổi (hằng số) được sử dụng trong toàn bộ dự án.
*   **Ví dụ:**
    *   `API_BASE_URL = 'https://my-api.com'`
    *   `ROUTES = { HOME: '/', ABOUT: '/about' }`
    *   `COLORS = { PRIMARY: '#007bff', DANGER: '#dc3545' }`
*   **Lợi ích:** Tránh việc "hard-code" các giá trị trực tiếp trong code (magic numbers/strings), giúp việc thay đổi sau này dễ dàng hơn.

### 6. Types / Interfaces (`/types`)
Nếu bạn dùng TypeScript (hoặc JSDoc), thư mục này sẽ định nghĩa "hình dạng" của các đối tượng dữ liệu.
*   **Ví dụ:** Định nghĩa `User`, `Product`, `Order`.
*   **Lợi ích:** Giúp code an toàn hơn (type safety) và tự nó đã là một dạng tài liệu cho dự án.

### 7. Contexts (`/context`)
Khi dùng React Context API để quản lý trạng thái toàn cục (global state).
*   **Ví dụ:** `AuthContext` (quản lý trạng thái đăng nhập), `ThemeContext` (quản lý giao diện sáng/tối).
*   **Lợi ích:** Tránh việc phải truyền props qua quá nhiều tầng component (prop drilling).
