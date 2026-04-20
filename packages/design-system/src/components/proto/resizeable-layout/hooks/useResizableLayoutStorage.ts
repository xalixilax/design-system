import { clamp } from "../utils/clamp";
import {
  BOTTOM_PANEL_COLLAPSE_HEIGHT,
  BOTTOM_PANEL_COLLAPSE_THRESHOLD,
  BOTTOM_PANEL_DEFAULT_HEIGHT,
  BOTTOM_PANEL_MAX_HEIGHT,
  BOTTOM_PANEL_MIN_VISIBLE_HEIGHT,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_OPEN_WIDTH,
  SIDE_PANEL_DEFAULT_WIDTH,
  SIDE_PANEL_MAX_WIDTH,
  SIDE_PANEL_MIN_VISIBLE_WIDTH,
} from "../utils/const";

const RESIZABLE_LAYOUT_STORAGE_KEY = "proto-resizable-layout-state";

type PersistedResizableLayoutState = {
  sidebarWidth: number;
  sidepanelWidth: number;
  bottomHeight: number;
  lastExpandedBottomHeight: number;
  isSidepanelCollapsed: boolean;
};

export type InitialResizableLayoutState = {
  sidebarWidth: number;
  sidepanelWidth: number;
  bottomHeight: number;
  lastExpandedBottomHeight: number;
  isSidepanelCollapsed: boolean;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function readPersistedLayoutState(): PersistedResizableLayoutState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(RESIZABLE_LAYOUT_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !isFiniteNumber(parsed.sidebarWidth) ||
      !isFiniteNumber(parsed.sidepanelWidth) ||
      !isFiniteNumber(parsed.bottomHeight) ||
      !isFiniteNumber(parsed.lastExpandedBottomHeight) ||
      !isBoolean(parsed.isSidepanelCollapsed)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getInitialResizableLayoutState(): InitialResizableLayoutState {
  const persistedState = readPersistedLayoutState();
  if (!persistedState) {
    return {
      sidebarWidth: SIDEBAR_OPEN_WIDTH,
      sidepanelWidth: SIDE_PANEL_DEFAULT_WIDTH,
      bottomHeight: BOTTOM_PANEL_DEFAULT_HEIGHT,
      lastExpandedBottomHeight: BOTTOM_PANEL_DEFAULT_HEIGHT,
      isSidepanelCollapsed: false,
    };
  }

  return {
    sidebarWidth: clamp(persistedState.sidebarWidth, SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_OPEN_WIDTH),
    sidepanelWidth: clamp(persistedState.sidepanelWidth, SIDE_PANEL_MIN_VISIBLE_WIDTH, SIDE_PANEL_MAX_WIDTH),
    bottomHeight:
      persistedState.bottomHeight <= BOTTOM_PANEL_COLLAPSE_THRESHOLD
        ? BOTTOM_PANEL_COLLAPSE_HEIGHT
        : clamp(persistedState.bottomHeight, BOTTOM_PANEL_MIN_VISIBLE_HEIGHT, BOTTOM_PANEL_MAX_HEIGHT),
    lastExpandedBottomHeight: clamp(
      persistedState.lastExpandedBottomHeight,
      BOTTOM_PANEL_MIN_VISIBLE_HEIGHT,
      BOTTOM_PANEL_MAX_HEIGHT,
    ),
    isSidepanelCollapsed: persistedState.isSidepanelCollapsed,
  };
}

export function writePersistedResizableLayoutState(state: InitialResizableLayoutState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(RESIZABLE_LAYOUT_STORAGE_KEY, JSON.stringify(state));
}
