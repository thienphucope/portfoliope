# Technical Architecture - Project Tech Stack

This project is a high-performance, interactive portfolio built with a focus on modern web standards, modularity, and immersive user interface design.

## 1. Core Framework & Runtime
- **[Next.js 15](https://nextjs.org/):** Utilized as the primary React framework. It provides the foundation for the App Router architecture, enabling advanced features like nested layouts, server components, and streaming.
- **[React 19](https://react.dev/):** The UI library powering the interactive components. We leverage React's latest features like `useTransition` for smooth UI updates and `Suspense` for data fetching.
- **Node.js Runtime:** All backend logic and API routes are executed within a modern Node.js environment, ensuring fast and reliable server-side processing.

## 2. Frontend & Styling
- **Vanilla CSS:** Used for complex, performance-critical layout logic, such as the custom horizontal accordion system and synchronized animations.
- **[Tailwind CSS](https://tailwindcss.com/):** Integrated for rapid UI prototyping and maintaining a consistent design system across various screen sizes.
- **[Lucide React](https://lucide.dev/):** A beautiful and consistent icon library used for all navigational elements and interactive triggers.
- **Responsive Design:** A mobile-first approach using CSS Grid, Flexbox, and media queries ensures the "Vault" experience is seamless across desktops, tablets, and smartphones.

## 3. Specialized Components
- **Custom Markdown Engine:** A bespoke implementation utilizing `react-markdown` and `remark-gfm`. It supports GitHub-flavored markdown, internal wiki-links, and custom block rendering.
- **AI Chat Vault:** Built using streaming API protocols to provide real-time, token-by-token responses, creating a fluid conversational experience.
- **Interactive Block Editor:** A highly custom editor that allows for non-destructive, block-based editing of investigative notes, complete with local persistence logic.

## 4. Backend & Data Management
- **Next.js API Routes:** Serverless functions that handle filesystem operations, file tree generation, and secure file editing logic.
- **Filesystem Persistence:** Case data and notes are stored directly within the repository structure, allowing for version-controlled investigations and easy deployment.
- **Local Storage / Session Storage:** Utilized for client-side caching of drafts, password management, and persisting user preferences throughout a session.

## 5. Performance & SEO
- **Turbopack:** Employed during development for extremely fast hot-module replacement (HMR) and build times.
- **Hybrid Rendering (SSR + CSR):** SEO-sensitive content is rendered on the server for maximum crawler visibility (important for AdSense approval), while heavy interactive elements are hydrated on the client.
- **Dynamic Imports:** Used to split the code bundle, ensuring that heavy components like the YouTube player or the Block Editor only load when needed.

---
*The stack is designed for stability, scalability, and an uncompromising focus on the end-user experience.*
