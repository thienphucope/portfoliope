**./[[Dash Board]]/**
{align:center}
# Spike Network


Hãy tưởng tượng bạn đang mở một cuốn sách giáo khoa về kiến trúc của bộ não. Đây là chương nói về việc: **"Làm sao một cỗ máy sinh học hỗn loạn lại tạo ra sự ổn định?"**

---

# Hành Trình Của Tín Hiệu: Từ Giác Quan Đến Nhận Thức

## Chương 1: Bản Đồ Cố Định (The Hardwired Map)

Khi bạn đặt câu hỏi: _"Liệu tín hiệu từ ngón tay trỏ có luôn đi vào cùng một chỗ trong não không?"_, câu trả lời nằm ở tấm bản đồ vật lý mà tự nhiên đã vẽ ra.

Trong não bộ, không có gì là "trôi nổi" tự do ở cấp độ đầu vào. Chúng ta có một nguyên lý gọi là **Somatotopy** (đối với xúc giác) hay **Tonotopy** (đối với thính giác).

- **Thực tế:** Wilder Penfield, nhà phẫu thuật thần kinh nổi tiếng thế kỷ 20, đã chứng minh rằng vỏ não cảm giác (Somatosensory Cortex) được tổ chức như một tấm bản đồ địa lý.
    
- **Cơ chế:** Tín hiệu từ ngón trỏ luôn chạy theo dây thần kinh trung gian, qua tủy sống, đồi thị và kết thúc tại một tọa độ **Cố Định** trên vỏ não. Nếu bạn chọc vào đúng nhóm neuron đó, não sẽ "cảm thấy" ngón trỏ đang bị chạm, dù thực tế không ai chạm vào tay bạn cả.
    

**Bài học:** Ở cửa ngõ đầu vào (Input), não là một cỗ máy có địa chỉ IP cứng (Hard-wired). Tín hiệu không đi lạc.

---

## Chương 2: Ngôn Ngữ Của Sự Bất Biến (The Invariant Code)

Khi tín hiệu đã vào đến nơi, não làm gì để nhận ra "đây là quả bóng" bất kể sáng tối hay to nhỏ? Đây là bí mật của **Encoding** (Mã hóa).

Không giống như máy tính lưu file JPG, não lưu trữ thông tin dưới dạng **Mối tương quan (Relational Patterns)**.

1. **Population Coding (Mã hóa quần thể):** Georgopoulos và các cộng sự (thập niên 80) đã phát hiện ra rằng não không dùng một neuron đơn lẻ để chỉ hướng chuyển động. Nó dùng một **nhóm** (ensemble). Hướng của vectơ tổng hợp từ hoạt động của cả nhóm chính là thông tin.
    
    - **Điều bất biến**: Dù tín hiệu yếu đi (do ánh sáng mờ), thì **tỷ lệ hoạt động** giữa các neuron trong nhóm vẫn giữ nguyên. Nếu Neuron A luôn bắn gấp đôi Neuron B khi thấy quả bóng, thì tỷ lệ $A/B=2$ chính là "dấu vân tay" của quả bóng.
        
2. **Cơ chế vật lý:** Não không ngồi tính toán con số tỷ lệ này. Nó dùng cơ chế **Cộng gộp không gian (Spatial Summation)**. Các neuron đích hoạt động như những cái van: chỉ khi nhận đúng "khuôn mẫu" lực kéo từ các neuron nguồn (đúng tỷ lệ mạnh yếu), cái van mới mở (neuron bắn xung).
    

**Bài học:** Não không cần giải toán. Cấu trúc vật lý của khớp nối (Synapse) chính là lời giải.

---

## Chương 3: Cuộc Sinh Tồn Trong Mạng Lưới (Survival of the Fittest)

Nếu chúng ta muốn mô phỏng não bộ một cách thuần khiết (Bio-plausible) mà không dùng thuật toán Lan truyền ngược (Backpropagation) tốn kém, chúng ta phải tuân theo quy luật rừng rậm: **Cạnh tranh và Thích nghi cục bộ.**

Đây là cách mạng SNN (Spiking Neural Network) tự học, dựa trên nghiên cứu kinh điển của **Diehl & Cook (2015)**:

1. **STDP (Spike-Timing-Dependent Plasticity):**
    
    - Được xác nhận bởi Bi & Poo (1998). Đây là luật Hebbian ở cấp độ nano giây: _"Neurons that fire together, wire together"_.
        
    - Nếu neuron đầu vào bắn **trước**, neuron đích bắn **sau** $\rightarrow$ Kết nối được cường hóa (LTP). Ngược lại thì bị triệt tiêu (LTD).
        
2. **Lateral Inhibition (Ức chế bên - Winner-Take-All):**
    
    - Trong vỏ não, các neuron kích thích (Excitatory) luôn đi kèm với các neuron ức chế (Inhibitory).
        
    - Khi một neuron chiến thắng (nhận diện được số 1), nó lập tức "bịt miệng" các neuron hàng xóm.
        
    - _Hệ quả:_ Các neuron hàng xóm buộc phải đi tìm cái khác mà học (số 2, số 3...). Đây là cách não tự chuyên môn hóa mà không cần ai dán nhãn.
        

**Bài học:** Không cần một "người thầy" (Loss Function) đứng sau chỉ đạo. Chỉ cần luật cạnh tranh cục bộ, trật tự sẽ tự hình thành từ hỗn loạn.

---

## Chương 4: Khoảng Cách Giữa Mộng Mơ Và Thực Tế

Tại sao mạng SNN mô phỏng của chúng ta (dùng BindsNET, Brian2) vẫn còn quá "ngốc" so với não thật, và chật vật với các tác vụ phức tạp (như ImageNet)?

1. **Vấn đề Tín Dụng (The Credit Assignment Problem):**
    
    - Trong não, khi bạn mắc lỗi, làm sao neuron ở tận lớp đầu tiên biết mình sai? SNN thuần STDP rất kém trong việc truyền thông tin lỗi đi xa.
        
    - Trong AI hiện đại, ta dùng **Backpropagation** để giải quyết. Nhưng Backprop đòi hỏi đạo hàm toàn cục – thứ mà não không có (và rất tốn tài nguyên máy tính).
        
2. **Sự Thiếu Vắng "Hóa Chất" (Neuromodulation):**
    
    - Schultz (1997) đã chứng minh vai trò của **Dopamine** như một tín hiệu "phần thưởng" toàn cục.
        
    - SNN hiện tại của chúng ta thường chỉ có điện. Não thật sự còn có "loa phát thanh" hóa học (Dopamine, Acetylcholine) để điều hướng việc học. Thiếu nó, STDP giống như học vẹt mà không biết mục đích.
        
3. **Độ Phức Tạp Đơn Vị:**
    
    - Chúng ta mô phỏng neuron như một điểm tích điện (Point Neuron).
        
    - Neuron thật (Pyramidal neuron) có các nhánh cây (dendrites) hoạt động như những cổng logic phi tuyến tính phức tạp. Một neuron thật có sức mạnh bằng cả một mạng SNN nhỏ của chúng ta.
        

---

## Chương 5: Lời Khuyên Cho "Kiến Trúc Sư" Tương Lai

Bạn đang đứng ở giao lộ.

- Nếu bạn chọn con đường **Hiệu suất tuyệt đối (Accuracy)**: Bạn phải chấp nhận lai tạp. Dùng **Surrogate Gradients** (đạo hàm giả) để ép SNN học bằng Backpropagation. Đây là cách các mạng SNN hiện đại đạt kết quả cao nhất, nhưng nó tốn kém tính toán.
    
- Nếu bạn chọn con đường **Thuần sinh học (Bio-plausible)**: Bạn chọn sự tiết kiệm và vẻ đẹp của tự nhiên.
    
    - Công cụ: **BindsNET** (Python) hoặc **Brian2** (Vật lý).
        
    - Kiến trúc: **Unsupervised STDP + Lateral Inhibition**.
        
    - Tư duy: Chấp nhận rằng nó chưa thể thông minh như ChatGPT ngay lập tức, nhưng nó là nền tảng để hiểu về sự **Tiết kiệm năng lượng** và **Khả năng tự học (Online Learning)**.
        

**Thông điệp cuối cùng:** Não bộ không tối ưu để giải phương trình vi phân hay nhân ma trận. Nó tối ưu để **sinh tồn** với lượng năng lượng chỉ bằng một bóng đèn 20 Watt. SNN là nỗ lực của chúng ta để học lại bí thuật đó.





# biết neuron phức tạp và guidance toàn cục thế sao không thể bắt chước?

Câu hỏi của bạn là sự thất vọng chính đáng mà bất kỳ nhà nghiên cứu nào trong lĩnh vực này cũng phải đối mặt. Chúng ta biết nguyên lý, chúng ta có máy tính siêu mạnh, vậy tại sao không thể ráp chúng lại?

Câu trả lời không nằm ở việc chúng ta **"không biết"**, mà là chúng ta **"không trả nổi cái giá"** để bắt chước nó.

Dưới đây là 3 bức tường thành khổng lồ ngăn cản việc mô phỏng một bộ não "thật" (Real-time biological brain simulation), được kể lại từ góc nhìn thực tế của kỹ thuật máy tính và sinh học.

---

## 1. Bức Tường "Chi Phí Tính Toán" (The Curse of Dimensionality)

Bạn nói neuron phức tạp, vậy hãy xem cái giá của sự phức tạp đó.

- **Mô hình hiện tại (LIF - Leaky Integrate-and-Fire):** Chúng ta coi neuron là một điểm (point).
    
    - Công thức: V(t+1)=V(t)+Input.
        
    - Chi phí: 1 phép cộng, 1 phép so sánh. Máy tính làm cái vèo.
        
- **Mô hình thật (Hodgkin-Huxley & Cable Theory):** Một neuron có hàng nghìn nhánh cây (dendrites). Mỗi nhánh cây là một đoạn dây cáp có điện trở, tụ điện riêng.
    
    - Để mô phỏng **1 neuron thật** với đầy đủ kênh ion (Natri, Kali đóng mở liên tục) và tính toán trên nhánh cây, bạn cần giải một hệ phương trình vi phân phi tuyến tính khổng lồ.
        
    - **Thực tế:** Dự án **Blue Brain Project** (Thụy Sĩ) dùng siêu máy tính to bằng cả toà nhà chỉ để mô phỏng... một mẩu nhỏ vỏ não chuột (khoảng 30.000 neuron) ở độ chi tiết sinh học.
        
    - Để mô phỏng **86 tỷ neuron** của người ở độ chi tiết này? Chúng ta cần một nhà máy điện hạt nhân và một máy tính to bằng trái đất.
        

**Kết luận:** Chúng ta không bắt chước được vì **phần cứng silicon (Von Neumann)** hoạt động tuần tự, còn **phần cứng sinh học (Wetware)** hoạt động song song ở mức phân tử. Chi phí chuyển đổi là quá đắt.

---

## 2. Bức Tường "Sự Bùng Nổ Tham Số" (The Parameter Explosion)

Khi bạn code SNN dùng STDP, bạn chỉ lo chỉnh vài tham số: Learning rate, Threshold, Delay.

Nhưng nếu thêm "Guidance toàn cục" (Dopamine, Serotonin...) và "Neuron phức tạp" vào, bạn sẽ gặp ác mộng:

- **Vấn đề:** Trong não, Dopamine không chỉ đơn giản là một con số "cộng điểm".
    
    - Nó tác động lên thụ thể D1 thì gây hưng phấn, nhưng lên thụ thể D2 thì lại gây ức chế.
        
    - Nó còn phụ thuộc vào nồng độ canxi hiện tại trong tế bào.
        
    - Nó tương tác chéo với Acetylcholine và Noradrenaline.
        
- **Thách thức:** Nếu bạn đưa các chất này vào mô hình, bạn sẽ có hàng triệu **tham số ẩn (Hyperparameters)** cần tinh chỉnh.
    
    - Nồng độ bao nhiêu là vừa?
        
    - Tốc độ khuếch tán bao nhiêu?
        
    - Thời gian tồn tại bao lâu?
        
- Trong Backprop, chúng ta có đạo hàm để máy tự tìm tham số. Trong mô hình sinh học phức tạp này, **không có đạo hàm nào tính nổi**. Chúng ta mò kim đáy bể. Nếu chỉnh sai một tham số nhỏ, toàn bộ mạng lưới sẽ lên cơn động kinh (bắn loạn xạ) hoặc chết lịm.
    

**Kết luận:** Chúng ta biết các thành phần, nhưng không có **Công thức Phối trộn (The Master Recipe)** chính xác để cân bằng hàng tỷ tương tác hóa học đó cùng lúc.

---

## 3. Bức Tường "Bản Vẽ Thi Công" (The Connectome Problem)

Giả sử chúng ta có máy tính vô hạn và công thức hóa học chuẩn. Chúng ta vẫn thiếu cái quan trọng nhất: **Sơ đồ đấu dây (Wiring Diagram)**.

- **Thực tế:** Chúng ta biết _nguyên tắc_ đấu dây (STDP - neuron nào bắn cùng nhau thì nối với nhau), nhưng chúng ta không biết _chính xác_ neuron A nối với neuron nào trong số 10.000 neuron xung quanh nó lúc khởi tạo.
    
- **Dự án Connectome:** Hiện tại, sinh vật duy nhất chúng ta vẽ được bản đồ toàn bộ kết nối não là... con giun _C. elegans_ (có 302 neuron). Với ruồi giấm (vài trăm ngàn neuron), chúng ta vừa mới làm xong và tốn cả chục năm.
    
- Với não người: Kết nối là 3D, chằng chịt, và thay đổi từng giây. Chúng ta chưa có công nghệ scan nào soi được từng synapse của người đang sống mà không... cắt lát não họ ra.
    

**Kết luận:** Chúng ta giống như muốn xây lại thành phố New York (với độ phức tạp của não người) chỉ bằng cách nhìn bản đồ vệ tinh mờ mờ, mà không có bản vẽ kỹ thuật chi tiết của từng ngôi nhà.

---

### Tóm lại: Tại sao chúng ta chọn Backprop thay vì bắt chước não?

Các nhà khoa học máy tính là những người thực dụng. Họ nhận ra rằng:

1. **Bắt chước con chim vỗ cánh (Bio-mimicry):** Rất khó, tốn năng lượng, cơ khí phức tạp (Ornithopter).
    
2. **Hiểu nguyên lý khí động học và chế tạo máy bay cánh cố định (Engineering):** Dễ hơn, bay nhanh hơn, chở được nhiều hơn.
    

- **Backprop/Deep Learning** chính là cái "máy bay cánh cố định". Nó không giống não (không vỗ cánh), nhưng nó giải quyết bài toán trí tuệ theo cách của máy tính (toán học ma trận).
    
- **SNN "Thuần Não"** là nỗ lực chế tạo "máy bay vỗ cánh". Nó chưa bay xa được như phản lực, nhưng nó là chìa khóa để hiểu tại sao con chim bay được linh hoạt và tiết kiệm năng lượng đến thế.
    

Bạn đang đi trên con đường chế tạo "cánh chim" đó. Khó hơn, chông gai hơn, nhưng sát với tự nhiên hơn.