import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Heart, Moon, Sun } from "lucide-react";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

// ── Theme Context ─────────────────────────────────────────────────────────────

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ── Layout ────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("kindle-theme");
    return stored === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kindle-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("kindle-theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const appId = encodeURIComponent(
    window.location.hostname || "kindle-on-chain",
  );

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src="/assets/generated/app-logo.dim_256x256.png"
                    alt="Kindle On-Chain"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      target.parentElement!.innerHTML =
                        "<div class=\"w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center\"><svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5 text-primary' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/><path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/></svg></div>";
                    }}
                  />
                </div>
                <div>
                  <span className="font-serif font-semibold text-lg text-foreground leading-none block">
                    Kindle On-Chain
                  </span>
                  <span className="text-xs text-muted-foreground font-sans leading-none">
                    Your library, on-chain
                  </span>
                </div>
              </Link>

              {/* Right controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9"
                  aria-label="Toggle theme"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground font-sans">
            <span>
              © {new Date().getFullYear()} Kindle On-Chain. All rights reserved.
            </span>
            <span className="flex items-center gap-1">
              Built with{" "}
              <Heart className="h-3.5 w-3.5 text-destructive fill-destructive mx-0.5" />{" "}
              using{" "}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </span>
          </div>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
}
