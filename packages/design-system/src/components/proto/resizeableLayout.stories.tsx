import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@design-system/components/ui/button";
import { SidebarResizeHandle, SidebarTrigger, SidePanelResizeHandle } from "./resizeableLayout";

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
type DragState = { mode: DragMode };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function ResizablePortalLayoutStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const leftStackRef = useRef<HTMLDivElement>(null);

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_OPEN_WIDTH);
  const [portal3Width, setPortal3Width] = useState(PORTAL_3_DEFAULT_WIDTH);
  const [isPortal3Collapsed, setIsPortal3Collapsed] = useState(false);
  const [portal2Height, setPortal2Height] = useState(PORTAL_2_DEFAULT_HEIGHT);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const isPortal2Collapsed = portal2Height <= PORTAL_2_COLLAPSE_HEIGHT;
  const isSidebarCollapsed = sidebarWidth <= SIDEBAR_COLLAPSED_WIDTH;

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!dragState) {
        return;
      }

      if (dragState.mode === "sidebar") {
        const layoutRect = layoutRef.current?.getBoundingClientRect();
        if (!layoutRect) {
          return;
        }
        const next = clamp(
          event.clientX - layoutRect.left,
          SIDEBAR_COLLAPSED_WIDTH,
          SIDEBAR_OPEN_WIDTH,
        );
        setSidebarWidth(next);
      }

      if (dragState.mode === "portal3") {
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
        setPortal3Width(
          clamp(raw, PORTAL_3_MIN_VISIBLE_WIDTH, PORTAL_3_MAX_WIDTH),
        );
      }

      if (dragState.mode === "portal2") {
        const leftStackRect = leftStackRef.current?.getBoundingClientRect();
        if (!leftStackRect) {
          return;
        }

        const raw = leftStackRect.bottom - event.clientY;
        const next =
          raw <= PORTAL_2_COLLAPSE_THRESHOLD
            ? PORTAL_2_COLLAPSE_HEIGHT
            : clamp(
                raw,
                PORTAL_2_MIN_VISIBLE_HEIGHT,
                Math.min(PORTAL_2_MAX_HEIGHT, leftStackRect.height - 120),
              );

        setPortal2Height(next);
      }
    };

    const onMouseUp = () => {
      if (!dragState) {
        return;
      }

      if (dragState.mode === "sidebar") {
        const midpoint = (SIDEBAR_COLLAPSED_WIDTH + SIDEBAR_OPEN_WIDTH) / 2;
        setSidebarWidth((current) =>
          current <= midpoint ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_OPEN_WIDTH,
        );
      }

      if (dragState.mode === "portal3") {
        if (!isPortal3Collapsed) {
          setPortal3Width((current) =>
            clamp(current, PORTAL_3_MIN_VISIBLE_WIDTH, PORTAL_3_MAX_WIDTH),
          );
        }
      }

      if (dragState.mode === "portal2") {
        setPortal2Height((current) =>
          current <= PORTAL_2_COLLAPSE_THRESHOLD
            ? PORTAL_2_COLLAPSE_HEIGHT
            : clamp(current, PORTAL_2_MIN_VISIBLE_HEIGHT, PORTAL_2_MAX_HEIGHT),
        );
      }

      setDragState(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragState, isPortal3Collapsed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== "b"
      ) {
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

  const sidebarTransition =
    dragState?.mode === "sidebar" ? { duration: 0 } : PANEL_TRANSITION;
  const portal3Transition =
    dragState?.mode === "portal3" ? { duration: 0 } : PANEL_TRANSITION;
  const portal2Transition =
    dragState?.mode === "portal2" ? { duration: 0 } : PANEL_TRANSITION;

  const portal3RenderWidth = isPortal3Collapsed ? 0 : portal3Width;

  return (
    <div className="min-h-screen min-w-screen">

      <div ref={layoutRef} className="flex h-svh overflow-hidden bg-background">
        <motion.aside
          animate={{ width: sidebarWidth }}
          transition={sidebarTransition}
          className="relative h-full shrink-0 overflow-hidden border-r bg-sidebar"
        >

          <div>Sidebar Content</div>

          <SidebarTrigger
            onClick={() =>
              setSidebarWidth(
                isSidebarCollapsed
                  ? SIDEBAR_OPEN_WIDTH
                  : SIDEBAR_COLLAPSED_WIDTH,
              )
            }
          >
            {isSidebarCollapsed ? ">" : "<"}
          </SidebarTrigger>
        </motion.aside>

        <SidebarResizeHandle
          onMouseDown={() => setDragState({ mode: "sidebar" })}
        />

        <div ref={rootRef} className="relative flex h-full min-w-0 flex-1">
          <div
            ref={leftStackRef}
            className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          >
            <section className="min-h-0 flex-1 rounded-none border-b bg-sky-200 p-6">
              <div>Top content</div>
            </section>

            <motion.section
              id="bottom-portal"
              animate={{ height: portal2Height }}
              transition={portal2Transition}
              className="relative shrink-0 overflow-hidden bg-sky-200"
            >
              {!isPortal2Collapsed ? (
                <div
                  className="h-2 shrink-0 cursor-row-resize bg-border hover:bg-primary/40"
                  onMouseDown={() => setDragState({ mode: "portal2" })}
                />
              ) : null}
              {!isPortal2Collapsed ? <div>Bottom Content</div> : null}
            </motion.section>

            {isPortal2Collapsed ? (
              <div
                id="bottom-resize-handle"
                className="absolute bottom-0 left-0 right-0 z-20 h-2 cursor-row-resize bg-amber-400"
                onMouseDown={() => setDragState({ mode: "portal2" })}
              />
            ) : null}
          </div>


          <SidePanelResizeHandle
            onMouseDown={() => setDragState({ mode: "portal3" })}
          />
          <motion.section
            id="side-panel-portal"
            initial={false}
            animate={{ width: portal3RenderWidth }}
            transition={portal3Transition}
            className={
                isPortal3Collapsed
                ? "min-h-0 shrink-0 overflow-hidden bg-sky-200"
                : "min-h-0 shrink-0 overflow-hidden border-l bg-sky-200"
            }
          >
            <motion.div
              id="side-panel-portal-content"
              animate={{
                opacity: isPortal3Collapsed ? 0 : 1,
                x: isPortal3Collapsed ? 16 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="h-full p-6"
            >
              <div>Side panel content</div>
            </motion.div>
          </motion.section>

          {isPortal3Collapsed ? (
            <button
              id="bottom-collapsible-trigger"
              type="button"
              onClick={() => {
                if (portal3Width < PORTAL_3_MIN_VISIBLE_WIDTH) {
                  setPortal3Width(PORTAL_3_DEFAULT_WIDTH);
                }
                setIsPortal3Collapsed(false);
              }}
              className="absolute right-3 top-3 rounded-md border bg-background px-2 py-1 text-xs shadow-sm hover:bg-muted"
            >
              Open portal 3
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "Proto/Resizable Layout",
  parameters: {
    layout: "fullscreen",
  },
};

// biome-ignore lint/style/noDefaultExport: Storybook CSF requires default export.
export default meta;

export const ThreePortals = {
  render: () => <ResizablePortalLayoutStory />,
};
