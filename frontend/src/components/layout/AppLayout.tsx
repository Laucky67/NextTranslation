import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import { Languages, Sparkles, BookOpen, Settings, Menu, X, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useSettingsStore } from "../../stores/settings";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/" as const, label: "Easy Translation", icon: Languages },
  { to: "/vibe" as const, label: "Vibe Translation", icon: Sparkles },
  { to: "/spec" as const, label: "Spec Translation", icon: BookOpen },
  { to: "/settings" as const, label: "设置", icon: Settings },
];

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useSettingsStore();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <Languages className="h-6 w-6" />
              <span className="font-bold">NextTranslation</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center space-x-1 transition-colors hover:text-foreground/80",
                  currentPath === item.to
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t px-4 py-4">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded-md transition-colors",
                    currentPath === item.to
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
