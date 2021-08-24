import { Column } from "../core/platform/services/database/services/orm/decorators";

export class CounterEntity {
  @Column("value", "counter")
  value: number;
}
