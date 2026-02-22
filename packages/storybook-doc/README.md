# storybook-doc

This package provides a [Storybook](https://storybook.js.org/) instance for the design system and UI components in this monorepo.

---

## 📖 What is Storybook?

**Storybook** is an open-source tool for developing, documenting, and visually testing UI components in isolation. It allows you to:

- **Browse and interact with components** without running your full app.
- **Document components** with usage examples, props, and states.
- **Test accessibility, responsiveness, and edge cases** visually.
- **Share a living style guide** with designers and developers.

---

## 📦 What does this package do?

- **Displays the design system**: Renders all components from `@astus/design-system` in an interactive UI explorer.
- **Aggregates stories**: Can scrape and display stories from other projects in the monorepo, making it easy to view all UI components in one place.
- **Supports documentation and testing**: Integrates with Storybook addons for docs, accessibility, and visual testing.

---

## 🛠️ Tech Stack

- **React** for UI components
- **Storybook** for component development and documentation
- **Vite** for fast builds and HMR
- **Tailwind CSS** for styling
- **TypeScript** for type safety

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

### Installation

```bash
pnpm install
```

### Start Storybook

```bash
pnpm storybook
```

### Build Storybook

```bash
pnpm build-storybook
```

---

## 📁 Project Structure

```
packages/
  storybook-doc/         # This package
    .storybook/          # Storybook configuration
    src/                 # Stories and setup
    package.json
```

---

## ➕ Adding Stories

To add a new story, create a file named `*.stories.tsx` in your component or project. Follow the [Storybook guide](https://storybook.js.org/docs/writing-stories) for details.

> **Note:** If you add a new project, you may need to [configure Storybook](./.storybook/main.ts) to detect your new stories.

---

## 🔗 Resources

- [Storybook Documentation](https://storybook.js.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)