import { EntityTarget } from "../../api/crud-service";

export * from "./saved";
export * from "./deleted";

export interface PathResolver<T> {
  (type: T): string;
}

export function getPath<T>(path: string | PathResolver<T> = "/", entity: EntityTarget<T>): string {
  let result;

  if (typeof path === "function") {
    result = path(entity.entity);
  } else {
    result = path;
  }

  return result;
}
