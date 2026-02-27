import type { DashboardBounds, DashboardSection } from "../types";
import { buildSegmentParticipants } from "./participants";

export type SeparatorPreview = {
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

export type BoundaryGuide = {
    key: string;
    orientation: "vertical" | "horizontal";
    boundary: number;
    offsetX: number;
    offsetY: number;
    length: number;
};

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

    const participants = buildSegmentParticipants(
        sections,
        section,
        neighbor,
        direction,
    );

    const deltas = [-1, 1];

    for (const delta of deltas) {
        const next =
            participants.direction === "e"
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
                : sections.map((candidate) => {
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
                });

        if (isValidLocalLayout(next, bounds)) {
            return true;
        }
    }

    return false;
}

export function buildSeparators(
    sections: DashboardSection[],
    bounds: DashboardBounds,
    columnSize: number,
    rowSize: number,
    gap: number,
    gridPaddingPx: number,
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
                    offsetX: offsetX + gridPaddingPx,
                    offsetY: offsetY + gridPaddingPx,
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
                    offsetX: offsetX + gridPaddingPx,
                    offsetY: offsetY + gridPaddingPx,
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

export function buildBoundaryGuides(
    separators: SeparatorPreview[],
    columnSize: number,
    rowSize: number,
    gap: number,
    gridPaddingPx: number,
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
                    offsetX: offsetX + gridPaddingPx,
                    offsetY: offsetY + gridPaddingPx,
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
                offsetX: offsetX + gridPaddingPx,
                offsetY: offsetY + gridPaddingPx,
                length,
            });
        }
    }

    return guides;
}
