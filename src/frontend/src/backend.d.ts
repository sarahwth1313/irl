import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Item {
    id: ItemId;
    startTime?: string;
    status?: string;
    title: string;
    endDate?: string;
    area: string;
    createdAt: Timestamp;
    createdBy: Principal;
    tags: Array<string>;
    mapsLink?: string;
    activityId?: string;
    sourceLink?: string;
    lastVerified?: string;
    dateOrHours?: string;
    shortDescription: string;
    address?: string;
    category: Category;
    fullDescription: string;
    price?: string;
    registrationLink?: string;
    ageRequirements?: string;
    startDate?: string;
}
export type ItemId = bigint;
export interface Message {
    id: MessageId;
    createdAt: Timestamp;
    text: string;
    authorName: string;
    author: Principal;
}
export type MessageId = bigint;
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Timestamp = bigint;
export interface UserProfile {
    displayName: string;
    verifiedEmail?: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum Category {
    places = "places",
    food = "food",
    culture = "culture",
    events = "events"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addItem(title: string, category: Category, area: string, shortDescription: string, fullDescription: string, dateOrHours: string | null, activityId: string | null, startDate: string | null, startTime: string | null, endDate: string | null, price: string | null, ageRequirements: string | null, address: string | null, registrationLink: string | null, mapsLink: string | null, sourceLink: string | null, lastVerified: string | null, status: string | null, tags: Array<string>): Promise<Item>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerEmail(): Promise<string | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    listItems(): Promise<Array<Item>>;
    listMessages(): Promise<Array<Message>>;
    postMessage(text: string): Promise<Message>;
    saveCallerUserProfile(displayName: string): Promise<UserProfile>;
    schema(): Promise<string>;
}
