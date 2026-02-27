import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  DashboardBounds,
  DashboardCard,
  DashboardSection,
  ResizeDirection,
  SplitPlacement,
} from "../types";
import {
  applyResizeDelta,
  buildId,
  clampSectionToBounds,
  collidesWithAny,
  createCard,
  findOpenSlot,
} from "../utils/layout";
import { buildSegmentParticipants } from "../utils/participants";

type UseDashboardLayoutOptions = {
  bounds: DashboardBounds;
  initialSections: DashboardSection[];
};

type AddSectionOptions = {
  title?: string;
  width?: number;
  height?: number;
  cards?: DashboardCard[];
};

type SplitOrientation = "vertical" | "horizontal";

type ResizeBoundaryOrientation = "vertical" | "horizontal";

type ResizeBoundaryParticipants = {
  leadingIds: string[];
  trailingIds: string[];
};

function intervalsOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
}

function minWidth(section: DashboardSection) {
  return section.minW ?? 2;
}

function minHeight(section: DashboardSection) {
  return section.minH ?? 2;
}

function sectionsOverlap(left: DashboardSection, right: DashboardSection) {
  const leftRight = left.x + left.w;
  const rightRight = right.x + right.w;
  const leftBottom = left.y + left.h;
  const rightBottom = right.y + right.h;

  return left.x < rightRight && leftRight > right.x && left.y < rightBottom && leftBottom > right.y;
}

function findGapFiller(removed: DashboardSection, sections: DashboardSection[]) {
  const leftNeighbor = sections.find(
    (section) => section.x + section.w === removed.x && section.y === removed.y && section.h === removed.h,
  );
  if (leftNeighbor) {
    return {
      id: leftNeighbor.id,
      next: {
        ...leftNeighbor,
        w: leftNeighbor.w + removed.w,
      },
    };
  }

  const rightNeighbor = sections.find(
    (section) => section.x === removed.x + removed.w && section.y === removed.y && section.h === removed.h,
  );
  if (rightNeighbor) {
    return {
      id: rightNeighbor.id,
      next: {
        ...rightNeighbor,
        x: removed.x,
        w: rightNeighbor.w + removed.w,
      },
    };
  }

  const topNeighbor = sections.find(
    (section) => section.y + section.h === removed.y && section.x === removed.x && section.w === removed.w,
  );
  if (topNeighbor) {
    return {
      id: topNeighbor.id,
      next: {
        ...topNeighbor,
        h: topNeighbor.h + removed.h,
      },
    };
  }

  const bottomNeighbor = sections.find(
    (section) => section.y === removed.y + removed.h && section.x === removed.x && section.w === removed.w,
  );
  if (bottomNeighbor) {
    return {
      id: bottomNeighbor.id,
      next: {
        ...bottomNeighbor,
        y: removed.y,
        h: bottomNeighbor.h + removed.h,
      },
    };
  }

  return null;
}

function isValidLayout(next: DashboardSection[], bounds: DashboardBounds) {
  for (const section of next) {
    if (
      section.w < minWidth(section) ||
      section.h < minHeight(section) ||
      section.x < 1 ||
      section.y < 1 ||
      section.x + section.w - 1 > bounds.columns ||
      section.y + section.h - 1 > bounds.rows
    ) {
      return false;
    }
  }

  for (const section of next) {
    if (collidesWithAny(section, next, section.id)) {
      return false;
    }
  }

  return true;
}

