import { useCallback, useRef } from "react";
import type * as React from "react";

import type { ResizeDirection } from "../types";

type UseSectionResizeOptions = {
  sectionId: string;
  columnStep: number;
  rowStep: number;
  onResize: (sectionId: string, direction: ResizeDirection, deltaColumns: number, deltaRows: number) => void;
};

type ResizeSession = {
  direction: ResizeDirection;
  startX: number;
  startY: number;
  consumedColumns: number;
  consumedRows: number;
};

export function useSectionResize({ sectionId, columnStep, rowStep, onResize }: UseSectionResizeOptions) {
  const sessionRef = useRef<ResizeSession | null>(null);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }

      const rawColumns = Math.round((event.clientX - session.startX) / columnStep);
      const rawRows = Math.round((event.clientY - session.startY) / rowStep);
      const deltaColumns = rawColumns - session.consumedColumns;
      const deltaRows = rawRows - session.consumedRows;

      if (deltaColumns === 0 && deltaRows === 0) {
        return;
      }

      session.consumedColumns = rawColumns;
      session.consumedRows = rawRows;
      onResize(sectionId, session.direction, deltaColumns, deltaRows);
    },
    [columnStep, onResize, rowStep, sectionId],
  );

  const endResize = useCallback(() => {
    sessionRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endResize);
  }, [onPointerMove]);

  const startResize = useCallback(
    (direction: ResizeDirection) => (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      sessionRef.current = {
        direction,
        startX: event.clientX,
        startY: event.clientY,
        consumedColumns: 0,
        consumedRows: 0,
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", endResize);
    },
    [endResize, onPointerMove],
  );

  return {
    startResize,
    endResize,
  };
}
