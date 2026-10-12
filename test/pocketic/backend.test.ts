import { PocketIc } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
    return;
  }
  // `[baseline, current]`, the same install contract the hosted deploy uses for
  // a converted project. The upgrade replays the chain from the legacy schema.
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BASELINE_WASM,
  });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  ({ actor, canisterId } = installed);
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  await expect(actor.listMessages()).resolves.toEqual([]);
  await expect(actor.getCallerUserProfile()).resolves.toEqual([]);
  await expect(actor.getCallerEmail()).resolves.toEqual([]);
});

it("ships pre-loaded with the 20 spreadsheet entries", async () => {
  const items = await actor.listItems();
  expect(items).toHaveLength(20);
  const activityIds = items.map((item) => item.activityId[0]);
  expect(activityIds).toEqual(
    Array.from({ length: 20 }, (_, index) => `CB${String(index + 1).padStart(3, "0")}`),
  );
});

it("stores the full spreadsheet field set on a seeded entry", async () => {
  const items = await actor.listItems();
  const clayBar = items.find((item) => item.activityId[0] === "CB001");
  expect(clayBar).toBeDefined();
  expect(clayBar).toMatchObject({
    title: "ClayBar",
    category: { places: null },
    area: "JPNagar",
    tags: ["painting", "pottery", "coffee", "creative"],
  });
  expect(clayBar?.address).toEqual([
    "19, 15th Cross, 100 Feet Ring Road, 4th",
  ]);
  expect(clayBar?.price).toEqual(["To check"]);
  expect(clayBar?.ageRequirements).toEqual(["Check venue policy"]);
  expect(clayBar?.lastVerified).toEqual(["2026-10-11"]);
  expect(clayBar?.status).toEqual(["Needs verification"]);
});

it("maps spreadsheet categories onto the board categories", async () => {
  const items = await actor.listItems();
  const byActivityId = new Map(items.map((item) => [item.activityId[0], item]));
  expect(byActivityId.get("CB001")?.category).toEqual({ places: null });
  expect(byActivityId.get("CB009")?.category).toEqual({ events: null });
  expect(byActivityId.get("CB016")?.category).toEqual({ culture: null });
});

it("round-trips a message through the real canister", async () => {
  const created = await actor.postMessage("Filter coffee at 8?");
  expect(created).toMatchObject({ text: "Filter coffee at 8?" });

  const messages = await actor.listMessages();
  expect(messages).toContainEqual(
    expect.objectContaining({ id: created.id, text: "Filter coffee at 8?" }),
  );
});

it("round-trips a board item through the real canister", async () => {
  const created = await actor.addItem(
    "Sunday filter coffee walk",
    { food: null },
    "Indiranagar",
    "A slow morning walk.",
    "A slow morning walk.",
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  );
  expect(created).toMatchObject({ title: "Sunday filter coffee walk" });

  const items = await actor.listItems();
  expect(items).toContainEqual(
    expect.objectContaining({ id: created.id, title: "Sunday filter coffee walk" }),
  );
});

it("assigns incrementing ids and stores the caller and timestamp on addItem", async () => {
  const first = await actor.addItem(
    "ClayBar",
    { places: null },
    "JPNagar",
    "A pottery studio.",
    "A pottery studio and clay bar.",
    ["Open 10am–8pm"],
    ["CB021"],
    ["12 Oct 2026"],
    ["7:30 AM"],
    ["12 Oct 2026"],
    ["Free"],
    ["All ages"],
    ["100 Feet Road"],
    ["https://example.com/register"],
    ["https://maps.google.com/"],
    ["https://example.com/source"],
    ["10 Oct 2026"],
    ["Open"],
    ["pottery", "clay"],
  );
  const second = await actor.addItem(
    "The Royal Dance S",
    { culture: null },
    "Jayanagar",
    "A dance school.",
    "A dance school.",
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  );

  expect(second.id).toBe(first.id + 1n);
  expect(first.createdAt).toBeGreaterThan(0n);
  expect(first.createdBy).toBeDefined();
  // The optional dateOrHours round-trips as a Candid optional.
  expect(first.dateOrHours).toEqual(["Open 10am–8pm"]);
  expect(second.dateOrHours).toEqual([]);
  // The extended spreadsheet fields round-trip too.
  expect(first.activityId).toEqual(["CB021"]);
  expect(first.startDate).toEqual(["12 Oct 2026"]);
  expect(first.startTime).toEqual(["7:30 AM"]);
  expect(first.endDate).toEqual(["12 Oct 2026"]);
  expect(first.price).toEqual(["Free"]);
  expect(first.ageRequirements).toEqual(["All ages"]);
  expect(first.address).toEqual(["100 Feet Road"]);
  expect(first.registrationLink).toEqual(["https://example.com/register"]);
  expect(first.mapsLink).toEqual(["https://maps.google.com/"]);
  expect(first.sourceLink).toEqual(["https://example.com/source"]);
  expect(first.lastVerified).toEqual(["10 Oct 2026"]);
  expect(first.status).toEqual(["Open"]);
  expect(first.tags).toEqual(["pottery", "clay"]);
});

it("returns listItems sorted ascending by id", async () => {
  const items = await actor.listItems();
  const ids = items.map((item) => item.id);
  expect(ids).toEqual([...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
});

it("stores and returns the caller's profile and email", async () => {
  const saved = await actor.saveCallerUserProfile("Asha");
  expect(saved).toMatchObject({ displayName: "Asha" });

  await expect(actor.getCallerUserProfile()).resolves.toEqual([
    expect.objectContaining({ displayName: "Asha" }),
  ]);
  // No Internet Identity attributes were supplied, so the email is absent.
  await expect(actor.getCallerEmail()).resolves.toEqual([]);
});

it("returns Markdown describing the public API from getApiDoc", async () => {
  const doc = await actor.getApiDoc();
  expect(typeof doc).toBe("string");
  expect(doc).toContain("# IRL Backend API");
  expect(doc).toContain("listMessages");
  expect(doc).toContain("postMessage");
  expect(doc).toContain("listItems");
  expect(doc).toContain("addItem");
  expect(doc).toContain("getCallerUserProfile");
  expect(doc).toContain("saveCallerUserProfile");
  expect(doc).toContain("getCallerEmail");
});

it("does not show one caller's profile to another", async () => {
  const { createIdentity } = await import("@dfinity/pic");
  const alice = createIdentity("alice");
  const bob = createIdentity("bob");

  actor.setIdentity(alice);
  await actor.saveCallerUserProfile("Alice");

  actor.setIdentity(bob);
  await expect(actor.getCallerUserProfile()).resolves.toEqual([]);

  actor.setIdentity(alice);
  await expect(actor.getCallerUserProfile()).resolves.toEqual([
    expect.objectContaining({ displayName: "Alice" }),
  ]);
});
