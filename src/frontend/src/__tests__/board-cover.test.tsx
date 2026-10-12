import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Item, Message, UserProfile } from "@/backend";
import { Category } from "@/backend";
import { Principal } from "@icp-sdk/core/principal";

const ANON = Principal.anonymous();

// ---------------------------------------------------------------------------
// Local typed actor mock. The real `useActor`/`useInternetIdentity` hooks are
// replaced so the board renders against a deterministic, in-memory backend. This
// file covers the accepted board behavior: the 20 seeded entries, category
// filter, free-text search, sort, URL state, the detail dialog, and the
// add-then-appear journey.
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
    shortDescription: "Ceramic painting",
    fullDescription: "Ceramic painting",
    activityId: "CB001",
    address: "19, 15th Cross, 100 Feet Ring Road, 4th",
    price: "To check",
    ageRequirements: "Check venue policy",
    lastVerified: "2026-10-11",
    status: "Needs verification",
    mapsLink: "https://www.google.com/maps/search",
    sourceLink: "https://www.google.com/maps/search",
    registrationLink: "Needs verification",
    tags: ["painting", "pottery", "coffee", "creative"],
    createdBy: ANON,
    createdAt: 0n,
    ...overrides,
  };
}

const SEEDED: Item[] = [
  makeItem(),
  makeItem({
    id: 2n,
    title: "Mitti - The Pottery",
    activityId: "CB011",
    area: "Kodigehalli",
    tags: ["pottery", "clay", "creative"],
  }),
  makeItem({
    id: 3n,
    title: "Pottery Class (MV)",
    activityId: "CB012",
    area: "Pottery Town",
    tags: ["pottery", "beginner", "art"],
  }),
  makeItem({
    id: 4n,
    title: "The Royal Dance S",
    activityId: "CB016",
    category: Category.culture,
    area: "Jayanagar",
    tags: ["dance", "music", "learn"],
  }),
];

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
    listItems: vi.fn(async () => SEEDED),
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
  window.history.replaceState(null, "", "/");
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

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("IRL board seeding and field set", () => {
  it("shows all 20 seeded entries on first load with no manual action", async () => {
    const seeded = Array.from({ length: 20 }, (_, index) =>
      makeItem({
        id: BigInt(index),
        title: `Entry ${String(index + 1)}`,
        activityId: `CB${String(index + 1).padStart(3, "0")}`,
      }),
    );
    state.actor = makeActor({ listItems: vi.fn(async () => seeded) });
    renderApp();

    expect(await screen.findByText("Entry 1")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^events\.card\.\d+$/)).toHaveLength(20);
    expect(screen.getByTestId("events.result_count")).toHaveTextContent(
      "20 entries",
    );
  });

  it("renders CB001 ClayBar under Places with its area and tags as chips", async () => {
    renderApp();

    const card = await screen.findByTestId("events.card.1");
    expect(within(card).getByText("ClayBar")).toBeInTheDocument();
    expect(within(card).getByText("Places")).toBeInTheDocument();
    expect(within(card).getByText("JPNagar")).toBeInTheDocument();
    expect(within(card).getByText("CB001")).toBeInTheDocument();
    // Tags render as individual chips, not one comma-separated string.
    for (const tag of ["painting", "pottery", "coffee", "creative"]) {
      expect(within(card).getByText(tag)).toBeInTheDocument();
    }
    expect(
      within(card).queryByText("painting, pottery, coffee, creative"),
    ).not.toBeInTheDocument();
  });

  it("renders CB016 The Royal Dance S under Culture", async () => {
    renderApp();

    const card = await screen.findByTestId("events.card.4");
    expect(within(card).getByText("The Royal Dance S")).toBeInTheDocument();
    expect(within(card).getByText("Culture")).toBeInTheDocument();
  });
});

