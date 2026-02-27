import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical, Lock, LockOpen, Square } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDrag } from "react-dnd";

import { Button } from "@design-system/components/ui/button";
import { useElementSize } from "@design-system/lib/hooks/use-element-size";
import { cn } from "@design-system/lib/utils";

import {
  DASHBOARD_NEW_SECTION_ITEM_TYPE,
  DASHBOARD_SECTION_ITEM_TYPE,
  DashboardSectionItem,
} from "./DashboardSectionItem";
import type { DashboardBounds, DashboardCard, DashboardSection } from "./types";

type DashboardDragItem = {
  kind: "section";
  id: string;
  w: number;
  h: number;
  originX: number;
  originY: number;
  originW: number;
  originH: number;
  lastSwapTargetId?: string;
};

type NewSectionDragItem = {
  kind: "new-section";
  templateW: number;
  templateH: number;
};

type NewSectionPreview =
  | {
      mode: "split";
      hoveredSectionId: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      mode: "place";
      x: number;
      y: number;
      w: number;
      h: number;
    };

type SeparatorPreview = {
  key: string;
  orientation: "vertical" | "horizontal";
  boundary: number;
  rangeStart: number;
  rangeEnd: number;
  sectionId: string;
  neighborSectionId: string;
  direction: "e" | "s";
  offsetX: number;
  offsetY: number;
  length: number;
  localResizable: boolean;
};

type ResizeDragSession = {
  mode: "boundary" | "segment";
  separator: SeparatorPreview;
  boundaryParticipants?: {
    leadingIds: string[];
    trailingIds: string[];
  };
  startX: number;
  startY: number;
  consumedColumns: number;
  consumedRows: number;
};

type BoundaryGuide = {
  key: string;
  orientation: "vertical" | "horizontal";
  boundary: number;
  offsetX: number;
  offsetY: number;
  length: number;
};

const GRID_PADDING_PX = 8;

function rectanglesOverlap(
  left: { x: number; y: number; w: number; h: number },
  right: { x: number; y: number; w: number; h: number },
) {
  return (
    left.x < right.x + right.w &&
    left.x + left.w > right.x &&
    left.y < right.y + right.h &&
    left.y + left.h > right.y
  );
}

function findNearestPlacementPreview(
  x: number,
  y: number,
  w: number,
  h: number,
  sections: DashboardSection[],
  bounds: DashboardBounds,
) {
  const maxX = Math.max(1, bounds.columns - w + 1);
  const maxY = Math.max(1, bounds.rows - h + 1);
  const clampedX = Math.min(Math.max(1, x), maxX);
  const clampedY = Math.min(Math.max(1, y), maxY);

  let best: { x: number; y: number; w: number; h: number } | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let row = 1; row <= maxY; row += 1) {
    for (let column = 1; column <= maxX; column += 1) {
      const candidate = { x: column, y: row, w, h };
      if (sections.some((section) => rectanglesOverlap(candidate, section))) {
        continue;
      }

      const distance = Math.abs(column - clampedX) + Math.abs(row - clampedY);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
  }

  return best;
}

function buildSplitPreview(
  section: DashboardSection,
  cursorColumn: number,
  cursorRow: number,
): NewSectionPreview | null {
  const minW = section.minW ?? 2;
  const minH = section.minH ?? 2;
  const canSplitVertically = section.w >= minW * 2;
  const canSplitHorizontally = section.h >= minH * 2;

  if (!canSplitVertically && !canSplitHorizontally) {
    return null;
  }

  const useVertical =
    section.w >= section.h ? canSplitVertically : !canSplitHorizontally;

  if (useVertical) {
    const leftWidth = Math.floor(section.w / 2);
    const rightWidth = section.w - leftWidth;
    const dropOnLeft = cursorColumn < section.x + section.w / 2;

    return dropOnLeft
      ? {
          mode: "split",
          hoveredSectionId: section.id,
          x: section.x,
          y: section.y,
          w: leftWidth,
          h: section.h,
        }
      : {
          mode: "split",
          hoveredSectionId: section.id,
          x: section.x + leftWidth,
          y: section.y,
          w: rightWidth,
          h: section.h,
        };
  }

  const topHeight = Math.floor(section.h / 2);
  const bottomHeight = section.h - topHeight;
  const dropOnTop = cursorRow < section.y + section.h / 2;

  return dropOnTop
    ? {
        mode: "split",
        hoveredSectionId: section.id,
        x: section.x,
        y: section.y,
        w: section.w,
        h: topHeight,
      }
    : {
        mode: "split",
        hoveredSectionId: section.id,
        x: section.x,
        y: section.y + topHeight,
        w: section.w,
        h: bottomHeight,
      };
}

