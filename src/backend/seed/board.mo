import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/board";

module {
  // The 20 rows from the 'IRL' spreadsheet (CB001–CB020). Each row is a
  // (activityId, title, category, area, shortDescription, address, tags)
  // tuple; the remaining spreadsheet fields share the common values below.
  let rows : [(Text, Text, Types.Category, Text, Text, Text, [Text])] = [
    ("CB001", "ClayBar", #places, "JPNagar", "Ceramic painting", "19, 15th Cross, 100 Feet Ring Road, 4th", ["painting", "pottery", "coffee", "creative"]),
    ("CB002", "Minosh Art Café", #places, "HSR Layout", "Art and DIY activity", "1919, 21st Main Road, 25th Cross, Se", ["art", "DIY", "resin art", "café", "friends"]),
    ("CB003", "Brew La Pax", #places, "HBR Layout", "Café with creative", "412, 4th G Main Road, HBRBR Layout 2", ["coffee", "workshops", "books", "poetry", "music"]),
    ("CB004", "Dyu Art Café", #places, "Koramangala", "Art café for a relax", "23, 22, 1st Cross Road, Koramangala", ["art café", "food", "friends", "chill"]),
    ("CB005", "Paint Café Studio", #places, "Whitefield", "Painting-focused c", "4th Floor, SV Atrium, 16 ECC Road, W", ["painting", "art", "creative activity"]),
    ("CB006", "Nothing Before Co", #places, "Multiple locations", "Coffee and café d", "Find nearest branch before visiting", ["coffee", "iced coffee", "drinks", "quick meetup"]),
    ("CB007", "Matteo Coffee", #places, "Church Street", "Coffee and café fc", "2 Church Street, Bengaluru", ["coffee", "café", "friends", "city outing"]),
    ("CB008", "Pasta Street", #places, "Cunningham Road", "Italian restaurant", "Chicago Avenue, 37/2 Cunningham R", ["pasta", "Italian food", "dinner", "friends"]),
    ("CB009", "Bengaluru Running", #events, "Multiple areas", "Directory to explore", "Multiple locations", ["running", "fitness", "community", "beginner"]),
    ("CB010", "Community Walk", #events, "Multiple areas", "Placeholder for ve", "To be confirmed", ["Find a group", "walking", "outdoors", "social", "wellness"]),
    ("CB011", "Mitti - The Pottery", #places, "Kodigehalli", "Pottery classes an", "486, 3rd Floor, 1st A Cross, 4th Main I", ["pottery", "clay", "creative"]),
    ("CB012", "Pottery Class (MV)", #places, "Pottery Town", "Pottery class and", "2nd Cross Road, Pottery Town, Bensa", ["pottery", "beginner", "art"]),
    ("CB013", "Sri Chamarajendra", #places, "Central Bengaluru", "Public park for wa", "Nunegundlapalli, Ambedkar Veedhi, E", ["park", "walking", "nature"]),
    ("CB014", "Bugle Rock Park", #places, "Basavanagudi", "Park for walks an", "Bull Temple Road, Basavanagudi, Ber", ["park", "walking", "outdoors"]),
    ("CB015", "JP Park", #places, "Mathikere", "Public park for ou", "Tank Bund Road, Mathikere, Bengalur", ["park", "walking", "nature"]),
    ("CB016", "The Royal Dance S", #culture, "Jayanagar", "Dance classes an", "ShubhaShri Plaza, 7th Main Road, Jay", ["dance", "music", "learn"]),
    ("CB017", "Art Beat", #culture, "HSR Layout", "Art classes and or", "Eswari Corner, 808, 2nd Floor, 19th M", ["art", "painting", "creativity"]),
    ("CB018", "Board 4 Bored", #places, "Basavanagudi", "Board-game café i", "3rd Floor, Chatanya Plaza, D V Gund", ["board games", "friends", "café"]),
    ("CB019", "Now Boarding Café", #places, "Jayanagar", "Board-game café i", "8/150/4, 9th Main Road, Jayanagar", ["board games", "friends", "café"]),
    ("CB020", "Live Music Events", #culture, "Bengaluru", "Discover upcoming", "Various venues", ["Needs event detail", "music"]),
  ];

  let price = "To check";
  let ageRequirements = "Check venue policy";
  let registrationLink = "Needs verification";
  let mapsLink = "https://www.google.com/maps/search";
  let sourceLink = "https://www.google.com/maps/search";
  let lastVerified = "2026-10-11";
  let status = "Needs verification";

  // Inserts the 20 rows exactly once, guarded by `seeded`. Idempotent: a
  // second call is a no-op. Called from the migration chain entry that
  // introduces the extended Item shape.
  public func seedItems(
    items : Map.Map<Nat, Types.Item>,
    nextItemId : { var value : Nat },
    seeded : { var value : Bool },
  ) : () {
    if (seeded.value) { return };
    let seedPrincipal = Principal.fromText("aaaaa-aa");
    for ((activityId, title, category, area, shortDescription, address, tags) in rows.values()) {
      let id = nextItemId.value;
      nextItemId.value := id + 1;
      items.add(id, {
        id;
        title;
        category;
        area;
        shortDescription;
        fullDescription = shortDescription;
        dateOrHours = null;
        activityId = ?activityId;
        startDate = null;
        startTime = null;
        endDate = null;
        price = ?price;
        ageRequirements = ?ageRequirements;
        address = ?address;
        registrationLink = ?registrationLink;
        mapsLink = ?mapsLink;
        sourceLink = ?sourceLink;
        lastVerified = ?lastVerified;
        status = ?status;
        tags;
        createdBy = seedPrincipal;
        createdAt = 0;
      });
    };
    seeded.value := true;
  };
};
