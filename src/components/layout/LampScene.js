// Single overhead beam of light — the shared "lamp" used across every page.
// A ceiling light: anchored to the TOP of its container and exactly one screen
// tall (100dvh, not 100% — so tall/scrolling pages don't stretch it). It stays
// at the ceiling and scrolls out of view as you go down, instead of following
// the viewport. Drop as a child of any positioned, full-height container; it
// screen-blends a soft light column over whatever bg is behind.
// Server- and client-safe (inline styles only, no styled-jsx / hooks).
// CSS applies filter BEFORE clip-path, so a blur on the clipped element leaves
// the trapezoid's edges razor-sharp. The blur therefore lives on the wrapper and
// the clip on the child, which is what actually scatters the beam's borders.
const wrapStyle = {
  position: 'absolute',
  left: '50%',
  top: 0,
  transform: 'translateX(-50%)',
  // The clip below is in PERCENT of this box, so the cone's opening angle is
  // atan(spread / height) — i.e. it tracks the viewport ASPECT RATIO. At 16:9
  // that's ~33°; on a 390x844 phone the same percentages collapse to ~9° and the
  // beam reads as a squeezed sliver. Flooring the width in dvh pins a minimum
  // angle (~20°) that no longer depends on how narrow the screen is. On desktop
  // 200vw always wins, so nothing there changes. Raise 200dvh for a wider cone.
  width: 'max(200vw, 200dvh)',
  height: '100dvh',
  // A lamp lights what's IN FRONT of it. At z 0 the column painted under every
  // positioned item on the page (gallery cards, case notes), so it read as a
  // glow stuck behind the furniture. 44 puts it over content and just under the
  // shade (45), mirroring how the shade already works — screen-blend + no
  // pointer events, so it only adds light. Anything that must stay unlit sits
  // above 44: the landing's lamp fixture (46), the held magnifier (50).
  zIndex: 44,
  pointerEvents: 'none',
  mixBlendMode: 'screen',
  // Just enough to take the razor off the clip edge. The blur only works at all
  // because it sits on the wrapper, above the clip — filter runs before
  // clip-path, so on the clipped element it would do nothing.
  filter: 'blur(8px)',
};

const beamStyle = {
  width: '100%',
  height: '100%',
  clipPath: 'polygon(44% -2%, 56% -2%, 74% 102%, 26% 102%)',
  // No horizontal mask: a linear mask spans 200vw while the beam's throat is
  // only ~24vw, so it can't track the trapezoid — it left the top edge hard and
  // ate the bottom. Shape comes from the clip, softness from the wrapper blur.
  background:
    'linear-gradient(to bottom, rgba(244,252,250,0.98) 0%, rgba(214,238,232,0.52) 22%, rgba(184,222,216,0.24) 52%, transparent 92%)',
};

// The dark half of the lamp. The page background is already #000, so nothing
// makes it "darker" — what still reads bright at the bottom is the CONTENT.
// This scrim therefore sits ABOVE content (z 45: over gallery snow at 40, under
// the held magnifier at 50) and ramps in two stops, so it dims evenly instead of
// banding. Viewport-fixed on purpose: an absolute one would end at 100dvh and
// leave a hard seam across any page that scrolls.
const shadeStyle = {
  position: 'fixed',
  left: 0,
  top: 0,
  width: '100%',
  height: '100dvh',
  zIndex: 45,
  pointerEvents: 'none',
  // Stops sample alpha = t^2.2, NOT a straight line. Linear alpha reads as
  // "murky immediately": a quarter down the screen is already 25% black, and the
  // eye is most sensitive exactly there. The curve keeps the top third near
  // clear, then accelerates to solid black at the floor. Many stops, but they
  // trace one smooth curve — that's what stops it banding.
  // Anything anchored to the bottom edge must sit above z 45.
  background:
    'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.015) 15%, rgba(0,0,0,0.07) 30%, rgba(0,0,0,0.17) 45%, rgba(0,0,0,0.33) 60%, rgba(0,0,0,0.53) 75%, rgba(0,0,0,0.70) 85%, rgba(0,0,0,0.85) 93%, rgba(0,0,0,1) 100%)',
};

// shade={false} for reading surfaces (CaseReader) where dimming the bottom of
// the text is worse than the atmosphere is good.
export default function LampScene({ shade = true }) {
  return (
    <>
      {/* shade={false} marks a reading surface, so it opts out of BOTH halves of
          the lamp: no dimming, and the column drops back to z 0 rather than
          screen-blending 0.5 alpha white over a page of body text. */}
      <div aria-hidden style={shade ? wrapStyle : { ...wrapStyle, zIndex: 0 }}>
        <div style={beamStyle} />
      </div>
      {shade && <div aria-hidden style={shadeStyle} />}
    </>
  );
}
