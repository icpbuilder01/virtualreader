import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Book } from "../backend";
import { useActor } from "./useActor";

// ── Local storage keys ────────────────────────────────────────────────────────

const LOCAL_LIBRARY_KEY = "kindle-local-library";
const LOCAL_PROGRESS_KEY = "kindle-local-progress";
// LOCAL_BOOKMARKS_KEY not needed - bookmarks stored within progress key

// ── Local Book type (stored in localStorage) ──────────────────────────────────

export interface LocalBook {
  title: string;
  author: string;
  content: string;
  addedAt: number;
}

export interface LocalProgress {
  position: number;
  bookmarks: number[];
}

// ── Local library helpers ─────────────────────────────────────────────────────

function getLocalLibrary(): LocalBook[] {
  try {
    const raw = localStorage.getItem(LOCAL_LIBRARY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLibrary(books: LocalBook[]) {
  localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(books));
}

function getLocalProgress(title: string): LocalProgress {
  try {
    const raw = localStorage.getItem(`${LOCAL_PROGRESS_KEY}:${title}`);
    return raw ? JSON.parse(raw) : { position: 0, bookmarks: [] };
  } catch {
    return { position: 0, bookmarks: [] };
  }
}

function saveLocalProgress(title: string, progress: LocalProgress) {
  localStorage.setItem(
    `${LOCAL_PROGRESS_KEY}:${title}`,
    JSON.stringify(progress),
  );
}

// ── Public Books ──────────────────────────────────────────────────────────────

export function useGetPublicBooks() {
  const { actor, isFetching } = useActor();

  return useQuery<Book[]>({
    queryKey: ["publicBooks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicBooks();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Local User Library ────────────────────────────────────────────────────────

export function useGetUserLibrary() {
  return useQuery<LocalBook[]>({
    queryKey: ["localLibrary"],
    queryFn: () => getLocalLibrary(),
    staleTime: 0,
  });
}

export function useAddBookToLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      author,
      content,
    }: {
      title: string;
      author: string;
      content: string;
      fileBytes?: Uint8Array<ArrayBuffer>;
      onProgress?: (pct: number) => void;
    }) => {
      const library = getLocalLibrary();
      // Replace if title already exists, otherwise add
      const exists = library.findIndex((b) => b.title === title);
      const book: LocalBook = { title, author, content, addedAt: Date.now() };
      if (exists >= 0) {
        library[exists] = book;
      } else {
        library.push(book);
      }
      saveLocalLibrary(library);

      // Simulate progress callback
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localLibrary"] });
    },
  });
}

export function useRemoveBookFromLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const library = getLocalLibrary().filter((b) => b.title !== title);
      saveLocalLibrary(library);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localLibrary"] });
    },
  });
}

// ── Reading Progress & Bookmarks (local) ──────────────────────────────────────

export function useGetBookProgress(title: string) {
  return useQuery<LocalProgress | null>({
    queryKey: ["localProgress", title],
    queryFn: () => (title ? getLocalProgress(title) : null),
    enabled: !!title,
    staleTime: 0,
  });
}

export function useUpdateBookProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      position,
    }: { title: string; position: number }) => {
      const progress = getLocalProgress(title);
      saveLocalProgress(title, { ...progress, position });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["localProgress", vars.title],
      });
    },
  });
}

export function useAddBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      position,
    }: { title: string; position: number }) => {
      const progress = getLocalProgress(title);
      if (!progress.bookmarks.some((b) => Math.abs(b - position) < 50)) {
        saveLocalProgress(title, {
          ...progress,
          bookmarks: [...progress.bookmarks, position],
        });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["localProgress", vars.title],
      });
    },
  });
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      position,
    }: { title: string; position: number }) => {
      const progress = getLocalProgress(title);
      saveLocalProgress(title, {
        ...progress,
        bookmarks: progress.bookmarks.filter(
          (b) => Math.abs(b - position) >= 50,
        ),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["localProgress", vars.title],
      });
    },
  });
}
