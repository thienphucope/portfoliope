"use client";

export default function Page3() {
  // You can add state and effects here for obsessions content,
  // e.g., fetching from GitHub or static data.
  // For now, placeholder structure matching Page2's style.

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap');
      `}</style>
      <style jsx>{`
        #page3 {
          font-family: 'Fredericka the Great', cursive;
        }

        .font-fredericka {
          font-family: 'Fredericka the Great', cursive;
        }

        /* Add any additional styles for obsessions content here,
           e.g., similar to Page2's masonry or custom layouts. */
      `}</style>

      <section id="page3" className="w-full min-h-screen bg-[var(--background)] snap-start font-fredericka box-border relative z-10 flex justify-center items-center p-4">
        <div className="w-[89vw] h-full flex flex-col justify-between items-center pt-16 pb-16">
          <h1 className="text-[var(--colorthree)] text-8xl font-bold w-full text-center font-fredericka z-10">MERRY CHRISTMAS</h1>
          
          {/* Decorations at bottom: Tree in middle with snowman beside */}
          <div className="flex flex-row items-end justify-center gap-0">
            <img 
              src="/snowman.png" 
              alt="Snowman" 
              className="max-w-[40%] max-h-[40%] mb-0" 
            />
            <img 
              src="/christmastree.png" 
              alt="Christmas Tree" 
              className="max-w-[40%] max-h-[40%] mb-0" 
            />
          </div>
        </div>
      </section>
    </>
  );
}