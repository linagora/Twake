import { CounterEntityHolder, CounterType, ICounterEntity } from "../types";
import { Column, Entity } from "../../database/services/orm/decorators";

const TYPE: CounterType = CounterType.WORKSPACE;

@Entity(TYPE, {
  primaryKey: [["id"], "counter_type"],
  type: TYPE,
})
class CounterEntity implements ICounterEntity {
  @Column("id", "timeuuid")
  id: string;

  @Column("counter_type", "string")
  counterType: string;

  @Column("value", "counter")
  value: number;
}

export default new CounterEntityHolder(TYPE, CounterEntity, new CounterEntity());
