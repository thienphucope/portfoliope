import { forwardRef } from 'react';

const Mouth = forwardRef((props, ref) => {
  return (
    <>
      <path ref={ref} className="ope-mouth-path" d="" />
      <style jsx>{`
        .ope-mouth-path {
          fill: none;
          stroke: white;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>
    </>
  );
});

Mouth.displayName = 'Mouth';
export default Mouth;
