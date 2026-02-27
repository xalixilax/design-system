import type { DashboardBounds, DashboardSection, SplitPlacement } from "../types";

export type NewSectionPreview =
    | ({
        mode: "split";
        hoveredSectionId: string;
        x: number;
        y: number;
        w: number;
        h: number;
    } & SplitPlacement)
    | {
        mode: "place";
        x: number;
        y: number;
        w: number;
        h: number;
    };

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

export function findNearestPlacementPreview(
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

export function buildSplitPreview(
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
                orientation: "vertical",
                side: "left",
                x: section.x,
                y: section.y,
                w: leftWidth,
                h: section.h,
            }
            : {
                mode: "split",
                hoveredSectionId: section.id,
                orientation: "vertical",
                side: "right",
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
            orientation: "horizontal",
            side: "top",
            x: section.x,
            y: section.y,
            w: section.w,
            h: topHeight,
        }
        : {
            mode: "split",
            hoveredSectionId: section.id,
            orientation: "horizontal",
            side: "bottom",
            x: section.x,
            y: section.y + topHeight,
            w: section.w,
            h: bottomHeight,
        };
}

export function applySplitPreviewToSection(
    section: DashboardSection,
    preview: Extract<NewSectionPreview, { mode: "split" }>,
) {
    if (section.id !== preview.hoveredSectionId) {
        return section;
    }

    if (preview.orientation === "vertical") {
        return preview.side === "left"
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

    return preview.side === "top"
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

export function getSplitPlacementFromPreview(
    preview: Extract<NewSectionPreview, { mode: "split" }>,
): SplitPlacement {
    if (preview.orientation === "vertical") {
        return {
            orientation: "vertical",
            side: preview.side === "left" ? "left" : "right",
        };
    }

    return {
        orientation: "horizontal",
        side: preview.side === "top" ? "top" : "bottom",
    };
}
