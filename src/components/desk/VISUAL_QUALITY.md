# Visual quality — desk scene reads soft / hazy ("mờ ảo")

## Modeling pass completed — 2026-09-07

The model repairs and 360-degree checks are recorded in MODELING_TODO.md.
The five PNG references now inform complete props, including the close-up clock.
DPR remains [1,2]; camera, lights, fog and exposure were not tuned in this pass.
The diagnostic notes below describe the earlier investigation. They are not a
verified claim that the new geometry resolves every cause of wide-shot softness.

Hand-off note. The wide desk shot looks soft and washed, while the **same items
in inspect mode (`InspectView`, 360° orbit) are razor sharp**. That contrast is
the main diagnostic clue — use it.

## Decision (owner)
Owner's call: the softness is **model quality + the far camera framing**, not a
render bug. **Modelling is the priority** (`MODELING_TODO.md`) — sharpen the
props first, then reassess. The supersample-dpr experiment was **reverted to the
`[1,2]` baseline**; the render levers below are kept as options for later, not
work to do now.

## Symptom
- Establishing desk view: soft edges, low contrast, slightly milky.
- Inspect view of any single item: crisp.
- Same Canvas, same renderer, same GPU, same models, same tone mapping in both.

## Ruled OUT (with proof)
- **GPU / hardware acceleration** — inspect renders sharp on the very same GPU
  and renderer. A GPU/accel problem would soften inspect too. It doesn't.
- **Model quality** — the same meshes/textures are crisp in inspect, so geometry
  and textures are not what causes the haze. (Their low-poly roughness is a
  separate cosmetic concern → `MODELING_TODO.md`.)

## What actually differs, desk vs inspect (candidates)
1. **Object screen-scale (primary suspect).** The desk is a wide shot: each prop
   covers few pixels, so thin rods, paper text and edges fall below one pixel
   and get averaged → soft. Inspect fills the frame with one object → many
   pixels per detail → crisp. This is under-sampling, not a blurry renderer.
2. **Lighting contrast.** Flat teal fill (`ambientLight` + `hemisphereLight` in
   `DeskScene.js` `Lighting`) lifts shadows uniformly → washed/low-contrast. The
   inspect rig uses a brighter, more directional setup → forms read sharper.
3. **Fog.** `<fog #344c46 24 42>` hazes the far half (window, board). Inspect has
   no fog. Only affects the background, not the near props.

## Already changed while investigating (do NOT redo; tune or revert instead)
- `dpr`: `[1,1.6]` → `[1,2]` (current). A forced supersample
  `Math.min(2.5, devicePixelRatio * 1.5)` was tried and **reverted** per the
  decision above. Note for later: a `[min,max]` dpr does NOT supersample when
  the display DPR ≤ 2 (typical Windows scaling 1.25–1.5) — it only matches the
  panel; a fixed value above device DPR is what adds samples.
- Fog start `17` → `24`; `toneMappingExposure` `0.95` → `1.0`.
- `.atmosphere` HTML overlay alpha reduced (`DeskLanding.module.css`).
- Fill light lowered: `ambientLight` `0.4` → `0.22`, `hemisphereLight` `1.2` →
  `0.5`.

## If revisited: how to confirm the cause (was never verified on a real display)
If the modelling pass doesn't fully resolve it, re-apply the supersample `dpr`
and read the desk to see which factor dominates:
- Sharper → under-sampling (#1) was it → tune the multiplier for a perf balance.
- Little change → it's contrast (#2)/fog (#3), a look problem, not blur.
- Frame-rate drops → lower the multiplier (`*1.25`, or cap at `2`).

## Levers available to Astra
- **Supersample dpr** (sharpens small/far detail; cost scales with dpr²).
- **Contrast**: widen the key-to-fill ratio (stronger spot/directional, lower
  ambient/hemisphere) so forms pop.
- **Fog**: push the start further or drop it for the mid-ground.
- **Framing**: a tighter desk camera would raise pixels-per-object without dpr.
- MSAA `antialias` is already on; post-processing (sharpen/SSAA) would add a
  dependency and the artifact CSP/perf constraints — weigh before reaching for it.

## Key insight
The props were modelled and lit for one fixed camera. A wide establishing shot
of many small objects is inherently softer than a close-up — the fix is more
samples (dpr), more contrast, or a closer composition, not "better GPU".
