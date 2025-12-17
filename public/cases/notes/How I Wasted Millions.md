**./[[Dash Board]]/**
{align:center}
# How I Wasted Millions

{bg:red}
{color:white}
{align:center}
**WARNING: A memoir of bad financial decisions and GPU abuse.**

You want to know where my money went? Do yourself a favor and don't look at my Google Colab receipts. I stopped counting after 1 million VND because it started to hurt my feelings. But hey, looking back at this journey, it was... well, it was a journey.

{space:20px}

### The "I'm a Genius" Phase
It all started innocently enough. I fired up **XTTS v2**, feeling like a wizard. I grabbed two stream videos, ripped the audio to create a dataset, and hit "train" on Colab. And you know what? It worked.

I got ambitious. I increased the dataset, ran it again, and the resulting model was actually **pretty damn good**. Honestly, if I were smart, I would have stopped right there. I would have saved millions. But no, I wanted *perfection*.

{space:10px}

### Descent into Optimization Hell
The model had some minor word errors. Nothing major, but enough to annoy me. So, I had the brilliant idea to fine-tune the **DVAE** and extend the vocabulary.
**Spoiler alert:** It ruined everything. The errors didn't go away; they multiplied.

Refusing to accept defeat, I doubled down. I threw more data at it but reverted to the old vocab. The voice... stagnated. It was like talking to a brick wall. I entered what I call "Engineering Hell." I tried decreasing chunk length. I spent days cleaning the voice with **Demucs**, then **ClearVoice**. I classified voice segments, ranked quality, and even tried clustering with embedding models.

I tried everything, retried the DVAE, but nothing fixed the hallucinations on short sentences. The voice had the right rhythm, sure, but it lacked the *subtle soul* of the original. It was mimicking, not speaking.

{space:10px}

### The Heavyweight Detour
Frustrated, I rage-quit XTTS and pivoted to **IndexTTS**. Immediate impression: The voice similarity was scary good. But there was a catch—the diffusion model was heavier than my regrets. It was slow. Painfully slow. Unless I wanted to wait 5 business days for a sentence, this wasn't going to work.

{space:10px}

### The Chatterbox Redemption
Finally, I landed on **Chatterbox**. Since I had hoarded so much data from my previous failures, fine-tuning was surprisingly fast.

First, I tried a **Full Fine-tune**. That was a mistake. My measly 50 hours of data got crushed by the 3000 hours of the base model. Instant overfit.

So I switched to **LoRA**. That was the sweet spot. I finally got a model that sounded good. Of course, it's not perfect—speed control is still a nightmare, and it loves to hallucinate on short sentences. I even had to dive into the library code and manually hack it to stop it from triggering the EOS (End of Sentence) token too early.

But hey, 7 Million VND later, it speaks.

{space:30px}

### 🎧 The Results

:::row
:::col
**Synthesized (My Model)**
<audio controls style="width: 100%;">
  <source src="syn.wav" type="audio/mpeg">
</audio>
:::

:::col
**Reference Audio (Emotion Replication)**
<audio controls style="width: 100%;">
  <source src="ref.wav" type="audio/mpeg">
</audio>
:::

:::col
**Real Voice (Ground Truth)**
<audio controls style="width: 100%;">
  <source src="real.wav" type="audio/mpeg">
</audio>
:::
:::