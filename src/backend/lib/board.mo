import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Seed "../seed/board";
import Types "../types/board";

module {
  public func listItems(items : Map.Map<Nat, Types.Item>) : [Types.Item] {
    items.values().toArray().sort(func(a, b) = Nat.compare(a.id, b.id));
  };

  public func addItem(
    items : Map.Map<Nat, Types.Item>,
    nextItemId : { var value : Nat },
    title : Text,
    category : Types.Category,
    area : Text,
    shortDescription : Text,
    fullDescription : Text,
    dateOrHours : ?Text,
    activityId : ?Text,
    startDate : ?Text,
    startTime : ?Text,
    endDate : ?Text,
    price : ?Text,
    ageRequirements : ?Text,
    address : ?Text,
    registrationLink : ?Text,
    mapsLink : ?Text,
    sourceLink : ?Text,
    lastVerified : ?Text,
    status : ?Text,
    tags : [Text],
    createdBy : Principal,
  ) : async Types.Item {
    let id = nextItemId.value;
    nextItemId.value := id + 1;
    let item : Types.Item = {
      id;
      title;
      category;
      area;
      shortDescription;
      fullDescription;
      dateOrHours;
      activityId;
      startDate;
      startTime;
      endDate;
      price;
      ageRequirements;
      address;
      registrationLink;
      mapsLink;
      sourceLink;
      lastVerified;
      status;
      tags;
      createdBy;
      createdAt = Time.now().toNat();
    };
    items.add(id, item);
    item;
  };

  // One-time idempotent seed of the 20 spreadsheet entries. Called from the
  // migration chain entry that introduces the extended Item shape, never from
  // an actor-body statement. The `seeded` guard makes it run exactly once.
  public func seedItems(
    items : Map.Map<Nat, Types.Item>,
    nextItemId : { var value : Nat },
    seeded : { var value : Bool },
  ) : () {
    Seed.seedItems(items, nextItemId, seeded);
  };
};
