import Repository from "../database/services/orm/repository/repository";
import { CounterEntity } from "../../../../utils/counters";
import { logger } from "../../framework";

type LastRevised = {
  calls: number;
  period: number;
};

export class CounterProvider<T extends CounterEntity> {
  private name = "CounterProvider";

  protected readonly repository: Repository<T>;

  private reviseHandler: (pk: Partial<T>) => Promise<number>;
  private reviseMaxCalls = 0;
  private reviseMaxPeriod = 0;

  private lastRevised = new Map<Partial<T>, LastRevised>();

  constructor(repository: Repository<T>) {
    this.repository = repository;
    logger.debug(`${this.name} Created counter provider for ${this.repository.table}`);
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
    logger.debug(`${this.name} Set reviseCounter for ${this.repository.table}`);
    this.reviseHandler = handler;
    this.reviseMaxCalls = maxCalls;
    this.reviseMaxPeriod = maxPeriod;
  }

  private async revise(pk: Partial<T>, currentValue: number): Promise<number> {
    const now = new Date().getTime();
    const lastRevised: LastRevised = this.lastRevised.get(pk) || { calls: -1, period: now };

    if (
      lastRevised.calls >= this.reviseMaxCalls ||
      now > lastRevised.period + this.reviseMaxPeriod
    ) {
      if (!this.reviseHandler) {
        logger.debug(`${this.name} No reviseCounter handler found for ${this.repository.table}`);
        return currentValue;
      }

      logger.debug(`${this.name} Execute reviseCounter handler for ${this.repository.table}`);

      const actual = await this.reviseHandler(pk);

      if (actual != currentValue) {
        await this.increase(pk, actual - currentValue);
        currentValue = actual;
      }
      lastRevised.calls = 0;
      lastRevised.period = now;
    } else {
      lastRevised.calls++;
    }

    this.lastRevised.set(pk, lastRevised);
    return currentValue;
  }
}
