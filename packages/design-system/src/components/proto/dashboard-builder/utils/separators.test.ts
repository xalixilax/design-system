import { describe, expect, it } from "vitest";

import type { DashboardBounds, DashboardSection } from "../types";
import { buildSeparators } from "./separators";

const bounds: DashboardBounds = { columns: 6, rows: 4 };

const sections: DashboardSection[] = [
    { id: "left", title: "Left", x: 1, y: 1, w: 3, h: 4, cards: [] },
    { id: "right-top", title: "RightTop", x: 4, y: 1, w: 3, h: 2, cards: [] },
    { id: "right-bottom", title: "RightBottom", x: 4, y: 3, w: 3, h: 2, cards: [] },
];

describe("separators", () => {
    it("marks both vertical segments localResizable for connected cross layouts", () => {
        const separators = buildSeparators(sections, bounds, 100, 100, 8, 8).filter(
            (separator) => separator.orientation === "vertical" && separator.boundary === 4,
        );

        expect(separators).toHaveLength(2);
        expect(separators.every((separator) => separator.localResizable)).toBe(true);
    });
});
