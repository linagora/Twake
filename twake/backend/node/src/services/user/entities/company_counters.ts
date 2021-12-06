import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import { CounterEntity } from "../../../utils/counters";

export const TYPE = "company_counters";

@Entity(TYPE, {
  primaryKey: [["id"], "counter_type"],
  type: TYPE,
})
export class CompanyCounterEntity extends CounterEntity {
  @Column("id", "timeuuid")
  id: string;

  @Column("counter_type", "string")
  counter_type: string;
}

export type CompanyCounterPrimaryKey = Pick<CompanyCounterEntity, "id" | "counter_type">;

export enum CompanyCounterType {
  MEMBERS = "members",
}
