import { useRef, useState } from "react";
import { useResizeDrag } from "./useResizeDrag";
import { useSidepanelKeyboardToggle } from "./useSidepanelKeyboardToggle";
import { BOTTOM_PANEL_COLLAPSE_HEIGHT, BOTTOM_PANEL_COLLAPSE_THRESHOLD, BOTTOM_PANEL_DEFAULT_HEIGHT, PANEL_TRANSITION, SIDE_PANEL_DEFAULT_WIDTH, SIDE_PANEL_MIN_VISIBLE_WIDTH, SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_OPEN_WIDTH } from "../utils/const";

type ResizableLayoutState = {
  sidebarWidth: number;
  bottomHeight: number;
  sidepanelWidth: number;
  isSidebarCollapsed: boolean;
  isBottomCollapsed: boolean;
  isSidepanelCollapsed: boolean;
};


export type ResizableLayoutActions = {
  toggleSidebar: () => void;
  toggleSidepanel: () => void;
  toggleBottomPanel: () => void;
  shouldToggleOnHandleClick: () => boolean;
  startSidebarDrag: (event?: React.MouseEvent) => void;
  startBottomDrag: (event?: React.MouseEvent) => void;
  startSidepanelDrag: (event?: React.MouseEvent) => void;
};

export type ResizableLayoutTransitions = {
  sidebarTransition: { duration: 0 } | typeof PANEL_TRANSITION;
  bottomTransition: { duration: 0 } | typeof PANEL_TRANSITION;
  sidepanelTransition: { duration: 0 } | typeof PANEL_TRANSITION;
};
  
type ResizableLayoutRefs = {
  layoutRef: React.RefObject<HTMLDivElement | null>;
  leftStackRef: React.RefObject<HTMLDivElement | null>;
};

export type UseResizableLayoutResult = {
  state: ResizableLayoutState;
  actions: ResizableLayoutActions;
  refs: ResizableLayoutRefs;
  transitions: ResizableLayoutTransitions;
};

function getExpandedSidepanelWidth(width: number): number {
  if (width < SIDE_PANEL_MIN_VISIBLE_WIDTH) {
    return SIDE_PANEL_DEFAULT_WIDTH;
  }

  return width;
}

export function toggleSidepanelCollapseState(
  setIsSidepanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>,
  setSidepanelWidth: React.Dispatch<React.SetStateAction<number>>,
): void {
  setIsSidepanelCollapsed((current) => {
    if (current) {
      setSidepanelWidth((width) => getExpandedSidepanelWidth(width));
      return false;
    }

    return true;
  });
}

export function useResizableLayout(): UseResizableLayoutResult {
  const layoutRef = useRef<HTMLDivElement>(null);
  const leftStackRef = useRef<HTMLDivElement>(null);

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_OPEN_WIDTH);
  const [sidepanelWidth, setSidepanelWidth] = useState(
    SIDE_PANEL_DEFAULT_WIDTH,
  );
  const [bottomHeight, setBottomHeight] = useState(BOTTOM_PANEL_DEFAULT_HEIGHT);
  const [isSidepanelCollapsed, setIsSidepanelCollapsed] = useState(false);
  const isSidepanelCollapsedRef = useRef(isSidepanelCollapsed);

  isSidepanelCollapsedRef.current = isSidepanelCollapsed;

  const isSidebarCollapsed = sidebarWidth <= SIDEBAR_COLLAPSED_WIDTH;
  const isBottomCollapsed = bottomHeight <= BOTTOM_PANEL_COLLAPSE_HEIGHT;
  const {
    dragMode,
    shouldToggleOnHandleClick,
    startSidebarDrag,
    startBottomDrag,
    startSidepanelDrag,
  } = useResizeDrag({
    layoutRef,
    leftStackRef,
    sidepanelWidth,
    isSidepanelCollapsedRef,
    setSidebarWidth,
    setBottomHeight,
    setSidepanelWidth,
    setIsSidepanelCollapsed,
  });

  useSidepanelKeyboardToggle(setIsSidepanelCollapsed, setSidepanelWidth);

  const actions: ResizableLayoutActions = {
    toggleBottomPanel: () => {
      setBottomHeight((current) => {
        if (current <= BOTTOM_PANEL_COLLAPSE_THRESHOLD) {
          return BOTTOM_PANEL_DEFAULT_HEIGHT;
        }

        return BOTTOM_PANEL_COLLAPSE_HEIGHT;
      });
    },
    toggleSidebar: () => {
      setSidebarWidth(
        isSidebarCollapsed ? SIDEBAR_OPEN_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
      );
    },
    toggleSidepanel: () => {
      toggleSidepanelCollapseState(setIsSidepanelCollapsed, setSidepanelWidth);
    },
    shouldToggleOnHandleClick,
    startSidebarDrag,
    startBottomDrag,
    startSidepanelDrag,
  };

  const transitions: ResizableLayoutTransitions = {
    sidebarTransition:
      dragMode === "sidebar" ? { duration: 0 } : PANEL_TRANSITION,
    bottomTransition:
      dragMode === "bottom" ? { duration: 0 } : PANEL_TRANSITION,
    sidepanelTransition:
      dragMode === "sidepanel" ? { duration: 0 } : PANEL_TRANSITION,
  };

  return {
    state: {
      sidebarWidth,
      bottomHeight,
      sidepanelWidth: isSidepanelCollapsed ? 0 : sidepanelWidth,
      isSidebarCollapsed,
      isBottomCollapsed,
      isSidepanelCollapsed,
    },
    actions,
    refs: {
      layoutRef,
      leftStackRef,
    },
    transitions,
  };
}
