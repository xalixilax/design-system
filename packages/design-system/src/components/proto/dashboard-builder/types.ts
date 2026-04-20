export type DashboardCard = {
  id: string;
  title: string;
  content?: string;
};

export type DashboardSection = {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  cards: DashboardCard[];
};

export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type DashboardBounds = {
  columns: number;
  rows: number;
};

export type SplitPlacement =
  | {
      orientation: "vertical";
      side: "left" | "right";
    }
  | {
      orientation: "horizontal";
      side: "top" | "bottom";
    };
