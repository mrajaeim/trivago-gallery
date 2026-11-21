# trivago Gallery

An interactive accommodation gallery built with **Next.js 16, React 19, and TypeScript**, exploring how **Intercepting Routes and Parallel Routes** can create seamless modal experiences while preserving URL-based navigation, deep linking, and browser history.

The project demonstrates these routing patterns through a real-world accommodation interface featuring hotel details, a responsive photo gallery, and a swipeable image viewer powered by Embla Carousel.

Accommodation information and images are retrieved from trivago's web GraphQL endpoints.

## Project Goals

The primary goal is to explore modern Next.js App Router capabilities through a practical frontend implementation.

Rather than building a complete travel-booking application, the project focuses on:

- **Intercepting Routes** — Presenting accommodation content in a modal during client-side navigation while supporting standalone pages.
- **Parallel Routes** — Rendering modal content alongside the underlying page using a dedicated route slot.
- **URL-Driven UI** — Keeping accommodation and photo views addressable through meaningful URLs.
- **Interactive Galleries** — Combining responsive photo grids, category filters, and touch-friendly image navigation.
- **Performance** — Minimizing unnecessary image downloads, server requests, and client-side work.
- **Modern React Architecture** — Combining Server Components, Suspense, caching, and focused Client Components.

## Features

### Intercepting Routes & Parallel Routes

The application uses Next.js App Router conventions to provide different presentations of the same accommodation content depending on the navigation context.

**Client-side navigation**

Clicking an accommodation listing opens its details inside a modal, preserving the underlying page.

**Direct navigation**

Opening the same accommodation URL in a new tab, or refreshing the page, renders the standalone accommodation view.

**Shared implementation**

Both presentations reuse the same accommodation components, avoiding duplicate pages and business logic.

Additional functionality includes:

- URL-based modal navigation.
- Browser Back/Forward integration.
- Modal close, share, and standalone-view actions.
- Direct links to accommodations and individual photos.
- Loading and error states for asynchronous content.

### Responsive Accommodation Gallery

The gallery provides a responsive photo-browsing experience with:

- A mosaic-style image grid.
- Category filtering based on accommodation areas.
- Photo counts and category labels.
- Individual photo routes and direct links.
- Image attribution where available.
- Responsive layouts for mobile and desktop.
- Loading skeletons and fallback states.

The gallery currently retrieves the first **150 photos** for an accommodation. When the total exceeds the loaded collection, the interface indicates that only part of the gallery is displayed.

### Swipeable Photo Viewer

