import { PanelLeft, PanelRight, X } from "lucide-react";

import {
  BottomPanel,
  BottomPanelTrigger,
  BottomResizeHandle,
  CenterPanel,
  ResizableLayoutFrame,
  ResizableLayoutRoot,
  SidebarPanel,
  SidebarResizeHandle,
  SidebarTrigger,
  Sidepanel,
  SidepanelContent,
  SidepanelResizeHandle,
  SidepanelTrigger,
  TopPanel,
} from "./resizeableLayout";

function ResizablePortalLayoutStory() {
  return (
    <ResizableLayoutRoot>
      <ResizableLayoutFrame>
        <SidebarPanel>
          <SidebarResizeHandle />
          <div className="p-4">Sidebar Content</div>
        </SidebarPanel>

        <CenterPanel>
          <TopPanel className="relative">
            <SidepanelTrigger className="absolute top-3 right-3 hidden rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted md:inline-flex">
              <PanelRight />
            </SidepanelTrigger>
            <SidebarTrigger className="absolute top-3 left-3 z-30 rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted">
              <PanelLeft />
            </SidebarTrigger>
            <div>Nav</div>

            <div className="absolute right-4 bottom-4 flex flex-col gap-3 md:hidden">
              <SidepanelTrigger className="rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted">
                <PanelRight />
              </SidepanelTrigger>

              <BottomPanelTrigger className="rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted">
                <X />
              </BottomPanelTrigger>
            </div>
          </TopPanel>

          <BottomPanel>
            <BottomPanelTrigger className="absolute top-3 right-3 hidden rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted md:inline-flex">
              <X />
            </BottomPanelTrigger>
            <BottomResizeHandle />
            <div className="p-6">Bottom content</div>
          </BottomPanel>
        </CenterPanel>

        <Sidepanel>
          <SidepanelResizeHandle />

          <SidepanelContent>
            <div>Side panel content</div>
          </SidepanelContent>
        </Sidepanel>
      </ResizableLayoutFrame>
    </ResizableLayoutRoot>
  );
}

const meta = {
  title: "Proto/Resizable Layout",
  parameters: {
    layout: "fullscreen",
  },
};

// biome-ignore lint/style/noDefaultExport: Storybook CSF requires default export.
export default meta;

export const ThreePortals = {
  render: () => <ResizablePortalLayoutStory />,
};
