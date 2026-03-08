import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useAddBookToLibrary } from "../hooks/useQueries";
import { parseBookFile } from "../utils/fileParser";

interface BookUploadModalProps {
  open: boolean;
  onClose: () => void;
}

type UploadState = "idle" | "parsing" | "uploading" | "success" | "error";

export default function BookUploadModal({
  open,
  onClose,
}: BookUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titleOverride, setTitleOverride] = useState("");
  const [authorOverride, setAuthorOverride] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addBook = useAddBookToLibrary();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTitleOverride("");
      setAuthorOverride("");
      setUploadState("idle");
      setErrorMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadState("parsing");
    setErrorMessage("");
    setUploadProgress(0);

    try {
      const parsed = await parseBookFile(selectedFile);
      const title = titleOverride.trim() || parsed.title;
      const author = authorOverride.trim() || parsed.author;

      setUploadState("uploading");

      // Explicitly type as ArrayBuffer to satisfy Uint8Array<ArrayBuffer>
      const arrayBuffer = (await selectedFile.arrayBuffer()) as ArrayBuffer;
      const fileBytes = new Uint8Array(arrayBuffer);

      // Simulate progress for local storage save
      setUploadProgress(50);
      await addBook.mutateAsync({
        title,
        author,
        content: parsed.content,
        fileBytes,
        onProgress: (pct) => setUploadProgress(pct),
      });
      setUploadProgress(100);

      setUploadState("success");
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      setUploadState("error");
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setErrorMessage(message);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTitleOverride("");
    setAuthorOverride("");
    setUploadState("idle");
    setUploadProgress(0);
    setErrorMessage("");
    onClose();
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const colors: Record<string, string> = {
      pdf: "text-red-500",
      epub: "text-blue-500",
      txt: "text-green-500",
    };
    return (
      <FileText
        className={`h-5 w-5 ${colors[ext || ""] || "text-muted-foreground"}`}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg font-sans">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload a Book
          </DialogTitle>
          <DialogDescription>
            Add a book to your personal library. Supports .txt, .epub, and .pdf
            files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* File picker */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) =>
              e.key === "Enter" && fileInputRef.current?.click()
            }
            data-ocid="upload.dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.epub,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                {getFileIcon()}
                <span className="text-sm font-medium text-foreground">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select a file
                </p>
                <p className="text-xs text-muted-foreground">
                  .txt, .epub, .pdf supported
                </p>
              </div>
            )}
          </div>

          {/* Metadata overrides */}
          {selectedFile && uploadState === "idle" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="upload-title">Title (optional override)</Label>
                <Input
                  id="upload-title"
                  placeholder="Leave blank to auto-detect"
                  value={titleOverride}
                  onChange={(e) => setTitleOverride(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="upload-author">
                  Author (optional override)
                </Label>
                <Input
                  id="upload-author"
                  placeholder="Leave blank to auto-detect"
                  value={authorOverride}
                  onChange={(e) => setAuthorOverride(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Progress */}
          {uploadState === "parsing" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Parsing file content...
            </div>
          )}

          {uploadState === "uploading" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Uploading to chain...
                </span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {uploadState === "success" && (
            <Alert className="border-green-500/30 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Book uploaded successfully!
              </AlertDescription>
            </Alert>
          )}

          {uploadState === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={
                uploadState === "uploading" || uploadState === "parsing"
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1"
              disabled={!selectedFile || uploadState !== "idle"}
            >
              {uploadState === "parsing" || uploadState === "uploading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
