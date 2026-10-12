import Common "common";

module {
  public type Message = {
    id : Common.MessageId;
    author : Principal;
    authorName : Text;
    text : Text;
    createdAt : Common.Timestamp;
  };
};
