# MẠNG HÀNG ĐỢI (QUEUEING NETWORKS)

## 1. Phân loại hệ thống
* **Open Network (Mạng mở):**
    * Có dòng In/Out.
    * Số lượng job thay đổi.
    * Mục tiêu: Tìm phân phối số lượng job trong hệ thống.
* **Closed Network (Mạng đóng):**
    * Không có In/Out (Job chạy tuần hoàn).
    * Số lượng job cố định (Constant).
    * Mục tiêu: Với số job $N$ cố định, tính Throughput.

## 2. Mạng Jackson mở (Open Jackson Networks)
Đây là mô hình mạng hàng đợi phổ biến nhất có thể giải bằng toán học (Product Form).

### a. Tính chất "Product Form" (Dạng tích)
Hệ thống phức tạp được "bẻ gãy" thành nhiều hàng đợi M/M/1 độc lập.
* **Công thức Jackson:**
$$P(n_1, ..., n_k) = P_1(n_1) \times P_2(n_2) \times ... \times P_k(n_k)$$
*(Xác suất tổng thể = Tích các xác suất thành phần)*

### b. Giải bài toán lưu lượng (Traffic Equations)
Để tính hiệu năng từng node, trước hết phải tìm $\lambda_i$ (tốc độ đến thực tế tại node đó) thông qua hệ phương trình cân bằng dòng:

$$\lambda = (I - P^T)^{-1} a$$

* $\lambda$: Vector tốc độ đến tại các node ($\lambda_1, \lambda_2...$).
* $P$: Ma trận xác suất chuyển hướng ($p_{ij}$: xác suất đi từ node $i$ sang $j$).
* $a$: Vector dòng đến từ bên ngoài.

## 3. Quy trình giải bài tập Mạng hàng đợi
1.  **Xác định ma trận P và vector a:** Dựa vào sơ đồ hệ thống.
2.  **Tính $\lambda$:** Giải hệ phương trình tuyến tính hoặc dùng ma trận nghịch đảo.
3.  **Tính $\rho_i$:** Với $\rho_i = \lambda_i / \mu_i$ (lưu ý $\rho_i$ phải < 1 để ổn định).
4.  **Tính xác suất:** Dùng công thức Jackson để tính xác suất trạng thái mong muốn.