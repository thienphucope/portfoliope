# Roadmap: Server-Side Vault Cache & Processing Migration

## Objective
Di chuyển logic quản lý file, xây dựng bản đồ liên kết (Graph), và render Markdown sang phía Server (Next.js API Routes). Client đóng vai trò hiển thị (View) và điều hướng, Server đảm nhiệm xử lý dữ liệu thô, SEO và đồng bộ hóa liên kết.

## Philosophy
Xây dựng serverside như một trung tâm quản lý filetree/graph/renderhtml

Mọi mutation (save, rename, delete) đều phải tải content mới nhất trước khi thực hiện thay đổi và push GitHub 1 lần (batch) để tăng tốc và đều phải cập nhật tree/graph sau đó


---

## 1. Kiến trúc Server-side (Libraries)

### `src/libs/vault.js` (refactor từ components/hooks trong src\features\case)
- **Quản lý Cache**: Lưu trữ cấu trúc Vault (Tree) và Graph.
- **Xây dựng Graph**: Quét nội dung file `.md` để tìm `[[wikilinks]]`, tạo Nodes và Edges.
- **Link Refactoring**: 
    - Khi **Rename**: Tự động quét toàn bộ Vault và cập nhật các link cũ thành link mới.
    - Khi **Delete**: Xử lý các link "gãy", cứ dim lại thôi.
- **SEO Ready**: Render trước Markdown của pin file và 100 file liền kề thành HTML để phục vụ SEO ngay từ lần đầu load trang.

### `src/libs/markdown.js` (src\features\case)
- **Render Engine**: Chuyển đổi Markdown thành HTML an toàn (Sử dụng remark/rehype).
- **Link Resolver**: Chuyển đổi `[[wikilinks]]` thành thẻ `<a>` với đường dẫn đúng đến route ứng dụng.

---

## 2. Tái cấu trúc API Routes (`src/app/api/cases/`)

### GET Methods
- `GET /api/cases/init`: Trả về Tree + Graph + HTML của pin file + 100 file liền kề (SEO batch).
- `GET /api/cases/tree`: Lấy cấu trúc thư mục.
- `GET /api/cases/graph`: Lấy bản đồ liên kết.
- `GET /api/cases/content?path=...`: Lấy nội dung render (HTML + sha) từ Cache (lazy load khi click tab).

### POST Methods
- `POST /api/cases/lock`: Acquire lock + fetch latest content/sha. Dùng chung cho mọi mutation.
- `POST /api/cases/save`: Lưu nội dung file (tạo mới hoặc cập nhật). Tự động release lock.
- `POST /api/cases/unlock`: Giải phóng khóa (khi cancel).
- `POST /api/cases/rename`: Đổi tên/Di chuyển file.
- `POST /api/cases/delete`: Xóa file.
- `POST /api/cases/ai`: Xử lý AI.

---

## 3. Scenarios & API Flows (Đầy đủ)

### 1. Khởi tạo (Initial Load - SEO Optimized)
- **Client**: Gọi `GET /api/cases/init`.
- **Server**: Fetch Tree + Build Graph + Render MD thành HTML cho pin file và 100 file liền kề.
- **Response**: `{ tree, graph, pinnedContent: { path, html, sha }, nearbyContents: [{ path, html, sha }] }`.

### 2. Mở file (Click Tab)
- **Client**: Gọi `GET /api/cases/content?path=` → lấy từ **server cache**.
- **Response**: `{ html, sha }`.

### 3. Xem FileTree / Graph (Refresh)
- **Client**: Gọi `GET /api/cases/tree` hoặc `GET /api/cases/graph`.

### 4. Tạo file mới (Create) & Bắt đầu chỉnh sửa (Edit → Lock)
- Cùng một flow, chỉ khác ở lock step:
  - **Edit**: `POST /api/cases/lock` → fetch latest content + sha từ GitHub → trả về `{ sessionId, content, sha, expiresAt }`.
  - **Create**: Client tự tạo URL tạm (`/case/new-file-path`) để hiển thị đúng path ngay trên UI → `POST /api/cases/lock?create=true` → verify path chưa tồn tại → trả về `{ sessionId, content: "", sha: null, expiresAt }`. Khi save thành công, client navigate vào đúng path đó.
- Client mở editor với content nhận được → user chỉnh sửa.

### 5. Lưu thay đổi (Save)
- **Edit**: **Client** gọi `POST /api/cases/save` kèm content, sha, sessionId, **password** → Server verify password → Lưu GitHub → **Update Graph + Content Cache** → Release lock.
- **Create**: **Client** gọi `POST /api/cases/save` kèm content, sessionId (không cần password) → Server verify path chưa tồn tại → Lưu GitHub → **Update Tree + Graph Cache** → Release lock.
- **Refresh**: Client gọi lại `GET /api/cases/content?path=` để lấy HTML mới nhất.

