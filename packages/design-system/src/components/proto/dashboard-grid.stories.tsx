import { useMemo, useState } from "react";

import { Button } from "@design-system/components/ui/button";
import { type DashboardSection, useDashboardLayout, DashboardBuilder } from "./dashboard-builder";


type StoryArgs = {
  columns: number;
  rows: number;
  gap: number;
  canvasHeight: number;
};

const INITIAL_LAYOUT: DashboardSection[] = [
  {
    id: "section-left",
    title: "Left rail",
    x: 1,
    y: 1,
    w: 3,
    h: 10,
    cards: [
      {
        id: "card-left-1",
        title: "Navigation",
        content: "Sticky tools and quick access",
      },
    ],
  },
  {
    id: "section-top",
    title: "Top section",
    x: 4,
    y: 1,
    w: 9,
    h: 4,
    cards: [{ id: "card-top-1", title: "KPI summary", content: "Overview widgets" }],
  },
  {
    id: "section-bottom-left",
    title: "Bottom left",
    x: 4,
    y: 5,
    w: 5,
    h: 6,
    cards: [
      {
        id: "card-bottom-left-1",
        title: "Activity",
        content: "Feed and latest events",
      },
    ],
  },
  {
    id: "section-right-top",
    title: "Right top",
    x: 9,
    y: 5,
    w: 4,
    h: 2,
    cards: [{ id: "card-right-top-1", title: "Stats", content: "Compact metrics" }],
  },
  {
    id: "section-right-bottom",
    title: "Right bottom",
    x: 9,
    y: 7,
    w: 4,
    h: 4,
    cards: [
      {
        id: "card-right-bottom-1",
        title: "Details",
        content: "Drilldown data",
      },
    ],
  },
];

function InteractiveDashboardStory({ columns, rows, gap, canvasHeight }: StoryArgs) {
  const [localColumns, setLocalColumns] = useState(columns);
  const [localRows, setLocalRows] = useState(rows);
  const [localGap, setLocalGap] = useState(gap);
  const [localHeight, setLocalHeight] = useState(canvasHeight);
  const initialLayout = useMemo(() => INITIAL_LAYOUT, []);

  const { sections, actions } = useDashboardLayout({
    bounds: { columns: localColumns, rows: localRows },
    initialSections: initialLayout,
  });

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-6">
      <div className="grid grid-cols-1 gap-3 rounded-md border bg-card p-4 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          Columns ({localColumns})
          <input
            type="range"
            min={6}
            max={18}
            value={localColumns}
            onChange={(event) => setLocalColumns(Number(event.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Rows ({localRows})
          <input
            type="range"
            min={6}
            max={18}
            value={localRows}
            onChange={(event) => setLocalRows(Number(event.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Gap ({localGap}px)
          <input
            type="range"
            min={4}
            max={24}
            value={localGap}
            onChange={(event) => setLocalGap(Number(event.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Height ({localHeight}px)
          <input
            type="range"
            min={420}
            max={980}
            value={localHeight}
            onChange={(event) => setLocalHeight(Number(event.target.value))}
          />
        </label>

        <div className="md:col-span-4 flex items-center justify-end">
          <Button variant="outline" onClick={() => actions.resetSections(initialLayout)}>
            Reset to sketch layout
          </Button>
        </div>
      </div>

      <DashboardBuilder
        bounds={{ columns: localColumns, rows: localRows }}
        sections={sections}
        gap={localGap}
        canvasHeight={localHeight}
        onAddSection={() => actions.addSection()}
        onAddSectionAt={actions.addSectionAt}
        onSplitSectionWithNew={actions.splitSectionWithNew}
        onSwapSections={actions.swapSections}
        onResizeSection={actions.resizeSection}
        onResizeBoundary={actions.resizeBoundary}
        onResizeSegment={actions.resizeSegment}
        onRemoveSection={actions.removeSection}
        onAddCardToSection={actions.addCardToSection}
        onRemoveCardFromSection={actions.removeCardFromSection}
      />

      <div className="rounded-sm border bg-card p-3">
        <p className="text-sm font-medium">Live layout JSON</p>
        <pre className="max-h-[220px] overflow-auto rounded bg-muted/30 p-2 text-xs">
          {JSON.stringify(sections, null, 2)}
        </pre>
      </div>
    </div>
  );
}

const meta = {
  title: "Proto/Dashboard Builder",
  parameters: {
    layout: "fullscreen",
  },
  args: {
    columns: 12,
    rows: 10,
    gap: 8,
    canvasHeight: 680,
  },
};

// biome-ignore lint/style/noDefaultExport: Storybook CSF requires default export.
export default meta;

export const Interactive = {
  render: (args: StoryArgs) => <InteractiveDashboardStory {...args} />,
};
