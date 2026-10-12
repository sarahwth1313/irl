import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Item, Message, UserProfile } from "@/backend";
import { Category } from "@/backend";
import { Principal } from "@icp-sdk/core/principal";

const ANON = Principal.anonymous();

// ---------------------------------------------------------------------------
// Local typed actor mock. The real `useActor`/`useInternetIdentity` hooks are
// replaced so the app renders against a deterministic, in-memory backend.
// ---------------------------------------------------------------------------

interface MockActor {
  listMessages: ReturnType<typeof vi.fn>;
  postMessage: ReturnType<typeof vi.fn>;
  listItems: ReturnType<typeof vi.fn>;
  addItem: ReturnType<typeof vi.fn>;
  getCallerUserProfile: ReturnType<typeof vi.fn>;
  getCallerEmail: ReturnType<typeof vi.fn>;
}

const state = vi.hoisted(() => ({
  actor: null as unknown,
  isFetching: false,
  auth: {
    identity: null,
    login: vi.fn(),
    clear: vi.fn(),
    loginStatus: "idle",
    isAuthenticated: false,
  },
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: state.actor, isFetching: state.isFetching }),
  useInternetIdentity: () => state.auth,
  InternetIdentityProvider: ({ children }: { children: ReactNode }) => children,
}));

import App from "@/App";

function makeActor(overrides: Partial<MockActor> = {}): MockActor {
  return {
    listMessages: vi.fn(async () => [] as Message[]),
    postMessage: vi.fn(async (text: string) => ({
      id: 1n,
      text,
      authorName: "You",
      author: ANON,
      createdAt: 0n,
    })),
    listItems: vi.fn(async () => [] as Item[]),
    addItem: vi.fn(async () => ({}) as Item),
    getCallerUserProfile: vi.fn(async () => null as UserProfile | null),
    getCallerEmail: vi.fn(async () => null as string | null),
    ...overrides,
  };
}

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  state.actor = makeActor();
  state.isFetching = false;
  state.auth = {
    identity: null,
    login: vi.fn(),
    clear: vi.fn(),
    loginStatus: "idle",
    isAuthenticated: false,
  };
});

describe("IRL app shell", () => {
  it("renders the hero, header and footer instead of a blank screen", async () => {
    renderApp();

    expect(
      screen.getByRole("heading", { name: /show up irl/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /live community chat/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /curated events and places/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /about irl/i }),
    ).toBeInTheDocument();
  });

  it("renders every anchor section the header links to", async () => {
    renderApp();

    for (const id of ["top", "chat", "events", "about"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it("shows the loading state while the backend is fetching", async () => {
    const pending = () => new Promise<never>(() => {});
    state.actor = makeActor({
      listMessages: vi.fn(pending),
      listItems: vi.fn(pending),
    });
    renderApp();

    expect(screen.getByTestId("chat.loading_state")).toBeInTheDocument();
    expect(screen.getByTestId("events.loading_state")).toBeInTheDocument();
  });

  it("shows empty states once the backend answers with nothing", async () => {
    renderApp();

    expect(await screen.findByTestId("chat.empty_state")).toBeInTheDocument();
    expect(await screen.findByTestId("events.empty_state")).toBeInTheDocument();
  });

  it("renders messages returned by the backend", async () => {
    const messages: Message[] = [
      {
        id: 1n,
        text: "Filter coffee at 8?",
        authorName: "Asha",
        author: ANON,
        createdAt: 0n,
      },
    ];
    state.actor = makeActor({ listMessages: vi.fn(async () => messages) });
    renderApp();

    expect(await screen.findByText("Filter coffee at 8?")).toBeInTheDocument();
    expect(screen.getByText("Asha")).toBeInTheDocument();
  });

  it("renders board items returned by the backend", async () => {
    const items: Item[] = [
      {
        id: 1n,
        title: "Sunday filter coffee walk",
        area: "Indiranagar",
        category: Category.food,
        shortDescription: "A slow morning walk.",
        fullDescription: "A slow morning walk.",
        dateOrHours: "Sundays 8am",
        tags: [],
        createdAt: 0n,
        createdBy: ANON,
      },
    ];
    state.actor = makeActor({ listItems: vi.fn(async () => items) });
    renderApp();

    expect(
      await screen.findByText("Sunday filter coffee walk"),
    ).toBeInTheDocument();
    expect(screen.getByText("Indiranagar")).toBeInTheDocument();
    expect(screen.getByText("Sundays 8am")).toBeInTheDocument();
  });

  it("survives a message-list failure without blanking the page", async () => {
    state.actor = makeActor({
      listMessages: vi.fn(async () => {
        throw new Error("backend unavailable");
      }),
    });
    renderApp();

    // The list query fails; the panel falls back to its empty state and the
    // rest of the page still renders rather than crashing to a blank screen.
    expect(
      await screen.findByRole("heading", { name: /show up irl/i }),
    ).toBeInTheDocument();
    expect(await screen.findByTestId("chat.empty_state")).toBeInTheDocument();
  });
});

describe("IRL sign-in journeys", () => {
  it("invokes login from the hero sign-in button when signed out", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      screen.getByRole("button", { name: /sign in with internet identity/i }),
    );

    expect(state.auth.login).toHaveBeenCalledTimes(1);
  });

  it("shows the account panel and posts a message when signed in", async () => {
    const user = userEvent.setup();
    const postMessage = vi.fn(async (text: string) => ({
      id: 2n,
      text,
      authorName: "You",
      author: ANON,
      createdAt: 0n,
    }));
    state.actor = makeActor({
      postMessage,
      getCallerUserProfile: vi.fn(
        async () =>
          ({
            displayName: "Asha",
          }) as UserProfile,
      ),
      getCallerEmail: vi.fn(async () => "asha@example.com"),
    });
    state.auth = {
      identity: null,
      login: vi.fn(),
      clear: vi.fn(),
      loginStatus: "idle",
      isAuthenticated: true,
    };
    renderApp();

    expect(await screen.findByText(/welcome, asha/i)).toBeInTheDocument();
    expect(screen.getByText("asha@example.com")).toBeInTheDocument();

    const textarea = screen.getByLabelText("Chat message");
    await user.type(textarea, "Hello Bangalore");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith("Hello Bangalore");
    });
  });

  it("signs out from the account panel", async () => {
    const user = userEvent.setup();
    state.auth = {
      identity: null,
      login: vi.fn(),
      clear: vi.fn(),
      loginStatus: "idle",
      isAuthenticated: true,
    };
    renderApp();

    const account = await screen.findByTestId("account.section");
    await user.click(
      within(account).getByRole("button", { name: /sign out/i }),
    );

    expect(state.auth.clear).toHaveBeenCalledTimes(1);
  });
});
