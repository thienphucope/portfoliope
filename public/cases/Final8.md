# TẢI CÔNG VIỆC: LỰA CHỌN VÀ ĐẶC TẢ (WORKLOAD SELECTION & CHARACTERIZATION)

## 1. Phân loại & Lựa chọn (Types & Selection)
* **Real vs. Synthetic:**
    * *Real:* Chính xác nhưng khó lặp lại, bảo mật kém.
    * *Synthetic (Nhân tạo):* Dễ kiểm soát, lặp lại tốt (Benchmark, Kernel).
* **Đối tượng test:**
    * *SUT (System Under Test):* Hệ thống bao trùm.
    * *CUS (Component Under Study):* Thành phần đích cần đánh giá. Tải phải tập trung vào CUS.
* **Tiêu chí chọn:** Dịch vụ sử dụng, Mức độ chi tiết (Trace/Distribution), Tính đại diện, Tính cập nhật.

## 2. Đặc tả tải (Characterization Techniques)
Biến dữ liệu thô thành mô hình toán học:
* **Thống kê cơ bản:** Trung bình ($\bar{x}$), Độ lệch chuẩn ($s$), Hệ số biến thiên ($C.O.V = s/\bar{x}$).
* **Markov Model:** Dùng ma trận xác suất để mô tả chuỗi hành vi chuyển trạng thái (CPU -> Disk -> Network).
* **PCA (Principal Component Analysis):** Giảm số chiều dữ liệu bằng cách tổ hợp các tham số tương quan.

## 3. Kỹ thuật Phân cụm (Clustering)
Dùng để nhóm các Workload component tương đồng nhằm giảm số lượng kịch bản test.

### Quy trình cốt lõi:
1.  **Sampling:** Lấy mẫu.
2.  **Transformation:** Loại bỏ giá trị ngoại lai (Outliers).
3.  **Scaling (Chuẩn hóa):** Bắt buộc phải làm để đưa các tham số về cùng mặt bằng so sánh.
    * *Z-score:* $x' = (x - Mean) / StdDev$
    * *Range (0-1):* $x' = (x - Min) / (Max - Min)$
4.  **Clustering Algorithms:**
    * *MST (Cây khung nhỏ nhất):* Gom nhóm từ dưới lên (Agglomerative), tạo ra biểu đồ Dendogram.
    * *K-means (Centroid):* Chia nhóm từ trên xuống (Divisive), tối ưu hóa khoảng cách đến tâm cụm.