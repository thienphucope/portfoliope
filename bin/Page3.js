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
        <div className="w-[89vw] flex flex-col items-center">
          <h1 className="text-[var(--colorthree)] pt-15 text-8xl font-bold mb-8 w-full text-center font-fredericka">OBSESSIONS</h1>
          
          {/* Add your obsessions content here, e.g., another masonry grid,
               list, or dynamic fetch similar to Page2's images. 
               Example placeholder: */}
          <div className="w-full h-auto min-h-[90vh] columns-4 gap-4">
            {/* Obsessions items go here */}
            <div className="masonry-item bg-[var(--colortwo)] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col">
              {/* Example item */}
              <div className="w-full aspect-square overflow-hidden">
                <img
                  src="/default-obsession.jpg"
                  alt="Obsession 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-3 flex flex-col justify-start">
                <h3 className="text-xl text-[var(--colorone)] font-bold font-fredericka">Obsession Title</h3>
                <p className="text-lg text-[var(--colorone)] font-fredericka">Description here.</p>
              </div>
            </div>
            {/* Repeat for more items */}
          </div>
        </div>
      </section>
    </>
  );
}