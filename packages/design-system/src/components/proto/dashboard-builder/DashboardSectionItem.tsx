import type * as React from "react";
import { useCallback } from "react";
import { motion } from "motion/react";
import { useDrag } from "react-dnd";

import { Button } from "@design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@design-system/components/ui/card";
import { cn } from "@design-system/lib/utils";

import type { DashboardCard, DashboardSection } from "./types";

export const DASHBOARD_SECTION_ITEM_TYPE = "dashboard/section";
export const DASHBOARD_NEW_SECTION_ITEM_TYPE = "dashboard/new-section";

type DashboardSectionDragItem = {
  kind: "section";
  id: string;
  w: number;
  h: number;
  originX: number;
  originY: number;
  originW: number;
  originH: number;
};

type DashboardSectionItemProps = {
  section: DashboardSection;
  isLayoutEditing: boolean;
  onRemove: (sectionId: string) => void;
  onAddCard: (sectionId: string) => void;
  onRemoveCard: (sectionId: string, cardId: string) => void;
  renderCard?: (
    card: DashboardCard,
    section: DashboardSection,
  ) => React.ReactNode;
};

export function DashboardSectionItem({
  section,
  isLayoutEditing,
  onRemove,
  onAddCard,
  onRemoveCard,
  renderCard,
}: DashboardSectionItemProps) {
  const [{ isDragging }, dragRef] = useDrag<
    DashboardSectionDragItem,
    void,
    { isDragging: boolean }
  >(
    () => ({
      type: DASHBOARD_SECTION_ITEM_TYPE,
      item: {
        kind: "section",
        id: section.id,
        w: section.w,
        h: section.h,
        originX: section.x,
        originY: section.y,
        originW: section.w,
        originH: section.h,
      },
      canDrag: isLayoutEditing,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [isLayoutEditing, section.h, section.id, section.w],
  );

  const setDragHandleRef = useCallback(
    (node: HTMLButtonElement | null) => {
      if (!node) {
        return;
      }

      void dragRef(node);
    },
    [dragRef],
  );

  return (
    <motion.div
      layout
      style={{
        willChange: "transform",
        gridColumn: `${section.x} / span ${section.w}`,
        gridRow: `${section.y} / span ${section.h}`,
      }}
      className={cn("relative min-h-0 min-w-0", isDragging && "opacity-60")}
      animate={{
        scale: isDragging ? 1.01 : 1,
        opacity: isDragging ? 0.75 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 32,
        mass: 0.6,
      }}
    >
      <Card className="relative flex h-full min-h-0 flex-col overflow-hidden border bg-card shadow-xs">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between gap-2">
            <button
              ref={setDragHandleRef}
              type="button"
              className={cn(
                "rounded-sm px-1 text-left text-sm font-semibold tracking-tight",
                isLayoutEditing
                  ? "cursor-move text-foreground hover:bg-accent/70"
                  : "cursor-default",
              )}
            >
              {section.title}
            </button>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/25 text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(section.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-2 pb-3">
          <div className="bg-muted/10 flex min-h-0 flex-1 flex-col gap-2 overflow-auto rounded-md border border-dashed border-border/80 p-2">
            {section.cards.map((card) => (
              <div
                key={card.id}
                className="rounded-md border bg-card p-2 shadow-xs"
              >
                {renderCard ? (
                  renderCard(card, section)
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{card.title}</p>
                      {card.content ? (
                        <p className="text-muted-foreground text-xs">
                          {card.content}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveCard(section.id, card.id)}
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddCard(section.id)}
            >
              Add card
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
