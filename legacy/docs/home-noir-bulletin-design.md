# Home Noir Bulletin

**Trạng thái:** đang dùng  
**Cập nhật:** 2026-08-13  
**Source chính:** `src/components/sections/AboutHero.js`, `src/components/sections/BulletinWall.js`, `src/components/layout/LampScene.js`

## Ý đồ

Trang chủ là một phòng điều tra tối. Người xem gặp Ope trước; khi chân dung, tên và pronunciation biến mất, một dòng chứng cứ bắt đầu chạy trong cùng một khung nhìn. Chuyển động phải tạo cảm giác đang đi sâu qua hồ sơ nhưng camera và nền không cuộn.

Không dùng video nền, icon trinh thám trang trí, dây đỏ hay ghim. Đèn tuýp, giấy cũ, ảnh evidence và nhịp chuyển động tạo mood noir.

## Trình tự trải nghiệm

1. Hero chiếm `100dvh` và được pin trong một quãng `100%` viewport.
2. Chân dung mờ đi; tên và pronunciation đi vào giữa, phóng lớn rồi biến mất.
3. Bulletin chỉ bắt đầu hiện khi scroll chạm đúng điểm kết thúc Hero. Trước đó stage có `opacity: 0`, vì vậy section không trượt lên che Hero và không tạo đường biên giữa hai trang.
4. Bulletin được pin ở `100dvh`. Scroll tiếp theo chỉ điều khiển timeline: item bay từ dưới vào, snap vào vị trí, giữ ngắn, rồi bay khỏi cạnh trên.
5. Các item chạy theo nhiều wave. Wave mới vào ngay khi wave cũ rời đi nên chuyển động liên tục nhưng màn hình không đổi vị trí.
6. Không có auto-scroll. Timeline chỉ tiến hoặc lùi theo thao tác scroll thực của người xem; dừng scroll là chuyển động dừng tại chỗ.

Với `prefers-reduced-motion`, chỉ wave đầu được hiện tĩnh và không chạy chuỗi bay.

## Loading screen

`BootScreen` được render từ root layout nên che được lần tải HTML đầu tiên, không chỉ các lần chuyển route. Critical CSS của loader nằm inline trong `<head>` để bản thân loader không bị flash unstyled.

Loading screen dùng nền đen xanh, mép đèn tuýp mảnh, mã `CASE FILE / 0510`, tên Ope và một đường “developing evidence”. Screen giữ tối thiểu `650ms`, chờ `window.load` cùng `document.fonts.ready`, có fallback `2400ms`, rồi fade/blur trong `480ms`. Không dùng spinner hoặc progress percentage hiện đại.

## Scene và layering

- `.bw-wall` chỉ là trigger cao `100dvh`, nền trong suốt trước khi pin.
- `.bw-stage` là viewport thật, cao `100dvh`, `overflow: hidden` và giữ toàn bộ texture.
- `.bw-board` phủ stage, rộng `min(96vw, 1440px)`.
- Độ dài scroll ảo được ScrollTrigger tạo bằng pin spacing; không còn board cao nhiều màn hình.
- Fixture đèn, navigation và contact là fixed furniture ở layer `46–47`; evidence nằm phía dưới.

Cấu trúc này là yêu cầu cốt lõi: không đổi bulletin về một section dài cuộn tự nhiên.

## Đèn trần

Fixture là một khung đèn tuýp công nghiệp tối. Ba link `chat`, `casearchives`, `gallery` chia đều mặt khung. Ống sáng chỉ lộ ở cạnh dưới; ánh sáng tán rộng xuống dưới, không dùng cone hoặc vệt spotlight.

Desktop giữ đèn giữa trang với `width: min(840px, 66vw)`. Mobile kéo khung sát hai mép trên, cao `48px`; contact nằm ở hàng thứ hai tại `top: 64px`.

## Tỷ lệ vật

Kích thước thiết kế trước responsive scale:

| Vật | Kích thước | Vai trò |
|---|---:|---|
| Sticky | `205 × 170` | Nhắc việc ngắn |
| Note | `440 × 360` | Ghi chép tay dài |
| Document | `350 × 460` | Statement, transcript, coroner note |
| Map | `820 × 540` | Điểm neo thị giác |
| Big photo | `545 × 370` | Bằng chứng chính |
| Small photo | `260 × 180` | Chi tiết phụ |
| Polaroid | `265 × 318` | Nhân chứng hoặc khoảnh khắc |
| Receipt | `180 × 340` | Mốc thời gian hẹp và dài |
| Envelope | `360 × 210` | Vật chứng giấy có độ dày |
| Bare text | `400 × 90` | Nhãn vụ án và trạng thái |

Scale responsive nằm trong khoảng `0.86–1.08`, sau đó mỗi item còn được giới hạn theo cả chiều rộng lẫn chiều cao khả dụng. Vùng an toàn phía trên là `72px` trên desktop và `116px` trên mobile để không chạm đèn/contact.

## Placement theo wave

`layout()` không tạo grid, masonry hay hàng dọc. Thuật toán:

