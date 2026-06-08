import { forwardRef } from 'react';

const Eyebrows = forwardRef((props, ref) => {
  return (
    <>
      <path ref={ref} className="ope-eyebrows-path" d="" />
      <style jsx>{`
        .ope-eyebrows-path {
          fill: none;
          stroke: white;
          stroke-width: 2.5;
          stroke-linecap: round;
        }
      `}</style>
    </>
  );
});

Eyebrows.displayName = 'Eyebrows';
export default Eyebrows;
