"use client";

export default function Page3() {
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
      `}</style>

      {/* Section setup: relative để các con bên trong dùng absolute */}
      <section id="page3" className="w-full h-screen bg-[var(--background)] snap-start font-fredericka box-border relative overflow-hidden z-10">
        
        {/* 1. TEXT: Cố định chính giữa màn hình */}
        <h1 className="absolute rotate-85 bottom-[19 %] left-[65%] -translate-x-1/2 -translate-y-1/2 text-[var(--colorone)] text-xl font-bold z-20 whitespace-nowrap">
          sauce: erb
        </h1>
          
        {/* 2. DECORATIONS: Các hình ảnh */}
        
        {/* Cây thông: Nằm giữa (left-1/2) và đè lên lớp tuyết một chút */}
        <img 
          src="/christmastree.png" 
          alt="Christmas Tree" 
          className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-auto h-[90vh] object-contain z-10" 
        />

        {/* Người tuyết: Lệch sang phải (left-[70%]) */}
        <img 
          src="/snowman.png" 
          alt="Snowman" 
          className="absolute bottom-[2%] left-[60%] -translate-x-1/2 w-auto h-[50vh] object-contain z-10" 
        />

                {/* tất */}
        <img 
          src="/sock.png" 
          alt="Sock" 
          className="absolute bottom-[25%] left-[43%] -translate-x-1/2 w-auto h-[20vh] object-contain z-10" 
        />

        {/* 3. LỚP TUYẾT: Nằm dưới cùng */}
        {/* Dùng rounded-t-[100%] để tạo độ cong như đồi tuyết */}
        <div className="absolute bottom-0 left-0 w-full h-[10vh] bg-white rounded-t-[100%] z-0"></div>
        
        {/* (Tùy chọn) Lớp tuyết phụ để che phần chân màn hình nếu màn hình quá rộng */}
        <div className="absolute bottom-0 left-0 w-full h-[5vh] bg-white z-0"></div>

      </section>
    </>
  );
}