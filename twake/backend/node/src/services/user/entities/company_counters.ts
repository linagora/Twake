import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "company_counters";

@Entity(TYPE, {
  primaryKey: [["id"], "counter_type"],
  type: TYPE,
})
export class CompanyCounterEntity {
  @Column("id", "timeuuid")
  id: string;

  @Column("counter_type", "string")
  counter_type: string;

  @Column("value", "counter")
  value: number;
}

export type CompanyCounterPrimaryKey = Pick<CompanyCounterEntity, "id" | "counter_type">;

export enum CompanyCounterType {
  MEMBERS = "members",
}
