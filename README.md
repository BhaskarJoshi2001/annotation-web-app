# Annotation Tool

A professional image annotation tool built with Next.js 15, TypeScript (strict mode), and modern React patterns.

## Tech Stack

- **Next.js 15.0.0** - App Router with Server Components
- **React 18.3.1** - Stable version compatible with all libraries
- **TypeScript 5.6** - Strict mode enabled
- **TanStack Query v5** - Server state management
- **Zustand v5** - Client state management
- **Konva.js + react-konva** - Canvas rendering
- **Tailwind CSS** - Styling
- **Server Actions** - File operations

## Features (Phase 1)

- ✅ Image upload with drag & drop support
- ✅ Server-side image processing with Server Actions
- ✅ Canvas rendering with Konva.js
- ✅ Zoom controls (zoom in, zoom out, reset)
- ✅ Persistent state with Zustand
- ✅ Full TypeScript strict mode compliance
- ✅ Professional project structure

## Project Structure

```
annotation-web-app/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main annotation page
│   ├── providers.tsx           # TanStack Query provider
│   └── globals.css             # Global styles
├── components/
│   ├── annotation-canvas.tsx   # Konva canvas component
│   ├── controls.tsx            # Zoom controls
│   └── image-uploader.tsx      # Upload component
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── store/
│   │   └── annotation-store.ts # Zustand store
│   └── actions/
│       └── image-actions.ts    # Server actions
└── public/
    └── uploads/                # Image storage
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

### Type Check

```bash
npm run type-check
```

## Usage

1. **Upload an Image**: Drag and drop an image or click to select (JPG, PNG, WEBP up to 10MB)
2. **View Image**: The image will be displayed on the canvas
3. **Zoom Controls**: Use the +/- buttons or Reset to control zoom level

## TypeScript Configuration

The project uses strict TypeScript configuration:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noImplicitReturns: true`

## State Management

### Zustand Store

The application uses Zustand for client-side state management with:

- DevTools integration
- Persistence for annotations and image data
- Strongly typed actions and state

### TanStack Query

Server state is managed with TanStack Query v5 for:

- Caching
- Optimistic updates
- Background refetching

## License

MIT
