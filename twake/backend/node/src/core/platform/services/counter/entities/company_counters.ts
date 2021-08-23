import { CounterEntityHolder, CounterType, ICounterEntity } from "../types";
import { Column, Entity } from "../../database/services/orm/decorators";

export const TYPE: CounterType = CounterType.COMPANY;

@Entity(TYPE, {
  primaryKey: [["id"], "counter_type"],
  type: TYPE,
})
export class CounterEntity implements ICounterEntity {
  @Column("id", "timeuuid")
  id: string;

  @Column("counter_type", "string")
  counterType: string;

  @Column("value", "counter")
  value: number;
}

export default new CounterEntityHolder(TYPE, CounterEntity, new CounterEntity());
