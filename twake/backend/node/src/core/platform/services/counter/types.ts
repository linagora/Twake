import { EntityTarget } from "../database/services/orm/types";

export enum CounterType {
  WORKSPACE = "workspace_counters",
  COMPANY = "company_counters",
}

export interface ICounterEntity {
  id: string;
  counterType: string;
  value: number;
}

export class CounterEntityHolder {
  constructor(
    readonly TYPE: CounterType,
    readonly entryTarget: EntityTarget<ICounterEntity>,
    readonly entityInstance: ICounterEntity,
  ) {}
}
