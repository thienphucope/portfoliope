# TÓM TẮT KIẾN THỨC CỐT LÕI: ĐÁNH GIÁ HIỆU NĂNG HỆ THỐNG MÁY TÍNH

## 1. Tư duy tiếp cận: Khoa học vs. Kỹ thuật (Science vs. Engineering)
[cite_start]Trước khi đi vào tính toán, cậu cần hiểu tư duy của môn này[cite: 315].
* **Khoa học (Science):** Quan sát sự vật, đặt câu hỏi "Tại sao?", xây dựng giả thuyết và chứng minh. Mục tiêu là tìm ra chân lý.
* **Kỹ thuật (Engineering):** Xác định vấn đề, tìm giải pháp, thiết kế và tối ưu. [cite_start]Mục tiêu là tạo ra giải pháp hoạt động tốt[cite: 265].
* **Đánh giá hiệu năng:** Là giao thoa giữa Khoa học, Kỹ thuật và Toán học. [cite_start]Mục tiêu là dự đoán hành vi của hệ thống dưới dạng định lượng (con số cụ thể)[cite: 330].

---

## 2. Các chỉ số đo lường hiệu năng (Performance Metrics)
[cite_start]Để biết hệ thống "khỏe" hay "yếu", ta dùng các thước đo sau[cite: 396, 403, 404]:

1.  **Latency (Độ trễ - Time):** Thời gian để hoàn thành một việc.
    * *Ví dụ:* Thời gian gói tin đi từ A đến B.
2.  **Bandwidth (Băng thông - Rate):** Tốc độ hoặc dung lượng xử lý tối đa.
    * *Ví dụ:* Số bit truyền được trong 1 giây.
3.  [cite_start]**Throughput (Thông lượng):** Số lượng công việc hoàn thành trên một đơn vị thời gian[cite: 428].
    * *Ví dụ:* Số request server xử lý được trong 1 giây.

---

## 3. Mô hình toán học & Lý thuyết hàng đợi (Queuing Theory)
Đây là phần "xương sống" của môn học. [cite_start]Hệ thống máy tính thường được mô hình hóa thành các hàng đợi (queues)[cite: 423].

### Các thành phần của công thức:
* **$\lambda$ (Lambda - Arrival Rate):** Tốc độ đến của yêu cầu.
    * *Ý nghĩa:* Có bao nhiêu khách hàng/gói tin/tiến trình đi vào hệ thống trong 1 giây?
* **$\mu$ (Mu - Service Rate):** Tốc độ phục vụ của hệ thống.
    * *Ý nghĩa:* Server/CPU xử lý được bao nhiêu yêu cầu trong 1 giây?

### [cite_start]Bài toán cơ bản[cite: 430]:
Giả sử tốc độ đến tăng gấp đôi ($\lambda \rightarrow 2\lambda$), ta phải làm gì?
* Tăng tốc độ xử lý của CPU ($\mu$)?
* Thêm CPU mới (tăng số lượng server)?

### [cite_start]Các mô hình hàng đợi phổ biến[cite: 446]:
1.  **One queue for all servers:** 1 hàng xếp chung, ai rảnh thì xử lý (giống xếp hàng ở sân bay).
2.  **One queue per server:** Mỗi server có 1 hàng riêng (giống xếp hàng ở siêu thị).

---

## 4. Ba phương pháp đánh giá hiệu năng (The "How")
Làm sao để ra được con số đánh giá? [cite_start]Có 3 cách tiếp cận chính, đánh đổi giữa độ phức tạp và chi phí[cite: 466, 498]:

| Phương pháp | Mô tả | Độ chính xác | Chi phí/Độ phức tạp |
| :--- | :--- | :--- | :--- |
| **Measurement** (Đo đạc) | Đo trực tiếp trên hệ thống thật. | Cao nhất | Cao nhất (cần hệ thống thật) |
| **Simulation** (Mô phỏng) | Viết phần mềm để giả lập hành vi hệ thống. | Trung bình | Trung bình |
| **Analytical Modeling** (Mô hình toán) | Dùng công thức toán (như lý thuyết hàng đợi) để tính. | Thấp hơn (do giả định) | Thấp nhất (nhanh, rẻ) |

---

## 5. "Nghệ thuật" so sánh (The Art of Evaluation)
[cite_start]Đánh giá hiệu năng không chỉ là tính toán, mà còn là nghệ thuật nhìn số liệu, tránh bị lừa bởi các con số trung bình[cite: 808].

**Ví dụ về "Ratio Game" (Trò chơi tỷ lệ):**
Khi so sánh 2 hệ thống A và B trên 2 tải (workload) khác nhau:
* Hệ thống A thắng ở Workload 1.
* Hệ thống B thắng ở Workload 2.
-> Kết luận hệ thống nào tốt hơn phụ thuộc vào cách cậu tính trung bình (cộng hay nhân, hay chuẩn hóa theo máy nào). Slide nhấn mạnh việc cẩn trọng khi dùng tỷ lệ để so sánh.