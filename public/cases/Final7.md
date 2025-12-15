# PHÂN TÍCH KẾT QUẢ MÔ PHỎNG (SIMULATION ANALYSIS)

## 1. Đánh giá độ tốt của mô hình (Goodness of Model)
* **Verification (Kiểm định):** Debug lỗi cài đặt. Kỹ thuật: Trace, Continuity Test (Input biến thiên nhỏ -> Output biến thiên nhỏ).
* **Validation (Thẩm định):** Kiểm tra độ chính xác so với thực tế. Kỹ thuật: So sánh với đo đạc thực tế hoặc lý thuyết.

## 2. Loại bỏ sai số khởi động (Transient Removal)
* **Vấn đề:** Dữ liệu ban đầu (Warm-up) không ổn định.
* **Giải pháp:**
    * *Truncation:* Cắt bỏ phần đầu.
    * *Moving Average:* Làm mượt đồ thị để tìm điểm ổn định (Knee).
    * *Batch Means:* Chia dữ liệu thành các lô để phân tích.

## 3. Tiêu chuẩn dừng & Khoảng tin cậy (Stopping Criteria)
Để kết quả đáng tin cậy, độ rộng khoảng tin cậy phải đủ nhỏ.
* **Công thức Khoảng tin cậy (Confidence Interval):**
$$CI = \bar{x} \pm z_{1-\alpha/2} \frac{s}{\sqrt{n}}$$
*(Ý nghĩa: Giá trị thực nằm trong khoảng này với xác suất $1-\alpha$)*

## 4. Các phương pháp ước lượng phương sai (Variance Estimation)
Để tính được $s$ (độ lệch chuẩn) trong công thức trên, ta dùng:
1.  **Independent Replications:** Chạy lại $m$ lần độc lập (Reset từ đầu). Dễ làm nhưng tốn kém tài nguyên khởi động.
2.  **Batch Means:** Chạy 1 lần dài, cắt thành $m$ khúc. Tiết kiệm hơn nhưng các khúc có thể bị phụ thuộc nhau (correlation).
3.  **Method of Regeneration:** Dựa vào chu kỳ tái sinh (khi hệ thống Empty). Đảm bảo tính độc lập tuyệt đối nhưng khó áp dụng nếu hệ thống ít khi Empty.

## 5. Xử lý thực thể còn lại (Leftover Entities)
* Với các chỉ số phụ thuộc thời gian (như Queue Length), phải tính bằng **Trung bình tích phân theo thời gian** (Time-weighted average), không dùng trung bình cộng đơn thuần.