// Broad ceiling wash emitted by a fluorescent tube. There is deliberately no
// cone or clip-path: several soft ellipses overlap beneath the ceiling and fade
// across the whole viewport, so the light reads as scattered ambient light
// instead of a spotlight stripe.
const wrapStyle = {
  position: 'absolute',
  left: 0,
  top: 42,
  width: '100vw',
  height: '72dvh',
  zIndex: 44,
  pointerEvents: 'none',
  mixBlendMode: 'screen',
  overflow: 'hidden',
};

const washStyle = {
  width: '100%',
  height: '100%',
  background:
    'radial-gradient(ellipse 68% 58% at 50% 0%, rgba(247,225,181,0.25) 0%, rgba(214,199,165,0.13) 34%, rgba(174,190,181,0.055) 62%, transparent 100%), radial-gradient(ellipse 36% 28% at 50% 0%, rgba(255,247,219,0.2) 0%, rgba(243,208,152,0.07) 58%, transparent 100%)',
  filter: 'blur(22px)',
  transform: 'scaleX(1.04)',
};

// shade={false} keeps the wash behind reading content; the landing uses the
// default foreground light so notes can visibly catch it while scrolling.
export default function LampScene({ shade = true, fixed = false }) {
  const wrap = fixed ? { ...wrapStyle, position: 'fixed' } : wrapStyle;
  return (
    <div aria-hidden style={shade ? wrap : { ...wrap, zIndex: 0 }}>
      <div style={washStyle} />
    </div>
  );
}
