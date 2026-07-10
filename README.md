# AI Workplace Productivity Assistant

An all-in-one AI-powered dashboard designed for data programmers and students to prepare for a productive workday. It combines smart email drafting, AI task planning, focused research assistance, and a Pomodoro timer — all within a sleek, dark-themed interface.

---

## Project Overview

This application serves as a personal command center that leverages AI to handle repetitive communication and planning tasks, allowing users to focus on deep work. The dashboard provides quick access to four core productivity tools, with state persisted locally in the browser.

---

## Features Implemented

### Smart Email Generator
- Draft professional workplace emails based on recipient context, purpose, and key points.
- Customizable tone: **Formal**, **Friendly**, or **Persuasive**.
- Adjustable length: **Short**, **Medium**, or **Long**.
- One-click copy and regenerate actions.

### AI Task Planner
- Capture leftover tasks from yesterday and new tasks for today.
- AI generates a prioritized, time-blocked daily schedule with reasoning for each slot.
- Full manual reordering via up/down arrows to customize the AI recommendation.
- Track completion with checkboxes; state persists across sessions.

### Research Assistant
- Enter a research topic and scope to receive a structured briefing.
- AI outputs include: **Executive Summary**, **Key Insights**, and **Suggested Next Steps**.
- Helps quickly orient before diving into documentation, papers, or code.

### Pomodoro Timer
- Configurable focus intervals and break durations.
- Web Audio API-generated chimes for session start and countdown alerts (no external audio files needed).
- Visual progress tracking and session counting.

### Shared UI & UX
- **Deep slate / midnight blue** theme (`#16202A`) with electric blue (`#3B82F6`) and teal (`#2DD4BF`) accents.
- Glassmorphism card design with subtle glow effects.
- Responsive sidebar navigation and layout (desktop + mobile-friendly).
- Animated button press interactions (lift and scale feedback).
- AI Disclaimer displayed on all AI-generated output screens.
- All user data stored in `localStorage` — no backend database required.

---

## Technologies and Tools Used

| Category | Tech |
|----------|------|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7 + file-based routing) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) with custom `oklch` color tokens and `@theme` |
| UI Components | [shadcn/ui](https://ui.shadcn.com) (Radix UI primitives + custom variants) |
| State & Data | [TanStack Query](https://tanstack.com/query), `localStorage` |
| Server Functions | `createServerFn` from `@tanstack/react-start` |
| AI Integration | Lovable AI Gateway (`google/gemini-3-flash-preview`) |
| Icons | [Lucide React](https://lucide.dev) |
| Notifications | [Sonner](https://sonner.emilkowal.ski) |
| Validation | [Zod](https://zod.dev) |

---

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org) (v20 or later recommended)
- [Bun](https://bun.sh) or npm

### 1. Clone the repository
```bash
git clone <repo-url>
cd tanstack_start_ts
```

### 2. Install dependencies
```bash
bun install
```

### 3. Configure environment variables
Create a `.env` file in the project root:
```env
LOVABLE_API_KEY=your_lovable_api_key_here
```
> The `LOVABLE_API_KEY` is required for AI features (email generation, task planning, research briefings).

### 4. Run the development server
```bash
bun run dev
```
The app will be available at `http://localhost:8080`.

### 5. Build for production
```bash
bun run build
```

---

## Project Structure

```
src/
  routes/           # TanStack file-based routes
    __root.tsx      # Root layout (shell + sidebar + providers)
    index.tsx       # Dashboard home
    email.tsx       # Smart Email Generator
    planner.tsx     # AI Task Planner
    research.tsx    # Research Assistant
    pomodoro.tsx    # Pomodoro Timer
  components/       # Reusable UI components
    ui/             # shadcn/ui primitives
    AppSidebar.tsx
    PageHeader.tsx
    AiDisclaimer.tsx
  lib/
    ai.functions.ts # Server function for AI text generation
  styles.css        # Tailwind v4 theme + custom utilities
```

---

## Notes

- This is a **frontend-only demo application**. All state is stored in the browser's `localStorage`.
- The AI features rely on the Lovable AI Gateway. Without a valid `LOVABLE_API_KEY`, AI-powered pages will return errors.
- Built with strict TypeScript (`strict: true`) and follows TanStack Start v1 conventions.
