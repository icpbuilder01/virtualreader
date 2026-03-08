import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AArrowDown,
  AArrowUp,
  ArrowLeft,
  BookMarked,
  Bookmark,
  List,
  Moon,
  Sun,
  X,
} from "lucide-react";
import React from "react";

interface ReaderControlsProps {
  isDark: boolean;
  fontSize: number;
  isBookmarked: boolean;
  showBookmarks: boolean;
  onBack: () => void;
  onToggleTheme: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onToggleBookmark: () => void;
  onToggleBookmarkPanel: () => void;
}

export default function ReaderControls({
  isDark,
  fontSize,
  isBookmarked,
  showBookmarks,
  onBack,
  onToggleTheme,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onToggleBookmark,
  onToggleBookmarkPanel,
}: ReaderControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/90 backdrop-blur-sm">
        {/* Left: Back */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1.5 font-sans"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Library</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to Library</TooltipContent>
        </Tooltip>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          {/* Font size */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onDecreaseFontSize}
                disabled={fontSize <= 12}
              >
                <AArrowDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Decrease font size</TooltipContent>
          </Tooltip>

          <span className="text-xs text-muted-foreground font-sans w-8 text-center">
            {fontSize}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onIncreaseFontSize}
                disabled={fontSize >= 28}
              >
                <AArrowUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Increase font size</TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleTheme}
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isDark ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* Bookmark controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${isBookmarked ? "text-primary" : ""}`}
                onClick={onToggleBookmark}
                data-ocid="reader.toggle"
              >
                {isBookmarked ? (
                  <BookMarked className="h-4 w-4 fill-current" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isBookmarked ? "Remove bookmark" : "Add bookmark"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showBookmarks ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleBookmarkPanel}
                data-ocid="reader.secondary_button"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bookmarks</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
