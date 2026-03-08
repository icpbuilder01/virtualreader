import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Library as LibraryIcon, Upload } from "lucide-react";
import React, { useState } from "react";
import type { Book } from "../backend";
import BookCard from "../components/BookCard";
import BookUploadModal from "../components/BookUploadModal";
import {
  type LocalBook,
  useGetPublicBooks,
  useGetUserLibrary,
  useRemoveBookFromLibrary,
} from "../hooks/useQueries";

export default function Library() {
  const navigate = useNavigate();

  const [uploadOpen, setUploadOpen] = useState(false);

  const {
    data: publicBooks,
    isLoading: publicLoading,
    error: publicError,
  } = useGetPublicBooks();
  const { data: userLibrary, isLoading: userLoading } = useGetUserLibrary();
  const removeBook = useRemoveBookFromLibrary();

  const handleReadPublic = (book: Book) => {
    navigate({
      to: "/reader",
      search: {
        title: book.title,
        author: book.author,
        content: book.content,
        isPublic: true,
      },
    });
  };

  const handleReadPersonal = (book: LocalBook) => {
    navigate({
      to: "/reader",
      search: {
        title: book.title,
        author: book.author,
        content: book.content,
        isPublic: false,
      },
    });
  };

  const handleDeleteBook = async (title: string) => {
    if (confirm(`Remove "${title}" from your library?`)) {
      await removeBook.mutateAsync(title);
    }
  };

  return (
    <div className="min-h-full">
      {/* Hero banner */}
      <div
        className="relative h-56 sm:h-72 flex items-end overflow-hidden"
        style={{
          backgroundImage: `url('/assets/generated/library-bg.dim_1920x1080.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
                Your Library
              </h1>
              <p className="text-muted-foreground font-sans text-sm mt-1">
                Classic literature & your personal collection, stored on-chain
              </p>
            </div>
            <Button
              onClick={() => setUploadOpen(true)}
              className="gap-2 font-sans shadow-lg"
              data-ocid="library.upload_button"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Book</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Public domain classics */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <LibraryIcon className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-semibold">
                Classic Literature
              </h2>
            </div>
          </div>

          {publicError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Failed to load public books. Please refresh.
              </AlertDescription>
            </Alert>
          )}

          {publicLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }, (_, i) => `skeleton-pub-${i}`).map(
                (key) => (
                  <div key={key} className="space-y-2">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ),
              )}
            </div>
          ) : publicBooks && publicBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {publicBooks.map((book, i) => (
                <BookCard
                  key={book.title}
                  title={book.title}
                  author={book.author}
                  isPublicDomain
                  onRead={() => handleReadPublic(book)}
                  colorIndex={i}
                />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl"
              data-ocid="library.empty_state"
            >
              <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-sans">
                No books in the public library yet.
              </p>
            </div>
          )}
        </section>

        {/* Personal library */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-semibold">My Books</h2>
              {userLibrary && userLibrary.length > 0 && (
                <span className="text-sm text-muted-foreground font-sans">
                  ({userLibrary.length})
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(true)}
              className="gap-1.5 font-sans text-xs"
              data-ocid="mybooks.upload_button"
            >
              <Upload className="h-3.5 w-3.5" />
              Add Book
            </Button>
          </div>

          {userLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 3 }, (_, i) => `skeleton-usr-${i}`).map(
                (key) => (
                  <div key={key} className="space-y-2">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ),
              )}
            </div>
          ) : userLibrary && userLibrary.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {userLibrary.map((book, i) => (
                <BookCard
                  key={book.title}
                  title={book.title}
                  author={book.author}
                  isPersonal
                  onRead={() => handleReadPersonal(book)}
                  onDelete={() => handleDeleteBook(book.title)}
                  colorIndex={i + 10}
                />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-accent/20 transition-colors"
              onClick={() => setUploadOpen(true)}
              onKeyDown={(e) => e.key === "Enter" && setUploadOpen(true)}
              data-ocid="mybooks.empty_state"
            >
              <Upload className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-foreground font-sans">
                Upload your first book
              </p>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                Supports .txt, .epub, and .pdf files
              </p>
            </div>
          )}
        </section>
      </div>

      <BookUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
