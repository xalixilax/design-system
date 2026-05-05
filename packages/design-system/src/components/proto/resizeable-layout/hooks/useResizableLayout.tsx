import { useEffect, useRef, useState } from "react";

import { useIsMobile } from "../../dashboard-builder/hooks/use-mobile";
import {
  BOTTOM_PANEL_COLLAPSE_HEIGHT,
  BOTTOM_PANEL_COLLAPSE_THRESHOLD,
  MOBILE_LAYOUT_BREAKPOINT,
  PANEL_TRANSITION,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_OPEN_WIDTH,
} from "../utils/const";
import { getExpandedSidepanelWidth, toggleSidepanelCollapseState } from "../utils/sidepanel";
import { getInitialResizableLayoutState, writePersistedResizableLayoutState } from "./useResizableLayoutStorage";
import { useResizeDrag } from "./useResizeDrag";
import { useSidepanelKeyboardToggle } from "./useSidepanelKeyboardToggle";

type ResizableLayoutState = {
  isMobile: boolean;
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

export function useResizableLayout(): UseResizableLayoutResult {
  const [initialState] = useState(getInitialResizableLayoutState);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const isMobile = useIsMobile(MOBILE_LAYOUT_BREAKPOINT);

  const layoutRef = useRef<HTMLDivElement>(null);
  const leftStackRef = useRef<HTMLDivElement>(null);

  const [sidebarWidth, setSidebarWidth] = useState(initialState.sidebarWidth);
  const [sidepanelWidth, setSidepanelWidth] = useState(initialState.sidepanelWidth);
  const [bottomHeight, setBottomHeight] = useState(initialState.bottomHeight);
  const [lastExpandedBottomHeight, setLastExpandedBottomHeight] = useState(initialState.lastExpandedBottomHeight);
  const [isSidepanelCollapsed, setIsSidepanelCollapsed] = useState(initialState.isSidepanelCollapsed);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileBottomOpen, setIsMobileBottomOpen] = useState(false);
  const [isMobileSidepanelOpen, setIsMobileSidepanelOpen] = useState(false);
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

  function toggleMobileDrawer(drawer: "sidebar" | "sidepanel" | "bottom") {
    if (drawer === "sidebar") {
      setIsMobileSidebarOpen((current) => {
        const next = !current;
        setIsMobileSidepanelOpen(false);
        setIsMobileBottomOpen(false);
        return next;
      });
      return;
    }

    if (drawer === "sidepanel") {
      setIsMobileSidepanelOpen((current) => {
        const next = !current;
        setIsMobileSidebarOpen(false);
        setIsMobileBottomOpen(false);
        return next;
      });
      return;
    }

    setIsMobileBottomOpen((current) => {
      const next = !current;
      setIsMobileSidebarOpen(false);
      setIsMobileSidepanelOpen(false);
      return next;
    });
  }

  const displaySidebarWidth = isMobile ? (isMobileSidebarOpen ? SIDEBAR_OPEN_WIDTH : 0) : sidebarWidth;
  const mobileBottomHeight = bottomHeight <= BOTTOM_PANEL_COLLAPSE_THRESHOLD ? lastExpandedBottomHeight : bottomHeight;
  const mobileSidepanelWidth = getExpandedSidepanelWidth(sidepanelWidth);

  const displayBottomHeight = isMobile ? mobileBottomHeight : bottomHeight;
  const displaySidepanelWidth = isMobile ? mobileSidepanelWidth : isSidepanelCollapsed ? 0 : sidepanelWidth;

  const isSidebarCollapsedForLayout = isMobile ? !isMobileSidebarOpen : isSidebarCollapsed;
  const isBottomCollapsedForLayout = isMobile ? !isMobileBottomOpen : isBottomCollapsed;
  const isSidepanelCollapsedForLayout = isMobile ? !isMobileSidepanelOpen : isSidepanelCollapsed;

  const actions: ResizableLayoutActions = {
    toggleBottomPanel: () => {
      if (isMobile) {
        toggleMobileDrawer("bottom");
        return;
      }

      setBottomHeight((current) => {
        if (current <= BOTTOM_PANEL_COLLAPSE_THRESHOLD) {
          return lastExpandedBottomHeight;
        }

        return BOTTOM_PANEL_COLLAPSE_HEIGHT;
      });
    },
    toggleSidebar: () => {
      if (isMobile) {
        toggleMobileDrawer("sidebar");
        return;
      }

      setSidebarWidth(isSidebarCollapsed ? SIDEBAR_OPEN_WIDTH : SIDEBAR_COLLAPSED_WIDTH);
    },
    toggleSidepanel: () => {
      if (isMobile) {
        toggleMobileDrawer("sidepanel");
        return;
      }

      toggleSidepanelCollapseState(setIsSidepanelCollapsed, setSidepanelWidth);
    },
    shouldToggleOnHandleClick,
    startSidebarDrag: (event) => {
      if (isMobile) {
        return;
      }

      startSidebarDrag(event);
    },
    startBottomDrag: (event) => {
      if (isMobile) {
        return;
      }

      startBottomDrag(event);
    },
    startSidepanelDrag: (event) => {
      if (isMobile) {
        return;
      }

      startSidepanelDrag(event);
    },
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
      isMobile,
      sidebarWidth: displaySidebarWidth,
      bottomHeight: displayBottomHeight,
      sidepanelWidth: displaySidepanelWidth,
      isSidebarCollapsed: isSidebarCollapsedForLayout,
      isBottomCollapsed: isBottomCollapsedForLayout,
      isSidepanelCollapsed: isSidepanelCollapsedForLayout,
    },
    actions,
    refs: {
      layoutRef,
      leftStackRef,
    },
    transitions,
  };
}
