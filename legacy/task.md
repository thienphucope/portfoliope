# Task List — ai.js

## 1. Thêm search tool
- Tích hợp web search như một custom tool trong `availableTools` (aitool.js)
- Cho phép AI chủ động gọi search khi cần, thay vì dùng built-in grounding

## 2. Thêm Ollama + các API khác
- Thêm provider `callOllama` (local LLM via Ollama REST API)
- Xem xét thêm các provider khác nếu cần (Cohere, Mistral, v.v.)

## 3. Xếp lại thứ tự và fallback
- Review lại thứ tự PROVIDERS để ưu tiên đúng
- Đảm bảo circuit breaker + fallback hoạt động hợp lý giữa các provider

## 4. Thêm sign up + limit


## 5. Dùng streaming tăng tốc

## 6 THêm thinking WORDS