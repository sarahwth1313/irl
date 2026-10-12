import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogIn, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "#chat", label: "Chat" },
  { href: "#events", label: "Events" },
  { href: "#about", label: "About" },
];

interface HeaderProps {
  isAuthenticated: boolean;
  displayName: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
}

export function Header({
  isAuthenticated,
  displayName,
  onSignIn,
  onSignOut,
  isSigningIn,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      data-ocid="header"
      className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md shadow-subtle"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#top"
          data-ocid="header.link"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-display text-2xl font-extrabold tracking-tight text-gradient">
            IRL
          </span>
          <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:inline">
            Bangalore
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-ocid="header.link"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span
                data-ocid="header.user"
                className="hidden max-w-[10rem] truncate text-sm font-medium text-foreground sm:inline"
              >
                {displayName ?? "Signed in"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="header.signout_button"
                onClick={onSignOut}
                className="rounded-full"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              data-ocid="header.signin_button"
              onClick={onSignIn}
              disabled={isSigningIn}
              className="rounded-full bg-gradient-primary text-primary-foreground shadow-subtle transition-smooth hover:opacity-90"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {isSigningIn ? "Signing in…" : "Sign in"}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            data-ocid="header.menu_toggle"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border bg-card md:hidden",
          menuOpen ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col px-4 py-2" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-ocid="header.link"
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-3 text-sm font-medium text-foreground transition-smooth hover:bg-muted"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
