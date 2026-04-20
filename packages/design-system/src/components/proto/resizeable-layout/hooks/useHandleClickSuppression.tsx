import { useRef } from "react";
import { HANDLE_CLICK_DRAG_THRESHOLD } from "../utils/const";

export function useHandleClickSuppression() {
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const suppressHandleClickRef = useRef(false);

  function startTracking(event?: React.MouseEvent): void {
    dragStartPointRef.current = event ? { x: event.clientX, y: event.clientY } : null;
    suppressHandleClickRef.current = false;
  }

  function trackMovement(event: MouseEvent): void {
    if (!dragStartPointRef.current || suppressHandleClickRef.current) {
      return;
    }

    const deltaX = Math.abs(event.clientX - dragStartPointRef.current.x);
    const deltaY = Math.abs(event.clientY - dragStartPointRef.current.y);

    if (Math.max(deltaX, deltaY) >= HANDLE_CLICK_DRAG_THRESHOLD) {
      suppressHandleClickRef.current = true;
    }
  }

  function clearTracking(): void {
    dragStartPointRef.current = null;
  }

  function shouldToggleOnHandleClick(): boolean {
    if (suppressHandleClickRef.current) {
      suppressHandleClickRef.current = false;
      return false;
    }

    return true;
  }

  return {
    startTracking,
    trackMovement,
    clearTracking,
    shouldToggleOnHandleClick,
  };
}
