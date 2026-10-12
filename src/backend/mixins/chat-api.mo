import Map "mo:core/Map";
import Principal "mo:core/Principal";
import ChatLib "../lib/chat";
import Types "../types/chat";
import ProfileTypes "../types/profile";

mixin (
  messages : Map.Map<Nat, Types.Message>,
  nextMessageId : { var value : Nat },
  profiles : Map.Map<Principal, ProfileTypes.UserProfile>,
) {
  public query func listMessages() : async [Types.Message] {
    ChatLib.listMessages(messages);
  };

  public shared ({ caller }) func postMessage(text : Text) : async Types.Message {
    let authorName = switch (profiles.get(caller)) {
      case (?profile) { profile.displayName };
      case null { "Anonymous" };
    };
    await ChatLib.postMessage(messages, nextMessageId, caller, authorName, text);
  };
};
