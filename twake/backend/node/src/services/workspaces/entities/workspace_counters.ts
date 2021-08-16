import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "workspace_counters";

@Entity(TYPE, {
  primaryKey: [["workspace_id"], "counter_type"],
  type: TYPE,
})
export default class WorkspaceCounters {
  @Column("workspace_id", "timeuuid")
  workspace_id: string;

  @Column("counter_type", "string")
  counter_type: string;

  @Column("value", "counter")
  value: number;
}

export type WorkspaceCountersPrimaryKey = Partial<
  Pick<WorkspaceCounters, "workspace_id" | "counter_type">
>;

export function getInstance(
  workspaceCounters: Partial<WorkspaceCounters> & WorkspaceCountersPrimaryKey,
): WorkspaceCounters {
  return merge(new WorkspaceCounters(), workspaceCounters);
}
