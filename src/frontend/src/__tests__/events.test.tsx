import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Item, Message, UserProfile } from "@/backend";
import { Category } from "@/backend";
import { Principal } from "@icp-sdk/core/principal";

const ANON = Principal.anonymous();

// ---------------------------------------------------------------------------
// Local typed actor mock. The real `useActor`/`useInternetIdentity` hooks are
// replaced so the events board renders against a deterministic backend.
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

describe("IRL events board", () => {
  it("adds an item with the typed form values and the selected category", async () => {
    const user = userEvent.setup();
    const addItem = vi.fn(async () => ({}) as Item);
    state.actor = makeActor({ addItem });
    renderApp();

    await user.type(screen.getByLabelText("Name"), "Sunday filter coffee walk");
    await user.selectOptions(screen.getByLabelText("Category"), "food");
    await user.type(screen.getByLabelText("Area"), "Indiranagar");
    await user.type(
      screen.getByLabelText("Description"),
      "A slow morning walk.",
    );
    await user.click(screen.getByRole("button", { name: /add to irl/i }));

    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith(
        "Sunday filter coffee walk",
        Category.food,
        "Indiranagar",
        "A slow morning walk.",
        "A slow morning walk.",
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

  it("keeps the submit button disabled until the required fields are filled", async () => {
    const user = userEvent.setup();
    renderApp();

    const submit = screen.getByRole("button", { name: /add to irl/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Name"), "Only a title");
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Area"), "Jayanagar");
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Description"), "Now complete");
    expect(submit).toBeEnabled();
  });

  it("surfaces an error state when adding an item fails", async () => {
    const user = userEvent.setup();
    state.actor = makeActor({
      addItem: vi.fn(async () => {
        throw new Error("backend unavailable");
      }),
    });
    renderApp();

    await user.type(screen.getByLabelText("Name"), "Sunday walk");
    await user.type(screen.getByLabelText("Area"), "Indiranagar");
    await user.type(screen.getByLabelText("Description"), "A walk.");
    await user.click(screen.getByRole("button", { name: /add to irl/i }));

    expect(await screen.findByTestId("events.error_state")).toBeInTheDocument();
    // The page survives the failed mutation rather than blanking.
    expect(
      screen.getByRole("heading", { name: /show up irl/i }),
    ).toBeInTheDocument();
  });
});
