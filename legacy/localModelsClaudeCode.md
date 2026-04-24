$env:ANTHROPIC_BASE_URL="http://localhost:11434"
$env:ANTHROPIC_AUTH_TOKEN="ollama"
$env:ANTHROPIC_API_KEY=""
$env:ANTHROPIC_MODEL="qwen3.5"
claude --model qwen3.5


$env:ANTHROPIC_BASE_URL="https://gestate-glamour-comfort.ngrok-free.dev/"
$env:ANTHROPIC_AUTH_TOKEN="ollama"
$env:ANTHROPIC_API_KEY=""
claude --model qwen3.6:35b-a3b


$env:ANTHROPIC_BASE_URL="https://openrouter.ai/api"
$env:ANTHROPIC_AUTH_TOKEN=""
$env:ANTHROPIC_API_KEY=""
$env:ANTHROPIC_MODEL="nvidia/nemotron-3-super-120b-a12b:free"
claude

$env:ANTHROPIC_BASE_URL="http://localhost:11434"
$env:ANTHROPIC_AUTH_TOKEN="ollama"
$env:ANTHROPIC_API_KEY=""
$env:ANTHROPIC_MODEL="gemma4:31b-cloud"
claude