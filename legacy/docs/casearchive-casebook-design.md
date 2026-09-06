# CaseArchive → Sổ tay thám tử (blog trá hình)

_Cập nhật: 2026-09-07. **Trạng thái: ĐỀ XUẤT — chưa implement.**_
_**Nguồn DUY NHẤT của vision: ref `public/content/videoframe_*.png`.** Tạo mới từ đầu — code cũ KHÔNG định hình thiết kế này._
_**Landing:** 3D scene POV bàn thám tử **THAY** `src/components/sections/AboutHero.js`._
_**Prompt dựng scene 3D (gọi Astra):** [`astra-3d-landing-prompt.md`](./astra-3d-landing-prompt.md)._

## Ý tưởng một câu

`caseArchive` = **một cuốn sổ tay điều tra**; mỗi entry = một *clue note*.
Blog thật, khoác da sổ tay thám tử → **"blog trá hình"**.

---

## Ref hình (north star) — nguồn của mọi thứ

Style đích: **3D anime điện ảnh kiểu MV Amelia Watson.** Ref chốt **cả 4 chất gốc** user muốn:
noir (bóng/đèn) · chững chạc (u buồn điềm tĩnh) · amelia tươi sáng (nhân vật + ấm + hơi hài) ·
blog (cuốn sổ đầy entry).

- **`videoframe_153022.png` (CHÍNH):** POV nhìn *xuống* casebook mở trên bàn ngập giấy — sticky
  note, clipping, **bản đồ cắm ghim đỏ**, polaroid, bar-chart vẽ tay, nhật ký "DEAREST AME…",
  "WESTMINSTER DETECTIVE AGENCY". Đèn ấm dội vào sổ, quanh chìm bóng lạnh. → **đúng PC "read view".**
  Faceless (chỉ tay + sổ) → hợp làm UI thật nhất, ít rủi ro bản quyền nhất.
- **`videoframe_146758 / 149620 / 159350.png`:** Amelia ở bàn cạnh cửa chớp, ban ngày teal-lạnh +
  đèn ấm. **Chỉ dùng làm mood/palette ref** — có mặt nhân vật, không dán thẳng vào UI.

**Ánh xạ:** mặt bàn ngập giấy = layer **Index** · cuốn sổ mở = layer **Read**.

---

## Brief (tâm lý / mục tiêu)

- **Minimalist CÓ hồn**, không phải "terminal trên web" / dashboard công nghiệp.
- **2 khán giả:** prof ("có kiến thức + *một chút* style") · bạn ("thú vị đó").
  → **Nhắm prof, bạn tự đậu theo.** Làm ngược thì mất cả hai. Thứ tự: **kiến thức trước, style là garnish.**
- **Chống đụng-hàng bằng CỤ THỂ, không phải concept mới.** Vân tay = nội dung thật + persona
  **Ope Watson** + tổ hợp lạ, mang vào tận các xó (404, empty state, timestamp, microcopy).
  *"Không out-concept được internet — out-cụ-thể nó."*
- **Chững chạc = cái phanh** (typography + khoảng thở + tiết chế motion).

---

## Skin: collage ẤM làm tay (không phải dossier lạnh)

Ref là **scrapbook**, không phải giấy tờ quan liêu. Tách vai:
- **STRUCTURE = ngôn ngữ tài liệu** (`CASE #037`, `FILED: 09.2026`, `STATUS: OPEN`, `FILED UNDER`)
  → cho prof đọc ra "có tổ chức".
- **SKIN = collage ấm** (sticky note, băng keo, polaroid, map ghim đỏ, giấy ấm, viết tay)
  → cho "thú vị" + warmth.
- **Chữ viết tay CHỈ làm accent/marginalia. Body text vẫn sạch/serif, đọc được** — không thì
  prof không đọc nổi nội dung thật.
- **Palette = teal-lạnh + đèn-ấm điện ảnh** (như ref), **KHÔNG pitch-black.**

---

## Landing = 3D scene THẬT (procedural, camera POV) — THAY AboutHero

**Mục tiêu (ĐÃ CHỐT): scene 3D này = LANDING mới, THAY `src/components/sections/AboutHero.js`.**
Tái tạo scene chạy trên web — cả ánh sáng lẫn các item. Hướng **procedural** (geometry vẽ bằng
code Three.js, như repo Blackwater FPS — AI gen được), **không dùng model nhân vật** (khó).
→ Prompt gọi Astra: [`astra-3d-landing-prompt.md`](./astra-3d-landing-prompt.md).
→ **Bước hiện tại = TEST feasibility:** xem Astra dựng nổi nguyên bàn + mọi item + ánh sáng không.
  Landing/đọc/mount vào site làm SAU khi test đạt.
→ **Phasing:** sổ = 1 prop rỗng trong scene; content + markdown engine bê vào ở phase sau (làm scene
  trước cho khỏi sốc).

- **Camera đặt ĐÚNG POV nhân vật** — first-person nhìn xuống bàn + casebook (đúng khung `153022`).
  → **khỏi cần model nhân vật vì bạn LÀ cô ấy** (nhìn qua mắt: chỉ thấy bàn, sổ, tay).
