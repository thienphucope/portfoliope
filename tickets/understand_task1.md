# Hiểu về Task 1: Portfolio "Tâm Trí"

## Mục đích
Không phải portfolio thông thường — là không gian trưng bày những thứ tôi thích, mang vibe **"nhìn vào tâm trí tôi"**.

---

## Triết lý thiết kế

| Khía cạnh | Định hướng |
|---|---|
| Cảm hứng | No Man's Sky → randomness có kiểm soát |
| Visual style | Flat 2D canvas, như infographic / children's book |
| Màu sắc | Đầm, muted — không chói |
| Đơn vị nội dung | Mỗi screen = một thứ tôi thích |

---

## Kiến trúc hệ thống

### 1. Entry (tôi quản lý)
Đơn vị nội dung cơ bản:
- Text
- Image
- Video link (embed)
- Có **tag** để nhóm

### 2. Component (dynamic)
- Ghép từ các entry
- Nhiều template khác nhau (càng nhiều càng tốt)
- Layout được tính bằng seeded random từ **hash của item name** → deterministic, không cần tay sắp xếp

### 3. Theme per screen
Mỗi screen có theme riêng nhưng không cần design tay — derive tự động từ tag hoặc seed:
- **Palette màu** (ví dụ: tag "music" → warm amber, tag "tech" → cool blue)
- **Lighting direction** (góc sáng, vignette, gradient overlay, shadow)
- Cùng một component template, đổi palette + lighting → trông hoàn toàn khác

### 4. Navigation
- Kiểu **graph**: item là node, tag tạo cluster
- Chuyển cảnh bằng animation theo cạnh graph (không phải slide thông thường)
- Non-linear → mỗi lần explore có thể đi theo con đường khác → chống nhàm

---

## Tại sao không nhàm

| Nguồn gốc nhàm | Giải pháp |
|---|---|
| Layout lặp | Seeded random per item → mỗi screen khác nhau |
| Path lặp | Graph nav → không có "trang kế tiếp" cố định |
| Nhìn lặp | Nhiều component template + theme per screen |
| Cảm giác tĩnh | Transition animation theo cạnh graph |

---

## Câu hỏi còn mở
1. Graph hiển thị như thế nào — overview map nhỏ ở góc, hay full-screen graph view riêng?
2. Edge giữa các node được define thế nào — cùng tag, hay tôi tự define?
