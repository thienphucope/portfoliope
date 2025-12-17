**./[[Dash Board]]/**
{align:center}
# The Spike Network: Chaos to Order

:::row
:::col
Hãy tưởng tượng bạn mở một cuốn sách giáo khoa về não bộ ra. Không phải mấy cuốn self-help "đánh thức tiềm năng" đâu nhé, mà là "hardcore neuroscience". Và đây là cái chương thú vị nhất: **Làm sao một đống thịt bầy nhầy, đầy rẫy sự hỗn loạn điện hóa này lại tạo ra được sự ổn định?**

Làm sao từ một mớ tín hiệu đùng đoàng trong đầu, tôi biết được đâu là cái Pizza và đâu là cái dép?

Chào mừng đến với hành trình của tín hiệu, nơi mà sự hỗn loạn được thuần hóa.
:::
:::col
Imagine cracking open a textbook on brain architecture. Not the "unlock your potential" self-help fluff, but hardcore neuroscience. And you land on the most fascinating chapter: **How does a squishy biological mess, full of chaotic electrochemical storms, actually create stability?**

How does a jumble of firing signals in my head let me distinguish a Pizza from a sandal?

Welcome to the journey of the signal, where chaos gets tamed.
:::
:::

{space:30px}

{bg:blue}
{color:white}
## 1. The Hardwired Map (Bản đồ "Cứng")

:::row
:::col
Bạn có bao giờ thắc mắc: *"Tại sao khi ai đó chạm vào ngón trỏ, não tôi không nhầm sang ngón chân cái?"*

Câu trả lời là: **Vì dây nó đi như thế.** Nghiêm túc đấy, không có phép màu nào ở cửa ngõ đầu vào cả. Trong não, chúng ta có một thứ gọi là **Somatotopy** (bản đồ cơ thể).

Ông Wilder Penfield, một "pháp sư" phẫu thuật thần kinh, đã chứng minh rằng vỏ não cảm giác của chúng ta được quy hoạch như một tấm bản đồ địa chính. Tín hiệu từ ngón trỏ có một đường dây riêng, chạy qua tủy sống, qua đồi thị và cắm thẳng vào một tọa độ **Cố Định** trên vỏ não.

Nó giống như địa chỉ IP tĩnh vậy. Chọc đúng chỗ đó trên não, bạn sẽ thấy đau ngón tay dù tay bạn đang đút túi quần.

**Bài học:** Ở đầu vào, não là một cỗ máy chạy dây cứng (Hard-wired). Tín hiệu không đi phượt, nó đi theo tuyến cố định.
:::
:::col
Ever wonder: *"Why, when someone touches my index finger, does my brain not mistake it for my big toe?"*

The answer is: **Because that's how the wires run.** Seriously, there's no magic at the input gate. In the brain, we have something called **Somatotopy** (a body map).

Wilder Penfield, a neurosurgery "wizard", proved that our somatosensory cortex is zoned like a real estate map. The signal from your index finger has a dedicated line, running through the spinal cord, through the thalamus, and plugging straight into a **Fixed** coordinate on the cortex.

It's like a static IP address. Poke that exact spot on the brain, and you'll feel pain in your finger even if your hand is in your pocket.

**Lesson:** At the input, the brain is a hard-wired machine. Signals don't go backpacking; they follow a fixed route.
:::
:::

{space:30px}

{bg:green}
{color:black}
## 2. The Invariant Code (Mã "Bất Biến")

:::row
:::col
Rồi, tín hiệu đã vào bến. Nhưng làm sao não biết "đây là quả bóng" dù trời tối hay sáng, dù bóng to hay nhỏ? Máy tính lưu ảnh JPG, còn não thì lưu **Mối tương quan (Relationships)**.

Đây là cái hay ho: **Population Coding (Mã hóa quần thể)**.
Não không dùng 1 neuron để hét lên "QUẢ BÓNG!". Nó dùng một **băng đảng** (ensemble).

Hãy tưởng tượng Neuron A và Neuron B.
- Thấy bóng: A bắn 10 phát, B bắn 5 phát. Tỷ lệ A/B = 2.
- Thấy bóng trong bóng tối: Tín hiệu yếu đi. A bắn 4 phát, B bắn 2 phát. Tỷ lệ A/B vẫn = 2.

Cái tỷ lệ đó, cái "vectơ hướng" đó chính là chân lý. Não dùng cơ chế vật lý gọi là **Spatial Summation** để check cái tỷ lệ này. Khớp lệnh là nổ súng.

**Bài học:** Não không ngồi giải toán đâu. Cấu trúc vật lý của nó (synapse) chính là lời giải rồi.
:::
:::col
Okay, the signal has docked. But how does the brain know "this is a ball" whether it's dark or bright, big or small? Computers save JPGs; the brain saves **Relationships**.

Here's the cool part: **Population Coding**.
The brain doesn't use 1 neuron to scream "BALL!". It uses a **gang** (ensemble).

Imagine Neuron A and Neuron B.
- See ball: A fires 10 times, B fires 5 times. Ratio A/B = 2.
- See ball in the dark: Signal is weaker. A fires 4 times, B fires 2 times. Ratio A/B is still 2.

That ratio, that "vector direction," is the truth. The brain uses a physical mechanism called **Spatial Summation** to check this ratio. If it matches, it fires.

**Lesson:** The brain doesn't sit there doing math. Its physical structure (synapses) IS the solution.
:::
:::

{space:30px}

{bg:red}
{color:white}
## 3. Survival of the Fittest (Luật Rừng)

:::row
:::col
Muốn làm AI giống não (Bio-plausible) mà không dùng Backpropagation (cái thứ "hack game" của Deep Learning)? Chào mừng đến với **Đấu trường sinh tử**.

Mạng SNN (Spiking Neural Network) tự học dựa trên 2 luật đơn giản của rừng xanh:

1.  **STDP (Thấy sang bắt quàng làm họ):** *Neurons that fire together, wire together*. Thằng A bắn trước, thằng B bắn sau -> Kết nối mạnh lên. Ngược lại thì cắt. Đây là luật Hebbian phiên bản nano giây.
2.  **Winner-Take-All (Được ăn cả, ngã về không):** Đây là cơ chế ức chế bên (Lateral Inhibition). Khi một neuron nhận ra số "1", nó lập tức đạp các neuron hàng xóm xuống bùn (ức chế).
    * *Hệ quả:* Mấy thằng hàng xóm bị cấm nhận diện số "1", buộc phải đi học cái khác (số 2, số 3...).

**Bài học:** Không cần ông thầy giáo (Loss Function) cầm roi đứng sau. Cứ để chúng nó tự cắn xé nhau, trật tự sẽ được thiết lập.
:::
:::col
Want to build a brain-like AI (Bio-plausible) without using Backpropagation (Deep Learning's "cheat code")? Welcome to the **Hunger Games**.

SNNs (Spiking Neural Networks) learn based on 2 simple jungle laws:

1.  **STDP:** *Neurons that fire together, wire together*. If A fires first, then B fires -> Connection strengthens. Otherwise, cut it. This is Hebbian law on a nanosecond scale.
2.  **Winner-Take-All:** This is Lateral Inhibition. When one neuron recognizes the number "1", it immediately kicks its neighbors into the dirt (inhibits them).
    * *Result:* The neighbors are banned from recognizing "1" and are forced to go learn something else (number 2, 3...).

**Lesson:** No need for a teacher (Loss Function) standing behind with a stick. Just let them fight it out, and order will emerge.
:::
:::

{space:30px}

# "Why can't we just copy it?"

:::row
:::col
Tôi biết bạn đang nghĩ gì. *"Nếu chúng ta biết neuron phức tạp thế nào, biết não dùng Dopamine để hướng dẫn toàn cục, sao không code y hệt vào máy tính cho rồi?"*

Câu hỏi hay. Nhưng cũng đau lòng. Không phải ta **không biết**, mà là ta **không trả nổi tiền bill tiền điện**.

Dưới đây là 3 bức tường thành khiến giấc mơ "Copy-Paste" bộ não sụp đổ.
:::
:::col
I know what you're thinking. *"If we know how complex neurons are, and we know the brain uses Dopamine for global guidance, why not just code exactly that into the computer?"*

Good question. But also painful. It's not that we **don't know**, it's that we **can't afford the electric bill**.

Here are the 3 massive walls that crush the "Copy-Paste" brain dream.
:::
:::

{space:20px}

{bg:gray}
### 1. The Curse of Dimensionality (Cái giá của sự phức tạp)

:::row
:::col
Trong AI, ta coi neuron là một điểm (Point Neuron). `A + B = C`. Xong. Máy tính làm cái vèo.

Neuron thật? Nó có hàng nghìn nhánh (dendrites), mỗi nhánh là một sợi cáp điện có điện trở, tụ điện, kênh ion đóng mở loạn xạ. Để mô phỏng **MỘT** neuron thật ở mức độ này, bạn cần giải một hệ phương trình vi phân kinh khủng.

Dự án **Blue Brain** dùng siêu máy tính to bằng tòa nhà chỉ để mô phỏng một mẩu não chuột. Muốn mô phỏng não người (86 tỷ neuron)? Chắc cần cái máy tính to bằng Trái Đất và nhà máy điện hạt nhân riêng.

Phần cứng máy tính (tuần tự) ghét điều này. Phần cứng sinh học (song song) cười vào mặt chúng ta.
:::
:::col
In AI, we treat a neuron as a point. `A + B = C`. Done. Computer handles it in a blip.

Real neuron? It has thousands of branches (dendrites), each acting as an electrical cable with resistance, capacitance, and ion channels opening/closing chaotically. To simulate **ONE** real neuron at this level, you need to solve a horrific system of differential equations.

The **Blue Brain** project uses a building-sized supercomputer just to simulate a sliver of a rat's brain. Want to simulate a human brain (86 billion neurons)? You'd probably need an Earth-sized computer and a personal nuclear power plant.

Computer hardware (sequential) hates this. Biological hardware (parallel) laughs at us.
:::
:::

{bg:gray}
### 2. The Parameter Explosion (Bùng nổ tham số)

:::row
:::col
Bạn muốn thêm Dopamine vào model? Được thôi. Nhưng Dopamine không đơn giản là `reward = +1`.

Trong não, Dopamine tác động lên thụ thể D1 thì hưng phấn, D2 thì ức chế, phụ thuộc vào canxi, tương tác chéo với Acetylcholine...
Nếu đưa vào code, bạn sẽ đẻ ra hàng triệu **Hyperparameters** (tham số ẩn). Nồng độ bao nhiêu? Tốc độ bay hơi? Thời gian tồn tại?

Trong Backprop, đạo hàm giúp ta tìm tham số. Ở đây? **Không có đạo hàm nào tính nổi**. Chỉnh sai một số 0.001 thôi là cả mạng lưới lăn ra chết hoặc lên cơn động kinh. Chúng ta mò kim đáy bể mà không có nam châm.
:::
:::col
You want to add Dopamine to the model? Sure. But Dopamine isn't just `reward = +1`.

In the brain, Dopamine excites D1 receptors but inhibits D2, depends on calcium levels, interacts with Acetylcholine...
Code that in, and you spawn millions of **Hyperparameters**. Concentration levels? Diffusion rate? Decay time?

In Backprop, gradients help us find parameters. Here? **No gradient can calculate this**. Tweak a number by 0.001 and the whole network either dies or has a seizure. We're looking for a needle in a haystack without a magnet.
:::
:::

{bg:gray}
### 3. The Connectome Problem (Thiếu bản vẽ thi công)

:::row
:::col
Giả sử bạn giàu nứt đố đổ vách, mua được máy tính vô hạn. Bạn vẫn thua. Vì chúng ta thiếu cái quan trọng nhất: **Sơ đồ đi dây (Wiring Diagram)**.

Chúng ta biết *nguyên tắc* đấu dây, nhưng không biết *chính xác* sợi nào nối vào sợi nào. Hiện tại, nhân loại mới chỉ vẽ được bản đồ não của... con giun (302 neuron) và con ruồi giấm.

Với não người? Nó 3D, chằng chịt và thay đổi từng giây. Muốn scan chính xác từng synapse thì hiện tại chỉ có cách... cắt lát não ra mà soi kính hiển vi. Hơi khó để tìm tình nguyện viên cho vụ này.
:::
:::col
Let's say you're filthy rich and buy an infinite computer. You still lose. Because we lack the most important thing: **The Wiring Diagram**.

We know the *principles* of wiring, but we don't know *exactly* which wire connects to which. Currently, humanity has only mapped the brain of... a worm (302 neurons) and a fruit fly.

For the human brain? It's 3D, tangled, and changing every second. To scan every synapse accurately, the only current way is to... slice the brain up and put it under a microscope. Hard to find volunteers for that one.
:::
:::

{space:30px}

{align:center}
***

:::row
:::col
**Tóm lại:**
Chúng ta chọn **Backprop (Deep Learning)** vì nó là cái máy bay cánh cố định: không giống chim, nhưng bay nhanh và chở được nhiều khách.

Còn **SNN thuần não** là nỗ lực chế tạo cái máy bay vỗ cánh (Ornithopter). Khó hơn, hay hỏng hơn, nhưng là chìa khóa để hiểu tại sao con chim bay được lả lướt và tiết kiệm năng lượng đến thế.

Chúc mừng bạn đã chọn con đường khó (Hard mode). Đau khổ đấy, nhưng ngầu.
:::
:::col
**In conclusion:**
We chose **Backprop (Deep Learning)** because it's the fixed-wing airplane: doesn't look like a bird, but flies fast and carries lots of passengers.

**Pure SNN** is the attempt to build an Ornithopter (flapping-wing machine). Harder, breaks more often, but it's the key to understanding why birds fly so gracefully and efficiently.

Congratulations on choosing Hard mode. It's painful, but cool.
:::
:::