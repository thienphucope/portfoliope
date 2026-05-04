import modal
import os
import re
import uuid
from typing import Dict, Any
from fastapi.responses import FileResponse, StreamingResponse

app = modal.App("gpt-sovits-api")

# Volume và Thư mục cấu hình
workspace = modal.Volume.from_name("gptsovits-models")
CODE_DIR = "/root/GPT-SoVITS"
REPO_URL = "https://github.com/thienphucope/GPT-SoVITS.git"

# Build Image
image = (modal.Image.debian_slim(python_version="3.10")
    .apt_install("git", "ffmpeg", "libsox-dev", "build-essential", "cmake")
    .pip_install(
        "numpy<2.0", "scipy", "tensorboard", "librosa==0.10.2", "numba",
        "pytorch-lightning>=2.4", "gradio<5", "ffmpeg-python",
        "onnxruntime-gpu", "tqdm", "funasr==1.0.27", "cn2an", "pypinyin",
        "pyopenjtalk>=0.4.1", "g2p_en", "torchaudio", "torchcodec", "modelscope",
        "sentencepiece", "transformers>=4.43,<=4.50", "peft<0.18.0",
        "chardet", "PyYAML", "psutil", "jieba_fast", "jieba", "split-lang",
        "fast_langdetect>=0.3.1", "wordsegment", "rotary_embedding_torch",
        "ToJyutping", "g2pk2", "ko_pron", "opencc", "fastapi[standard]>=0.115.2",
        "x_transformers", "torchmetrics<=1.5", "pydantic<=2.10.6",
        "ctranslate2>=4.0,<5", "av>=11"
    )
    .run_commands(
        f"git clone {REPO_URL} {CODE_DIR}",
        "python -m nltk.downloader averaged_perceptron_tagger_eng averaged_perceptron_tagger cmudict"
    )
    .env({
        "PYTHONPATH": f"{CODE_DIR}:{CODE_DIR}/GPT_SoVITS",
        "cnhubert_base_path": "/workspace/pretrained_models/chinese-hubert-base",
        "bert_path": "/workspace/pretrained_models/chinese-roberta-wwm-ext-large",
        "sv_path": "/workspace/pretrained_models/sv/pretrained_eres2netv2w24s4ep4.ckpt"
    })
)

