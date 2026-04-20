import { describe, expect, it } from "vitest";

import type { DashboardSection } from "../types";
import { buildSegmentParticipants } from "./participants";

const sections: DashboardSection[] = [
  { id: "left", title: "Left", x: 1, y: 1, w: 3, h: 4, cards: [] },
  { id: "right-top", title: "RightTop", x: 4, y: 1, w: 3, h: 2, cards: [] },
  { id: "right-bottom", title: "RightBottom", x: 4, y: 3, w: 3, h: 2, cards: [] },
  { id: "top", title: "Top", x: 1, y: 1, w: 6, h: 2, cards: [] },
  { id: "bottom-left", title: "BottomLeft", x: 1, y: 3, w: 3, h: 2, cards: [] },
  { id: "bottom-right", title: "BottomRight", x: 4, y: 3, w: 3, h: 2, cards: [] },
];

describe("participants", () => {
  it("expands vertical participants across connected overlaps", () => {
    const left = sections.find((section) => section.id === "left");
    const rightTop = sections.find((section) => section.id === "right-top");
    if (!left || !rightTop) {
      throw new Error("Missing fixture sections");
    }

    const participants = buildSegmentParticipants(sections, left, rightTop, "e");

    expect(participants.direction).toBe("e");
    if (participants.direction !== "e") {
      return;
    }

    expect([...participants.leftIds]).toContain("left");
    expect([...participants.rightIds]).toEqual(expect.arrayContaining(["right-top", "right-bottom"]));
  });

  it("expands horizontal participants across connected overlaps", () => {
    const top = sections.find((section) => section.id === "top");
    const bottomLeft = sections.find((section) => section.id === "bottom-left");
    if (!top || !bottomLeft) {
      throw new Error("Missing fixture sections");
    }

    const participants = buildSegmentParticipants(sections, top, bottomLeft, "s");

    expect(participants.direction).toBe("s");
    if (participants.direction !== "s") {
      return;
    }

    expect([...participants.topIds]).toContain("top");
    expect([...participants.bottomIds]).toEqual(expect.arrayContaining(["bottom-left", "bottom-right"]));
  });
});
