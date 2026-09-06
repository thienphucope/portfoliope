# Astra prompt — 3D Detective-Desk scene (FEASIBILITY TEST)

> **Đây là BÀI TEST**, chưa phải landing hoàn chỉnh. Mục tiêu: xem Astra có dựng nổi *nguyên cái
> bàn thám tử + mọi item trên đó + ánh sáng* bằng procedural 3D không.
> Chuyện sổ mở ra đọc / overlay HTML / mount vào site / mobile LOD → **làm SAU khi test đạt.**
> Ref: `public/content/videoframe_153022.png`. **Success = scene chạy được + nhìn giống ref, nhất là ánh sáng.**
> Bối cảnh đầy đủ: [`casearchive-casebook-design.md`](./casearchive-casebook-design.md).

---

## PROMPT

**Goal:** Procedurally build the **ENTIRE detective's desk scene** from the reference — every object
on the desk **and the lighting** — as a standalone, runnable **Three.js / React Three Fiber** scene.
This is a **feasibility test**: I want to see whether you can recreate the whole desk faithfully.
**View `public/content/videoframe_153022.png` if you can, and match it.**

### The reference (described, in case you can't open it)
First-person **POV looking DOWN** at a wooden desk (~50–60° downward tilt). An **open notebook/
casebook sits at center** — the brightest thing — lit by a **warm lamp from front-above**. The rest
of the desk is **buried in scattered case scraps**: handwritten sticky notes (yellow/green/blue),
torn paper, newspaper clippings, all covered in scrawl, receding into **cool blue shadow** toward the
edges. A hand may rest at the lower-right edge. **Warm pool on the book, cool teal shadow everywhere
else**, soft vignette. Cozy whimsical-noir detective mood.

### Tech
- **React Three Fiber** (`@react-three/fiber` + `@react-three/drei`) — a standalone component/route I
  can open and look at.
- **Everything in JS/TS code — NO imported 3D model files** (`.glb/.gltf/.fbx/.obj`), no Blender.
  Geometry from primitives/simple meshes; **lighting from code lights** (Directional / Spot / Point /
  Ambient / Hemisphere); materials + any post-processing, all in code. Small **2D image textures**
  (paper grain, sticky look) are fine; **3D models are not.**
- **No character model** — camera = the person's eyes (optional hands/forearms at the desk edge).
- Cap `dpr` so it runs, but **this test prioritizes LOOK / FIDELITY over optimization.**

### Camera
- Fixed **first-person POV looking down** at the desk, framed like `153022`. **No translation.**
  Optional tiny mouse-driven sway (clamped, eased; disabled under `prefers-reduced-motion`).

### Build the WHOLE desk — items (match the ref's layout)
**Center — the open casebook** (the lamp lights it, so it reads as the focal point in the ref).
**For this test it is JUST ANOTHER STATIC OBJECT** — no content, no interactivity. Build it
empty/placeholder; real content + a markdown engine get piped into its pages in a LATER phase.
- Two pages. Left: a small pasted illustration/photo + blocks of **faux** handwritten text + a yellow
  sticky. Right: a headline block, a **tiny bar chart**, a **small map with red pins + red circles**,
  another yellow sticky. *(Faux scribble geometry / textured planes — legibility NOT required now.)*

**Scattered around it (dense clutter framing the lit center):**
- Many **sticky notes** (yellow/green/blue) at slight random rotations.
- **Torn papers + newspaper clippings** with scrawl.
- Pens/pencils, a **magnifier**, a mug, a small stack of books at the far edge.

### Lighting — THE thing being tested, get it right
- **Warm key light** (desk lamp, front-above) → a bright **pool on the open book**, falling off into shadow.
- **Cool teal-blue ambient/fill** for the surrounding desk (daylight-through-blinds feel).
- **Soft / contact shadows**, gentle **vignette**, optional subtle **film grain**.
- **Cinematic, NOT pitch black** — deep cool shadow, not void. The **warm-center / cool-surround
  contrast is the signature — nail that.**
- **Stylization: stylized-warm (soft, painterly / anime-render feel), NOT raw hard-edged "box world."**
  Soft materials, gentle roughness, warm↔cool color grade.

### Out of scope for THIS test (do later)
- No reading UI, no clicking clues, no HTML text overlay, no dolly-into-book, no site mounting, no
  mobile LOD tuning. **Just the scene + lighting.**
- **The casebook is an empty prop this phase.** Phase 2 = pipe real content + a markdown engine into
  its pages. Scene first, content later — so the content step isn't a shock.

### Deliverable
1. **First a rough pass** (desk + book + lamp key light + cool fill + POV camera) so the **lighting can
   be eyeballed against `153022`** before detailing.
2. Then fill in the scattered items to match the clutter.

**Success = it runs, and looks recognizably like `153022`, with the warm-pool / cool-surround lighting.**
