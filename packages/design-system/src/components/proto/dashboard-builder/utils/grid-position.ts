import type { DashboardBounds, DashboardSection } from "../types";

export type GridPosition = {
  column: number;
  row: number;
};

export function getGridPositionFromCursor(
  cursor: { x: number; y: number } | null,
  container: HTMLDivElement | null,
  bounds: DashboardBounds,
  gap: number,
): GridPosition | null {
  if (!cursor || !container) {
    return null;
  }

  const rect = container.getBoundingClientRect();
  const usableWidth = rect.width - gap * (bounds.columns - 1);
  const usableHeight = rect.height - gap * (bounds.rows - 1);
  const columnStep = Math.max(1, usableWidth / bounds.columns + gap);
  const rowStep = Math.max(1, usableHeight / bounds.rows + gap);

  return {
    column: Math.min(Math.max(1, Math.floor((cursor.x - rect.left) / columnStep) + 1), bounds.columns),
    row: Math.min(Math.max(1, Math.floor((cursor.y - rect.top) / rowStep) + 1), bounds.rows),
  };
}

export function findSectionAtGridPosition(
  sections: DashboardSection[],
  column: number,
  row: number,
  excludedSectionId?: string,
) {
  return sections.find(
    (section) =>
      section.id !== excludedSectionId &&
      column >= section.x &&
      column < section.x + section.w &&
      row >= section.y &&
      row < section.y + section.h,
  );
}
