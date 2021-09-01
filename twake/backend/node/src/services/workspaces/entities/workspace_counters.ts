import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import { CounterEntity } from "../../../utils/counters";

export const TYPE = "workspace_counters";

@Entity(TYPE, {
  primaryKey: [["id"], "counter_type"],
  type: TYPE,
})
export class WorkspaceCounterEntity extends CounterEntity {
  @Column("id", "timeuuid")
  id: string;

  @Column("counter_type", "string")
  counter_type: string;
}

export type WorkspaceCounterPrimaryKey = Pick<WorkspaceCounterEntity, "id" | "counter_type">;
