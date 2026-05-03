"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import * as React from "react";

import { cn } from "@design-system/lib/utils";

type DrawerDirection = "top" | "bottom" | "left" | "right";

const directionToSwipeDirection: Record<
  DrawerDirection,
  React.ComponentProps<typeof DrawerPrimitive.Root>["swipeDirection"]
> = {
  top: "up",
  bottom: "down",
  left: "left",
  right: "right",
};

type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
  direction?: DrawerDirection;
};

const DrawerDirectionContext = React.createContext<DrawerDirection>("bottom");

function Drawer({ direction = "bottom", swipeDirection, ...props }: DrawerProps) {
  return (
    <DrawerDirectionContext.Provider value={direction}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        swipeDirection={swipeDirection ?? directionToSwipeDirection[direction]}
        {...props}
      />
    </DrawerDirectionContext.Provider>
  );
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 opacity-[calc(0.5*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:duration-0 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
        className,
      )}
      {...props}
    />
  );
}

function DrawerViewport({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Viewport>) {
  const direction = React.useContext(DrawerDirectionContext);

  return (
    <DrawerPrimitive.Viewport
      data-slot="drawer-viewport"
      data-direction={direction}
      className={cn(
        "fixed inset-0 z-50",
        "data-[direction=top]:flex data-[direction=top]:items-start data-[direction=top]:justify-center",
        "data-[direction=bottom]:flex data-[direction=bottom]:items-end data-[direction=bottom]:justify-center",
        "data-[direction=left]:flex data-[direction=left]:items-stretch data-[direction=left]:justify-start",
        "data-[direction=right]:flex data-[direction=right]:items-stretch data-[direction=right]:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DrawerPopup({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Popup>) {
  const direction = React.useContext(DrawerDirectionContext);

  return (
    <DrawerPrimitive.Popup
      data-slot="drawer-popup"
      data-direction={direction}
      className={cn(
        "group/drawer-content box-border flex shrink-0 bg-background outline-none",
        "data-[direction=top]:inset-x-0 data-[direction=top]:-mt-[3rem] data-[direction=top]:max-h-[calc(80vh+3rem)] data-[direction=top]:w-full data-[direction=top]:flex-col data-[direction=top]:overflow-hidden data-[direction=top]:rounded-b-lg data-[direction=top]:[transform:translateY(var(--drawer-swipe-movement-y))] data-[direction=top]:transition-transform data-[direction=top]:duration-[450ms] data-[direction=top]:ease-[cubic-bezier(0.32,0.72,0,1)] data-[direction=top]:data-[swiping]:select-none data-[direction=top]:data-[starting-style]:[transform:translateY(calc(-100%+3rem-2px))] data-[direction=top]:data-[ending-style]:[transform:translateY(calc(-100%+3rem-2px))] data-[direction=top]:data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
        "data-[direction=bottom]:-mb-[3rem] data-[direction=bottom]:max-h-[calc(80vh+3rem)] data-[direction=bottom]:w-full data-[direction=bottom]:flex-col data-[direction=bottom]:overflow-hidden data-[direction=bottom]:rounded-t-lg data-[direction=bottom]:[transform:translateY(var(--drawer-swipe-movement-y))] data-[direction=bottom]:transition-transform data-[direction=bottom]:duration-[450ms] data-[direction=bottom]:ease-[cubic-bezier(0.32,0.72,0,1)] data-[direction=bottom]:data-[swiping]:select-none data-[direction=bottom]:data-[starting-style]:[transform:translateY(calc(100%-3rem+2px))] data-[direction=bottom]:data-[ending-style]:[transform:translateY(calc(100%-3rem+2px))] data-[direction=bottom]:data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
        "data-[direction=left]:h-full data-[direction=left]:overflow-y-auto data-[direction=left]:[transform:translateX(var(--drawer-swipe-movement-x))] data-[direction=left]:transition-transform data-[direction=left]:duration-[450ms] data-[direction=left]:ease-[cubic-bezier(0.32,0.72,0,1)] data-[direction=left]:data-[swiping]:select-none data-[direction=left]:data-[starting-style]:[transform:translateX(calc(-100%-2px))] data-[direction=left]:data-[ending-style]:[transform:translateX(calc(-100%-2px))] data-[direction=left]:data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
        "data-[direction=right]:h-full data-[direction=right]:overflow-y-auto data-[direction=right]:[transform:translateX(var(--drawer-swipe-movement-x))] data-[direction=right]:transition-transform data-[direction=right]:duration-[450ms] data-[direction=right]:ease-[cubic-bezier(0.32,0.72,0,1)] data-[direction=right]:data-[swiping]:select-none data-[direction=right]:data-[starting-style]:[transform:translateX(calc(100%+2px))] data-[direction=right]:data-[ending-style]:[transform:translateX(calc(100%+2px))] data-[direction=right]:data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[direction=bottom]/drawer-content:block" />
      {children}
    </DrawerPrimitive.Popup>
  );
}

function DrawerContent({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return <DrawerPrimitive.Content data-slot="drawer-content" className={cn(className)} {...props} />;
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  const direction = React.useContext(DrawerDirectionContext);

  return (
    <div
      data-slot="drawer-header"
      data-direction={direction}
      className={cn(
        "flex flex-col gap-0.5 p-4 md:gap-1.5 md:text-left data-[direction=bottom]:text-center data-[direction=top]:text-center",
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerViewport,
  DrawerPopup,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
