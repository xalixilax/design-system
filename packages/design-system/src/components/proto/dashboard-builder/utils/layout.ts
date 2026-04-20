import type { DashboardBounds, DashboardCard, DashboardSection, ResizeDirection } from "../types";

export const DEFAULT_MIN_SECTION_WIDTH = 2;
export const DEFAULT_MIN_SECTION_HEIGHT = 2;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function buildId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createCard(index: number): DashboardCard {
  return {
    id: buildId("card"),
    title: `Card ${index}`,
    content: "Editable card content",
  };
}

export function normalizeSection(section: DashboardSection): DashboardSection {
  return {
    ...section,
    minW: section.minW ?? DEFAULT_MIN_SECTION_WIDTH,
    minH: section.minH ?? DEFAULT_MIN_SECTION_HEIGHT,
  };
}

export function clampSectionToBounds(section: DashboardSection, bounds: DashboardBounds): DashboardSection {
  const normalized = normalizeSection(section);
  const maxX = Math.max(1, bounds.columns);
  const maxY = Math.max(1, bounds.rows);

  const safeX = clamp(normalized.x, 1, maxX);
  const safeY = clamp(normalized.y, 1, maxY);
  const maxWidth = Math.max(1, bounds.columns - safeX + 1);
  const maxHeight = Math.max(1, bounds.rows - safeY + 1);

  return {
    ...normalized,
    x: safeX,
    y: safeY,
    w: clamp(normalized.w, normalized.minW ?? DEFAULT_MIN_SECTION_WIDTH, maxWidth),
    h: clamp(normalized.h, normalized.minH ?? DEFAULT_MIN_SECTION_HEIGHT, maxHeight),
  };
}

function doesOverlap(left: DashboardSection, right: DashboardSection) {
  const leftRight = left.x + left.w;
  const rightRight = right.x + right.w;
  const leftBottom = left.y + left.h;
  const rightBottom = right.y + right.h;

  return left.x < rightRight && leftRight > right.x && left.y < rightBottom && leftBottom > right.y;
}

export function collidesWithAny(section: DashboardSection, sections: DashboardSection[], exceptId?: string) {
  return sections.some((candidate) => candidate.id !== exceptId && doesOverlap(section, candidate));
}

export function findCollidingSections(section: DashboardSection, sections: DashboardSection[], exceptId?: string) {
  return sections.filter((candidate) => candidate.id !== exceptId && doesOverlap(section, candidate));
}

export function applyResizeDelta(
  section: DashboardSection,
  direction: ResizeDirection,
  deltaColumns: number,
  deltaRows: number,
): DashboardSection {
  let x = section.x;
  let y = section.y;
  let w = section.w;
  let h = section.h;

  if (direction.includes("e")) {
    w += deltaColumns;
  }

  if (direction.includes("w")) {
    x += deltaColumns;
    w -= deltaColumns;
  }

  if (direction.includes("s")) {
    h += deltaRows;
  }

  if (direction.includes("n")) {
    y += deltaRows;
    h -= deltaRows;
  }

  const minW = section.minW ?? DEFAULT_MIN_SECTION_WIDTH;
  const minH = section.minH ?? DEFAULT_MIN_SECTION_HEIGHT;

  if (w < minW) {
    if (direction.includes("w")) {
      x -= minW - w;
    }
    w = minW;
  }

  if (h < minH) {
    if (direction.includes("n")) {
      y -= minH - h;
    }
    h = minH;
  }

  return {
    ...section,
    x,
    y,
    w,
    h,
  };
}

export function findOpenSlot(
  sections: DashboardSection[],
  bounds: DashboardBounds,
  size: { w: number; h: number },
): { x: number; y: number } | null {
  for (let row = 1; row <= bounds.rows; row += 1) {
    for (let column = 1; column <= bounds.columns; column += 1) {
      const candidate: DashboardSection = {
        id: "candidate",
        title: "candidate",
        x: column,
        y: row,
        w: size.w,
        h: size.h,
        cards: [],
      };

      const bounded = clampSectionToBounds(candidate, bounds);
      if (
        bounded.x !== candidate.x ||
        bounded.y !== candidate.y ||
        bounded.w !== candidate.w ||
        bounded.h !== candidate.h
      ) {
        continue;
      }

      if (!collidesWithAny(candidate, sections)) {
        return { x: column, y: row };
      }
    }
  }

  return null;
}
