# Desk modeling — completed pass, 2026-09-07

This pass uses all five reference PNGs in public/content, including the new
videoframe_141128.png close-up. Unseen backs and undersides follow plausible
construction for the same period and materials.

## Completed

- **Lamp:** parallel links use a shared joint plane and identical offsets at
  both ends. Two coil springs terminate on the lower joint axles. The head
  attaches at the shade socket. The shade has a thick rim, inner enamel lining,
  socket and bulb; the weighted base has a closed underside and power cable.
- **Books:** size consistently means cover width, total thickness, cover length.
  Front and back boards connect through a curved spine; the page block has
  three exposed edges. Standing books rotate the complete book, preserving
  the binding orientation. Stacked books and floor books have corrected heights.
- **Magnifier:** a closed, convex glass lens sits inside a stepped metal frame.
  The ferrule connects the frame to a shaped, capped handle.
- **Mug:** the hollow cup has a thick lip, interior floor and ceramic handle
  joined at both ends. The cup rests in a solid saucer; ribs follow the taper.
- **Clock:** the new reference guides the rounded case, domed hollow bells,
  carry handle, dial and feet. A glass crystal covers separate solid hands.
  The back has a winding key, setting knob, screws and a rear support foot.
- **Calendar:** both boards and the page pack have real binding holes. Rings
  pass through them, and a bottom strap sets the A-frame spread.
- **Other props:** hollow pen holder with a bottom and full-length pencils;
  forged scissor blades, joined grips and pivot; stapler hinge, magazine, anvil
  and rubber base; radio feet, rear panel, controls and fasteners; bent wire clips.
- **Casebook and paper:** the open book has separate covers, a binding and
  filled curved page blocks. Attached notes conform to the page surface.
  Loose paper has closed thin geometry and an unprinted reverse. Sheet heights
  sample the previously placed sheets instead of using arbitrary raised origins.
- **Placement:** freestanding props contact y = 0. Photos rest on the sheets
  underneath, and the stapler sits in the clear space beside the mug.

Paper now uses separate front/back materials. Interactive supports material
arrays and restores shared materials once, keeping hover functional.

## Verification

- ESLint passed for src/components/desk.
- 90 browser renders: 15 review subjects, each from four sides, above and below,
  using the same light rig as Inspect. No non-finite vertex coordinates.
- Bounds checks put freestanding model minima at y = 0 within 0.000001 units.
  Individual sheets can sit above zero when supported by other sheets.
- Actual desk interaction checked for clock, lamp, calendar, organizer, mug,
  magnifier, pen cup, scissors, radio, stapler, casebook, pencils/clips and a
  clipping: select, full 360-degree drag, underside, return to desk.
- Visual captures are in .devlogs/model-review (local review output). The
  temporary /model-review route is removed after verification.

The renderer, lighting, fog, exposure and desk camera retain the previous
baseline. Any later work on wide-shot softness belongs to VISUAL_QUALITY.md.

## Rules for future model changes

Coordinates are desk world space: tabletop y = 0, front edge +z.
Primitives live in primitives.js; each item is in items/<Name>.js.
paperSupport.js holds the sheet contact sampling, and ScissorShape.js is shared
by the loose scissors and the pair in the pen holder.

Always check the rear, underside, physical joints and support contacts in
Inspect. A model is not finished based only on the fixed desk view.
