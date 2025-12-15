# KỸ THUẬT & CHỈ SỐ ĐO LƯỜNG (TECHNIQUES & METRICS)

## 1. Chiến lược chọn Kỹ thuật (Technique Selection)
* **Analytical (Mô hình toán):** Nhanh, Rẻ, Độ chính xác thấp, Insight tốt.
* **Simulation (Mô phỏng):** Trung bình, Dùng để tìm tham số tối ưu.
* **Measurement (Đo đạc):** Chậm, Đắt, Độ chính xác cao, Khó thực hiện (cần prototype).
* **Quy tắc vàng:** Kết quả chưa được xác thực (Validate) đều đáng ngờ. Phải dùng kỹ thuật này để kiểm chứng kỹ thuật kia.

## 2. Hệ thống Metric (Metric Framework)
* **Quy trình chọn:** Service $\rightarrow$ Outcome $\rightarrow$ Metric.
* **Phân loại Outcome:**
    * *Correct:* Speed (Time), Rate (Throughput), Resource (Utilization).
    * *Incorrect:* Reliability (Error probability).
    * *Unavailable:* Availability.

## 3. Các công thức cốt lõi (Key Formulas)

### a. Độ sẵn sàng (Availability)
$$A = \frac{MTTF}{MTTF + MTTR}$$
*(Đo bằng tỷ lệ thời gian chạy tốt trên tổng thời gian)*

### b. Chỉ số công bằng (Jain's Fairness Index)
$$f = \frac{(\text{Tổng throughput})^2}{n \times \text{Tổng bình phương throughput từng người}}$$
*(Giá trị từ 0-1, càng gần 1 càng công bằng)*

### c. Các khái niệm về Sức chứa (Capacity)
* **Knee Capacity:** Điểm vận hành tối ưu (Throughput cao, Latency thấp).
* **Usable Capacity:** Giới hạn thực tế (trước khi quá tải).
* **Nominal Capacity:** Giới hạn lý thuyết.

## 4. Thiết lập yêu cầu (Requirements)
* Áp dụng tiêu chuẩn **SMART**: Specific (Cụ thể), Measurable (Đo được), Acceptable (Chấp nhận được), Realizable (Khả thi), Thorough (Triệt để - bao gồm mọi outcome).