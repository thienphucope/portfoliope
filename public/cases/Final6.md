# TỔNG QUAN VỀ MÔ PHỎNG (SIMULATION INTRODUCTION)

## 1. Phân loại Mô hình (Taxonomy)
* **Định nghĩa:** Mô phỏng là bản sao gần đúng của hệ thống thực.
* **Các loại chính:**
    * *Monte Carlo:* Mô phỏng tĩnh (Static), dùng xác suất để tính toán (ví dụ tính số Pi).
    * *Trace-Driven:* Dùng dữ liệu lịch sử (log/trace) để chạy lại.
    * *Discrete Event Simulation (DES):* Quan trọng nhất. Trạng thái hệ thống thay đổi tại các thời điểm rời rạc khi có sự kiện.

## 2. Cơ chế Discrete Event Simulation (DES)
* **Nguyên lý:** Thời gian trong mô phỏng không trôi đều đặn (Activity-oriented) mà "nhảy" từ sự kiện này sang sự kiện khác (Event-oriented) để tiết kiệm tài nguyên.
* **Process-oriented:** Cách tiếp cận hiện đại (dùng trong SimPy), coi mỗi thực thể (Customer, Server) là một tiến trình độc lập.

## 3. Thực thi với SimPy (Implementation)
* **Environment:** Môi trường quản lý thời gian mô phỏng.
* **Process & Yield:** Dùng `yield env.timeout(t)` để mô phỏng việc "tốn thời gian" (xử lý hoặc chờ đợi).
* **Cấu trúc code hàng đợi đơn (Single Queue):**
    1. **Job Generator:** Tạo Job mới sau mỗi khoảng `inter-arrival time`.
    2. **Queue:** Danh sách chứa các Job.
    3. **Server:** Lấy Job từ Queue -> `yield` thời gian phục vụ -> Lặp lại. Nếu Queue rỗng -> Sleep.

## 4. Xác thực (Verification & Validation)
* **Verification:** Code có chạy đúng logic không? (Check bug).
* **Validation:** Mô hình có giống thực tế/lý thuyết không?
    * *Quy tắc vàng:* So sánh kết quả mô phỏng (Simulation) với kết quả tính toán (Analytical M/M/1). Nếu khớp (xấp xỉ), mô hình mới được coi là đúng.