function hasNoGaps(next: DashboardSection[], bounds: DashboardBounds) {
  const totalCells = bounds.columns * bounds.rows;
  const occupancy = new Uint8Array(totalCells);

  for (const section of next) {
    const startColumn = section.x;
    const endColumn = section.x + section.w - 1;
    const startRow = section.y;
    const endRow = section.y + section.h - 1;

    for (let row = startRow; row <= endRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
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

export function useDashboardLayout({ bounds, initialSections }: UseDashboardLayoutOptions) {
  const [sections, setSections] = useState(() => initialSections.map((section) => clampSectionToBounds(section, bounds)));

  useEffect(() => {
    setSections((previous) => {
      const next: DashboardSection[] = [];
      let changed = false;

      for (const section of previous) {
        const clamped = clampSectionToBounds(section, bounds);
        const isSameSection =
          clamped.id === section.id &&
          clamped.title === section.title &&
          clamped.x === section.x &&
          clamped.y === section.y &&
          clamped.w === section.w &&
          clamped.h === section.h &&
          clamped.minW === section.minW &&
          clamped.minH === section.minH &&
          clamped.cards === section.cards;

        if (!isSameSection) {
          changed = true;
        }

        if (!collidesWithAny(clamped, next)) {
          next.push(clamped);
        } else {
          changed = true;
        }
      }

      if (!changed && next.length === previous.length) {
        return previous;
      }

      return next;
    });
  }, [bounds.columns, bounds.rows]);

  const moveSection = useCallback(
    (sectionId: string, x: number, y: number) => {
      setSections((previous) => {
        const current = previous.find((section) => section.id === sectionId);
        if (!current) {
          return previous;
        }

        const moved = clampSectionToBounds({ ...current, x, y }, bounds);

        const isSamePlacement =
          moved.x === current.x &&
          moved.y === current.y &&
          moved.w === current.w &&
          moved.h === current.h;
        if (isSamePlacement) {
          return previous;
        }

        if (collidesWithAny(moved, previous, sectionId)) {
          return previous;
        }

        return previous.map((section) =>
          section.id === sectionId ? moved : section,
        );
      });
    },
    [bounds.columns, bounds.rows],
  );

  const swapSections = useCallback(
    (
      draggedSectionId: string,
      hoveredSectionId: string,
      origin: { x: number; y: number; w: number; h: number },
    ) => {
      if (draggedSectionId === hoveredSectionId) {
        return;
      }

      setSections((previous) => {
        const draggedSection = previous.find((section) => section.id === draggedSectionId);
        const hoveredSection = previous.find((section) => section.id === hoveredSectionId);

        if (!draggedSection || !hoveredSection) {
          return previous;
        }

        const originOccupant = previous.find(
          (section) =>
            section.id !== draggedSectionId &&
            section.x === origin.x &&
            section.y === origin.y &&
            section.w === origin.w &&
            section.h === origin.h,
        );

        const hoveredIsAtOrigin =
          hoveredSection.x === origin.x &&
          hoveredSection.y === origin.y &&
          hoveredSection.w === origin.w &&
          hoveredSection.h === origin.h;

        const draggedNext = {
          ...draggedSection,
          x: hoveredSection.x,
          y: hoveredSection.y,
          w: hoveredSection.w,
          h: hoveredSection.h,
        };

        const hoveredNext = hoveredIsAtOrigin
          ? {
            ...hoveredSection,
            x: draggedSection.x,
            y: draggedSection.y,
            w: draggedSection.w,
            h: draggedSection.h,
          }
          : {
            ...hoveredSection,
            x: origin.x,
            y: origin.y,
            w: origin.w,
            h: origin.h,
          };

        const originOccupantNext =
          originOccupant && originOccupant.id !== hoveredSection.id
            ? {
              ...originOccupant,
              x: draggedSection.x,
              y: draggedSection.y,
              w: draggedSection.w,
              h: draggedSection.h,
            }
            : null;

        return previous.map((section) => {
          if (section.id === draggedSectionId) {
            return draggedNext;
          }

          if (section.id === hoveredSectionId) {
            return hoveredNext;
          }

          if (originOccupantNext && section.id === originOccupantNext.id) {
            return originOccupantNext;
          }

          return section;
        });
      });
    },
    [],
  );

  const resizeSection = useCallback(
    (sectionId: string, direction: ResizeDirection, deltaColumns: number, deltaRows: number) => {
      if (deltaColumns === 0 && deltaRows === 0) {
        return;
      }

      setSections((previous) => {
        const current = previous.find((section) => section.id === sectionId);
        if (!current) {
          return previous;
        }

        const attemptLineResize = () => {
          if (direction === "e" && deltaColumns !== 0) {
            const boundary = current.x + current.w;
            const neighbors = previous.filter(
              (section) =>
                section.id !== current.id &&
                section.x === boundary &&
                intervalsOverlap(section.y, section.y + section.h, current.y, current.y + current.h),
            );

            if (neighbors.length === 0) {
              return null;
            }

            const updates = new Map<string, DashboardSection>();
            updates.set(current.id, { ...current, w: current.w + deltaColumns });

            for (const neighbor of neighbors) {
              updates.set(neighbor.id, {
                ...neighbor,
                x: neighbor.x + deltaColumns,
                w: neighbor.w - deltaColumns,
              });
            }

            return updates;
          }

          if (direction === "w" && deltaColumns !== 0) {
            const boundary = current.x;
            const neighbors = previous.filter(
              (section) =>
                section.id !== current.id &&
                section.x + section.w === boundary &&
                intervalsOverlap(section.y, section.y + section.h, current.y, current.y + current.h),
            );

            if (neighbors.length === 0) {
              return null;
            }

            const updates = new Map<string, DashboardSection>();
            updates.set(current.id, {
              ...current,
              x: current.x + deltaColumns,
              w: current.w - deltaColumns,
            });

            for (const neighbor of neighbors) {
              updates.set(neighbor.id, {
                ...neighbor,
                w: neighbor.w + deltaColumns,
              });
            }

            return updates;
          }

          if (direction === "s" && deltaRows !== 0) {
            const boundary = current.y + current.h;
            const neighbors = previous.filter(
              (section) =>
                section.id !== current.id &&
                section.y === boundary &&
                intervalsOverlap(section.x, section.x + section.w, current.x, current.x + current.w),
            );

            if (neighbors.length === 0) {
              return null;
            }

            const updates = new Map<string, DashboardSection>();
            updates.set(current.id, {
              ...current,
              h: current.h + deltaRows,
            });

            for (const neighbor of neighbors) {
              updates.set(neighbor.id, {
                ...neighbor,
                y: neighbor.y + deltaRows,
                h: neighbor.h - deltaRows,
              });
            }

            return updates;
          }

          if (direction === "n" && deltaRows !== 0) {
            const boundary = current.y;
            const neighbors = previous.filter(
              (section) =>
                section.id !== current.id &&
                section.y + section.h === boundary &&
                intervalsOverlap(section.x, section.x + section.w, current.x, current.x + current.w),
            );

            if (neighbors.length === 0) {
              return null;
            }

            const updates = new Map<string, DashboardSection>();
            updates.set(current.id, {
              ...current,
              y: current.y + deltaRows,
              h: current.h - deltaRows,
            });

            for (const neighbor of neighbors) {
              updates.set(neighbor.id, {
                ...neighbor,
                h: neighbor.h + deltaRows,
              });
            }

            return updates;
          }

          return null;
        };

        const lineResizeUpdates = attemptLineResize();
        if (lineResizeUpdates) {
          const next = previous.map((section) => lineResizeUpdates.get(section.id) ?? section);

          for (const section of next) {
            if (
              section.w < minWidth(section) ||
              section.h < minHeight(section) ||
              section.x < 1 ||
              section.y < 1 ||
              section.x + section.w - 1 > bounds.columns ||
              section.y + section.h - 1 > bounds.rows
            ) {
              return previous;
            }
          }

          for (const section of next) {
            if (collidesWithAny(section, next, section.id)) {
              return previous;
            }
          }

          return next;
        }

        const resized = clampSectionToBounds(applyResizeDelta(current, direction, deltaColumns, deltaRows), bounds);
        if (collidesWithAny(resized, previous, sectionId)) {
          return previous;
        }

        return previous.map((section) => (section.id === sectionId ? resized : section));
      });
    },
    [bounds.columns, bounds.rows],
  );

  const resizeBoundary = useCallback(
    (
      orientation: ResizeBoundaryOrientation,
      boundary: number,
      delta: number,
      participants?: ResizeBoundaryParticipants,
    ) => {
      if (delta === 0) {
        return;
      }

      setSections((previous) => {
        let next: DashboardSection[];

        if (orientation === "vertical") {
          const leftIds = participants
            ? new Set(participants.leadingIds)
            : new Set(previous.filter((section) => section.x + section.w === boundary).map((section) => section.id));
          const rightIds = participants
            ? new Set(participants.trailingIds)
            : new Set(previous.filter((section) => section.x === boundary).map((section) => section.id));

          if (leftIds.size === 0 || rightIds.size === 0) {
            return previous;
          }

          next = previous.map((section) => {
            if (leftIds.has(section.id)) {
              return {
                ...section,
                w: section.w + delta,
              };
            }

            if (rightIds.has(section.id)) {
              return {
                ...section,
                x: section.x + delta,
                w: section.w - delta,
              };
            }

            return section;
          });
        } else {
          const topIds = participants
            ? new Set(participants.leadingIds)
            : new Set(previous.filter((section) => section.y + section.h === boundary).map((section) => section.id));
          const bottomIds = participants
            ? new Set(participants.trailingIds)
            : new Set(previous.filter((section) => section.y === boundary).map((section) => section.id));

          if (topIds.size === 0 || bottomIds.size === 0) {
            return previous;
          }

          next = previous.map((section) => {
            if (topIds.has(section.id)) {
              return {
                ...section,
                h: section.h + delta,
              };
            }

            if (bottomIds.has(section.id)) {
              return {
                ...section,
                y: section.y + delta,
                h: section.h - delta,
              };
            }

            return section;
          });
        }

        if (!isValidLayout(next, bounds) || !hasNoGaps(next, bounds)) {
          return previous;
        }

        return next;
      });
    },
    [bounds.columns, bounds.rows],
  );

  const resizeSegment = useCallback(
    (sectionId: string, neighborSectionId: string, direction: "e" | "s", delta: number) => {
      if (delta === 0) {
        return;
      }

      setSections((previous) => {
        const section = previous.find((candidate) => candidate.id === sectionId);
        const neighbor = previous.find((candidate) => candidate.id === neighborSectionId);

        if (!section || !neighbor) {
          return previous;
        }

        const participants = buildSegmentParticipants(previous, section, neighbor, direction);

        let next: DashboardSection[];

        if (participants.direction === "e") {
          next = previous.map((candidate) => {
            if (participants.leftIds.has(candidate.id)) {
              return {
                ...candidate,
                w: candidate.w + delta,
              };
            }

            if (participants.rightIds.has(candidate.id)) {
              return {
                ...candidate,
                x: candidate.x + delta,
                w: candidate.w - delta,
              };
            }

            return candidate;
          });
        } else if (participants.direction === "s") {
          next = previous.map((candidate) => {
            if (participants.topIds.has(candidate.id)) {
              return {
                ...candidate,
                h: candidate.h + delta,
              };
            }

            if (participants.bottomIds.has(candidate.id)) {
              return {
                ...candidate,
                y: candidate.y + delta,
                h: candidate.h - delta,
              };
            }

            return candidate;
          });
        } else {
          return previous;
        }

        if (!isValidLayout(next, bounds) || !hasNoGaps(next, bounds)) {
          return previous;
        }

        return next;
      });
    },
    [bounds.columns, bounds.rows],
  );

  const addSection = useCallback(
    (options?: AddSectionOptions) => {
      setSections((previous) => {
        const width = options?.width ?? 4;
        const height = options?.height ?? 4;
        const slot = findOpenSlot(previous, bounds, { w: width, h: height });

        if (!slot) {
          return previous;
        }

        const nextIndex = previous.length + 1;
        const nextSection: DashboardSection = {
          id: buildId("section"),
          title: options?.title ?? `Section ${nextIndex}`,
          x: slot.x,
          y: slot.y,
          w: width,
          h: height,
          cards: options?.cards ?? [createCard(1)],
        };

        return [...previous, nextSection];
      });
    },
    [bounds.columns, bounds.rows],
  );

  const addSectionAt = useCallback(
    (x: number, y: number, options?: AddSectionOptions) => {
      setSections((previous) => {
        const width = options?.width ?? 4;
        const height = options?.height ?? 4;
        const nextIndex = previous.length + 1;
        const buildCandidate = (candidateX: number, candidateY: number) =>
          clampSectionToBounds(
            {
              id: buildId("section"),
              title: options?.title ?? `Section ${nextIndex}`,
              x: candidateX,
              y: candidateY,
              w: width,
              h: height,
              cards: options?.cards ?? [createCard(1)],
            },
            bounds,
          );

        const candidate = buildCandidate(x, y);
        if (!collidesWithAny(candidate, previous)) {
          return [...previous, candidate];
        }

        let nearestCandidate: DashboardSection | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        for (let row = 1; row <= bounds.rows; row += 1) {
          for (let column = 1; column <= bounds.columns; column += 1) {
            const probe = buildCandidate(column, row);
            if (probe.x !== column || probe.y !== row) {
              continue;
            }

            if (collidesWithAny(probe, previous)) {
              continue;
            }

            const distance = Math.abs(column - x) + Math.abs(row - y);
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestCandidate = probe;
            }
          }
        }

        if (nearestCandidate) {
          return [...previous, nearestCandidate];
        }

        const fallbackSlot = findOpenSlot(previous, bounds, { w: width, h: height });
        if (!fallbackSlot) {
          return previous;
        }

        const fallbackCandidate = buildCandidate(fallbackSlot.x, fallbackSlot.y);
        if (collidesWithAny(fallbackCandidate, previous)) {
          return previous;
        }

        return [...previous, fallbackCandidate];
      });
    },
    [bounds.columns, bounds.rows],
  );

  const splitSectionWithNew = useCallback(
    (hoveredSectionId: string, placement: SplitPlacement) => {
      setSections((previous) => {
        const hoveredSection = previous.find((section) => section.id === hoveredSectionId);
        if (!hoveredSection) {
          return previous;
        }

        const hoveredMinW = minWidth(hoveredSection);
        const hoveredMinH = minHeight(hoveredSection);
        const canSplitVertically = hoveredSection.w >= hoveredMinW * 2;
        const canSplitHorizontally = hoveredSection.h >= hoveredMinH * 2;

        if (!canSplitVertically && !canSplitHorizontally) {
          return previous;
        }

        const useVertical = placement.orientation === "vertical";
        if (useVertical && !canSplitVertically) {
          return previous;
        }

        if (!useVertical && !canSplitHorizontally) {
          return previous;
        }

        const nextIndex = previous.length + 1;

        let updatedHovered: DashboardSection;
        let newSection: DashboardSection;

        if (useVertical) {
          const leftWidth = Math.floor(hoveredSection.w / 2);
          const rightWidth = hoveredSection.w - leftWidth;
          const dropOnLeft = placement.side === "left";

          if (dropOnLeft) {
            updatedHovered = {
              ...hoveredSection,
              x: hoveredSection.x + leftWidth,
              w: rightWidth,
            };
            newSection = {
              id: buildId("section"),
              title: `Section ${nextIndex}`,
              x: hoveredSection.x,
              y: hoveredSection.y,
              w: leftWidth,
              h: hoveredSection.h,
              cards: [createCard(1)],
            };
          } else {
            updatedHovered = {
              ...hoveredSection,
              w: leftWidth,
            };
            newSection = {
              id: buildId("section"),
              title: `Section ${nextIndex}`,
              x: hoveredSection.x + leftWidth,
              y: hoveredSection.y,
              w: rightWidth,
              h: hoveredSection.h,
              cards: [createCard(1)],
            };
          }
        } else {
          const topHeight = Math.floor(hoveredSection.h / 2);
          const bottomHeight = hoveredSection.h - topHeight;
          const dropOnTop = placement.side === "top";

          if (dropOnTop) {
            updatedHovered = {
              ...hoveredSection,
              y: hoveredSection.y + topHeight,
              h: bottomHeight,
            };
            newSection = {
              id: buildId("section"),
              title: `Section ${nextIndex}`,
              x: hoveredSection.x,
              y: hoveredSection.y,
              w: hoveredSection.w,
              h: topHeight,
              cards: [createCard(1)],
            };
          } else {
            updatedHovered = {
              ...hoveredSection,
              h: topHeight,
            };
            newSection = {
              id: buildId("section"),
              title: `Section ${nextIndex}`,
              x: hoveredSection.x,
              y: hoveredSection.y + topHeight,
              w: hoveredSection.w,
              h: bottomHeight,
              cards: [createCard(1)],
            };
          }
        }

        if (
          updatedHovered.w < minWidth(updatedHovered) ||
          updatedHovered.h < minHeight(updatedHovered) ||
          newSection.w < minWidth(newSection) ||
          newSection.h < minHeight(newSection)
        ) {
          return previous;
        }

        const nextSections = previous.map((section) =>
          section.id === hoveredSection.id ? updatedHovered : section,
        );

        for (const section of nextSections) {
          if (sectionsOverlap(section, newSection)) {
            return previous;
          }
        }

        return [...nextSections, newSection];
      });
    },
    [],
  );

  const splitSection = useCallback((sectionId: string, orientation: SplitOrientation) => {
    setSections((previous) => {
      const section = previous.find((candidate) => candidate.id === sectionId);
      if (!section) {
        return previous;
      }

      const nextIndex = previous.length + 1;
      const canSplitVertically = section.w >= minWidth(section) * 2;
      const canSplitHorizontally = section.h >= minHeight(section) * 2;

      if (orientation === "vertical" && !canSplitVertically) {
        return previous;
      }

      if (orientation === "horizontal" && !canSplitHorizontally) {
        return previous;
      }

      let updatedSection: DashboardSection;
      let newSection: DashboardSection;

      if (orientation === "vertical") {
        const leftWidth = Math.floor(section.w / 2);
        const rightWidth = section.w - leftWidth;

        updatedSection = {
          ...section,
          w: leftWidth,
        };

        newSection = {
          id: buildId("section"),
          title: `Section ${nextIndex}`,
          x: section.x + leftWidth,
          y: section.y,
          w: rightWidth,
          h: section.h,
          cards: [createCard(1)],
        };
      } else {
        const topHeight = Math.floor(section.h / 2);
        const bottomHeight = section.h - topHeight;

        updatedSection = {
          ...section,
          h: topHeight,
        };

        newSection = {
          id: buildId("section"),
          title: `Section ${nextIndex}`,
          x: section.x,
          y: section.y + topHeight,
          w: section.w,
          h: bottomHeight,
          cards: [createCard(1)],
        };
      }

      if (
        updatedSection.w < minWidth(updatedSection) ||
        updatedSection.h < minHeight(updatedSection) ||
        newSection.w < minWidth(newSection) ||
        newSection.h < minHeight(newSection)
      ) {
        return previous;
      }

      const nextSections = previous.map((candidate) =>
        candidate.id === section.id ? updatedSection : candidate,
      );

      for (const candidate of nextSections) {
        if (sectionsOverlap(candidate, newSection)) {
          return previous;
        }
      }

      return [...nextSections, newSection];
    });
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setSections((previous) => {
      const removed = previous.find((section) => section.id === sectionId);
      if (!removed) {
        return previous;
      }

      const remaining = previous.filter((section) => section.id !== sectionId);
      const filler = findGapFiller(removed, remaining);

      if (!filler) {
        return remaining;
      }

      const next = remaining.map((section) => (section.id === filler.id ? filler.next : section));
      return isValidLayout(next, bounds) ? next : remaining;
    });
  }, [bounds.columns, bounds.rows]);

  const addCardToSection = useCallback((sectionId: string) => {
    setSections((previous) =>
      previous.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const nextCard = createCard(section.cards.length + 1);
        return {
          ...section,
          cards: [...section.cards, nextCard],
        };
      }),
    );
  }, []);

  const removeCardFromSection = useCallback((sectionId: string, cardId: string) => {
    setSections((previous) =>
      previous.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          cards: section.cards.filter((card) => card.id !== cardId),
        };
      }),
    );
  }, []);

  const resetSections = useCallback(
    (nextSections: DashboardSection[]) => {
      setSections(nextSections.map((section) => clampSectionToBounds(section, bounds)));
    },
    [bounds.columns, bounds.rows],
  );

  const actions = useMemo(
    () => ({
      moveSection,
      swapSections,
      resizeSection,
      resizeBoundary,
      resizeSegment,
      addSection,
      addSectionAt,
      splitSectionWithNew,
      splitSection,
      removeSection,
      addCardToSection,
      removeCardFromSection,
      resetSections,
    }),
    [
      addCardToSection,
      addSection,
      moveSection,
      removeCardFromSection,
      removeSection,
      resetSections,
      resizeSection,
      resizeBoundary,
      resizeSegment,
      swapSections,
      addSectionAt,
      splitSectionWithNew,
      splitSection,
    ],
  );

  return {
    sections,
    actions,
  };
}
