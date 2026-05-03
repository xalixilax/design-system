import { useEffect } from "react";
import { SIDE_PANEL_DEFAULT_WIDTH, SIDE_PANEL_MIN_VISIBLE_WIDTH } from "../utils/const";

function getExpandedSidepanelWidth(width: number): number {
  if (width < SIDE_PANEL_MIN_VISIBLE_WIDTH) {
    return SIDE_PANEL_DEFAULT_WIDTH;
  }

  return width;
}

function toggleSidepanelCollapseState(
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

export function useSidepanelKeyboardToggle(
  setIsSidepanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>,
  setSidepanelWidth: React.Dispatch<React.SetStateAction<number>>,
): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "b") {
        return;
      }

      event.preventDefault();
      toggleSidepanelCollapseState(setIsSidepanelCollapsed, setSidepanelWidth);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setIsSidepanelCollapsed, setSidepanelWidth]);
}
