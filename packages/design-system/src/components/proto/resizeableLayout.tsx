import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const SIDEBAR_COLLAPSED_WIDTH = 45;
const SIDEBAR_OPEN_WIDTH = 245;

const PORTAL_3_DEFAULT_WIDTH = 300;
const PORTAL_3_MIN_VISIBLE_WIDTH = 84;
const PORTAL_3_MAX_WIDTH = 5000;
const PORTAL_3_COLLAPSE_THRESHOLD = 26;

const PORTAL_2_DEFAULT_HEIGHT = 230;
const PORTAL_2_MIN_VISIBLE_HEIGHT = 78;
const PORTAL_2_MAX_HEIGHT = 5000;
const PORTAL_2_COLLAPSE_HEIGHT = 0;
const PORTAL_2_COLLAPSE_THRESHOLD = 22;

const PANEL_TRANSITION = {
  type: "spring",
  stiffness: 380,
  damping: 36,
  mass: 0.35,
} as const;

type DragMode = "sidebar" | "portal3" | "portal2";

type ResizableLayoutState = {
  sidebarWidth: number;
  portal2Height: number;
  portal3Width: number;
  isSidebarCollapsed: boolean;
  isPortal2Collapsed: boolean;
  isPortal3Collapsed: boolean;
};

type ResizableLayoutActions = {
  toggleSidebar: () => void;
  togglePortal3: () => void;
  openPortal3: () => void;
  startSidebarDrag: () => void;
  startPortal2Drag: () => void;
  startPortal3Drag: () => void;
};

type ResizableLayoutRefs = {
  layoutRef: React.RefObject<HTMLDivElement | null>;
  rootRef: React.RefObject<HTMLDivElement | null>;
  leftStackRef: React.RefObject<HTMLDivElement | null>;
};

type ResizableLayoutTransitions = {
  sidebarTransition: { duration: 0 } | typeof PANEL_TRANSITION;
  portal2Transition: { duration: 0 } | typeof PANEL_TRANSITION;
  portal3Transition: { duration: 0 } | typeof PANEL_TRANSITION;
};