@app.cls(
    gpu="L4",
    image=image,
    timeout=600,
    max_containers=1,
    scaledown_window=180,
    volumes={"/workspace": workspace},
    enable_memory_snapshot=True,
    experimental_options={"enable_gpu_snapshot": True}
)
class GPTSoVITSAPI:
    @modal.enter(snap=True)
    def setup(self):
        import sys
        from pathlib import Path

        os.chdir(CODE_DIR)
        sys.path.insert(0, CODE_DIR)

        self.is_interrupted = False
        self.default_sovits = "/workspace/SoVITS_weights_v2Pro/moxxi_e8_s616.pth"
        self.default_gpt = "/workspace/GPT_weights_v2Pro/moxxi-e15.ckpt"
        self.default_ref_audio = "/workspace/ref_audio_moxxi.wav"
        self.default_prompt_text = "You're a doll. Finks in the bathroom. Lucky man."

        print("[OK] Loading pretrained models to GPU...")

        from simple_infer import run_inference

        run_inference(
            sovits_path=self.default_sovits,
            gpt_path=self.default_gpt,
            ref_audio=self.default_ref_audio,
            prompt_text=self.default_prompt_text,
            prompt_lang="en",
            target_text="Test models.",
            target_lang="en",
            output_path="/tmp/test_snapshot.wav",
            speed=1.0
        )
        print("[OK] All models loaded and GPU snapshotted!")

    def split_text_smart(self, text_input: str, min_words: int = 10, max_words: int = 25) -> list:
        text_input = re.sub(r'<iframe[^>]*>.*?</iframe>', '', text_input, flags=re.IGNORECASE | re.DOTALL)
        text_input = re.sub(r'<div[^>]*>.*?</div>', '', text_input, flags=re.IGNORECASE | re.DOTALL)
        text_input = re.sub(r'```.*?```', '', text_input, flags=re.DOTALL)
        text_input = re.sub(r'!\[.*?\]\([^)]+\)', '', text_input)
        text_input = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text_input)
        text_input = re.sub(r'(https?://\S+|www\.\S+)', '', text_input)
        text_input = re.sub(r'`+', '', text_input)
        text_input = re.sub(r'[*#_~]', '', text_input)
        text_input = re.sub(r'[—–-]', ',', text_input)
        text_input = text_input.replace('\r', '')
        text_input = re.sub(r'\n+', '. ', text_input)
        text_input = re.sub(r'\s+', ' ', text_input).strip()

        raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text_input) if s.strip()]
        if not raw_sentences:
            raw_sentences = [text_input]

        refined_chunks = []
        for sentence in raw_sentences:
            if len(sentence.split()) > max_words:
                sub = [s.strip() for s in re.split(r'(?<=,)\s+', sentence) if s.strip()]
                refined_chunks.extend(sub)
            else:
                refined_chunks.append(sentence)

        chunks = []
        buffer = ""
        for i, chunk in enumerate(refined_chunks):
            candidate = (buffer + " " + chunk).strip()
            words_count = len(candidate.split())

            if words_count < min_words and len(refined_chunks) > 1 and i == len(refined_chunks) - 1:
                if chunks:
                    chunks[-1] = chunks[-1] + " " + candidate
                    buffer = ""
                    continue

            if words_count < min_words and i != len(refined_chunks) - 1:
                buffer = candidate
            else:
                chunks.append(candidate)
                buffer = ""

        return chunks if chunks else [text_input.strip()]

    @modal.fastapi_endpoint(method="GET")
    def ping(self) -> Dict[str, Any]:
        return {
            "status": "ok",
            "model_loaded": True,
            "gpu": "L4",
            "info": "GPT-SoVITS v2Pro is ready"
        }

    @modal.method()
    def generate_single_chunk(self, params: dict):
        import sys
        from pathlib import Path

        os.chdir(CODE_DIR)
        sys.path.insert(0, CODE_DIR)

        from simple_infer import run_inference

        target_text = params.get("target_text")
        target_lang = params.get("target_lang", "en")
        prompt_lang = params.get("prompt_lang", "en")
        speed = params.get("speed", 1.0)

        unique_id = str(uuid.uuid4())[:8]
        output_file = f"/tmp/res_{unique_id}.wav"

        success = run_inference(
            sovits_path=self.default_sovits,
            gpt_path=self.default_gpt,
            ref_audio=self.default_ref_audio,
            prompt_text=self.default_prompt_text,
            prompt_lang=prompt_lang,
            target_text=target_text,
            target_lang=target_lang,
            output_path=output_file,
            speed=speed
        )

        if success and os.path.exists(output_file):
            with open(output_file, "rb") as f:
                data = f.read()
            os.remove(output_file)
            return data
        return None

    @modal.fastapi_endpoint(method="POST")
    def tts(self, body: Dict[str, Any]) -> FileResponse:
        """Endpoint chính để nhận text và trả về file âm thanh"""
        target_text = body.get("target_text", "")
        target_lang = body.get("target_lang", "en")
        speed = body.get("speed", 1.0)

        if not target_text:
            return {"error": "Missing 'target_text' in request body"}

        params = {
            "target_text": target_text,
            "target_lang": target_lang,
            "prompt_lang": "en",
            "speed": speed
        }

        audio_data = self.generate_single_chunk.local(params)

        if not audio_data:
            return {"error": "Generation failed"}

        unique_id = str(uuid.uuid4())[:8]
        output_file = f"/tmp/output_{unique_id}.wav"
        with open(output_file, "wb") as f:
            f.write(audio_data)

        return FileResponse(
            path=output_file,
            media_type="audio/wav",
            filename=f"output_{target_lang}.wav"
        )

    @modal.fastapi_endpoint(method="POST")
    def tts_interrupt(self) -> Dict[str, Any]:
        self.is_interrupted = True
        print("[OK] Interrupt signal received!")
        return {"status": "interrupted"}

    @modal.fastapi_endpoint(method="POST")
    def tts_stream(self, body: Dict[str, Any]) -> StreamingResponse:
        """Endpoint streaming trả về các chunk âm thanh liên tục."""
        target_text = body.get("target_text", "")
        target_lang = body.get("target_lang", "en")
        speed = body.get("speed", 1.0)

        if not target_text:
            return {"error": "Missing 'target_text' in request body"}

        def generate_stream():
            self.is_interrupted = False
            chunks = self.split_text_smart(target_text)
            print(f"[OK] Backend CHUNKS Total: {chunks}")

            for chunk in chunks:
                if self.is_interrupted:
                    print("[OK] Interrupted (Sentence level).")
                    break

                if not chunk.strip():
                    continue

                print(f"[OK] GPT-SoVITS generating: '{chunk}'")

                params = {
                    "target_text": chunk,
                    "target_lang": target_lang,
                    "prompt_lang": "en",
                    "speed": speed
                }
                audio_chunk = self.generate_single_chunk.local(params)
                if audio_chunk:
                    import io
                    import numpy as np
                    import scipy.io.wavfile as wavfile
                    sr, data = wavfile.read(io.BytesIO(audio_chunk))
                    if data.dtype != np.int16:
                        data = (data * 32767).astype(np.int16)
                    yield data.tobytes()

        return StreamingResponse(generate_stream(), media_type="audio/pcm")