### 6. Hủy chỉnh sửa (Cancel)
- **Client**: Khi người dùng nhấn "Cancel" (sang tab khác, key timeout -> client hỏi wanna save changes -> no), gọi `POST /api/cases/unlock`. Với cancel create thì xóa url tạm
- **Server**: Xóa sessionId khỏi fileLocks. Client quay lại hiển thị HTML từ server cache.

### 7. Thêm Bình luận (Comment)
- **Client**: Gọi `POST /api/cases/lock` → Append comment vào content → Gọi `POST /api/cases/save` (không cần password) kèm content mới, sha, sessionId.
- **Server (save)**: Validate → Lưu GitHub → **Update Graph + Content Cache** → Release lock.
- **Refresh**: Client gọi lại `GET /api/cases/content?path=` để lấy HTML mới nhất.

### 8. Đổi tên / Di chuyển (Rename)
- **Client**: Gọi `POST /api/cases/lock` với oldPath → Gọi `POST /api/cases/rename` với `{ newPath, sha, sessionId, password }` (Freeze UI).
- **Server**: Verify password → `vault.js` cập nhật links hàng loạt → Tạo file mới, xóa file cũ trên GitHub (1 batch push) → **Update Tree + Graph + Content Cache** → Release lock.
- **Refresh**: Client gọi lại `GET /api/cases/tree` và `GET /api/cases/graph`.

### 9. Xóa file (Delete)
- **Client**: Gọi `POST /api/cases/lock` → Gọi `POST /api/cases/delete` với `{ sha, sessionId, password }`.
- **Server**: Verify password → Xóa trên GitHub → `vault.js` xử lý links gãy (dim) → **Update Tree + Graph Cache, xóa Content Cache của file** → Release lock.
- **Refresh**: Client gọi lại `GET /api/cases/tree` và `GET /api/cases/graph`.

### 10. Hỏi đáp AI (AI Chat)
- **Client**: Gọi `POST /api/cases/ai`.
- **Server**: Xử lý Grok/Gemini/RAG → Trả về text.

> **Lưu ý**: Mọi mutation (save, rename, delete) đều push GitHub 1 lần (batch) để tăng tốc.

---

## 4. IO Reference

### `POST /api/cases/lock`
```
Body:    { path }
Query:   ?create=true (optional)
Response: { sessionId, content, sha, expiresAt }
```
- Normal: fetch latest content + sha từ GitHub
- `?create=true`: verify path chưa tồn tại → trả `content: "", sha: null`

### `POST /api/cases/save`
```
Body:    { path, content, sha, sessionId, password? }
Response: { html, sha }
```
- **edit**: require password, verify sha conflict
- **create** (`sha: null`): skip password + sha check, verify path chưa tồn tại
- **comment**: skip password, verify sha conflict
- Server tự xác định context qua sha + lock metadata
- Tự động release lock sau khi lưu thành công

### `POST /api/cases/rename`
```
Body:    { oldPath, newPath, sha, sessionId, password, overwrite? }
Response: { ok }
```
- Require password

### `POST /api/cases/delete`
```
Body:    { path, sha, sessionId, password }
Response: { ok }
```
- Require password

### `POST /api/cases/unlock`
```
Body:    { path, sessionId }
Response: { ok }
```

### `GET /api/cases/content`
```
Query:    ?path=...&format=html|raw
Response: { html?, content?, sha }
```
- `format=raw` → trả raw MD (dùng cho editor)

---

## 5. Flow mapping theo nút

| Nút | API calls |
|---|---|
| init (manual refresh) | `GET /init` |
| click tab | `GET /content?path=` (server cache) |
| create | `lock?create=true` → editor → `save` → `GET /tree` + `GET /graph` |
| edit | `lock` → editor → `save (password)` → `GET /content` |
| comment | `lock` → append → `save` → `GET /content` |
| rename | `lock` → `rename (password)` → `GET /tree` + `GET /graph` |
| delete | `lock` → `delete (password)` → `GET /tree` + `GET /graph` |
| cancel | `unlock` → hiển thị lại HTML từ server cache |

---

## 6. Các bước triển khai (Tasks)

- [ ] **Phase 1: Foundation (Libs)**
  - [ ] Thiết lập `src/libs/markdown.js` để render MD → HTML (hỗ trợ SEO).
  - [ ] Xây dựng `src/libs/vault.js` với logic build Graph và xử lý "Link Refactoring".
- [ ] **Phase 2: API Refactoring**
  - [ ] Chuyển đổi `src/app/api/cases/route.js` sang cấu trúc route con.
- [ ] **Phase 3: Client Integration**
  - [ ] Cập nhật hooks và triển khai cơ chế "Freeze & Refresh".
- [ ] **Phase 4: Optimization**
  - [ ] Tối ưu hóa việc render hàng loạt ở server.