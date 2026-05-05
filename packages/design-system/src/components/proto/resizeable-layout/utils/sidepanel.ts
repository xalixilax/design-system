import type { Dispatch, SetStateAction } from "react";

import { SIDE_PANEL_DEFAULT_WIDTH, SIDE_PANEL_MIN_VISIBLE_WIDTH } from "./const";

export function getExpandedSidepanelWidth(width: number) {
  if (width < SIDE_PANEL_MIN_VISIBLE_WIDTH) {
    return SIDE_PANEL_DEFAULT_WIDTH;
  }

  return width;
}

export function toggleSidepanelCollapseState(
  setIsSidepanelCollapsed: Dispatch<SetStateAction<boolean>>,
  setSidepanelWidth: Dispatch<SetStateAction<number>>,
): void {
  setIsSidepanelCollapsed((current) => {
    if (current) {
      setSidepanelWidth((width) => getExpandedSidepanelWidth(width));
      return false;
    }

    return true;
  });
}
