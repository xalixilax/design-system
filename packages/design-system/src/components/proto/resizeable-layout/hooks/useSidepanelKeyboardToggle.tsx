import { useEffect } from "react";
import { toggleSidepanelCollapseState } from "./useResizableLayout";

export function useSidepanelKeyboardToggle(
  setIsSidepanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>,
  setSidepanelWidth: React.Dispatch<React.SetStateAction<number>>,
): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== "b"
      ) {
        return;
      }

      event.preventDefault();
      toggleSidepanelCollapseState(setIsSidepanelCollapsed, setSidepanelWidth);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setIsSidepanelCollapsed, setSidepanelWidth]);
}
