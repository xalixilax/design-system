import { describe, expect, it } from "vitest";

import type { DashboardSection } from "../types";
import {
    applySplitPreviewToSection,
    buildSplitPreview,
    getSplitPlacementFromPreview,
} from "./new-section-preview";

const baseSection: DashboardSection = {
    id: "section-1",
    title: "Section",
    x: 1,
    y: 1,
    w: 6,
    h: 4,
    cards: [],
};

describe("new-section-preview", () => {
    it("builds a vertical right split with explicit metadata", () => {
        const preview = buildSplitPreview(baseSection, 6, 2);

        expect(preview).not.toBeNull();
        expect(preview?.mode).toBe("split");
        if (!preview || preview.mode !== "split") {
            return;
        }

        expect(preview.orientation).toBe("vertical");
        expect(preview.side).toBe("right");
        expect(preview.x).toBe(4);
        expect(preview.w).toBe(3);
    });

    it("applies a split preview by resizing the hovered section", () => {
        const splitPreview = {
            mode: "split" as const,
            hoveredSectionId: "section-1",
            orientation: "horizontal" as const,
            side: "top" as const,
            x: 1,
            y: 1,
            w: 6,
            h: 2,
        };

        const next = applySplitPreviewToSection(baseSection, splitPreview);

        expect(next.x).toBe(1);
        expect(next.y).toBe(3);
        expect(next.w).toBe(6);
        expect(next.h).toBe(2);
    });

    it("maps preview to discriminated split placement", () => {
        const splitPreview = {
            mode: "split" as const,
            hoveredSectionId: "section-1",
            orientation: "vertical" as const,
            side: "left" as const,
            x: 1,
            y: 1,
            w: 3,
            h: 4,
        };

        const placement = getSplitPlacementFromPreview(splitPreview);

        expect(placement).toEqual({ orientation: "vertical", side: "left" });
    });
});
