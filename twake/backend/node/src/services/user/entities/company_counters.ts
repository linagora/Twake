import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "company_counters";

@Entity(TYPE, {
  primaryKey: [["company_id"], "counter_type"],
  type: TYPE,
})
export default class CompanyCounters {
  @Column("company_id", "timeuuid")
  company_id: string;

  @Column("counter_type", "string")
  counter_type: string;

  @Column("value", "counter")
  value: number;
}

export type CompanyCountersPrimaryKey = Partial<
  Pick<CompanyCounters, "company_id" | "counter_type">
>;

export function getInstance(
  companyCounters: Partial<CompanyCounters> & CompanyCountersPrimaryKey,
): CompanyCounters {
  return merge(new CompanyCounters(), companyCounters);
}
