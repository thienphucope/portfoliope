# Cấu trúc Nguyên Tử (Atomic Design)

*(Phù hợp xây dựng Design System đồng nhất. Nhược điểm: Phức tạp, over-engineering cho dự án cá nhân).*

```text
src/components/
├── atoms/      # Nhỏ nhất, không thể chia nhỏ: Button, Input, Label, Icon
├── molecules/  # Cấu thành từ Atoms: SearchBar (Input + Button)
├── organisms/  # Cấu thành từ Molecules: Header, TranscriptBox, LoginForm
├── templates/  # Bố cục khung trang (chưa có dữ liệu)
└── pages/      # Trang hoàn chỉnh (Templates + Dữ liệu)
```