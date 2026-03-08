import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useSearch } from "@tanstack/react-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import BookmarkPanel from "../components/BookmarkPanel";
import ProgressBar from "../components/ProgressBar";
import ReaderControls from "../components/ReaderControls";
import {
  type LocalProgress,
  useAddBookmark,
  useGetBookProgress,
  useRemoveBookmark,
  useUpdateBookProgress,
} from "../hooks/useQueries";

interface ReaderSearch {
  title: string;
  author: string;
  content: string;
  isPublic: boolean;
}

const FONT_SIZE_KEY = "kindle-font-size";
const READER_THEME_KEY = "kindle-reader-theme";

export default function Reader() {
  const search = useSearch({ from: "/reader" }) as ReaderSearch;
  const navigate = useNavigate();

  const { title, author, content } = search;

  // ── Reader state ──────────────────────────────────────────────────────────
  const [fontSize, setFontSize] = useState<number>(() => {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    return stored ? Number.parseInt(stored, 10) : 18;
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(READER_THEME_KEY);
    if (stored) return stored === "dark";
    return document.documentElement.classList.contains("dark");
  });

  const [showBookmarks, setShowBookmarks] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Local progress hooks ──────────────────────────────────────────────────
  const { data: progress } = useGetBookProgress(title) as {
    data: LocalProgress | null | undefined;
  };
  const updateProgress = useUpdateBookProgress();
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  const bookmarks = progress?.bookmarks ?? [];
  const savedPosition = progress?.position ?? 0;

  // ── Restore saved position ────────────────────────────────────────────────
  useEffect(() => {
    if (savedPosition > 0 && scrollRef.current) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = savedPosition;
          setScrollPosition(savedPosition);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [savedPosition]);

  // ── Persist font size & theme ─────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem(READER_THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  // ── Scroll handler with debounced progress save ───────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pos = el.scrollTop;
    setScrollPosition(pos);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateProgress.mutate({ title, position: Math.round(pos) });
    }, 1500);
  }, [title, updateProgress]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [handleScroll]);

  // ── Bookmark helpers ──────────────────────────────────────────────────────
  const currentPositionRounded = Math.round(scrollPosition);
  const isCurrentPositionBookmarked = bookmarks.some(
    (b) => Math.abs(b - currentPositionRounded) < 50,
  );

  const handleToggleBookmark = () => {
    if (isCurrentPositionBookmarked) {
      const closest = bookmarks.find(
        (b) => Math.abs(b - currentPositionRounded) < 50,
      );
      if (closest !== undefined) {
        removeBookmark.mutate({ title, position: closest });
      }
    } else {
      addBookmark.mutate({ title, position: currentPositionRounded });
    }
  };

  const handleJumpToBookmark = (pos: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = pos;
      setScrollPosition(pos);
    }
  };

  const handleDeleteBookmark = (pos: number) => {
    removeBookmark.mutate({ title, position: pos });
  };

  // ── Total scroll height ───────────────────────────────────────────────────
  const totalHeight = scrollRef.current
    ? scrollRef.current.scrollHeight - scrollRef.current.clientHeight
    : content.length;

  // ── Reader theme styles ───────────────────────────────────────────────────
  const readerBg = isDark ? "#1a1a2e" : "#e8e0d0";
  const readerText = isDark ? "#e8e0d0" : "#2a2018";
  const readerBgPage = isDark ? "#1e1e30" : "#ede5d5";

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: readerBg, color: readerText }}
    >
      {/* Controls toolbar */}
      <div
        style={{
          background: isDark ? "#16162a" : "#ddd5c4",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
        }}
      >
        <ReaderControls
          isDark={isDark}
          fontSize={fontSize}
          isBookmarked={isCurrentPositionBookmarked}
          showBookmarks={showBookmarks}
          onBack={() => navigate({ to: "/" })}
          onToggleTheme={() => setIsDark((d) => !d)}
          onIncreaseFontSize={() => setFontSize((f) => Math.min(28, f + 1))}
          onDecreaseFontSize={() => setFontSize((f) => Math.max(12, f - 1))}
          onToggleBookmark={handleToggleBookmark}
          onToggleBookmarkPanel={() => setShowBookmarks((s) => !s)}
        />
      </div>

      {/* Book title bar */}
      <div
        className="px-6 py-2 border-b flex items-center justify-between"
        style={{
          background: isDark ? "#16162a" : "#ddd5c4",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
        }}
      >
        <div>
          <h1
            className="font-serif font-semibold text-sm sm:text-base leading-tight"
            style={{ color: readerText }}
          >
            {title}
          </h1>
          <p
            className="text-xs font-sans opacity-60"
            style={{ color: readerText }}
          >
            {author}
          </p>
        </div>
      </div>

      {/* Main reading area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          style={{ background: readerBgPage }}
        >
          <div className="max-w-2xl lg:max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-14">
            <div
              className="reader-content whitespace-pre-wrap"
              style={{
                fontSize: `${fontSize}px`,
                color: readerText,
                lineHeight: "1.9",
                letterSpacing: "0.01em",
              }}
            >
              {content}
            </div>
            {/* End of book */}
            <div
              className="mt-16 pt-8 border-t text-center"
              style={{
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
              }}
            >
              <p
                className="font-serif text-lg opacity-50"
                style={{ color: readerText }}
              >
                — End of {title} —
              </p>
            </div>
          </div>
        </div>

        {/* Bookmark panel */}
        {showBookmarks && (
          <div
            className="hidden sm:flex flex-col border-l"
            style={{
              background: isDark ? "#1a1a2e" : "#e8e0d0",
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.1)",
              width: "280px",
            }}
          >
            <BookmarkPanel
              bookmarks={bookmarks}
              currentPosition={currentPositionRounded}
              totalLength={totalHeight}
              onJump={handleJumpToBookmark}
              onDelete={handleDeleteBookmark}
              onClose={() => setShowBookmarks(false)}
            />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: isDark ? "#16162a" : "#ddd5c4",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
        }}
      >
        <ProgressBar position={scrollPosition} total={totalHeight} />
      </div>
    </div>
  );
}
