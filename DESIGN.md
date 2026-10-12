# Design Brief

## Direction

IRL — a warm, editorial Bangalore community space where locals chat live and browse the city's events and places.

## Tone

Warm editorial with confident display type — sun-baked terracotta and marigold on cream, not the cool blue tech cliché.

## Differentiation

An oversized Bricolage Grotesque "IRL" wordmark with a gradient fill anchors the hero, while alternating cream/muted bands give the one-pager a magazine rhythm.

## Color Palette

| Token      | OKLCH        | Role                                    |
| ---------- | ------------ | --------------------------------------- |
| background | 0.965 0.02 76  | Warm cream page base (light)          |
| foreground | 0.19 0.028 46  | Deep espresso-brown text              |
| card       | 0.99 0.012 78  | Near-white card surface               |
| primary    | 0.48 0.15 30   | Terracotta — CTAs, links, active nav  |
| accent     | 0.55 0.13 150  | Muted sage green — tags, secondary   |
| muted      | 0.925 0.025 76 | Sand band for alternating sections    |

## Typography

- Display: Bricolage Grotesque — IRL wordmark, hero, section headings
- Body: DM Sans — paragraphs, chat, cards, UI labels
- Mono: Geist Mono — timestamps, area tags, meta
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight`, h2 `text-3xl md:text-4xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base md:text-lg`

## Elevation & Depth

Layered warm surfaces: flat cream background, near-white cards with `shadow-subtle`, hover to `shadow-elevated`; ambient gradient orbs behind the hero; gradient text on the wordmark.

## Structural Zones

| Zone    | Background          | Border   | Notes                                          |
| ------- | ------------------- | -------- | ---------------------------------------------- |
| Header  | `bg-card/80` blur   | `border-b` | Sticky; IRL wordmark + anchors + sign-in     |
| Hero    | `bg-gradient-subtle`| —        | Oversized gradient IRL; ambient orbs; fade-up |
| Content | `bg-background`     | —        | Alternating `bg-muted/30` bands per section   |
| Chat    | `bg-card`           | `border` | Elevated chat panel with subtle shadow       |
| Footer  | `bg-muted/40`        | `border-t` | IRL mark, quick links, Bangalore line      |

## Spacing & Rhythm

Section gaps `py-16 md:py-24`; content max-width `max-w-6xl`; card grid `gap-6`; micro-spacing `gap-2`/`gap-3` inside cards and chat rows.

## Component Patterns

- Buttons: pill (`rounded-full`), terracotta `bg-primary`, hover to `bg-gradient-primary` + `shadow-elevated`
- Cards: `rounded-2xl`, `bg-card`, `border-border`, `shadow-subtle` → `shadow-elevated` on hover, slight lift
- Badges: pill, `bg-accent/15 text-accent` for area/category; `bg-secondary` for meta
- Chat: message rows with avatar initial, name, mono timestamp; own messages tinted `bg-primary/10`

## Motion

- Entrance: `animate-fade-up` on hero and sections, 0.6s ease-out, staggered
- Hover: `transition-smooth` 0.3s on cards/buttons; card lift via shadow
- Decorative: two `animate-float` gradient orbs behind hero; `animate-pulse-soft` on the live-chat indicator

## Constraints

- App name always IRL in caps, including the wordmark
- Tokens only — no raw hex/rgb or arbitrary color classes in components
- No direct messages and no user-submitted photos
- AA+ contrast in both light and dark themes

## Signature Detail

The oversized gradient-filled "IRL" wordmark with floating ambient orbs — a typographic hero treatment.
