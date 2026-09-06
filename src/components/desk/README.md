# Detective desk landing

`src/app/page.js` mounts `DeskLanding`. The previous `sections/AboutHero.js`
and the other components of the previous landing are preserved.

All five images in `public/content` inform this scene:

- `videoframe_141128.png`: the twin-bell clock, spiral calendar, ribbed pen
  holder, scissors and lamp details in close-up.
- `videoframe_146758.png`: the full working surface, stationery, paper trays,
  leaning books, calendar and arrangement beside the windows.
- `videoframe_149620.png`: the articulated lamp, its warm light and the cool
  daylight in the study.
- `videoframe_153022.png`: the curved notebook, layered scraps, pasted photos,
  chart, map, red pins and handwritten marginalia.
- `videoframe_159350.png`: the room corner, two sets of Venetian blinds, desk
  drawers, wall evidence board and small side table.

The geometry and lighting are procedural. The canvas textures are small,
deterministic drawings for physical props; reference frames and imported 3D
models are not used as scene assets. There is no character model.

## Files

- `DeskScene.js`: renderer, camera framing, lighting and resource lifetime.
- `DeskRoom.js`: windows, room, board and furniture.
- `primitives.js`: shared building blocks (Box, Rod, Disc, Ring, Paper, Tape,
  Pin, Polaroid, Pencil, Book) reused by the room and the items.
- `items/`: one file per desk object (Casebook, DeskLamp, Mug, PenCup, Scissors,
  Magnifier, Stapler, DeskScatter, Organizer, Calendar, Radio, DeskClock),
  re-exported from `items/index.js`. Split out so each item can grow its own
  interaction later. `PaperClutter.js` is the exception: it exports `paperItems`,
  a function returning one interactive item per sheet/photo on the desk.
  DeskScatter lumps the loose pencils and paper clips that aren't worth files.
- `deskTextures.js`: paper, wood, map, photo and stationery textures.
- `DeskLanding.js` / `DeskLanding.module.css`: HTML navigation, title, loading
  state and WebGL fallback.
- `Interactive.js`: per-item hover glow and click-to-inspect wrapper.
- `paperSupport.js`: sampled contact heights for layered paper.

World units: the tabletop is at y = 0; its front edge is positive z. The camera
stays fixed and frames the desk differently for portrait screens. Rendering is
on demand, so the static view does not run a continuous animation loop. Mobile
uses fewer scraps and slats, a smaller shadow map, one shadow-casting light and
a lower device pixel ratio. Textures and procedural geometries are released
when the scene unmounts.

The notebook is a decorated prop in this phase. Reading articles, selecting
clues and camera transitions are not implemented. Article text belongs in HTML
when that phase is added.
