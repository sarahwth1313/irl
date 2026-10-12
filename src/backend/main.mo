import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import ChatMixin "mixins/chat-api";
import BoardMixin "mixins/board-api";
import ProfileMixin "mixins/profile-api";
import ApiDocMixin "mixins/api-doc";
import ChatTypes "types/chat";
import BoardTypes "types/board";
import ProfileTypes "types/profile";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let messages : Map.Map<Nat, ChatTypes.Message>;
  let nextMessageId : { var value : Nat };
  let items : Map.Map<Nat, BoardTypes.Item>;
  let nextItemId : { var value : Nat };
  let seeded : { var value : Bool };
  let profiles : Map.Map<Principal, ProfileTypes.UserProfile>;
  let emails : Map.Map<Principal, Text>;

  transient let anyPrincipal = Principal.fromText("aaaaa-aa");

  include MixinAuthorization(
    accessControlState,
    ?(func(caller : Principal, attrs : { name : ?Text; email : ?Text; sso : ?Text }) {
      let displayName = attrs.name ?? "Anonymous";
      let existingEmail = switch (profiles.get(caller)) {
        case (?existing) { existing.verifiedEmail };
        case null { null };
      };
      let verifiedEmail : ?Text = switch (attrs.email) {
        case (?email) { ?email };
        case null { existingEmail };
      };
      profiles.add(caller, { displayName; verifiedEmail });
      switch (verifiedEmail) {
        case (?email) { emails.add(caller, email) };
        case null { emails.remove(caller) };
      };
    }),
  );
  include ChatMixin(messages, nextMessageId, profiles);
  include BoardMixin(items, nextItemId);
  include ProfileMixin(profiles, emails);
  include ApiDocMixin();
  include Expose({
    entities = [
      messages.toEntity("message", "Message", "id")
        .sample({ id = 0; author = anyPrincipal; authorName = ""; text = ""; createdAt = 0 })
        .public_()
        .build(),
      items.toEntityManual("item", "Item", "id")
        .sample({
          id = 0;
          title = "";
          category = #events;
          area = "";
          shortDescription = "";
          fullDescription = "";
          dateOrHours = ?"";
          activityId = ?"";
          startDate = ?"";
          startTime = ?"";
          endDate = ?"";
          price = ?"";
          ageRequirements = ?"";
          address = ?"";
          registrationLink = ?"";
          mapsLink = ?"";
          sourceLink = ?"";
          lastVerified = ?"";
          status = ?"";
          tags = [];
          createdBy = anyPrincipal;
          createdAt = 0;
        })
        .payload("id", func i = i.id)
        .payload("title", func i = i.title)
        .payload("category", func i = switch (i.category) {
          case (#events) { "events" };
          case (#places) { "places" };
          case (#food) { "food" };
          case (#culture) { "culture" };
        })
        .payload("area", func i = i.area)
        .payload("shortDescription", func i = i.shortDescription)
        .payload("fullDescription", func i = i.fullDescription)
        .payload("dateOrHours", func i = i.dateOrHours)
        .payload("activityId", func i = i.activityId)
        .payload("startDate", func i = i.startDate)
        .payload("startTime", func i = i.startTime)
        .payload("endDate", func i = i.endDate)
        .payload("price", func i = i.price)
        .payload("ageRequirements", func i = i.ageRequirements)
        .payload("address", func i = i.address)
        .payload("registrationLink", func i = i.registrationLink)
        .payload("mapsLink", func i = i.mapsLink)
        .payload("sourceLink", func i = i.sourceLink)
        .payload("lastVerified", func i = i.lastVerified)
        .payload("status", func i = i.status)
        .payload("tags", func i = i.tags.values().join(", "))
        .payload("createdBy", func i = i.createdBy)
        .payload("createdAt", func i = i.createdAt)
        .public_()
        .build(),
      profiles.toEntity("profile", "UserProfile", "displayName")
        .sample({ displayName = ""; verifiedEmail = ?"" })
        .controllerOnly()
        .build(),
    ];
  });
};
