import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, User } from "lucide-react";
import React from "react";

interface BookCardProps {
  title: string;
  author: string;
  isPublicDomain?: boolean;
  isPersonal?: boolean;
  onRead: () => void;
  onDelete?: () => void;
  colorIndex?: number;
}

const SPINE_COLORS = [
  "from-amber-700 to-amber-900",
  "from-emerald-700 to-emerald-900",
  "from-blue-700 to-blue-900",
  "from-rose-700 to-rose-900",
  "from-violet-700 to-violet-900",
  "from-teal-700 to-teal-900",
  "from-orange-700 to-orange-900",
  "from-indigo-700 to-indigo-900",
];

export default function BookCard({
  title,
  author,
  isPublicDomain,
  isPersonal,
  onRead,
  onDelete,
  colorIndex = 0,
}: BookCardProps) {
  const idx = colorIndex % SPINE_COLORS.length;
  const gradientClass = SPINE_COLORS[idx];

  return (
    <div
      className="book-card-hover group relative flex flex-col rounded-lg overflow-hidden border border-border bg-card shadow-book hover:shadow-book-hover cursor-pointer"
      onClick={onRead}
      onKeyDown={(e) => e.key === "Enter" && onRead()}
    >
      {/* Book cover */}
      <div
        className={`relative h-48 bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center p-4 text-white`}
      >
        {/* Spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20" />
        {/* Texture overlay */}
        <div className="absolute inset-0 opacity-10 parchment-texture" />

        <BookOpen className="h-10 w-10 mb-3 opacity-80" />
        <h3 className="font-serif font-semibold text-center text-sm leading-tight line-clamp-3 drop-shadow">
          {title}
        </h3>
      </div>

      {/* Book info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div className="flex items-start gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-xs text-muted-foreground font-sans line-clamp-1">
            {author}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {isPublicDomain && (
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0 font-sans"
            >
              Classic
            </Badge>
          )}
          {isPersonal && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 font-sans">
              My Library
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 mt-auto pt-1">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs gap-1 font-sans"
            onClick={(e) => {
              e.stopPropagation();
              onRead();
            }}
          >
            Read <ChevronRight className="h-3 w-3" />
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Remove from library"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
