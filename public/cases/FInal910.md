# THIẾT KẾ THỰC NGHIỆM (EXPERIMENTAL DESIGN - DoE)

## 1. Chiến lược & Mô hình (Strategy & Model)
* **Mục tiêu:** Thu thập thông tin tối đa với chi phí (số lần chạy) tối thiểu.
* **Thiết kế $2^k$:** Mỗi yếu tố chỉ xét 2 mức (Min/Max).
* **Mô hình hồi quy:**
$$y = q_0 + q_A x_A + q_B x_B + q_{AB} x_A x_B + e$$
*(Dùng để dự đoán kết quả và đo lường tác động của từng yếu tố)*

## 2. Tính toán Hiệu ứng & Biến thiên (Calculation)
* **Sign Table (Bảng dấu):** Kỹ thuật dùng ma trận trực giao (+1/-1) để tính nhanh các hệ số $q$.
* **Phân bổ biến thiên (Variation Allocation):** Xác định tầm quan trọng của yếu tố.
    * $SST$: Tổng biến thiên.
    * $SSA = N \times q_A^2$: Biến thiên do A đóng góp.
    * $Ty le \% = SSA / SST$.
* **Replications (Lặp lại):** Cần thiết để tính $SSE$ (Lỗi thực nghiệm/Nhiễu). Nếu không lặp lại, ta không biết đâu là tác động thật, đâu là do ngẫu nhiên.

## 3. Kỹ thuật nâng cao: Fractional Factorial ($2^{k-p}$)
* **Vấn đề:** Quá nhiều yếu tố ($k$) dẫn đến bùng nổ số lượng thí nghiệm.
* **Giải pháp:** Chỉ chạy một phần nhỏ ($1/2^p$) số thí nghiệm.
* **Đánh đổi (Trade-off):** Chấp nhận hiện tượng **Confounding** (Lẫn lộn).
    * *Ví dụ:* Hiệu ứng chính $A$ có thể bị lẫn với tương tác $BCD$. Ta giả định tương tác bậc cao ($BCD$) không đáng kể để lấy giá trị đó cho $A$.
* **Quy trình:**
    1. Chọn $k-p$ yếu tố làm nòng cốt (Full design).
    2. Gán $p$ yếu tố còn lại vào các cột tương tác của nhóm nòng cốt.

## 4. Các sai lầm thường gặp (Common Mistakes)
* Bỏ qua lỗi thực nghiệm (không lặp lại thí nghiệm).
* Thay đổi từng tham số một (One-factor-at-a-time) -> Bỏ sót tương tác.
* Thực hiện quá nhiều thí nghiệm không cần thiết ngay từ đầu.