import { useEffect, useRef, useState } from "react";
import {
  BOTTOM_PANEL_COLLAPSE_HEIGHT,
  BOTTOM_PANEL_COLLAPSE_THRESHOLD,
  PANEL_TRANSITION,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_OPEN_WIDTH,
  SIDE_PANEL_DEFAULT_WIDTH,
  SIDE_PANEL_MIN_VISIBLE_WIDTH,
} from "../utils/const";
import { getInitialResizableLayoutState, writePersistedResizableLayoutState } from "./useResizableLayoutStorage";
import { useResizeDrag } from "./useResizeDrag";
import { useSidepanelKeyboardToggle } from "./useSidepanelKeyboardToggle";

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
  const [initialState] = useState(getInitialResizableLayoutState);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const layoutRef = useRef<HTMLDivElement>(null);
  const leftStackRef = useRef<HTMLDivElement>(null);

  const [sidebarWidth, setSidebarWidth] = useState(initialState.sidebarWidth);
  const [sidepanelWidth, setSidepanelWidth] = useState(initialState.sidepanelWidth);
  const [bottomHeight, setBottomHeight] = useState(initialState.bottomHeight);
  const [lastExpandedBottomHeight, setLastExpandedBottomHeight] = useState(initialState.lastExpandedBottomHeight);
  const [isSidepanelCollapsed, setIsSidepanelCollapsed] = useState(initialState.isSidepanelCollapsed);
  const isSidepanelCollapsedRef = useRef(isSidepanelCollapsed);

  isSidepanelCollapsedRef.current = isSidepanelCollapsed;

  useEffect(() => {
    if (bottomHeight > BOTTOM_PANEL_COLLAPSE_THRESHOLD) {
      setLastExpandedBottomHeight(bottomHeight);
    }
  }, [bottomHeight]);

  useEffect(() => {
    setShouldAnimate(true);
  }, []);

  const isSidebarCollapsed = sidebarWidth <= SIDEBAR_COLLAPSED_WIDTH;
  const isBottomCollapsed = bottomHeight <= BOTTOM_PANEL_COLLAPSE_HEIGHT;
  const { dragMode, shouldToggleOnHandleClick, startSidebarDrag, startBottomDrag, startSidepanelDrag } = useResizeDrag({
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
          return lastExpandedBottomHeight;
        }

        return BOTTOM_PANEL_COLLAPSE_HEIGHT;
      });
    },
    toggleSidebar: () => {
      setSidebarWidth(isSidebarCollapsed ? SIDEBAR_OPEN_WIDTH : SIDEBAR_COLLAPSED_WIDTH);
    },
    toggleSidepanel: () => {
      toggleSidepanelCollapseState(setIsSidepanelCollapsed, setSidepanelWidth);
    },
    shouldToggleOnHandleClick,
    startSidebarDrag,
    startBottomDrag,
    startSidepanelDrag,
  };

  useEffect(() => {
    writePersistedResizableLayoutState({
      sidebarWidth,
      sidepanelWidth,
      bottomHeight,
      lastExpandedBottomHeight,
      isSidepanelCollapsed,
    });
  }, [sidebarWidth, sidepanelWidth, bottomHeight, lastExpandedBottomHeight, isSidepanelCollapsed]);

  const transitions: ResizableLayoutTransitions = {
    sidebarTransition: !shouldAnimate || dragMode === "sidebar" ? { duration: 0 } : PANEL_TRANSITION,
    bottomTransition: !shouldAnimate || dragMode === "bottom" ? { duration: 0 } : PANEL_TRANSITION,
    sidepanelTransition: !shouldAnimate || dragMode === "sidepanel" ? { duration: 0 } : PANEL_TRANSITION,
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
