# QUY TRÌNH 10 BƯỚC ĐÁNH GIÁ HIỆU NĂNG HỆ THỐNG (SYSTEMATIC PE)

## 1. Định nghĩa (Definition)
* **Bước 1: Goals & System Boundary:** Xác định mục tiêu và ranh giới hệ thống ("System" vs. "Everything else").
* **Bước 2: Services & Outcomes:** Hệ thống cung cấp dịch vụ gì và các kết quả có thể xảy ra (thành công/lỗi).

## 2. Thông số đầu vào (Variables & Metrics)
* **Bước 3: Metrics (Chỉ số):**
    * Speed/Throughput (nếu outcome tốt).
    * Reliability/Availability (nếu outcome lỗi).
* **Bước 4: Parameters (Tham số):** Phân biệt *System Parameters* (cố định) và *Workload Parameters* (thay đổi).
* **Bước 5: Factors (Nhân tố):** Các tham số được chọn để thay đổi chủ động trong thí nghiệm.
    * *Levels (Mức):* Các giá trị cụ thể của Factor.

## 3. Chiến lược thực thi (Execution Strategy)
* **Bước 6: Technique:** Measurement (Đo thật), Simulation (Mô phỏng), Analytical (Tính toán).
    * *Lưu ý:* Phân biệt Verification (làm đúng quy trình) và Validation (làm đúng sản phẩm).
* **Bước 7: Workload:** Xác suất (Probability), Vết (Trace), hoặc Kịch bản (Script).
* **Bước 8: Design Experiments:** Tối ưu hóa số lượng thí nghiệm.
    * *Công thức Full Factorial:* $N = L_1 \times L_2 \times ... \times L_k$
    * *Ví dụ:* 3 nhân tố (mỗi cái 2 mức) và 1 nhân tố (11 mức) => $2^3 \times 11 = 88$ thí nghiệm.

## 4. Xử lý đầu ra (Output)
* **Bước 9: Analysis:** Dùng thống kê (ANOVA, Regression) để xử lý dữ liệu ngẫu nhiên.
* **Bước 10: Presentation:** Trực quan hóa dữ liệu bằng đồ thị cho người ra quyết định.

## Các sai lầm phổ biến (Common Mistakes)
* Không có mục tiêu rõ ràng (No goals).
* Mục tiêu thiên vị (Biased goals - cố tình chứng minh hệ thống mình tốt hơn).
* Metric sai, Tải không đại diện, hoặc bỏ qua sự biến thiên của dữ liệu (Ignoring Variability).