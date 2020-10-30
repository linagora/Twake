import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { Workspace } from "../types";

export interface WorkspaceExecutionContext extends ExecutionContext {
  workspace: Workspace;
}