function applySplitPreviewToSection(
  section: DashboardSection,
  preview: Extract<NewSectionPreview, { mode: "split" }>,
) {
  if (section.id !== preview.hoveredSectionId) {
    return section;
  }

  const isVerticalSplit = preview.h === section.h && preview.w < section.w;
  if (isVerticalSplit) {
    const previewOnLeft = preview.x === section.x;
    return previewOnLeft
      ? {
          ...section,
          x: section.x + preview.w,
          w: section.w - preview.w,
        }
      : {
          ...section,
          w: section.w - preview.w,
        };
  }

  const isHorizontalSplit = preview.w === section.w && preview.h < section.h;
  if (isHorizontalSplit) {
    const previewOnTop = preview.y === section.y;
    return previewOnTop
      ? {
          ...section,
          y: section.y + preview.h,
          h: section.h - preview.h,
        }
      : {
          ...section,
          h: section.h - preview.h,
        };
  }

  return section;
}

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
) {
  return startA < endB && endA > startB;
}

function isValidLocalLayout(
  sections: DashboardSection[],
  bounds: DashboardBounds,
) {
  const occupancy = new Uint8Array(bounds.columns * bounds.rows);

  for (const section of sections) {
    const minW = section.minW ?? 2;
    const minH = section.minH ?? 2;

    if (
      section.w < minW ||
      section.h < minH ||
      section.x < 1 ||
      section.y < 1 ||
      section.x + section.w - 1 > bounds.columns ||
      section.y + section.h - 1 > bounds.rows
    ) {
      return false;
    }

    for (let row = section.y; row < section.y + section.h; row += 1) {
      for (
        let column = section.x;
        column < section.x + section.w;
        column += 1
      ) {
        const index = (row - 1) * bounds.columns + (column - 1);
        occupancy[index] = (occupancy[index] ?? 0) + 1;
      }
    }
  }

  for (const cell of occupancy) {
    if (cell !== 1) {
      return false;
    }
  }

  return true;
}

function canResizeSegmentPair(
  sections: DashboardSection[],
  bounds: DashboardBounds,
  sectionId: string,
  neighborSectionId: string,
  direction: "e" | "s",
) {
  const section = sections.find((candidate) => candidate.id === sectionId);
  const neighbor = sections.find(
    (candidate) => candidate.id === neighborSectionId,
  );

  if (!section || !neighbor) {
    return false;
  }

  const participants =
    direction === "e"
      ? (() => {
          const boundary = section.x + section.w;
          const leftIds = new Set<string>([section.id]);
          const rightIds = new Set<string>([neighbor.id]);

          let changed = true;
          while (changed) {
            changed = false;

            for (const candidate of sections) {
              if (
                !leftIds.has(candidate.id) &&
                candidate.x + candidate.w === boundary &&
                sections.some(
                  (right) =>
                    rightIds.has(right.id) &&
                    rangesOverlap(
                      candidate.y,
                      candidate.y + candidate.h,
                      right.y,
                      right.y + right.h,
                    ),
                )
              ) {
                leftIds.add(candidate.id);
                changed = true;
              }

              if (
                !rightIds.has(candidate.id) &&
                candidate.x === boundary &&
                sections.some(
                  (left) =>
                    leftIds.has(left.id) &&
                    rangesOverlap(
                      candidate.y,
                      candidate.y + candidate.h,
                      left.y,
                      left.y + left.h,
                    ),
                )
              ) {
                rightIds.add(candidate.id);
                changed = true;
              }
            }
          }

          return { leftIds, rightIds };
        })()
      : (() => {
          const boundary = section.y + section.h;
          const topIds = new Set<string>([section.id]);
          const bottomIds = new Set<string>([neighbor.id]);

          let changed = true;
          while (changed) {
            changed = false;

            for (const candidate of sections) {
              if (
                !topIds.has(candidate.id) &&
                candidate.y + candidate.h === boundary &&
                sections.some(
                  (bottom) =>
                    bottomIds.has(bottom.id) &&
                    rangesOverlap(
                      candidate.x,
                      candidate.x + candidate.w,
                      bottom.x,
                      bottom.x + bottom.w,
                    ),
                )
              ) {
                topIds.add(candidate.id);
                changed = true;
              }

              if (
                !bottomIds.has(candidate.id) &&
                candidate.y === boundary &&
                sections.some(
                  (top) =>
                    topIds.has(top.id) &&
                    rangesOverlap(
                      candidate.x,
                      candidate.x + candidate.w,
                      top.x,
                      top.x + top.w,
                    ),
                )
              ) {
                bottomIds.add(candidate.id);
                changed = true;
              }
            }
          }

          return { topIds, bottomIds };
        })();

  const deltas = [-1, 1];

  for (const delta of deltas) {
    const next =
      direction === "e" &&
      "leftIds" in participants &&
      "rightIds" in participants
        ? sections.map((candidate) => {
            if (participants.leftIds.has(candidate.id)) {
              return { ...candidate, w: candidate.w + delta };
            }

            if (participants.rightIds.has(candidate.id)) {
              return {
                ...candidate,
                x: candidate.x + delta,
                w: candidate.w - delta,
              };
            }

            return candidate;
          })
        : direction === "s" &&
            "topIds" in participants &&
            "bottomIds" in participants
          ? sections.map((candidate) => {
              if (participants.topIds.has(candidate.id)) {
                return { ...candidate, h: candidate.h + delta };
              }

              if (participants.bottomIds.has(candidate.id)) {
                return {
                  ...candidate,
                  y: candidate.y + delta,
                  h: candidate.h - delta,
                };
              }

              return candidate;
            })
          : sections;

    if (isValidLocalLayout(next, bounds)) {
      return true;
    }
  }

  return false;
}

