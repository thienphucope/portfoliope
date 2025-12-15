# ⚡ BẢNG CÔNG THỨC THỰC CHIẾN (HANDS-ON FORMULAS)
## SINGLE QUEUE & QUEUEING NETWORK

---

## 1. BẢNG KÝ HIỆU ĐỒNG NGHĨA (SYNONYM LEGEND)
*(Đừng để bị lừa bởi các ký hiệu khác nhau trong đề bài!)*

| Ký hiệu chính | Ký hiệu khác | Tên gọi Tiếng Việt | Đơn vị thường gặp | Ý nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| **$\lambda$** | $r$, $ArrivalRate$ | Tốc độ đến | packet/s, job/s | Số lượng khách đến trong 1 đơn vị thời gian. |
| **$\mu$** | $ServiceRate$ | Tốc độ phục vụ | packet/s, job/s | Số lượng khách 1 server làm xong trong 1 đv thời gian. |
| **$1/\mu$** | $E[s]$, $S$ | Thời gian phục vụ TB | giây, phút | Thời gian để xử lý xong 1 khách. |
| **$\rho$** | $U$, $Utilization$ | Độ bận / Hiệu suất | (không đơn vị) | Tỷ lệ thời gian server bận rộn ($0 \le \rho < 1$). |
| **$E[n]$** | $L$, $N$, $Q$ | Số khách TB trong hệ thống | khách, job | Bao gồm cả người đang chờ và đang được phục vụ. |
| **$E[n_q]$** | $L_q$, $Q_{queue}$ | Số khách TB trong hàng chờ | khách, job | Chỉ tính người đang đứng xếp hàng. |
| **$E[r]$** | $W$, $R$, $T$ | Thời gian đáp ứng TB | giây, phút | Tổng thời gian khách ở trong hệ thống (Chờ + Làm). |
| **$E[w]$** | $W_q$, $D$ | Thời gian chờ TB | giây, phút | Thời gian khách phải đứng chờ. |
| **$c$** | $m$, $N$ | Số lượng server | (số nguyên) | Số kênh phục vụ song song. |

---

## 2. CÔNG THỨC MỎ NEO (THE ANCHOR) - LUÔN ĐÚNG
*(Định luật Little - Dùng cho mọi hệ thống ổn định)*

$$E[n] = \lambda \times E[r]$$
$$E[n_q] = \lambda \times E[w]$$

---

## 3. CÔNG THỨC SINGLE QUEUE (M/M/1)
*(1 Server, Đến ngẫu nhiên, Phục vụ ngẫu nhiên)*

**a. Đầu vào & Điều kiện:**
* Độ bận (Utilization):
    $$\rho = \frac{\lambda}{\mu}$$
* **Điều kiện ổn định:** $\rho < 1$ (Nếu $\rho \ge 1 \to$ Hệ thống sập/Unstable).

**b. Các chỉ số hiệu năng (Performance Metrics):**
* Số khách trung bình trong hệ thống:
    $$E[n] = \frac{\rho}{1-\rho}$$
* Thời gian đáp ứng trung bình (Response Time):
    $$E[r] = \frac{1}{\mu(1-\rho)} = \frac{1}{\mu - \lambda}$$
* Thời gian chờ trung bình (Waiting Time):
    $$E[w] = E[r] - \frac{1}{\mu} = \frac{\rho}{\mu(1-\rho)}$$
* Số khách trung bình trong hàng chờ:
    $$E[n_q] = \lambda \times E[w] = \frac{\rho^2}{1-\rho}$$

**c. Xác suất (Probabilities):**
* Xác suất có đúng $k$ khách trong hệ thống:
    $$P_k = (1-\rho)\rho^k$$
* Xác suất hệ thống rảnh (0 khách):
    $$P_0 = 1 - \rho$$
* Xác suất có từ $k$ khách trở lên ($P(n \ge k)$):
    $$P(\ge k) = \rho^k$$

---

