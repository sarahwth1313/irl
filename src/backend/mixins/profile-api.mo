import Map "mo:core/Map";
import Principal "mo:core/Principal";
import ProfileLib "../lib/profile";
import Types "../types/profile";

mixin (
  profiles : Map.Map<Principal, Types.UserProfile>,
  emails : Map.Map<Principal, Text>,
) {
  public query ({ caller }) func getCallerUserProfile() : async ?Types.UserProfile {
    ProfileLib.getProfile(profiles, caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(displayName : Text) : async Types.UserProfile {
    await ProfileLib.saveProfile(profiles, caller, displayName);
  };

  public query ({ caller }) func getCallerEmail() : async ?Text {
    emails.get(caller);
  };
};