Individual photos open in a dedicated viewer powered by [Embla Carousel](https://www.embla-carousel.com/).

The viewer supports:

- Touch and drag gestures.
- Previous and Next navigation.
- Keyboard arrow navigation.
- Category-specific photo browsing.
- Photo position indicators and progress feedback.
- Responsive image sizing.
- Reduced-motion preferences.
- Direct links to individual images.

**Optimized image rendering**

Instead of mounting every full-resolution image, the viewer maintains a small image window around the selected photo.

- The selected photo receives high fetch priority.
- Adjacent photos are prepared for smooth navigation.
- Photos farther away use lazy loading or placeholders.
- Responsive CDN URLs and `srcSet` allow browsers to choose suitable image sizes.
- Image dimensions help maintain a stable layout.

The slider mounts image elements for at most five nearby slides while retaining lightweight slide containers for the full loaded collection.

**Navigation without repeated gallery requests**

Swiping between already-loaded photos updates the current URL using the browser History API and `replaceState`.

This keeps the address bar synchronized with the selected photo without triggering another Server Component navigation for each swipe.

Replacing the current photo URL also prevents normal Back navigation from stepping through every image viewed in the slider.

Direct visits and page refreshes continue to work through Next.js's dedicated photo routes.

### Accommodation Information

The accommodation card provides context for the gallery, including available:

- Property name and main image.
- Star classification and guest ratings.
- Address and location information.
- Check-in and check-out times.
- Amenities and property highlights.
- AI-generated accommodation highlights.
- Price information, when available.

Long accommodation descriptions use an expandable **Read more / Read less** component that detects text overflow and responds to container resizing and font loading.

Unavailable prices or missing data are presented through appropriate fallback states rather than assumed values.

## How the Routing Works

A key concept behind the project is that **one URL can support different rendering experiences depending on how it is reached**.

### Route Structure

```text
app/
├── layout.tsx
├── page.tsx
│
├── @modal/
│   ├── default.tsx
│   ├── page.tsx
│   ├── (.)accommodation/
│   │   └── [ns]/
│   │       └── [id]/
│   │           └── page.tsx
│   └── accommodation/
│       └── [ns]/
│           └── [id]/
│               └── photos/
│                   └── [imageId]/
│                       └── page.tsx
│
└── accommodation/
    └── [ns]/
        └── [id]/
            ├── layout.tsx
            ├── page.tsx
            ├── error.tsx
            ├── not-found.tsx
            └── photos/
                ├── layout.tsx
                └── [imageId]/
                    └── page.tsx
```

### Intercepted Accommodation Route

```text
app/@modal/(.)accommodation/[ns]/[id]/page.tsx
```

The `(.)` convention intercepts client-side navigation to the matching accommodation route.

The `@modal` parallel route slot allows the intercepted view to appear alongside the existing page instead of replacing it.

### Standalone Accommodation Route

```text
app/accommodation/[ns]/[id]/page.tsx
```

The standalone route handles direct requests and full-page navigation.

Both routes reuse `AccommodationView`, keeping accommodation rendering consistent across presentations.

### Dedicated Photo Route

```text
app/accommodation/[ns]/[id]/photos/[imageId]/page.tsx
```

Each image has its own URL, allowing visitors to open or share a specific photo directly.

The photo layout loads accommodation gallery data and provides it to the client-side photo viewer.

### Navigation Example

| Action | URL | Experience |
|---|---|---|
| Visit home | `/` | Sample accommodation listing |
| Click accommodation | `/accommodation/100/102762` | Intercepted modal |
| Open accommodation URL directly | `/accommodation/100/102762` | Standalone page |
| Open a photo | `/accommodation/100/102762/photos/{imageId}` | Photo viewer |
| Swipe to another photo | URL changes to selected image | Viewer updates without refetching the gallery |

This pattern combines contextual navigation with shareable, refresh-safe URLs.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | App Router, Intercepting Routes, Parallel Routes, Server Components |
| React 19 | Component architecture, Suspense, client-side interactivity |
| TypeScript | Type safety and domain modeling |
| Material UI 9 | Responsive layouts and UI components |
| Embla Carousel | Touch-enabled photo slider |
| Apollo Client 4 | GraphQL queries and transport integration |
| GraphQL | Accommodation details, highlights, and image metadata |
| Vitest | Unit and component testing |
| GitHub Actions | Automated code verification and deployment |
| Vercel | Production deployment |

## Architecture

The project separates routing, data access, and user-interface responsibilities.

```text
app/                       Next.js routes and layouts
├── @modal/                 Parallel and intercepted routes
└── accommodation/          Standalone accommodation and photo pages

components/                UI and interactive components
├── accommodation-view.tsx Shared accommodation presentation
├── listing-card.tsx       Accommodation details and highlights
├── about-summary.tsx      Expandable description
├── gallery-grid.tsx       Responsive mosaic and filters
├── gallery-section.tsx    Server-rendered gallery section
├── photo-browser.tsx      Photo viewer state and controls
├── photo-slider.tsx       Embla integration and image loading
├── photo-modal.tsx        Modal presentation and toolbar
└── cdn-image.tsx          Image rendering and fallbacks

lib/trivago/               Data integration
├── apollo.ts              Apollo client setup
├── contract.ts            GraphQL request contracts
├── persisted-link.ts      Persisted-query transport
├── profile.ts             Accommodation profile loading
├── highlights.ts          Accommodation highlights
├── gallery.ts             Image and count queries
├── gallery-read.ts        Gallery response interpretation
└── gallery-shared.ts      Shared gallery and URL utilities
```

### Server Components and Suspense

The application primarily retrieves accommodation data in Server Components.

React Suspense boundaries allow the accommodation card, page headings, and image gallery to load independently with dedicated fallbacks.

Client Components are used for functionality requiring browser APIs or interactive state, including:

- Modal controls.
- Category selection.
- Embla Carousel.
- Keyboard and touch navigation.
- Expandable descriptions.
- Browser History API integration.

### Data Integration

The application uses trivago GraphQL endpoints to retrieve property profiles, accommodation highlights, gallery images, and image counts.

The integration includes:

- Centralized GraphQL request configuration.
- Persisted-query identifiers for selected operations.
- Runtime validation and normalization of external responses.
- Accommodation identifier checks.
- Structured error handling and timeouts.
- Request-scoped deduplication.
- Next.js caching for accommodation profiles.

Gallery requests use a rolling future stay window as part of the upstream API's compatibility context. This is not a user-selected booking search.

Because the upstream endpoints are undocumented, the data layer is intentionally kept separate from presentation components.

### Image Performance

The viewer combines several optimizations to avoid unnecessary work:

1. **Limited image mounting:** Only nearby slide images are mounted.
2. **Responsive CDN delivery:** Images can be requested at different widths.
3. **Fetch prioritization:** The selected image receives higher priority.
4. **Lazy loading:** Distant images are not downloaded immediately.
5. **URL synchronization:** Swipe navigation updates the address without a new gallery request.
6. **Controlled prefetching:** Gallery thumbnail links do not automatically prefetch every individual photo route.

These optimizations are especially useful for accommodations containing more than 100 images.

## Getting Started

### Requirements

- **Node.js 24** (recommended to match GitHub Actions)
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

Open [http://localhost:3000](http://localhost:3000).

The home page shows a sample accommodation that can be opened in the intercepted modal or through its standalone URL.

## Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate Next.js route types and run TypeScript checks |
| `npm test` | Execute the Vitest test suite |

The typecheck command runs:

```bash
next typegen && tsc --noEmit
```

Generating Next.js route types before TypeScript validation ensures that global helpers such as `PageProps` and `LayoutProps` are available during clean CI builds.

## Testing and Continuous Integration

The project includes automated tests covering:

- Accommodation profile interpretation.
- GraphQL request contracts.
- Gallery response normalization.
- Photo URL generation and image helpers.
- Persisted-query error handling and cancellation.
- Photo navigation and rendering behavior.
- Modal actions and accessibility attributes.
- Gallery mosaic calculations.
- Accommodation loading and fallback states.

### GitHub Actions

The workflow in `.github/workflows/ci.yml` runs on pull requests and pushes to `main`.

It uses Node.js 24 and performs:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

### Vercel Deployment

On pushes to `main`, the deployment job runs after the verification job succeeds.

The workflow uses the Vercel CLI to pull production configuration, build the application, and deploy the prebuilt output.

The deployment requires the appropriate GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Current Limitations

This is a technical demonstration rather than a production hotel-booking platform.

- **Unofficial API:** The trivago GraphQL endpoints are not a stable, officially supported public API. Their contracts and availability may change.
- **Gallery limit:** The current image query retrieves up to 150 photos. Pagination for larger galleries has not yet been implemented.
- **Sample accommodation:** The home page focuses on a predefined accommodation rather than offering a full hotel-search experience.
- **External data availability:** Some details, highlights, images, or prices may be unavailable because of upstream API behavior.
- **Booking functionality:** The project does not implement hotel booking, payment, or live rate comparison.

## Learning Resources

- [Next.js — Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes)
- [Next.js — Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes)
- [Next.js — App Router](https://nextjs.org/docs/app)
- [Next.js — Cache Components](https://nextjs.org/docs/app/getting-started/cache-components)
- [Embla Carousel](https://www.embla-carousel.com/)
- [Material UI](https://mui.com/material-ui/)
- [Apollo Client](https://www.apollographql.com/docs/react/)

## Disclaimer

This is an independent educational project created to explore Next.js routing patterns, frontend architecture, and image-gallery performance.

It is **not an official trivago application** and is not affiliated with, sponsored by, or endorsed by trivago.

Accommodation information and images remain the property of their respective owners.