function buildSeparators(
  sections: DashboardSection[],
  bounds: DashboardBounds,
  columnSize: number,
  rowSize: number,
  gap: number,
) {
  const separators: SeparatorPreview[] = [];

  for (const section of sections) {
    const eastBoundary = section.x + section.w;
    if (eastBoundary <= bounds.columns) {
      const neighbors = sections.filter(
        (candidate) =>
          candidate.id !== section.id &&
          candidate.x === eastBoundary &&
          rangesOverlap(
            section.y,
            section.y + section.h,
            candidate.y,
            candidate.y + candidate.h,
          ),
      );

      for (const neighbor of neighbors) {
        const canMove =
          section.w > (section.minW ?? 2) || neighbor.w > (neighbor.minW ?? 2);
        if (!canMove) {
          continue;
        }

        const segmentStart = Math.max(section.y, neighbor.y);
        const segmentEnd = Math.min(
          section.y + section.h,
          neighbor.y + neighbor.h,
        );
        const segmentLengthRows = segmentEnd - segmentStart;
        if (segmentLengthRows <= 0) {
          continue;
        }

        const offsetX = (eastBoundary - 1) * (columnSize + gap) - gap / 2;
        const offsetY = (segmentStart - 1) * (rowSize + gap);
        const length =
          segmentLengthRows * rowSize + (segmentLengthRows - 1) * gap;
        separators.push({
          key: `${section.id}-e-${neighbor.id}-${segmentStart}-${segmentEnd}`,
          orientation: "vertical",
          boundary: eastBoundary,
          rangeStart: segmentStart,
          rangeEnd: segmentEnd,
          sectionId: section.id,
          neighborSectionId: neighbor.id,
          direction: "e",
          offsetX: offsetX + GRID_PADDING_PX,
          offsetY: offsetY + GRID_PADDING_PX,
          length,
          localResizable: canResizeSegmentPair(
            sections,
            bounds,
            section.id,
            neighbor.id,
            "e",
          ),
        });
      }
    }

    const southBoundary = section.y + section.h;
    if (southBoundary <= bounds.rows) {
      const neighbors = sections.filter(
        (candidate) =>
          candidate.id !== section.id &&
          candidate.y === southBoundary &&
          rangesOverlap(
            section.x,
            section.x + section.w,
            candidate.x,
            candidate.x + candidate.w,
          ),
      );

      for (const neighbor of neighbors) {
        const canMove =
          section.h > (section.minH ?? 2) || neighbor.h > (neighbor.minH ?? 2);
        if (!canMove) {
          continue;
        }

        const segmentStart = Math.max(section.x, neighbor.x);
        const segmentEnd = Math.min(
          section.x + section.w,
          neighbor.x + neighbor.w,
        );
        const segmentLengthColumns = segmentEnd - segmentStart;
        if (segmentLengthColumns <= 0) {
          continue;
        }

        const offsetX = (segmentStart - 1) * (columnSize + gap);
        const offsetY = (southBoundary - 1) * (rowSize + gap) - gap / 2;
        const length =
          segmentLengthColumns * columnSize + (segmentLengthColumns - 1) * gap;
        separators.push({
          key: `${section.id}-s-${neighbor.id}-${segmentStart}-${segmentEnd}`,
          orientation: "horizontal",
          boundary: southBoundary,
          rangeStart: segmentStart,
          rangeEnd: segmentEnd,
          sectionId: section.id,
          neighborSectionId: neighbor.id,
          direction: "s",
          offsetX: offsetX + GRID_PADDING_PX,
          offsetY: offsetY + GRID_PADDING_PX,
          length,
          localResizable: canResizeSegmentPair(
            sections,
            bounds,
            section.id,
            neighbor.id,
            "s",
          ),
        });
      }
    }
  }

  return separators;
}

