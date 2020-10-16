export * from "./created";
export * from "./deleted";
export * from "./updated";

export interface PathResolver<T> {
  (type: T): string;
}
