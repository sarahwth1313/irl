import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/chat";

module {
  public func listMessages(messages : Map.Map<Nat, Types.Message>) : [Types.Message] {
    let all = messages.values().toArray();
    all.sort(func (a, b) = Nat.compare(a.id, b.id));
  };

  public func postMessage(
    messages : Map.Map<Nat, Types.Message>,
    nextMessageId : { var value : Nat },
    author : Principal,
    authorName : Text,
    text : Text,
  ) : async Types.Message {
    let id = nextMessageId.value;
    nextMessageId.value := id + 1;
    let message : Types.Message = {
      id;
      author;
      authorName;
      text;
      createdAt = Time.now().toNat();
    };
    messages.add(id, message);
    message;
  };
};