## 4. CÔNG THỨC M/M/c (NHIỀU SERVER)
*(c Server song song, 1 hàng chờ chung)*

**a. Đầu vào:**
* Độ bận (Utilization):
    $$\rho = \frac{\lambda}{c \times \mu}$$
    *(Lưu ý: Phải chia cho số lượng server $c$. Điều kiện $\rho < 1$)*.

**b. Xác suất rỗng ($P_0$ - Không có ai):**
*(Công thức này nhìn đáng sợ nhưng đi thi thường cho sẵn hoặc $c$ nhỏ)*
$$P_0 = \left[ \sum_{k=0}^{c-1} \frac{(c\rho)^k}{k!} + \frac{(c\rho)^c}{c!(1-\rho)} \right]^{-1}$$

**c. Xác suất phải chờ (Erlang's C Formula):**
*(Xác suất tất cả server đều bận)*
$$P(\text{wait}) = \frac{(c\rho)^c}{c!(1-\rho)} \times P_0$$

**d. Các chỉ số hiệu năng:**
* Số khách trung bình trong hàng chờ:
    $$E[n_q] = \frac{\rho}{1-\rho} \times P(\text{wait})$$
* Thời gian chờ trung bình:
    $$E[w] = \frac{E[n_q]}{\lambda}$$
* Thời gian đáp ứng trung bình:
    $$E[r] = E[w] + \frac{1}{\mu}$$
* Số khách trung bình trong hệ thống:
    $$E[n] = \lambda \times E[r] = E[n_q] + c\rho$$

---

## 5. CÔNG THỨC M/D/1 (PHỤC VỤ CỐ ĐỊNH)
*(Thời gian phục vụ là hằng số - Constant Service Time)*

* Số khách trung bình trong hệ thống:
    $$E[n] = \rho + \frac{\rho^2}{2(1-\rho)}$$
* Thời gian đáp ứng trung bình:
    $$E[r] = \frac{1}{\mu} + \frac{\rho}{2\mu(1-\rho)}$$
*(Mẹo nhớ: Phần đuôi của công thức M/D/1 bằng một nửa phần đuôi của M/M/1)*.

---

## 6. CÔNG THỨC MẠNG HÀNG ĐỢI (JACKSON NETWORK)
*(Nhiều nút nối với nhau)*

**Quy trình giải 3 bước chuẩn:**

**Bước 1: Tìm dòng đến thực tế ($\lambda_i$)**
Tại mỗi nút $i$, tổng dòng đến = dòng từ ngoài vào + dòng từ các nút khác chuyển sang.
$$\lambda_i = \gamma_i + \sum_{j=1}^{K} \lambda_j P_{ji}$$
*(Giải hệ phương trình này để tìm $\lambda_1, \lambda_2...$)*.
* $\gamma_i$: Dòng đến từ bên ngoài vào nút $i$.
* $P_{ji}$: Xác suất chuyển từ nút $j$ sang nút $i$.

**Bước 2: Tính toán cục bộ (Từng nút như M/M/1)**
Sau khi có $\lambda_i$, coi nút $i$ là một hàng đợi M/M/1 độc lập với $\mu_i$ riêng.
* Tính $\rho_i = \lambda_i / \mu_i$.
* Tính số khách tại nút $i$: $E[n_i] = \frac{\rho_i}{1-\rho_i}$.
* Tính thời gian tại nút $i$: $E[r_i] = \frac{1}{\mu_i(1-\rho_i)}$.

**Bước 3: Tổng hợp toàn mạng**
* Tổng số khách trong mạng:
    $$E[n]_{total} = \sum_{i} E[n_i]$$
* Thời gian đáp ứng trung bình của cả hệ thống (dựa vào Little's Law cho toàn hệ thống):
    $$E[r]_{total} = \frac{E[n]_{total}}{\sum \gamma_i}$$
    *(Chia cho tổng dòng khách từ ngoài vào, không phải tổng $\lambda_i$)*.