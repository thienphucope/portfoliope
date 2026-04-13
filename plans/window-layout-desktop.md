# Implementation Plan: Tiling Window Layout for Desktop

## Objective
Migrate the desktop view from a single active overlay system to a tiling window management system. Each active component (Editor, AI Chat, Graph View, PDF Reader) will render as an independent "window" with its own border, title bar, maximize button, and close button. The layout will automatically distribute available screen space equally among all open windows.

## Key Files & Context
- `src/app/project/casearchives/[[...slug]]/CaseClient.js`: Needs refactoring to manage an array of open windows instead of a single `activeOverlay` string for the desktop view.
- `src/features/project/casearchives/components/FunctionBall.js`: Needs updates to append/toggle windows in the new array state rather than simply setting a single active overlay.
- `src/features/project/casearchives/styles/TabPanelStyles.js`: Needs updates to support a dynamic CSS Grid for tiling the active windows.

## Proposed Solution
1. **State Management:** Introduce a new state `openWindows` (e.g., `['editor', 'chat', 'graph']`) in `CaseClient.js` specifically for the desktop layout (`!isMobile`). The mobile layout can continue using the simpler `activeOverlay` logic.
2. **Window Wrapper Component:** Create a lightweight, reusable `WindowFrame` component within `CaseClient.js` (or as a separate file if it grows complex). This wrapper will render:
    - A top title bar containing the window title, a "maximize" icon, and a "close" icon (`x`).
    - A border to visually distinguish the window from others.
    - The actual component content (Editor, ChatOverlay, GraphView, etc.) passed as children.
3. **Dynamic CSS Grid:** The main container holding these windows will utilize a dynamic CSS Grid (`grid-template-columns: repeat(auto-fit, minmax(0, 1fr))`) to automatically and equally divide horizontal space based on the number of active windows.
4. **Maximization Logic:** Implement a `maximizedWindow` state. If a window is maximized, the grid will temporarily hide all other windows and allocate 100% of the space to the maximized one.

## Implementation Steps
### Step 1: Create the `WindowFrame` Component
- Create a new functional component (likely defined directly inside `CaseClient.js` for now to share state easily, or in `components/WindowFrame.js` if preferred).
- Props: `title`, `windowId`, `onClose`, `isMaximized`, `onToggleMaximize`, `children`.
- Styling: Apply borders, a flex column layout (header on top, content expanding below), and styling for the action buttons using `lucide-react` icons.

### Step 2: Refactor State in `CaseClient.js`
- Introduce `const [openWindows, setOpenWindows] = useState(['editor'])` for the desktop view.
- Introduce `const [maximizedWindow, setMaximizedWindow] = useState(null)`.
- Create helper functions: `toggleWindow(id)`, `closeWindow(id)`.

### Step 3: Render Windows Dynamically
- Refactor the desktop JSX block in `CaseClient.js`. Instead of conditionally rendering single overlays based on `activeOverlay`, map over the `openWindows` array.
- For each `windowId` in the array, render the corresponding component (Editor, Chat, Graph, PDF) wrapped in the new `WindowFrame`.

### Step 4: Update Styling for Tiling
- In `TabPanelStyles.js`, update the `.pc-layout .main-note-area` (or a newly named container like `.windows-container`) to be a flexbox or CSS Grid that supports equal width distribution.
- Ensure the `WindowFrame` components grow and shrink correctly within this grid container.

### Step 5: Update `FunctionBall` Interaction
- Modify the `setActiveOverlay` calls originating from the `FunctionBall` (when `!isMobile`) to use the new `toggleWindow` logic. This ensures clicking "AI Chat" opens it alongside the Editor, rather than replacing it.

## Verification
- **Functionality:** Clicking icons in the `FunctionBall` should open new windows side-by-side. Clicking 'x' should close them. Clicking 'maximize' should make the window full-screen (within the layout area).
- **Responsive:** Verify that the mobile layout remains unchanged and continues to use the accordion/overlay logic seamlessly.
- **Styling:** Ensure the new windows have clear borders, title bars, and correct typography (`Prata`).