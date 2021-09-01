import Repository from "../database/services/orm/repository/repository";
import { CounterEntity } from "../../../../utils/counters";

type LastRevised = {
  calls: number;
  period: number;
};

export class CounterProvider<T extends CounterEntity> {
  protected readonly repository: Repository<T>;

  private reviseHandler: (pk: Partial<T>) => Promise<number>;
  private reviseMaxCalls = 0;
  private reviseMaxPeriod = 0;

  private lastRevised = new Map<Partial<T>, LastRevised>();

  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  increase(pk: Partial<T>, value: number): Promise<void> {
    return this.repository.save(this.repository.createEntityFromObject({ value, ...pk }));
  }

  async get(pk: Partial<T>): Promise<number> {
    const counter = await this.repository.findOne(pk);
    const val = counter ? counter.value : 0;
    return this.revise(pk, val);
  }

  reviseCounter(
    handler: (pk: Partial<T>) => Promise<number>,
    maxCalls: number = 10,
    maxPeriod: number = 24 * 60 * 60 * 1000,
  ): void {
    this.reviseHandler = handler;
    this.reviseMaxCalls = maxCalls;
    this.reviseMaxPeriod = maxPeriod;
  }

  private async revise(pk: Partial<T>, currentValue: number): Promise<number> {
    if (!this.reviseHandler) return currentValue;

    const now = new Date().getTime();

    const lastRevised: LastRevised = this.lastRevised.get(pk) || { calls: -1, period: now };

    if (
      lastRevised.calls >= this.reviseMaxCalls ||
      now > lastRevised.period + this.reviseMaxPeriod
    ) {
      const actual = await this.reviseHandler(pk);

      if (actual != currentValue) {
        await this.increase(pk, actual - currentValue);
        currentValue = actual;
      }
      lastRevised.calls = 0;
    } else {
      lastRevised.calls++;
    }

    lastRevised.period = now;
    this.lastRevised.set(pk, lastRevised);
    return currentValue;
  }
}
