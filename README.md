# react-hono-mono-starter

A modern full-stack monorepo starter template built with TypeScript, React, Hono RPC, Vite, TanStack Query, and shadcn/ui. Designed for scalable, type-safe web applications with an excellent developer experience.

---

## ✨ Features

- **Full-Stack Type Safety**: Utilizes Hono RPC to ensure end-to-end type safety between the frontend and backend.
- **Modern Frontend**: Built with React and Vite for fast, efficient development.
- **Data Fetching**: Leverages TanStack Query for powerful and flexible data synchronization.
- **UI Components**: Incorporates shadcn/ui with Tailwind CSS for accessible and customizable UI components.
- **Monorepo Structure**: Organized using a monorepo approach for better code management and scalability.

---

## 🛠️ Tech Stack

- **Frontend**:
  - React
  - Vite
  - TanStack Query
  - shadcn/ui
  - Tailwind CSS

- **Backend**:
  - Hono (with Hono RPC)
  - TypeScript

- **Tooling**:
  - pnpm
  - Biome 
  - Vitest

---

## 📁 Project Structure
 
```bash
react-hono-mono-starter/
├── clients/
│   └── web/           # React frontend
├── packages/
│   └── ui/            # Shared UI components (shadcn/ui)
├── servers/
│   └── api/           # Hono api
├── .biome.js          
├── pnpm-workspace.yaml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
-  Node.js (v18 or higher)
-  pnpm (v8 or higher)

### Installation

 
```bash
# Install dependencies
pnpm install
```

### Development

 
```bash
# Start the backend server
pnpm --filter api dev

# Start the frontend application
pnpm --filter app dev
```

---

## 🧪 Testing

 
```bash
# Run tests (if configured)
pnpm test
```

---

## 📦 Building for Producton

 
```bash
# Build the backend
pnpm --filter api build

# Build the frontend
pnpm --filter web build
```

---

## 🔗 Resources

- [Hono Documentation](https://hono.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)