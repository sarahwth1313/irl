import Common "common";

module {
  public type Category = {
    #events;
    #places;
    #food;
    #culture;
  };

  public type Item = {
    id : Common.ItemId;
    title : Text;
    category : Category;
    area : Text;
    shortDescription : Text;
    fullDescription : Text;
    // Kept for backward compatibility with items stored before the
    // spreadsheet field set was introduced. New entries leave it null.
    dateOrHours : ?Text;
    activityId : ?Text;
    startDate : ?Text;
    startTime : ?Text;
    endDate : ?Text;
    price : ?Text;
    ageRequirements : ?Text;
    address : ?Text;
    registrationLink : ?Text;
    mapsLink : ?Text;
    sourceLink : ?Text;
    lastVerified : ?Text;
    status : ?Text;
    tags : [Text];
    createdBy : Principal;
    createdAt : Common.Timestamp;
  };
};
