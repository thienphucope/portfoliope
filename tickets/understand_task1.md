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
- Text, Image, Video link (embed)
- Có **tag** để gắn vào screen
- Thêm entry mới = tự động fit vào screen tương ứng, không cần động vào design

### 2. Screen (tôi design một lần)
Mỗi screen = một theme được curate thủ công:
- **Palette màu** + **lighting** (vibe riêng biệt)
- **Bộ component riêng** phù hợp với theme (ví dụ: detective → sticky note, polaroid, newspaper clip; vtuber → speech bubble, chibi frame,...)
- Seeded random từ **hash của item name** → sắp xếp entry vào component set của screen đó, deterministic

### 3. Navigation
- Kiểu **graph**: screen là node, có thể nối theo tag hoặc tự define
- Transition animation giữa screen theo cạnh graph
- Non-linear → mỗi lần explore có thể đi theo con đường khác

### 4. Routing
- **1 route duy nhất** — screen swap trong cùng trang
- Không reload, animation liên tục, graph nav mượt
- URL không thay đổi theo screen (không cần shareable link)

---

## Tại sao không nhàm

| Nguồn gốc nhàm | Giải pháp |
|---|---|
| Layout lặp | Seeded random per item trong từng screen |
| Path lặp | Graph nav → không có "trang kế tiếp" cố định |
| Nhìn lặp | Mỗi screen có ngôn ngữ hình ảnh riêng (component set khác nhau) |
| Cảm giác tĩnh | Transition animation theo cạnh graph |

---

## Câu hỏi còn mở
1. Graph hiển thị như thế nào — overview map nhỏ ở góc, hay full-screen graph view riêng?
2. Edge giữa các node được define thế nào — cùng tag, hay tôi tự define?