function buildBoundaryGuides(
  separators: SeparatorPreview[],
  columnSize: number,
  rowSize: number,
  gap: number,
) {
  const guides: BoundaryGuide[] = [];
  const grouped = new Map<
    string,
    {
      orientation: "vertical" | "horizontal";
      boundary: number;
      ranges: Array<{ start: number; end: number }>;
    }
  >();

  for (const separator of separators) {
    const key = `${separator.orientation}-${separator.boundary}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.ranges.push({
        start: separator.rangeStart,
        end: separator.rangeEnd,
      });
      continue;
    }

    grouped.set(key, {
      orientation: separator.orientation,
      boundary: separator.boundary,
      ranges: [{ start: separator.rangeStart, end: separator.rangeEnd }],
    });
  }

  for (const [groupKey, group] of grouped.entries()) {
    const sortedRanges = [...group.ranges].sort(
      (left, right) => left.start - right.start,
    );
    const mergedRanges: Array<{ start: number; end: number }> = [];

    for (const range of sortedRanges) {
      const lastRange = mergedRanges.at(-1);
      if (!lastRange) {
        mergedRanges.push({ ...range });
        continue;
      }

      if (range.start <= lastRange.end) {
        lastRange.end = Math.max(lastRange.end, range.end);
        continue;
      }

      mergedRanges.push({ ...range });
    }

    for (const mergedRange of mergedRanges) {
      if (group.orientation === "vertical") {
        const offsetX = (group.boundary - 1) * (columnSize + gap) - gap / 2;
        const segmentLengthRows = mergedRange.end - mergedRange.start;
        const offsetY = (mergedRange.start - 1) * (rowSize + gap);
        const length =
          segmentLengthRows * rowSize + (segmentLengthRows - 1) * gap;

        guides.push({
          key: `${groupKey}-${mergedRange.start}-${mergedRange.end}`,
          orientation: "vertical",
          boundary: group.boundary,
          offsetX: offsetX + GRID_PADDING_PX,
          offsetY: offsetY + GRID_PADDING_PX,
          length,
        });
        continue;
      }

      const offsetY = (group.boundary - 1) * (rowSize + gap) - gap / 2;
      const segmentLengthColumns = mergedRange.end - mergedRange.start;
      const offsetX = (mergedRange.start - 1) * (columnSize + gap);
      const length =
        segmentLengthColumns * columnSize + (segmentLengthColumns - 1) * gap;

      guides.push({
        key: `${groupKey}-${mergedRange.start}-${mergedRange.end}`,
        orientation: "horizontal",
        boundary: group.boundary,
        offsetX: offsetX + GRID_PADDING_PX,
        offsetY: offsetY + GRID_PADDING_PX,
        length,
      });
    }
  }

  return guides;
}

function NewSectionDragButton({ disabled }: { disabled: boolean }) {
  const [, dragRef] = useDrag<NewSectionDragItem>(
    () => ({
      type: DASHBOARD_NEW_SECTION_ITEM_TYPE,
      item: {
        kind: "new-section",
        templateW: 4,
        templateH: 4,
      },
      canDrag: !disabled,
    }),
    [disabled],
  );

  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      if (!node) {
        return;
      }

      void dragRef(node);
    },
    [dragRef],
  );

  return (
    <Button
      ref={setRef}
      size="icon"
      variant="outline"
      title="Drag to add an empty section"
      disabled={disabled}
    >
      <Square />
      <span className="sr-only">Drag new empty section</span>
    </Button>
  );
}

export type DashboardBuilderCanvasProps = {
  bounds: DashboardBounds;
  sections: DashboardSection[];
  gap?: number;
  canvasHeight?: number;
  className?: string;
  onAddSection: () => void;
  onAddSectionAt: (
    x: number,
    y: number,
    options?: { width?: number; height?: number; title?: string },
  ) => void;
  onSplitSectionWithNew: (
    hoveredSectionId: string,
    cursorX: number,
    cursorY: number,
  ) => void;
  onMoveSection: (sectionId: string, x: number, y: number) => void;
  onSwapSections: (
    draggedSectionId: string,
    hoveredSectionId: string,
    origin: { x: number; y: number; w: number; h: number },
  ) => void;
  onResizeSection: (
    sectionId: string,
    direction: "e" | "s",
    deltaColumns: number,
    deltaRows: number,
  ) => void;
  onResizeBoundary: (
    orientation: "vertical" | "horizontal",
    boundary: number,
    delta: number,
    participants?: { leadingIds: string[]; trailingIds: string[] },
  ) => void;
  onResizeSegment: (
    sectionId: string,
    neighborSectionId: string,
    direction: "e" | "s",
    delta: number,
  ) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddCardToSection: (sectionId: string) => void;
  onRemoveCardFromSection: (sectionId: string, cardId: string) => void;
  renderCard?: (
    card: DashboardCard,
    section: DashboardSection,
  ) => React.ReactNode;
};

export function DashboardBuilderCanvas({
  bounds,
  sections,
  gap = 8,
  canvasHeight = 680,
  className,
  onAddSection,
  onAddSectionAt,
  onSplitSectionWithNew,
  onMoveSection,
  onSwapSections,
  onResizeSection,
  onResizeBoundary,
  onResizeSegment,
  onRemoveSection,
  onAddCardToSection,
  onRemoveCardFromSection,
  renderCard,
}: DashboardBuilderCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [newSectionPreview, setNewSectionPreview] =
    useState<NewSectionPreview | null>(null);
  const [pendingPreviewClearTargetCount, setPendingPreviewClearTargetCount] =
    useState<number | null>(null);
  const [isLayoutEditing, setIsLayoutEditing] = useState(false);
  const [hoveredBoundaryKey, setHoveredBoundaryKey] = useState<string | null>(
    null,
  );
  const [activeSegmentSeparatorKey, setActiveSegmentSeparatorKey] = useState<
    string | null
  >(null);
  const resizeSessionRef = useRef<ResizeDragSession | null>(null);
  const containerSize = useElementSize(containerRef.current);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNewSectionPreview(null);
        setPendingPreviewClearTargetCount(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (pendingPreviewClearTargetCount === null) {
      return;
    }

    if (sections.length >= pendingPreviewClearTargetCount) {
      setNewSectionPreview(null);
      setPendingPreviewClearTargetCount(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNewSectionPreview(null);
      setPendingPreviewClearTargetCount(null);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [pendingPreviewClearTargetCount, sections.length]);

  const [, dropRef] = useDrop<DashboardDragItem | NewSectionDragItem>(
    () => ({
      accept: [DASHBOARD_SECTION_ITEM_TYPE, DASHBOARD_NEW_SECTION_ITEM_TYPE],
      hover: (item, monitor) => {
        if (!isLayoutEditing) {
          return;
        }

        if (item.kind === "new-section") {
          const cursor = monitor.getClientOffset();
          const container = containerRef.current;
          if (!cursor || !container) {
            setNewSectionPreview(null);
            setPendingPreviewClearTargetCount(null);
            return;
          }

          const rect = container.getBoundingClientRect();
          const usableWidth = rect.width - gap * (bounds.columns - 1);
          const usableHeight = rect.height - gap * (bounds.rows - 1);
          const columnStep = Math.max(1, usableWidth / bounds.columns + gap);
          const rowStep = Math.max(1, usableHeight / bounds.rows + gap);
          const cursorColumn = Math.min(
            Math.max(1, Math.floor((cursor.x - rect.left) / columnStep) + 1),
            bounds.columns,
          );
          const cursorRow = Math.min(
            Math.max(1, Math.floor((cursor.y - rect.top) / rowStep) + 1),
            bounds.rows,
          );

          const hoveredSection = sections.find(
            (section) =>
              cursorColumn >= section.x &&
              cursorColumn < section.x + section.w &&
              cursorRow >= section.y &&
              cursorRow < section.y + section.h,
          );

          if (hoveredSection) {
            setNewSectionPreview(
              buildSplitPreview(hoveredSection, cursorColumn, cursorRow),
            );
            return;
          }

          const placement = findNearestPlacementPreview(
            cursorColumn,
            cursorRow,
            item.templateW,
            item.templateH,
            sections,
            bounds,
          );

          setNewSectionPreview(
            placement ? { mode: "place", ...placement } : null,
          );
          return;
        }

        if (newSectionPreview) {
          setNewSectionPreview(null);
          setPendingPreviewClearTargetCount(null);
        }

        const cursor = monitor.getClientOffset();
        const container = containerRef.current;
        if (!cursor || !container) {
          return;
        }

        const rect = container.getBoundingClientRect();
        const usableWidth = rect.width - gap * (bounds.columns - 1);
        const usableHeight = rect.height - gap * (bounds.rows - 1);
        const columnStep = Math.max(1, usableWidth / bounds.columns + gap);
        const rowStep = Math.max(1, usableHeight / bounds.rows + gap);
        const cursorColumn = Math.min(
          Math.max(1, Math.floor((cursor.x - rect.left) / columnStep) + 1),
          bounds.columns,
        );
        const cursorRow = Math.min(
          Math.max(1, Math.floor((cursor.y - rect.top) / rowStep) + 1),
          bounds.rows,
        );

        const hoveredSection = sections.find(
          (section) =>
            section.id !== item.id &&
            cursorColumn >= section.x &&
            cursorColumn < section.x + section.w &&
            cursorRow >= section.y &&
            cursorRow < section.y + section.h,
        );

        if (hoveredSection) {
          if (item.lastSwapTargetId !== hoveredSection.id) {
            onSwapSections(item.id, hoveredSection.id, {
              x: item.originX,
              y: item.originY,
              w: item.originW,
              h: item.originH,
            });
            item.lastSwapTargetId = hoveredSection.id;
            item.w = hoveredSection.w;
            item.h = hoveredSection.h;
          }
          return;
        }

        item.lastSwapTargetId = undefined;
      },
      canDrop: () => true,
      drop: (item, monitor) => {
        if (!isLayoutEditing) {
          return;
        }

        if (item.kind !== "new-section") {
          return;
        }

        if (newSectionPreview?.mode === "split") {
          setPendingPreviewClearTargetCount(sections.length + 1);
          const splitCursorX = newSectionPreview.x + newSectionPreview.w / 2;
          const splitCursorY = newSectionPreview.y + newSectionPreview.h / 2;
          onSplitSectionWithNew(
            newSectionPreview.hoveredSectionId,
            splitCursorX,
            splitCursorY,
          );
          return;
        }

        if (newSectionPreview?.mode === "place") {
          setPendingPreviewClearTargetCount(sections.length + 1);
          onAddSectionAt(newSectionPreview.x, newSectionPreview.y, {
            width: item.templateW,
            height: item.templateH,
          });
          return;
        }

        const cursor = monitor.getClientOffset();
        const container = containerRef.current;
        if (!cursor || !container) {
          return;
        }

        const rect = container.getBoundingClientRect();
        const usableWidth = rect.width - gap * (bounds.columns - 1);
        const usableHeight = rect.height - gap * (bounds.rows - 1);
        const columnStep = Math.max(1, usableWidth / bounds.columns + gap);
        const rowStep = Math.max(1, usableHeight / bounds.rows + gap);
        const cursorColumn = Math.min(
          Math.max(1, Math.floor((cursor.x - rect.left) / columnStep) + 1),
          bounds.columns,
        );
        const cursorRow = Math.min(
          Math.max(1, Math.floor((cursor.y - rect.top) / rowStep) + 1),
          bounds.rows,
        );

        const hoveredSection = sections.find(
          (section) =>
            cursorColumn >= section.x &&
            cursorColumn < section.x + section.w &&
            cursorRow >= section.y &&
            cursorRow < section.y + section.h,
        );

        if (hoveredSection) {
          setPendingPreviewClearTargetCount(sections.length + 1);
          onSplitSectionWithNew(hoveredSection.id, cursorColumn, cursorRow);
          return;
        }

        setPendingPreviewClearTargetCount(sections.length + 1);
        onAddSectionAt(cursorColumn, cursorRow, {
          width: item.templateW,
          height: item.templateH,
        });
      },
    }),
    [
      bounds.columns,
      bounds.rows,
      gap,
      onAddSectionAt,
      isLayoutEditing,
      onMoveSection,
      onSplitSectionWithNew,
      onSwapSections,
      sections,
      newSectionPreview,
    ],
  );

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      dropRef(node);
    },
    [dropRef],
  );

  const columnStep = Math.max(
    8,
    (containerSize.width - gap * (bounds.columns - 1)) / bounds.columns + gap,
  );
  const rowStep = Math.max(
    8,
    (containerSize.height - gap * (bounds.rows - 1)) / bounds.rows + gap,
  );

  const columnSize = Math.max(
    1,
    (containerSize.width - gap * (bounds.columns - 1)) / bounds.columns,
  );
  const rowSize = Math.max(
    1,
    (containerSize.height - gap * (bounds.rows - 1)) / bounds.rows,
  );
  const separators = buildSeparators(
    sections,
    bounds,
    columnSize,
    rowSize,
    gap,
  );
  const boundaryGuides = buildBoundaryGuides(
    separators,
    columnSize,
    rowSize,
    gap,
  );
  const previewedSections =
    newSectionPreview?.mode === "split"
      ? sections.map((section) =>
          applySplitPreviewToSection(section, newSectionPreview),
        )
      : sections;

  const onResizePointerMove = useCallback(
    (event: PointerEvent) => {
      const session = resizeSessionRef.current;
      if (!session) {
        return;
      }

      if (session.separator.orientation === "vertical") {
        const rawColumns = Math.round(
          (event.clientX - session.startX) / columnStep,
        );
        const deltaColumns = rawColumns - session.consumedColumns;
        if (deltaColumns === 0) {
          return;
        }

        session.consumedColumns = rawColumns;
        if (session.mode === "boundary") {
          onResizeBoundary(
            "vertical",
            session.separator.boundary,
            deltaColumns,
            session.boundaryParticipants,
          );
          session.separator.boundary += deltaColumns;
        } else {
          onResizeSegment(
            session.separator.sectionId,
            session.separator.neighborSectionId,
            session.separator.direction,
            deltaColumns,
          );
        }
        return;
      }

      const rawRows = Math.round((event.clientY - session.startY) / rowStep);
      const deltaRows = rawRows - session.consumedRows;
      if (deltaRows === 0) {
        return;
      }

      session.consumedRows = rawRows;
      if (session.mode === "boundary") {
        onResizeBoundary(
          "horizontal",
          session.separator.boundary,
          deltaRows,
          session.boundaryParticipants,
        );
        session.separator.boundary += deltaRows;
      } else {
        onResizeSegment(
          session.separator.sectionId,
          session.separator.neighborSectionId,
          session.separator.direction,
          deltaRows,
        );
      }
    },
    [columnStep, onResizeBoundary, onResizeSegment, rowStep],
  );

  const onResizePointerUp = useCallback(() => {
    resizeSessionRef.current = null;
    setActiveSegmentSeparatorKey(null);
    window.removeEventListener("pointermove", onResizePointerMove);
    window.removeEventListener("pointerup", onResizePointerUp);
    window.removeEventListener("pointercancel", onResizePointerUp);
  }, [onResizePointerMove]);

  const startResizeDrag = useCallback(
    (separator: SeparatorPreview, mode: "boundary" | "segment") =>
      (event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        if (mode === "segment") {
          setActiveSegmentSeparatorKey(separator.key);
        }

        const boundaryParticipants =
          mode === "boundary"
            ? separator.orientation === "vertical"
              ? {
                  leadingIds: sections
                    .filter(
                      (section) => section.x + section.w === separator.boundary,
                    )
                    .map((section) => section.id),
                  trailingIds: sections
                    .filter((section) => section.x === separator.boundary)
                    .map((section) => section.id),
                }
              : {
                  leadingIds: sections
                    .filter(
                      (section) => section.y + section.h === separator.boundary,
                    )
                    .map((section) => section.id),
                  trailingIds: sections
                    .filter((section) => section.y === separator.boundary)
                    .map((section) => section.id),
                }
            : undefined;

        resizeSessionRef.current = {
          mode,
          separator,
          boundaryParticipants,
          startX: event.clientX,
          startY: event.clientY,
          consumedColumns: 0,
          consumedRows: 0,
        };

        window.addEventListener("pointermove", onResizePointerMove);
        window.addEventListener("pointerup", onResizePointerUp);
        window.addEventListener("pointercancel", onResizePointerUp);
      },
    [onResizePointerMove, onResizePointerUp, sections],
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="bg-card/70 flex items-center justify-end gap-2 rounded-md border px-2 py-2">
        <Button
          variant={isLayoutEditing ? "default" : "outline"}
          onClick={() => setIsLayoutEditing((previous) => !previous)}
        >
          {isLayoutEditing ? <LockOpen /> : <Lock />}
          {isLayoutEditing ? "Layout editing on" : "Layout editing off"}
        </Button>
        <NewSectionDragButton disabled={!isLayoutEditing} />
        <Button onClick={onAddSection}>Add section</Button>
      </div>

      <div
        ref={setContainerRef}
        className="bg-muted/20 relative grid w-full rounded-2xl border shadow-sm"
        style={{
          height: canvasHeight,
          gap,
          gridTemplateColumns: `repeat(${bounds.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${bounds.rows}, minmax(0, 1fr))`,
          padding: GRID_PADDING_PX,
        }}
      >
        <AnimatePresence>
          {newSectionPreview ? (
            <motion.div
              key="new-section-preview"
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 34,
                mass: 0.65,
              }}
              className="pointer-events-none bg-card/80 text-muted-foreground flex items-center justify-center rounded-lg border border-border/80 text-sm font-medium"
              style={{
                gridColumn: `${newSectionPreview.x} / span ${newSectionPreview.w}`,
                gridRow: `${newSectionPreview.y} / span ${newSectionPreview.h}`,
                zIndex: 5,
              }}
            >
              New section
            </motion.div>
          ) : null}
        </AnimatePresence>
        {isLayoutEditing
          ? boundaryGuides.map((guide) => (
              <div
                key={guide.key}
                role="presentation"
                onPointerDown={(event) => {
                  const separator = separators.find(
                    (candidate) =>
                      candidate.orientation === guide.orientation &&
                      candidate.boundary === guide.boundary,
                  );

                  if (!separator) {
                    return;
                  }

                  startResizeDrag(separator, "boundary")(event);
                }}
                onPointerEnter={() =>
                  setHoveredBoundaryKey(
                    `${guide.orientation}-${guide.boundary}`,
                  )
                }
                onPointerLeave={() =>
                  setHoveredBoundaryKey((previous) =>
                    previous === `${guide.orientation}-${guide.boundary}`
                      ? null
                      : previous,
                  )
                }
                className={cn(
                  "absolute z-20 rounded-full transition-all",
                  guide.orientation === "vertical"
                    ? "w-4 cursor-ew-resize"
                    : "h-4 cursor-ns-resize",
                  hoveredBoundaryKey ===
                    `${guide.orientation}-${guide.boundary}`
                    ? "bg-border/90"
                    : "",
                )}
                style={
                  guide.orientation === "vertical"
                    ? {
                        left: guide.offsetX,
                        top: guide.offsetY,
                        height: guide.length,
                        transform: "translateX(-50%)",
                      }
                    : {
                        left: guide.offsetX,
                        top: guide.offsetY,
                        width: guide.length,
                        transform: "translateY(-50%)",
                      }
                }
              />
            ))
          : null}
        {isLayoutEditing
          ? separators
              .filter(
                (separator) =>
                  (separator.localResizable &&
                    hoveredBoundaryKey ===
                      `${separator.orientation}-${separator.boundary}`) ||
                  activeSegmentSeparatorKey === separator.key,
              )
              .map((separator) => (
                <div
                  key={`${separator.key}-segment-handle`}
                  role="presentation"
                  onPointerEnter={() =>
                    setHoveredBoundaryKey(
                      `${separator.orientation}-${separator.boundary}`,
                    )
                  }
                  onPointerLeave={() =>
                    setHoveredBoundaryKey((previous) =>
                      previous ===
                      `${separator.orientation}-${separator.boundary}`
                        ? null
                        : previous,
                    )
                  }
                  onPointerDown={startResizeDrag(separator, "segment")}
                  className={cn(
                    "absolute z-30 flex items-center justify-center rounded-full border border-border/80 bg-muted/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    separator.orientation === "vertical"
                      ? "h-8 w-4 cursor-ew-resize"
                      : "h-4 w-8 cursor-ns-resize",
                  )}
                  style={(() => {
                    const primarySection = sections.find(
                      (section) => section.id === separator.sectionId,
                    );
                    const neighborSection = sections.find(
                      (section) => section.id === separator.neighborSectionId,
                    );

                    const anchorSection =
                      separator.orientation === "vertical"
                        ? (primarySection?.h ?? 0) >= (neighborSection?.h ?? 0)
                          ? primarySection
                          : neighborSection
                        : (primarySection?.w ?? 0) >= (neighborSection?.w ?? 0)
                          ? primarySection
                          : neighborSection;

                    if (separator.orientation === "vertical") {
                      const anchorCenterY = anchorSection
                        ? (anchorSection.y - 1) * (rowSize + gap) +
                          (anchorSection.h * rowSize +
                            (anchorSection.h - 1) * gap) /
                            2 +
                          GRID_PADDING_PX
                        : separator.offsetY + separator.length / 2;

                      return {
                        left: separator.offsetX,
                        top: anchorCenterY,
                        transform: "translate(-50%, -50%)",
                      };
                    }

                    const anchorCenterX = anchorSection
                      ? (anchorSection.x - 1) * (columnSize + gap) +
                        (anchorSection.w * columnSize +
                          (anchorSection.w - 1) * gap) /
                          2 +
                        GRID_PADDING_PX
                      : separator.offsetX + separator.length / 2;

                    return {
                      left: anchorCenterX,
                      top: separator.offsetY,
                      transform: "translate(-50%, -50%)",
                    };
                  })()}
                >
                  <GripVertical
                    className={cn(
                      "size-3 opacity-80",
                      separator.orientation === "horizontal" && "rotate-90",
                    )}
                  />
                </div>
              ))
          : null}
        {previewedSections.map((section) => (
          <DashboardSectionItem
            key={section.id}
            section={section}
            isLayoutEditing={isLayoutEditing}
            onRemove={onRemoveSection}
            onAddCard={onAddCardToSection}
            onRemoveCard={onRemoveCardFromSection}
            renderCard={renderCard}
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardBuilder(props: DashboardBuilderCanvasProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <DashboardBuilderCanvas {...props} />
    </DndProvider>
  );
}
