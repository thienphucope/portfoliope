$env:ANTHROPIC_BASE_URL="http://localhost:11434"
$env:ANTHROPIC_AUTH_TOKEN="ollama"
$env:ANTHROPIC_API_KEY=""
$env:ANTHROPIC_MODEL="gemma4:latest"
claude 


$env:ANTHROPIC_BASE_URL="https://gestate-glamour-comfort.ngrok-free.dev/"
$env:ANTHROPIC_AUTH_TOKEN="ollama"
$env:ANTHROPIC_API_KEY=""
claude --model qwen3.6:35b-a3b


$env:ANTHROPIC_BASE_URL="https://openrouter.ai/api"
$env:ANTHROPIC_AUTH_TOKEN="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"
$env:ANTHROPIC_API_KEY=""
$env:ANTHROPIC_MODEL="google/gemma-4-26b-a4b-it:free"
claude

ĐỪNG THÊM /v1 vào

$env:ANTHROPIC_BASE_URL="http://localhost:11434"
$env:ANTHROPIC_AUTH_TOKEN="ollama"
$env:ANTHROPIC_API_KEY=""
$env:ANTHROPIC_MODEL="gemma4:31b-cloud"
claude


$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $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"
}

$body = @{
    model = "qwen/qwen3.6-27b"
    messages = @(
        @{
            role = "user"
            content = @(
                @{ type = "text"; text = "hi" },
                @{ 
                    type = "image_url"
                    image_url = @{ url = "https://live.staticflickr.com/3851/14825276609_098cac593d_b.jpg" }
                },
                @{
                    type = "video_url"
                    video_url = @{ url = "https://storage.googleapis.com/cloud-samples-data/video/JaneGoodall.mp4" }
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri https://openrouter.ai/api/v1/chat/completions -Method Post -Headers $headers -Body $body