# Detective desk landing

`src/app/page.js` mounts `DeskLanding`. The previous `sections/AboutHero.js`
and the other components of the previous landing are preserved.

All four images in `public/content` have equal weight in this scene:

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
- `DeskObjects.js`: paper geometry, notebook and individual desk objects.
- `deskTextures.js`: paper, wood, map, photo and stationery textures.
- `DeskLanding.js` / `DeskLanding.module.css`: HTML navigation, title, loading
  state and WebGL fallback.

World units: the tabletop is at y = 0; its front edge is positive z. The camera
stays fixed and frames the desk differently for portrait screens. Rendering is
on demand, so the static view does not run a continuous animation loop. Mobile
uses fewer scraps and slats, a smaller shadow map, one shadow-casting light and
a lower device pixel ratio. Textures and procedural geometries are released
when the scene unmounts.

The notebook is a decorated prop in this phase. Reading articles, selecting
clues and camera transitions are not implemented. Article text belongs in HTML
when that phase is added.
