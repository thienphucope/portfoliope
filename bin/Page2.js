"use client";
import { useState, useEffect } from 'react';

export default function Page2() {
  const images = [
    { 
      id: 1, 
      image: "/watsoncrop.png", 
      fullImage: "/watsoncrop.png",
      title: "The Fuckboy Allure", 
      description: "Why do girls run back to known Fuckboys?", 
      content: `In this case archive, we delve into the psychological and social dynamics that make 'fuckboys' so irresistibly alluring to many women. Drawing from real-life stories and expert insights, explore the patterns of attraction, the cycle of heartbreak, and strategies for breaking free. This entry combines humor, empathy, and practical advice to help readers recognize and navigate these complex relationships.

The allure of the fuckboy is a multifaceted phenomenon rooted in evolutionary psychology, social conditioning, and modern dating culture. At its core, the fuckboy—often characterized by charm, confidence, and a dash of unpredictability—taps into primal desires for excitement and validation. Women, conditioned by societal narratives of romance that glorify the "bad boy" archetype in films, books, and music, find themselves drawn to these figures despite repeated disappointments. Studies from evolutionary psychologists like David Buss suggest that such traits signal high genetic fitness and resource acquisition potential, even if they're superficial in contemporary contexts.

Consider the dopamine rush: Each intermittent text, ambiguous compliment, or fleeting moment of attention floods the brain with feel-good chemicals, creating an addictive loop akin to gambling. Neuroimaging research from institutions like the University of California indicates that rejection from these sources activates the same brain regions as physical pain, making the pull even stronger. Yet, the cycle persists because hope lingers—perhaps this time, the fuckboy will change, or the connection will deepen.

Real-life anecdotes abound. Take Sarah, a 28-year-old marketing executive who returned to her on-again, off-again partner three times over two years. "He made me feel alive," she confessed, "but it was always the highs that kept me hooked, not the stability." Experts like Dr. Lisa Marie Bobby, a relationship therapist, emphasize that this pattern often stems from unresolved attachment issues, where anxious attachment styles seek reassurance in unreliable sources.

Breaking free requires self-awareness and boundary-setting. Cognitive Behavioral Therapy (CBT) techniques can rewire these responses, while building a support network of friends who call out red flags helps. Apps like "Fuckboy Detector" (a satirical yet useful tool) even gamify the process by analyzing texting patterns for ghosting potential. Ultimately, recognizing the allure as a mirage—not a destiny—empowers women to seek partners who offer consistency over chaos.

This case isn't just about dating disasters; it's a lens into broader human behavior. In professional settings, the fuckboy dynamic mirrors toxic bosses who dangle promotions like breadcrumbs, keeping teams in perpetual limbo. In friendships, it manifests as the unreliable pal who only calls when they need something. By unpacking the fuckboy allure, we gain tools to foster healthier connections across life's arenas.

Further reading: Helen Fisher's "Anatomy of Love" for the science of attraction; Esther Perel's "Mating in Captivity" for sustaining passion without games; and "Attached" by Amir Levine for attachment theory deep dives. Remember, the greatest rebellion against the fuckboy script is choosing yourself—unapologetically, consistently, and with zero mixed signals.

Expanding on the evolutionary angle, consider how mate selection heuristics from our hunter-gatherer past misfire in the swipe-right era. Traits like aloofness once indicated selectivity and value; now, they're red flags amplified by algorithms that reward engagement over authenticity. Social media exacerbates this, turning every like into a micro-validation hit, making genuine reciprocity feel scarce.

From a feminist perspective, the fuckboy trope reinforces patriarchal power imbalances, where emotional labor falls disproportionately on women. bell hooks' "All About Love" critiques how capitalism commodifies intimacy, turning relationships into transactions. Reclaiming agency means redefining desire—not chasing shadows, but building fires that warm without burning.

In therapy sessions worldwide, clients report epiphanies when mapping their "fuckboy timelines," spotting patterns like clockwork. One exercise: Journal three instances of returning, then rewrite the ending with self-compassion. It's transformative, turning pain into power.

For those in the trenches, community is key. Online forums like r/FemaleDatingStrategy offer solidarity, while podcasts such as "Where Should We Begin?" with Esther Perel provide vicarious wisdom. The fuckboy allure fades when illuminated by shared stories—proof that you're not alone, and escape is not only possible but probable.

As we conclude this archive, reflect: What if the thrill you seek is already within? Self-love isn't a consolation prize; it's the ultimate upgrade. Ditch the drama, embrace the depth. Your story deserves a protagonist who stays for the plot twists—and the quiet chapters too.`
    },
    { 
      id: 2, 
      image: "/duck.gif", 
      fullImage: "/duck.gif",
      title: "Apocalyse Survival Guide", 
      description: "This is all you need to survive any kind of apocalyse!", 
      content: "Whether it's zombies, nuclear fallout, or an alien invasion, this comprehensive guide equips you with essential skills for post-apocalyptic living. From foraging and fortification to psychological resilience and community building, learn step-by-step how to thrive in chaos. Backed by survival experts and fictional scenarios, this case study turns doomsday fears into actionable knowledge."
    },
    { 
      id: 3, 
      image: "/watsoncrop.png", 
      fullImage: "/watsoncrop.png",
      title: "Title 3", 
      description: "This is a sample description for item 3.", 
      content: "Detailed content for case 3 goes here. This section expands on the title and description with in-depth analysis, stories, and insights relevant to the theme."
    },
    { 
      id: 4, 
      image: "/watsoncrop.png", 
      fullImage: "/watsoncrop.png",
      title: "Title 4", 
      description: "This is a sample description for item 4.", 
      content: "Detailed content for case 4 goes here. This section expands on the title and description with in-depth analysis, stories, and insights relevant to the theme."
    },
    { 
      id: 5, 
      image: "/watsoncrop.png", 
      fullImage: "/watsoncrop.png",
      title: "Title 5", 
      description: "This is a sample description for item 5.", 
      content: "Detailed content for case 5 goes here. This section expands on the title and description with in-depth analysis, stories, and insights relevant to the theme."
    },
    { 
      id: 6, 
      image: "/watsoncrop.png", 
      fullImage: "/watsoncrop.png",
      title: "Title 6", 
      description: "This is a sample description for item 6.", 
      content: "Detailed content for case 6 goes here. This section expands on the title and description with in-depth analysis, stories, and insights relevant to the theme."
    },
    { 
      id: 7, 
      image: "/watsoncrop.png", 
      fullImage: "/watsoncrop.png",
      title: "Title 7", 
      description: "This is a sample description for item 7.", 
      content: "Detailed content for case 7 goes here. This section expands on the title and description with in-depth analysis, stories, and insights relevant to the theme."
    },
    { 
      id: 8, 
      image: "/watsoncrop.png", 
      fullImage: "/watsoncrop.png",
      title: "Title 8", 
      description: "This is a sample description for item 8.", 
      content: "Detailed content for case 8 goes here. This section expands on the title and description with in-depth analysis, stories, and insights relevant to the theme."
    },
  ];

  const [hoveredImage, setHoveredImage] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedItem]);

  const handleCardClick = (item) => {
    setSelectedItem(item);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedItem(null);
    }
  };

  return (
    <section id="page2" className="w-full min-h-screen bg-[var(--background)] snap-start font-serif box-border relative z-10 flex justify-center items-center p-4">
      <div className="w-[80vw] flex flex-col items-center">
        <h1 className="text-[var(--colorthree)] text-8xl font-bold mb-8 w-full text-center">🙢 CASE ARCHIVES 🙠</h1>
        <div className="w-full h-[90vh] grid grid-cols-2 grid-rows-4 gap-6">
          {images.map((imageItem) => (
            <div
              key={imageItem.id}
              className={`bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-300 hover:brightness-110 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_20px_rgba(236,72,153,0.5),0_0_40px_rgba(234,179,8,0.3)] flex cursor-pointer ${
                hoveredImage === imageItem.id ? 'z-10' : ''
              }`}
              onMouseEnter={() => setHoveredImage(imageItem.id)}
              onMouseLeave={() => setHoveredImage(null)}
              onClick={() => handleCardClick(imageItem)}
            >
              <div className="w-1/3 aspect-square flex-shrink-0 flex items-center justify-center">
                <img
                  src={imageItem.image}
                  alt={`Image ${imageItem.id}`}
                  className="max-w-full max-h-full object-contain rounded-l-2xl"
                />
              </div>
              <div className="flex-1 p-6 flex flex-col justify-top">
                <h3 className="text-3xl text-[var(--colorone)] font-bold mb-2">{imageItem.title}</h3>
                <p className="text-lg text-[var(--colorone)]">{imageItem.description}</p>
              </div>
            </div>
          ))}
        
        </div>
        <h1 className="text-[var(--colorthree)] pt-15 text-8xl font-bold mb-8 w-full text-center">🙢 IN PROGRESS 🙠</h1>
      </div>

      {selectedItem && (
        <div 
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-black/10 backdrop-blur-sm flex justify-center items-start pt-0 z-50 p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-[85vw] w-full max-h-[100vh] overflow-y-auto shadow-2xl no-scrollbar"
          >
            {/* Picture Section */}
            <div className="w-full h-48 overflow-hidden">
              <img
                src={selectedItem.fullImage}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Title Section */}
            <div className="p-6">
              <h2 className="text-6xl text-center text-[var(--colorone)] font-bold mb-2">{selectedItem.title}</h2>
            </div>
            {/* Description Section */}
            <div className="px-6 pb-6">
              <p className="text-xl text-center text-[var(--colorone)] italic">{selectedItem.description}</p>
            </div>
            {/* Main Content Section */}
            <div className="p-15 text-2xl text-justify text-[var(--colorone)] leading-relaxed">
              <p>{selectedItem.content}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}