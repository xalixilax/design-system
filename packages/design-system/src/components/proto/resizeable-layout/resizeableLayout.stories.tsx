import { AppSidebar } from "@design-system/components/app-sidebar";
import { SidebarProvider } from "@design-system/components/ui/sidebar";
import { PanelLeft, PanelRight, X } from "lucide-react";
import type { CSSProperties } from "react";

import {
  BottomPanel,
  BottomPanelTrigger,
  BottomResizeHandle,
  CenterPanel,
  ResizableLayoutFrame,
  ResizableLayoutRoot,
  SidebarPanel,
  SidebarPanelContent,
  SidebarResizeHandle,
  SidebarTrigger,
  Sidepanel,
  SidepanelContent,
  SidepanelResizeHandle,
  SidepanelTrigger,
  TopPanel,
  useResizableLayoutValue,
} from "./resizeableLayout";

const storySidebarStyle: CSSProperties & Record<"--sidebar-width" | "--sidebar-width-icon", string> = {
  "--sidebar-width": "100%",
  "--sidebar-width-icon": "3rem",
};

function StorySidebarPanel() {
  const { actions, state } = useResizableLayoutValue();
  const providerStyle: CSSProperties & Record<"--sidebar-width" | "--sidebar-width-icon", string> = {
    ...storySidebarStyle,
    "--sidebar-width-icon": `${state.sidebarWidth}px`,
  };

  return (
    <SidebarProvider
      open={!state.isSidebarCollapsed}
      onOpenChange={(open) => {
        if (open === state.isSidebarCollapsed) {
          actions.toggleSidebar();
        }
      }}
      className="h-full min-h-0"
      style={providerStyle}
    >
      <AppSidebar
        collapsible="icon"
        contained
        className="h-full w-full border-r border-sidebar-border"
      />
    </SidebarProvider>
  );
}

function ResizablePortalLayoutStory() {
  return (
    <ResizableLayoutRoot>
      <ResizableLayoutFrame>
        <SidebarPanel className="overflow-hidden">
          <SidebarResizeHandle />
          <SidebarPanelContent className="overflow-hidden">
            <StorySidebarPanel />
          </SidebarPanelContent>
        </SidebarPanel>

        <CenterPanel>
          <TopPanel className="bg-muted/20">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
              <SidebarTrigger className="rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted">
                <PanelLeft />
              </SidebarTrigger>

              <SidepanelTrigger className="hidden rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted md:inline-flex">
                <PanelRight />
              </SidepanelTrigger>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
              <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <section className="rounded-xl border bg-background p-6 shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground">Overview</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Workspace dashboard</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    The app sidebar is mounted inside the left resizable panel, stays clipped to that panel, and
                    switches to the layout drawer on mobile.
                  </p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border bg-background p-5 shadow-sm">
                    <p className="text-sm text-muted-foreground">Active sessions</p>
                    <p className="mt-3 text-3xl font-semibold">128</p>
                  </div>
                  <div className="rounded-xl border bg-background p-5 shadow-sm">
                    <p className="text-sm text-muted-foreground">Conversion rate</p>
                    <p className="mt-3 text-3xl font-semibold">24.8%</p>
                  </div>
                  <div className="rounded-xl border bg-background p-5 shadow-sm">
                    <p className="text-sm text-muted-foreground">Open reviews</p>
                    <p className="mt-3 text-3xl font-semibold">9</p>
                  </div>
                </section>

                <section className="rounded-xl border bg-background p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">Recent activity</h3>
                      <p className="text-sm text-muted-foreground">
                        Mock content to validate scrolling and panel sizing.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {[
                      "Design tokens synchronized across packages",
                      "Storybook prototypes reviewed with product",
                      "Authentication package updated for new providers",
                      "Database migrations prepared for staging",
                    ].map((item) => (
                      <div key={item} className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border bg-background p-6 shadow-sm">
                  <h3 className="text-lg font-semibold">Long content</h3>
                  <div className="mt-4 grid gap-3">
                    {Array.from({ length: 12 }, (_, index) => (
                      <div key={index} className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                        Scroll validation row {index + 1}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="absolute right-4 bottom-4 flex flex-col gap-3 md:hidden">
              <SidepanelTrigger className="rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted">
                <PanelRight />
              </SidepanelTrigger>

              <BottomPanelTrigger className="rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted">
                <X />
              </BottomPanelTrigger>
            </div>
          </TopPanel>

          <BottomPanel className="border-t bg-background">
            <BottomResizeHandle />
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
                <p className="text-sm font-medium text-muted-foreground">Bottom panel</p>
                <BottomPanelTrigger className="inline-flex rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted">
                  <X />
                </BottomPanelTrigger>
              </div>

              <div className="min-h-0 flex-1 overflow-auto p-6">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                    Logs and inspector content can live here.
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                    The panel remains independently resizable on desktop.
                  </div>
                </div>
              </div>
            </div>
          </BottomPanel>
        </CenterPanel>

        <Sidepanel className="overflow-hidden border-l bg-background">
          <SidepanelResizeHandle />

          <SidepanelContent className="flex h-full flex-col overflow-hidden p-0">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inspector</p>
                <h3 className="text-lg font-semibold">Selected view</h3>
              </div>

              <SidepanelTrigger className="inline-flex rounded-sm border bg-background p-1 text-muted-foreground shadow-sm hover:bg-muted">
                <PanelRight />
              </SidepanelTrigger>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-6">
              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                Secondary content stays inside the right panel and moves into the bottom drawer on mobile.
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-lg border p-4 text-sm">Layout metadata</div>
                <div className="rounded-lg border p-4 text-sm">Collaboration activity</div>
                <div className="rounded-lg border p-4 text-sm">Draft settings</div>
                <div className="rounded-lg border p-4 text-sm">Quality checks</div>
                <div className="rounded-lg border p-4 text-sm">Publishing status</div>
              </div>
            </div>
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
