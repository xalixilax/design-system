export function SidebarResizeHandle({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      id="sidebar-resize-handle"
      className="h-full w-1.5 shrink-0 cursor-col-resize bg-border/90 hover:bg-primary/40"
      {...props}
    />
  );
}

export function SidebarTrigger({
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      id="sidebar-collapsible-trigger"
      type="button"
      aria-label="Toggle sidebar"
      className="absolute -right-3 top-1/2 z-20 h-16 w-6 -translate-y-1/2 rounded-md border bg-background text-[10px] text-muted-foreground shadow-sm hover:bg-muted"
      {...props}
    >
      {children}
    </button>
  );
}

export function SidePanelTrigger({
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      id="sidebar-collapsible-trigger"
      type="button"
      aria-label="Toggle sidebar"
      className="absolute -right-3 top-1/2 z-20 h-16 w-6 -translate-y-1/2 rounded-md border bg-background text-[10px] text-muted-foreground shadow-sm hover:bg-muted"
      {...props}
    >
      {children}
    </button>
  );
}

export function SidePanelResizeHandle({
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      id="side-panel-resize-handle"
      className="h-full shrink-0 w-2 cursor-col-resize bg-border hover:bg-red-400"
      {...props}
    />
  );
}

