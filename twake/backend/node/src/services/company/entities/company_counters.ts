import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import { CounterEntity } from "../../../utils/counter-entity";

export const TYPE = "company_counters";

@Entity(TYPE, {
  primaryKey: [["id"], "counter_type"],
  type: TYPE,
})
export class CompanyCounterEntity implements CounterEntity {
  @Column("id", "timeuuid")
  id: string;

  @Column("counter_type", "string")
  counterType: string;

  @Column("value", "counter")
  value: number;
}
