import { STATISTICS_GLOBAL_KEY, StatisticsAPI } from "../types";
import StatisticsEntity, {
  getInstance as getStatisticsEntityInstance,
  TYPE as StatisticsEntityType,
} from "../entities/statistics";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import gr from "../../global-resolver";

export class StatisticsServiceImpl implements StatisticsAPI {
  version: "1";
  private repository: Repository<StatisticsEntity>;

  async init(): Promise<this> {
    this.repository = await gr.database.getRepository<StatisticsEntity>(
      StatisticsEntityType,
      StatisticsEntity,
    );
    return this;
  }

  async increase(companyId: string, eventName: string, value: number = 1): Promise<void> {
    const now = new Date();
    const monthId = +(now.getFullYear() + now.getMonth().toString().padStart(2, "0")); // format 202108

    //return Promise.all([
    await this.dbIncrement(STATISTICS_GLOBAL_KEY, eventName, monthId, value);
    await this.dbIncrement(STATISTICS_GLOBAL_KEY, eventName, 0, value);
    await this.dbIncrement(companyId, eventName, monthId, value);
    await this.dbIncrement(companyId, eventName, 0, value);
    //]).then(() => null);
  }

  async get(companyId: string = STATISTICS_GLOBAL_KEY, eventName: string): Promise<number> {
    const res = await this.repository.findOne({
      company_id: companyId,
      event_name: eventName,
      month_id: 0,
    });

    return res?.value || 0;
  }

  private dbIncrement(
    companyId: string,
    eventName: string,
    monthId: number,
    value: number = 1,
  ): Promise<void> {
    const entity = getStatisticsEntityInstance({
      company_id: companyId,
      event_name: eventName,
      month_id: monthId,
    });

    entity.value = value;
    return this.repository.save(entity);
  }
}
