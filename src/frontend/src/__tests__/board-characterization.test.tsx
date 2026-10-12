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
// replaced so the board renders against a deterministic, in-memory backend.
// This file characterizes the board's CURRENT rendering contract before the
// field-set, seeding, filter, and detail-view work lands.
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

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1n,
    title: "ClayBar",
    category: Category.places,
    area: "JPNagar",
    shortDescription: "A pottery studio and clay bar.",
    fullDescription: "A pottery studio and clay bar in JP Nagar.",
    dateOrHours: "Open 10am–8pm",
    tags: [],
    createdBy: ANON,
    createdAt: 0n,
    ...overrides,
  };
}

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

describe("IRL board card rendering contract", () => {
  it("renders the category label, area, title, and short description", async () => {
    state.actor = makeActor({ listItems: vi.fn(async () => [makeItem()]) });
    renderApp();

    const card = await screen.findByTestId("events.card.1");
    expect(within(card).getByText("ClayBar")).toBeInTheDocument();
    expect(within(card).getByText("Places")).toBeInTheDocument();
    expect(within(card).getByText("JPNagar")).toBeInTheDocument();
    expect(
      within(card).getByText("A pottery studio and clay bar."),
    ).toBeInTheDocument();
    expect(within(card).getByText("Open 10am–8pm")).toBeInTheDocument();
  });

  it("omits the date line when dateOrHours is absent", async () => {
    state.actor = makeActor({
      listItems: vi.fn(async () => [makeItem({ dateOrHours: undefined })]),
    });
    renderApp();

    const card = await screen.findByTestId("events.card.1");
    expect(within(card).getByText("ClayBar")).toBeInTheDocument();
    expect(within(card).queryByText("Open 10am–8pm")).not.toBeInTheDocument();
  });

  it("renders one card per item returned by the backend", async () => {
    state.actor = makeActor({
      listItems: vi.fn(async () => [
        makeItem({ id: 1n, title: "ClayBar" }),
        makeItem({
          id: 2n,
          title: "The Royal Dance S",
          category: Category.culture,
        }),
      ]),
    });
    renderApp();

    await screen.findByText("ClayBar");
    const cards = screen.getAllByTestId(/^events\.card\.\d+$/);
    expect(cards).toHaveLength(2);
    const cultureCard = cards.find((card) =>
      within(card).queryByText("The Royal Dance S"),
    );
    expect(cultureCard).toBeDefined();
    expect(
      within(cultureCard as HTMLElement).getByText("Culture"),
    ).toBeInTheDocument();
  });
});

describe("IRL add-to-board form contract", () => {
  it("offers all four categories as options", async () => {
    renderApp();

    const select = screen.getByLabelText("Category");
    const options = within(select)
      .getAllByRole("option")
      .map((option) => (option as HTMLOptionElement).value);

    expect(options).toEqual(["events", "places", "food", "culture"]);
  });

  it("submits the selected category and a null dateOrHours", async () => {
    const user = userEvent.setup();
    const addItem = vi.fn(async () => ({}) as Item);
    state.actor = makeActor({ addItem });
    renderApp();

    await user.type(screen.getByLabelText("Name"), "ClayBar");
    await user.selectOptions(screen.getByLabelText("Category"), "places");
    await user.type(screen.getByLabelText("Area"), "JPNagar");
    await user.type(screen.getByLabelText("Description"), "A pottery studio.");
    await user.click(screen.getByRole("button", { name: /add to irl/i }));

    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith(
        "ClayBar",
        Category.places,
        "JPNagar",
        "A pottery studio.",
        "A pottery studio.",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        [],
      );
    });
  });
});
