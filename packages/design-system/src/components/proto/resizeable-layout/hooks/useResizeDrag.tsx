import { useEffect, useRef, useState } from "react";
import { clamp } from "../utils/clamp";
import {
  BOTTOM_PANEL_COLLAPSE_HEIGHT,
  BOTTOM_PANEL_COLLAPSE_THRESHOLD,
  BOTTOM_PANEL_MAX_HEIGHT,
  BOTTOM_PANEL_MIN_VISIBLE_HEIGHT,
  BOTTOM_PANEL_RESERVED_TOP_HEIGHT,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_OPEN_WIDTH,
  SIDE_PANEL_COLLAPSE_THRESHOLD,
  SIDE_PANEL_DEFAULT_WIDTH,
  SIDE_PANEL_MAX_WIDTH,
  SIDE_PANEL_MIN_VISIBLE_WIDTH,
} from "../utils/const";
import { useHandleClickSuppression } from "./useHandleClickSuppression";

export type DragMode = "sidebar" | "sidepanel" | "bottom";

export type UseResizeDragResult = {
  dragMode: DragMode | null;
  shouldToggleOnHandleClick: () => boolean;
  startSidebarDrag: (event?: React.MouseEvent) => void;
  startBottomDrag: (event?: React.MouseEvent) => void;
  startSidepanelDrag: (event?: React.MouseEvent) => void;
};

export type UseResizeDragParams = {
  layoutRef: React.RefObject<HTMLDivElement | null>;
  leftStackRef: React.RefObject<HTMLDivElement | null>;
  sidepanelWidth: number;
  isSidepanelCollapsedRef: React.RefObject<boolean>;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
  setBottomHeight: React.Dispatch<React.SetStateAction<number>>;
  setSidepanelWidth: React.Dispatch<React.SetStateAction<number>>;
  setIsSidepanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useResizeDrag({
  layoutRef,
  leftStackRef,
  sidepanelWidth,
  isSidepanelCollapsedRef,
  setSidebarWidth,
  setBottomHeight,
  setSidepanelWidth,
  setIsSidepanelCollapsed,
}: UseResizeDragParams): UseResizeDragResult {
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const sidepanelWidthBeforeDragRef = useRef(SIDE_PANEL_DEFAULT_WIDTH);
  const { startTracking, trackMovement, clearTracking, shouldToggleOnHandleClick } = useHandleClickSuppression();

  function beginDrag(mode: DragMode, event?: React.MouseEvent): void {
    event?.preventDefault();

    if (mode === "sidepanel") {
      sidepanelWidthBeforeDragRef.current = sidepanelWidth;
    }

    startTracking(event);
    setDragMode(mode);
  }

  useEffect(() => {
    if (!dragMode) {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const dragCursor = dragMode === "bottom" ? "row-resize" : "col-resize";

    const previousRootCursor = root.style.cursor;
    const previousBodyCursor = body.style.cursor;
    const previousBodyUserSelect = body.style.userSelect;
    const previousWebkitUserSelect = body.style.getPropertyValue("-webkit-user-select");

    const preventDefault = (event: Event) => {
      event.preventDefault();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!dragMode) {
        return;
      }

      trackMovement(event);

      if (dragMode === "sidebar") {
        const layoutRect = layoutRef.current?.getBoundingClientRect();
        if (!layoutRect) {
          return;
        }

        const next = clamp(event.clientX - layoutRect.left, SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_OPEN_WIDTH);
        setSidebarWidth(next);
        return;
      }

      if (dragMode === "sidepanel") {
        const layoutRect = layoutRef.current?.getBoundingClientRect();
        if (!layoutRect) {
          return;
        }

        const raw = layoutRect.right - event.clientX;
        if (raw <= SIDE_PANEL_COLLAPSE_THRESHOLD) {
          setSidepanelWidth(
            clamp(sidepanelWidthBeforeDragRef.current, SIDE_PANEL_MIN_VISIBLE_WIDTH, SIDE_PANEL_MAX_WIDTH),
          );
          setIsSidepanelCollapsed(true);
          return;
        }

        setIsSidepanelCollapsed(false);
        setSidepanelWidth(clamp(raw, SIDE_PANEL_MIN_VISIBLE_WIDTH, SIDE_PANEL_MAX_WIDTH));
        return;
      }

      const leftStackRect = leftStackRef.current?.getBoundingClientRect();
      if (!leftStackRect) {
        return;
      }

      const raw = leftStackRect.bottom - event.clientY;
      const next =
        raw <= BOTTOM_PANEL_COLLAPSE_THRESHOLD
          ? BOTTOM_PANEL_COLLAPSE_HEIGHT
          : clamp(
              raw,
              BOTTOM_PANEL_MIN_VISIBLE_HEIGHT,
              Math.min(BOTTOM_PANEL_MAX_HEIGHT, leftStackRect.height - BOTTOM_PANEL_RESERVED_TOP_HEIGHT),
            );

      setBottomHeight(next);
    };

    const onMouseUp = () => {
      if (!dragMode) {
        return;
      }

      if (dragMode === "sidebar") {
        const midpoint = (SIDEBAR_COLLAPSED_WIDTH + SIDEBAR_OPEN_WIDTH) / 2;
        setSidebarWidth((current) => (current <= midpoint ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_OPEN_WIDTH));
      }

      if (dragMode === "sidepanel" && !isSidepanelCollapsedRef.current) {
        setSidepanelWidth((current) => clamp(current, SIDE_PANEL_MIN_VISIBLE_WIDTH, SIDE_PANEL_MAX_WIDTH));
      }

      if (dragMode === "bottom") {
        setBottomHeight((current) =>
          current <= BOTTOM_PANEL_COLLAPSE_THRESHOLD
            ? BOTTOM_PANEL_COLLAPSE_HEIGHT
            : clamp(current, BOTTOM_PANEL_MIN_VISIBLE_HEIGHT, BOTTOM_PANEL_MAX_HEIGHT),
        );
      }

      setDragMode(null);
      clearTracking();
    };

    root.style.cursor = dragCursor;
    body.style.cursor = dragCursor;
    body.style.userSelect = "none";
    body.style.setProperty("-webkit-user-select", "none");

    document.addEventListener("selectstart", preventDefault);
    document.addEventListener("dragstart", preventDefault);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      root.style.cursor = previousRootCursor;
      body.style.cursor = previousBodyCursor;
      body.style.userSelect = previousBodyUserSelect;

      if (previousWebkitUserSelect) {
        body.style.setProperty("-webkit-user-select", previousWebkitUserSelect);
      } else {
        body.style.removeProperty("-webkit-user-select");
      }

      document.removeEventListener("selectstart", preventDefault);
      document.removeEventListener("dragstart", preventDefault);
    };
  }, [
    clearTracking,
    dragMode,
    isSidepanelCollapsedRef,
    layoutRef,
    leftStackRef,
    setBottomHeight,
    setIsSidepanelCollapsed,
    setSidebarWidth,
    setSidepanelWidth,
    trackMovement,
  ]);

  return {
    dragMode,
    shouldToggleOnHandleClick,
    startSidebarDrag: (event) => {
      beginDrag("sidebar", event);
    },
    startBottomDrag: (event) => {
      beginDrag("bottom", event);
    },
    startSidepanelDrag: (event) => {
      beginDrag("sidepanel", event);
    },
  };
}