- **Camera cố định tại góc đó** (không di chuyển). Tùy chọn: sway nhẹ theo chuột cho có hồn — không bắt buộc.
- **Three.js / React Three Fiber** (khớp Next.js stack), geometry + lighting procedural.
  Lean vào AI gen code (bạn kém khoản này → lái bằng test, không sửa tay).

**Guardrail (đừng để tham vọng 3D phá 2 thứ cốt lõi):**
- **Text đọc KHÔNG render trong 3D.** Scene 3D = *khung / không khí / index*. Khi ĐỌC → camera
  dolly vào cuốn sổ, **con chữ là HTML phẳng** (nét, select được, accessible, SEO). 3D là cái
  khung, HTML là con chữ. Render chữ thành texture 3D = mất "prof đọc được" + hỏng a11y.
- **3D chạy CẢ PC + mobile — mobile = LOD nhẹ** (ít object, shader đơn giản, cap DPR/FPS, shadow rẻ,
  throttle khi idle). Text đọc vẫn HTML phẳng mọi nơi (guardrail trên). Browse/read trên mobile có
  thể vẫn fallback flat log cho ergonomic — chốt sau.

**Ceiling (chấp nhận trước — tradeoff của hướng này):**
- Procedural cho look **hình học / sạch cạnh**, KHÔNG ra painterly + DOF mềm của ref. → nhắm
  **bố cục + mood ánh sáng + cách bày item** của ref, **không** đòi match y hệt nét vẽ. Bản 3D là
  *diễn giải* ref, không phải copy pixel.
- Nhiều code Three.js → phụ thuộc AI gen + maintain; khó chỉnh tay khi lệch.
- Painterly/DOF real-time là chỗ FPS tụt nhất → fake DOF nhẹ, bake lighting khi được.
- ⚠️ Scene 3D **khác** 3D page-flip (turn.js) — flip vẫn không làm (lag + gimmick).

**De-risk trước khi cam kết:** gen một prototype 3D vứt-đi (R3F, POV bàn thô + đèn) → nhìn thử
look có chấp nhận được không, *trước khi* dựng thật. Painterly-match là rủi ro lớn nhất.

---

## Cấu trúc: Index → Read (giống nhau trên cả 2 máy)

| | Index (chọn) | Read (đọc) |
|---|---|---|
| **PC** | **scene 3D bàn thám tử** (camera POV cố định) → bấm clue/item | camera dolly vào sổ → **text HTML phẳng**, lật ngang giữa entry |
| **Mobile** | **log dọc — mỗi note = 1 item preview** | tap → entry, **cuộn dọc** |

- **1 note = 1 trang = 1 item dọc.** KHÔNG cắt trang giữa note → đơn vị khớp trên cả hai vỏ.
  *(Ceiling: phân trang thật sẽ xé note dài thành nhiều item lẻ trên mobile → loạn. Đừng.)*
- **Một `entry` component dùng chung.** PC bọc trong bàn + lật ngang; mobile xếp dọc.
- **Dựng mobile-first, bàn là lớp phủ CHỈ của PC.** Mobile là nền, không bao giờ vỡ.

---

## Interactivity (đơn giản, không lag)

- **Đọc + mobile: CHỈ `transform` / `scroll-snap` native.** Không physics engine.
- **PC index: camera 3D POV** (Three.js), tùy chọn sway nhẹ theo chuột; click item trong scene → mở entry.
- **Một signature thôi** ("một phòng ồn"). Nhồi nhiều = bloat.
- **Alive nhờ tương tác rẻ + bền:** hover, scroll-reveal, parallax, **"lần theo [[wikilink]]"**
  giữa các note — interactive + đúng theme + gần như 0 bug.

---

## Quyết định còn mở

1. **Mobile item:** preview → tap mở *(đề xuất — co giãn khi archive phình)* vs full-entry feed.
2. **PC index:** bàn thám tử parallax làm cửa vào *(đang nghiêng)*.
3. **Palette:** dịu pitch-black → teal-ấm điện ảnh như ref? *(đề xuất: có.)*
4. ~~PC depth: parallax vs 3D~~ → **ĐÃ CHỐT: 3D scene THẬT** (procedural, camera POV nhân vật,
   không model nhân vật). Xem mục "PC view: 3D scene THẬT".

---

## Đã loại (guardrail thiết kế)

- Signature interaction kiểu **kính lúp rê / gạt redaction** → gimmick, hại read "có kiến thức", khó flat/mobile.
- **Skeuomorphic đặt-toạ-độ trên mobile** → không reflow, tap target teo.
- **3D page-flip (turn.js) + phân trang markdown** → lag mobile + layout nightmare + đọc ra "đồ chơi".
- **Không mang pattern industrial cũ sang:** graph view · spritz · CEFR · window-frame giả · tabs-mọi-file.

---

## Ghi chú kỹ thuật (KHÔNG ràng buộc — tạo mới là chính)

Code cũ **có thể** cân nhắc tái dùng nếu tiện (markdown render đang chạy, batching, card metadata),
nhưng **không để nó định hình vision.** Ưu tiên dựng mới từ ref.
