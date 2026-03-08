import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Bookmark, Trash2, X } from "lucide-react";
import React from "react";

interface BookmarkPanelProps {
  bookmarks: number[];
  currentPosition: number;
  totalLength: number;
  onJump: (position: number) => void;
  onDelete: (position: number) => void;
  onClose: () => void;
}

export default function BookmarkPanel({
  bookmarks,
  currentPosition,
  totalLength,
  onJump,
  onDelete,
  onClose,
}: BookmarkPanelProps) {
  const getProgressPercent = (pos: number) =>
    totalLength > 0 ? Math.round((pos / totalLength) * 100) : 0;

  return (
    <div className="w-72 border-l border-border bg-card flex flex-col h-full font-sans">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Bookmarks</span>
          <span className="text-xs text-muted-foreground">
            ({bookmarks.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No bookmarks yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use the bookmark button while reading to save your place.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {[...bookmarks]
              .sort((a, b) => a - b)
              .map((pos) => {
                const pct = getProgressPercent(pos);
                const isCurrent = Math.abs(pos - currentPosition) < 100;
                return (
                  <div
                    key={pos}
                    className={`flex items-center gap-2 p-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group ${
                      isCurrent ? "bg-primary/10 border border-primary/20" : ""
                    }`}
                    onClick={() => onJump(pos)}
                    onKeyDown={(e) => e.key === "Enter" && onJump(pos)}
                  >
                    <Bookmark
                      className={`h-3.5 w-3.5 flex-shrink-0 ${isCurrent ? "text-primary fill-current" : "text-muted-foreground"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{pct}% through</p>
                      <p className="text-xs text-muted-foreground">
                        Position {pos.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pos);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