describe("IRL board filter, search, and sort", () => {
  it("filters to Places, hides other categories, and updates the URL", async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findByText("ClayBar");
    await user.click(screen.getByTestId("events.filter.tab.places"));

    await waitFor(() => {
      expect(screen.queryByText("The Royal Dance S")).not.toBeInTheDocument();
    });
    expect(screen.getByText("ClayBar")).toBeInTheDocument();
    expect(window.location.search).toContain("category=places");
  });

  it("searches 'pottery' and returns CB011 and CB012", async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findByText("ClayBar");
    await user.type(screen.getByTestId("events.search_input"), "pottery");

    await waitFor(() => {
      expect(screen.getByText("Mitti - The Pottery")).toBeInTheDocument();
    });
    expect(screen.getByText("Pottery Class (MV)")).toBeInTheDocument();
    // The Royal Dance S has no pottery tag or description, so it drops out.
    expect(screen.queryByText("The Royal Dance S")).not.toBeInTheDocument();
    expect(window.location.search).toContain("q=pottery");
  });

  it("shows a result count and a clear-filters action when a filter is active", async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findByText("ClayBar");
    expect(
      screen.queryByTestId("events.clear_filters_button"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId("events.filter.tab.places"));

    expect(await screen.findByTestId("events.result_count")).toHaveTextContent(
      "3 entries",
    );
    const clear = screen.getByTestId("events.clear_filters_button");
    await user.click(clear);

    await waitFor(() => {
      expect(screen.getByText("The Royal Dance S")).toBeInTheDocument();
    });
    expect(window.location.search).toBe("");
  });

  it("sorts by area and reflects the sort in the URL", async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findByText("ClayBar");
    await user.selectOptions(screen.getByTestId("events.sort.select"), "area");

    await waitFor(() => {
      expect(window.location.search).toContain("sort=area");
    });
    // Areas sort ascending: Jayanagar, JPNagar, Kodigehalli, Pottery Town.
    const cards = screen.getAllByTestId(/^events\.card\.\d+$/);
    expect(within(cards[0]).getByText("Jayanagar")).toBeInTheDocument();
  });
});

describe("IRL board detail view", () => {
  it("opens a detail dialog showing address, price, age, last verified, and status", async () => {
    const user = userEvent.setup();
    renderApp();

    const card = await screen.findByTestId("events.card.1");
    await user.click(card);

    const dialog = await screen.findByTestId("events.detail.dialog");
    expect(within(dialog).getByText("ClayBar")).toBeInTheDocument();
    expect(
      within(dialog).getByText("19, 15th Cross, 100 Feet Ring Road, 4th"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("To check")).toBeInTheDocument();
    expect(within(dialog).getByText("Check venue policy")).toBeInTheDocument();
    expect(within(dialog).getByText("2026-10-11")).toBeInTheDocument();
    expect(within(dialog).getByText("Needs verification")).toBeInTheDocument();
  });

  it("exposes the maps and source links as outbound actions", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByTestId("events.card.1"));

    const dialog = await screen.findByTestId("events.detail.dialog");
    const links = within(dialog).getAllByTestId("events.detail.link");
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("https://www.google.com/maps/search");
  });
});

describe("IRL add-to-board journey", () => {
  it("shows a newly added entry on the board immediately", async () => {
    const user = userEvent.setup();
    const created = makeItem({
      id: 99n,
      title: "Sunday filter coffee walk",
      category: Category.food,
      area: "Indiranagar",
      activityId: undefined,
      tags: [],
    });
    const listItems = vi
      .fn<() => Promise<Item[]>>()
      .mockResolvedValueOnce(SEEDED)
      .mockResolvedValueOnce([...SEEDED, created]);
    state.actor = makeActor({
      listItems,
      addItem: vi.fn(async () => created),
    });
    renderApp();

    await user.type(
      await screen.findByLabelText("Name"),
      "Sunday filter coffee walk",
    );
    await user.selectOptions(screen.getByLabelText("Category"), "food");
    await user.type(screen.getByLabelText("Area"), "Indiranagar");
    await user.type(
      screen.getByLabelText("Description"),
      "A slow morning walk.",
    );
    await user.click(screen.getByRole("button", { name: /add to irl/i }));

    expect(
      await screen.findByText("Sunday filter coffee walk"),
    ).toBeInTheDocument();
  });
});
