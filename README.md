# Ope Watson — Portfolio & Consulting Room (opewatson.com)

Welcome to the repository for **[opewatson.com](https://opewatson.com)**, the personal portfolio, case archive, and interactive consulting environment of Ope Watson—a "counselling detective" (or an "unmotivated sloth" when hovered!)—and his dedicated librarian sidekick, **Moxxi**.

This application is built with a premium **Noir Detective** aesthetic, featuring custom interactive mechanics, typography, audio playback, 3D graphics, and an advanced AI chatbot integrated with live tools.

---

## 🕵️‍♂️ Key Features & Route Map

The site is structured into several immersive sections:

*   **`/` (Root - Note Feed & Case Archives)**: The timeline of all Ope Watson's detective cases, articles, records, and thoughts. Built with full text searching and custom filtering.
*   **`/[slug]` (Case File View)**: Renders specific dynamic markdown/HTML case records retrieved from the database or files.
*   **`/chat` (The Consulting Room)**: An interactive chat interface where users can consult with **Moxxi** (the AI sidekick).
    *   Moxxi is equipped with live tool usage (web search, web fetch, local database RAG, book search, case archives search, and calculators).
    *   Responses are streamed and rendered in real-time in structured HTML format (with templates, links, and media embeddings).
    *   TTS (Text-to-Speech) capabilities are supported for audibly listening to Moxxi's observations.
*   **`/noirboard` (The Bulletin Board)**: A drag-and-drop visual corkboard where files, notes, clippings, and pins can be organized interactively.
*   **`/about` (The Dossier)**: Ope Watson's personal history, pronunciation, and skills. Features hover secrets (polaroid effects) and ambient snow/fingerprint visuals.
*   **`/privacy` & `/terms`**: Standard legal privacy policies and terms of service.

---

## 🛠️ Technology Stack

| Category | Technologies Used |
| :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** & **React 19** |
| **Styling** | **Tailwind CSS v4**, Custom Vanilla CSS tokens (Noir palette) |
| **AI Integration** | **Ollama**, **Gemini API**, OpenRouter, HuggingFace, OpenCode (multi-provider routing) |
| **AI Capabilities** | Function Calling (Tool Loop), SSE Streaming, Retrieval-Augmented Generation (RAG) |
| **Database** | **MongoDB** (for logs, cases, and archive indexing) |
| **Graphics & Animation** | **Three.js** (`@react-three/fiber`/`drei`), **PixiJS**, **GSAP**, D3-Force (for graph visualization) |
| **Rich Content** | **BlockNote** (block editor), **TipTap**, marked, react-markdown |
| **Audio** | **Howler.js** (`react-howler`, `use-sound`), YouTube Background Player Integration |
| **Analytics** | Vercel Analytics, Vercel Speed Insights |

---

## 📂 Project Architecture

```
E:/portfoliope
├── public/                 # Static assets (images, audios, favicon)
├── scripts/                # Database/RAG utility scripts
│   ├── reembed.js          # Computes and updates RAG vector embeddings
│   ├── test-rag.mjs        # Tests querying the vector search
│   └── test-providers.mjs  # Tests the active AI model providers
└── src/
    ├── app/                # Next.js App Router (pages & endpoints)
    │   ├── [[...slug]]/    # Case details page and timeline root (NoteFeed)
    │   ├── about/          # About/Dossier page
    │   ├── chat/           # Chat room with Moxxi
    │   ├── noirboard/      # Bulletin Board view
    │   └── api/            # API backend endpoints (RAG, Chat, TTS)
    ├── components/         # Shared UI components (layout, header, footer, special effects)
    ├── configs/            # Configuration files (AI prompt, routes, media settings)
    ├── features/           # Major feature folder modules (chatroom, notefeed, noirboard, casearchives)
    ├── hooks/              # Custom React hooks (audio, spotlight, events)
    ├── lib/                # Database and third-party integrations (MongoDB, client helpers)
    ├── services/           # Business logic layer (AI chat loop, case provider, RAG services)
    └── styles/             # Stylesheets and css utility presets
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following variables to enable all features:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# AI Model Providers
GEMINI_API_KEY=your_gemini_api_key
OLLAMA_API_KEY=your_ollama_api_key
OPEN_ROUTER_API_KEY=your_open_router_api_key
OPENCODE_API_KEY=your_opencode_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
XAI_API_KEY=your_x_ai_api_key

# RAG Endpoint
RAG_API_URL=https://rag-backend-zh2e.onrender.com/rag
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 🧪 Helper Scripts

Utility scripts under `/scripts` can be run to manage data and test external services:

*   **Re-indexing Embeddings**:
    ```bash
    node scripts/reembed.js
    ```
*   **Testing AI LLM Providers**:
    ```bash
    node scripts/test-providers.mjs
    ```
*   **Testing RAG Vector Search**:
    ```bash
    node scripts/test-rag.mjs
    ```
