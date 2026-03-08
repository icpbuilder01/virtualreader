import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import React from "react";
import Layout from "./components/Layout";
import Library from "./pages/Library";
import Reader from "./pages/Reader";

// ── Root layout component ─────────────────────────────────────────────────────

function RootLayout() {
  return (
    <Layout>
      <Outlet />
      <Toaster richColors position="bottom-right" />
    </Layout>
  );
}

// ── Routes ────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: RootLayout,
});

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Library,
});

const readerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reader",
  component: Reader,
  validateSearch: (search: Record<string, unknown>) => ({
    title: (search.title as string) || "",
    author: (search.author as string) || "",
    content: (search.content as string) || "",
    isPublic: search.isPublic === true || search.isPublic === "true",
  }),
});

const routeTree = rootRoute.addChildren([libraryRoute, readerRoute]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return <RouterProvider router={router} />;
}