1. Seed `0x0813f00d` giữ bố cục ổn định qua reload.
2. Mỗi item có `anchorX`, rotation và kích thước thực tế.
3. Desktop chứa tối đa bốn item trong một wave, tablet ba và mobile hai.
4. Mỗi item thử tối đa `520` vị trí trong viewport.
5. `collisionBox()` tính bounding box sau rotation và gutter `4px`; vị trí va chạm bị loại.
6. Điểm số ưu tiên item gần vật đã đặt, gần tâm scene và vẫn nghiêng về `anchorX`. Kết quả là cụm sát, bất đối xứng và không bị gò vào lưới.
7. Nếu wave hiện tại không còn chỗ, item mở wave mới; collision được reset cho khung kế tiếp.

Map và ảnh lớn có thể chiếm phần lớn một wave. Mobile giữ item lớn bằng cách giảm số vật xuất hiện đồng thời thay vì thu tất cả thành thumbnail.

## Motion

Mỗi wave dùng nhịp `1.85` đơn vị timeline. Item trong wave lệch nhau `0.075` để snap lần lượt. Một wave gồm:

1. `0.16` đơn vị khoảng đệm trước entry.
2. Item fly-in trong `0.24` đơn vị và bắt vào vị trí layout được đẩy xuống `34vh`: đây là snap duy nhất ở phía dưới.
3. Từ mốc `0.44`, cả wave trôi tuyến tính không ngắt từ `+34vh` tới `-34vh` trong `0.90` đơn vị timeline. Không có snap, plateau hoặc điểm dừng ở giữa.
4. Khi wave đã tới vùng trên, item fly-out khỏi mép trên trong `0.24` đơn vị: đây là snap thứ hai.
5. Một khoảng release ngắn trước wave kế tiếp.

Đoạn linear travel giữ nguyên khoảng cách giữa các item trong wave, nên bố cục không va chạm. Vị trí layout trung tâm chỉ là điểm wave đi ngang qua trong lúc scroll, không phải một điểm snap.

Entry:

```text
y: khoảng 84vh phía dưới vị trí đích
x: jitter nhẹ
opacity: 0 → 1
scale: 0.82 → 1
ease: back.out(1.55)
```

Exit:

```text
y: vượt cạnh trên khoảng 76vh
x: drift ngược nhẹ
opacity: 1 → 0
scale: 1 → 0.92
ease: power2.in
```

Stage fade từ đen Hero sang texture bulletin trong `0.12` đơn vị đầu và fade về đen sau wave cuối. Quãng scroll của scene là giá trị lớn hơn giữa `4.8 × viewportH` và `waveCount × 1.55 × viewportH`; mỗi wave có một quãng cuộn tuyến tính liên tục giữa snap dưới và snap trên.

## Chất liệu

Board dùng nền đen xanh `#050706`, nhiễu chấm, vệt dọc mờ và vignette hai cạnh. Sticky, note, document, receipt và envelope được dựng bằng CSS để giữ cảm giác thủ công. Ảnh evidence hạ brightness, tăng contrast và thêm sepia nhẹ.

Board không dùng ghim. Tape chỉ xuất hiện trên một số ảnh; giấy và note dựa vào shadow, rotation, nếp gấp và mép vật liệu để nổi khỏi nền.

Map gốc nằm tại `public/evidence/noir-city-map.png`: bản đồ thành phố sông hư cấu, bút chì và technical pen, không chứa chữ, ghim, tape, logo hoặc watermark.

## Điểm cần giữ khi sửa

- Không đưa video background, icon trang trí, dây đỏ hoặc ghim trở lại.
- Không để bulletin trở thành một trang dài cuộn qua camera.
- Không đặt background hiện hữu của bulletin phía trên Hero trước điểm bắt đầu của scene.
- Không bỏ critical CSS của loading screen ra khỏi `<head>`; nếu làm vậy FOUC có thể xuất hiện lại.
- Không đổi placement về grid, masonry hoặc shelf rows.
- Không để sticky chứa đoạn văn dài.
- Không đặt cone light dưới đèn tuýp.
- Luôn kiểm tra vùng an toàn trên cả mobile và desktop khi đổi kích thước item hoặc fixture.

## Nút chỉnh nhanh

| Muốn đổi | Vị trí |
|---|---|
| Kích thước vật | `SIZE` trong `BulletinWall.js` |
| Khoảng va chạm | `COLLISION_GAP` |
| Nhịp trái/phải | `anchorX` trong `ITEMS` |
| Số vật mỗi wave | `waveLimit` trong `layout()` |
| Độ dài scene | callback `end` của Bulletin ScrollTrigger |
| Nhịp snap-in/travel/snap-out | `waveStride`, `enterLead`, `snapOffset`, `travelLead`, `travelDuration`, `exitLead` |
| Tông ảnh | `.bw-photo img` |
| Màu giấy | `--tone` |
| Độ tán sáng | `washStyle` trong `LampScene.js` |

## File liên quan

- `src/app/page.js`: ghép Hero và BulletinWall.
- `src/app/layout.js`: gắn loading screen và inline critical loader CSS.
- `src/components/layout/BootScreen.js`: lifecycle tải trang và markup opening case file.
- `src/components/sections/AboutHero.js`: Hero, fixture, navigation, contact và timeline biến mất.
- `src/components/layout/LampScene.js`: wash của đèn trần.
- `src/components/sections/BulletinWall.js`: data, placement theo wave, vật liệu và motion.
- `src/hooks/useMomentumScroll.js`: làm mượt thao tác wheel thủ công trên desktop.
- `public/evidence/noir-city-map.png`: map gốc.
