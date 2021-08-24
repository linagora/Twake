import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import { merge } from "lodash";
import { PhpMessage } from "../../../cli/cmds/migration_cmds/php-message/php-message-entity";
import { CounterEntity } from "../../../utils/counter-entity";

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
