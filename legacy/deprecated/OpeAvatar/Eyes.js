import { forwardRef } from 'react';

const Eyes = forwardRef((props, ref) => {
  return (
    <>
      <path ref={ref} className="ope-eyes-path" d="" />
      <style jsx>{`
        .ope-eyes-path {
          fill: white;
          stroke: none;
        }
      `}</style>
    </>
  );
});

Eyes.displayName = 'Eyes';
export default Eyes;
