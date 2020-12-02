import { ResourcePath } from "../../../../../core/platform/services/realtime/types";
import { EntityTarget, ExecutionContext } from "../../api/crud-service";

export * from "./created";
export * from "./deleted";
export * from "./updated";
export * from "./saved";

export type RealtimePath<T> = string | ResourcePath | ResourcePathResolver<T>;
export interface ResourcePathResolver<T> {
  (type: T, context?: ExecutionContext): ResourcePath;
}
export interface PathResolver<T> {
  (type: T, context?: ExecutionContext): string;
}

export function getRoom<T>(
  path: RealtimePath<T> = ResourcePath.default(),
  entity: EntityTarget<T>,
  context: ExecutionContext,
): ResourcePath {
  if (typeof path === "string") {
    return ResourcePath.get(path);
  }

  return typeof path === "function" ? path(entity.entity, context) : path;
}

export function getPath<T>(
  path: string | PathResolver<T> = "/",
  entity: EntityTarget<T>,
  context: ExecutionContext,
): string {
  return typeof path === "function" ? path(entity.entity, context) : path;
}