export type UseResizableLayoutResult = {
  state: ResizableLayoutState;
  actions: ResizableLayoutActions;
  refs: ResizableLayoutRefs;
  transitions: ResizableLayoutTransitions;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useResizableLayout(): UseResizableLayoutResult {
  const layoutRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const leftStackRef = useRef<HTMLDivElement>(null);

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_OPEN_WIDTH);
  const [portal3Width, setPortal3Width] = useState(PORTAL_3_DEFAULT_WIDTH);
  const [portal2Height, setPortal2Height] = useState(PORTAL_2_DEFAULT_HEIGHT);
  const [isPortal3Collapsed, setIsPortal3Collapsed] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);

  const isSidebarCollapsed = sidebarWidth <= SIDEBAR_COLLAPSED_WIDTH;
  const isPortal2Collapsed = portal2Height <= PORTAL_2_COLLAPSE_HEIGHT;

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!dragMode) {
        return;
      }

      if (dragMode === "sidebar") {
        const layoutRect = layoutRef.current?.getBoundingClientRect();
        if (!layoutRect) {
          return;
        }

        const next = clamp(event.clientX - layoutRect.left, SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_OPEN_WIDTH);
        setSidebarWidth(next);
        return;
      }

      if (dragMode === "portal3") {
        const rootRect = rootRef.current?.getBoundingClientRect();
        if (!rootRect) {
          return;
        }

        const raw = rootRect.right - event.clientX;
        if (raw <= PORTAL_3_COLLAPSE_THRESHOLD) {
          setIsPortal3Collapsed(true);
          return;
        }

        setIsPortal3Collapsed(false);
        setPortal3Width(clamp(raw, PORTAL_3_MIN_VISIBLE_WIDTH, PORTAL_3_MAX_WIDTH));
        return;
      }

      const leftStackRect = leftStackRef.current?.getBoundingClientRect();
      if (!leftStackRect) {
        return;
      }

      const raw = leftStackRect.bottom - event.clientY;
      const next =
        raw <= PORTAL_2_COLLAPSE_THRESHOLD
          ? PORTAL_2_COLLAPSE_HEIGHT
          : clamp(raw, PORTAL_2_MIN_VISIBLE_HEIGHT, Math.min(PORTAL_2_MAX_HEIGHT, leftStackRect.height - 120));

      setPortal2Height(next);
    };

    const onMouseUp = () => {
      if (!dragMode) {
        return;
      }

      if (dragMode === "sidebar") {
        const midpoint = (SIDEBAR_COLLAPSED_WIDTH + SIDEBAR_OPEN_WIDTH) / 2;
        setSidebarWidth((current) => (current <= midpoint ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_OPEN_WIDTH));
      }

      if (dragMode === "portal3" && !isPortal3Collapsed) {
        setPortal3Width((current) => clamp(current, PORTAL_3_MIN_VISIBLE_WIDTH, PORTAL_3_MAX_WIDTH));
      }

      if (dragMode === "portal2") {
        setPortal2Height((current) =>
          current <= PORTAL_2_COLLAPSE_THRESHOLD
            ? PORTAL_2_COLLAPSE_HEIGHT
            : clamp(current, PORTAL_2_MIN_VISIBLE_HEIGHT, PORTAL_2_MAX_HEIGHT),
        );
      }

      setDragMode(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragMode, isPortal3Collapsed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "b") {
        return;
      }

      event.preventDefault();

      if (isPortal3Collapsed) {
        if (portal3Width < PORTAL_3_MIN_VISIBLE_WIDTH) {
          setPortal3Width(PORTAL_3_DEFAULT_WIDTH);
        }
        setIsPortal3Collapsed(false);
        return;
      }

      setIsPortal3Collapsed(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPortal3Collapsed, portal3Width]);

  const actions: ResizableLayoutActions = {
    toggleSidebar: () => {
      setSidebarWidth(isSidebarCollapsed ? SIDEBAR_OPEN_WIDTH : SIDEBAR_COLLAPSED_WIDTH);
    },
    togglePortal3: () => {
      if (isPortal3Collapsed) {
        if (portal3Width < PORTAL_3_MIN_VISIBLE_WIDTH) {
          setPortal3Width(PORTAL_3_DEFAULT_WIDTH);
        }
        setIsPortal3Collapsed(false);
        return;
      }

      setIsPortal3Collapsed(true);
    },
    openPortal3: () => {
      if (portal3Width < PORTAL_3_MIN_VISIBLE_WIDTH) {
        setPortal3Width(PORTAL_3_DEFAULT_WIDTH);
      }
      setIsPortal3Collapsed(false);
    },
    startSidebarDrag: () => setDragMode("sidebar"),
    startPortal2Drag: () => setDragMode("portal2"),
    startPortal3Drag: () => setDragMode("portal3"),
  };

  const transitions: ResizableLayoutTransitions = {
    sidebarTransition: dragMode === "sidebar" ? { duration: 0 } : PANEL_TRANSITION,
    portal2Transition: dragMode === "portal2" ? { duration: 0 } : PANEL_TRANSITION,
    portal3Transition: dragMode === "portal3" ? { duration: 0 } : PANEL_TRANSITION,
  };

  return {
    state: {
      sidebarWidth,
      portal2Height,
      portal3Width: isPortal3Collapsed ? 0 : portal3Width,
      isSidebarCollapsed,
      isPortal2Collapsed,
      isPortal3Collapsed,
    },
    actions,
    refs: {
      layoutRef,
      rootRef,
      leftStackRef,
    },
    transitions,
  };
}

export function ResizableLayoutRoot({ children, ...props }: React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div className="min-h-screen min-w-screen" {...props}>
      {children}
    </motion.div>
  );
}

