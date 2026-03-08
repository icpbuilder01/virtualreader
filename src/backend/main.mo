import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Included prefabricated components for storage and authorization
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    email : Text;
  };

  public type Book = {
    title : Text;
    author : Text;
    content : Text;
    isPublicDomain : Bool;
  };

  public type BookMetadata = {
    title : Text;
    author : Text;
    content : Text;
    externalBlob : Storage.ExternalBlob;
  };

  public type ReadingProgress = {
    position : Nat;
    bookmarks : [Nat];
  };

  var userProfiles : Map.Map<Principal, UserProfile> = Map.empty<Principal, UserProfile>();
  var publicDomainBooks : Map.Map<Text, Book> = Map.empty<Text, Book>();
  var userLibraries : Map.Map<Principal, Map.Map<Text, BookMetadata>> = Map.empty<Principal, Map.Map<Text, BookMetadata>>();
  var userReadingProgress : Map.Map<Principal, Map.Map<Text, ReadingProgress>> = Map.empty<Principal, Map.Map<Text, ReadingProgress>>();

  // ── User Profile Functions ──────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ── Public Domain Books ─────────────────────────────────────────────────────

  public shared ({ caller }) func initBooks() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    publicDomainBooks.add(
      "Frankenstein",
      {
        title = "Frankenstein";
        author = "Mary Shelley";
        content = "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking...";
        isPublicDomain = true;
      },
    );
    publicDomainBooks.add(
      "Don Quixote",
      {
        title = "Don Quixote";
        author = "Miguel de Cervantes";
        content = "In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing...";
        isPublicDomain = true;
      },
    );
    publicDomainBooks.add(
      "Les Misérables",
      {
        title = "Les Misérables";
        author = "Victor Hugo";
        content = "In 1815, M. Charles-François-Bienvenu Myriel was Bishop of D—— He was an old man of about seventy-five years of age; he had occupied the see of D—— since 1806. Although this detail has no connection whatever with the real substance of what we call the story of his life, it may not be without a certain interest...";
        isPublicDomain = true;
      },
    );
    publicDomainBooks.add(
      "Pride and Prejudice",
      {
        title = "Pride and Prejudice";
        author = "Jane Austen";
        content = "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families...";
        isPublicDomain = true;
      },
    );
    publicDomainBooks.add(
      "Moby Dick",
      {
        title = "Moby Dick";
        author = "Herman Melville";
        content = "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world...";
        isPublicDomain = true;
      },
    );
    publicDomainBooks.add(
      "Around the World in 80 Days",
      {
        title = "Around the World in 80 Days";
        author = "Jules Verne";
        content = "Mr. Phileas Fogg lived, in 1872, at No. 7, Saville Row, Burlington Gardens, the house in which Sheridan died in 1814. He was one of the most noticeable members of the Reform Club, though he seemed always to avoid attracting attention; an enigmatical personage, about whom little was known, except that he was a polished man of the world...";
        isPublicDomain = true;
      },
    );
    publicDomainBooks.add(
      "Treasure Island",
      {
        title = "Treasure Island";
        author = "Robert Louis Stevenson";
        content = "SQUIRE TRELAWNEY, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island, from the beginning to the end, keeping nothing back but the bearings of the island, and that only because there is still treasure not yet lifted, I take up my pen in the year of grace 17__ and go back to the time when my father kept the Admiral Benbow inn, and the brown old seaman with the sabre-cut first took up his lodging under our roof...";
        isPublicDomain = true;
      },
    );
  };

  // Anyone (including guests) can view public domain books
  public query ({ caller }) func getPublicBooks() : async [Book] {
    publicDomainBooks.values().toArray();
  };

  // Anyone (including guests) can check if a public domain book exists
  public query ({ caller }) func bookExists(title : Text) : async Bool {
    publicDomainBooks.containsKey(title);
  };

  // Admin-only: delete a public domain book
  public shared ({ caller }) func deleteBookByTitle(title : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    publicDomainBooks.remove(title);
  };

  // ── Personal Library ────────────────────────────────────────────────────────

  // Users can only view their own library; admins can view any
  public query ({ caller }) func getUserLibrary(user : Principal) : async [BookMetadata] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own library");
    };
    switch (userLibraries.get(user)) {
      case (null) { [] };
      case (?library) { library.values().toArray() };
    };
  };

  // Authenticated users can add books to their own library
  public shared ({ caller }) func addBookToLibrary(title : Text, author : Text, content : Text, externalBlob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let book : BookMetadata = {
      title;
      author;
      content;
      externalBlob;
    };

    let userLibrary = switch (userLibraries.get(caller)) {
      case (null) { Map.empty<Text, BookMetadata>() };
      case (?library) { library };
    };
    userLibrary.add(title, book);
    userLibraries.add(caller, userLibrary);
  };

  // Authenticated users can remove books from their own library
  public shared ({ caller }) func removeBookFromLibrary(title : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (userLibraries.get(caller)) {
      case (null) { Runtime.trap("User library does not exist") };
      case (?library) {
        library.remove(title);
      };
    };
  };

  // Authenticated users can check if they have a book in their own library
  public query ({ caller }) func hasBook(title : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (userLibraries.get(caller)) {
      case (null) { false };
      case (?library) { library.containsKey(title) };
    };
  };

  // ── Reading Progress & Bookmarks ────────────────────────────────────────────

  // Authenticated users can update their own reading progress
  public shared ({ caller }) func updateBookProgress(title : Text, position : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    // Verify the book exists in the user's library or in public domain books
    let inPersonalLibrary = switch (userLibraries.get(caller)) {
      case (null) { false };
      case (?library) { library.containsKey(title) };
    };
    let inPublicDomain = publicDomainBooks.containsKey(title);

    if (not inPersonalLibrary and not inPublicDomain) {
      Runtime.trap("Book not found in your library or public domain books");
    };

    let callerProgress = switch (userReadingProgress.get(caller)) {
      case (null) { Map.empty<Text, ReadingProgress>() };
      case (?progress) { progress };
    };

    let existingBookmarks = switch (callerProgress.get(title)) {
      case (null) { [] };
      case (?existing) { existing.bookmarks };
    };

    let updatedProgress : ReadingProgress = {
      position;
      bookmarks = existingBookmarks;
    };

    callerProgress.add(title, updatedProgress);
    userReadingProgress.add(caller, callerProgress);
  };

  // Authenticated users can get their own reading progress
  public query ({ caller }) func getBookProgress(title : Text) : async ?ReadingProgress {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (userReadingProgress.get(caller)) {
      case (null) { null };
      case (?progress) { progress.get(title) };
    };
  };

  // Authenticated users can add a bookmark to a book
  public shared ({ caller }) func addBookmark(title : Text, position : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let callerProgress = switch (userReadingProgress.get(caller)) {
      case (null) { Map.empty<Text, ReadingProgress>() };
      case (?progress) { progress };
    };

    let existing = switch (callerProgress.get(title)) {
      case (null) { { position = 0; bookmarks = [] } };
      case (?p) { p };
    };

    // Add bookmark if not already present
    let alreadyExists = existing.bookmarks.find(func(b) { b == position });
    let newBookmarks = switch (alreadyExists) {
      case (?_) { existing.bookmarks };
      case (null) {
        existing.bookmarks.concat([position]);
      };
    };

    let updatedProgress : ReadingProgress = {
      position = existing.position;
      bookmarks = newBookmarks;
    };

    callerProgress.add(title, updatedProgress);
    userReadingProgress.add(caller, callerProgress);
  };

  // Authenticated users can remove a bookmark from a book
  public shared ({ caller }) func removeBookmark(title : Text, position : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    switch (userReadingProgress.get(caller)) {
      case (null) { Runtime.trap("No reading progress found") };
      case (?callerProgress) {
        switch (callerProgress.get(title)) {
          case (null) { Runtime.trap("No progress found for this book") };
          case (?existing) {
            let newBookmarks = existing.bookmarks.filter(func(b) { b != position });
            let updatedProgress : ReadingProgress = {
              position = existing.position;
              bookmarks = newBookmarks;
            };
            callerProgress.add(title, updatedProgress);
            userReadingProgress.add(caller, callerProgress);
          };
        };
      };
    };
  };

  // Authenticated users can get all their reading progress
  public query ({ caller }) func getAllReadingProgress() : async [(Text, ReadingProgress)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (userReadingProgress.get(caller)) {
      case (null) { [] };
      case (?progress) { progress.entries().toArray() };
    };
  };
};
