# Quantization Methods

## K-Quant (K-Quants)
- **Type:** Post-Training Quantization (PTQ).
- **Mechanism:** Uses "Importance Matrix" (IMatrix) to identify critical weights. Applies different bit-widths to different layers.
- **Key Feature:** High accuracy at low bits (e.g., 4-bit, 3-bit) by preserving precision in sensitive layers.
- **Use Case:** Standard for GGUF/llama.cpp models.

## IQ (Importance Quantization / I-Matrix)
- **Type:** PTQ with Importance Matrix.
- **Mechanism:** Similar to K-Quant but often refers to the specific implementation of using an I-Matrix to guide quantization.
- **Key Feature:** Reduces "perplexity" degradation compared to standard round-to-nearest (RTN) quantization.
- **Use Case:** High-quality 4-bit and 3-bit model weights.

## QAT (Quantization-Aware Training)
- **Type:** Training-time Quantization.
- **Mechanism:** Simulates quantization errors during the training/fine-tuning process. Weights are updated to be robust against rounding errors.
- **Key Feature:** Highest possible accuracy; model "learns" to work in low precision.
- **Use Case:** Production models where maximum performance is required and compute budget for training is available.

## Comparison Table

| Method | Complexity | Accuracy | Hardware Support | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **K-Quant** | Medium | High | CPU/GPU | Fast deployment, GGUF |
| **IQ** | Medium | High | CPU/GPU | High-quality 4-bit |
| **QAT** | Very High | Highest | Various | Maximum precision |