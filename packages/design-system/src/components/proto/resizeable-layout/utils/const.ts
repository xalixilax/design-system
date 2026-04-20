export const SIDEBAR_COLLAPSED_WIDTH = 45;
export const SIDEBAR_OPEN_WIDTH = 245;

export const SIDE_PANEL_DEFAULT_WIDTH = 300;
export const SIDE_PANEL_MIN_VISIBLE_WIDTH = 84;
export const SIDE_PANEL_MAX_WIDTH = 5000;
export const SIDE_PANEL_COLLAPSE_THRESHOLD = 26;

export const BOTTOM_PANEL_DEFAULT_HEIGHT = 230;
export const BOTTOM_PANEL_MIN_VISIBLE_HEIGHT = 78;
export const BOTTOM_PANEL_MAX_HEIGHT = 5000;
export const BOTTOM_PANEL_COLLAPSE_HEIGHT = 0;
export const BOTTOM_PANEL_COLLAPSE_THRESHOLD = 22;
export const BOTTOM_PANEL_RESERVED_TOP_HEIGHT = 120;

export const HANDLE_CLICK_DRAG_THRESHOLD = 4;

export const PANEL_TRANSITION = {
  type: "spring",
  stiffness: 380,
  damping: 36,
  mass: 0.35,
} as const;
