# CÁC MÔ HÌNH HÀNG ĐỢI ĐƠN (SINGLE QUEUES)

## 1. Các khái niệm nền tảng
* **Ký hiệu Kendall ($A/S/c$):** Chuẩn hóa cách gọi tên hàng đợi.
    * $M$: Markov (Ngẫu nhiên/Hàm mũ).
    * $D$: Deterministic (Xác định/Hằng số).
    * $c$: Số lượng server.
* **Định luật Little:** $E[n] = \lambda E[r]$.
    * Luôn đúng cho mọi hệ thống ổn định.
    * Mối quan hệ tay ba giữa: Số lượng khách ($n$), Tốc độ đến ($\lambda$), và Thời gian lưu trú ($r$).

## 2. Mô hình M/M/1 (1 Server, Ngẫu nhiên)
* **Điều kiện ổn định:** $\rho = \lambda/\mu < 1$.
* **Đặc điểm:** Khi tải ($\rho$) tiến gần đến 1, thời gian chờ và số lượng khách tăng vọt (tiến tới vô cùng).
* **Công thức cốt lõi:**
    * Số khách trung bình: $E[n] = \frac{\rho}{1-\rho}$
    * Thời gian đáp ứng: $E[r] = \frac{1}{\mu(1-\rho)}$
    * Xác suất hệ thống rảnh (Utilization): $U = \rho$.

## 3. Các mô hình khác
* **M/M/c (Nhiều Server):**
    * Tải được san sẻ: $\rho = \frac{\lambda}{c\mu}$.
    * Dùng công thức Erlang-C để tính xác suất phải chờ.
* **M/D/1 (Thời gian phục vụ cố định):**
    * Hiệu năng tốt hơn M/M/1 (thời gian chờ giảm một nửa ở thành phần tắc nghẽn).
    * Lý do: Triệt tiêu được phương sai (variance) của thời gian phục vụ.
    * Công thức: $ E[n]\_{M/D/1} \approx \frac{1}{2} E[n]\_{M/M/1} $ (ở mức tải cao).

## 4. Bài học thực tế (Rules of Thumb)
* Muốn giảm thời gian chờ, giảm biến thiên (variability) thường hiệu quả hơn là tăng tốc độ phục vụ đơn thuần (đó là lý do M/D/1 tốt hơn M/M/1).
* Đừng bao giờ để hệ thống chạy ở mức 100% tải ($\rho=1$), nó sẽ sập ngay lập tức vì hàng đợi vô tận.