import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { Workspace } from "../types";

export interface WorkspaceExecutionContext extends ExecutionContext {
  workspace: Workspace;
}

export enum ChannelType {
  DIRECT = "direct",
}

export enum ChannelVisibility {
  PRIVATE = "private",
  PUBLIC = "public",
  DIRECT = "direct",
}
