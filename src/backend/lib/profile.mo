import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/profile";

module {
  public func getProfile(profiles : Map.Map<Principal, Types.UserProfile>, caller : Principal) : ?Types.UserProfile {
    profiles.get(caller);
  };

  public func saveProfile(
    profiles : Map.Map<Principal, Types.UserProfile>,
    caller : Principal,
    displayName : Text,
  ) : async Types.UserProfile {
    let existingEmail = switch (profiles.get(caller)) {
      case (?existing) { existing.verifiedEmail };
      case null { null };
    };
    let profile : Types.UserProfile = {
      displayName;
      verifiedEmail = existingEmail;
    };
    profiles.add(caller, profile);
    profile;
  };
};
