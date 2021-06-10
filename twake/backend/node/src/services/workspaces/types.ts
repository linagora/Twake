import { ExecutionContext } from "../../core/platform/framework/api/crud-service";

export interface WorkspaceExecutionContext extends ExecutionContext {
  company_id: string;
}
export type WorkspaceUserRole = "admin" | "member";