export function ResizableLayoutFrame({ children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="flex h-svh overflow-hidden bg-background" {...props}>
      {children}
    </div>
  );
}

export function SidebarPortal({
  width,
  transition,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.aside>, "animate" | "transition"> & {
  width: number;
  transition: { duration: 0 } | typeof PANEL_TRANSITION;
}) {
  return (
    <motion.aside
      animate={{ width }}
      transition={transition}
      className="relative h-full shrink-0 overflow-hidden border-r bg-sidebar"
      {...props}
    >
      {children}
    </motion.aside>
  );
}

export function SidebarResizeHandle({ ...props }: React.ComponentProps<"div">) {
  return <div className="h-full w-1.5 shrink-0 cursor-col-resize bg-border/90 hover:bg-primary/40" {...props} />;
}

export function SidebarTrigger({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="Toggle sidebar"
      className="absolute -right-3 top-1/2 z-20 h-16 w-6 -translate-y-1/2 rounded-md border bg-background text-[10px] text-muted-foreground shadow-sm hover:bg-muted"
      {...props}
    >
      {children}
    </button>
  );
}

export function MainContentArea({ ...props }: React.ComponentProps<"div">) {
  return <div className="relative flex h-full min-w-0 flex-1" {...props} />;
}

export function LeftPortalStack({ ...props }: React.ComponentProps<"div">) {
  return <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" {...props} />;
}

export function Portal1({ children, ...props }: React.ComponentProps<"section">) {
  return (
    <section className="min-h-0 flex-1 rounded-none border-b bg-sky-200 p-6" {...props}>
      {children}
    </section>
  );
}

export function Portal2({
  height,
  transition,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.section>, "animate" | "transition"> & {
  height: number;
  transition: { duration: 0 } | typeof PANEL_TRANSITION;
}) {
  return (
    <motion.section
      animate={{ height }}
      transition={transition}
      className="relative shrink-0 overflow-hidden bg-sky-200"
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function Portal2ResizeHandle({ ...props }: React.ComponentProps<"div">) {
  return <div className="h-2 shrink-0 cursor-row-resize bg-border hover:bg-primary/40" {...props} />;
}

export function Portal2CollapsedHitArea({ ...props }: React.ComponentProps<"div">) {
  return <div className="absolute bottom-0 left-0 right-0 z-20 h-2 cursor-row-resize" {...props} />;
}

export function Portal3ResizeHandle({
  hidden,
  transition,
  ...props
}: React.ComponentProps<typeof motion.div> & {
  hidden: boolean;
  transition: { duration: 0 } | typeof PANEL_TRANSITION;
}) {
  return (
    <motion.div
      animate={{ width: hidden ? 0 : 8, opacity: hidden ? 0 : 1 }}
      transition={transition}
      className="h-full shrink-0 overflow-hidden"
      {...props}
    >
      <div className="h-full w-2 cursor-col-resize bg-border hover:bg-primary/40" />
    </motion.div>
  );
}

export function Portal3({
  width,
  isCollapsed,
  transition,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.section>, "animate" | "transition"> & {
  width: number;
  isCollapsed: boolean;
  transition: { duration: 0 } | typeof PANEL_TRANSITION;
}) {
  return (
    <motion.section
      initial={false}
      animate={{ width }}
      transition={transition}
      className={
        isCollapsed
          ? "min-h-0 shrink-0 overflow-hidden bg-sky-200"
          : "min-h-0 shrink-0 overflow-hidden border-l bg-sky-200"
      }
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function Portal3Content({
  isCollapsed,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "animate"> & {
  isCollapsed: boolean;
}) {
  return (
    <motion.div
      animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? 16 : 0 }}
      transition={{ duration: 0.2 }}
      className="h-full p-6"
      {...props}
    >
      {children}
    </motion.div>
  );
}
