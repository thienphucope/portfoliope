# Kiến thức tổng quan về 3D Lighting & Baking

Dưới đây là các khái niệm, thuật ngữ (terms) và ý tưởng cốt lõi (key ideas) về ánh sáng (Lighting) và nướng ánh sáng (Baking) trong lĩnh vực đồ họa 3D.

## 1. Các loại ánh sáng cơ bản (Light Types)
* **Directional Light:** Ánh sáng song song từ xa vô tận (như mặt trời). Dùng làm nguồn sáng chính chiếu sáng toàn cảnh ngoài trời.
* **Point Light:** Nguồn sáng điểm, tỏa ra mọi hướng (như bóng đèn tròn). Cường độ giảm dần theo khoảng cách (Light Falloff / Attenuation).
* **Spot Light:** Ánh sáng chiếu theo hình nón (như đèn pin, đèn sân khấu).
* **Area Light:** Ánh sáng phát ra từ một bề mặt có diện tích (như cửa sổ, softbox). Tạo ra bóng đổ mềm (soft shadow) rất tự nhiên nhưng tốn tài nguyên phần cứng hơn để render.
* **Ambient Light:** Ánh sáng môi trường tổng thể chiếu lên mọi bề mặt để không vùng nào bị tối đen hoàn toàn.
* **HDRI (High Dynamic Range Image):** Ảnh 360 độ dùng để chiếu sáng toàn bộ môi trường, giúp tạo ra ánh sáng và hình ảnh phản chiếu cực kỳ chân thực (như sự phản chiếu trên kim loại, kính).

## 2. Các thuật ngữ cốt lõi về Lighting (Lighting Terms)
* **Direct Illumination (Ánh sáng trực tiếp):** Ánh sáng đi thẳng từ nguồn sáng đập vào bề mặt vật thể.
* **Indirect Illumination / Bounce Light (Ánh sáng gián tiếp):** Ánh sáng đập vào một bề mặt sau đó bật nảy sang bề mặt khác. Quá trình này có thể mang theo màu sắc của bề mặt nó vừa đập vào (Color Bleeding).
* **Global Illumination (GI):** Kỹ thuật/thuật toán tính toán sự kết hợp của cả ánh sáng trực tiếp và gián tiếp. GI là yếu tố quyết định để cảnh 3D trông thật (photorealistic).
* **Three-point Lighting:** Kỹ thuật đặt đèn kinh điển gồm: Key Light (đèn chính, mạnh nhất), Fill Light (đèn phụ, xóa bóng gắt), Rim/Back Light (đèn viền, tách vật thể khỏi nền).
* **PBR (Physically Based Rendering):** Hệ thống vật liệu dựa trên tính chất vật lý thực tế (như độ nhám, tính kim loại) giúp vật thể phản ứng chính xác và tự nhiên với ánh sáng.

## 3. Khái niệm về Baking (Light Baking)
* **Baking là gì?:** Là quá trình máy tính tính toán trước ánh sáng, bóng đổ, và phản xạ (GI) phức tạp, sau đó "nướng" (lưu cứng) kết quả này thành các file hình ảnh (texture) để dán lên model 3D.
* **Tại sao phải Bake?:** Để tối ưu hiệu suất (Performance). Máy tính hoặc trình duyệt web (WebGL/Three.js) không cần tính toán ánh sáng nặng nề theo thời gian thực (Real-time) nữa, mà chỉ cần đọc hình ảnh đã nướng sẵn. Rất quan trọng cho trải nghiệm mượt mà trên thiết bị di động, web, hoặc game VR.

## 4. Các thuật ngữ liên quan đến Baking
* **Lightmap:** Bức ảnh (texture) chứa kết quả ánh sáng và bóng đổ đã được tính toán (baked).
* **UV Unwrapping (Lightmap UVs):** Để dán Lightmap lên model, mô hình cần được "trải phẳng" ra 2D. Cần tạo một kênh UV riêng (thường là UV channel 2) sao cho các mặt của mô hình không được chồng chéo lên nhau (No overlapping UVs) để ánh sáng không bị lỗi.
* **Texel Density:** Mật độ điểm ảnh của Lightmap trên mô hình. Mật độ (độ phân giải) càng cao thì bóng đổ càng sắc nét, chi tiết càng tốt nhưng tốn nhiều dung lượng bộ nhớ hơn.
* **Ambient Occlusion (AO):** Khái niệm tính toán độ tối ở các khe hở, nếp gấp, góc khuất nơi ánh sáng khó chiếu tới. Thường được bake thành một map riêng (AO Map) để tăng độ nổi khối (depth) cho chi tiết.
* **Light Probes / Reflection Probes:** Các điểm đo sáng được đặt trong không gian để ghi lại ánh sáng và hình ảnh phản chiếu tại vị trí đó. Giúp các vật thể chuyển động (như nhân vật) nhận được ánh sáng nướng sẵn của môi trường xung quanh.
* **Real-time vs Baked Lighting:** Real-time thì ánh sáng, bóng đổ biến đổi linh hoạt, tương tác được ngay (nặng máy). Baked thì ánh sáng tĩnh, in chết lên vật (nhẹ máy). Trong các dự án tối ưu thường kết hợp cả hai (Mixed Lighting).

## 5. Bóng đổ & Hậu kỳ (Shadows & Post-Processing)
* **Hard vs Soft Shadows:** Bóng gắt (rõ viền, sắc nét, thường tạo ra từ nguồn sáng nhỏ hoặc ở xa) và Bóng mềm (nhòe dần, tạo ra từ nguồn sáng lớn hoặc tán xạ).
* **Tone Mapping (VD: ACES Filmic):** Quá trình chuyển đổi dải sáng rộng (HDR) của môi trường 3D sang dải sáng hiển thị của màn hình thông thường (SDR), giúp các vùng sáng rực không bị cháy sáng mất chi tiết (blown out) và tạo màu sắc tự nhiên, chuẩn điện ảnh.
* **Bloom:** Hiệu ứng hậu kỳ làm các vùng hoặc nguồn sáng mạnh tỏa vầng hào quang rực sáng xung quanh, giúp nhấn mạnh cường độ sáng.