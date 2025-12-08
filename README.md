## Headcount Planner Dashboard

Interactive headcount planning tool for startups and finance teams, built with Next.js, Convex, TanStack Table, and shadcn/ui.

### Features

- **Import team data from LinkedIn**
  - Uses an Apify-powered scraper to pull current employees for a company and populate the table with LinkedIn data.
  - Backed by the [`Apify` LinkedIn company employees actor](https://console.apify.com/actors/Vb6LZkh4EqRlR0Ka9/input), called via the `/api/employees` endpoint to hydrate scenarios with roles, names, and start dates.

- **Scenario-based headcount planning**
  - Create multiple **scenarios** from scratch or from LinkedIn scrapes.
  - Copy employees across scenarios and reuse previous scrapes to quickly compare different hiring plans.
  - Sidebar-driven navigation for scenarios, built with shadcn/ui’s `Sidebar` primitives.

- **Table ↔ Timeline toggle**
  - Switch between a **data table view** and an **interactive timeline view** using a simple toggle.
  - Table view is built on **TanStack Table (`@tanstack/react-table`)** with sorting, filtering, pagination, selection, and inline editing.
  - Timeline view visualizes each employee as a bar across months, ideal for communicating hiring waves and contract durations.

- **Flexible dates & freelance/contract support**
  - Set **end dates** for roles directly from the row “more” (`...`) menu using an `MM/YYYY` input.
  - In timeline view, roles can be **dragged/resized** to adjust start and end dates, making it easy to model freelance or time-bounded contracts.

- **Runway & burn charts**
  - Dynamic charts compute **monthly burn rate** and **cash runway** based on:
    - Starting cash and start month/year.
    - Active employees and their salaries over time.
  - A runway chart highlights when cash runs out and summarizes months of runway, monthly burn, and active headcount.

- **Shareable, read-only links**
  - Generate a **public, read-only share link** for your scenarios using Convex-backed `sharedLinks` with tokenized URLs (`/share/[token]`).
  - Links are easy to drop into dashboards or UTM-tagged campaigns for stakeholders; the shared view surfaces a runway chart plus a compact employee table.

- **UI primitives and layout**
  - Heavy use of **shadcn/ui** primitives (table, buttons, dropdowns, inputs, sidebar, skeletons, etc.) for a modern, accessible UI.
  - Drag-and-drop role templates in the sidebar (via `@dnd-kit`) to quickly seed timelines with common roles and salaries.

### Tech Stack

- **Frontend**: Next.js App Router (TypeScript), React, shadcn/ui, Tailwind CSS.
- **Data & backend**: Convex for scenarios, employees, shared links, and LinkedIn scrape history.
- **Tables**: `@tanstack/react-table` for the main employee grid and scenarios list.
- **Charts**: Recharts-based components for cash runway and burn visualizations.
- **Integrations**: Apify LinkedIn company scraper for importing org data.

### Getting Started

1. **Install dependencies**

```bash
npm install
```

2. **Run Convex dev (in a separate terminal)**

```bash
npx convex dev
```

3. **Run the Next.js app**

```bash
npm run dev
```

4. **Open the app**

- Visit `http://localhost:3000` to use the dashboard.

### High-level Workflow

- **1. Create or select a scenario**
  - Use the sidebar to create a new scenario or select an existing one.

- **2. Populate employees**
  - Paste a LinkedIn company URL to import employees via the Apify scraper.
  - Or manually add employees / copy from another scenario / reuse previous scrapes.

- **3. Configure financials**
  - Set starting cash and start month/year; this powers the runway calculations.

- **4. Explore views**
  - Use the view toggle to switch between **Table** and **Timeline** views.
  - Adjust start/end dates as needed (3-dots menu or dragging in the timeline) to reflect permanent, contract, or freelance roles.

- **5. Share**
  - Generate a public share link and send a tokenized URL to stakeholders; they’ll see a read-only runway chart and employee list.

### Future Improvements

- **Nivo treemap visualizations**
  - Add Nivo-based treemap views (e.g., by team, function, or cost center) to visualize how headcount and spend break down.

- **Google OAuth**
  - Replace or augment the current auth with **Google OAuth** for faster, lower-friction onboarding and team logins.

- **Deeper UTM & analytics support**
  - First-class UTM tagging and analytics around shared links to understand which scenarios are being viewed and by whom.

