BẢN ĐẶC TẢ KIẾN TRÚC UI/UX: MODERN NOIR DETECTIVE PORTFOLIO
1. Hệ thống nhận diện (Design System - Cố định không thay đổi)

Bảng màu (Color Palette):

Màu nền chính (Background): Đen tuyền (Pitch Black).

Màu nền phụ (Surfaces): Xám than chì (Deep Charcoal) kết hợp hiệu ứng kính mờ (Glassmorphism - độ trong suốt 10% với blur 12px) để tạo cảm giác hiện đại.

Màu nhấn 1 (Chỉ báo/Đường dẫn): Đỏ sẫm (Crimson Red) - đại diện cho dây đỏ phá án.

Màu nhấn 2 (Công nghệ/Tương tác): Xanh Neon (Cyan) - đại diện cho yếu tố Cyber/Tech.

Nghệ thuật chữ (Typography):

Tiêu đề lớn (H1, H2): Phông chữ Typewriter (ví dụ: Courier Prime hoặc Special Elite) – tạo cảm giác gõ máy chữ hồ sơ mật.

Nội dung đọc (p, span, li): Phông chữ Sans-serif hiện đại, nét gọn (ví dụ: Inter hoặc Geist) – đảm bảo tính dễ đọc tuyệt đối trên màn hình.

Chất liệu bề mặt (Texture): Phủ một lớp "Film grain" (nhiễu hạt tĩnh) rất mỏng toàn trang để tạo mảng tối điện ảnh (cinematic), nhưng các khối nội dung (Cards) bên trên thì hoàn toàn phẳng và mịn.

2. Phân rã cấu trúc HTML chi tiết (Semantic Structure)

A. Thanh điều hướng (Global Navigation - Thẻ header và nav)

Vị trí: Cố định (Fixed) trên cùng, chiếm 100% chiều ngang.

Giao diện: Một dải kính mờ.

Bên trái (Logo): Icon một dấu vân tay cách điệu bằng các đường viền mạch điện tử (neon cyan).

Bên phải (Links): Danh sách menu (Hồ sơ, Chứng cứ, Vụ án, Manh mối). Khi di chuột vào (hover), text từ màu xám sẽ sáng bừng lên màu vàng hổ phách, kèm theo một gạch chân nét đứt xuất hiện chậm từ trái sang phải.

B. Phần 1: Mở đầu (Hero Section - Hiện trường vụ án - Thẻ section)

Vị trí & Kích thước: Chiếm toàn bộ màn hình đầu tiên (100vh, 100vw).

Giao diện & Tương tác: * Màn hình ban đầu tối đen. Áp dụng hiệu ứng "Đèn pin" (Flashlight mask) đi theo con trỏ chuột. Người dùng di chuột đến đâu, vòng tròn sáng sẽ soi rõ nội dung bên dưới đến đó.

Trung tâm: Thẻ h1 chứa tên bạn. Kèm theo hiệu ứng chữ xuất hiện từng ký tự một (Typing effect) với tốc độ không đều, thỉnh thoảng có 1-2 ký tự bị "nhiễu sóng" (glitch effect) lệch màu đỏ/xanh.

Phụ đề (Thẻ h2): Ghi rõ chức danh (ví dụ: "Software Developer & Systems Investigator").

Góc dưới: Một mũi tên nhấp nháy với dòng chữ "Bắt đầu điều tra" (Scroll down indicator).

C. Phần 2: Giới thiệu (The Dossier - Hồ sơ cá nhân - Thẻ section)

Bố cục (Layout): Chia làm 2 cột rõ ràng trên Desktop (chuyển thành 1 cột xếp chồng trên Mobile). Đặt trong một thẻ bao bọc (Container) có viền mỏng màu xám.

Cột Trái (Thẻ figure & img): Hiển thị hình ảnh chân dung. Hình ảnh được xử lý bằng filter CSS để chuyển sang màu đen trắng (grayscale) với độ tương phản cao. Góc ảnh có một "con dấu" giả lập (Tem SVG) chéo màu đỏ chữ "CONFIDENTIAL".

Cột Phải (Thẻ article): Chứa các đoạn văn bản giới thiệu.

Tương tác "Tài liệu bị bôi đen" (Redacted Text): Một số từ khóa quan trọng (như tên trường, chuyên ngành) ban đầu bị che đi bằng một dải nền đen xì (giống hồ sơ FBI). Khi người dùng đưa chuột qua, dải đen từ từ mờ đi để lộ thông tin.

D. Phần 3: Kỹ năng (The Evidence Board - Bảng chứng cứ - Thẻ section)

Bố cục: Một khung lớn tràn viền.

Giao diện: Đây là khu vực thể hiện kỹ thuật hiện đại. Không dùng danh sách gạch đầu dòng tĩnh. Sử dụng đồ họa tương tác (Interactive Graph - có thể dùng Canvas).

Cấu trúc dữ liệu trực quan:

Các nhóm kỹ năng chính (Front-end, Back-end, AI Deployment, Audio Processing) là các "Nút" (Nodes) lớn có dạng hình tròn, tỏa sáng nhẹ.

Từ các Node lớn, phân nhánh ra các Node nhỏ hơn (ví dụ: từ Front-end nối ra React, Three.js; từ AI nối ra LLM, TTS).

Đường nối: Các Node được nối với nhau bằng các đường thẳng cong nhẹ màu đỏ (đại diện cho "sợi chỉ đỏ" trên bảng thám tử).

Tương tác: Khi người dùng nắm và kéo một Node, các Node liên kết sẽ di chuyển theo một cách mượt mà nhờ mô phỏng vật lý (force-directed graph).

E. Phần 4: Dự án thực tế (Case Files - Kho lưu trữ - Thẻ section)

Bố cục: Dạng lưới (Grid layout), hiển thị tối đa 3 cột. Mỗi dự án là một thẻ (Card).

Giao diện Thẻ (Thẻ article): * Bề ngoài: Thiết kế giống một tệp bìa hồ sơ giấy màu nâu nhạt hoặc xám. Tiêu đề dự án được dán nhãn như một miếng băng dính đè lên.

Tương tác cốt lõi (3D Flipbook Effect): Khi người dùng nhấp vào một hồ sơ, tệp không mở sang trang mới mà bìa tệp sẽ "lật" lên trong không gian 3D (xoay theo trục X hoặc Y).

Mặt trong của tệp: Sau khi lật, mặt trong sẽ hiển thị một bản tóm tắt gọn gàng, sử dụng các thẻ tag nhỏ cho công nghệ (ví dụ: RAG, Genetic Algorithm, React Three Fiber) và một nút "Xem báo cáo chi tiết" dẫn đến Github hoặc trang Live.

F. Phần 5: Liên hệ (The Tip Line - Đường dây nóng - Thẻ footer)

Bố cục: Canh giữa màn hình.

Giao diện Form: Lấy cảm hứng từ một màn hình Terminal cổ điển kết hợp phong cách hiện đại.

Trường nhập liệu (Input fields cho Tên, Email) chỉ có đường gạch chân (border-bottom) màu xanh neon, không có viền bao quanh. Khi đang gõ (focus), con trỏ sẽ nhấp nháy thành một khối vuông (block cursor).

Nút gửi (Button): Thay vì chữ "Submit", sử dụng chữ "Truyền tin mật" (Transmit Tip). Nút bấm có hiệu ứng viền chạy vòng quanh khi hover.

Bản quyền: Dòng chữ nhỏ dưới cùng: "Mọi dữ liệu đã được mã hóa. © 2026."