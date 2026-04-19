import {
  LeftPortalStack,
  MainContentArea,
  Portal1,
  Portal2,
  Portal2CollapsedHitArea,
  Portal2ResizeHandle,
  Portal3,
  Portal3Content,
  Portal3ResizeHandle,
  ResizableLayoutFrame,
  ResizableLayoutRoot,
  SidebarPortal,
  SidebarResizeHandle,
  SidebarTrigger,
  useResizableLayout,
} from "./resizeableLayout";

function ResizablePortalLayoutStory() {
  const { state, actions, refs, transitions } = useResizableLayout();

  return (
    <ResizableLayoutRoot>
      <ResizableLayoutFrame ref={refs.layoutRef}>
        <SidebarPortal width={state.sidebarWidth} transition={transitions.sidebarTransition}>
          <div className="p-4">Sidebar Content</div>

          <SidebarTrigger onClick={actions.toggleSidebar}>{state.isSidebarCollapsed ? ">" : "<"}</SidebarTrigger>
        </SidebarPortal>

        <SidebarResizeHandle onMouseDown={actions.startSidebarDrag} />

        <MainContentArea ref={refs.rootRef}>
          <LeftPortalStack ref={refs.leftStackRef}>
            <Portal1>
              <div>Top content</div>
            </Portal1>

            {!state.isPortal2Collapsed ? <Portal2ResizeHandle onMouseDown={actions.startPortal2Drag} /> : null}

            <Portal2 height={state.portal2Height} transition={transitions.portal2Transition}>
              {!state.isPortal2Collapsed ? <div className="p-6">Bottom content</div> : null}
            </Portal2>

            {state.isPortal2Collapsed ? <Portal2CollapsedHitArea onMouseDown={actions.startPortal2Drag} /> : null}
          </LeftPortalStack>

          <Portal3ResizeHandle
            hidden={state.isPortal3Collapsed}
            transition={transitions.portal3Transition}
            onMouseDown={actions.startPortal3Drag}
          />

          <Portal3
            width={state.portal3Width}
            isCollapsed={state.isPortal3Collapsed}
            transition={transitions.portal3Transition}
          >
            <Portal3Content isCollapsed={state.isPortal3Collapsed}>
              <div>Side panel content</div>
            </Portal3Content>
          </Portal3>

          {state.isPortal3Collapsed ? (
            <button
              id="right-collapsible-trigger"
              type="button"
              onClick={actions.openPortal3}
              className="absolute right-3 top-3 rounded-md border bg-background px-2 py-1 text-xs shadow-sm hover:bg-muted"
            >
              Open portal 3
            </button>
          ) : null}
        </MainContentArea>
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
