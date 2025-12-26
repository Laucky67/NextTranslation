import {
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { EasyTranslation } from "./pages/EasyTranslation";
import { VibeTranslation } from "./pages/VibeTranslation";
import { SpecTranslation } from "./pages/SpecTranslation";
import { Settings } from "./pages/Settings";

const rootRoute = createRootRoute({
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: EasyTranslation,
});

const vibeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vibe",
  component: VibeTranslation,
});

const specRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/spec",
  component: SpecTranslation,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  vibeRoute,
  specRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
