import { cn } from "@design-system/lib/utils";
import { motion } from "motion/react";
import { createContext, useContext } from "react";
import { useResizableLayout, type UseResizableLayoutResult } from "./hooks/useResizableLayout";

const ResizableLayoutContext = createContext<UseResizableLayoutResult | null>(
  null,
);

function useResizableLayoutContext() {
  const context = useContext(ResizableLayoutContext);
  if (!context) {
    throw new Error(
      "ResizableLayout components must be used inside ResizableLayoutRoot.",
    );
  }

  return context;
}

export function ResizableLayoutRoot({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.div>) {
  const layout = useResizableLayout();

  return (
    <ResizableLayoutContext.Provider value={layout}>
      <motion.div
        className={cn("min-h-screen min-w-screen", className)}
        {...props}
      >
        {children}
      </motion.div>
    </ResizableLayoutContext.Provider>
  );
}

export function ResizableLayoutFrame({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    refs: { layoutRef },
  } = useResizableLayoutContext();

  return (
    <div
      ref={layoutRef}
      className={cn("flex h-svh overflow-hidden bg-background", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarPanel({
  children,
  className,
  ...props
}: Omit<React.ComponentProps<typeof motion.aside>, "animate" | "transition">) {
  const { state, transitions } = useResizableLayoutContext();

  return (
    <motion.aside
      animate={{ width: state.sidebarWidth }}
      transition={transitions.sidebarTransition}
      className={cn("relative h-full shrink-0 bg-sidebar", className)}
      {...props}
    >
      {children}
    </motion.aside>
  );
}

export function SidebarResizeHandle({
  onClick,
  onMouseDown,
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { actions } = useResizableLayoutContext();

  return (
    <div
      className={cn(
        "absolute inset-y-0 right-0 z-20 w-px cursor-col-resize bg-border/90 hover:bg-primary/40 active:bg-primary/40",
        "after:absolute after:inset-y-0 after:-left-2 after:-right-2 after:content-['']",
        className,
      )}
      onClick={(event) => {
        if (actions.shouldToggleOnHandleClick()) {
          actions.toggleSidebar();
        }
        onClick?.(event);
      }}
      onMouseDown={(event) => {
        actions.startSidebarDrag(event);
        onMouseDown?.(event);
      }}
      {...props}
    />
  );
}

export function SidebarTrigger({
  onClick,
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { actions } = useResizableLayoutContext();

  return (
    <button
      type="button"
      aria-label="Toggle sidebar"
      className={cn(className)}
      onClick={(event) => {
        actions.toggleSidebar();
        onClick?.(event);
      }}
      {...props}
    />
  );
}

export function CenterPanel({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    refs: { leftStackRef },
  } = useResizableLayoutContext();

  return (
    <div
      ref={leftStackRef}
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TopPanel({
  children,
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("min-h-0 flex-1 rounded-none p-6", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function BottomPanel({
  children,
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof motion.section>,
  "animate" | "transition"
>) {
  const { state, transitions } = useResizableLayoutContext();

  return (
    <motion.section
      animate={{ height: state.bottomHeight }}
      transition={transitions.bottomTransition}
      className={cn("relative shrink-0 overflow-visible", className)}
      data-state={state.isBottomCollapsed ? "collapsed" : "open"}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function BottomResizeHandle({
  onClick,
  onMouseDown,
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { actions, state } = useResizableLayoutContext();

  return (
    <div
      className={cn(
        "absolute left-0 right-0 z-20 cursor-row-resize",
        "data-[state=collapsed]:-top-3 data-[state=collapsed]:h-3",
        "data-[state=open]:top-0 data-[state=open]:h-px",
        "bg-border/90 hover:bg-primary/40 active:bg-primary/40",
        "after:absolute after:left-0 after:right-0 after:content-['']",
        "data-[state=open]:after:-top-2 data-[state=open]:after:h-5",
        "data-[state=collapsed]:after:hidden",
        className,
      )}
      data-state={state.isBottomCollapsed ? "collapsed" : "open"}
      onClick={(event) => {
        if (actions.shouldToggleOnHandleClick()) {
          actions.toggleBottomPanel();
        }
        onClick?.(event);
      }}
      onMouseDown={(event) => {
        actions.startBottomDrag(event);
        onMouseDown?.(event);
      }}
      {...props}
    />
  );
}

export function BottomPanelTrigger({
  onClick,
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { actions } = useResizableLayoutContext();

  return (
    <button
      id="bottom-trigger"
      type="button"
      onClick={(event) => {
        actions.toggleBottomPanel();
        onClick?.(event);
      }}
      className={cn(className)}
      {...props}
    />
  );
}

export function SidepanelResizeHandle({
  onClick,
  onMouseDown,
  className,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "animate" | "transition">) {
  const { actions, state, transitions } = useResizableLayoutContext();

  return (
    <motion.div
      animate={{
        width: state.isSidepanelCollapsed ? 0 : 1,
        opacity: state.isSidepanelCollapsed ? 0 : 1,
      }}
      transition={transitions.sidepanelTransition}
      className={cn(
        "absolute inset-y-0 left-0 z-20 overflow-visible",
        className,
      )}
      onClick={(event) => {
        if (actions.shouldToggleOnHandleClick()) {
          actions.toggleSidepanel();
        }
        onClick?.(event);
      }}
      onMouseDown={(event) => {
        actions.startSidepanelDrag(event);
        onMouseDown?.(event);
      }}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-px cursor-col-resize bg-border/90 hover:bg-primary/40 active:bg-primary/40",
          "after:absolute after:inset-y-0 after:-left-2 after:-right-2 after:content-['']",
        )}
      />
    </motion.div>
  );
}

export function Sidepanel({
  children,
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof motion.section>,
  "animate" | "transition"
>) {
  const { state, transitions } = useResizableLayoutContext();

  return (
    <motion.section
      initial={false}
      animate={{ width: state.sidepanelWidth }}
      transition={transitions.sidepanelTransition}
      className={cn("relative min-h-0 shrink-0", className)}
      data-state={state.isSidepanelCollapsed ? "collapsed" : "open"}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function SidepanelContent({
  children,
  className,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "animate">) {
  const { state } = useResizableLayoutContext();

  return (
    <motion.div
      animate={{
        opacity: state.isSidepanelCollapsed ? 0 : 1,
        x: state.isSidepanelCollapsed ? 16 : 0,
      }}
      transition={{ duration: 0.2 }}
      className={cn("h-full p-6", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SidepanelTrigger({
  onClick,
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { actions } = useResizableLayoutContext();

  return (
    <button
      id="sidepanel-trigger"
      type="button"
      onClick={(event) => {
        actions.toggleSidepanel();
        onClick?.(event);
      }}
      className={cn(className)}
      {...props}
    />
  );
}

