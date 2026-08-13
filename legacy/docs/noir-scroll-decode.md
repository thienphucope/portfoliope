# Noir Interrogation Landing — AboutHero

> Tài liệu lịch sử. Thiết kế trang chủ hiện hành nằm tại
> [`home-noir-bulletin-design.md`](./home-noir-bulletin-design.md).

_Cập nhật: 2026-08-11. Nguồn: src/components/sections/AboutHero.js_

> Ý tưởng gốc "scroll-decode + gate câu hỏi" đã **bị bỏ**. Bản chốt đơn giản hơn nhiều —
> xem phần dưới. Lịch sử concept giữ ở cuối để tham khảo.

## Bản chốt (đã implement)

**Atmosphere:** interrogation room, nền `#000` tuyệt đối, bỏ hoàn toàn teal.

**Cấu trúc trang** (render trong AboutHero.js, theo thứ tự):
1. **Landing scene** — khít đúng 1 màn (`.scene-zone` height `100dvh`, overflow hidden).
2. **`<Gallery images={galleryImages} />`** ngay bên dưới.

**Landing gồm:**
- **Đèn tháp** (`.lamp-fan`): `clip-path` tam giác từ giữa-top toả xuống 2 góc đáy +
  linear-gradient mờ dần. *Ceiling: góc mở co lại trên màn hẹp/cao vì clip-path tính theo
  % viewport. Muốn góc cố định phải chuyển sang conic-gradient (đã thử, dễ tắt đèn — cẩn thận).*
- **Ope "bên kia bàn"**: hình to (`height: min(74vh,860px)`), **bỏ khung/border hoàn toàn**,
  edge tan vào đen bằng `mask` (radial ∩ linear top/bottom → không lộ mép trên khi đèn dọi),
  `brightness(0.46)`. Tràn đè lên title (`margin-bottom: -1.4em`) nhưng title `z-index:4` nằm trên.
- **Tên `Ope Watson`** (`var(--theme)`, tới 8rem) + pronunciation, ngay dưới hình.
- **MusicHeader tách vị trí bằng CSS** (`.noir-music-layer`, không nhân đôi player):
  disc → giữa cạnh trái; 3 contact icon → top phải; "inspired by ↗" → top trái (mở video modal).
- **Bụi bông tuyết** (`GLYPHS` ✦✳❋…, `.noir-glyph` float).

**Data:** ảnh gallery đọc từ `public/polaroid` qua `src/lib/galleryImages.js` (tách dùng chung
với `/gallery` page), truyền `galleryImages` từ `src/app/page.js` (async server component) → Hero prop.

**File teal gốc:** `legacy/deprecated/AboutHero.teal.js`.

### Đã thử rồi bỏ
- Cơ chế **gate câu hỏi mở khóa vùng tối** (scroll-decode) + zone mô tả riêng → user bỏ hết.
- Chạy-chữ-hover (scramble on hover) → bỏ.
- NoteFeed thêm rồi lại gỡ.
- Conic-gradient cho đèn (giữ góc cố định) → làm mất đèn, tạm revert về clip-path.

---

## [Lịch sử] Concept scroll-decode gốc (đã huỷ)

Website là không gian điều tra nội tâm của "counseling detective". Cuộn = bóc tách sự thật:
mỗi tầng khoá trong bóng tối, phải **giải mã câu hỏi** thì đèn mới dọi xuống tầng sau. Bụi ký tự
mã hoá loé sáng khi lướt qua vệt đèn. → Quá phức tạp, user chọn hướng landing tĩnh gọn ở trên.
