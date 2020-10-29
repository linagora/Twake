import { EntityTarget, ExecutionContext } from "../../api/crud-service";

export * from "./created";
export * from "./deleted";
export * from "./updated";

export interface PathResolver<T> {
  (type: T, context?: ExecutionContext): string;
}

export function getPath<T>(path : string | PathResolver<T> = "/", entity: EntityTarget<T>, context: ExecutionContext): string {
  let result;

  if (typeof path === "function") {
    result = path(entity.entity, context);
  } else {
    result = path;
  }

  return result;
}
