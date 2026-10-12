import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  isAuthenticated: boolean;
  displayName: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
}

export function Layout({
  children,
  isAuthenticated,
  displayName,
  onSignIn,
  onSignOut,
  isSigningIn,
}: LayoutProps) {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-background">
      <Header
        isAuthenticated={isAuthenticated}
        displayName={displayName}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        isSigningIn={isSigningIn}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
