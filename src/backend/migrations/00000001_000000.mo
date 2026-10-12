import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  public type OldActor = {};

  type Message = {
    id : Nat;
    author : Principal;
    authorName : Text;
    text : Text;
    createdAt : Nat;
  };

  type Category = { #events; #places; #food; #culture };

  type Item = {
    id : Nat;
    title : Text;
    category : Category;
    area : Text;
    shortDescription : Text;
    fullDescription : Text;
    dateOrHours : ?Text;
    createdBy : Principal;
    createdAt : Nat;
  };

  type UserProfile = {
    displayName : Text;
    verifiedEmail : ?Text;
  };

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    messages : Map.Map<Nat, Message>;
    nextMessageId : { var value : Nat };
    items : Map.Map<Nat, Item>;
    nextItemId : { var value : Nat };
    profiles : Map.Map<Principal, UserProfile>;
    emails : Map.Map<Principal, Text>;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      messages = Map.empty();
      nextMessageId = { var value = 0 };
      items = Map.empty();
      nextItemId = { var value = 0 };
      profiles = Map.empty();
      emails = Map.empty();
    };
  };
};
