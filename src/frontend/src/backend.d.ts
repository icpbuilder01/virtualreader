import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Book {
    title: string;
    content: string;
    isPublicDomain: boolean;
    author: string;
}
export interface ReadingProgress {
    bookmarks: Array<bigint>;
    position: bigint;
}
export interface BookMetadata {
    title: string;
    content: string;
    externalBlob: ExternalBlob;
    author: string;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBookToLibrary(title: string, author: string, content: string, externalBlob: ExternalBlob): Promise<void>;
    addBookmark(title: string, position: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bookExists(title: string): Promise<boolean>;
    deleteBookByTitle(title: string): Promise<void>;
    getAllReadingProgress(): Promise<Array<[string, ReadingProgress]>>;
    getBookProgress(title: string): Promise<ReadingProgress | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPublicBooks(): Promise<Array<Book>>;
    getUserLibrary(user: Principal): Promise<Array<BookMetadata>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasBook(title: string): Promise<boolean>;
    initBooks(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    removeBookFromLibrary(title: string): Promise<void>;
    removeBookmark(title: string, position: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBookProgress(title: string, position: bigint): Promise<void>;
}
