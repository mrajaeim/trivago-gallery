# trivago Gallery

An interactive accommodation photo gallery built with **Next.js App Router**, exploring how **Intercepting Routes** and **Parallel Routes** can create seamless, URL-driven modal experiences without sacrificing traditional page navigation.

This project focuses on building a gallery experience where users can explore hotel details, browse and filter photos, and navigate between views while preserving browser history, deep linking, and direct URL access.

Accommodation details, images, and highlights are retrieved from trivago's publicly accessible web data.

## Key Features

### Next.js Intercepting & Parallel Routes

The main focus of this project is demonstrating how Next.js routing conventions can be used to display the same content in different contexts.

- **Intercepting Routes** — Open accommodation details inside a modal during client-side navigation, instead of navigating to a separate page.
- **Parallel Routes** — Use the `@modal` slot to render modal content alongside the current page.
- **Direct URL Access** — Render accommodation details as standalone pages when visiting their URLs directly or refreshing.
- **URL-Driven Navigation** — Give each accommodation and photo its own shareable URL.
- **Browser History Support** — Preserve navigation behavior using the Next.js App Router.

This approach allows the application to offer an immersive modal experience without sacrificing accessibility, shareability, or standard browser navigation.

### Interactive Image Gallery

The image gallery provides a responsive interface for exploring accommodation photos.

- Responsive image grid with a mosaic layout.
- Photo filtering by category, including rooms, bathrooms, dining, pools, and more.
- Dedicated photo views with Previous and Next navigation.
- Keyboard navigation using arrow keys.
- Shareable URLs for individual photos.
- Photo counts, image metadata, and source attribution.
- Loading skeletons, empty states, and error handling.

The gallery uses URL-based navigation rather than relying entirely on local component state, allowing individual images to remain accessible across refreshes and direct navigation.

### Accommodation Details

Alongside the gallery, the application displays accommodation information retrieved from trivago, including available property details, ratings, amenities, and AI-generated highlights.

These details are used to provide context for the gallery rather than implement a complete hotel-search or booking experience.

## How Intercepting Routes Work

One of the key ideas behind this project is that **the same URL can produce different presentations depending on how the user navigates to it**.

**Client-side navigation**

When a user clicks an accommodation listing from the home page, Next.js intercepts the route and displays the accommodation details in a modal over the current page.

**Direct navigation or refresh**

When the same accommodation URL is opened directly in a browser, Next.js renders the standalone accommodation page.

Both experiences use the same underlying accommodation view, avoiding the need to maintain separate implementations.

### Route Structure

```text
app/
├── layout.tsx
├── page.tsx
│
├── @modal/
│   ├── default.tsx
│   ├── page.tsx
│   └── (.)accommodation/
│       └── [ns]/
│           └── [id]/
│               └── page.tsx
│
└── accommodation/
    └── [ns]/
        └── [id]/
            ├── page.tsx
            ├── layout.tsx
            └── photos/
                ├── layout.tsx
                └── [imageId]/
                    └── page.tsx
```

The important conventions are:

- `@modal` defines a parallel route slot in the root layout.
- `(.)accommodation` intercepts navigation to the accommodation route at the same route-segment level.
- `accommodation/[ns]/[id]` provides the standalone accommodation page.
- `photos/[imageId]` provides a dedicated page for a selected image.

The modal slot also includes fallback routes to support navigation outside the intercepted accommodation view.

### Example Navigation

Starting from:

`/`

Clicking an accommodation listing navigates to:

`/accommodation/100/102762`

During client-side navigation, the accommodation appears in a modal.

Opening that URL directly displays the standalone accommodation page.

Selecting an individual image navigates to:

`/accommodation/100/102762/photos/{imageId}`

This route renders a dedicated photo-viewing experience with navigation controls.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | App Router, Server Components, Intercepting Routes, Parallel Routes |
| React 19 | UI rendering, Suspense, and component composition |
| TypeScript | Static typing and domain models |
| Material UI | Responsive components and styling |
| Apollo Client | GraphQL integration |
| GraphQL | Retrieving accommodation gallery data and highlights |
| Vitest | Unit and component testing |

## Architecture

The application separates data retrieval, data interpretation, and presentation.

**App Router (`app/`)**

Defines standalone pages, dynamic routes, modal interception, and shared layouts.

**UI Components (`components/`)**

Contains the accommodation listing, gallery grid, photo browser, modal, and supporting interface components.

**Data Integration (`lib/trivago/`)**

Handles accommodation data retrieval, persisted GraphQL queries, profile extraction, response validation, and transformation into frontend-friendly models.

### Data Fetching and Rendering

The application primarily retrieves accommodation data in Server Components.

React Suspense boundaries allow different parts of the interface to load independently, while React request memoization and Next.js caching capabilities are used where appropriate.

Interactive elements such as category filters, photo navigation, and modal controls are implemented using Client Components.

The goal is to keep data access on the server while limiting client-side JavaScript to functionality that requires interactivity.

## Getting Started

### Prerequisites

- Node.js compatible with Next.js 16 (Node.js 20.9 or later)
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/mrajaeim/trivago-gallery.git
cd trivago-gallery
```

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Commands

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run start    # Start the production server
npm run lint     # Run ESLint
npm test         # Run Vitest tests
```

## Technical Considerations

### Routing and Navigation

Intercepting Routes make it possible to provide contextual navigation without losing the benefits of URL-based routing.

The application deliberately supports both modal and standalone page presentations for accommodation details, while individual photos have dedicated routes.

### External Data Integration

The project integrates with trivago's publicly accessible web endpoints, including persisted GraphQL operations and structured accommodation data.

These endpoints are not provided as a stable, officially supported public API. Their availability, response formats, and persisted-query identifiers may change.

Requests can therefore fail or return incomplete data. The application includes fallback states and response validation to handle some of these scenarios.

The image query currently retrieves up to 150 photos per request, so accommodations with larger galleries may display a partial collection.

On the photo page, Embla handles swipe, arrow keys, and the previous/next controls. Only the current image and its neighbors are downloaded. The address bar updates with the history API, so a swipe does not request the gallery again. Direct visits and refreshes still use the photo route. Thumbnail links do not prefetch every photo.

### Testing

The project uses Vitest to test important behaviors, including:

- Gallery response interpretation and invalid data handling.
- Accommodation profile extraction.
- Persisted GraphQL request cancellation and timeout handling.
- Photo navigation markup and URL generation.
- Modal toolbar and sharing behavior.
- Gallery layout calculations.

## What This Project Explores

This repository is primarily a practical exploration of modern Next.js routing patterns and their application to real-world interfaces.

The main engineering goals are:

1. Understand how Intercepting Routes and Parallel Routes work together.
2. Create a modal experience without duplicating standalone page implementations.
3. Preserve URL navigation, refresh behavior, and browser history.
4. Build a responsive, interactive image gallery using real accommodation data.
5. Combine React Server Components, Suspense, and client-side interactivity.

## References

- [Next.js — Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes)
- [Next.js — Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes)
- [Next.js — App Router](https://nextjs.org/docs/app)
- [Material UI](https://mui.com/material-ui/)
- [Apollo Client](https://www.apollographql.com/docs/react/)

---

**Disclaimer:** This is an independent educational and technical demonstration. It is not an official trivago application and is not affiliated with or endorsed by trivago.
