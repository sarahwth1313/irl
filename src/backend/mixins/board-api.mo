import Map "mo:core/Map";
import BoardLib "../lib/board";
import Types "../types/board";

mixin (items : Map.Map<Nat, Types.Item>, nextItemId : { var value : Nat }) {
  public query func listItems() : async [Types.Item] {
    BoardLib.listItems(items);
  };

  public shared ({ caller }) func addItem(
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
  ) : async Types.Item {
    await BoardLib.addItem(
      items,
      nextItemId,
      title,
      category,
      area,
      shortDescription,
      fullDescription,
      dateOrHours,
      activityId,
      startDate,
      startTime,
      endDate,
      price,
      ageRequirements,
      address,
      registrationLink,
      mapsLink,
      sourceLink,
      lastVerified,
      status,
      tags,
      caller,
    );
  };
};
