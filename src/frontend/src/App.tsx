import { createActor } from "@/backend";
import type { Category, Item, Message } from "@/backend";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useBoardFilters } from "@/hooks/use-board-filters";
import {
  BOARD_SORT_OPTIONS,
  CATEGORY_META,
  categoryLabel,
  filterAndSortItems,
  formatBoardDateRange,
  formatBoardTime,
  formatMessageTime,
} from "@/types";
import type { BoardCategoryFilter } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Loader2,
  LogIn,
  MapPin,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { useState } from "react";

function useMessages() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      if (!actor) return [] as Message[];
      return actor.listMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

function usePostMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.postMessage(text);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

function useItems() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      if (!actor) return [] as Item[];
      return actor.listItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export interface AddItemInput {
  title: string;
  category: Category;
  area: string;
  shortDescription: string;
  fullDescription: string;
  dateOrHours: string | null;
  activityId: string | null;
  startDate: string | null;
  startTime: string | null;
  endDate: string | null;
  price: string | null;
  ageRequirements: string | null;
  address: string | null;
  registrationLink: string | null;
  mapsLink: string | null;
  sourceLink: string | null;
  lastVerified: string | null;
  status: string | null;
  tags: string[];
}

function useAddItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddItemInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addItem(
        input.title,
        input.category,
        input.area,
        input.shortDescription,
        input.fullDescription,
        input.dateOrHours,
        input.activityId,
        input.startDate,
        input.startTime,
        input.endDate,
        input.price,
        input.ageRequirements,
        input.address,
        input.registrationLink,
        input.mapsLink,
        input.sourceLink,
        input.lastVerified,
        input.status,
        input.tags,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

function Hero({
  onSignIn,
  isAuthenticated,
}: { onSignIn: () => void; isAuthenticated: boolean }) {
  return (
    <section
      data-ocid="hero.section"
      className="relative overflow-hidden bg-gradient-subtle"
      aria-labelledby="hero-title"
    >
      <div
        className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl animate-float"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl animate-float"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-3xl animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground shadow-subtle">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Bangalore community space
          </span>

          <h1
            id="hero-title"
            className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl"
          >
            Show up <span className="text-gradient">IRL</span>
            <br />
            in Bangalore.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            IRL is where the city's events, places, food, and culture live in
            one warm room. Drop into the chat, find your next spot, and actually
            go.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="lg"
              data-ocid="hero.primary_button"
              onClick={() => {
                document
                  .getElementById("chat")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full bg-gradient-primary text-primary-foreground shadow-elevated transition-smooth hover:opacity-90"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Join the chat
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              data-ocid="hero.secondary_button"
              onClick={() => {
                document
                  .getElementById("events")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full"
            >
              Browse events
            </Button>
            {!isAuthenticated && (
              <Button
                type="button"
                size="lg"
                variant="ghost"
                data-ocid="hero.signin_button"
                onClick={onSignIn}
                className="rounded-full"
              >
                <LogIn className="h-5 w-5" aria-hidden="true" />
                Sign in with Internet Identity
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatPanel() {
  const { isAuthenticated, login, profile } = useAuth();
  const messagesQuery = useMessages();
  const postMessage = usePostMessage();
  const [draft, setDraft] = useState("");

  const messages = messagesQuery.data ?? [];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    postMessage.mutate(text, {
      onError: () => setDraft((current) => (current === "" ? text : current)),
    });
  }

  return (
    <section
      id="chat"
      data-ocid="chat.section"
      className="scroll-mt-20 border-t border-border bg-card"
      aria-labelledby="chat-title"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2
              id="chat-title"
              className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Live community chat
            </h2>
            <p className="mt-4 text-muted-foreground">
              Real conversations from people in the city. Ask where to go,
              what's on, and who's around this weekend.
            </p>
            {!isAuthenticated && (
              <div className="mt-6 rounded-lg border border-border bg-muted p-5 shadow-subtle">
                <p className="text-sm text-muted-foreground">
                  Sign in with Internet Identity to post. Your verified email
                  stays private to you.
                </p>
                <Button
                  type="button"
                  data-ocid="chat.signin_button"
                  onClick={() => login()}
                  className="mt-4 rounded-full bg-gradient-primary text-primary-foreground shadow-subtle transition-smooth hover:opacity-90"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Sign in to chat
                </Button>
              </div>
            )}
            {isAuthenticated && (
              <p className="mt-6 text-sm text-muted-foreground">
                Posting as{" "}
                <span className="font-medium text-foreground">
                  {profile?.displayName ?? "you"}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col rounded-lg border border-border bg-background shadow-elevated">
            <div
              data-ocid="chat.list"
              className="flex max-h-[26rem] min-h-[16rem] flex-col gap-4 overflow-y-auto p-5"
            >
              {messagesQuery.isLoading ? (
                <div
                  data-ocid="chat.loading_state"
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Loading the room…
                </div>
              ) : messages.length === 0 ? (
                <div
                  data-ocid="chat.empty_state"
                  className="text-sm text-muted-foreground"
                >
                  The room is quiet. Be the first to say hello.
                </div>
              ) : (
                messages.map((message) => (
                  <article key={String(message.id)} className="flex gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground"
                      aria-hidden="true"
                    >
                      {message.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {message.authorName}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 break-words text-sm text-muted-foreground">
                        {message.text}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 border-t border-border p-4"
            >
              <Textarea
                data-ocid="chat.textarea"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  isAuthenticated
                    ? "Say something to the city…"
                    : "Sign in to post"
                }
                disabled={!isAuthenticated}
                rows={1}
                className="min-h-[2.75rem] resize-none"
                aria-label="Chat message"
              />
              <Button
                type="submit"
                data-ocid="chat.submit_button"
                disabled={
                  !isAuthenticated ||
                  postMessage.isPending ||
                  draft.trim() === ""
                }
                className="rounded-full bg-gradient-primary text-primary-foreground shadow-subtle transition-smooth hover:opacity-90"
              >
                {postMessage.isPending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                Send
              </Button>
            </form>
            {postMessage.isError && (
              <p
                data-ocid="chat.error_state"
                className="px-4 pb-4 text-sm text-destructive"
              >
                That message didn't send. Try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ItemCard({
  item,
  index,
  onOpen,
}: {
  item: Item;
  index: number;
  onOpen: (item: Item) => void;
}) {
  const dateRange = formatBoardDateRange(item);
  const time = formatBoardTime(item);

  return (
    <button
      type="button"
      data-ocid={`events.card.${index}`}
      onClick={() => onOpen(item)}
      aria-label={`Open details for ${item.title}`}
      className="flex flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-subtle transition-smooth hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          {categoryLabel(item.category)}
        </span>
        {item.activityId && (
          <span className="rounded-full border border-border bg-muted px-3 py-1 font-mono text-xs font-medium text-muted-foreground">
            {item.activityId}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {item.area}
        </span>
      </div>

      <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">
        {item.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {item.shortDescription}
      </p>

      {(dateRange || time) && (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {dateRange && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {dateRange}
            </span>
          )}
          {time && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {time}
            </span>
          )}
        </p>
      )}

      {item.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {(item.price || item.ageRequirements) && (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.price && <span>{item.price}</span>}
          {item.ageRequirements && <span>{item.ageRequirements}</span>}
        </p>
      )}

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
        View details
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </button>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

function DetailLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-ocid="events.detail.link"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}

function ItemDetailDialog({
  item,
  onOpenChange,
}: {
  item: Item | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="events.detail.dialog"
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
      >
        {item && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  {categoryLabel(item.category)}
                </span>
                {item.activityId && (
                  <span className="rounded-full border border-border bg-muted px-3 py-1 font-mono text-xs font-medium text-muted-foreground">
                    {item.activityId}
                  </span>
                )}
                {item.status && (
                  <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {item.status}
                  </span>
                )}
              </div>
              <DialogTitle className="mt-3 font-display text-2xl font-bold tracking-tight">
                {item.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {item.shortDescription}
              </DialogDescription>
            </DialogHeader>

            <dl className="mt-2 grid gap-4 sm:grid-cols-2">
              <DetailField label="Area" value={item.area} />
              <DetailField label="Address" value={item.address} />
              <DetailField label="Start date" value={item.startDate} />
              <DetailField label="Start time" value={item.startTime} />
              <DetailField label="End date" value={item.endDate} />
              <DetailField label="Price" value={item.price} />
              <DetailField
                label="Age requirements"
                value={item.ageRequirements}
              />
              <DetailField label="Last verified" value={item.lastVerified} />
            </dl>

            {item.fullDescription && (
              <div className="mt-2">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  About
                </h3>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground">
                  {item.fullDescription}
                </p>
              </div>
            )}

            {item.tags.length > 0 && (
              <div className="mt-2">
                <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                  Tags
                </h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(item.mapsLink || item.sourceLink || item.registrationLink) && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {item.mapsLink && (
                  <DetailLink label="Open in Maps" href={item.mapsLink} />
                )}
                {item.registrationLink && (
                  <DetailLink label="Register" href={item.registrationLink} />
                )}
                {item.sourceLink && (
                  <DetailLink label="View source" href={item.sourceLink} />
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ItemDraft {
  title: string;
  category: Category;
  area: string;
  shortDescription: string;
  activityId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  price: string;
  ageRequirements: string;
  address: string;
  registrationLink: string;
  mapsLink: string;
  sourceLink: string;
  lastVerified: string;
  status: string;
  tags: string;
}

const EMPTY_DRAFT: ItemDraft = {
  title: "",
  category: "events" as Category,
  area: "",
  shortDescription: "",
  activityId: "",
  startDate: "",
  startTime: "",
  endDate: "",
  price: "",
  ageRequirements: "",
  address: "",
  registrationLink: "",
  mapsLink: "",
  sourceLink: "",
  lastVerified: "",
  status: "",
  tags: "",
};

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");
}

function AddItemForm() {
  const addItem = useAddItem();
  const [draft, setDraft] = useState<ItemDraft>(EMPTY_DRAFT);

  function update<K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !draft.title.trim() ||
      !draft.area.trim() ||
      !draft.shortDescription.trim()
    ) {
      return;
    }
    const captured: AddItemInput = {
      title: draft.title.trim(),
      category: draft.category,
      area: draft.area.trim(),
      shortDescription: draft.shortDescription.trim(),
      fullDescription: draft.shortDescription.trim(),
      dateOrHours: null,
      activityId: toNullable(draft.activityId),
      startDate: toNullable(draft.startDate),
      startTime: toNullable(draft.startTime),
      endDate: toNullable(draft.endDate),
      price: toNullable(draft.price),
      ageRequirements: toNullable(draft.ageRequirements),
      address: toNullable(draft.address),
      registrationLink: toNullable(draft.registrationLink),
      mapsLink: toNullable(draft.mapsLink),
      sourceLink: toNullable(draft.sourceLink),
      lastVerified: toNullable(draft.lastVerified),
      status: toNullable(draft.status),
      tags: parseTags(draft.tags),
    };
    setDraft(EMPTY_DRAFT);
    addItem.mutate(captured, {
      onError: () => setDraft((current) => current),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-ocid="events.form"
      className="rounded-lg border border-border bg-muted p-6 shadow-subtle"
    >
      <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
        Add to the board
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Share an event, place, food spot, or bit of culture. Only name,
        category, area, and description are required.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="item-title"
            className="text-sm font-medium text-foreground"
          >
            Name
          </label>
          <Input
            id="item-title"
            data-ocid="events.input"
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="Sunday filter coffee walk"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-category"
            className="text-sm font-medium text-foreground"
          >
            Category
          </label>
          <select
            id="item-category"
            data-ocid="events.select"
            value={draft.category}
            onChange={(event) =>
              update("category", event.target.value as Category)
            }
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CATEGORY_META.map((meta) => (
              <option key={meta.value} value={meta.value}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="item-area"
            className="text-sm font-medium text-foreground"
          >
            Area
          </label>
          <Input
            id="item-area"
            data-ocid="events.input"
            value={draft.area}
            onChange={(event) => update("area", event.target.value)}
            placeholder="Indiranagar"
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="item-description"
            className="text-sm font-medium text-foreground"
          >
            Description
          </label>
          <Textarea
            id="item-description"
            data-ocid="events.textarea"
            value={draft.shortDescription}
            onChange={(event) => update("shortDescription", event.target.value)}
            placeholder="A slow morning walk to the city's best filter coffee."
            rows={3}
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-activity-id"
            className="text-sm font-medium text-foreground"
          >
            Activity ID
          </label>
          <Input
            id="item-activity-id"
            data-ocid="events.input"
            value={draft.activityId}
            onChange={(event) => update("activityId", event.target.value)}
            placeholder="CB021"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-status"
            className="text-sm font-medium text-foreground"
          >
            Status
          </label>
          <Input
            id="item-status"
            data-ocid="events.input"
            value={draft.status}
            onChange={(event) => update("status", event.target.value)}
            placeholder="Open"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-start-date"
            className="text-sm font-medium text-foreground"
          >
            Start date
          </label>
          <Input
            id="item-start-date"
            data-ocid="events.input"
            value={draft.startDate}
            onChange={(event) => update("startDate", event.target.value)}
            placeholder="12 Oct 2026"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-start-time"
            className="text-sm font-medium text-foreground"
          >
            Start time
          </label>
          <Input
            id="item-start-time"
            data-ocid="events.input"
            value={draft.startTime}
            onChange={(event) => update("startTime", event.target.value)}
            placeholder="7:30 AM"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-end-date"
            className="text-sm font-medium text-foreground"
          >
            End date
          </label>
          <Input
            id="item-end-date"
            data-ocid="events.input"
            value={draft.endDate}
            onChange={(event) => update("endDate", event.target.value)}
            placeholder="12 Oct 2026"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-price"
            className="text-sm font-medium text-foreground"
          >
            Price
          </label>
          <Input
            id="item-price"
            data-ocid="events.input"
            value={draft.price}
            onChange={(event) => update("price", event.target.value)}
            placeholder="Free"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-age"
            className="text-sm font-medium text-foreground"
          >
            Age requirements
          </label>
          <Input
            id="item-age"
            data-ocid="events.input"
            value={draft.ageRequirements}
            onChange={(event) => update("ageRequirements", event.target.value)}
            placeholder="All ages"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-last-verified"
            className="text-sm font-medium text-foreground"
          >
            Last verified
          </label>
          <Input
            id="item-last-verified"
            data-ocid="events.input"
            value={draft.lastVerified}
            onChange={(event) => update("lastVerified", event.target.value)}
            placeholder="10 Oct 2026"
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="item-address"
            className="text-sm font-medium text-foreground"
          >
            Address
          </label>
          <Input
            id="item-address"
            data-ocid="events.input"
            value={draft.address}
            onChange={(event) => update("address", event.target.value)}
            placeholder="100 Feet Road, Indiranagar, Bengaluru"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-registration"
            className="text-sm font-medium text-foreground"
          >
            Registration link
          </label>
          <Input
            id="item-registration"
            data-ocid="events.input"
            type="url"
            value={draft.registrationLink}
            onChange={(event) => update("registrationLink", event.target.value)}
            placeholder="https://…"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-maps"
            className="text-sm font-medium text-foreground"
          >
            Maps link
          </label>
          <Input
            id="item-maps"
            data-ocid="events.input"
            type="url"
            value={draft.mapsLink}
            onChange={(event) => update("mapsLink", event.target.value)}
            placeholder="https://maps.google.com/…"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-source"
            className="text-sm font-medium text-foreground"
          >
            Source link
          </label>
          <Input
            id="item-source"
            data-ocid="events.input"
            type="url"
            value={draft.sourceLink}
            onChange={(event) => update("sourceLink", event.target.value)}
            placeholder="https://…"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="item-tags"
            className="text-sm font-medium text-foreground"
          >
            Tags
          </label>
          <Input
            id="item-tags"
            data-ocid="events.input"
            value={draft.tags}
            onChange={(event) => update("tags", event.target.value)}
            placeholder="coffee, walking, morning"
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Separate tags with commas.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        data-ocid="events.submit_button"
        disabled={
          addItem.isPending ||
          !draft.title.trim() ||
          !draft.area.trim() ||
          !draft.shortDescription.trim()
        }
        className="mt-5 rounded-full bg-gradient-primary text-primary-foreground shadow-subtle transition-smooth hover:opacity-90"
      >
        {addItem.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        Add to IRL
      </Button>
      {addItem.isError && (
        <p
          data-ocid="events.error_state"
          className="mt-3 text-sm text-destructive"
        >
          That didn't save. Try again.
        </p>
      )}
    </form>
  );
}

const CATEGORY_FILTERS: { value: BoardCategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...CATEGORY_META.map((meta) => ({
    value: meta.value as BoardCategoryFilter,
    label: meta.label,
  })),
];

function EventsSection() {
  const itemsQuery = useItems();
  const items = itemsQuery.data ?? [];
  const {
    filters,
    setCategory,
    setSearch,
    setSort,
    clearFilters,
    hasActiveFilters,
  } = useBoardFilters();
  const [selected, setSelected] = useState<Item | null>(null);

  const visibleItems = filterAndSortItems(items, filters);

  return (
    <section
      id="events"
      data-ocid="events.section"
      className="scroll-mt-20 border-t border-border bg-background"
      aria-labelledby="events-title"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="events-title"
              className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Curated events and places
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              A living board of what's worth your time in Bangalore, added by
              the community.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div
              data-ocid="events.filters.panel"
              className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
            >
              <fieldset className="flex flex-wrap gap-2">
                <legend className="sr-only">Filter by category</legend>
                {CATEGORY_FILTERS.map((option) => {
                  const active = filters.category === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-ocid={`events.filter.tab.${option.value}`}
                      aria-pressed={active}
                      onClick={() => setCategory(option.value)}
                      className={
                        active
                          ? "rounded-full bg-gradient-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-subtle transition-smooth"
                          : "rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </fieldset>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    data-ocid="events.search_input"
                    type="search"
                    value={filters.search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search events, places, tags…"
                    aria-label="Search the board"
                    className="pl-9"
                  />
                </div>
                <div className="sm:w-52">
                  <label htmlFor="board-sort" className="sr-only">
                    Sort the board
                  </label>
                  <select
                    id="board-sort"
                    data-ocid="events.sort.select"
                    value={filters.sort}
                    onChange={(event) =>
                      setSort(event.target.value as typeof filters.sort)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {BOARD_SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        Sort by {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p
                  data-ocid="events.result_count"
                  className="text-sm text-muted-foreground"
                >
                  {itemsQuery.isLoading
                    ? "Loading the board…"
                    : `${visibleItems.length} ${
                        visibleItems.length === 1 ? "entry" : "entries"
                      }`}
                </p>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-ocid="events.clear_filters_button"
                    onClick={clearFilters}
                    className="rounded-full"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Clear filters
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6">
              {itemsQuery.isLoading ? (
                <div
                  data-ocid="events.loading_state"
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Loading the board…
                </div>
              ) : items.length === 0 ? (
                <div
                  data-ocid="events.empty_state"
                  className="rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-subtle"
                >
                  <h3 className="font-display text-xl font-bold text-foreground">
                    The board is empty
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add the first event or place and give the city somewhere to
                    go.
                  </p>
                </div>
              ) : visibleItems.length === 0 ? (
                <div
                  data-ocid="events.no_results_state"
                  className="rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-subtle"
                >
                  <h3 className="font-display text-xl font-bold text-foreground">
                    Nothing matches yet
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try a different search or clear the filters to see the whole
                    board.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="events.no_results.clear_button"
                    onClick={clearFilters}
                    className="mt-4 rounded-full"
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div
                  data-ocid="events.list"
                  className="grid gap-5 sm:grid-cols-2"
                >
                  {visibleItems.map((item, index) => (
                    <ItemCard
                      key={String(item.id)}
                      item={item}
                      index={index + 1}
                      onOpen={setSelected}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <AddItemForm />
        </div>
      </div>

      <ItemDetailDialog
        item={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </section>
  );
}

function AboutSection() {
  return (
    <section
      id="about"
      data-ocid="about.section"
      className="scroll-mt-20 border-t border-border bg-muted"
      aria-labelledby="about-title"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2
              id="about-title"
              className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              About IRL
            </h2>
            <p className="mt-4 text-muted-foreground">
              IRL is a one-page home for the Bangalore community. It gathers the
              events, places, food, and culture worth showing up for — and a
              live chat to talk about them.
            </p>
            <p className="mt-4 text-muted-foreground">
              Sign in with Internet Identity to join the conversation. Your
              verified email is recorded for your account and shown only to you.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {CATEGORY_META.map((meta) => (
              <div
                key={meta.value}
                data-ocid="about.card"
                className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
              >
                <h3 className="font-display text-lg font-bold text-foreground">
                  {meta.label}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {meta.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountPanel() {
  const { isAuthenticated, profile, email, logout, isProfileLoading } =
    useAuth();

  if (!isAuthenticated) return null;

  return (
    <section
      data-ocid="account.section"
      className="border-t border-border bg-card"
      aria-labelledby="account-title"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg border border-border bg-background p-6 shadow-subtle">
          <div className="min-w-0">
            <h2
              id="account-title"
              className="font-display text-2xl font-bold tracking-tight text-foreground"
            >
              {isProfileLoading
                ? "Loading your account…"
                : `Welcome, ${profile?.displayName ?? "friend"}`}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Verified email:{" "}
              <span className="font-medium text-foreground">
                {email ?? "not shared by Internet Identity"}
              </span>
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            data-ocid="account.signout_button"
            onClick={logout}
            className="rounded-full"
          >
            Sign out
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const { isAuthenticated, profile, login, logout, loginStatus } = useAuth();

  return (
    <Layout
      isAuthenticated={isAuthenticated}
      displayName={profile?.displayName ?? null}
      onSignIn={login}
      onSignOut={logout}
      isSigningIn={loginStatus === "logging-in"}
    >
      <Hero onSignIn={login} isAuthenticated={isAuthenticated} />
      <ChatPanel />
      <EventsSection />
      <AboutSection />
      <AccountPanel />
    </Layout>
  );
}
