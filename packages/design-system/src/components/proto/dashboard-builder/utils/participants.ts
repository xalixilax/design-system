import type { DashboardSection } from "../types";

export type SegmentParticipants =
  | {
      direction: "e";
      leftIds: Set<string>;
      rightIds: Set<string>;
    }
  | {
      direction: "s";
      topIds: Set<string>;
      bottomIds: Set<string>;
    };

function intervalsOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
}

export function buildSegmentParticipants(
  sections: DashboardSection[],
  section: DashboardSection,
  neighbor: DashboardSection,
  direction: "e" | "s",
): SegmentParticipants {
  if (direction === "e") {
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
              intervalsOverlap(candidate.y, candidate.y + candidate.h, right.y, right.y + right.h),
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
              leftIds.has(left.id) && intervalsOverlap(candidate.y, candidate.y + candidate.h, left.y, left.y + left.h),
          )
        ) {
          rightIds.add(candidate.id);
          changed = true;
        }
      }
    }

    return { direction: "e", leftIds, rightIds };
  }

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
            intervalsOverlap(candidate.x, candidate.x + candidate.w, bottom.x, bottom.x + bottom.w),
        )
      ) {
        topIds.add(candidate.id);
        changed = true;
      }

      if (
        !bottomIds.has(candidate.id) &&
        candidate.y === boundary &&
        sections.some(
          (top) => topIds.has(top.id) && intervalsOverlap(candidate.x, candidate.x + candidate.w, top.x, top.x + top.w),
        )
      ) {
        bottomIds.add(candidate.id);
        changed = true;
      }
    }
  }

  return { direction: "s", topIds, bottomIds };
}
