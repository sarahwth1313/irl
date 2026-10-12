import { MapPin } from "lucide-react";

const QUICK_LINKS = [
  { href: "#chat", label: "Chat" },
  { href: "#events", label: "Events" },
  { href: "#about", label: "About" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-ocid="footer"
      className="border-t border-border bg-foreground text-background"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <span className="font-display text-2xl font-extrabold tracking-tight">
            IRL
          </span>
          <p className="mt-3 max-w-xs text-sm text-background/70">
            The warm community space for people who show up in Bangalore.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-background/60">
            Quick links
          </h3>
          <ul className="mt-3 space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  data-ocid="footer.link"
                  className="text-sm text-background/80 transition-smooth hover:text-background"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-background/60">
            Find us
          </h3>
          <p className="mt-3 flex items-center gap-2 text-sm text-background/80">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Bangalore, India
          </p>
        </div>
      </div>

      <div className="border-t border-background/15">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-background/60 sm:px-6">
          © {year}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-smooth hover:text-background"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
