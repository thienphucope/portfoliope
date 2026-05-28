# Ope Watson — Portfolio & Consulting Room (opewatson.com)

Welcome to the repository for [opewatson.com](https://opewatson.com), the personal portfolio, case archive, and interactive consulting environment of Ope Watson—a "counselling detective" (or an "unmotivated sloth" when hovered!)—and his dedicated librarian sidekick, [MOXXI](file:///E:/portfoliope/src/configs/ai.js).

This application is built with a premium **Noir Detective** aesthetic, featuring custom interactive mechanics, typography, audio playback, 3D graphics, and an advanced AI chatbot integrated with live tools.

---

## 🕵️‍♂️ Key Features & Route Map

The site is structured into several immersive sections:

*   **[Root Timeline](file:///E:/portfoliope/src/app/[[...slug]]/page.js)** (`/`): The timeline of all Ope Watson's detective cases, articles, records, and thoughts. Built with full text searching and custom filtering using the [NoteFeed](file:///E:/portfoliope/src/features/notefeed/NoteFeed.js) component. It embeds the [ChatRoom](file:///E:/portfoliope/src/features/chatroom/ChatRoom.js) sidebar interface directly.
*   **[Case File View](file:///E:/portfoliope/src/app/[[...slug]]/page.js)** (`/[slug]`): Renders specific dynamic markdown/HTML case records retrieved from GitHub using [CaseClient](file:///E:/portfoliope/src/features/casearchives/CaseArchives.js).
    *   Features a in-browser editor with dual modes: **BlockNote** editor mode and raw Markdown/CodeMirror text editor mode.
    *   Includes a backlinks graph (`[GraphView](file:///E:/portfoliope/src/features/casearchives/components/GraphView.js)`) mapping connections between notes.
    *   Provides a PDF viewer (`[PDFViewer](file:///E:/portfoliope/src/features/casearchives/components/PDFViewer.js)`).
    *   Includes **Spritz rapid reading** visual presentation overlay at customizable playback speeds (e.g. 4.0x rate).
    *   Saves and renames case files with automatic backlink scanning and updates.
*   **[The Consulting Room](file:///E:/portfoliope/src/app/chat/page.js)** (`/chat`): An immersive standalone chat interface where users consult with the AI sidekick, **Moxxi**.
    *   Equipped with live tool calling: DuckDuckGo/Wikipedia web search (`[ollama_web_search](file:///E:/portfoliope/src/services/searchtool.js)`), URL content downloader (`[ollama_web_fetch](file:///E:/portfoliope/src/services/searchtool.js)`), local MongoDB Vector Search RAG (`[rag_search](file:///E:/portfoliope/src/services/ragtool.js)`), Anna's Archive book retrieval (`[book_get](file:///E:/portfoliope/src/services/booktool.js)`), math calculator (`[calculator](file:///E:/portfoliope/src/services/calculatortool.js)`), and case archive operations (`[cases_list](file:///E:/portfoliope/src/services/casestool.js)`, `[cases_read](file:///E:/portfoliope/src/services/casestool.js)`, `[cases_search](file:///E:/portfoliope/src/services/casestool.js)`).
    *   AI replies are returned in raw, structured HTML format matching the application's Noir theme.
    *   Supports a voice **Live Call** interface powered by Speech-to-Text (`[useSTT](file:///E:/portfoliope/src/hooks/useSTT.js)`) and Text-to-Speech (`[useTTS](file:///E:/portfoliope/src/hooks/useTTS.js)`) endpoints.
*   **[The Bulletin Board](file:///E:/portfoliope/src/app/noirboard/page.js)** (`/noirboard`): A visual corkboard showing pinned notes, files, clippings, and pins interactively in 3D using Three.js via [ThreeBoard](file:///E:/portfoliope/src/features/noirboard/components/three/ThreeBoard.js). Supports dragging, orbiting, and panning with Minecraft FPS controls or mobile controls.
*   **[The Dossier](file:///E:/portfoliope/src/app/about/page.js)** (`/about`): Watson's classified personal file. Features hover effects scrambling the dossier bio text, revealing ambient footprints, falling snow particles (`[SnowEffect](file:///E:/portfoliope/src/components/sections/SnowEffect.js)`), and an interactive fingerprint scanner (`[FingerprintEffect](file:///E:/portfoliope/src/components/sections/FingerprintEffect.js)`).
*   **[Privacy Policy](file:///E:/portfoliope/src/app/privacy/page.js)** (`/privacy`) & **[Terms of Service](file:///E:/portfoliope/src/app/terms/page.js)** (`/terms`): Basic site legal documents.

---

## 🛠️ Technology Stack

| Category | Technologies Used |
| :--- | :--- |
| **Framework** | **Next.js 15.2.6 (App Router)** & **React 19.0.0** |
| **Styling** | **Tailwind CSS v4.1.17** with PostCSS integration |
| **AI Routing** | Multi-provider routing ([handleAiRequest](file:///E:/portfoliope/src/services/ai.js)) backing Gemini, Ollama, OpenRouter, OpenCode, HuggingFace, xAI, AI Singapore (SEA LION), and Anthropic |
| **AI capabilities** | Function Calling (Tool Loop), SSE Streaming, Retrieval-Augmented Generation (RAG) |
| **Database** | **MongoDB** (used for vector index search and logs) |
| **Graphics & 3D** | **Three.js** (`@react-three/fiber` & `@react-three/drei`), **PixiJS**, **GSAP**, D3-Force (`react-force-graph-2d`) |
| **Speech & Audio** | Chrome Web Speech API, `msedge-tts` (Microsoft Edge TTS), Google Translate TTS, Howler.js (`react-howler`, `use-sound`) |
| **Rich Content** | **BlockNote** (`@blocknote/react`), TipTap (`@tiptap/react`), react-markdown, marked, CodeMirror (`@uiw/react-codemirror`) |
| **Analytics** | Vercel Analytics, Vercel Speed Insights |

---

## 📂 Project Architecture

*   [public/](file:///E:/portfoliope/public): Static assets (images, audio files, textures like `/mapimage.png` and `/blackcat.jpg`).
*   [scripts/](file:///E:/portfoliope/scripts): Administrative database and testing scripts.
    *   [reembed.js](file:///E:/portfoliope/scripts/reembed.js): Computes and updates RAG vector embeddings using `dotenv`.
    *   [reembed.mjs](file:///E:/portfoliope/scripts/reembed.mjs): Computes and updates RAG vector embeddings using Node's native `--env-file` flag.
    *   [test-books.mjs](file:///E:/portfoliope/scripts/test-books.mjs): Tests fiction/non-fiction book queries against Anna's Archive API on RapidAPI.
    *   [test-providers.mjs](file:///E:/portfoliope/scripts/test-providers.mjs): Verifies connectivity and tool-calling capabilities across active AI providers.
    *   [test-rag.mjs](file:///E:/portfoliope/scripts/test-rag.mjs): Tests query embeddings and MongoDB vector search retrieval.
*   [src/](file:///E:/portfoliope/src): Main application source.
    *   [src/app/](file:///E:/portfoliope/src/app): Next.js App Router routes and backend API endpoints.
        *   [src/app/[[...slug]]/](file:///E:/portfoliope/src/app/[[...slug]]): Entry point rendering the timeline feed or Case Archives file viewer.
        *   [src/app/about/](file:///E:/portfoliope/src/app/about): About / Dossier page.
        *   [src/app/chat/](file:///E:/portfoliope/src/app/chat): Standalone consulting room chat page.
        *   [src/app/noirboard/](file:///E:/portfoliope/src/app/noirboard): 3D bulletin board corkboard.
        *   [src/app/privacy/](file:///E:/portfoliope/src/app/privacy) & [src/app/terms/](file:///E:/portfoliope/src/app/terms): Legal pages.
        *   [src/app/api/](file:///E:/portfoliope/src/app/api): Next.js backend API routes.
            *   [src/app/api/ai/](file:///E:/portfoliope/src/app/api/ai): POST endpoint for multi-provider AI model calls and tool executors.
            *   [src/app/api/cases/](file:///E:/portfoliope/src/app/api/cases): GET/POST endpoint managing GitHub CRUD actions, locking, and backlinks renaming batch updates.
            *   [src/app/api/noir/](file:///E:/portfoliope/src/app/api/noir): Endpoints to load/save Corkboard items.
            *   [src/app/api/tts/](file:///E:/portfoliope/src/app/api/tts): Text-to-speech audio stream generation using `msedge-tts` and Google Translate.
    *   [src/components/](file:///E:/portfoliope/src/components): Shared UI structures.
        *   [layout/](file:///E:/portfoliope/src/components/layout): Layout files including `Background.js`, `Header.js`, `Footer.js`, and `MomentumScroll.js`.
        *   [sections/](file:///E:/portfoliope/src/components/sections): Dossier structures including `AboutHero.js`, `FingerprintEffect.js`, and `SnowEffect.js`.
        *   [feedback/](file:///E:/portfoliope/src/components/feedback) *(Empty)*
        *   [forms/](file:///E:/portfoliope/src/components/forms) *(Empty)*
        *   [icons/](file:///E:/portfoliope/src/components/icons) *(Empty)*
        *   [ui/](file:///E:/portfoliope/src/components/ui) *(Empty)*
    *   [src/configs/](file:///E:/portfoliope/src/configs): Configuration and constants files.
        *   [ai.js](file:///E:/portfoliope/src/configs/ai.js): AI prompt templates, Moxxi system prompt, displays, and default settings.
        *   [media.js](file:///E:/portfoliope/src/configs/media.js): Default background video IDs, volumes, and music player settings.
        *   [social.js](file:///E:/portfoliope/src/configs/social.js): Profile links (GitHub, Discord, Gmail).
        *   [vault.js](file:///E:/portfoliope/src/configs/vault.js): GITHUB_REPO defaults and default landing document settings.
    *   [src/constants/](file:///E:/portfoliope/src/constants) *(Empty)*
    *   [src/features/](file:///E:/portfoliope/src/features): Modular pages and feature assets.
        *   [casearchives/](file:///E:/portfoliope/src/features/casearchives): Case viewer components, graph logic, editor hooks, and Spritz speed reader.
        *   [chatroom/](file:///E:/portfoliope/src/features/chatroom): Chat interface files, styles, and Moxxi layouts.
        *   [noirboard/](file:///E:/portfoliope/src/features/noirboard): Three.js corkboard components, items layouts, editor, and camera controls.
        *   [notefeed/](file:///E:/portfoliope/src/features/notefeed): Home page layout and timeline components.
    *   [src/hooks/](file:///E:/portfoliope/src/hooks): Custom application hooks.
        *   [useAI.js](file:///E:/portfoliope/src/hooks/useAI.js): Hook managing live chat streams and active tool executions.
        *   [useMomentumScroll.js](file:///E:/portfoliope/src/hooks/useMomentumScroll.js): Handles inertia scrolling.
        *   [useSpotlight.js](file:///E:/portfoliope/src/hooks/useSpotlight.js): Flashlight-like mouse hover overlay effect.
        *   [useSTT.js](file:///E:/portfoliope/src/hooks/useSTT.js): Web Speech API speech-to-text controller.
        *   [useTTS.js](file:///E:/portfoliope/src/hooks/useTTS.js): Interfaces with the TTS API endpoint to play back speech streams.
    *   [src/lib/](file:///E:/portfoliope/src/lib) *(Empty)*
    *   [src/services/](file:///E:/portfoliope/src/services): Application business logic layer.
        *   [ai.js](file:///E:/portfoliope/src/services/ai.js): Main AI orchestrator ([handleAiRequest](file:///E:/portfoliope/src/services/ai.js)) routing chat queries to active providers.
        *   [aitool.js](file:///E:/portfoliope/src/services/aitool.js): Shared helper utilities for AI tool schema construction.
        *   [booktool.js](file:///E:/portfoliope/src/services/booktool.js): Anna's Archive RapidAPI book lookup tool.
        *   [calculatortool.js](file:///E:/portfoliope/src/services/calculatortool.js): Basic arithmetic calculator tool.
        *   [caseProvider.js](file:///E:/portfoliope/src/services/caseProvider.js): Handles cache hydration ([hydrateServerCache](file:///E:/portfoliope/src/services/caseProvider.js)) and parsed graph structures.
        *   [casestool.js](file:///E:/portfoliope/src/services/casestool.js): Case reading and search tools.
        *   [github.js](file:///E:/portfoliope/src/services/github.js): API connector managing file fetches, saves, and deletes on GitHub.
        *   [ragtool.js](file:///E:/portfoliope/src/services/ragtool.js): Connects to MongoDB to perform vector searches ([ragSearch](file:///E:/portfoliope/src/services/ragtool.js)).
        *   [searchtool.js](file:///E:/portfoliope/src/services/searchtool.js): DuckDuckGo search and HTTP fetch tools.
    *   [src/styles/](file:///E:/portfoliope/src/styles) *(Empty)*
    *   [src/utils/](file:///E:/portfoliope/src/utils) *(Empty)*
*   [test-ollama-models.mjs](file:///E:/portfoliope/test-ollama-models.mjs): Root testing script listing free tier models available on `ollama.com`.
*   [next.config.mjs](file:///E:/portfoliope/next.config.mjs): Next.js configuration containing external server packages list and redirect definitions.
*   [package.json](file:///E:/portfoliope/package.json): Package dependencies, engines, and runnable scripts.
*   [eslint.config.mjs](file:///E:/portfoliope/eslint.config.mjs): Project linting configurations.
*   [postcss.config.mjs](file:///E:/portfoliope/postcss.config.mjs): PostCSS settings.
*   [jsconfig.json](file:///E:/portfoliope/jsconfig.json): Code path alias configurations.
*   [opencode.json](file:///E:/portfoliope/opencode.json): OpenCode AI companion configurations.
*   [AGENTS.md](file:///E:/portfoliope/AGENTS.md): Coding agent operating instructions and guidelines.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following variables to enable all capabilities:

```env
# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# GitHub Storage (For case files management)
GITHUB_REPO=thienphucope/casearchives
GITHUB_TOKEN=your_github_access_token

# Access Configurations
NEXT_PUBLIC_BASE_URL=https://opewatson.com
EDIT_PASS=your_case_editing_password

# Search & Book Retrieval
RAG_API_URL=https://rag-backend-zh2e.onrender.com/rag
RAPIDAPI_KEY=your_rapidapi_key

# AI API Providers Keys & Model Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

OLLAMA_API_KEY=your_ollama_api_key
OLLAMA_MODEL=gpt-oss:120b

OPEN_ROUTER_API_KEY=your_open_router_api_key
OPEN_ROUTER_MODEL=openai/gpt-4o-mini

OPENCODE_API_KEY=your_opencode_api_key
OPENCODE_MODEL=deepseek-v4-flash

HUGGINGFACE_API_KEY=your_huggingface_api_key
HUGGINGFACE_MODEL=meta-llama/Llama-3.1-8B-Instruct

XAI_API_KEY=your_x_ai_api_key
XAI_MODEL=grok-4-1-fast

SEA_LION_API_KEY=your_sea_lion_api_key
SEA_LION_MODEL=aisingapore/Gemma-SEA-LION-v4-27B-IT

ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-sonnet-4-6
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Install all package dependencies via npm:
```bash
npm install
```

### 2. Run the Development Server
Launch the Next.js development server with Turbopack enabled:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 3. Build for Production
To build the application for deployment:
```bash
npm run build
```
Once successfully compiled, run the server:
```bash
npm run start
```

### 4. Code Linting
Run ESLint to check for stylistic errors or logic bugs:
```bash
npm run lint
```

---

## 🧪 Helper & Test Scripts

Administrative utility scripts under `/scripts` and the root folder can be run to manage index RAG database embeddings and test provider integrations:

*   **Re-indexing Embeddings (CommonJS with dotenv)**:
    ```bash
    node scripts/reembed.js
    ```
*   **Re-indexing Embeddings (ES Module using --env-file)**:
    ```bash
    node --env-file=.env scripts/reembed.mjs
    ```
*   **Testing AI LLM Providers & Tool Callers**:
    ```bash
    node --env-file=.env scripts/test-providers.mjs
    ```
    *(Optionally pass a provider name to target a specific API, e.g. `node --env-file=.env scripts/test-providers.mjs gemini`)*
*   **Testing RAG Vector Search Queries**:
    ```bash
    node --env-file=.env scripts/test-rag.mjs
    ```
*   **Testing Anna's Archive Book Search API**:
    ```bash
    node --env-file=.env scripts/test-books.mjs
    ```
*   **Checking Ollama Free Tier Models (Root Directory)**:
    ```bash
    node test-ollama-models.mjs
    ```
