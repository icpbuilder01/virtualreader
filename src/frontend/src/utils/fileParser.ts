export interface ParsedBook {
  title: string;
  author: string;
  content: string;
}

// ── TXT Parser ────────────────────────────────────────────────────────────────

export async function parseTextFile(file: File): Promise<ParsedBook> {
  const text = await file.text();
  const nameWithoutExt = file.name.replace(/\.txt$/i, "");
  return {
    title: nameWithoutExt,
    author: "Unknown Author",
    content: text,
  };
}

// ── EPUB Parser ───────────────────────────────────────────────────────────────

async function loadJSZip(): Promise<any> {
  // Dynamically load JSZip from CDN
  return new Promise((resolve, reject) => {
    if ((window as any).JSZip) {
      resolve((window as any).JSZip);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    script.onload = () => resolve((window as any).JSZip);
    script.onerror = () => reject(new Error("Failed to load JSZip"));
    document.head.appendChild(script);
  });
}

export async function parseEpubFile(file: File): Promise<ParsedBook> {
  const JSZip = await loadJSZip();
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Read container.xml to find OPF path
  const containerXml = await zip
    .file("META-INF/container.xml")
    ?.async("string");
  if (!containerXml) throw new Error("Invalid EPUB: missing container.xml");

  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, "application/xml");
  const rootfilePath = containerDoc
    .querySelector("rootfile")
    ?.getAttribute("full-path");
  if (!rootfilePath) throw new Error("Invalid EPUB: cannot find OPF path");

  // Read OPF file
  const opfContent = await zip.file(rootfilePath)?.async("string");
  if (!opfContent) throw new Error("Invalid EPUB: cannot read OPF file");

  const opfDoc = parser.parseFromString(opfContent, "application/xml");

  // Extract metadata
  const titleEl = opfDoc.querySelector("metadata title, dc\\:title, title");
  const authorEl = opfDoc.querySelector(
    "metadata creator, dc\\:creator, creator",
  );
  const title =
    titleEl?.textContent?.trim() || file.name.replace(/\.epub$/i, "");
  const author = authorEl?.textContent?.trim() || "Unknown Author";

  // Get spine items in order
  const opfDir = rootfilePath.includes("/")
    ? rootfilePath.substring(0, rootfilePath.lastIndexOf("/") + 1)
    : "";
  const manifestItems: Record<string, string> = {};

  for (const item of opfDoc.querySelectorAll("manifest item")) {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    const mediaType = item.getAttribute("media-type");
    if (
      id &&
      href &&
      (mediaType === "application/xhtml+xml" || mediaType === "text/html")
    ) {
      manifestItems[id] = opfDir + href;
    }
  }

  const spineItems: string[] = [];
  for (const itemref of opfDoc.querySelectorAll("spine itemref")) {
    const idref = itemref.getAttribute("idref");
    if (idref && manifestItems[idref]) {
      spineItems.push(manifestItems[idref]);
    }
  }

  // Extract text from each spine item
  const textParts: string[] = [];
  for (const itemPath of spineItems.slice(0, 50)) {
    // limit to 50 chapters
    try {
      const normalizedPath = itemPath.replace(/^\//, "");
      const htmlContent = await zip.file(normalizedPath)?.async("string");
      if (htmlContent) {
        const htmlDoc = parser.parseFromString(htmlContent, "text/html");
        // Remove script and style elements
        for (const el of htmlDoc.querySelectorAll("script, style")) el.remove();
        const bodyText =
          htmlDoc.body?.textContent ||
          htmlDoc.documentElement?.textContent ||
          "";
        const cleaned = bodyText.replace(/\s+/g, " ").trim();
        if (cleaned.length > 10) {
          textParts.push(cleaned);
        }
      }
    } catch {
      // skip problematic chapters
    }
  }

  const content = textParts.join("\n\n");
  if (!content) throw new Error("Could not extract text from EPUB");

  return { title, author, content };
}

// ── PDF Parser ────────────────────────────────────────────────────────────────

async function loadPdfJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(lib);
      } else {
        reject(new Error("Failed to load PDF.js"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });
}

export async function parsePdfFile(file: File): Promise<ParsedBook> {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  const numPages = pdf.numPages;

  // Extract metadata
  let title = file.name.replace(/\.pdf$/i, "");
  let author = "Unknown Author";
  try {
    const meta = await pdf.getMetadata();
    if (meta?.info?.Title) title = meta.info.Title;
    if (meta?.info?.Author) author = meta.info.Author;
  } catch {
    // ignore metadata errors
  }

  // Extract text from all pages
  const textParts: string[] = [];
  const maxPages = Math.min(numPages, 200); // limit to 200 pages
  for (let i = 1; i <= maxPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (pageText) textParts.push(pageText);
    } catch {
      // skip problematic pages
    }
  }

  const content = textParts.join("\n\n");
  if (!content) throw new Error("Could not extract text from PDF");

  return { title, author, content };
}

// ── Main Parser ───────────────────────────────────────────────────────────────

export async function parseBookFile(file: File): Promise<ParsedBook> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "txt":
      return parseTextFile(file);
    case "epub":
      return parseEpubFile(file);
    case "pdf":
      return parsePdfFile(file);
    default:
      throw new Error(`Unsupported file format: .${ext}`);
  }
}
