# Desk modeling — known issues to fix

Context: the props were modelled to read correctly from the **single fixed desk
camera**. Now that each item opens in **inspect mode** (`InspectView` in
`DeskScene.js`, free 360° orbit), the back sides, undersides and shortcuts are
visible. The goal of this pass is to make every item a **complete solid that
holds up from all angles**, not a facade for one viewpoint.

Do NOT treat these as done until checked in inspect mode by rotating fully.

Coordinates are the desk world space (tabletop surface at `y = 0`, front edge is
`+z`). Primitives live in `primitives.js`; each item in `items/<Name>.js`.

---

## 1. Desk lamp — arms twisted, spring detached
File: `items/DeskLamp.js`

- The two side rods of each arm segment (the `[-0.073, 0.073].map(offset => …)`
  pair, plus the thinner center rods) are **not parallel** — they read as
  twisted/misaligned between the base→elbow and elbow→head segments.
- The coil **spring** (`spring` = a fixed `CatmullRomCurve3` helix from
  `(-2.97, 0.72, -0.83)` upward) is **floating**, not anchored to the arm
  joints.

Target: both arm rails genuinely parallel on each segment; the spring anchored
between the two lower-arm joints (or wrapped around the lower rail), physically
connected at both ends.

## 2. Books — covers look wrong, no real spine
File: `primitives.js` → `Book` (used by `items/Organizer.js` and the floor books
in `DeskRoom.js` `DeskFurniture`).

- Current build = page block + a top plate + a bottom plate + one thin side box,
  with the cover texture laid on top. It reads like a sandwich, not a book.

Target: a proper book = the page block wrapped by a **front cover and back
cover** on its two large faces, joined by a **spine** slab along the binding
edge. Cover texture on the front face; page edges on the other three sides.

## 3. Magnifier — no actual lens glass
File: `items/Magnifier.js`

- The lens is a flat `circleGeometry` at `opacity 0.14` inside the ring — nearly
  invisible, doesn't read as glass.

Target: a real **glass lens** filling the ring frame — a slightly domed /
thicker transparent disc with a glassy material (visible specular highlight,
higher opacity, ideally a hint of refraction), seated in the frame.

## 4. Mug — handle only floats outside the body
File: `items/Mug.js`

- The handle is a `Ring` (torus) at `[0.27, 0.31, 0]` sitting **outside** the
  wall, not joined to the mug body. From other angles it reads as a detached
  loop.

Target: a handle that **attaches to the mug wall at top and bottom** (C/D
shape merging into the body), correct from every angle.

## 6. Calendar — legs not attached to the spiral binding
File: `items/Calendar.js`

- The two tilted boards (the A-frame "legs", front `+0.22` / back `-0.22`) and
  the 8 spiral binding rings (row at `y ≈ 0.808`) are **separate** — the boards
  float relative to the coil instead of being bound by it.

Target: the two boards meet at the top where the spiral rings **thread through
both**, physically joining them into one bound calendar.

## 7. Floating items
Several items hover above the tabletop instead of resting on it — obvious once
you orbit in inspect mode. Audit every item so its lowest point sits on the
surface (`y = 0`); no gap, no clipping into the desk. Check especially the props
placed with a raised group origin (e.g. `Radio`, `DeskClock`, `Mug`,
`PaperClutter` sheets).

---

## General
The overarching fix is #7's spirit applied everywhere: stop modelling for one
camera. Each prop should be closed geometry, correct on the back and underside,
and physically connected where parts meet (joints, bindings, handles).
